"use client";

import { CheckCircle2, Users, X } from "lucide-react";
import { ScannedEntry } from "@/lib/types";

interface Props {
  entries: ScannedEntry[];
  totalInGroup: number;
  crossGroupCount: number;
  onRemove: (studentId: string) => void;
}

export function ScannedList({ entries, totalInGroup, crossGroupCount, onRemove }: Props) {
  if (entries.length === 0) return null;

  const presentInGroup = entries.length - crossGroupCount;
  const absentCount = Math.max(0, totalInGroup - presentInGroup);

  return (
    <div className="bg-[var(--bg-card)] border border-white/[0.07] rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 mb-3">
        <Users size={14} />
        <span>حضر {entries.length}</span>
        {absentCount > 0 && (
          <span className="text-red-400 mr-2">· غاب {absentCount}</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
        {entries.map((entry) => (
          <div key={entry.studentId} className="flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.12] text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
              <span className="text-emerald-100">{entry.studentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs font-mono">{entry.time}</span>
              <button
                onClick={() => onRemove(entry.studentId)}
                title="إلغاء التسجيل"
                className="bg-none border-none cursor-pointer text-slate-400 p-0.5 flex items-center hover:text-slate-200 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
