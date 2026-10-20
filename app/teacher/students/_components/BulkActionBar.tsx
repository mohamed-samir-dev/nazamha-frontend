"use client";

import { useState } from "react";
import { Trash2, X, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Group } from "@/lib/types";

interface Props {
  count: number;
  isLoading: boolean;
  groups?: Group[];
  onDelete: () => void;
  onClear: () => void;
  onMoveGroup?: (groupId: string) => void;
}

export function BulkActionBar({ count, isLoading, groups = [], onDelete, onClear, onMoveGroup }: Props) {
  const [selectedGroup, setSelectedGroup] = useState("");
  if (count === 0) return null;

  const handleMove = () => {
    if (!selectedGroup) return;
    onMoveGroup?.(selectedGroup);
    setSelectedGroup("");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-4 rounded-xl border border-teal-500/25 bg-teal-500/[0.04]">
      <span className="text-teal-400 font-semibold text-sm">
        تم تحديد {count} طالب
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {onMoveGroup && groups.length > 0 && (
          <div className="flex items-center gap-1.5">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="py-1 px-2.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white focus:border-teal-500 outline-none"
            >
              <option value="">-- نقل لمجموعة... --</option>
              <option value="none">بدون مجموعة</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              disabled={!selectedGroup || isLoading}
              onClick={handleMove}
              leftIcon={<ArrowRightLeft size={13} />}
            >
              نقل
            </Button>
          </div>
        )}

        <Button variant="danger" size="sm" onClick={onDelete} isLoading={isLoading} leftIcon={<Trash2 size={14} />}>
          حذف المحدد
        </Button>
        <Button variant="secondary" size="sm" onClick={onClear} leftIcon={<X size={14} />}>
          إلغاء
        </Button>
      </div>
    </div>
  );
}
