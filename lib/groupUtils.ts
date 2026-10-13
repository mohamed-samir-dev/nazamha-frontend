export const ARABIC_DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export const DEFAULT_GRADE_NAMES = [
  "الصف الثالث الثانوي",
  "الصف الثاني الثانوي",
  "الصف الأول الثانوي",
  "الصف الثالث الإعدادي",
  "الصف الثاني الإعدادي",
  "الصف الأول الإعدادي",
  "الصف السادس الابتدائي",
  "الصف الخامس الابتدائي",
  "الصف الرابع الابتدائي",
  "الصف الثالث الابتدائي",
  "الصف الثاني الابتدائي",
  "الصف الأول الابتدائي",
];

export const formatTimeTo12H = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "م" : "ص";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
};

export const timeToMinutes = (t: string): number | null => {
  if (!t || !t.includes(":")) return null;
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

export const splitDays = (val: string) =>
  val.split(/\s*[،,]\s*/).map((d) => d.trim()).filter(Boolean);

export const generateUniqueCode = (usedCodes: string[]): string => {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  let attempts = 0;
  do {
    code = letters[Math.floor(Math.random() * letters.length)] +
      Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    attempts++;
  } while (usedCodes.includes(code) && attempts < 100);
  return code;
};

export const ARABIC_LETTERS = ["أ","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي"];

export const getGroupSuffix = (index: number): string =>
  index < ARABIC_LETTERS.length ? ARABIC_LETTERS[index] : String(index - ARABIC_LETTERS.length + 1);

export const getAcademicYear = (date: Date): string => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit" }).formatToParts(date);
  const m = parseInt(parts.find((p) => p.type === "month")!.value, 10);
  const y = parseInt(parts.find((p) => p.type === "year")!.value, 10);
  return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
};

export const btnBase: React.CSSProperties = {
  padding: "0.45rem 0.9rem",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.75)",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 500,
  transition: "all 0.15s",
  fontFamily: "inherit",
  lineHeight: 1.4,
};

export const btnActive: React.CSSProperties = {
  ...btnBase,
  border: "1px solid var(--color-teal)",
  background: "rgba(20,184,166,0.2)",
  color: "var(--color-teal)",
  fontWeight: 700,
};
