export const SECTION_KEYS = [
  // Morning core (spec §8)
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
  // After Dark & features
  "recap",
  "behind-headlines",
  "developments",
  "culture",
  "travel",
  "tomorrow",
  "opinion",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const CORE_MORNING_SECTIONS: SectionKey[] = SECTION_KEYS.slice(0, 13) as SectionKey[];

export interface SectionMeta {
  key: SectionKey;
  name: string;
  latin: string;
  description: string;
  hue: number;
  pattern: "waves" | "grid" | "stripes" | "stars" | "arches" | "dots" | "rings";
  /** Depends on live/time-sensitive data → real (non-demo) content must cite sources. */
  live: boolean;
}

const s = (key: SectionKey, name: string, latin: string, description: string, hue: number, pattern: SectionMeta["pattern"], live: boolean): SectionMeta => ({ key, name, latin, description, hue, pattern, live });

export const SECTIONS: Record<SectionKey, SectionMeta> = {
  weather: s("weather", "طقس جدة", "Jeddah Weather", "الحرارة والرطوبة والرياح والبحر والتنبيهات المؤكدة", 200, "waves", true),
  news: s("news", "العالم", "The World", "ما حدث ولماذا يهم", 150, "grid", true),
  football: s("football", "مركز الكرة", "Football Center", "المباريات والنتائج والترتيب والانتقالات", 120, "stripes", true),
  fashion: s("fashion", "الموضة والأناقة", "Fashion & Style", "المجموعات والحملات والمصممون والإطلالات", 30, "arches", true),
  "queer-culture": s("queer-culture", "ثقافة ومجتمع الكوير", "Queer Culture & Community", "الفن والسينما والموسيقى والمبدعون باحترام وأمان", 300, "rings", true),
  ai: s("ai", "رادار الذكاء الاصطناعي", "AI Radar", "التحديثات والأدوات والتطبيقات العملية", 260, "dots", true),
  careers: s("careers", "رادار الوظائف", "Career Radar", "فرص حقيقية في السعودية ومهارات وشهادات", 45, "grid", true),
  "saudi-economy": s("saudi-economy", "الأعمال والاقتصاد السعودي", "Saudi Business & Economy", "الاستثمارات والمشاريع والقطاعات وسوق العمل", 140, "stripes", true),
  "personal-growth": s("personal-growth", "النمو اليومي", "Daily Growth", "تعبير مهني ومفهوم إداري ومهارة وتحدٍ", 90, "rings", false),
  song: s("song", "أغنية اليوم", "Song of the Day", "لحن مختلف كل يوم وسبب اختياره", 340, "waves", true),
  screen: s("screen", "رادار المشاهدة", "Watchlist Radar", "أفلام ومسلسلات متاحة في السعودية", 10, "stars", true),
  discovery: s("discovery", "اكتشاف جديد", "New Discovery", "تطبيق أو كتاب أو فكرة أو نشاط", 180, "stars", false),
  puzzle: s("puzzle", "لغز اليوم", "Daily Puzzle", "لغز مختلف بحل مخفي وتفسير", 50, "dots", false),
  recap: s("recap", "حصاد اليوم", "The Day in Review", "خلاصة ما جرى اليوم", 220, "grid", true),
  "behind-headlines": s("behind-headlines", "ما وراء العناوين", "Behind the Headlines", "السياق والتحليل خلف الخبر", 240, "stripes", true),
  developments: s("developments", "أهم التطورات", "Key Developments", "ما تغيّر منذ الصباح", 210, "grid", true),
  culture: s("culture", "الثقافة والفن", "Culture & Arts", "الفنون والأدب والقصص الإنسانية", 20, "arches", false),
  travel: s("travel", "السفر والأماكن", "Travel & Places", "أدلة وأماكن وتجارب", 170, "waves", false),
  tomorrow: s("tomorrow", "استعداد للغد", "Ready for Tomorrow", "ما ينتظرك غدًا", 230, "rings", true),
  opinion: s("opinion", "رأي", "Opinion", "مقالات رأي موقّعة", 35, "arches", false),
};

export function sectionMeta(key: SectionKey): SectionMeta {
  return SECTIONS[key];
}
