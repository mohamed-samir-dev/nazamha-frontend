"use client";

import { Grade, Group } from "@/lib/types";
import { ClipboardCheck, Camera, CameraOff, CalendarDays, Info, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

function formatTimeTo12H(t: string) {
  if (!t) return "";
  const [hRaw, m] = t.split(":").map(Number);
  const ap = hRaw >= 12 ? "م" : "ص";
  const h = hRaw % 12 || 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
}

const DAYS_SHORT = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
const MONTHS_AR  = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function formatDateChip(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  return {
    dayName: DAYS_SHORT[d.getDay()],
    dayNum:  d.getDate(),
    month:   MONTHS_AR[d.getMonth()],
    isToday: diff === 0,
    isPast:  diff < 0,
    diff,
  };
}

interface Props {
  grades: Grade[];
  groups: Group[];
  selectedGradeId: string;
  selectedGroupId: string;
  sessionDate: string;
  validSessionDates: string[];
  scanning: boolean;
  isStarting: boolean;
  manualCode: string;
  manualPlaceholder: string;
  groupCode?: string | null;
  manualMsg?: { text: string; type: "success" | "error" | "warn" } | null;
  sessionDateError?: string | null;
  autoDetected?: boolean;
  onGradeChange: (v: string) => void;
  onGroupChange: (v: string) => void;
  onSessionDateChange: (v: string) => void;
  onStartScanner: () => void;
  onStopScanner: () => void;
  onManualCodeChange: (v: string) => void;
  onManualSubmit: (e: React.FormEvent) => void;
}

export function SessionConfig({
  grades, groups,
  selectedGradeId, selectedGroupId, sessionDate,
  validSessionDates,
  scanning, isStarting,
  manualCode,
  groupCode, manualMsg, sessionDateError,
  autoDetected,
  onGradeChange, onGroupChange, onSessionDateChange,
  onStartScanner, onStopScanner,
  onManualCodeChange, onManualSubmit,
}: Props) {
  return (
    <div className="glass-panel p-5">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-200 mb-4">
        <ClipboardCheck size={17} className="text-teal-400" />
        <span>إعدادات الجلسة</span>
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-400 mb-1.5">السنة الدراسية</label>
        <select
          className="w-full px-3 py-2 bg-slate-900/80 border border-white/10 rounded-[10px] text-slate-100 font-[inherit] text-sm outline-none cursor-pointer transition-all focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(20,184,166,0.15)]"
          value={selectedGradeId}
          onChange={e => onGradeChange(e.target.value)}
        >
          <option value="">-- اختر السنة الدراسية أولاً --</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {!selectedGradeId && (
          <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
            <span>⚠</span> اختر السنة الدراسية لتظهر المجموعات
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 mb-1.5">
          المجموعة
          {autoDetected && (
            <span className="text-xs font-semibold px-1.5 py-px rounded bg-teal-500/10 border border-teal-500/20 text-teal-400">✦ تم الاكتشاف تلقائياً</span>
          )}
        </label>
        <select
          className={`w-full px-3 py-2 bg-slate-900/80 border rounded-[10px] font-[inherit] text-sm outline-none transition-all ${
            !selectedGradeId
              ? "border-white/5 text-slate-600 cursor-not-allowed opacity-50"
              : "border-white/10 text-slate-100 cursor-pointer focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(20,184,166,0.15)]"
          }`}
          value={selectedGroupId}
          onChange={e => onGroupChange(e.target.value)}
          disabled={!selectedGradeId}
        >
          <option value="">{selectedGradeId ? "اختر المجموعة..." : "-- اختر السنة أولاً --"}</option>
          {groups
            .filter(g => g.grade_id === selectedGradeId)
            .map(g => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})
              </option>
            ))}
        </select>
      </div>

      {/* Date Picker */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-400">
            <CalendarDays size={13} className="inline" />
            تاريخ الجلسة
          </label>
          {validSessionDates.length > 0 && (
            <span className="text-sm font-semibold text-teal-400 font-mono">
              {(() => {
                const { dayName, dayNum, month } = formatDateChip(sessionDate);
                return `${dayName} ${dayNum} ${month}`;
              })()}
            </span>
          )}
        </div>

        {validSessionDates.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {validSessionDates.map(iso => {
                const { dayName, dayNum, isToday, isPast, diff } = formatDateChip(iso);
                const isSelected = iso === sessionDate;
                const isFuture = diff > 0;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => onSessionDateChange(iso)}
                    className={`flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-lg border cursor-pointer transition-all min-w-[64px] font-[inherit]
                      ${isSelected
                        ? "border-teal-500 bg-teal-500/15 shadow-[0_0_8px_rgba(20,184,166,0.2)]"
                        : isFuture
                          ? "border-slate-600/50 bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/5"
                          : isToday
                            ? "border-teal-500/35 bg-white/[0.03] hover:border-teal-500/40 hover:bg-teal-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-teal-500/40 hover:bg-teal-500/10"
                      }
                      ${isPast ? "opacity-65" : isFuture ? "opacity-40" : "opacity-85"}
                    `}
                    title={isToday ? "اليوم" : isFuture ? `تاريخ مستقبلي — لا يمكن التسجيل` : `منذ ${Math.abs(diff)} يوم`}
                  >
                    <span className={`text-xs font-semibold tracking-wide ${isSelected ? "text-teal-400" : isFuture ? "text-slate-600" : "text-slate-500"}`}>{dayName}</span>
                    <span className={`text-base font-bold font-mono leading-none ${isSelected ? "text-teal-400" : isFuture ? "text-slate-600" : "text-slate-100"}`}>{dayNum}</span>
                    {isToday && <span className="w-1 h-1 rounded-full bg-teal-500" />}
                    {isFuture && <CalendarOff size={10} className="text-slate-600" />}
                  </button>
                );
              })}
            </div>
            {sessionDateError && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-semibold animate-[fadeIn_0.2s_ease]">
                ✕ {sessionDateError}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <Info size={11} />
              <span>أيام الأسبوع الحالي فقط</span>
            </div>
          </>
        ) : selectedGroupId ? (
          (() => {
            const grp = groups.find(g => g.id === selectedGroupId);
            const startDate = grp?.start_date ?? grp?.created_at?.slice(0, 10);
            if (startDate) {
              const d = new Date(startDate + "T00:00:00");
              const formatted = `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
              return (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/[0.07] border border-amber-500/20">
                  <CalendarDays size={14} className="text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-300/80 leading-snug">
                    المجموعة لم تبدأ بعد — موعد البداية: <span className="font-bold text-amber-400">{formatted}</span>
                  </p>
                </div>
              );
            }
            return null;
          })()
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Info size={11} />
            <span>اختر مجموعة لتفعيل اختيار التاريخ</span>
          </div>
        )}
      </div>

      {!scanning ? (
        <Button
          variant="primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onStartScanner}
          disabled={!selectedGroupId || isStarting || validSessionDates.length === 0}
          leftIcon={
            isStarting
              ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              : <Camera size={17} />
          }
        >
          {isStarting ? "جاري التشغيل..." : "تشغيل الكاميرا"}
        </Button>
      ) : (
        <Button
          variant="danger"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onStopScanner}
          leftIcon={<CameraOff size={17} />}
        >
          إيقاف الكاميرا
        </Button>
      )}

      {/* Manual Entry */}
      <div className="mt-5 pt-5 border-t border-white/10">
        <div className="flex items-center justify-between mb-2.5">
          {groupCode && (
            <span className="text-xs font-medium text-slate-500 bg-teal-500/[0.08] border border-teal-500/20 rounded-md px-2 py-0.5 font-mono">
              كود المجموعة: <strong className="text-teal-400 font-bold">{groupCode}</strong>
            </span>
          )}
          <span className="text-sm font-semibold text-slate-500">إدخال يدوي</span>
        </div>
        <form onSubmit={onManualSubmit} className="flex gap-2 items-center">
          <div dir="ltr" className="flex-1 flex items-center bg-slate-900/80 border border-white/10 rounded-[10px] overflow-hidden transition-all focus-within:border-teal-500 focus-within:shadow-[0_0_0_2px_rgba(20,184,166,0.15)]">
            {groupCode && (
              <span className="px-2.5 text-sm font-bold font-mono text-teal-400 bg-teal-500/[0.08] border-r border-teal-500/20 h-full flex items-center whitespace-nowrap select-none min-h-[38px] tracking-wide">
                {groupCode}-
              </span>
            )}
            <input
              type="text"
              inputMode="numeric"
              placeholder="0001"
              className="border-none bg-transparent shadow-none rounded-none px-2.5 py-2 flex-1 min-w-0 text-slate-100 text-sm outline-none"
              value={manualCode}
              onChange={e => onManualCodeChange(e.target.value)}
              disabled={!selectedGroupId || validSessionDates.length === 0}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedGroupId || !manualCode.trim() || validSessionDates.length === 0}
            style={{ padding: "0.5rem 1rem", flexShrink: 0 }}
          >
            تسجيل
          </Button>
        </form>
        {manualMsg && (
          <div className={`mt-2 px-3 py-2 rounded-lg text-sm font-semibold animate-[fadeIn_0.2s_ease] break-words ${
            manualMsg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" :
            manualMsg.type === "warn"    ? "bg-amber-500/10 border border-amber-500/25 text-amber-400" :
                                          "bg-red-500/10 border border-red-500/25 text-red-400"
          }`}>
            {manualMsg.type === "success" && "✓ "}
            {manualMsg.type === "warn" && "⚠ "}
            {manualMsg.type === "error" && "✕ "}
            {manualMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}
