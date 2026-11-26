/**
 * Secondary palettes. The base identity (forest / ivory / gold) never changes;
 * each issue gets one secondary palette for accents, tints and art.
 * Every palette is contrast-checked in tests (WCAG AA for body text and accent labels).
 */
export interface Palette {
  id: string;
  name: string;
  mode: "day" | "night";
  moods: string[];
  paper: string;
  paper2: string;
  ink: string;
  muted: string;
  accent: string;
  onAccent: string;
  deep: string;
  onDeep: string;
  artHue: number;
}

export const PALETTES: Palette[] = [
  { id: "ivory-forest", name: "عاجي وغابي", mode: "day", moods: ["calm", "soft"], paper: "#f5efe0", paper2: "#ece3cc", ink: "#18261e", muted: "#5b6659", accent: "#7d5f2c", onAccent: "#fffaf0", deep: "#1e3a2c", onDeep: "#f5efe0", artHue: 150 },
  { id: "sand-terracotta", name: "رمل وطين", mode: "day", moods: ["warm"], paper: "#f6ede2", paper2: "#ecdcc8", ink: "#2a1d16", muted: "#6a564a", accent: "#9a4228", onAccent: "#fff8f1", deep: "#4a2418", onDeep: "#f6ede2", artHue: 18 },
  { id: "sea-salt", name: "ملح البحر", mode: "day", moods: ["fresh", "cool"], paper: "#eef3f1", paper2: "#dde8e5", ink: "#14262a", muted: "#4f6366", accent: "#1b6370", onAccent: "#f2fbfc", deep: "#0f3a44", onDeep: "#eef3f1", artHue: 190 },
  { id: "rose-dust", name: "غبار الورد", mode: "day", moods: ["soft", "warm"], paper: "#f7eeec", paper2: "#eedcd8", ink: "#2b1c1e", muted: "#6c5658", accent: "#933950", onAccent: "#fff6f8", deep: "#4b1f2b", onDeep: "#f7eeec", artHue: 340 },
  { id: "saffron-ink", name: "زعفران وحبر", mode: "day", moods: ["bold", "warm"], paper: "#f8f1dd", paper2: "#efe2bd", ink: "#1d1b14", muted: "#5a5541", accent: "#7c5600", onAccent: "#fffaea", deep: "#1d1b14", onDeep: "#f8f1dd", artHue: 42 },
  { id: "olive-paper", name: "زيتون وورق", mode: "day", moods: ["calm", "fresh"], paper: "#f3f1e4", paper2: "#e4e2cc", ink: "#1f2414", muted: "#565c44", accent: "#52601b", onAccent: "#fbfdf0", deep: "#2c3317", onDeep: "#f3f1e4", artHue: 80 },
  { id: "lavender-mist", name: "ضباب الخزامى", mode: "day", moods: ["soft", "cool"], paper: "#f2f0f6", paper2: "#e2deeb", ink: "#1e1a2a", muted: "#5b5669", accent: "#57438a", onAccent: "#f8f5ff", deep: "#2a2145", onDeep: "#f2f0f6", artHue: 265 },
  { id: "ink-red", name: "حبر وأحمر", mode: "day", moods: ["bold"], paper: "#f4f1ea", paper2: "#e6e1d5", ink: "#121212", muted: "#565249", accent: "#a8241d", onAccent: "#fff7f5", deep: "#121212", onDeep: "#f4f1ea", artHue: 4 },
  { id: "salmon-press", name: "ورق الصحافة", mode: "day", moods: ["bold", "calm"], paper: "#fbeee3", paper2: "#f2dccb", ink: "#22191a", muted: "#5f504f", accent: "#0d5863", onAccent: "#f1fbfc", deep: "#262a33", onDeep: "#fbeee3", artHue: 200 },
  { id: "dawn-violet", name: "بنفسج الفجر", mode: "day", moods: ["warm", "calm"], paper: "#f5ece0", paper2: "#e9d9c4", ink: "#25201c", muted: "#62584d", accent: "#6f4483", onAccent: "#fbf5ff", deep: "#33263d", onDeep: "#f5ece0", artHue: 290 },
  // After Dark (evening) palettes
  { id: "midnight-gold", name: "منتصف الليل والذهب", mode: "night", moods: ["night"], paper: "#0d1512", paper2: "#15211b", ink: "#ece4cf", muted: "#9aa597", accent: "#d4b373", onAccent: "#15110a", deep: "#050a08", onDeep: "#ece4cf", artHue: 45 },
  { id: "velvet-plum", name: "قطيفة البرقوق", mode: "night", moods: ["night"], paper: "#151019", paper2: "#1f1825", ink: "#efe6f0", muted: "#a89bab", accent: "#e0a6c4", onAccent: "#1b0f16", deep: "#0a070c", onDeep: "#efe6f0", artHue: 320 },
  { id: "harbor-lights", name: "أضواء الميناء", mode: "night", moods: ["night"], paper: "#0b1418", paper2: "#132027", ink: "#e5eef0", muted: "#93a5aa", accent: "#7fd1d9", onAccent: "#061114", deep: "#04090b", onDeep: "#e5eef0", artHue: 190 },
  { id: "ember", name: "جمر", mode: "night", moods: ["night"], paper: "#16100d", paper2: "#221812", ink: "#f2e7dc", muted: "#ab9a8c", accent: "#f0a35e", onAccent: "#1a0e05", deep: "#0a0705", onDeep: "#f2e7dc", artHue: 25 },
  { id: "forest-noir", name: "الغابة ليلًا", mode: "night", moods: ["night"], paper: "#0e1914", paper2: "#16241c", ink: "#e9e2cc", muted: "#98a394", accent: "#9fc79a", onAccent: "#0b150d", deep: "#050c08", onDeep: "#e9e2cc", artHue: 120 },
];

