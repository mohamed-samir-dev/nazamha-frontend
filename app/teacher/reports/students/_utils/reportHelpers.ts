import { Student, MonthlySubscription, AttendanceRecord } from "@/lib/types";

export const DEFAULT_TEMPLATE =
  "مرحباً ولي أمر الطالب [اسم_الطالب]،\nنود إعلامكم بتقرير الطالب كالتالي:\nأيام الحضور: [الحضور]\nأيام الغياب: [الغياب]\nحالة الدفع: [حالة_الدفع]\nشكراً لتعاونكم.";

/** Persisted attendance remains valid after the student moves to another group. */
export function countMembershipAttendance(currentSessionDates: string[], presentDates: Set<string>, absentDates: Set<string>) {
  const sessions = new Set([...currentSessionDates, ...presentDates, ...absentDates]);
  return { present: presentDates.size, absent: absentDates.size, total: sessions.size };
}

/** تحويل رقم الهاتف لصيغة واتساب الدولية */
export function formatPhone(raw: string): string {
  let p = raw.replace(/\D/g, "");
  if (p.startsWith("0")) p = "2" + p;
  if (!p.startsWith("2")) p = "20" + p;
  return p;
}

/** بناء رسالة واتساب مفصلة لتقرير الطالب ترسل لولي الأمر */
export function buildStudentWhatsAppMessage(
  student: Student,
  attendance: { present: number; absent: number; total: number },
  isPaid: boolean,
  monthName: string,
  year: number,
  lastExam?: { title: string; score: number | null; max_score: number } | null,
  arrears = 0
): string {
  const pct = attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0;
  const examLine = lastExam
    ? `\n📝 آخر امتحان (${lastExam.title}): ${lastExam.score !== null ? `${lastExam.score}/${lastExam.max_score}` : "لم يُرصد"}`
    : "";
  const paymentLine = isPaid
    ? "✅ مسدد بالكامل"
    : arrears > 0
    ? `⚠️ غير مسدد (متأخرات: ${arrears} شهر)`
    : "⚠️ لم يتم السداد بعد";

  return `السلام عليكم ولي أمر الطالب: ${student.name} 🌸\n` +
    `📌 تقرير المتابعة لشهر ${monthName} ${year}:\n` +
    `━━━━━━━━━━━━━━━\n` +
    `▫️ عدد الحصص الكلية: ${attendance.total} حصة\n` +
    `▫️ أيام الحضور: ${attendance.present} حصة ✅\n` +
    `▫️ أيام الغياب: ${attendance.absent} حصة ❌\n` +
    `▫️ نسبة الالتزام: ${pct}%\n` +
    `▫️ حالة الاشتراك: ${paymentLine}` +
    `${examLine}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `نتمنى له دوام التفوق والنجاح ✨`;
}

/** بناء رسالة واتساب من القالب (للتوافق القديم) */
export function buildMessage(
  student: Student,
  template: string,
  attendance: { present: number; absent: number },
  isPaid: boolean
): string {
  return template
    .replace(/\[اسم_الطالب\]/g, student.name)
    .replace(/\[الحضور\]/g, String(attendance.present))
    .replace(/\[الغياب\]/g, String(attendance.absent))
    .replace(/\[حالة_الدفع\]/g, isPaid ? "تم الدفع ✅" : "لم يتم الدفع بعد ❌");
}

/** بناء map الاشتراكات لشهر/سنة معينة */
export function buildSubsMap(
  allSubscriptions: MonthlySubscription[],
  monthNum: number,
  year: number
): Map<string, { paid: boolean; status: string }> {
  const map = new Map<string, { paid: boolean; status: string }>();
  for (const sub of allSubscriptions) {
    if (sub.month === monthNum && sub.year === year) {
      map.set(sub.student_id, {
        paid: sub.status === "paid" || sub.status === "exempt",
        status: sub.status,
      });
    }
  }
  return map;
}

/** بناء map الحضور من السجلات */
export function buildAttendanceMap(
  records: AttendanceRecord[]
): Map<string, { present: number; absent: number }> {
  const map = new Map<string, { present: number; absent: number }>();
  for (const r of records) {
    const cur = map.get(r.student_id) ?? { present: 0, absent: 0 };
    if (r.status === "present") cur.present++;
    else cur.absent++;
    map.set(r.student_id, cur);
  }
  return map;
}

/** حساب إحصائيات الطلاب */
export function calcStats(
  students: Student[],
  subsMap: Map<string, { paid: boolean; status: string }>
) {
  const dueStudents = students.filter((s) => {
    const sub = subsMap.get(s.id);
    return sub && sub.status !== "not_due";
  });
  const paid = dueStudents.filter((s) => subsMap.get(s.id)?.paid).length;
  return {
    total: students.length,
    paid,
    unpaid: dueStudents.length - paid,
    withPhone: students.filter((s) => s.parent_phone).length,
  };
}

/** فلترة الطلاب */
export function filterStudents(
  students: Student[],
  opts: {
    filterGradeId: string;
    filterGroupId: string;
    filterPayment: "all" | "paid" | "unpaid";
    searchQuery: string;
    subsMap: Map<string, { paid: boolean; status: string }>;
  }
): Student[] {
  let list = students;

  if (opts.filterGradeId !== "all")
    list = list.filter((s) => s.grade_id === opts.filterGradeId);

  if (opts.filterGroupId !== "all")
    list = list.filter((s) => s.group_id === opts.filterGroupId);

  if (opts.filterPayment === "paid")
    list = list.filter((s) => opts.subsMap.get(s.id)?.paid);
  else if (opts.filterPayment === "unpaid")
    list = list.filter((s) => opts.subsMap.get(s.id)?.status === "due");

  if (opts.searchQuery.trim()) {
    const q = opts.searchQuery.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code || "").toLowerCase().includes(q)
    );
  }

  return list;
}
