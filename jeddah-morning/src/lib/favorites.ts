/** Device-local favorites (phase 1). Phase 2 can sync these to Supabase per user. */
export interface Favorite {
  issueSlug: string;
  articleId: string;
  title: string;
  section: string;
  savedAt: string;
}

const KEY = "jm:favorites";
const EVENT = "jm:favorites-changed";

export function readFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Favorite[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: Favorite[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export const favKey = (f: Pick<Favorite, "issueSlug" | "articleId">) => `${f.issueSlug}/${f.articleId}`;

export function isFavorite(issueSlug: string, articleId: string): boolean {
  return readFavorites().some((f) => f.issueSlug === issueSlug && f.articleId === articleId);
}

export function toggleFavorite(fav: Omit<Favorite, "savedAt">): boolean {
  const list = readFavorites();
  const exists = list.some((f) => favKey(f) === favKey(fav));
  write(exists ? list.filter((f) => favKey(f) !== favKey(fav)) : [{ ...fav, savedAt: new Date().toISOString() }, ...list]);
  return !exists;
}

export function onFavoritesChange(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
