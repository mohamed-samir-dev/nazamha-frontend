import { Group } from "@/lib/types";

const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function sessionTime(group:Group,date:string) { return group.attendance_sessions?.find(s=>s.session_date===date)?.time || group.time || "23:59"; }

/** حساب كل تواريخ حصص مجموعة في شهر معين */
export function getGroupSessionDates(group: Group, month: number, year: number): string[] {
  const days = group.day_of_week
    .split(/\s*[,،]\s*|\s+/)
    .map(d => d.trim().replace(/^الاثنين$/, "الإثنين"))
    .filter(Boolean);

  const dayIndices = days
    .map(d => DAYS_AR.indexOf(d))
    .filter(i => i !== -1);



  const startDate = group.start_date ?? (group.created_at
    ? new Date(group.created_at).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" })
    : null);

  const dates: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (dayIndices.includes(date.getDay())) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (!startDate || dateStr >= startDate) dates.push(dateStr);
    }
  }

  const frozen=group.attendance_sessions||[];
  const latest=frozen.map(s=>s.session_date).sort().at(-1);
  const earliest=frozen.map(s=>s.session_date).sort()[0];
  return [...new Set([...dates.filter(d=>!latest||d>latest||d<earliest),...frozen.map(s=>s.session_date).filter(d=>d.startsWith(`${year}-${String(month).padStart(2,"0")}-`))])].sort();
}

/** بداية الأسبوع (السبت) لتاريخ معين */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 6 ? 0 : day + 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** تواريخ حصص مجموعة في أسبوع معين (weekOffset: 0=الحالي، -1=الماضي ...) */
export function getGroupSessionDatesForWeek(group: Group, weekOffset: number): string[] {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  const today = new Date(todayStr + "T00:00:00");
  const weekStart = getWeekStart(today);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;
  const endStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth()+1).padStart(2,"0")}-${String(weekEnd.getDate()).padStart(2,"0")}`;
  return [...new Set([...getGroupSessionDates(group,weekStart.getMonth()+1,weekStart.getFullYear()),...getGroupSessionDates(group,weekEnd.getMonth()+1,weekEnd.getFullYear())])].filter(d=>d>=startStr&&d<=endStr).sort();

}

/** label للأسبوع: "١٢ - ١٨ يناير" */
export function getWeekLabel(weekOffset: number): string {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  const today = new Date(todayStr + "T00:00:00");
  const weekStart = getWeekStart(today);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو",
    "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const endMonth = months[weekEnd.getMonth()];

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startDay} - ${endDay} ${endMonth}`;
  }
  return `${startDay} ${months[weekStart.getMonth()]} - ${endDay} ${endMonth}`;
}

/** هل الحصة ملغاة؟ */
export function isSessionCancelled(group: Group, dateStr: string): boolean {
  return (group.cancelled_sessions ?? []).includes(dateStr);
}

/** هل الحصة عدت (+ ساعة من وقت المجموعة — يتوافق مع backend cron)؟ */
export function isSessionExpired(dateStr: string, groupTime: string, now = new Date()): boolean {
  const [h, m] = groupTime.split(":").map(Number);
  // بناء وقت نهاية الحصة بتوقيت القاهرة صراحةً
  const sessionEndUTC = new Date(
    Date.UTC(...((): [number, number, number, number, number] => {
      const [y, mo, d] = dateStr.split("-").map(Number);
      // نحول Cairo → UTC: Cairo = UTC+2 شتاء / UTC+3 صيف
      // نستخدم Intl لحساب الـ offset الفعلي
      const approx = new Date(Date.UTC(y, mo - 1, d, h, m, 0));
      const cairoStr = approx.toLocaleString("en-US", { timeZone: "Africa/Cairo" });
      const utcStr   = approx.toLocaleString("en-US", { timeZone: "UTC" });
      const offsetMs = new Date(cairoStr).getTime() - new Date(utcStr).getTime();
      const endMs = approx.getTime() - offsetMs + 60 * 60 * 1000; // +1 ساعة
      const end = new Date(endMs);
      return [end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()];
    })())
  );
  return now > sessionEndUTC;
}

/** هل التاريخ في المستقبل؟ */
export function isSessionFuture(dateStr: string): boolean {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  return dateStr > today;
}

export function formatDateShort(dateStr: string): string {
  return dateStr.slice(5).split("-").reverse().join("/");
}

export function formatTimeTo12H(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "م" : "ص";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
}
