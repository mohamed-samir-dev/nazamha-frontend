export interface StudentReport {
  joined_at?: string;
  subscription_start_month?: number;
  subscription_start_year?: number;
  subscription_base?: number | null;
  subscription_discount?: number;
  paid_at?: string | null;
  receipt_number?: string | null;
  arrears_count?: number;
  arrears_amount?: number;
  last_paid?: { month: number; year: number; amount: number } | null;
  last_attendance?: string | null;
  attendance?: { date: string; status: string; group: string }[];
  exams?: { title: string; date: string; score: number | null; max_score: number }[];
  exam_average?: number | null;
  exam_average_all_time?: number | null;
  books?: { name: string; date: string; price: number; discount: number; amount: number; exempt: boolean }[];
  memberships?: { group: string; start: string; end: string | null }[];
  id: string;
  name: string;
  code?: string;
  isPaid: boolean;
  report_month?: number;
  report_year?: number;
  payment_status?: string;
  subscription_amount?: number | null;
  grade_name?: string;
  group_name?: string;
  group_day?: string;
  group_time?: string;
  teacher_name?: string;
  teacher_subject?: string;
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
