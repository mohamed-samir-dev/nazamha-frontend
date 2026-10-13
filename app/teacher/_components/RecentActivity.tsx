"use client";

import { useMemo } from "react";
import { ClipboardCheck, Users } from "lucide-react";
import { Group } from "@/lib/types";

interface SessionSummary {
  group_id: string;
  session_date: string;
  presentCount: number;
}

interface RecentActivityProps {
  groups: Group[];
  attendance: any[];
}

export function RecentActivity({ groups, attendance }: RecentActivityProps) {
  const sessions = useMemo(() => {
    const map = new Map<string, SessionSummary>();
    for (const r of attendance) {
      const key = `${r.group_id}_${r.session_date}`;
      if (!map.has(key)) map.set(key, { group_id: r.group_id, session_date: r.session_date, presentCount: 0 });
      map.get(key)!.presentCount += r.presentCount ?? 1;
    }
    const groupIds = new Set(groups.map((g) => g.id));
    return Array.from(map.values())
      .filter((s) => groupIds.has(s.group_id))
      .sort((a, b) => b.session_date.localeCompare(a.session_date))
      .slice(0, 5);
  }, [attendance, groups]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ar-EG", { day: "numeric", month: "short", weekday: "short", timeZone: "UTC" });

  return (
    <div className="glass-panel p-6">
      <h2 className="flex items-center gap-2 text-[1.1rem] font-semibold mb-5 pb-3 border-b border-white/[0.08]">
        <ClipboardCheck size={18} className="text-blue-400" />
        <span>آخر جلسات الحضور</span>
      </h2>

      {sessions.length === 0 ? (
        <p className="text-slate-500 text-[0.9rem] text-center py-6">لا يوجد سجل حضور بعد</p>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
          {sessions.map((s, i) => {
            const group = groups.find((g) => g.id === s.group_id);
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.08] transition-all duration-250 hover:bg-blue-500/[0.05] hover:border-blue-500/15"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <ClipboardCheck size={14} />
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-[0.87rem] font-semibold text-white truncate">
                    {group?.name || "مجموعة محذوفة"}
                  </span>
                  <span className="text-[0.74rem] text-slate-500">{formatDate(s.session_date)}</span>
                </div>
                <div className="flex items-center gap-1 text-[0.78rem] text-teal-400 font-semibold whitespace-nowrap">
                  <Users size={12} />
                  <span>{s.presentCount} حاضر</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