export function paletteById(id: string | undefined): Palette | undefined {
  return PALETTES.find((p) => p.id === id);
}

/** CSS variables that re-theme everything inside the issue container (Tailwind tokens read these). */
export function paletteVars(p: Palette): Record<string, string> {
  return {
    "--paper": p.paper,
    "--paper-2": p.paper2,
    "--paper-3": p.paper2,
    "--ink": p.ink,
    "--ink-soft": p.ink,
    "--muted": p.muted,
    "--gold": p.accent,
    "--gold-soft": p.accent,
    "--forest-soft": p.accent,
    "--accent": p.accent,
    // accent tuned for text on the deep (dark) tone — covers, night blocks
    "--accent-light": p.mode === "night" ? p.accent : mixHex(p.accent, "#ffffff", 0.55),
    "--on-accent": p.onAccent,
    "--deep": p.deep,
    "--on-deep": p.onDeep,
    "--rule": `color-mix(in srgb, ${p.ink} 18%, transparent)`,
  };
}

/** WCAG contrast ratio between two #rrggbb colors. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

/** Dark-mode adaptation of a day palette (night palettes are already dark). */
export function darkAdapt(p: Palette): Palette {
  if (p.mode === "night") return p;
  return {
    ...p,
    paper: mixHex(p.deep, "#000000", 0.55),
    paper2: mixHex(p.deep, "#000000", 0.35),
    ink: p.onDeep,
    muted: mixHex(p.onDeep, mixHex(p.deep, "#000000", 0.55), 0.38),
    accent: mixHex(p.accent, "#ffffff", 0.45),
    onAccent: mixHex(p.deep, "#000000", 0.6),
  };
}

/** Scoped CSS for an issue palette, including its dark-mode adaptation. */
export function paletteCss(p: Palette): string {
  const decl = (x: Palette) => Object.entries(paletteVars(x)).map(([k, v]) => `${k}:${v}`).join(";");
  return `.jm-p-${p.id}{${decl(p)};color:var(--ink);background:var(--paper)}.dark .jm-p-${p.id}{${decl(darkAdapt(p))}}`;
}
