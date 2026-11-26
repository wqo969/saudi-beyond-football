import { EVENING_IDENTITY, MORNING_IDENTITY, personaById, personaForDate, specialByKey, type Persona, type SpecialEdition } from "../personas";
import { compareIssuesAsc } from "../publishing";
import type { Article, Issue } from "../schema";
import { CLOSING_VARIANTS, CONTENTS_VARIANTS, COVER_LAYOUTS, candidates, layoutById } from "./layouts";
import { PALETTES, paletteById, type Palette } from "./palettes";
import { hashString, rng, weightedPick, type Rng } from "./random";

export type PageKind = "cover" | "contents" | "letter" | "article" | "surprise" | "closing";

export interface PageSpec {
  kind: PageKind;
  layout: string;
  articleId?: string;
  /** for two-page layouts: 0 = art page, 1 = text page */
  part?: number;
  /** sub-variant (0–2) for extra visual variety within a layout */
  variant: number;
}

export interface Fingerprint {
  slug: string;
  edition: Issue["edition"];
  cover: string;
  palette: string;
  contents: string;
  closing: string;
  /** article layout sequence */
  sequence: string[];
  /** section → layout used */
  sectionLayouts: Record<string, string>;
  /** article order by section */
  sectionOrder: string[];
}

export interface IssuePlan {
  slug: string;
  mode: "day" | "night";
  palette: Palette;
  coverLayout: string;
  contentsVariant: (typeof CONTENTS_VARIANTS)[number];
  closingVariant: (typeof CLOSING_VARIANTS)[number];
  persona: Persona | null;
  special: SpecialEdition | null;
  identity: { latin: string; name: string; tagline: string };
  order: string[];
  pages: PageSpec[];
  fingerprint: Fingerprint;
  frozen: boolean;
  warnings: string[];
}

/** Layouts that act as a section's recognisable signature: repetition is softened, not punished. */
const SIGNATURE = new Set(["record", "ticket", "weather-card", "interactive"]);
const MAX_SPREADS = 2;
const ATTEMPTS = 6;

function identityFor(issue: Issue, persona: Persona | null, special: SpecialEdition | null) {
  if (special) return { latin: special.latin, name: special.name, tagline: MORNING_IDENTITY.tagline };
  if (issue.edition === "evening") return EVENING_IDENTITY;
  return { latin: persona?.latin ?? MORNING_IDENTITY.latin, name: persona?.name ?? MORNING_IDENTITY.name, tagline: persona?.tagline ?? MORNING_IDENTITY.tagline };
}

function pickPalette(issue: Issue, mode: "day" | "night", moods: string[], history: Fingerprint[], r: Rng): Palette {
  const forced = paletteById(issue.design.palette);
  if (forced) return forced;
  const sameMode = history.filter((h) => (paletteById(h.palette)?.mode ?? "day") === mode);
  const recent = new Set(sameMode.slice(0, 3).map((h) => h.palette));
  const lastAny = history[0]?.palette;
  let pool = PALETTES.filter((p) => p.mode === mode && !recent.has(p.id) && p.id !== lastAny);
  if (pool.length === 0) pool = PALETTES.filter((p) => p.mode === mode && p.id !== lastAny);
  return weightedPick(r, pool, (p) => (p.moods.some((m) => moods.includes(m)) ? 3 : 1));
}

function pickCover(issue: Issue, mode: "day" | "night", preferred: string[], history: Fingerprint[], r: Rng): string {
  if (issue.design.coverLayout && layoutById(issue.design.coverLayout)?.kind === "cover") return issue.design.coverLayout;
  const last = history[0]?.cover;
  const lastSameEdition = history.find((h) => h.edition === issue.edition)?.cover;
  const pool = COVER_LAYOUTS.filter((c) => (mode === "night" ? c.mode !== undefined || ["cover-type", "cover-abstract"].includes(c.id) : c.mode !== "night")).filter(
    (c) => c.id !== last && c.id !== lastSameEdition,
  );
  const safePool = pool.length ? pool : COVER_LAYOUTS.filter((c) => c.id !== last);
  return weightedPick(r, safePool, (c) => (preferred.includes(c.id) ? 3 : c.id === "cover-night" ? 6 : 1)).id;
}

