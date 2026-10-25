"use client";

import { useState, useMemo } from "react";
import { Users, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { RiWhatsappLine } from "react-icons/ri";
import { Group, Student } from "@/lib/types";
import { formatTimeTo12H } from "../../_utils/sessionDates";

interface LastSessionAbsentee {
  student: Student;
  sessionDate: string;
}

interface Props {
  groups: Group[];
  getLastSessionAbsentees: (groupId: string) => {
    absentees: LastSessionAbsentee[];
    sessionDate: string | null;
    isLoaded?: boolean;
  };
  isLoading?: boolean;
}

const PAGE_SIZE = 15;

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
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

function formatDateAr(dateStr: string) {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
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

function buildLastSessionAbsenceMessage(studentName: string, groupName: string, sessionDate: string): string {
  const formattedDate = formatDateAr(sessionDate);
  return (
    `السلام عليكم ورحمة الله وبركاته 🌙\n` +
    `ولي أمر الطالب / *${studentName}*\n\n` +
    `⚠️ *إشعار غياب عن الحصة*\n\n` +
    `نود إحاطتكم علماً بأن الطالب قد تغيب عن حصة مجموعة *${groupName}* المنعقدة بتاريخ:\n` +
    `📅 ${formattedDate}\n\n` +
    `يرجى الاطمئنان عليه وموافاتنا بسبب الغياب لترتيب تعويض الحصة إن أمكن.\n\n` +
    `شكراً لتعاونكم وحرصكم 🙏`
  );
}

export function LastSessionTab({ groups, getLastSessionAbsentees, isLoading }: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const result = selectedGroupId ? getLastSessionAbsentees(selectedGroupId) : null;

  const tdCls = "px-3 py-2.5 border-b border-white/[0.04] whitespace-nowrap text-xs";
  const thCls =
    "px-3 py-2.5 text-[0.68rem] font-bold text-slate-400 border-b border-white/[0.08] whitespace-nowrap uppercase tracking-wider text-right select-none";

  const pagedAbsentees = useMemo(() => {
    if (!result?.absentees) return [];
    return result.absentees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [result?.absentees, page]);

  return (
    <div className="flex flex-col gap-3">
      {/* Group selector cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setSelectedGroupId(g.id === selectedGroupId ? null : g.id);
              setPage(1);
            }}
            className={`flex flex-col gap-1 p-3 rounded-[12px] border text-right transition-all cursor-pointer ${
              selectedGroupId === g.id
                ? "border-teal-500/60 bg-teal-500/[0.08] shadow-[0_0_12px_rgba(20,184,166,0.12)]"
                : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Users size={13} className={selectedGroupId === g.id ? "text-teal-400" : "text-slate-500"} />
              <span
                className={`text-[0.78rem] font-bold leading-tight truncate ${
                  selectedGroupId === g.id ? "text-teal-300" : "text-slate-200"
                }`}
              >
                {g.name}
              </span>
            </div>
            <span className="text-[0.65rem] text-slate-500">
              {g.day_of_week} · {formatTimeTo12H(g.time)}
            </span>
          </button>
        ))}
      </div>

      {/* Result Section */}
      {selectedGroup && (
        <div className="flex flex-col gap-2.5 mt-1">
          <div className="flex items-center gap-2 flex-wrap bg-white/[0.02] border border-white/[0.06] rounded-[10px] px-3 py-2">
            <ChevronRight size={14} className="text-teal-400" />
            <span className="text-sm font-bold text-slate-100">{selectedGroup.name}</span>
            {result?.sessionDate && (
              <span className="text-[0.72rem] text-teal-300 bg-teal-500/10 border border-teal-500/25 px-2.5 py-0.5 rounded-full mr-auto flex items-center gap-1 font-medium">
                <Clock size={11} />
                آخر حصة مسجلة: {formatDateAr(result.sessionDate)}
              </span>
            )}
          </div>

          {isLoading || result?.isLoaded === false ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">جاري تحليل بيانات آخر حصة...</p>
            </div>
          ) : !result?.sessionDate ? (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
              <AlertTriangle size={32} className="opacity-30" />
              <p className="text-sm">لا توجد حصص مسجلة لهذه المجموعة بعد</p>
            </div>
          ) : result.absentees.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              <CheckCircle size={34} className="text-emerald-400 opacity-70" />
              <p className="text-sm font-semibold text-slate-200">لا يوجد غائبون في آخر حصة 🎉</p>
              <p className="text-xs text-slate-500">جميع طلاب المجموعة حضروا الحصة الأخيرة بالكامل</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-white/[0.07] shadow-inner">
              <table className="w-full border-collapse text-right" style={{ minWidth: 420 }}>
                <thead style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.98) 0%,rgba(2,6,23,0.98) 100%)" }}>
                  <tr>
                    <th scope="col" className={`${thCls} sticky right-0 z-20 bg-slate-950/95`} style={{ width: 34 }}>
                      #
                    </th>
                    <th scope="col" className={`${thCls} sticky right-[34px] z-20 bg-slate-950/95 border-l border-white/[0.07]`}>
                      الطالب
                    </th>
                    <th scope="col" className={thCls}>الكود</th>
                    <th scope="col" className={`${thCls} text-center`} style={{ minWidth: 80 }}>واتساب</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedAbsentees.map((row, i) => {
                    const waPhone = (row.student as any).parent_phone || (row.student as any).phone;
                    const waLink = waPhone
                      ? `https://wa.me/${formatPhone(waPhone)}?text=${encodeURIComponent(
                          buildLastSessionAbsenceMessage(row.student.name, selectedGroup.name, result.sessionDate!)
                        )}`
                      : null;

                    return (
                      <tr key={row.student.id} className="transition-colors hover:bg-white/[0.03] group">
                        <td className={`${tdCls} text-center text-slate-500 font-semibold sticky right-0 z-10 bg-slate-900 group-hover:bg-slate-800/90 transition-colors`}>
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className={`${tdCls} sticky right-[34px] z-10 bg-slate-900 group-hover:bg-slate-800/90 border-l border-white/[0.07] transition-colors`}>
                          <span className="font-semibold text-slate-100 text-[0.84rem]">{row.student.name}</span>
                        </td>
                        <td className={`${tdCls} font-mono text-[0.72rem] text-slate-500`}>
                          {row.student.code ?? "—"}
                        </td>
                        <td className={`${tdCls} text-center`}>
                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`إرسال تنبيه غياب للطالب ${row.student.name} عبر واتساب`}
                              title={`إرسال تنبيه فوري لولي أمر ${row.student.name}`}
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

              <div className="flex items-center justify-between px-3 py-2 text-[0.72rem] text-slate-400 border-t border-white/[0.04] bg-white/[0.01]">
                <span>
                  إجمالي الغياب: <span className="text-red-400 font-bold">{result.absentees.length}</span> طالب
                </span>
              </div>
              <Pagination page={page} total={result.absentees.length} onChange={setPage} />
            </div>
          )}
        </div>
      )}

      {!selectedGroupId && groups.length > 0 && (
        <div className="text-center text-sm text-slate-500 py-8 bg-white/[0.01] border border-dashed border-white/10 rounded-[12px]">
          اختر إحدى المجموعات أعلاه لعرض قائمة الغائبين عن آخر حصة والتواصل الفوري معهم
        </div>
      )}

      {groups.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
          <Users size={32} className="opacity-30" />
          <p className="text-sm">لا توجد مجموعات مسجلة</p>
        </div>
      )}
    </div>
  );
}
