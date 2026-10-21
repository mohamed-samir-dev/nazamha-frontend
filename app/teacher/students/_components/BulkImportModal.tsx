"use client";

import { useState, useRef } from "react";
import { X, Upload, AlertCircle, CheckCircle, Loader2, Download } from "lucide-react";
import { Grade, Group, Student } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/errors";
import { parseCsv } from "@/lib/parseCsv";
import { validateStudentName } from "@/lib/utils/studentName";

const CHUNK_SIZE = 100; // طلاب لكل request

interface ParsedRow {
  name: string;
  grade_id: string | null;
  group_id: string | null;
  parent_phone: string;
  subscription_start_month: number;
  subscription_start_year: number;
  _error?: string;
}

interface Props {
  grades: Grade[];
  groups: Group[];
  activeMonths: number[];
  onClose: () => void;
  onDone: (students: Student[]) => void;
}

export function parseCSV(text: string, grades: Grade[], groups: Group[], defaultMonth: number, defaultYear: number): ParsedRow[] {
  const lines = parseCsv(text);
  // تخطي الـ header لو موجود
  const start = /^(اسم الطالب|name)$/i.test(lines[0]?.[0] || "") ? 1 : 0;

  return lines.slice(start).map((cols, index) => {
    const name = cols[0] || "";
    const nameError = validateStudentName(name);

    const gradeRaw = cols[1] || "";
    const groupRaw = cols[2] || "";
    const phone    = cols[3] || "";
    const month    = cols[4] ? Number(cols[4]) : defaultMonth;
    const year     = cols[5] ? Number(cols[5]) : defaultYear;

    const grade = grades.find((g) => g.name === gradeRaw || g.id === gradeRaw);
    const group = groups.find((g) => g.name === groupRaw || g.id === groupRaw);

    const phoneErr = phone && !/^01\d{9}$/.test(phone) ? "رقم هاتف غير صحيح" : "";

    const error = nameError || phoneErr || (!grade && gradeRaw ? `السنة "${gradeRaw}" غير موجودة` : "")
      || (!group && groupRaw ? `المجموعة "${groupRaw}" غير موجودة` : "")
      || (group && grade && group.grade_id !== grade.id ? "المجموعة لا تتبع السنة المحددة" : "")
      || (!Number.isInteger(month) || month < 1 || month > 12 ? "شهر البداية غير صحيح" : "")
      || (!Number.isInteger(year) || year < 2000 || year > 2100 ? "سنة البداية غير صحيحة" : "");
    return {
      name,
      grade_id: grade?.id || null,
      group_id: group?.id || null,
      parent_phone: phone,
      subscription_start_month: month,
      subscription_start_year: year,
      _error: error ? `الصف ${index + start + 1}: ${error}` : "",
    };
  });
}

