import { SECTIONS, type SectionKey } from "@/lib/sections";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Procedural editorial artwork (SVG) per section — no external images, works offline,
 * deterministic per `seed` so an article always gets the same art.
 */
export function SectionArt({
  section,
  seed,
  className = "",
  variant = "cover",
}: {
  section: SectionKey;
  seed: string;
  className?: string;
  variant?: "cover" | "thumb";
}) {
  const meta = SECTIONS[section];
  const rand = rng(hash(seed + section));
  const id = `a${hash(seed + section + variant).toString(36)}`;
  const W = 600;
  const H = 800;
  const accent = `hsl(${meta.hue} 38% 42%)`;
  const accentSoft = `hsl(${meta.hue} 30% 62%)`;
  const gold = "#c9aa72";

  const shapes: React.ReactNode[] = [];
  switch (meta.pattern) {
    case "waves":
      for (let i = 0; i < 14; i++) {
        const y = 260 + i * 38;
        const a = 14 + rand() * 22;
        const f = 1 + rand() * 2;
        let d = `M0 ${y}`;
        for (let x = 0; x <= W; x += 20) d += ` L${x} ${(y + Math.sin((x / W) * Math.PI * 2 * f + i) * a).toFixed(1)}`;
        shapes.push(<path key={i} d={d} fill="none" stroke={i % 3 === 0 ? gold : accentSoft} strokeOpacity={0.55 - i * 0.025} strokeWidth={i % 3 === 0 ? 2 : 1.2} />);
      }
      break;
    case "grid":
      for (let i = 0; i < 9; i++) shapes.push(<line key={`v${i}`} x1={i * 75} y1={0} x2={i * 75} y2={H} stroke={gold} strokeOpacity={0.18} />);
      for (let i = 0; i < 12; i++) shapes.push(<line key={`h${i}`} x1={0} y1={i * 75} x2={W} y2={i * 75} stroke={gold} strokeOpacity={0.18} />);
      for (let i = 0; i < 7; i++) {
        const x = Math.floor(rand() * 8) * 75;
        const y = Math.floor(rand() * 10) * 75;
        shapes.push(<rect key={`r${i}`} x={x} y={y} width={75} height={75} fill={i % 2 ? accent : gold} fillOpacity={0.35 + rand() * 0.3} />);
      }
      break;
    case "stripes":
      for (let i = 0; i < 18; i++) {
        const x = -200 + i * 55;
        shapes.push(<rect key={i} x={x} y={-100} width={i % 4 === 0 ? 18 : 6} height={H + 300} fill={i % 4 === 0 ? gold : accentSoft} fillOpacity={0.35} transform={`rotate(-24 ${W / 2} ${H / 2})`} />);
      }
      break;
    case "stars": {
      // eight-point star tessellation, a nod to Hijazi geometric ornament
      const star = (cx: number, cy: number, r: number, k: number) => {
        const pts: string[] = [];
        for (let j = 0; j < 16; j++) {
          const ang = (Math.PI / 8) * j;
          const rr = j % 2 === 0 ? r : r * 0.55;
          pts.push(`${(cx + rr * Math.cos(ang)).toFixed(1)},${(cy + rr * Math.sin(ang)).toFixed(1)}`);
        }
        return <polygon key={k} points={pts.join(" ")} fill="none" stroke={k % 5 === 0 ? gold : accentSoft} strokeOpacity={0.5} strokeWidth={1.4} />;
      };
      let k = 0;
      for (let y = 60; y < H; y += 120) for (let x = (y / 120) % 2 ? 0 : 60; x < W + 60; x += 120) shapes.push(star(x, y, 52, k++));
      break;
    }
    case "arches":
      for (let i = 0; i < 5; i++) {
        const x = 40 + i * 110;
        const top = 300 + rand() * 120;
        shapes.push(
          <path key={i} d={`M${x} ${H} L${x} ${top + 50} Q${x} ${top} ${x + 45} ${top - 20} Q${x + 90} ${top} ${x + 90} ${top + 50} L${x + 90} ${H}`} fill={i % 2 ? accent : "none"} fillOpacity={0.35} stroke={gold} strokeOpacity={0.6} strokeWidth={1.5} />,
        );
      }
      break;
    case "dots":
      for (let y = 30; y < H; y += 34) for (let x = 20; x < W; x += 34) {
        const r = rand() * 6;
        if (r > 1.2) shapes.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={rand() > 0.8 ? gold : accentSoft} fillOpacity={0.45} />);
      }
      break;
    case "rings":
      for (let i = 0; i < 12; i++) shapes.push(<circle key={i} cx={W * (0.3 + rand() * 0.4)} cy={H * 0.45} r={40 + i * 34} fill="none" stroke={i % 3 === 0 ? gold : accentSoft} strokeOpacity={0.5 - i * 0.03} strokeWidth={i % 3 === 0 ? 2 : 1} />);
      break;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" role="presentation">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#1e3a2c" />
          <stop offset="0.6" stopColor="#12251b" />
          <stop offset="1" stopColor="#0a150f" />
        </linearGradient>
        <radialGradient id={`${id}r`} cx="0.75" cy="0.2" r="0.7">
          <stop offset="0" stopColor={accent} stopOpacity="0.55" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}g)`} />
      <rect width={W} height={H} fill={`url(#${id}r)`} />
      {shapes}
      {variant === "cover" && <circle cx={W * 0.78} cy={H * 0.17} r={46} fill={gold} fillOpacity={0.85} />}
    </svg>
  );
}
