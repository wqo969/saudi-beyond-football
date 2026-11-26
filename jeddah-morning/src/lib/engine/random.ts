/** Deterministic randomness: the same issue always gets the same design. */
export type Rng = () => number;

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** mulberry32 */
export function rng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function weightedPick<T>(r: Rng, items: readonly T[], weight: (t: T) => number): T {
  if (items.length === 0) throw new Error("weightedPick: empty pool");
  const ws = items.map((i) => Math.max(0, weight(i)));
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[0];
  let x = r() * total;
  for (let i = 0; i < items.length; i++) {
    x -= ws[i];
    if (x < 0) return items[i];
  }
  return items[items.length - 1];
}