function orderArticles(issue: Issue, persona: Persona | null, r: Rng): Article[] {
  const arts = [...issue.articles];
  if (issue.design.lockOrder) return arts;
  const cover = arts.find((a) => a.id === issue.coverStory);
  const puzzle = arts.filter((a) => a.section === "puzzle");
  const rest = arts.filter((a) => a !== cover && a.section !== "puzzle");
  const priority = persona?.priority ?? [];
  const pri: Article[] = [];
  for (const key of priority) for (const a of rest) if (a.section === key && !pri.includes(a)) pri.push(a);
  const others = rest.filter((a) => !pri.includes(a));
  // seeded shuffle of the remaining articles
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const ordered = [...(cover ? [cover] : []), ...pri, ...others];
  // Utility rule: the weather (or "tomorrow") page is never buried — keep it within the first four.
  const wi = ordered.findIndex((a) => a.section === "weather" || a.section === "tomorrow");
  if (wi > 3) {
    const [w] = ordered.splice(wi, 1);
    ordered.splice(1 + Math.floor(r() * 3), 0, w);
  }
  return [...ordered, ...puzzle];
}

function planOnce(issue: Issue, history: Fingerprint[], seed: string): Omit<IssuePlan, "frozen"> {
  const r = rng(hashString(seed));
  const special = issue.edition === "special" ? (specialByKey(issue.special) ?? null) : null;
  const persona = special ? null : issue.edition === "evening" ? null : (personaById(issue.persona) ?? personaForDate(issue.date));
  const mode = issue.edition === "evening" ? "night" : "day";
  const moods = special?.moods ?? persona?.moods ?? ["night"];
  const palette = pickPalette(issue, mode, moods, history, r);
  const coverLayout = pickCover(issue, mode, persona?.covers ?? [], history, r);
  const lastContents = history[0]?.contents;
  const lastClosing = history[0]?.closing;
  const contentsVariant = weightedPick(r, CONTENTS_VARIANTS.filter((v) => v !== lastContents), () => 1);
  const closingVariant = weightedPick(r, CLOSING_VARIANTS.filter((v) => v !== lastClosing), () => 1);
  const warnings: string[] = [];

  const ordered = orderArticles(issue, persona, r);
  const last = history[0];
  const recentSectionLayouts = history.slice(1, 4).map((h) => h.sectionLayouts);
  const recentlyUsed = new Set(history.slice(0, 3).flatMap((h) => h.sequence));
  const used = new Map<string, number>();
  let prev = "";
  const sequence: string[] = [];
  const sectionLayouts: Record<string, string> = {};
  const articlePages: PageSpec[] = [];

  for (const a of ordered) {
    let chosen: string | undefined;
    const cands = candidates(a);
    if (a.layout) {
      if (cands.some((c) => c.layout.id === a.layout)) chosen = a.layout;
      else warnings.push(`«${a.title}»: القالب المطلوب ${a.layout} لا يناسب المحتوى، فاختار المحرك بديلًا`);
    }
    if (!chosen) {
      const scored = cands.map(({ layout, score }) => {
        let s = score;
        const count = used.get(layout.id) ?? 0;
        if (layout.id === "spread" && count >= MAX_SPREADS) s = 0;
        if (layout.id === prev) s *= 0.1;
        s *= Math.pow(0.35, count);
        const sig = SIGNATURE.has(layout.id);
        if (last?.sectionLayouts[a.section] === layout.id) s *= sig ? 0.7 : 0.25;
        if (recentSectionLayouts.some((m) => m[a.section] === layout.id)) s *= sig ? 0.9 : 0.6;
        // Freshness: layouts absent from the last three issues get a boost, so the library keeps rotating.
        if (history.length && !recentlyUsed.has(layout.id)) s *= 1.6;
        return { layout, s };
      });
      const viable = scored.filter((x) => x.s > 0);
      chosen = viable.length ? weightedPick(r, viable, (x) => x.s).layout.id : "two-column";
    }
    const def = layoutById(chosen)!;
    used.set(chosen, (used.get(chosen) ?? 0) + 1);
    prev = chosen;
    sequence.push(chosen);
    sectionLayouts[a.section] = chosen;
    const variant = Math.floor(r() * 3);
    if (def.pages === 2) {
      articlePages.push({ kind: "article", layout: chosen, articleId: a.id, part: 0, variant });
      articlePages.push({ kind: "article", layout: chosen, articleId: a.id, part: 1, variant });
    } else articlePages.push({ kind: "article", layout: chosen, articleId: a.id, variant });
  }

  const pages: PageSpec[] = [{ kind: "cover", layout: coverLayout, variant: Math.floor(r() * 3) }];
  pages.push({ kind: "contents", layout: "contents", variant: CONTENTS_VARIANTS.indexOf(contentsVariant) });
  if (issue.editorsLetter) pages.push({ kind: "letter", layout: "letter", variant: Math.floor(r() * 3) });
  // The surprise lands somewhere in the second half of the issue — never at a fixed spot.
  const surpriseAt = issue.surprise ? Math.floor(articlePages.length * (0.5 + r() * 0.35)) : -1;
  articlePages.forEach((p, i) => {
    if (i === surpriseAt && p.part !== 1) pages.push({ kind: "surprise", layout: "surprise", variant: Math.floor(r() * 3) });
    pages.push(p);
  });
  if (issue.surprise && !pages.some((p) => p.kind === "surprise")) pages.push({ kind: "surprise", layout: "surprise", variant: 0 });
  pages.push({ kind: "closing", layout: "closing-art", variant: CLOSING_VARIANTS.indexOf(closingVariant) });

  return {
    slug: issue.slug,
    mode,
    palette,
    coverLayout,
    contentsVariant,
    closingVariant,
    persona,
    special,
    identity: identityFor(issue, persona, special),
    order: ordered.map((a) => a.id),
    pages,
    fingerprint: { slug: issue.slug, edition: issue.edition, cover: coverLayout, palette: palette.id, contents: contentsVariant, closing: closingVariant, sequence, sectionLayouts, sectionOrder: ordered.map((a) => a.section) },
    warnings,
  };
}

