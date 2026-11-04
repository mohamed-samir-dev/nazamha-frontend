"use client";

import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { Exam, ExamGrade, Student } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Save,
  ArrowRight,
  Printer,
  Search,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { examsService } from "@/lib/services/examsService";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import { printHtml } from "@/lib/printHtml";
import { normalizeEgyptianPhoneForWhatsApp } from "@/lib/phoneUtils";
import { getErrorMessage } from "@/lib/errors";

function WhatsAppIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function normalizeArabicText(text: string): string {
  return text
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .trim()
    .toLowerCase();
}

interface GradeEntryTableProps {
  exam: Exam;
  students: Student[];
  groupName: string;
  teacherName: string;
  teacherId?: string;
  onBack: () => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

type FilterTab = "all" | "graded" | "ungraded" | "passed" | "failed";

// Fast, memoized individual student row to avoid re-rendering entire table on every keypress
interface StudentRowProps {
  student: Student;
  index: number;
  score: number | undefined;
  maxScore: number;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (studentId: string, value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  onSendWhatsApp: (student: Student) => void;
}

const StudentGradeRow = memo(function StudentGradeRow({
  student,
  index,
  score,
  maxScore,
  inputRef,
  onChange,
  onKeyDown,
  onSendWhatsApp,
}: StudentRowProps) {
  const hasScore = score !== undefined && !isNaN(score);
  const pct = hasScore && maxScore > 0 ? Math.round((score / maxScore) * 100) : null;
  const pass = pct !== null && pct >= 50;
  const pctColor =
    pct === null
      ? "text-[var(--text-muted)]"
      : pct >= 85
      ? "text-emerald-500 dark:text-emerald-400 font-bold"
      : pct >= 50
      ? "text-amber-500 dark:text-amber-400 font-semibold"
      : "text-red-500 dark:text-red-400 font-bold";

  return (
    <tr className="hover:bg-white/[0.02] transition-colors border-b border-[var(--border-color)]/40 last:border-none">
      <td className="text-center px-2 py-3 text-xs text-[var(--text-muted)] w-10 font-mono">
        {index + 1}
      </td>
      <td className="px-3 sm:px-4 py-3">
        <div className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] leading-tight">
          {student.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {student.code && (
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              #{student.code}
            </span>
          )}
          {student.parent_phone ? (
            <span className="text-[10px] text-teal-500/80 font-mono" dir="ltr">
              {student.parent_phone}
            </span>
          ) : (
            <span className="text-[10px] text-amber-500/70">بدون هاتف</span>
          )}
        </div>
      </td>
      <td className="text-center px-2 py-3">
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={maxScore}
          step="any"
          value={hasScore ? score : ""}
          onChange={(e) => onChange(student.id, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, index)}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="—"
          className="form-input text-center font-bold text-xs sm:text-sm w-16 sm:w-20 px-2 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500"
          style={{
            borderColor: hasScore
              ? pass
                ? "rgba(16,185,129,0.5)"
                : "rgba(239,68,68,0.5)"
              : undefined,
          }}
          aria-label={`درجة الطالب ${student.name}`}
        />
      </td>
      <td className="text-center px-2 py-3">
        {pct !== null ? (
          <span className={`text-xs sm:text-sm ${pctColor}`}>%{pct}</span>
        ) : (
          <span className="text-[var(--text-muted)] text-xs">—</span>
        )}
      </td>
      <td className="text-center px-2 py-3">
        {hasScore ? (
          <span
            className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full font-semibold border whitespace-nowrap ${
              pass
                ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/30"
            }`}
          >
            {pass ? "ناجح" : "راسب"}
          </span>
        ) : (
          <span className="text-[var(--text-muted)] text-xs">—</span>
        )}
      </td>
      <td className="text-center px-2 py-3">
        <button
          type="button"
          onClick={() => onSendWhatsApp(student)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer mx-auto border ${
            student.parent_phone
              ? "bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30"
              : "bg-white/5 text-[var(--text-muted)] opacity-40 border-transparent cursor-not-allowed"
          }`}
          title={
            student.parent_phone
              ? `إرسال النتيجة لواتساب ولي أمر ${student.name}`
              : "لا يوجد رقم ولي أمر مسجل"
          }
          aria-label={`إرسال واتساب لولي أمر ${student.name}`}
          disabled={!student.parent_phone}
        >
          <WhatsAppIcon size={15} />
        </button>
      </td>
    </tr>
  );
});

export function GradeEntryTable({
  exam,
  students,
  groupName,
  teacherName,
  teacherId,
  onBack,
  showToast,
}: GradeEntryTableProps) {
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [savedGrades, setSavedGrades] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const [confirm, setConfirm] = useState<{
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if state is dirty by comparing keys and values efficiently without JSON.stringify
  const isDirty = useMemo(() => {
    const gradeKeys = Object.keys(grades);
    const savedKeys = Object.keys(savedGrades);
    if (gradeKeys.length !== savedKeys.length) return true;
    for (const key of gradeKeys) {
      if (grades[key] !== savedGrades[key]) return true;
    }
    return false;
  }, [grades, savedGrades]);

  // Load existing exam grades
  useEffect(() => {
    let cancelled = false;
    async function loadGrades() {
      try {
        const data = await examsService.getGradesByExamId(exam.id);
        if (cancelled) return;
        const map: Record<string, number> = {};
        data.forEach((g) => {
          map[g.student_id] = g.score;
        });
        setGrades(map);
        setSavedGrades(map);
      } catch (err) {
        if (!cancelled) {
          showToast(getErrorMessage(err, "حدث خطأ أثناء تحميل الدرجات"), "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadGrades();
    return () => {
      cancelled = true;
    };
  }, [exam.id, showToast]);

  // Browser beforeunload protection for unsaved grades
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Modal ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConfirm(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBack = () => {
    if (isDirty) {
      setConfirm({
        message: "لديك تغييرات غير محفوظة في درجات الامتحان. هل تريد المغادرة وتجاهلها؟",
        isDanger: true,
        onConfirm: onBack,
      });
      return;
    }
    onBack();
  };

  const handleGradeChange = useCallback(
    (studentId: string, value: string) => {
      const num = value === "" ? NaN : Number(value);
      setGrades((prev) => {
        const next = { ...prev };
        if (isNaN(num)) {
          delete next[studentId];
        } else {
          next[studentId] = Math.min(Math.max(0, num), exam.max_score);
        }
        return next;
      });
    },
    [exam.max_score]
  );

  // Keyboard navigation: Enter / Down Arrow moves to next student row; Up Arrow to previous
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextInput = inputRefs.current[index + 1];
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevInput = inputRefs.current[index - 1];
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }
    },
    []
  );

  const handleFillAllMax = () => {
    setConfirm({
      message: `رصد الدرجة النهائية (${exam.max_score}) لجميع طلاب المجموعة؟`,
      onConfirm: () => {
        const map: Record<string, number> = {};
        students.forEach((s) => {
          map[s.id] = exam.max_score;
        });
        setGrades(map);
      },
    });
  };

  const handleClearAll = () => {
    setConfirm({
      message: "هل أنت متأكد من مسح جميع الدرجات المرصودة؟",
      isDanger: true,
      onConfirm: () => setGrades({}),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave: Omit<ExamGrade, "id" | "created_at">[] = Object.entries(grades).map(
        ([studentId, score]) => ({
          exam_id: exam.id,
          student_id: studentId,
          score,
        })
      );

      await examsService.upsertGrades(exam.id, toSave, teacherId);
      setSavedGrades({ ...grades });
      showToast("تم حفظ الدرجات وتحديث السجلات بنجاح ✓", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "حدث خطأ أثناء حفظ الدرجات"), "error");
    } finally {
      setSaving(false);
    }
  };

  const buildWhatsAppMsg = (student: Student, score: number) => {
    const pct = exam.max_score > 0 ? Math.round((score / exam.max_score) * 100) : 0;
    const pass = pct >= 50;
    const stars = pct >= 85 ? "⭐⭐⭐" : pct >= 70 ? "⭐⭐" : pct >= 50 ? "⭐" : "";
    return [
      `السلام عليكم ورحمة الله وبركاته 🌟`,
      ``,
      `ولي أمر الطالب/ة: *${student.name}*`,
      ``,
      `📋 *نتيجة امتحان: ${exam.title}*`,
      exam.exam_date ? `📅 التاريخ: ${exam.exam_date}` : null,
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
      `— أستاذ/ ${teacherName}`,
    ]
      .filter((line) => line !== null)
      .join("\n");
  };

  const sendWhatsApp = (student: Student) => {
    const rawPhone = student.parent_phone;
    if (!rawPhone) {
      showToast("لا يوجد رقم هاتف ولي أمر مسجل لهذا الطالب", "error");
      return;
    }
    const normalized = normalizeEgyptianPhoneForWhatsApp(rawPhone);
    if (!normalized) {
      showToast("رقم هاتف ولي الأمر غير صالح (يجب أن يكون رقم مصري صحيح)", "error");
      return;
    }
    const score = grades[student.id];
    if (score === undefined || isNaN(score)) {
      showToast("لم يتم رصد درجة هذا الطالب بعد", "error");
      return;
    }
    const msg = buildWhatsAppMsg(student, score);
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Restored original print design (printed in-place on the same page)
  const handlePrint = () => {
    const rows = students
      .map((s, i) => {
        const score = grades[s.id];
        const hasScore = score !== undefined && !isNaN(score);
        const pct = hasScore && exam.max_score > 0 ? Math.round((score / exam.max_score) * 100) : null;
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
      })
      .join("");

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
    thead { display: table-header-group; }
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
  <div class="subtitle">المجموعة: ${groupName} | الدرجة النهائية: ${exam.max_score} | التاريخ: ${exam.exam_date || "—"} | عدد الطلاب: ${students.length}</div>
  <table>
    <thead><tr><th>#</th><th style="text-align:right">الطالب</th><th>الدرجة</th><th>من</th><th>النسبة</th><th>الحالة</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>تم الإنشاء: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</span>
    <span>ناجح: ${Object.values(grades).filter((sc) => (sc / exam.max_score) * 100 >= 50).length} | راسب: ${Object.values(grades).filter((sc) => (sc / exam.max_score) * 100 < 50).length}</span>
  </div>
</body>
</html>`;

    printHtml(html, { inPlace: true });
  };

  // Memoized stats calculation
  const { validScores, avg, highest, lowest, passCount, gradedCount } = useMemo(() => {
    const scores = Object.values(grades).filter(
      (s): s is number => typeof s === "number" && !isNaN(s)
    );
    const count = scores.length;
    const average = count > 0 ? (scores.reduce((a, b) => a + b, 0) / count).toFixed(1) : "—";
    const max = count > 0 ? Math.max(...scores) : "—";
    const min = count > 0 ? Math.min(...scores) : "—";
    const passed = scores.filter((s) => (s / exam.max_score) * 100 >= 50).length;

    return {
      validScores: scores,
      avg: average,
      highest: max,
      lowest: min,
      passCount: passed,
      gradedCount: count,
    };
  }, [grades, exam.max_score]);

  // Memoized filtering with Arabic normalization
  const filteredStudents = useMemo(() => {
    const q = normalizeArabicText(searchQuery);

    return students.filter((s) => {
      // Tab filter
      const score = grades[s.id];
      const hasScore = score !== undefined && !isNaN(score);
      const isPass = hasScore && (score / exam.max_score) * 100 >= 50;

      if (activeTab === "graded" && !hasScore) return false;
      if (activeTab === "ungraded" && hasScore) return false;
      if (activeTab === "passed" && (!hasScore || !isPass)) return false;
      if (activeTab === "failed" && (!hasScore || isPass)) return false;

      // Search filter
      if (!q) return true;
      const normalizedName = normalizeArabicText(s.name);
      const code = (s.code || "").toLowerCase();
      const phone = (s.parent_phone || "").replace(/\D/g, "");
      return normalizedName.includes(q) || code.includes(q) || phone.includes(q);
    });
  }, [students, searchQuery, activeTab, grades, exam.max_score]);

  const statsCards = [
    { label: "تم رصد", value: `${gradedCount}/${students.length}`, color: "text-teal-500 dark:text-teal-400" },
    { label: "المتوسط", value: String(avg), color: "text-amber-500 dark:text-amber-400" },
    { label: "أعلى درجة", value: String(highest), color: "text-emerald-500 dark:text-emerald-400" },
    { label: "أقل درجة", value: String(lowest), color: "text-red-500 dark:text-red-400" },
    { label: "ناجحون", value: `${passCount}`, color: "text-emerald-500 dark:text-emerald-400" },
  ];

  return (
    <>
      {/* Confirmation Modal */}
      {confirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setConfirm(null)}
        >
          <div
            className="glass-panel p-6 sm:p-7 rounded-2xl flex flex-col gap-5 w-full max-w-sm shadow-2xl border border-[var(--border-color)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-[var(--text-primary)] text-center m-0 leading-relaxed">
              {confirm.message}
            </p>
            <div className="flex gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => {
                  confirm.onConfirm();
                  setConfirm(null);
                }}
                className={`px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold transition-all cursor-pointer border-none shadow-md ${
                  confirm.isDanger
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                    : "bg-teal-500 hover:bg-teal-400 shadow-teal-500/20"
                }`}
              >
                تأكيد
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[var(--text-primary)] text-xs sm:text-sm font-bold transition-colors cursor-pointer border-none"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Screen Content */}
      <div className="flex flex-col gap-4 sm:gap-5 w-full">
        {/* Top Header Card */}
        <div className="glass-panel p-3.5 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleBack}
                aria-label="الرجوع لقائمة الامتحانات"
                className="w-9 h-9 rounded-xl border border-[var(--border-color)] bg-white/5 text-[var(--text-primary)] cursor-pointer flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
              >
                <ArrowRight size={17} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-lg font-bold m-0 text-[var(--text-primary)] truncate">
                    {exam.title}
                  </h2>
                  {isDirty ? (
                    <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 shrink-0 font-bold animate-pulse">
                      تعديلات غير محفوظة!
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      محفوظ
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
                  المجموعة: {groupName || "عامة"} | الدرجة النهائية: {exam.max_score} {exam.exam_date ? `| ${exam.exam_date}` : ""}
                </p>
              </div>
            </div>

            {/* Action buttons (Print and Save) */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer size={14} />}
                className="flex-1 sm:flex-none text-xs"
              >
                طباعة الكشف
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || loading || !isDirty}
                leftIcon={saving ? undefined : <Save size={14} />}
                className={`flex-1 sm:flex-none text-xs font-bold transition-all shadow-md ${
                  isDirty
                    ? "bg-teal-500 hover:bg-teal-400 text-white shadow-teal-500/30 ring-2 ring-teal-400/40"
                    : "opacity-80"
                }`}
              >
                {saving ? "جاري الحفظ..." : "حفظ الدرجات"}
              </Button>
            </div>
          </div>
        </div>

        {/* Important notice: Must click Save Grades */}
        {isDirty ? (
          <div className="flex items-center gap-2.5 p-3 sm:p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-500 dark:text-amber-400 text-xs sm:text-sm font-bold shadow-sm transition-all">
            <AlertTriangle size={18} className="shrink-0 text-amber-500 animate-pulse" />
            <div className="flex-1 leading-normal">
              <strong>تنبيه مهم:</strong> قمت بإجراء تعديلات على درجات الطلاب! يجب الضغط على زر <strong>«حفظ الدرجات»</strong> بالأعلى لتثبيت التعديلات في النظام قبل مغادرة الصفحة.
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-teal-500/[0.06] border border-teal-500/20 text-xs text-[var(--text-secondary)]">
            <Info size={16} className="shrink-0 text-teal-400" />
            <div className="flex-1 leading-normal">
              <strong>تذكير للمعلم:</strong> بعد الانتهاء من رصد أو تعديل درجات الطلاب، احرص دائماً على الضغط على زر <strong>«حفظ الدرجات»</strong> بالأعلى لاعتماد الدرجات في سجلات النظام وسجلات أولياء الأمور.
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {statsCards.map((s) => (
            <div key={s.label} className="glass-panel p-2.5 sm:p-4 text-center flex flex-col justify-center">
              <div className="text-[10px] sm:text-xs text-[var(--text-muted)] mb-0.5 font-medium">{s.label}</div>
              <div className={`text-sm sm:text-xl font-extrabold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Score Distribution Chart */}
        <ScoreDistributionChart
          grades={grades}
          maxScore={exam.max_score}
          totalStudents={students.length}
        />

        {/* Students Table Panel */}
        <div className="glass-panel p-3.5 sm:p-5 flex flex-col gap-3">
          {/* Search, Filter Tabs, and Bulk Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                <Input
                  placeholder="بحث باسم الطالب، الكود، أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8 text-xs sm:text-sm w-full"
                />
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleFillAllMax}
                  leftIcon={<Sparkles size={13} className="text-teal-400" />}
                  className="text-xs"
                >
                  رصد {exam.max_score} للجميع
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearAll}
                  leftIcon={<RotateCcw size={13} className="text-red-400" />}
                  className="text-xs text-red-500 hover:text-red-400"
                >
                  تصفير
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {(
                [
                  { id: "all", label: `الكل (${students.length})` },
                  { id: "graded", label: `تم الرصد (${gradedCount})` },
                  { id: "ungraded", label: `لم يُرصد (${Math.max(0, students.length - gradedCount)})` },
                  { id: "passed", label: `ناجح (${passCount})` },
                  { id: "failed", label: `راسب (${gradedCount - passCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap border cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-teal-500/15 border-teal-500/40 text-teal-400"
                      : "bg-white/[0.02] border-[var(--border-color)]/60 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="loading-wrapper py-16 flex flex-col items-center justify-center gap-2">
              <div className="spinner" />
              <span className="text-xs text-[var(--text-muted)]">جاري تحميل الدرجات...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
              <p className="font-semibold m-0">لا يوجد طلاب مطابقين للبحث أو الفلتر المحدد</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-teal-400 hover:underline cursor-pointer text-xs"
                >
                  مسح كلمة البحث
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3.5 sm:-mx-5">
              <table className="w-full border-collapse" style={{ minWidth: 540 }}>
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[11px] sm:text-xs text-[var(--text-muted)] bg-white/[0.01]">
                    <th className="py-2.5 px-2 text-center w-10 font-bold">#</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right font-bold">اسم الطالب</th>
                    <th className="py-2.5 px-2 text-center w-24 sm:w-28 font-bold">
                      الدرجة / {exam.max_score}
                    </th>
                    <th className="py-2.5 px-2 text-center w-20 font-bold">النسبة</th>
                    <th className="py-2.5 px-2 text-center w-24 font-bold">الحالة</th>
                    <th className="py-2.5 px-2 text-center w-16 font-bold">واتساب</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, i) => (
                    <StudentGradeRow
                      key={student.id}
                      student={student}
                      index={i}
                      score={grades[student.id]}
                      maxScore={exam.max_score}
                      inputRef={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      onChange={handleGradeChange}
                      onKeyDown={handleInputKeyDown}
                      onSendWhatsApp={sendWhatsApp}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick Helper text */}
          <div className="pt-2 border-t border-[var(--border-color)]/30 flex items-center justify-between text-[11px] text-[var(--text-muted)] flex-wrap gap-2">
            <span>💡 نصيحة: يمكنك استخدام مفتاح <strong>Enter</strong> أو <strong>الأسهم (↓ / ↑)</strong> للتنقل السريع بين درجات الطلاب.</span>
            <span>عدد الطلاب المعروضين: {filteredStudents.length}</span>
          </div>
        </div>
      </div>
    </>
  );
}
