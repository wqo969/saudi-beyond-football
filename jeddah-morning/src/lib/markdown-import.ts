import { textToBlocks, textToSources } from "./editor-format";
import { SECTION_KEYS } from "./sections";

/**
 * Markdown → issue JSON (then validated by IssueSchema).
 *
 *   slug: 2026-11-27-morning
 *   date: 2026-11-27
 *   edition: morning
 *   number: 3
 *   title: …
 *   coverHeadline: …
 *   ---
 *   # [news] عنوان المقال
 *   kicker: …   (optional meta lines: kicker, dek, author, kind, layout, minutes, demo, sources)
 *   sources: اسم | https://… ; اسم2 | https://…
 *
 *   النص بصيغة المحرر (سطر فارغ بين الفقرات، ## عنوان، > اقتباس، - قائمة …)
 */
export function markdownToIssue(md: string): Record<string, unknown> {
  const text = md.replace(/\r\n?/g, "\n");
  const [head, ...restParts] = text.split(/\n---\n/);
  const rest = restParts.join("\n---\n");
  const issue: Record<string, unknown> = {};
  for (const line of head.split("\n")) {
    const m = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    issue[k] = k === "number" ? Number(v) : v === "true" ? true : v === "false" ? false : v;
  }
  const articles: Record<string, unknown>[] = [];
  const chunks = rest.split(/\n(?=# \[)/).map((c) => c.trim()).filter(Boolean);
  chunks.forEach((chunk, idx) => {
    const lines = chunk.split("\n");
    const h = lines[0].match(/^# \[([a-z-]+)\]\s*(.+)$/);
    if (!h || !(SECTION_KEYS as readonly string[]).includes(h[1])) return;
    const a: Record<string, unknown> = { section: h[1], title: h[2].trim(), id: `${h[1]}-${idx + 1}` };
    let i = 1;
    for (; i < lines.length; i++) {
      const m = lines[i].match(/^(kicker|dek|author|kind|layout|minutes|demo|sources|id):\s*(.*)$/);
      if (!m) break;
      const [, k, v] = m;
      if (k === "minutes") a.readingMinutes = Number(v);
      else if (k === "demo") a.isDemo = v === "true";
      else if (k === "sources") a.sources = textToSources(v.split(";").join("\n"));
      else a[k] = v;
    }
    a.body = textToBlocks(lines.slice(i).join("\n"));
    articles.push(a);
  });
  issue.articles = articles;
  return issue;
}
