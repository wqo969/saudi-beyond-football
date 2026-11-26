export const SECTION_KEYS = [
  "weather",
  "news",
  "football",
  "fashion",
  "queer-culture",
  "ai",
  "careers",
  "saudi-economy",
  "personal-growth",
  "song",
  "screen",
  "discovery",
  "puzzle",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export interface SectionMeta {
  key: SectionKey;
  /** Arabic display name */
  name: string;
  /** Latin label used in small caps on covers */
  latin: string;
  /** Short editorial description */
  description: string;
  /** Accent hue used by SectionArt (degrees) */
  hue: number;
  /** Pattern family used by SectionArt */
  pattern: "waves" | "grid" | "stripes" | "stars" | "arches" | "dots" | "rings";
  /** True when the section depends on live/time-sensitive data and must cite sources */
  live: boolean;
}

export const SECTIONS: Record<SectionKey, SectionMeta> = {
  weather: { key: "weather", name: "الطقس", latin: "Weather", description: "حال السماء والبحر في جدة", hue: 200, pattern: "waves", live: true },
  news: { key: "news", name: "الأخبار", latin: "News", description: "ما يستحق أن تعرفه اليوم", hue: 150, pattern: "grid", live: true },
  football: { key: "football", name: "كرة القدم", latin: "Football", description: "الملاعب والنتائج والقصص", hue: 120, pattern: "stripes", live: true },
  fashion: { key: "fashion", name: "الموضة", latin: "Fashion", description: "الأناقة والذوق والمواسم", hue: 30, pattern: "arches", live: false },
  "queer-culture": { key: "queer-culture", name: "ثقافة الكوير", latin: "Queer Culture", description: "فنون وتاريخ وأصوات", hue: 300, pattern: "rings", live: false },
  ai: { key: "ai", name: "الذكاء الاصطناعي", latin: "Artificial Intelligence", description: "الأدوات والأفكار والتحولات", hue: 260, pattern: "dots", live: true },
  careers: { key: "careers", name: "الفرص المهنية", latin: "Careers", description: "وظائف ومهارات وفرص", hue: 45, pattern: "grid", live: true },
  "saudi-economy": { key: "saudi-economy", name: "الاقتصاد السعودي", latin: "Saudi Economy", description: "الأسواق والمؤشرات والمشاريع", hue: 140, pattern: "stripes", live: true },
  "personal-growth": { key: "personal-growth", name: "التطوير الشخصي", latin: "Personal Growth", description: "عادات وأفكار لحياة أهدأ", hue: 90, pattern: "rings", live: false },
  song: { key: "song", name: "أغنية اليوم", latin: "Song of the Day", description: "لحن يرافق صباحك", hue: 340, pattern: "waves", live: false },
  screen: { key: "screen", name: "السينما والمسلسلات", latin: "Cinema & Series", description: "ما يستحق المشاهدة", hue: 10, pattern: "stars", live: false },
  discovery: { key: "discovery", name: "اكتشاف اليوم", latin: "Discovery", description: "فكرة أو مكان أو شيء جديد", hue: 180, pattern: "stars", live: false },
  puzzle: { key: "puzzle", name: "لغز اليوم", latin: "Puzzle", description: "تمرين صغير للعقل", hue: 50, pattern: "dots", live: false },
};

export function sectionMeta(key: SectionKey): SectionMeta {
  return SECTIONS[key];
}
