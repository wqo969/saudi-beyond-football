import { artSvg, type ArtPattern } from "@/lib/art";
import type { Palette } from "@/lib/engine/palettes";
import { SECTIONS, type SectionKey } from "@/lib/sections";

/** Procedural editorial artwork for a section (original, offline, deterministic). */
export function SectionArt({ section, seed, className = "", variant = "cover", palette, pattern }: { section: SectionKey; seed: string; className?: string; variant?: "cover" | "thumb"; palette?: Palette; pattern?: ArtPattern }) {
  const meta = SECTIONS[section];
  return <Art className={className} seed={seed + section} pattern={pattern ?? meta.pattern} hue={palette?.artHue ?? meta.hue} palette={palette} sun={variant === "cover"} />;
}

export function Art({ seed, pattern, hue, palette, sun = false, className = "", width, height }: { seed: string; pattern: ArtPattern; hue: number; palette?: Palette; sun?: boolean; className?: string; width?: number; height?: number }) {
  const bg: [string, string, string] | undefined = palette ? [palette.deep, mix(palette.deep, "#000000", 0.25), mix(palette.deep, "#000000", 0.5)] : undefined;
  const svg = artSvg({ seed, pattern, hue, bg, accent: palette?.mode === "night" ? palette.accent : undefined, sun, width, height });
  return <div className={`overflow-hidden [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}