function fromFrozen(issue: Issue): IssuePlan | null {
  const f = issue.design.frozen;
  if (!f) return null;
  const palette = paletteById(f.palette);
  if (!palette) return null;
  const special = issue.edition === "special" ? (specialByKey(issue.special) ?? null) : null;
  const persona = special || issue.edition === "evening" ? null : (personaById(issue.persona) ?? personaForDate(issue.date));
  const byId = new Map(issue.articles.map((a) => [a.id, a]));
  const pages: PageSpec[] = f.pages.filter((p) => !p.articleId || byId.has(p.articleId)).map((p) => ({ ...p, kind: kindOf(p.layout), variant: 0 }));
  const seq = pages.filter((p) => p.kind === "article" && p.part !== 1).map((p) => p.layout);
  const order = pages.filter((p) => p.articleId && p.part !== 1).map((p) => p.articleId!);
  const sectionLayouts: Record<string, string> = {};
  pages.forEach((p) => p.articleId && (sectionLayouts[byId.get(p.articleId)!.section] = p.layout));
  return {
    slug: issue.slug, mode: palette.mode, palette, coverLayout: f.coverLayout,
    contentsVariant: f.contentsVariant as IssuePlan["contentsVariant"], closingVariant: f.closingVariant as IssuePlan["closingVariant"],
    persona, special, identity: identityFor(issue, persona, special), order, pages,
    fingerprint: { slug: issue.slug, edition: issue.edition, cover: f.coverLayout, palette: f.palette, contents: f.contentsVariant, closing: f.closingVariant, sequence: seq, sectionLayouts, sectionOrder: order.map((id) => byId.get(id)!.section) },
    frozen: true, warnings: [],
  };
}

function kindOf(layout: string): PageKind {
  if (layout.startsWith("cover")) return "cover";
  if (layout === "contents" || layout === "letter" || layout === "surprise") return layout;
  if (layout === "closing-art") return "closing";
  return "article";
}