export function BulkImportModal({ grades, groups, activeMonths, onClose, onDone }: Props) {
  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear  = now.getFullYear();

  const fileRef = useRef<HTMLInputElement>(null);
  const importState = useRef({ completedChunks: 0, students: [] as Student[], keys: [] as string[] });
  const importing = useRef(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);       // 0-100
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [insertedCount, setInsertedCount] = useState(0);

  const validRows    = rows.filter((r) => !r._error && r.name);
  const invalidRows  = rows.filter((r) => r._error);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || importing.current) return;
    importState.current = { completedChunks: 0, students: [], keys: [] };
    setFileName(file.name);
    setStatus("idle");
    setProgress(0);
    setInsertedCount(0);
    setRows([]);
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try { setRows(parseCSV(text, grades, groups, defaultMonth, defaultYear)); }
      catch (error) { setStatus("error"); setErrorMsg(getErrorMessage(error, "تعذر قراءة الملف")); }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    if (!validRows.length || importing.current) return;
    importing.current = true;
    setStatus("running");
    setErrorMsg("");

    const allInserted = importState.current.students;
    const chunks: ParsedRow[][] = [];
    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      chunks.push(validRows.slice(i, i + CHUNK_SIZE));
    }

    try {
      for (let ci = importState.current.completedChunks; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        const key = importState.current.keys[ci] ||= crypto.randomUUID();
        const res = await StudentsService.bulkAddStudents(
          chunk.map((r) => ({
            name: r.name,
            grade_id: r.grade_id,
            group_id: r.group_id,
            parent_phone: r.parent_phone || undefined,
            subscription_start_month: r.subscription_start_month,
            subscription_start_year: r.subscription_start_year,
          })), key
        );
        allInserted.push(...res.students);
        importState.current.completedChunks = ci + 1;
        setInsertedCount(allInserted.length);
        setProgress(Math.round(((ci + 1) / chunks.length) * 100));
      }
      setStatus("done");
      onDone(allInserted);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(getErrorMessage(err, "حدث خطأ أثناء استيراد الطلاب."));
    } finally {
      importing.current = false;
    }
  };

  const downloadTemplate = () => {
    const header = "اسم الطالب,السنة الدراسية,المجموعة,هاتف ولي الأمر,شهر البداية,سنة البداية";
    const example = `أحمد محمد علي,${grades[0]?.name || "الصف الأول"},${groups[0]?.name || ""},01012345678,9,${defaultYear}`;
    const blob = new Blob(["\uFEFF" + header + "\n" + example], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "template_students.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(4px)" }}>
      <div className="glass-panel panel-content" style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Upload size={18} style={{ color: "var(--color-teal)" }} />
            استيراد طلاب من CSV
          </h2>
          <button disabled={status === "running"} onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={22} />
          </button>
        </div>

        {/* Template download */}
        <button onClick={downloadTemplate} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "var(--color-teal)", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", marginBottom: "1rem" }}>
          <Download size={14} /> تحميل نموذج CSV
        </button>

        {/* File input */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: "2px dashed rgba(255,255,255,0.12)", borderRadius: "10px", padding: "1.5rem", textAlign: "center", cursor: "pointer", marginBottom: "1rem", background: "rgba(255,255,255,0.02)" }}
        >
          <Upload size={28} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>{fileName || "اضغط لاختيار ملف CSV"}</p>
          <input disabled={status === "running"} ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: "none" }} />
        </div>

        {/* Preview */}
        {rows.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", fontSize: "0.85rem" }}>
              <span style={{ color: "#10b981" }}>✓ {validRows.length} طالب صحيح</span>
              {invalidRows.length > 0 && <span style={{ color: "#ef4444" }}>✗ {invalidRows.length} صف به خطأ</span>}
            </div>

            {/* أول 5 صفوف preview */}
            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              {rows.slice(0, 5).map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: "0.82rem" }}>
                  {r._error
                    ? <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
                    : <CheckCircle size={13} style={{ color: "#10b981", flexShrink: 0 }} />
                  }
                  <span style={{ flex: 1, color: r._error ? "#f87171" : "var(--text-primary)" }}>{r.name || "—"}</span>
                  {r._error && <span style={{ color: "#f87171", fontSize: "0.75rem" }}>{r._error}</span>}
                </div>
              ))}
              {rows.length > 5 && (
                <div style={{ padding: "5px 12px", fontSize: "0.78rem", color: "var(--text-muted)" }}>... و {rows.length - 5} صف آخر</div>
              )}
            </div>
            {invalidRows.length > 0 && <div role="alert" className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-300 space-y-2">
              <p>لن يتم استيراد الصفوف التالية. صحح الملف أو استورد الصفوف الصحيحة فقط:</p>
              {invalidRows.map((row, index) => <p key={index}>{row._error}</p>)}
            </div>}
          </div>
        )}

        {/* Progress */}
        {status === "running" && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> جاري الاستيراد...</span>
              <span>{insertedCount} / {validRows.length} طالب</span>
            </div>
            <div style={{ height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-teal)", borderRadius: "99px", transition: "width 0.3s ease" }} />
            </div>
          </div>
        )}

        {status === "done" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px", marginBottom: "1rem", color: "#10b981", fontSize: "0.88rem" }}>
            <CheckCircle size={16} />
            تم إضافة {insertedCount} طالب بنجاح!
          </div>
        )}

        {status === "error" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", marginBottom: "1rem", color: "#f87171", fontSize: "0.88rem" }}>
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <Button variant="secondary" disabled={status === "running"} onClick={onClose}>إغلاق</Button>
          {status !== "done" && (
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={!validRows.length || status === "running"}
              isLoading={status === "running"}
              leftIcon={<Upload size={16} />}
            >
              استيراد {validRows.length > 0 ? `(${validRows.length} طالب)` : ""}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
