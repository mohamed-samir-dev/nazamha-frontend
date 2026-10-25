"use client";

import { useState, useMemo, useEffect } from "react";
import { AlertTriangle, ChevronRight, ChevronLeft, Search, X } from "lucide-react";
import { RiWhatsappLine } from "react-icons/ri";
import { AbsenteeRow } from "../_hooks/useAttendanceReports";

const PAGE_SIZE = 15;

function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 py-3 border-t border-white/[0.06]">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.05] text-slate-300 text-xs font-semibold disabled:opacity-25 hover:bg-teal-500/10 hover:border-teal-500/40 hover:text-teal-400 transition-all"
        aria-label="السابق"
      >
        <ChevronRight size={15} />
        السابق
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
              p === page
                ? "bg-teal-500/20 border border-teal-500/50 text-teal-300"
                : "border border-white/10 bg-white/[0.03] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.05] text-slate-300 text-xs font-semibold disabled:opacity-25 hover:bg-teal-500/10 hover:border-teal-500/40 hover:text-teal-400 transition-all"
        aria-label="التالي"
      >
        التالي
        <ChevronLeft size={15} />
      </button>
    </div>
  );
}

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function formatAbsenceCount(count: number): string {
  if (count === 1) return "مرة واحدة";
  if (count === 2) return "مرتين";
  if (count >= 3 && count <= 10) return `${count} مرات`;
  return `${count} مرة`;
}

function buildAbsenceMessage(row: AbsenteeRow, month: number, year: number): string {
  const monthName = ARABIC_MONTHS[month - 1];
  const countStr = formatAbsenceCount(row.absentCount);

  let lastAbsentStr = "";
  if (row.lastAbsentDate) {
    try {
      const dt = new Date(row.lastAbsentDate + "T00:00:00");
      lastAbsentStr = `آخر غياب: ${dt.toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}\n\n`;
    } catch {
      lastAbsentStr = `آخر غياب: ${row.lastAbsentDate}\n\n`;
    }
  }

  return (
    `السلام عليكم ورحمة الله وبركاته 🌙\n` +
    `ولي أمر الطالب / *${row.student.name}*\n\n` +
    `⚠️ *تنبيه هام — غياب متكرر*\n\n` +
    `نود إعلامكم بأن الطالب *${row.student.name}* قد غاب *${countStr}* خلال شهر ${monthName} ${year}.\n\n` +
    `المجموعة: ${row.groupName}\n` +
    lastAbsentStr +
    `نرجو منكم متابعة انتظام حضور الطالب والتواصل معنا لمعرفة السبب.\n\n` +
    `شكراً لتعاونكم 🙏`
  );
}