/** Plan an issue given the fingerprints of earlier issues (most recent first). Picks the most novel of several attempts. */
export function planIssue(issue: Issue, history: Fingerprint[]): IssuePlan {
  const frozen = fromFrozen(issue);
  if (frozen) return frozen;
  const base = issue.design.seed ?? issue.slug;
  let best: Omit<IssuePlan, "frozen"> | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < ATTEMPTS; i++) {
    const plan = planOnce(issue, history, `${base}#${i}`);
    const score = noveltyReport(plan.fingerprint, history).score;
    if (score > bestScore) {
      best = plan;
      bestScore = score;
    }
    if (score >= 90) break;
  }
  return { ...best!, frozen: false };
}

/** Plan every issue in chronological order so each one is compared with what came before it. */
export function planAll(issues: Issue[]): Map<string, IssuePlan> {
  const out = new Map<string, IssuePlan>();
  const history: Fingerprint[] = [];
  for (const issue of [...issues].sort(compareIssuesAsc)) {
    const plan = planIssue(issue, history);
    out.set(issue.slug, plan);
    history.unshift(plan.fingerprint);
  }
  return out;
}

// ---------- Anti-repetition: design novelty ----------

function bigrams(seq: string[]): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < seq.length - 1; i++) s.add(`${seq[i]}>${seq[i + 1]}`);
  return s;
}

export function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export interface NoveltyCheck {
  label: string;
  ok: boolean;
  detail: string;
}

export interface NoveltyReport {
  score: number;
  comparedWith: string[];
  checks: NoveltyCheck[];
}

export function noveltyReport(fp: Fingerprint, history: Fingerprint[]): NoveltyReport {
  const last = history[0];
  const window = history.slice(0, 3);
  if (!last) return { score: 100, comparedWith: [], checks: [{ label: "أول عدد", ok: true, detail: "لا أعداد سابقة للمقارنة" }] };
  const checks: NoveltyCheck[] = [];
  let score = 100;

  const coverSame = fp.cover === last.cover;
  checks.push({ label: "الغلاف", ok: !coverSame, detail: coverSame ? `نفس قالب غلاف ${last.slug}` : `مختلف عن ${last.slug}` });
  if (coverSame) score -= 25;

  const palSame = fp.palette === last.palette;
  checks.push({ label: "لوحة الألوان", ok: !palSame, detail: palSame ? "نفس لوحة العدد السابق" : "لوحة جديدة" });
  if (palSame) score -= 20;

  const maxSeq = Math.max(0, ...window.map((h) => jaccard(bigrams(fp.sequence), bigrams(h.sequence))));
  checks.push({ label: "توزيع الصفحات", ok: maxSeq < 0.35, detail: `أعلى تشابه في تتابع القوالب: ${Math.round(maxSeq * 100)}٪` });
  score -= Math.round(maxSeq * 30);

  const repeats = Object.entries(fp.sectionLayouts).filter(([sec, l]) => last.sectionLayouts[sec] === l && !SIGNATURE.has(l));
  checks.push({ label: "قوالب الأقسام", ok: repeats.length <= 2, detail: repeats.length ? `${repeats.length} أقسام بنفس قالب العدد السابق` : "كل الأقسام بقوالب مختلفة" });
  score -= repeats.length * 3;

  const orderSame = fp.sectionOrder.slice(0, 5).join() === last.sectionOrder.slice(0, 5).join();
  checks.push({ label: "ترتيب الأقسام", ok: !orderSame, detail: orderSame ? "أول خمسة أقسام بنفس الترتيب" : "ترتيب جديد" });
  if (orderSame) score -= 10;

  const contentsSame = fp.contents === last.contents && fp.closing === last.closing;
  checks.push({ label: "الفهرس والخاتمة", ok: !contentsSame, detail: contentsSame ? "نفس شكلي الفهرس والخاتمة" : "شكل مختلف" });
  if (contentsSame) score -= 5;

  return { score: Math.max(0, Math.min(100, score)), comparedWith: window.map((h) => h.slug), checks };
}

export function articleById(issue: Issue, id: string | undefined): Article | undefined {
  return issue.articles.find((a) => a.id === id);
}

/** First licensed editorial image of an article, if any (used as hero instead of generated art). */
export function heroImage(a: Article | undefined) {
  return a?.body.find((b): b is Extract<Article["body"][number], { type: "image" }> => b.type === "image");
}
