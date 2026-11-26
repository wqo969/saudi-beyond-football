import { hashString, rng } from "./engine/random";

/**
 * Original procedural artwork (SVG). No stock photos, no external requests, no rights issues;
 * deterministic per seed. Used for covers, article art, galleries, wallpapers and gift cards.
 */
export type ArtPattern = "waves" | "grid" | "stripes" | "stars" | "arches" | "dots" | "rings" | "orbits" | "blocks" | "moon" | "dunes" | "mashrabiya";

export const ART_PATTERNS: ArtPattern[] = ["waves", "grid", "stripes", "stars", "arches", "dots", "rings", "orbits", "blocks", "moon", "dunes", "mashrabiya"];

export interface ArtOptions {
  seed: string;
  pattern: ArtPattern;
  hue: number;
  width?: number;
  height?: number;
  /** background gradient stops */
  bg?: [string, string, string];
  accent?: string;
  /** draw the "sun" disc */
  sun?: boolean;
}

const f = (n: number) => n.toFixed(1);

export function artSvg(o: ArtOptions): string {
  const W = o.width ?? 600;
  const H = o.height ?? 800;
  const r = rng(hashString(`${o.seed}|${o.pattern}|${o.hue}`));
  const id = `a${hashString(o.seed + o.pattern + W + H).toString(36)}`;
  const gold = o.accent ?? "#c9aa72";
  const a1 = `hsl(${o.hue} 38% 42%)`;
  const a2 = `hsl(${o.hue} 30% 64%)`;
  const [b0, b1, b2] = o.bg ?? ["#1e3a2c", "#12251b", "#0a150f"];
  const out: string[] = [];
  const S = Math.min(W, H) / 600; // scale factor

  switch (o.pattern) {
    case "waves":
      for (let i = 0; i < 16; i++) {
        const y = H * 0.32 + i * 34 * S;
        const amp = (12 + r() * 22) * S;
        const fr = 1 + r() * 2;
        let d = `M0 ${f(y)}`;
        for (let x = 0; x <= W; x += 16) d += ` L${x} ${f(y + Math.sin((x / W) * Math.PI * 2 * fr + i) * amp)}`;
        out.push(`<path d="${d}" fill="none" stroke="${i % 3 === 0 ? gold : a2}" stroke-opacity="${f(0.6 - i * 0.025)}" stroke-width="${f((i % 3 === 0 ? 2 : 1.2) * S)}"/>`);
      }
      break;
    case "grid": {
      const step = 75 * S;
      for (let x = 0; x <= W; x += step) out.push(`<line x1="${f(x)}" y1="0" x2="${f(x)}" y2="${H}" stroke="${gold}" stroke-opacity=".18"/>`);
      for (let y = 0; y <= H; y += step) out.push(`<line x1="0" y1="${f(y)}" x2="${W}" y2="${f(y)}" stroke="${gold}" stroke-opacity=".18"/>`);
      for (let i = 0; i < 9; i++)
        out.push(`<rect x="${f(Math.floor((r() * W) / step) * step)}" y="${f(Math.floor((r() * H) / step) * step)}" width="${f(step)}" height="${f(step)}" fill="${i % 2 ? a1 : gold}" fill-opacity="${f(0.3 + r() * 0.35)}"/>`);
      break;
    }
    case "stripes":
      for (let i = 0; i < 22; i++) {
        const x = -W * 0.4 + i * 55 * S;
        out.push(`<rect x="${f(x)}" y="${-H * 0.2}" width="${f((i % 4 === 0 ? 18 : 6) * S)}" height="${H * 1.5}" fill="${i % 4 === 0 ? gold : a2}" fill-opacity=".35" transform="rotate(-24 ${W / 2} ${H / 2})"/>`);
      }
      break;
    case "stars": {
      const R = 52 * S;
      const step = 120 * S;
      let k = 0;
      for (let y = step / 2; y < H + step; y += step)
        for (let x = Math.round(y / step) % 2 ? 0 : step / 2; x < W + step; x += step) {
          const pts: string[] = [];
          for (let j = 0; j < 16; j++) {
            const ang = (Math.PI / 8) * j;
            const rr = j % 2 === 0 ? R : R * 0.55;
            pts.push(`${f(x + rr * Math.cos(ang))},${f(y + rr * Math.sin(ang))}`);
          }
          out.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="${k++ % 5 === 0 ? gold : a2}" stroke-opacity=".5" stroke-width="${f(1.4 * S)}"/>`);
        }
      break;
    }
    case "arches":
      for (let i = 0; i < 5; i++) {
        const w = W / 5.4;
        const x = W * 0.06 + i * w * 1.02;
        const top = H * (0.38 + r() * 0.15);
        out.push(`<path d="M${f(x)} ${H} L${f(x)} ${f(top + w * 0.55)} Q${f(x)} ${f(top)} ${f(x + w / 2)} ${f(top - w * 0.22)} Q${f(x + w)} ${f(top)} ${f(x + w)} ${f(top + w * 0.55)} L${f(x + w)} ${H}" fill="${i % 2 ? a1 : "none"}" fill-opacity=".35" stroke="${gold}" stroke-opacity=".6" stroke-width="${f(1.5 * S)}"/>`);
      }
      break;
    case "dots": {
      const step = 34 * S;
      for (let y = step; y < H; y += step)
        for (let x = step * 0.6; x < W; x += step) {
          const rad = r() * 6 * S;
          if (rad > 1.2 * S) out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${r() > 0.8 ? gold : a2}" fill-opacity=".45"/>`);
        }
      break;
    }
    case "rings": {
      const cx = W * (0.3 + r() * 0.4);
      for (let i = 0; i < 14; i++) out.push(`<circle cx="${f(cx)}" cy="${f(H * 0.45)}" r="${f((40 + i * 34) * S)}" fill="none" stroke="${i % 3 === 0 ? gold : a2}" stroke-opacity="${f(0.5 - i * 0.03)}" stroke-width="${f((i % 3 === 0 ? 2 : 1) * S)}"/>`);
      break;
    }
    case "orbits":
      for (let i = 0; i < 9; i++) {
        const rx = (80 + i * 40) * S;
        out.push(`<ellipse cx="${W / 2}" cy="${H / 2}" rx="${f(rx)}" ry="${f(rx * 0.38)}" transform="rotate(${f(-30 + i * 9)} ${W / 2} ${H / 2})" fill="none" stroke="${i % 2 ? a2 : gold}" stroke-opacity=".5" stroke-width="${f(1.3 * S)}"/>`);
        const ang = r() * Math.PI * 2;
        out.push(`<circle cx="${f(W / 2 + Math.cos(ang) * rx * 0.9)}" cy="${f(H / 2 + Math.sin(ang) * rx * 0.3)}" r="${f((4 + r() * 8) * S)}" fill="${gold}"/>`);
      }
      break;
    case "blocks":
      for (let i = 0; i < 7; i++) {
        const w = W * (0.2 + r() * 0.45);
        const h = H * (0.1 + r() * 0.3);
        out.push(`<rect x="${f(r() * (W - w))}" y="${f(r() * (H - h))}" width="${f(w)}" height="${f(h)}" fill="${[a1, gold, a2][i % 3]}" fill-opacity="${f(0.25 + r() * 0.45)}"/>`);
      }
      out.push(`<circle cx="${f(W * (0.2 + r() * 0.6))}" cy="${f(H * (0.2 + r() * 0.5))}" r="${f(W * 0.18)}" fill="none" stroke="${gold}" stroke-width="${f(3 * S)}"/>`);
      break;
    case "moon": {
      const cx = W * 0.68;
      const cy = H * 0.24;
      const R = W * 0.16;
      out.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" fill="${gold}" fill-opacity=".92"/><circle cx="${f(cx - R * 0.42)}" cy="${f(cy - R * 0.18)}" r="${f(R * 0.92)}" fill="${b1}"/>`);
      for (let i = 0; i < 70; i++) out.push(`<circle cx="${f(r() * W)}" cy="${f(r() * H * 0.7)}" r="${f(r() * 1.6 * S + 0.3)}" fill="#fff" fill-opacity="${f(0.25 + r() * 0.6)}"/>`);
      for (let i = 0; i < 5; i++) {
        const y = H * (0.72 + i * 0.05);
        out.push(`<path d="M0 ${f(y)} Q${W / 2} ${f(y - 30 * S)} ${W} ${f(y)}" fill="none" stroke="${a2}" stroke-opacity=".35"/>`);
      }
      break;
    }
    case "dunes":
      for (let i = 0; i < 7; i++) {
        const y = H * (0.45 + i * 0.08);
        const p = r() * W;
        out.push(`<path d="M0 ${H} L0 ${f(y)} Q${f(p)} ${f(y - 90 * S)} ${W} ${f(y + 20 * S)} L${W} ${H} Z" fill="${i % 2 ? a1 : gold}" fill-opacity="${f(0.12 + i * 0.05)}"/>`);
      }
      break;
    case "mashrabiya": {
      const step = 60 * S;
      for (let y = 0; y < H + step; y += step)
        for (let x = 0; x < W + step; x += step) {
          out.push(`<rect x="${f(x - step / 4)}" y="${f(y - step / 4)}" width="${f(step / 2)}" height="${f(step / 2)}" transform="rotate(45 ${f(x)} ${f(y)})" fill="none" stroke="${gold}" stroke-opacity=".35"/>`);
          out.push(`<circle cx="${f(x + step / 2)}" cy="${f(y + step / 2)}" r="${f(4 * S)}" fill="${a2}" fill-opacity=".5"/>`);
        }
      break;
    }
  }

  const sun = o.sun ? `<circle cx="${f(W * 0.78)}" cy="${f(H * 0.17)}" r="${f(46 * S)}" fill="${gold}" fill-opacity=".85"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="${id}g" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${b0}"/><stop offset=".6" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient><radialGradient id="${id}r" cx=".75" cy=".2" r=".7"><stop offset="0" stop-color="${a1}" stop-opacity=".55"/><stop offset="1" stop-color="${a1}" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}g)"/><rect width="${W}" height="${H}" fill="url(#${id}r)"/>${out.join("")}${sun}</svg>`;
}
