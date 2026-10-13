import { sanitizeHtml } from "@/lib/sanitizeHtml";
import html2canvas from "html2canvas";
import { Student, Grade, Group } from "@/lib/types";
import { WhatsAppService } from "@/lib/services/whatsappService";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

type AlertItem = { type: "expulsion" | "absence" | "arrears" | "star"; title: string };

const alertLabels: Record<AlertItem["type"], string> = {
  star:      "🏆 طالب متميز — حضور 90%+ ومدفوع",
  expulsion: "⚠️ معرض للفصل — نسبة الحضور أقل من 50%",
  absence:   "⚠️ غياب متكرر — غاب 3 أيام أو أكثر",
  arrears:   "💳 متأخر في الدفع",
};

function buildReportHTML(
  student: Student,
  att: { present: number; absent: number },
  pct: number,
  gradeName: string,
  groupName: string,
  lastPaidMonth: string,
  arrears: number,
  monthIndex: number,
  year: number,
  alerts: AlertItem[]
): string {
  const total = att.present + att.absent;
  const pctColor = pct >= 75 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
  const paidColor = arrears === 0 ? "#16a34a" : "#dc2626";

  const alertsHTML = alerts.length === 0
    ? `<tr><td colspan="2" style="text-align:center;color:#555;padding:8px 10px;">لا توجد تنبيهات</td></tr>`
    : alerts.map((a) => {
        const color = a.type === "star" ? "#b45309" : a.type === "expulsion" ? "#dc2626" : a.type === "absence" ? "#d97706" : "#dc2626";
        const label = a.type === "arrears" ? `💳 متأخر في الدفع — ${arrears} شهر` : alertLabels[a.type];
        return `<tr><td style="padding:7px 10px;color:${color};font-weight:600;">${label}</td></tr>`;
      }).join("");

  return `
    <div style="font-family:Arial,sans-serif;direction:rtl;background:#fff;padding:24px 28px;width:500px;color:#111;border-radius:12px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
        <div style="width:44px;height:44px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;font-size:22px;">📊</div>
        <div>
          <div style="font-size:16px;font-weight:800;">تقرير الطالب</div>
          <div style="font-size:12px;color:#6b7280;">${arabicMonths[monthIndex]} ${year}</div>
        </div>
      </div>

      <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:6px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">بيانات الطالب</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px;">
        <tr style="background:#f9fafb;">
          <td style="padding:7px 10px;font-weight:700;color:#374151;width:40%;">الاسم</td>
          <td style="padding:7px 10px;font-weight:600;">${student.name}</td>
        </tr>
        ${student.code ? `<tr><td style="padding:7px 10px;font-weight:700;color:#374151;">الكود</td><td style="padding:7px 10px;">${student.code}</td></tr>` : ""}
        <tr style="background:#f9fafb;">
          <td style="padding:7px 10px;font-weight:700;color:#374151;">السنة الدراسية</td>
          <td style="padding:7px 10px;">${gradeName}</td>
        </tr>
        <tr>
          <td style="padding:7px 10px;font-weight:700;color:#374151;">المجموعة</td>
          <td style="padding:7px 10px;">${groupName}</td>
        </tr>
      </table>

      <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:6px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">الحضور والغياب — ${arabicMonths[monthIndex]} ${year}</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px;">
        <tr style="background:#f9fafb;">
          <td style="padding:7px 10px;font-weight:700;color:#374151;width:40%;">إجمالي الحصص</td>
          <td style="padding:7px 10px;">${total} حصة</td>
        </tr>
        <tr>
          <td style="padding:7px 10px;font-weight:700;color:#374151;">أيام الحضور</td>
          <td style="padding:7px 10px;color:#16a34a;font-weight:700;">${att.present}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="padding:7px 10px;font-weight:700;color:#374151;">أيام الغياب</td>
          <td style="padding:7px 10px;color:#dc2626;font-weight:700;">${att.absent}</td>
        </tr>
        <tr>
          <td style="padding:7px 10px;font-weight:700;color:#374151;">نسبة الحضور</td>
          <td style="padding:7px 10px;color:${pctColor};font-weight:800;font-size:15px;">${pct}%</td>
        </tr>
      </table>

      <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:6px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">الحالة المالية</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px;">
        <tr style="background:#f9fafb;">
          <td style="padding:7px 10px;font-weight:700;color:#374151;width:40%;">آخر شهر دفع</td>
          <td style="padding:7px 10px;">${lastPaidMonth}</td>
        </tr>
        <tr>
          <td style="padding:7px 10px;font-weight:700;color:#374151;">شهور متأخرة</td>
          <td style="padding:7px 10px;color:${paidColor};font-weight:700;">${arrears > 0 ? arrears + " شهر" : "لا يوجد ✅"}</td>
        </tr>
      </table>

      <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:6px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">التنبيهات</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px;">
        ${alertsHTML}
      </table>

      <div style="margin-top:8px;font-size:10px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:8px;">
        نظام متابعة الطلاب • ${new Date().toLocaleDateString("ar-EG")}
      </div>
    </div>
  `;
}

export async function sendReportAsImage(
  student: Student,
  att: { present: number; absent: number },
  pct: number,
  grades: Grade[],
  groups: Group[],
  lastPaidMonth: string,
  arrears: number,
  monthIndex: number,
  year: number,
  alerts: { type: "expulsion" | "absence" | "arrears" | "star"; title: string }[] = []
): Promise<void> {
  if (!student.parent_phone) throw new Error("لا يوجد رقم هاتف");

  const gradeName = grades.find((g) => g.id === student.grade_id)?.name ?? "—";
  const groupName = groups.find((g) => g.id === student.group_id)?.name ?? "—";

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;top:-9999px;left:-9999px;";
  container.innerHTML = sanitizeHtml(buildReportHTML(student, att, pct, gradeName, groupName, lastPaidMonth, arrears, monthIndex, year, alerts));
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      scale: 1.5,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);
    const caption = `تقرير الطالب ${student.name} — ${arabicMonths[monthIndex]} ${year}`;
    await WhatsAppService.sendImage(student.parent_phone, imageBase64, caption);
  } finally {
    document.body.removeChild(container);
  }
}
