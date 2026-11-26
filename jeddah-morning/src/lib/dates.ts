export const TIME_ZONE = "Asia/Riyadh";

/** YYYY-MM-DD for the given instant in Riyadh time. */
export function riyadhDateKey(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function riyadhHour(d: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" }).format(d));
}

/** Parse a YYYY-MM-DD as noon UTC to avoid TZ edge shifts when formatting. */
function fromKey(key: string): Date {
  return new Date(`${key}T12:00:00Z`);
}

export function formatArabicDate(key: string): string {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-arab", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(fromKey(key));
}

export function formatShortArabicDate(key: string): string {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-arab", { timeZone: "UTC", day: "numeric", month: "long" }).format(fromKey(key));
}

export function formatHijriDate(key: string): string {
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-arab", {
    timeZone: "UTC", day: "numeric", month: "long", year: "numeric",
  }).format(fromKey(key));
}

export function formatMonthKey(monthKey: string): string {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-arab", { timeZone: "UTC", month: "long", year: "numeric" }).format(
    new Date(`${monthKey}-15T12:00:00Z`),
  );
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-arab", {
    timeZone: TIME_ZONE, day: "numeric", month: "long", hour: "numeric", minute: "2-digit",
  }).format(new Date(iso));
}

export function toArabicDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export function editionName(edition: "morning" | "evening" | "special"): string {
  return edition === "morning" ? "العدد الصباحي" : edition === "evening" ? "العدد المسائي" : "عدد خاص";
}

export function weekdayName(key: string): string {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { timeZone: "UTC", weekday: "long" }).format(fromKey(key));
}

/** Minutes since midnight in Riyadh. */
export function riyadhMinutes(d: Date = new Date()): number {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d).split(":").map(Number);
  return h * 60 + m;
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
