"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Printer, X } from "lucide-react";
import { Grade, Group } from "@/lib/types";
import { formatTimeTo12H } from "../_utils/sessionDates";

const months = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export interface AttendanceReportSelection {
  gradeId: string;
  groupId: string;
  gradeName?: string;
  groupName?: string;
}

interface Props {
  month: number;
  year: number;
  grades?: Grade[];
  groups?: Group[];
  initialGradeId?: string;
  initialGroupId?: string;
  onClose: () => void;
  onReport: (month: number, year: number, selection?: AttendanceReportSelection) => Promise<void>;
}

export function AttendanceReportModal(p: Props) {
  const [month, setMonth] = useState(p.month);
  const [year, setYear] = useState(p.year);
  const [gradeId, setGradeId] = useState(p.initialGradeId || "all");
  const [groupId, setGroupId] = useState(p.initialGroupId || "all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const close = () => {
    if (!pending.current) {
      dialog.current?.close();
      p.onClose();
    }
  };

  const grades = p.grades || [];
  const groups = p.groups || [];

  const filteredGroups = groups.filter(
    (g) => gradeId === "all" || g.grade_id === gradeId
  );

  const handleGradeChange = (newGradeId: string) => {
    setGradeId(newGradeId);
    setGroupId("all");
  };

  async function report() {
    if (pending.current) return;
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setError("اختر سنة صحيحة");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");

    const selectedGrade = grades.find((g) => g.id === gradeId);
    const selectedGroup = groups.find((g) => g.id === groupId);
    const selection: AttendanceReportSelection = {
      gradeId,
      groupId,
      gradeName: selectedGrade ? selectedGrade.name : undefined,
      groupName: selectedGroup ? selectedGroup.name : undefined,
    };

    try {
      if (p.grades !== undefined || p.groups !== undefined) {
        await p.onReport(month, year, selection);
      } else {
        await (p.onReport as any)(month, year);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر عرض التقرير");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="modal-content"
      aria-labelledby="attendance-report-title"
      style={{
        maxWidth: 420,
        margin: "auto",
        padding: "1.5rem",
        color: "var(--text-primary)",
      }}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 id="attendance-report-title" className="text-base font-bold flex items-center gap-2 m-0 text-slate-100">
          <Printer size={18} className="text-teal-400 shrink-0" />
          <span>طباعة تقرير الحضور</span>
        </h3>
        <button
          type="button"
          onClick={close}
          disabled={busy}
          className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1 rounded-md"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-3.5 mb-4">
        {/* Month and Year */}
        <div className="flex gap-3">
          <label className="flex-1 min-w-0 text-xs font-semibold text-slate-300" htmlFor="attendance-report-month">
            الشهر
            <select
              id="attendance-report-month"
              className="form-input mt-1 w-full text-sm"
              value={month}
              disabled={busy}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {months.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-0 text-xs font-semibold text-slate-300" htmlFor="attendance-report-year">
            السنة
            <input
              id="attendance-report-year"
              className="form-input mt-1 w-full text-sm"
              type="number"
              min={2000}
              max={2100}
              value={year}
              disabled={busy}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
        </div>

        {/* Academic Year (Grade) */}
        {grades.length > 0 && (
          <label className="text-xs font-semibold text-slate-300" htmlFor="attendance-report-grade">
            السنة الدراسية
            <select
              id="attendance-report-grade"
              className="form-input mt-1 w-full text-sm"
              value={gradeId}
              disabled={busy}
              onChange={(e) => handleGradeChange(e.target.value)}
            >
              <option value="all">كل السنين الدراسية</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Study Group */}
        {groups.length > 0 && (
          <label className="text-xs font-semibold text-slate-300" htmlFor="attendance-report-group">
            المجموعة الدراسية
            <select
              id="attendance-report-group"
              className="form-input mt-1 w-full text-sm"
              value={groupId}
              disabled={busy}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="all">كل المجموعات</option>
              {filteredGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} {g.day_of_week ? `(${g.day_of_week}${g.time ? ` - ${formatTimeTo12H(g.time)}` : ""})` : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="text-red-400 text-xs mb-3 font-medium">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-primary flex-1 justify-center gap-1.5"
          disabled={busy}
          onClick={() => void report()}
        >
          {busy ? (
            <>
              <LoaderCircle size={15} className="animate-spin shrink-0" />
              <span>جاري التجهيز…</span>
            </>
          ) : (
            <span>عرض التقرير</span>
          )}
        </button>
        <button
          type="button"
          className="btn btn-secondary flex-1 justify-center"
          disabled={busy}
          onClick={close}
        >
          إلغاء
        </button>
      </div>
    </dialog>
  );
}
