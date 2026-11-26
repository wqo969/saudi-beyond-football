import { describe, expect, it } from "vitest";
import { blocksToText, isoToRiyadhLocal, riyadhLocalToIso, textToBlocks, textToSources } from "@/lib/editor-format";
import type { Block } from "@/lib/schema";

describe("editor text format", () => {
  const blocks: Block[] = [
    { type: "p", text: "فقرة أولى." },
    { type: "h", text: "عنوان" },
    { type: "quote", text: "اقتباس", cite: "القائل" },
    { type: "list", items: ["واحد", "اثنان"] },
    { type: "facts", title: "حقائق", items: [{ label: "أ", value: "ب" }] },
    { type: "puzzle", question: "س؟", hint: "ت", answer: "ح", explanation: "لأن…" },
    { type: "stats", title: "أرقام", items: [{ value: "—", label: "مؤشر", note: "ملاحظة" }, { value: "٣", label: "آخر" }] },
    { type: "timeline", title: "تسلسل", items: [{ when: "٠٨:٠٠", text: "أ" }, { when: "٠٩:٠٠", text: "ب" }] },
    { type: "qa", items: [{ q: "سؤال؟", a: "جواب." }] },
    { type: "gallery", items: [{ caption: "لوحة ١" }, { caption: "لوحة ٢" }] },
    { type: "link", label: "رابط", url: "https://example.com/x" },
  ];
  it("round-trips every block type", () => {
    expect(textToBlocks(blocksToText(blocks))).toEqual(blocks);
  });
  it("joins wrapped lines into one paragraph and ignores extra blank lines", () => {
    expect(textToBlocks("سطر\nمتصل\n\n\n\nفقرة")).toEqual([{ type: "p", text: "سطر متصل" }, { type: "p", text: "فقرة" }]);
  });
  it("parses sources", () => {
    expect(textToSources("واس | https://spa.gov.sa\nمصدر بلا رابط")).toEqual([{ name: "واس", url: "https://spa.gov.sa" }, { name: "مصدر بلا رابط" }]);
  });
  it("converts Riyadh local time both ways", () => {
    expect(riyadhLocalToIso("2026-11-26T18:00")).toBe("2026-11-26T18:00:00+03:00");
    expect(isoToRiyadhLocal("2026-11-26T15:00:00Z")).toBe("2026-11-26T18:00");
    expect(riyadhLocalToIso("")).toBeUndefined();
  });
});
