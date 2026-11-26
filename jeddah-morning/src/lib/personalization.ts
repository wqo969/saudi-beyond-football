/**
 * On-device personalization (no server, no tracking). Scores candidates by explicit interests,
 * favorites, ratings and reading history, then reserves slots for unexplored sections so the
 * reader is never boxed into the same topics.
 */
export interface Candidate {
  issueSlug: string;
  id: string;
  section: string;
}

export interface Signals {
  interests: string[];
  history: { issueSlug: string; articleId: string; section: string }[];
  favorites: { issueSlug: string; articleId: string; section: string }[];
  ratings: { articles: Record<string, 1 | -1> };
}

export type Ranked<T extends Candidate> = T & { score: number; reason: "interest" | "affinity" | "discovery" };

export const DISCOVERY_SHARE = 0.34;

export function sectionAffinity(s: Signals): Record<string, number> {
  const w: Record<string, number> = {};
  const add = (sec: string, v: number) => (w[sec] = (w[sec] ?? 0) + v);
  s.interests.forEach((sec) => add(sec, 3));
  s.favorites.forEach((f) => add(f.section, 2));
  s.history.forEach((h) => add(h.section, 0.5));
  return w;
}

export function rankForYou<T extends Candidate>(cands: T[], s: Signals, limit: number): Ranked<T>[] {
  const aff = sectionAffinity(s);
  const read = new Set(s.history.map((h) => `${h.issueSlug}/${h.articleId}`));
  const fresh = cands.filter((c) => !read.has(`${c.issueSlug}/${c.id}`) && s.ratings.articles[`${c.issueSlug}/${c.id}`] !== -1);
  const disliked = new Set(Object.entries(s.ratings.articles).filter(([, v]) => v === -1).map(([k]) => k));
  const scored = fresh.map((c) => {
    let score = aff[c.section] ?? 0;
    if (disliked.size && [...disliked].some((k) => k.endsWith(`/${c.id}`))) score -= 2;
    return { ...c, score, reason: (s.interests.includes(c.section) ? "interest" : "affinity") as Ranked<T>["reason"] };
  });
  const known = scored.filter((c) => c.score > 0).sort((a, b) => b.score - a.score);
  const unexplored = scored.filter((c) => (aff[c.section] ?? 0) === 0);
  const discoverySlots = Math.max(1, Math.round(limit * DISCOVERY_SHARE));
  const out: Ranked<T>[] = [];
  const usedSections = new Set<string>();
  for (const c of known) {
    if (out.length >= limit - discoverySlots) break;
    out.push(c);
  }
  for (const c of unexplored) {
    if (out.length >= limit) break;
    if (usedSections.has(c.section)) continue;
    usedSections.add(c.section);
    out.push({ ...c, reason: "discovery" });
  }
  for (const c of known) if (out.length < limit && !out.includes(c)) out.push(c);
  return out;
}
