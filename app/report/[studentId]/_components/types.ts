export interface StudentReport {
  id: string;
  name: string;
  code?: string;
  isPaid: boolean;
  grade_name?: string;
  group_name?: string;
  group_day?: string;
  group_time?: string;
  teacher_name?: string;
  site_name?: string;
  site_logo?: string;
  attendance_present: number;
  attendance_absent: number;
  attendance_total: number;
  last_exam_title?: string;
  last_exam_score?: number | null;
  last_exam_max?: number;
  last_exam_date?: string;
}

export const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function formatTimeTo12H(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "م" : "ص";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
