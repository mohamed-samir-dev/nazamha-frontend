"use client";

import { useState } from "react";
import { AlertTriangle, ChevronRight, ChevronLeft } from "lucide-react";
import { RiWhatsappLine } from "react-icons/ri";
import { AbsenteeRow } from "../_hooks/useAttendanceReports";

const PAGE_SIZE = 15;

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 py-3 border-t border-white/[0.06]">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.05] text-slate-300 text-xs font-semibold disabled:opacity-25 hover:bg-teal-500/10 hover:border-teal-500/40 hover:text-teal-400 transition-all">
        <ChevronRight size={15} />
        السابق
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
              p === page
                ? "bg-teal-500/20 border border-teal-500/50 text-teal-300"
                : "border border-white/10 bg-white/[0.03] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300"
            }`}>
            {p}
          </button>
        ))}
      </div>
      <button onClick={() => onChange(page + 1)} disabled={page === pages}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.05] text-slate-300 text-xs font-semibold disabled:opacity-25 hover:bg-teal-500/10 hover:border-teal-500/40 hover:text-teal-400 transition-all">
        التالي
        <ChevronLeft size={15} />
      </button>
    </div>
  );
}

const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

function buildAbsenceMessage(row: AbsenteeRow, month: number, year: number): string {
  const monthName = ARABIC_MONTHS[month - 1];
  return (
    `السلام عليكم ورحمة الله وبركاته 🌙\n` +
    `ولي أمر الطالب / *${row.student.name}*\n\n` +
    `⚠️ *تنبيه هام — غياب متكرر*\n\n` +
    `نود إعلامكم بأن الطالب *${row.student.name}* قد غاب *${row.absentCount} مرات* خلال شهر ${monthName} ${year}.\n\n` +
    `المجموعة: ${row.groupName}\n` +
    (row.lastAbsentDate
      ? `آخر غياب: ${new Date(row.lastAbsentDate + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n`
      : "\n") +
    `نرجو منكم متابعة انتظام حضور الطالب والتواصل معنا لمعرفة السبب.\n\n` +
    `شكراً لتعاونكم 🙏`
  );
}

function formatPhone(raw: string): string {
  let p = raw.replace(/\D/g, "");
  if (p.startsWith("0")) p = "2" + p;
  if (!p.startsWith("20")) p = "20" + p;
  return p;
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ar-EG", {
    weekday: "short", month: "short", day: "numeric",
  });
}

interface Props {
  rows: AbsenteeRow[];
  threshold: number;
  onThresholdChange: (v: number) => void;
  selectedMonth: number;
  selectedYear: number;
}

export function AbsenteesTab({ rows, threshold, onThresholdChange, selectedMonth, selectedYear }: Props) {
  const [page, setPage] = useState(1);

  const thCls = "px-2.5 py-2 text-[0.65rem] font-bold text-slate-400 border-b border-white/[0.07] whitespace-nowrap uppercase tracking-wider text-right";
  const tdCls = "px-2.5 py-2 border-b border-white/[0.04] whitespace-nowrap";
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      {/* Threshold control */}
      <div className="flex items-center gap-2 flex-wrap bg-white/[0.02] border border-white/[0.06] rounded-[10px] px-3 py-2">
        <span className="text-xs text-slate-400">عرض من غاب</span>
        <div className="flex items-center gap-1">
          <button onClick={() => { onThresholdChange(Math.max(1, threshold - 1)); setPage(1); }}
            className="w-6 h-6 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 flex items-center justify-center hover:bg-teal-500/10 hover:text-teal-400 transition-all font-bold text-sm leading-none">
            −
          </button>
          <span className="w-7 text-center font-mono font-bold text-teal-400 text-sm">{threshold}</span>
          <button onClick={() => { onThresholdChange(threshold + 1); setPage(1); }}
            className="w-6 h-6 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 flex items-center justify-center hover:bg-teal-500/10 hover:text-teal-400 transition-all font-bold text-sm leading-none">
            +
          </button>
        </div>
        <span className="text-xs text-slate-400">مرات أو أكثر</span>
        <span className="mr-auto text-[0.7rem] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
          {rows.length} طالب
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-slate-500">
          <AlertTriangle size={40} className="opacity-30" />
          <p className="text-sm">لا يوجد طلاب غابوا {threshold} مرات أو أكثر هذا الشهر</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-white/[0.07] -mx-1">
          <table className="w-full border-collapse text-right" style={{ minWidth: 460 }}>
            <thead style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.98) 0%,rgba(2,6,23,0.98) 100%)" }}>
              <tr>
                <th className={thCls} style={{ width: 32 }}>#</th>
                <th className={thCls} style={{ minWidth: 130 }}>الطالب</th>
                <th className={thCls} style={{ minWidth: 90 }}>المجموعة</th>
                <th className={`${thCls} text-center`} style={{ minWidth: 90 }}>الغيابات</th>
                <th className={thCls} style={{ minWidth: 100 }}>آخر غياب</th>
                <th className={`${thCls} text-center`} style={{ minWidth: 72 }}>واتساب</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => {
                const isCritical = row.absentCount >= 5;
                const badgeCls = isCritical
                  ? "text-red-400 bg-red-500/10 border-red-500/25"
                  : "text-amber-400 bg-amber-500/10 border-amber-500/25";
                const waLink = row.student.parent_phone
                  ? `https://wa.me/${formatPhone(row.student.parent_phone)}?text=${encodeURIComponent(buildAbsenceMessage(row, selectedMonth, selectedYear))}`
                  : null;
                return (
                  <tr key={`${row.student.id}-${row.student.group_id}-${row.student.group_join_date}`} className="transition-colors hover:bg-white/[0.025]">
                    <td className={`${tdCls} text-center text-slate-600 font-semibold text-xs`}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className={tdCls}>
                      <div className="flex flex-col gap-px">
                        <span className="font-semibold text-slate-100 text-[0.82rem] leading-tight">{row.student.name}</span>
                        {row.student.code && <span className="font-mono text-[0.68rem] text-slate-500">{row.student.code}</span>}
                      </div>
                    </td>
                    <td className={`${tdCls} text-slate-400 text-xs`}>{row.groupName}</td>
                    <td className={`${tdCls} text-center`}>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[0.7rem] font-bold ${badgeCls}`}>
                        <AlertTriangle size={10} />{row.absentCount} مرة
                      </span>
                    </td>
                    <td className={`${tdCls} text-slate-400 text-xs`}>
                      {row.lastAbsentDate ? formatDateShort(row.lastAbsentDate) : "—"}
                    </td>
                    <td className={`${tdCls} text-center`}>
                      {waLink ? (
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                          title={`إرسال تنبيه ${row.student.name}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-[7px] bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] text-[0.7rem] font-semibold transition-all hover:bg-[#25D366]/20 hover:scale-105 no-underline">
                          <RiWhatsappLine size={13} />
                          <span>تنبيه</span>
                        </a>
                      ) : (
                        <span className="text-[0.65rem] text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} total={rows.length} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
