"use client";

import { useState, useEffect } from "react";
import { Exam, ExamGrade, Student } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, ArrowRight, Printer } from "lucide-react";
import { examsService } from "@/lib/services/examsService";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import { printHtml } from "@/lib/printHtml";

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const PRINT_STYLES = `
@media print {
  html, body {
    background: #ffffff !important;
    background-image: none !important;
    color: #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .exam-screen { display: none !important; }
  .exam-print {
    display: block !important;
    padding: 20px !important;
    font-family: 'Tajawal', Arial, sans-serif !important;
    direction: rtl !important;
    color: #000 !important;
    background: #fff !important;
  }
  .exam-print * { color: #000 !important; background: transparent !important; box-shadow: none !important; }
  .ep-title { font-size: 20px !important; font-weight: 700 !important; text-align: center !important; margin-bottom: 4px !important; }
  .ep-sub { font-size: 12px !important; text-align: center !important; color: #555 !important; margin-bottom: 14px !important; }
  .ep-hr { border: none !important; border-top: 2px solid #000 !important; margin-bottom: 14px !important; }
  .ep-table { width: 100% !important; border-collapse: collapse !important; font-size: 13px !important; }
  .ep-table th { background: #e0e0e0 !important; color: #000 !important; padding: 7px 10px !important; border: 1px solid #888 !important; font-weight: 700 !important; text-align: center !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .ep-table td { padding: 6px 10px !important; border: 1px solid #ccc !important; color: #000 !important; text-align: center !important; }
  .ep-table .ep-name { text-align: right !important; }
  .ep-table tr:nth-child(even) td { background: #f5f5f5 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .ep-pass { color: #14532d !important; font-weight: 700 !important; }
  .ep-fail { color: #7f1d1d !important; font-weight: 700 !important; }
}
`;

