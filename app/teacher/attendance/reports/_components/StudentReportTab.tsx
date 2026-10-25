"use client";

import { useState, useMemo, useEffect } from "react";
import { Users, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Search, X, AlertCircle } from "lucide-react";
import { RiWhatsappLine } from "react-icons/ri";
import { StudentReportRow } from "../_hooks/useAttendanceReports";

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function buildWhatsAppMessage(row: StudentReportRow, month: number, year: number): string {
  const monthName = ARABIC_MONTHS[month - 1];
  const hasResolutions = (row.compensated || 0) + (row.exempt || 0) > 0;
  const resolutionText = hasResolutions
    ? `التعويض: ${row.compensated || 0} حصة · الإعفاء: ${row.exempt || 0} حصة\n`
    : "";

  let statsSection = "";
  if (row.total === 0 || row.pct === null) {
    statsSection = `📊 حالة الحضور: لا توجد حصص مطلوبة في هذا الشهر بعد تاريخ الانضمام.\n\n`;
  } else {
    statsSection =
      `✅ أيام الحضور: *${row.present}* يوم\n` +
      `❌ أيام الغياب: *${row.absent}* يوم\n` +
      resolutionText +
      `📊 نسبة الحضور${hasResolutions ? " للحصص المطلوبة" : ""}: *${row.pct}%*\n\n` +
      (row.pct < 75
        ? `⚠️ *تنبيه:* نسبة حضور الطالب أقل من 75%، نرجو الاهتمام بانتظام الحضور.\n\n`
        : row.pct === 100
        ? `🌟 الطالب منتظم في الحضور بشكل ممتاز.\n\n`
        : "");
  }

  return (
    `السلام عليكم ورحمة الله وبركاته 🌙\n` +
    `ولي أمر الطالب / *${row.student.name}*\n\n` +
    `📋 *تقرير الحضور والغياب*\n` +
    `الشهر: ${monthName} ${year}\n` +
    `المجموعة: ${row.groupName}\n\n` +
    statsSection +
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
      <div className="flex-1 h-[5px] bg-white/[0.08] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono font-bold text-xs w-9 text-left flex-shrink-0" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function SortBtn({
  k,
  label,
  sortKey,
  sortDir,
  handleSort,
}: {
  k: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: SortDir;
  handleSort: (key: SortKey) => void;
}) {
  return (
    <button
      onClick={() => handleSort(k)}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
        sortKey === k
          ? "bg-teal-500/15 border-teal-500/30 text-teal-400 shadow-sm"
          : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
      {sortKey === k && (sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
    </button>
  );
}

export function StudentReportTab({ rows, selectedMonth, selectedYear }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("pct");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // إعادة الترقيم إلى الصفحة 1 عند تغير البحث أو الترتيب أو الصفوف الواردة
  useEffect(() => {
    setPage(1);
  }, [search, sortKey, sortDir, rows.length]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

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

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "pct") {
        if (a.pct === null && b.pct === null) cmp = 0;
        else if (a.pct === null) cmp = 1;
        else if (b.pct === null) cmp = -1;
        else cmp = a.pct - b.pct;
      } else if (sortKey === "absent") {
        cmp = a.absent - b.absent;
      } else {
        cmp = a.student.name.localeCompare(b.student.name, "ar");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = useMemo(() => {
    return sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [sorted, page]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
        <Users size={40} className="opacity-30" />
        <p className="text-sm">لا يوجد طلاب في هذا الاختيار</p>
      </div>
    );
  }

  const thCls =
    "px-3 py-2.5 text-[0.68rem] font-bold text-slate-400 border-b border-white/[0.08] whitespace-nowrap uppercase tracking-wider text-right select-none";
  const tdCls = "px-3 py-2.5 border-b border-white/[0.04] whitespace-nowrap text-xs";

  return (
    <div className="flex flex-col gap-3">
      {/* Search & Sort Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-full sm:max-w-xs">
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

        {/* Sort controls */}
        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
          <span className="text-xs text-slate-500">ترتيب:</span>
          <SortBtn sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} k="pct" label="النسبة" />
          <SortBtn sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} k="absent" label="الغياب" />
          <SortBtn sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} k="name" label="الاسم" />
        </div>
      </div>

      {search && (
        <div className="text-[0.72rem] text-slate-400 px-1">
          تم العثور على <span className="font-bold text-teal-400">{sorted.length}</span> من أصل {rows.length} طالب
        </div>
      )}

      {/* Table with Sticky Student Column for Mobile */}
      <div className="overflow-x-auto rounded-[12px] border border-white/[0.07] shadow-inner">
        <table className="w-full border-collapse text-right" style={{ minWidth: 540 }}>
          <thead style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.98) 0%,rgba(2,6,23,0.98) 100%)" }}>
            <tr>
              {/* Sticky # and Student Name */}
              <th
                scope="col"
                className={`${thCls} sticky right-0 z-20 bg-slate-950/95`}
                style={{ width: 34 }}
              >
                #
              </th>
              <th
                scope="col"
                className={`${thCls} sticky right-[34px] z-20 bg-slate-950/95 cursor-pointer hover:text-teal-400 border-l border-white/[0.07]`}
                onClick={() => handleSort("name")}
                style={{ minWidth: 150 }}
              >
                الطالب {sortKey === "name" && (sortDir === "asc" ? <ChevronUp size={11} className="inline" /> : <ChevronDown size={11} className="inline" />)}
              </th>
              <th scope="col" className={thCls} style={{ minWidth: 95 }}>المجموعة</th>
              <th scope="col" className={thCls} style={{ minWidth: 80 }}>السنة</th>
              <th
                scope="col"
                className={`${thCls} cursor-pointer hover:text-teal-400 text-center`}
                onClick={() => handleSort("absent")}
                style={{ minWidth: 90 }}
              >
                ح / غ {sortKey === "absent" && (sortDir === "asc" ? <ChevronUp size={11} className="inline" /> : <ChevronDown size={11} className="inline" />)}
              </th>
              <th
                scope="col"
                className={`${thCls} cursor-pointer hover:text-teal-400`}
                onClick={() => handleSort("pct")}
                style={{ minWidth: 105 }}
              >
                النسبة {sortKey === "pct" && (sortDir === "asc" ? <ChevronUp size={11} className="inline" /> : <ChevronDown size={11} className="inline" />)}
              </th>
              <th scope="col" className={`${thCls} text-center`} style={{ minWidth: 75 }}>واتساب</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500 text-sm">
                  لا توجد نتائج مطابقة لبحثك
                </td>
              </tr>
            ) : (
              paged.map((row, i) => {
                const isZeroSession = row.total === 0 || row.pct === null;
                const rowBg =
                  !isZeroSession && row.pct! < 50
                    ? "bg-red-500/[0.04]"
                    : row.absent > 3
                    ? "bg-amber-500/[0.03]"
                    : "";

                const waPhone = row.student.parent_phone || (row.student as any).phone;
                const waLink = waPhone
                  ? `https://wa.me/${formatPhone(waPhone)}?text=${encodeURIComponent(
                      buildWhatsAppMessage(row, selectedMonth, selectedYear)
                    )}`
                  : null;

                return (
                  <tr
                    key={row.student.id}
                    className={`transition-colors hover:bg-white/[0.03] group ${rowBg}`}
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
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-100 text-[0.84rem] leading-tight">
                            {row.student.name}
                          </span>
                          {row.student.is_suspended && (
                            <span className="px-1.5 py-0.5 rounded text-[0.62rem] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                              موقوف
                            </span>
                          )}
                          {row.isTransferred && (
                            <span className="px-1.5 py-0.5 rounded text-[0.62rem] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300" title="نقل مجموعة خلال الشهر">
                              منقول
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
                    <td className={`${tdCls} text-slate-400`}>{row.gradeName}</td>

                    <td className={`${tdCls} text-center`}>
                      <div className="flex items-center gap-1 justify-center">
                        <span className="text-emerald-400 font-mono font-bold">{row.present}</span>
                        <span className="text-slate-700 text-[0.65rem]">/</span>
                        <span
                          className={`font-mono font-bold ${
                            row.absent > 0 ? "text-red-400" : "text-slate-500"
                          }`}
                        >
                          {row.absent}
                        </span>
                      </div>
                    </td>

                    <td className={tdCls}>
                      {row.pct !== null ? (
                        <PctBar pct={row.pct} />
                      ) : (
                        <span className="text-slate-500 text-xs flex items-center gap-1" title="لا توجد حصص مطلوبة بعد الاستبعاد">
                          <AlertCircle size={11} className="opacity-40" />
                          <span>—</span>
                        </span>
                      )}
                    </td>

                    <td className={`${tdCls} text-center`}>
                      {waLink ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`إرسال تقرير الحضور للطالب ${row.student.name} عبر واتساب`}
                          title={`إرسال تقرير ${row.student.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[7px] bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] text-[0.72rem] font-semibold transition-all hover:bg-[#25D366]/20 hover:scale-105 no-underline"
                        >
                          <RiWhatsappLine size={14} />
                          <span>إرسال</span>
                        </a>
                      ) : (
                        <span className="text-[0.68rem] text-slate-600" title="لا يوجد هاتف مسجل">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <span className="text-xs text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} من {sorted.length} طالب
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 flex items-center justify-center disabled:opacity-30 hover:bg-teal-500/10 hover:text-teal-400 transition-all"
              aria-label="الصفحة السابقة"
            >
              <ChevronRight size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && (arr[idx - 1] as number) < p - 1 && (
                    <span className="text-slate-600 text-xs px-0.5">…</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg border text-xs font-semibold transition-all ${
                      page === p
                        ? "bg-teal-500/20 border-teal-500/40 text-teal-400"
                        : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-teal-500/10 hover:text-teal-400"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 flex items-center justify-center disabled:opacity-30 hover:bg-teal-500/10 hover:text-teal-400 transition-all"
              aria-label="الصفحة التالية"
            >
              <ChevronLeft size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
