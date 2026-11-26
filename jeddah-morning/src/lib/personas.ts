import type { SectionKey } from "./sections";

export type PersonaId = "week-ahead" | "ambition" | "future" | "style" | "weekend-edit" | "culture" | "reset";

export interface Persona {
  id: PersonaId;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  latin: string;
  name: string;
  tagline: string;
  /** Sections pulled to the front of the issue, in order. */
  priority: SectionKey[];
  /** Palette mood tags the engine prefers for this persona. */
  moods: string[];
  /** Cover layouts this persona leans toward (still subject to anti-repetition). */
  covers: string[];
}

export const PERSONAS: Persona[] = [
  { id: "week-ahead", weekday: 0, latin: "THE WEEK AHEAD", name: "الأسبوع القادم", tagline: "خريطة الأسبوع والفرص والأهداف والمواعيد", priority: ["tomorrow", "careers", "saudi-economy", "personal-growth"], moods: ["fresh", "calm"], covers: ["cover-type", "cover-split"] },
  { id: "ambition", weekday: 1, latin: "THE AMBITION ISSUE", name: "عدد الطموح", tagline: "الطموح والقيادة والمسيرة المهنية والأعمال", priority: ["careers", "saudi-economy", "personal-growth", "opinion"], moods: ["bold", "warm"], covers: ["cover-type", "cover-full"] },
  { id: "future", weekday: 2, latin: "THE FUTURE ISSUE", name: "عدد المستقبل", tagline: "التقنية والذكاء الاصطناعي والابتكار", priority: ["ai", "discovery", "saudi-economy"], moods: ["cool", "bold"], covers: ["cover-abstract", "cover-type"] },
  { id: "style", weekday: 3, latin: "THE STYLE ISSUE", name: "عدد الأناقة", tagline: "الموضة والمصممون والأناقة والإبداع", priority: ["fashion", "culture", "queer-culture"], moods: ["warm", "soft"], covers: ["cover-full", "cover-split"] },
  { id: "weekend-edit", weekday: 4, latin: "THE WEEKEND EDIT", name: "مختارات الويكند", tagline: "الترفيه والأماكن والموسيقى والأفلام", priority: ["screen", "song", "travel", "discovery"], moods: ["warm", "fresh"], covers: ["cover-full", "cover-abstract"] },
  { id: "culture", weekday: 5, latin: "THE CULTURE ISSUE", name: "عدد الثقافة", tagline: "الثقافة والفن والسفر والقصص الإنسانية", priority: ["culture", "travel", "opinion", "queer-culture"], moods: ["soft", "warm"], covers: ["cover-split", "cover-type"] },
  { id: "reset", weekday: 6, latin: "THE RESET ISSUE", name: "عدد إعادة الضبط", tagline: "الراحة والصحة والتأمل وترتيب الحياة", priority: ["personal-growth", "discovery", "puzzle"], moods: ["calm", "soft"], covers: ["cover-abstract", "cover-full"] },
];

export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function personaForDate(date: string): Persona {
  return PERSONAS.find((p) => p.weekday === weekdayOf(date))!;
}

export function personaById(id: string | undefined): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export interface SpecialEdition {
  key: string;
  latin: string;
  name: string;
  moods: string[];
}

export const SPECIAL_EDITIONS: SpecialEdition[] = [
  { key: "travel", latin: "THE TRAVEL ISSUE", name: "عدد السفر", moods: ["fresh"] },
  { key: "fashion-book", latin: "THE FASHION BOOK", name: "كتاب الموضة", moods: ["warm", "soft"] },
  { key: "saudi", latin: "THE SAUDI ISSUE", name: "العدد السعودي", moods: ["bold"] },
  { key: "ramadan", latin: "THE RAMADAN EDIT", name: "مختارات رمضان", moods: ["calm"] },
  { key: "yearbook", latin: "THE YEARBOOK", name: "كتاب العام", moods: ["bold"] },
  { key: "love", latin: "THE LOVE ISSUE", name: "عدد الحب", moods: ["warm"] },
  { key: "ai", latin: "THE AI ISSUE", name: "عدد الذكاء الاصطناعي", moods: ["cool"] },
  { key: "summer", latin: "THE SUMMER ISSUE", name: "عدد الصيف", moods: ["fresh"] },
  { key: "winter", latin: "THE WINTER ISSUE", name: "عدد الشتاء", moods: ["cool", "calm"] },
  { key: "business", latin: "THE BUSINESS ISSUE", name: "عدد الأعمال", moods: ["bold"] },
  { key: "weekly", latin: "THE WEEKLY SUPPLEMENT", name: "الملحق الأسبوعي", moods: ["calm"] },
  { key: "monthly", latin: "THE MONTHLY TRENDS", name: "اتجاهات الشهر", moods: ["bold"] },
];

export function specialByKey(key: string | undefined): SpecialEdition | undefined {
  return SPECIAL_EDITIONS.find((s) => s.key === key);
}

export const EVENING_IDENTITY = { latin: "JEDDAH AFTER DARK", name: "جدة بعد الغروب", tagline: "حصاد اليوم وما وراء العناوين والاستعداد للغد" };
export const MORNING_IDENTITY = { latin: "JEDDAH MORNING", name: "صباح جدة", tagline: "Your world. Your morning. Your magazine." };
