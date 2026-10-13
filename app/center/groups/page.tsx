"use client";

import { useState, useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { GroupsService } from "@/lib/services/groupsService";
import { Group } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

const DAYS_ORDER = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function CenterGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    GroupsService.getGroupsByTeacherId()
      .then(setGroups)
      .catch(() => setToast({ message: "فشل تحميل المجموعات", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  // Group by day_of_week
  const byDay = DAYS_ORDER.map(day => ({
    day,
    groups: groups.filter(g => g.day_of_week?.includes(day)),
  })).filter(d => d.groups.length > 0);

  const ungrouped = groups.filter(g => !DAYS_ORDER.some(d => g.day_of_week?.includes(d)));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-7 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-[14px] bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center">
            <FolderOpen size={20} />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
              المجموعات
            </h1>
            <p className="text-sm text-slate-500">{groups.length} مجموعة</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-wrapper"><div className="spinner" /></div>
      ) : groups.length === 0 ? (
        <div className="glass-panel panel-content text-center py-16 text-slate-500">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد مجموعات بعد</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {byDay.map(({ day, groups: dayGroups }) => (
            <div key={day}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {day}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
                {dayGroups.map(g => (
                  <GroupCard key={g.id} group={g} />
                ))}
              </div>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.75rem" }}>أخرى</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
                {ungrouped.map(g => <GroupCard key={g.id} group={g} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  return (
    <div className="glass-panel panel-content" style={{ padding: "1rem 1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{group.name}</p>
        {group.code && (
          <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
            {group.code}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          🕐 {group.time} — {group.day_of_week}
        </span>
        {group.sessions_per_month && (
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {group.sessions_per_month} حصة / شهر
          </span>
        )}
        {group.monthly_price != null && (
          <span style={{ fontSize: "0.78rem", color: "#5eead4" }}>
            {group.monthly_price} جنيه / شهر
          </span>
        )}
      </div>
    </div>
  );
}