function formatPhone(raw: string): string {
  let p = raw.replace(/\D/g, "");
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("0")) p = "2" + p;
  else if (p.length === 10 && (p.startsWith("10") || p.startsWith("11") || p.startsWith("12") || p.startsWith("15"))) {
    p = "20" + p;
  }
  return p;
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("ar-EG", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface Props {
  rows: AbsenteeRow[];
  threshold: number;
  onThresholdChange: (v: number) => void;
  selectedMonth: number;
  selectedYear: number;
}

export function AbsenteesTab({
  rows,
  threshold,
  onThresholdChange,
  selectedMonth,
  selectedYear,
}: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, threshold, rows.length]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const nameMatch = r.student.name.toLowerCase().includes(q);
      const codeMatch = r.student.code ? r.student.code.toLowerCase().includes(q) : false;
      const groupMatch = r.groupName.toLowerCase().includes(q);
      return nameMatch || codeMatch || groupMatch;
    });
  }, [rows, search]);

  const paged = useMemo(() => {
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtered, page]);

  const thCls =
    "px-3 py-2.5 text-[0.68rem] font-bold text-slate-400 border-b border-white/[0.08] whitespace-nowrap uppercase tracking-wider text-right select-none";
  const tdCls = "px-3 py-2.5 border-b border-white/[0.04] whitespace-nowrap text-xs";

  return (
    <div className="flex flex-col gap-3">
      {/* Threshold & Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-2.5 sm:p-3">
        {/* Threshold control */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">عرض من غاب</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onThresholdChange(Math.max(1, threshold - 1));
              }}
              className="w-6 h-6 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 flex items-center justify-center hover:bg-teal-500/10 hover:text-teal-400 transition-all font-bold text-sm leading-none"
              aria-label="تقليل حد الغياب"
            >
              −
            </button>
            <span className="w-7 text-center font-mono font-bold text-teal-400 text-sm">{threshold}</span>
            <button
              onClick={() => {
                onThresholdChange(threshold + 1);
              }}
              className="w-6 h-6 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 flex items-center justify-center hover:bg-teal-500/10 hover:text-teal-400 transition-all font-bold text-sm leading-none"
              aria-label="زيادة حد الغياب"
            >
              +
            </button>
          </div>
          <span className="text-xs text-slate-400">مرات أو أكثر</span>
          <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
            {rows.length} طالب
          </span>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[180px] max-w-full sm:max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الكود..."
            className="w-full pr-8 pl-8 py-1.5 bg-slate-900/80 border border-white/10 rounded-[10px] text-slate-100 text-xs placeholder:text-slate-500 outline-none focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(20,184,166,0.15)] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
              aria-label="مسح البحث"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-slate-500">
          <AlertTriangle size={40} className="opacity-30" />
          <p className="text-sm">لا يوجد طلاب غابوا {threshold} مرات أو أكثر هذا الشهر 🎉</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
          <p className="text-sm">لا توجد نتائج مطابقة لبحثك</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-white/[0.07] shadow-inner">
          <table className="w-full border-collapse text-right" style={{ minWidth: 480 }}>
            <thead style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.98) 0%,rgba(2,6,23,0.98) 100%)" }}>
              <tr>
                <th
                  scope="col"
                  className={`${thCls} sticky right-0 z-20 bg-slate-950/95`}
                  style={{ width: 34 }}
                >
                  #
                </th>
                <th
                  scope="col"
                  className={`${thCls} sticky right-[34px] z-20 bg-slate-950/95 border-l border-white/[0.07]`}
                  style={{ minWidth: 150 }}
                >
                  الطالب
                </th>
                <th scope="col" className={thCls} style={{ minWidth: 95 }}>المجموعة</th>
                <th scope="col" className={`${thCls} text-center`} style={{ minWidth: 95 }}>مرات الغياب</th>
                <th scope="col" className={thCls} style={{ minWidth: 105 }}>آخر غياب</th>
                <th scope="col" className={`${thCls} text-center`} style={{ minWidth: 75 }}>واتساب</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => {
                const isCritical = row.absentCount >= 5;
                const badgeCls = isCritical
                  ? "text-red-400 bg-red-500/10 border-red-500/25"
                  : "text-amber-400 bg-amber-500/10 border-amber-500/25";

                const waPhone = row.student.parent_phone || (row.student as any).phone;
                const waLink = waPhone
                  ? `https://wa.me/${formatPhone(waPhone)}?text=${encodeURIComponent(
                      buildAbsenceMessage(row, selectedMonth, selectedYear)
                    )}`
                  : null;

                return (
                  <tr
                    key={row.student.id}
                    className="transition-colors hover:bg-white/[0.03] group"
                  >
                    {/* Sticky # */}
                    <td
                      className={`${tdCls} text-center text-slate-500 font-semibold sticky right-0 z-10 bg-slate-900 group-hover:bg-slate-800/90 transition-colors`}
                    >
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>

                    {/* Sticky Student Name */}
                    <td
                      className={`${tdCls} sticky right-[34px] z-10 bg-slate-900 group-hover:bg-slate-800/90 border-l border-white/[0.07] transition-colors`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-100 text-[0.84rem] leading-tight">
                            {row.student.name}
                          </span>
                          {row.student.is_suspended && (
                            <span className="px-1.5 py-0.5 rounded text-[0.62rem] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                              موقوف
                            </span>
                          )}
                        </div>
                        {row.student.code && (
                          <span className="font-mono text-[0.68rem] text-slate-500">
                            {row.student.code}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className={`${tdCls} text-slate-400`}>{row.groupName}</td>

                    <td className={`${tdCls} text-center`}>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[0.72rem] font-bold ${badgeCls}`}>
                        <AlertTriangle size={11} />
                        {formatAbsenceCount(row.absentCount)}
                      </span>
                    </td>

                    <td className={`${tdCls} text-slate-400`}>
                      {formatDateShort(row.lastAbsentDate)}
                    </td>

                    <td className={`${tdCls} text-center`}>
                      {waLink ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`إرسال تنبيه غياب للطالب ${row.student.name} عبر واتساب`}
                          title={`إرسال تنبيه ${row.student.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[7px] bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] text-[0.72rem] font-semibold transition-all hover:bg-[#25D366]/20 hover:scale-105 no-underline"
                        >
                          <RiWhatsappLine size={14} />
                          <span>تنبيه</span>
                        </a>
                      ) : (
                        <span className="text-[0.68rem] text-slate-600" title="لا يوجد هاتف مسجل">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} total={filtered.length} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