interface GradeEntryTableProps {
  exam: Exam;
  students: Student[];
  groupName: string;
  teacherName: string;
  onBack: () => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export function GradeEntryTable({ exam, students, groupName, teacherName, onBack, showToast }: GradeEntryTableProps) {
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [savedGrades, setSavedGrades] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const isDirty = JSON.stringify(grades) !== JSON.stringify(savedGrades);

  useEffect(() => {
    async function loadGrades() {
      try {
        const data = await examsService.getGradesByExamId(exam.id);
        const map: Record<string, number> = {};
        data.forEach((g) => { map[g.student_id] = g.score; });
        setGrades(map);
        setSavedGrades(map);
      } catch {
        showToast("حدث خطأ أثناء تحميل الدرجات", "error");
      } finally {
        setLoading(false);
      }
    }
    loadGrades();
  }, [exam.id, showToast]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleBack = () => {
    if (isDirty) {
      setConfirm({ message: "لديك تغييرات غير محفوظة. هل تريد المغادرة؟", onConfirm: onBack });
      return;
    }
    onBack();
  };

  const handleGradeChange = (studentId: string, value: string) => {
    const num = value === "" ? NaN : Number(value);
    setGrades((prev) => {
      const next = { ...prev };
      if (isNaN(num)) { delete next[studentId]; }
      else { next[studentId] = Math.min(Math.max(0, num), exam.max_score); }
      return next;
    });
  };

  const handleFillAllMax = () => {
    setConfirm({
      message: `رصد ${exam.max_score} لجميع الطلاب؟`,
      onConfirm: () => {
        const map: Record<string, number> = {};
        students.forEach((s) => { map[s.id] = exam.max_score; });
        setGrades(map);
      },
    });
  };

  const handleClearAll = () => {
    setConfirm({ message: "مسح جميع الدرجات؟", onConfirm: () => setGrades({}) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave: Omit<ExamGrade, "id" | "created_at">[] = Object.entries(grades).map(([studentId, score]) => ({
        exam_id: exam.id, student_id: studentId, score,
      }));
      await examsService.upsertGrades(toSave);
      setSavedGrades({ ...grades });
      showToast("تم حفظ الدرجات بنجاح ✓");
    } catch {
      showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  const formatPhone = (raw: string) => {
    let phone = raw.replace(/\D/g, "");
    if (phone.startsWith("20")) return phone;
    if (phone.startsWith("0")) return "20" + phone.slice(1);
    return "20" + phone;
  };

  const buildWhatsAppMsg = (student: Student, score: number) => {
    const pct = Math.round((score / exam.max_score) * 100);
    const pass = pct >= 50;
    const stars = pct >= 85 ? "⭐⭐⭐" : pct >= 70 ? "⭐⭐" : pct >= 50 ? "⭐" : "";
    return [
      `السلام عليكم ورحمة الله وبركاته 🌟`,
      ``,
      `ولي أمر الطالب/ة: *${student.name}*`,
      ``,
      `📋 *نتيجة امتحان: ${exam.title}*`,
      `📅 التاريخ: ${exam.exam_date}`,
      ``,
      `┌─────────────────────`,
      `│ 📝 الدرجة: *${score}* من *${exam.max_score}*`,
      `│ 📊 النسبة: *${pct}%* ${stars}`,
      `│ ${pass ? "✅ الحالة: *ناجح*" : "❌ الحالة: *يحتاج متابعة*"}`,
      `└─────────────────────`,
      ``,
      pass
        ? `نتمنى له/لها التوفيق والتقدم دائماً 🎉`
        : `نرجو الاهتمام بالمذاكرة والتواصل معنا لأي استفسار 📞`,
      ``,
      `شكراً لتعاونكم 🙏`,
      ``,
      `— أستاذ/ ${teacherName} ﺎ`,
    ].join("\n");
  };

  const sendWhatsApp = (student: Student) => {
    if (!student.parent_phone) { showToast("لا يوجد رقم ولي أمر", "error"); return; }
    const score = grades[student.id];
    if (score === undefined) { showToast("لم يتم رصد درجة هذا الطالب", "error"); return; }
    const phone = formatPhone(student.parent_phone);
    const msg = buildWhatsAppMsg(student, score);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handlePrint = () => {
    const rows = students.map((s, i) => {
      const score = grades[s.id];
      const hasScore = score !== undefined && !isNaN(score);
      const pct = hasScore ? Math.round((score / exam.max_score) * 100) : null;
      const pass = pct !== null && pct >= 50;
      const rowBg = i % 2 === 0 ? "#ffffff" : "#f9fafb";
      return `<tr style="background:${rowBg}">
        <td style="text-align:center;color:#9ca3af;font-size:11px">${i + 1}</td>
        <td><div style="font-weight:700;font-size:13px">${s.name}</div>${s.code ? `<div style="font-family:monospace;color:#6b7280;font-size:11px">${s.code}</div>` : ""}</td>
        <td style="text-align:center">${hasScore ? score : "—"}</td>
        <td style="text-align:center">${exam.max_score}</td>
        <td style="text-align:center;font-weight:700;color:${pct !== null ? (pct >= 85 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626") : "#9ca3af"}">${pct !== null ? pct + "%" : "—"}</td>
        <td style="text-align:center;font-weight:700;color:${hasScore ? (pass ? "#14532d" : "#7f1d1d") : "#9ca3af"}">${hasScore ? (pass ? "ناجح" : "راسب") : "—"}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>كشف درجات — ${exam.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; direction: rtl; color: #111; background: #fff; padding: 16px; }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
    .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #111827 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead th { padding: 9px 8px; color: #fff; font-weight: 700; font-size: 11px; text-align: center; }
    thead th:nth-child(2) { text-align: right; }
    tbody td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    tbody td:nth-child(2) { text-align: right; }
    .footer { margin-top: 14px; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    @media print { body { padding: 0; } @page { size: A4 portrait; margin: 10mm 12mm; } }
  </style>
</head>
<body>
  <h1>كشف درجات: ${exam.title}</h1>
  <div class="subtitle">المجموعة: ${groupName} | الدرجة النهائية: ${exam.max_score} | التاريخ: ${exam.exam_date} | عدد الطلاب: ${students.length}</div>
  <table>
    <thead><tr><th>#</th><th style="text-align:right">الطالب</th><th>الدرجة</th><th>من</th><th>النسبة</th><th>الحالة</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>تم الإنشاء: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</span>
    <span>ناجح: ${Object.values(grades).filter((sc) => (sc / exam.max_score) * 100 >= 50).length} | راسب: ${Object.values(grades).filter((sc) => (sc / exam.max_score) * 100 < 50).length}</span>
  </div>
  <script>window.onload = () => { setTimeout(() => { window.print(); }, 800); }<\/script>
</body>
</html>`;
    printHtml(html);
  };

  const sendAllWhatsApp = () => {
    const eligible = students.filter((s) => s.parent_phone && grades[s.id] !== undefined);
    if (eligible.length === 0) { showToast("لا يوجد طلاب برقم ولي أمر ودرجة مرصودة", "error"); return; }
    setConfirm({
      message: `إرسال النتائج لـ ${eligible.length} ولي أمر؟`,
      onConfirm: () => {
        eligible.forEach((s, i) => setTimeout(() => sendWhatsApp(s), i * 500));
        showToast(`جاري إرسال ${eligible.length} رسالة...`);
      },
    });
  };

  const validScores = Object.values(grades).filter((s) => typeof s === "number" && !isNaN(s));
  const gradedCount = validScores.length;
  const avg = gradedCount > 0 ? (validScores.reduce((a, b) => a + b, 0) / gradedCount).toFixed(1) : "—";
  const highest = gradedCount > 0 ? Math.max(...validScores) : "—";
  const lowest = gradedCount > 0 ? Math.min(...validScores) : "—";
  const passCount = validScores.filter((s) => (s / exam.max_score) * 100 >= 50).length;

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: "تم رصد", value: `${gradedCount}/${students.length}`, colorClass: "text-teal-400" },
    { label: "المتوسط", value: String(avg), colorClass: "text-amber-400" },
    { label: "أعلى درجة", value: String(highest), colorClass: "text-emerald-400" },
    { label: "أقل درجة", value: String(lowest), colorClass: "text-red-400" },
    { label: "ناجحون", value: String(passCount), colorClass: "text-emerald-400" },
  ];

  return (
    <>
      <style>{PRINT_STYLES}</style>

      {/* Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col gap-5 w-full max-w-sm sm:max-w-md shadow-2xl">
            <p className="text-sm font-semibold text-[var(--text-primary)] text-center m-0">{confirm.message}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => { confirm.onConfirm(); setConfirm(null); }}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold transition-colors cursor-pointer border-none"
              >نعم</button>
              <button
                onClick={() => setConfirm(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[var(--text-primary)] text-sm font-bold transition-colors cursor-pointer border-none"
              >لا</button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT ONLY */}
      <div className="exam-print hidden">
        <div className="ep-title">كشف درجات امتحان: {exam.title}</div>
        <div className="ep-sub">المجموعة: {groupName} | الدرجة النهائية: {exam.max_score} | التاريخ: {exam.exam_date} | عدد الطلاب: {students.length}</div>
        <hr className="ep-hr" />
        <table className="ep-table">
          <thead>
            <tr>
              <th>م</th><th>اسم الطالب</th><th>الكود</th><th>الدرجة</th>
              <th>من {exam.max_score}</th><th>النسبة%</th><th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const score = grades[s.id];
              const hasScore = score !== undefined && !isNaN(score);
              const pct = hasScore ? Math.round((score / exam.max_score) * 100) : null;
              const pass = pct !== null && pct >= 50;
              return (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td className="ep-name">{s.name}</td>
                  <td>{s.code || "—"}</td>
                  <td>{hasScore ? score : "—"}</td>
                  <td>{exam.max_score}</td>
                  <td>{pct !== null ? `${pct}%` : "—"}</td>
                  <td className={hasScore ? (pass ? "ep-pass" : "ep-fail") : ""}>{hasScore ? (pass ? "ناجح" : "راسب") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SCREEN ONLY */}
      <div className="exam-screen flex flex-col gap-5">

        {/* Header */}
        <div className="glass-panel p-3 sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="w-9 h-9 rounded-xl border border-[var(--border-color)] bg-white/5 text-[var(--text-primary)] cursor-pointer flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
              >
                <ArrowRight size={17} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold m-0 truncate">{exam.title}</h2>
                  {isDirty && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                      غير محفوظ
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] m-0">
                  الدرجة النهائية: {exam.max_score} | {exam.exam_date}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handlePrint} leftIcon={<Printer size={14} />} className="flex-1 sm:flex-none">طباعة</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || loading || !isDirty} leftIcon={<Save size={14} />} className="flex-1 sm:flex-none">
                {saving ? "جاري الحفظ..." : "حفظ الدرجات"}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-2 sm:gap-3 grid-cols-3 sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="glass-panel p-2 sm:p-4 text-center">
              <div className="text-[10px] sm:text-xs text-[var(--text-muted)] mb-0.5 sm:mb-1 leading-tight">{s.label}</div>
              <div className={`text-sm sm:text-xl font-bold ${s.colorClass}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <ScoreDistributionChart grades={grades} maxScore={exam.max_score} totalStudents={students.length} />

        {/* Table */}
        <div className="glass-panel p-3 sm:p-5">
          <div className="flex flex-col gap-2 mb-3 sm:mb-4 sm:flex-row sm:justify-between sm:items-center">
            <Input
              placeholder="بحث باسم الطالب أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-[260px]"
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleFillAllMax} className="flex-1 sm:flex-none text-xs sm:text-sm">
                إعطاء {exam.max_score} للجميع
              </Button>
              <Button variant="secondary" size="sm" onClick={handleClearAll} style={{ color: "#ef4444" }} className="flex-1 sm:flex-none text-xs sm:text-sm">
                تصفير
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="loading-wrapper"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p>لا يوجد طلاب مطابقين</p></div>
          ) : (
            <>
              {/* Single scrollable table for all screen sizes */}
              <div className="overflow-x-auto -mx-3 sm:-mx-5">
                <table className="students-table w-full" style={{ minWidth: 480 }}>
                  <thead>
                    <tr>
                      <th className="text-right px-3 sm:px-5">الطالب</th>
                      <th className="text-center">الدرجة / {exam.max_score}</th>
                      <th className="text-center">النسبة</th>
                      <th className="text-center">الحالة</th>
                      <th className="text-center">واتساب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((student) => {
                      const score = grades[student.id];
                      const hasScore = score !== undefined && !isNaN(score);
                      const pct = hasScore ? Math.round((score / exam.max_score) * 100) : null;
                      const pass = pct !== null && pct >= 50;
                      const pctClass = pct === null ? "text-[var(--text-muted)]" : pct >= 85 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400";
                      return (
                        <tr key={student.id}>
                          <td className="px-3 sm:px-5">
                            <div className="font-semibold text-[var(--text-primary)] whitespace-nowrap">{student.name}</div>
                            {student.code && <div className="text-xs text-[var(--text-muted)]">#{student.code}</div>}
                          </td>
                          <td className="text-center">
                            <input
                              type="number"
                              min={0}
                              max={exam.max_score}
                              value={hasScore ? score : ""}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              placeholder="—"
                              className="form-input text-center font-bold w-20 px-2 py-1.5"
                              style={{ borderColor: hasScore ? (pass ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)") : undefined }}
                            />
                          </td>
                          <td className="text-center">
                            {pct !== null ? (
                              <span className={`font-bold ${pctClass}`}>%{pct}</span>
                            ) : (
                              <span className="text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="text-center">
                            {hasScore ? (
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border whitespace-nowrap ${
                                pass ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/25" : "bg-red-500/12 text-red-400 border-red-500/25"
                              }`}>
                                {pass ? "ناجح" : "راسب"}
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() => sendWhatsApp(student)}
                              className="w-8 h-8 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 flex items-center justify-center transition-colors cursor-pointer mx-auto"
                              title="إرسال واتساب"
                            >
                              <WhatsAppIcon size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
