/**
 * Device-local personal library (phase P2/P6 local-first): collections, reading history,
 * ratings, interests and reading preferences. Nothing leaves the device. Every key is
 * prefixed `jm:` and can be wiped from the profile page.
 */
export interface ItemRef {
  issueSlug: string;
  articleId: string;
  title: string;
  section: string;
}

export interface Collection {
  id: string;
  name: string;
  items: (ItemRef & { addedAt: string })[];
}

export interface HistoryEntry extends ItemRef {
  at: string;
}

export interface Ratings {
  issues: Record<string, number>;
  articles: Record<string, 1 | -1>;
}

export interface Profile {
  interests: string[];
  personalization: boolean;
  readingLength: "short" | "medium" | "long";
  displayName: string;
}

export interface ReaderPrefs {
  mode: "pages" | "scroll";
  effect: "flip" | "slide" | "none";
  scale: number;
  splash: boolean;
}

export const DEFAULT_PROFILE: Profile = { interests: [], personalization: true, readingLength: "medium", displayName: "" };
export const DEFAULT_PREFS: ReaderPrefs = { mode: "pages", effect: "flip", scale: 1, splash: true };

const EVENT = "jm:library-changed";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}
function readArr<T>(key: string): T[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function onLibraryChange(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

// ---- collections ----
export const readCollections = () => readArr<Collection>("jm:collections");
export function createCollection(name: string): Collection {
  const c: Collection = { id: `c${Date.now().toString(36)}`, name: name.trim() || "مجموعة", items: [] };
  write("jm:collections", [...readCollections(), c]);
  return c;
}
export function addToCollection(id: string, item: ItemRef) {
  write(
    "jm:collections",
    readCollections().map((c) => (c.id === id && !c.items.some((i) => i.issueSlug === item.issueSlug && i.articleId === item.articleId) ? { ...c, items: [{ ...item, addedAt: new Date().toISOString() }, ...c.items] } : c)),
  );
}
export function removeFromCollection(id: string, item: Pick<ItemRef, "issueSlug" | "articleId">) {
  write("jm:collections", readCollections().map((c) => (c.id === id ? { ...c, items: c.items.filter((i) => !(i.issueSlug === item.issueSlug && i.articleId === item.articleId)) } : c)));
}
export function deleteCollection(id: string) {
  write("jm:collections", readCollections().filter((c) => c.id !== id));
}

// ---- history ----
export const readHistory = () => readArr<HistoryEntry>("jm:history");
export function recordRead(item: ItemRef) {
  const list = readHistory().filter((h) => !(h.issueSlug === item.issueSlug && h.articleId === item.articleId));
  write("jm:history", [{ ...item, at: new Date().toISOString() }, ...list].slice(0, 300));
}
export const clearHistory = () => write("jm:history", []);

// ---- ratings ----
export const readRatings = () => read<Ratings>("jm:ratings", { issues: {}, articles: {} });
export function rateIssue(slug: string, stars: number) {
  const r = readRatings();
  write("jm:ratings", { ...r, issues: { ...r.issues, [slug]: stars } });
}
export function rateArticle(key: string, v: 1 | -1 | 0) {
  const r = readRatings();
  const articles = { ...r.articles };
  if (v === 0) delete articles[key];
  else articles[key] = v;
  write("jm:ratings", { ...r, articles });
}

// ---- profile & prefs ----
export const readProfile = () => read<Profile>("jm:profile", DEFAULT_PROFILE);
export const writeProfile = (p: Profile) => write("jm:profile", p);
export const readPrefs = () => read<ReaderPrefs>("jm:prefs", DEFAULT_PREFS);
export const writePrefs = (p: ReaderPrefs) => write("jm:prefs", p);

/** Wipe every personal datum on this device (favorites, collections, history, ratings, profile, positions). */
export function wipePersonalData() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("jm:") && k !== "jm:theme")
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
  window.dispatchEvent(new Event("jm:favorites-changed"));
}
