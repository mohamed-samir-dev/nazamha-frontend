"use client";
import { useState } from "react";
import { BookOpen, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface Group {
  id: string;
  name: string;
  day_of_week: string;
  time: string;
  students_count: number;
}

interface Props {
  groups: Group[];
  teacherId: string;
}

const VISIBLE_LIMIT = 8;

export default function GroupsSection({ groups, teacherId }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? groups : groups.slice(0, VISIBLE_LIMIT);
  const hasMore = groups.length > VISIBLE_LIMIT;

  return (
    <div className="glass-panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
        <h2 className="text-[0.92rem] font-semibold flex items-center gap-2">
          <BookOpen size={15} className="text-violet-400" />
          المجموعات ({groups.length})
        </h2>
        <button
          className="btn btn-secondary"
          style={{ padding: "0.25rem 0.7rem", fontSize: "0.78rem" }}
          onClick={() => router.push("/center/groups")}
        >
          عرض الكل
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-[0.83rem]">لا توجد مجموعات لهذا المدرس</p>
        </div>
      ) : (
        <>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {visible.map(g => (
              <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                  <BookOpen size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[0.83rem] text-white truncate leading-tight">{g.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[0.68rem] text-slate-500 flex items-center gap-0.5">
                      <Clock size={9} />{g.time}
                    </span>
                    <span className="text-[0.68rem] text-slate-600 truncate max-w-[80px]">{g.day_of_week}</span>
                  </div>
                </div>
                <span className="text-[0.72rem] font-mono text-teal-400 shrink-0">{g.students_count}</span>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="px-3 pb-3">
              <button
                className="w-full py-2 rounded-lg border border-white/[0.07] bg-white/[0.02] text-slate-400 text-[0.78rem] hover:bg-white/[0.05] hover:text-white transition-colors"
                onClick={() => setExpanded(p => !p)}
              >
                {expanded ? "إخفاء" : `عرض باقي ${groups.length - VISIBLE_LIMIT} مجموعة`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
