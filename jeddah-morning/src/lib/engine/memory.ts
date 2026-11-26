import { compareIssuesAsc } from "../publishing";
import type { Issue } from "../schema";
import { blockText, normalizeArabic } from "../search";
import { SECTIONS } from "../sections";

/**
 * Editorial memory & anti-repetition (content side).
 * Built from every stored issue; flags exact repeats of recommendations (songs, films, puzzles…)
 * and near-duplicate texts. Continuing stories (`followUp`) and service templates are exempt.
 */
export const MEMORY_WINDOW_DAYS = 90;
const SIMILARITY_THRESHOLD = 0.55;

export interface MemoryEntry {
  issueSlug: string;
  date: string;
  articleId: string;
  kind: string;
  key: string;
}

export interface DuplicateFinding {
  type: "memory-key" | "title" | "similar-text";
  articleId: string;
  detail: string;
  previous: { issueSlug: string; articleId: string };
  similarity?: number;
}

export function buildMemory(issues: Issue[]): MemoryEntry[] {
  const out: MemoryEntry[] = [];
  for (const issue of issues)
    for (const a of issue.articles) {
      for (const m of a.memory) out.push({ issueSlug: issue.slug, date: issue.date, articleId: a.id, kind: m.kind, key: normalizeArabic(m.key) });
      out.push({ issueSlug: issue.slug, date: issue.date, articleId: a.id, kind: "cover-story", key: issue.coverStory === a.id ? normalizeArabic(a.title) : "" });
    }
  return out.filter((e) => e.key);
}

function trigrams(text: string): Set<string> {
  const t = normalizeArabic(text).replace(/\s+/g, " ");
  const s = new Set<string>();
  for (let i = 0; i < t.length - 2; i++) s.add(t.slice(i, i + 3));
  return s;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

const daysBetween = (a: string, b: string) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;

/** Compare one issue against all EARLIER issues. */
export function findDuplicates(issue: Issue, all: Issue[]): DuplicateFinding[] {
  const earlier = all.filter((i) => i.slug !== issue.slug && compareIssuesAsc(i, issue) < 0);
  const findings: DuplicateFinding[] = [];
  const memory = buildMemory(earlier).filter((e) => daysBetween(e.date, issue.date) <= MEMORY_WINDOW_DAYS);
  const prevTexts = earlier.flatMap((i) =>
    i.articles.filter((a) => a.kind !== "template").map((a) => ({ issueSlug: i.slug, a, grams: trigrams([a.title, a.dek ?? "", ...a.body.map(blockText)].join(" ")) })),
  );

  for (const a of issue.articles) {
    if (a.followUp) continue;
    for (const m of a.memory) {
      const hit = memory.find((e) => e.kind === m.kind && e.key === normalizeArabic(m.key));
      if (hit) findings.push({ type: "memory-key", articleId: a.id, detail: `تكرار ${m.kind}: «${m.key}»`, previous: { issueSlug: hit.issueSlug, articleId: hit.articleId } });
    }
    if (a.kind === "template") continue;
    const nt = normalizeArabic(a.title);
    // Recurring section titles (e.g. «لغز اليوم») are a format, not a repeat.
    const generic = nt === normalizeArabic(SECTIONS[a.section].name);
    const sameTitle = generic ? undefined : prevTexts.find((p) => normalizeArabic(p.a.title) === nt);
    if (sameTitle) findings.push({ type: "title", articleId: a.id, detail: `عنوان مطابق لعدد سابق`, previous: { issueSlug: sameTitle.issueSlug, articleId: sameTitle.a.id } });
    const grams = trigrams([a.title, a.dek ?? "", ...a.body.map(blockText)].join(" "));
    let best: { p: (typeof prevTexts)[number]; s: number } | null = null;
    for (const p of prevTexts) {
      if (p.a.section !== a.section) continue;
      const s = jaccard(grams, p.grams);
      if (!best || s > best.s) best = { p, s };
    }
    if (best && best.s >= SIMILARITY_THRESHOLD)
      findings.push({ type: "similar-text", articleId: a.id, detail: `نص مشابه بنسبة ${Math.round(best.s * 100)}٪`, previous: { issueSlug: best.p.issueSlug, articleId: best.p.a.id }, similarity: best.s });
  }
  return findings;
}
