"use client";

import { useEffect, useRef, useState } from "react";
import { PlusCircle, X, Calendar, Clock, BookOpen, AlertCircle, LoaderCircle, Sparkles } from "lucide-react";
import { Grade, Group } from "@/lib/types";
import { AttendanceService } from "@/lib/services/attendanceService";
import { getTodayCairo } from "@/lib/utils/dateUtils";
import { formatTimeTo12H } from "../_utils/sessionDates";

const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const QUICK_TITLES = [
  "مراجعة شهرية",
  "تعويض حصة",
  "حل تدريبات",
  "ليلة امتحان",
  "ورشة عمل",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: {
    id: string;
    group_id: string;
    session_date: string;
    time: string;
    cancelled?: boolean;
    is_extra?: boolean;
    title?: string;
  }) => void;
  groups: Group[];
  grades?: Grade[];
  initialGroupId?: string;
}

export function AddExtraSessionModal({
  isOpen,
  onClose,
  onSuccess,
  groups,
  grades = [],
  initialGroupId,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);

  // Group selection
  const defaultGroupId = (initialGroupId && initialGroupId !== "all")
    ? initialGroupId
    : (groups[0]?.id || "");

  const [groupId, setGroupId] = useState(defaultGroupId);
  const selectedGroup = groups.find((g) => g.id === groupId);

  // Date & Time
  const today = getTodayCairo();
  const [sessionDate, setSessionDate] = useState(today);
  const [time, setTime] = useState(selectedGroup?.time || "16:00");
  const [title, setTitle] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Sync default time when group changes
  useEffect(() => {
    if (selectedGroup?.time) {
      setTime(selectedGroup.time);
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (isOpen) {
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => {
    if (!pending.current) {
      setError("");
      dialog.current?.close();
      onClose();
    }
  };

  // Helper to validate selected day against group days
  const getDayValidation = (dateStr: string, group: Group | undefined) => {
    if (!dateStr) return null;
    if (dateStr < today) {
      return "لا يمكن اختيار تاريخ سابق لليوم";
    }
    if (!group) return null;

    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dayName = DAYS_AR[dateObj.getUTCDay()];

    const scheduledDays = (group.day_of_week || "")
      .split(/\s*[,،]\s*|\s+/)
      .map((d) => d.trim().replace(/^الاثنين$/, "الإثنين"))
      .filter(Boolean);

    if (scheduledDays.includes(dayName)) {
      return `يوم (${dayName}) هو يوم حصة أساسية مسجلة لهذه المجموعة`;
    }

    const alreadyExists = group.attendance_sessions?.some(
      (s) => s.session_date === dateStr && s.is_extra && !s.cancelled
    );
    if (alreadyExists) {
      return "توجد بالفعل حصة إضافية لهذه المجموعة في هذا التاريخ";
    }

    return null;
  };

  const validationError = getDayValidation(sessionDate, selectedGroup);

  const selectedDateArabic = (() => {
    if (!sessionDate) return "";
    try {
      const [y, m, d] = sessionDate.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return sessionDate;
    }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current) return;

    if (!groupId) {
      setError("يرجى اختيار المجموعة");
      return;
    }

    if (!sessionDate) {
      setError("يرجى تحديد تاريخ الحصة");
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      setError("يرجى تحديد وقت صالح للحصة (HH:mm)");
      return;
    }

    pending.current = true;
    setBusy(true);
    setError("");

    try {
      const res = await AttendanceService.createExtraSession({
        group_id: groupId,
        session_date: sessionDate,
        time,
        title: title.trim() || undefined,
      });

      pending.current = false;
      setBusy(false);
      onSuccess(res.session);
      close();
    } catch (err: any) {
      pending.current = false;
      setBusy(false);
      const msg = err?.response?.data?.error || err?.message || "تعذر إضافة الحصة الإضافية";
      setError(msg);
    }
  };

  return (
    <dialog
      ref={dialog}
      className="modal-content w-[94vw] max-w-[480px] p-4 sm:p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
      aria-labelledby="add-extra-session-title"
      style={{
        margin: "auto",
        color: "var(--text-primary)",
      }}
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          id="add-extra-session-title"
          className="text-base font-bold flex items-center gap-2 m-0 text-slate-100"
        >
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
            <PlusCircle size={16} />
          </div>
          <span>إضافة حصة إضافية</span>
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* Group Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5" htmlFor="extra-group">
            <BookOpen size={13} className="text-teal-400" />
            المجموعة
          </label>
          <select
            id="extra-group"
            className="form-input w-full text-sm"
            value={groupId}
            disabled={busy}
            onChange={(e) => {
              setGroupId(e.target.value);
              setError("");
            }}
          >
            {groups.length === 0 && <option value="">لا توجد مجموعات متاحة</option>}
            {groups.map((g) => {
              const grade = grades.find((gr) => gr.id === g.grade_id);
              return (
                <option key={g.id} value={g.id}>
                  {g.name} {grade ? `(${grade.name})` : ""} — {g.day_of_week}
                </option>
              );
            })}
          </select>
        </div>

        {/* Date & Time Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5" htmlFor="extra-date">
              <Calendar size={13} className="text-teal-400" />
              تاريخ الحصة
            </label>
            <input
              id="extra-date"
              type="date"
              min={today}
              className="form-input w-full text-sm"
              value={sessionDate}
              disabled={busy}
              onChange={(e) => {
                setSessionDate(e.target.value);
                setError("");
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5" htmlFor="extra-time">
              <Clock size={13} className="text-teal-400" />
              وقت البدء
            </label>
            <input
              id="extra-time"
              type="time"
              className="form-input w-full text-sm"
              value={time}
              disabled={busy}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Selected date preview */}
        {selectedDateArabic && (
          <div className="text-[0.75rem] text-teal-400/90 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
            <Calendar size={12} className="shrink-0" />
            <span>{selectedDateArabic} {time ? `— الساعة ${formatTimeTo12H(time)}` : ""}</span>
          </div>
        )}

        {/* Title / Description */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5" htmlFor="extra-title">
            <Sparkles size={13} className="text-teal-400" />
            عنوان / وصف الحصة (اختياري)
          </label>
          <input
            id="extra-title"
            type="text"
            className="form-input w-full text-sm"
            placeholder="مثال: مراجعة نهائية، حل تدريبات..."
            value={title}
            disabled={busy}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
          />
          {/* Quick chip buttons */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {QUICK_TITLES.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`text-[0.68rem] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                  title === chip
                    ? "bg-teal-500 text-white border-teal-500"
                    : "bg-white/[0.04] text-slate-300 border-white/[0.08] hover:border-teal-500/40 hover:text-teal-300"
                }`}
                onClick={() => setTitle(chip)}
                disabled={busy}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Validation or API error display */}
        {(validationError || error) && (
          <div className="text-[0.78rem] text-red-400 bg-red-500/10 border border-red-500/25 px-2.5 py-2 rounded-md flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2.5 mt-3">
          <button
            type="button"
            className="btn btn-secondary w-full sm:flex-1 justify-center min-h-[42px] rounded-xl text-sm font-semibold"
            disabled={busy}
            onClick={close}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="btn btn-primary w-full sm:flex-1 justify-center gap-1.5 min-h-[42px] rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-[0_4px_14px_rgba(99,102,241,0.25)]"
            disabled={busy || !!validationError || !groupId}
          >
            {busy ? (
              <>
                <LoaderCircle size={15} className="animate-spin shrink-0" />
                <span>جاري الحفظ…</span>
              </>
            ) : (
              <>
                <PlusCircle size={15} />
                <span>إضافة الحصة</span>
              </>
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
