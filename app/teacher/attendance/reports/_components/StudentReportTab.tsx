"use client";

import { useState } from "react";
import { Users, ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from "lucide-react";
import { RiWhatsappLine } from "react-icons/ri";
import { StudentReportRow } from "../_hooks/useAttendanceReports";

const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

function buildWhatsAppMessage(row: StudentReportRow, month: number, year: number): string {
  const monthName = ARABIC_MONTHS[month - 1];
  return (
    `السلام عليكم ورحمة الله وبركاته 🌙\n` +
    `ولي أمر الطالب / *${row.student.name}*\n\n` +
    `📋 *تقرير الحضور والغياب*\n` +
    `الشهر: ${monthName} ${year}\n` +
    `المجموعة: ${row.groupName}\n\n` +
    `✅ أيام الحضور: *${row.present}* يوم\n` +
    `❌ أيام الغياب: *${row.absent}* يوم\n` +
    `التعويض: ${row.compensated||0} حصة · الإعفاء: ${row.exempt||0} حصة\n` +
    `📊 نسبة الحضور للحصص المطلوبة بعد الاستبعاد: *${row.pct}%*\n\n` +
    (row.pct < 75
      ? `⚠️ *تنبيه:* نسبة حضور الطالب أقل من 75%، نرجو الاهتمام بانتظام الحضور.\n\n`
      : row.pct === 100
      ? `🌟 الطالب منتظم في الحصص المطلوبة بعد استبعاد التعويض والإعفاء.\n\n`
      : "") +
    `شكراً لتعاونكم 🙏`
  );
}

function formatPhone(raw: string): string {
  let p = raw.replace(/\D/g, "");
  if (p.startsWith("0")) p = "2" + p;
  if (!p.startsWith("20")) p = "20" + p;
  return p;
}

type SortKey = "pct" | "absent" | "name";
type SortDir = "asc" | "desc";

interface Props {
  rows: StudentReportRow[];
  selectedMonth: number;
  selectedYear: number;
}

const PAGE_SIZE = 20;

function PctBar({ pct }: { pct: number }) {
  const color = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-[4px] bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono font-bold text-xs w-8 text-left flex-shrink-0" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function SortBtn({ k, label, sortKey, sortDir, handleSort }: { k: SortKey; label: string; sortKey: SortKey; sortDir: SortDir; handleSort: (key: SortKey) => void }) { return (
    <button
      onClick={() => handleSort(k)}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
        sortKey === k
          ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
          : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
      {sortKey === k && (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
    </button>
  ); }

export function StudentReportTab({ rows, selectedMonth, selectedYear }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("pct");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);


  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "pct") cmp = a.pct - b.pct;
    else if (sortKey === "absent") cmp = a.absent - b.absent;
    else cmp = a.student.name.localeCompare(b.student.name, "ar");
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);



  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
        <Users size={40} className="opacity-30" />
        <p className="text-sm">لا يوجد طلاب في هذا الاختيار</p>
      </div>
    );
  }

  const thCls = "px-2.5 py-2 text-[0.65rem] font-bold text-slate-400 border-b border-white/[0.07] whitespace-nowrap uppercase tracking-wider text-right select-none";
  const tdCls = "px-2.5 py-2 border-b border-white/[0.04] whitespace-nowrap";

  return (
    <div className="flex flex-col gap-3">
      {/* Sort controls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-500">ترتيب:</span>
        <SortBtn sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} k="pct" label="النسبة" />
        <SortBtn sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} k="absent" label="الغياب" />
        <SortBtn sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} k="name" label="الاسم" />
      </div>

      {/* Table — scrollable on all screens */}
      <div className="overflow-x-auto rounded-[12px] border border-white/[0.07] -mx-1">
        <table className="w-full border-collapse text-right" style={{ minWidth: 520 }}>
          <thead style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.98) 0%,rgba(2,6,23,0.98) 100%)" }}>
            <tr>
              <th className={thCls} style={{ width: 32 }}>#</th>
              <th className={`${thCls} cursor-pointer hover:text-teal-400`} onClick={() => handleSort("name")} style={{ minWidth: 130 }}>
                الطالب {sortKey === "name" && (sortDir === "asc" ? <ChevronUp size={10} className="inline" /> : <ChevronDown size={10} className="inline" />)}
              </th>
              <th className={thCls} style={{ minWidth: 90 }}>المجموعة</th>
              <th className={thCls} style={{ minWidth: 80 }}>السنة</th>
              <th className={`${thCls} cursor-pointer hover:text-teal-400 text-center`} onClick={() => handleSort("absent")} style={{ minWidth: 90 }}>
                ح / غ {sortKey === "absent" && (sortDir === "asc" ? <ChevronUp size={10} className="inline" /> : <ChevronDown size={10} className="inline" />)}
              </th>
              <th className={`${thCls} cursor-pointer hover:text-teal-400`} onClick={() => handleSort("pct")} style={{ minWidth: 100 }}>
                النسبة {sortKey === "pct" && (sortDir === "asc" ? <ChevronUp size={10} className="inline" /> : <ChevronDown size={10} className="inline" />)}
              </th>
              <th className={`${thCls} text-center`} style={{ minWidth: 72 }}>واتساب</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => {
              const rowBg = row.pct < 50 && row.total > 0 ? "bg-red-500/[0.04]" : row.absent > 3 ? "bg-amber-500/[0.03]" : "";
              const waLink = row.student.parent_phone
                ? `https://wa.me/${formatPhone(row.student.parent_phone)}?text=${encodeURIComponent(buildWhatsAppMessage(row, selectedMonth, selectedYear))}`
                : null;
              return (
                <tr key={`${row.student.id}-${row.student.group_id}-${row.student.group_join_date}`} className={`transition-colors hover:bg-white/[0.025] ${rowBg}`}>
                  <td className={`${tdCls} text-center text-slate-600 font-semibold text-xs`}>
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td className={tdCls}>
                    <div className="flex flex-col gap-px">
                      <span className="font-semibold text-slate-100 text-[0.82rem] leading-tight">{row.student.name}</span>
                      {row.student.code && <span className="font-mono text-[0.68rem] text-slate-500">{row.student.code}</span>}
                    </div>
                  </td>
                  <td className={`${tdCls} text-slate-400 text-xs`}>{row.groupName}</td>
                  <td className={`${tdCls} text-slate-400 text-xs`}>{row.gradeName}</td>
                  <td className={`${tdCls} text-center`}>
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-emerald-400 font-mono font-bold text-xs">{row.present}</span>
                      <span className="text-slate-700 text-[0.6rem]">/</span>
                      <span className={`font-mono font-bold text-xs ${row.absent > 0 ? "text-red-400" : "text-slate-500"}`}>{row.absent}</span>
                    </div>
                  </td>
                  <td className={tdCls}>
                    {row.total>0?<PctBar pct={row.pct} />:<span title="لا توجد حصص مطلوبة بعد الاستبعاد">—</span>}
                  </td>
                  <td className={`${tdCls} text-center`}>
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`إرسال تقرير ${row.student.name}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-[7px] bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] text-[0.7rem] font-semibold transition-all hover:bg-[#25D366]/20 hover:scale-105 no-underline"
                      >
                        <RiWhatsappLine size={13} />
                        <span>إرسال</span>
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} من {sorted.length} طالب
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 flex items-center justify-center disabled:opacity-30 hover:bg-teal-500/10 hover:text-teal-400 transition-all">
              <ChevronRight size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && (arr[idx - 1] as number) < p - 1 && <span className="text-slate-600 text-xs px-0.5">…</span>}
                  <button onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg border text-xs font-semibold transition-all ${
                      page === p ? "bg-teal-500/20 border-teal-500/40 text-teal-400" : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-teal-500/10 hover:text-teal-400"
                    }`}>
                    {p}
                  </button>
                </span>
              ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 flex items-center justify-center disabled:opacity-30 hover:bg-teal-500/10 hover:text-teal-400 transition-all">
              <ChevronLeft size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
