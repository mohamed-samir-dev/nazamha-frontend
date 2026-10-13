"use client";

import { useState } from "react";
import { Users, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { Group, Student } from "@/lib/types";
import { formatTimeTo12H } from "../../_utils/sessionDates";

interface LastSessionAbsentee {
  student: Student;
  sessionDate: string;
}

interface Props {
  groups: Group[];
  getLastSessionAbsentees: (groupId: string) => { absentees: LastSessionAbsentee[]; sessionDate: string | null };
}

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

function formatDateAr(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ar-EG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export function LastSessionTab({ groups, getLastSessionAbsentees }: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const result = selectedGroupId ? getLastSessionAbsentees(selectedGroupId) : null;

  const tdCls = "px-2.5 py-2 border-b border-white/[0.04] whitespace-nowrap";
  const thCls = "px-2.5 py-2 text-[0.65rem] font-bold text-slate-400 border-b border-white/[0.07] whitespace-nowrap uppercase tracking-wider text-right";

  return (
    <div className="flex flex-col gap-3">
      {/* Group cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => { setSelectedGroupId(g.id === selectedGroupId ? null : g.id); setPage(1); }}
            className={`flex flex-col gap-1 p-3 rounded-[12px] border text-right transition-all ${
              selectedGroupId === g.id
                ? "border-teal-500/60 bg-teal-500/[0.08] shadow-[0_0_12px_rgba(20,184,166,0.12)]"
                : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Users size={13} className={selectedGroupId === g.id ? "text-teal-400" : "text-slate-500"} />
              <span className={`text-[0.78rem] font-bold leading-tight truncate ${selectedGroupId === g.id ? "text-teal-300" : "text-slate-200"}`}>
                {g.name}
              </span>
            </div>
            <span className="text-[0.65rem] text-slate-500">{g.day_of_week} · {formatTimeTo12H(g.time)}</span>
          </button>
        ))}
      </div>

      {/* Result */}
      {selectedGroup && result && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ChevronRight size={14} className="text-teal-400" />
            <span className="text-sm font-semibold text-slate-200">{selectedGroup.name}</span>
            {result.sessionDate && (
              <span className="text-[0.72rem] text-slate-400 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-full">
                آخر حصة: {formatDateAr(result.sessionDate)}
              </span>
            )}
          </div>

          {!result.sessionDate ? (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
              <AlertTriangle size={32} className="opacity-30" />
              <p className="text-sm">لا توجد حصص مسجلة لهذه المجموعة</p>
            </div>
          ) : result.absentees.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
              <CheckCircle size={32} className="text-teal-500 opacity-50" />
              <p className="text-sm">لا يوجد غائبون في آخر حصة 🎉</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-white/[0.07] -mx-1">
              <table className="w-full border-collapse text-right" style={{ minWidth: 340 }}>
                <thead style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.98) 0%,rgba(2,6,23,0.98) 100%)" }}>
                  <tr>
                    <th className={thCls} style={{ width: 32 }}>#</th>
                    <th className={thCls}>الطالب</th>
                    <th className={thCls}>الكود</th>
                  </tr>
                </thead>
                <tbody>
                  {result.absentees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((row, i) => (
                    <tr key={row.student.id} className="transition-colors hover:bg-white/[0.025]">
                      <td className={`${tdCls} text-center text-slate-600 font-semibold text-xs`}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className={tdCls}>
                        <span className="font-semibold text-slate-100 text-[0.82rem]">{row.student.name}</span>
                      </td>
                      <td className={`${tdCls} font-mono text-[0.72rem] text-slate-500`}>
                        {row.student.code ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 text-[0.7rem] text-slate-500 border-t border-white/[0.04]">
                <span className="text-red-400 font-bold">{result.absentees.length}</span> غائب
              </div>
              <Pagination page={page} total={result.absentees.length} onChange={setPage} />
            </div>
          )}
        </div>
      )}

      {!selectedGroupId && groups.length > 0 && (
        <p className="text-center text-sm text-slate-500 py-6">اختر مجموعة لعرض غائبي آخر حصة</p>
      )}

      {groups.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
          <Users size={32} className="opacity-30" />
          <p className="text-sm">لا توجد مجموعات</p>
        </div>
      )}
    </div>
  );
}
