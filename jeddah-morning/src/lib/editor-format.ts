import type { Block } from "./schema";

/**
 * Plain-text authoring format for the admin editor (Arabic friendly):
 *   ## عنوان فرعي
 *   > اقتباس            (optional next line: — القائل)
 *   - بند قائمة
 *   | التسمية | القيمة    (facts; optional first line: || عنوان الجدول)
 *   لغز: السؤال / تلميح: ... / الحل: ...
 *   [نص الرابط](https://...)
 *   Blank line = new paragraph.
 */
export function textToBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const chunks = text.replace(/\r\n?/g, "\n").split(/\n\s*\n/);
  for (const raw of chunks) {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const first = lines[0];
    if (first.startsWith("## ")) {
      blocks.push({ type: "h", text: first.slice(3).trim() });
      if (lines.length > 1) blocks.push({ type: "p", text: lines.slice(1).join(" ") });
    } else if (first.startsWith(">")) {
      const citeLine = lines.find((l) => /^[—-]{1,2}\s/.test(l));
      const text = lines.filter((l) => l !== citeLine).map((l) => l.replace(/^>\s?/, "")).join(" ");
      blocks.push({ type: "quote", text, ...(citeLine ? { cite: citeLine.replace(/^[—-]{1,2}\s/, "") } : {}) });
    } else if (lines.every((l) => /^[-•]\s/.test(l))) {
      blocks.push({ type: "list", items: lines.map((l) => l.replace(/^[-•]\s/, "")) });
    } else if (lines.every((l) => l.startsWith("|"))) {
      let title: string | undefined;
      const items: { label: string; value: string }[] = [];
      for (const l of lines) {
        if (l.startsWith("||")) title = l.replace(/^\|\|/, "").trim();
        else {
          const [label, value] = l.replace(/^\||\|$/g, "").split("|").map((s) => s.trim());
          if (label && value) items.push({ label, value });
        }
      }
      if (items.length) blocks.push({ type: "facts", items, ...(title ? { title } : {}) });
    } else if (first.startsWith("لغز:")) {
      const get = (p: string) => lines.find((l) => l.startsWith(p))?.slice(p.length).trim();
      const question = get("لغز:") ?? "";
      const answer = get("الحل:") ?? "";
      const hint = get("تلميح:");
      blocks.push({ type: "puzzle", question, answer, ...(hint ? { hint } : {}) });
    } else if (lines.length === 1 && /^\[[^\]]+\]\(https?:\/\/[^)\s]+\)$/.test(first)) {
      const m = first.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      blocks.push({ type: "link", label: m[1], url: m[2] });
    } else {
      blocks.push({ type: "p", text: lines.join(" ") });
    }
  }
  return blocks;
}

export function blocksToText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "p":
          return b.text;
        case "h":
          return `## ${b.text}`;
        case "quote":
          return `> ${b.text}${b.cite ? `\n— ${b.cite}` : ""}`;
        case "list":
          return b.items.map((i) => `- ${i}`).join("\n");
        case "facts":
          return [...(b.title ? [`|| ${b.title}`] : []), ...b.items.map((i) => `| ${i.label} | ${i.value}`)].join("\n");
        case "puzzle":
          return [`لغز: ${b.question}`, ...(b.hint ? [`تلميح: ${b.hint}`] : []), `الحل: ${b.answer}`].join("\n");
        case "link":
          return `[${b.label}](${b.url})`;
      }
    })
    .join("\n\n");
}

/** "اسم | رابط" per line */
export function textToSources(text: string): { name: string; url?: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, url] = l.split("|").map((s) => s.trim());
      return url ? { name, url } : { name };
    });
}

export function sourcesToText(sources: { name: string; url?: string }[]): string {
  return sources.map((s) => (s.url ? `${s.name} | ${s.url}` : s.name)).join("\n");
}

/** Convert <input type="datetime-local"> value (Riyadh wall time) to ISO with +03:00 offset, and back. */
export function riyadhLocalToIso(local: string): string | undefined {
  if (!local) return undefined;
  const v = local.length === 16 ? `${local}:00` : local;
  return `${v}+03:00`;
}

export function isoToRiyadhLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 3 * 3600_000);
  return d.toISOString().slice(0, 16);
}
