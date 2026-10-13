"use client";

import { useState } from "react";
import {
  Settings, Calendar, ToggleLeft, ToggleRight,
  Trash2, Phone, Eye, EyeOff, Users,
  Search, RefreshCw, DollarSign, Check
} from "lucide-react";
import { Teacher } from "@/lib/types";

type FilterTab = "all" | "active" | "expired" | "pending";

interface Props {
  teachers: Teacher[];
  studentCounts: Record<string, number>;
  groupCounts: Record<string, number>;
  isSuperAdmin: boolean;
  updatingId: string | null;
  onToggleActive: (id: string, current: boolean) => void;
  onToggleVisibility: (id: string, current: boolean) => void;
  onDeleteTeacher: (t: Teacher) => void;
  onUpdateExpiration: (id: string, date: string) => void;
  onUpdateStartDate: (id: string, date: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onRenewYear: (t: Teacher) => void;
  onOpenFeatures: (t: Teacher) => void;
}

export default function TeachersTable({
  teachers, studentCounts, groupCounts, isSuperAdmin,
  updatingId, onToggleActive, onToggleVisibility,
  onDeleteTeacher, onUpdateExpiration, onUpdateStartDate,
  onUpdatePrice, onRenewYear, onOpenFeatures,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [editingPrice, setEditingPrice] = useState<{ id: string; val: string } | null>(null);

  const now = new Date();

  const filtered = teachers.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.email || "").toLowerCase().includes(search.toLowerCase());

    const isExpired = t.subscription_expires_at ? new Date(t.subscription_expires_at) < now : false;
    const isNew = !t.is_active && !t.subscription_started_at;

    const matchFilter =
      filter === "all" ||
      (filter === "active" && t.is_active && !isExpired) ||
      (filter === "expired" && (isExpired || (!t.is_active && !isNew))) ||
      (filter === "pending" && isNew);

    return matchSearch && matchFilter;
  });

  const counts = {
    all: teachers.length,
    active: teachers.filter((t) => t.is_active && t.subscription_expires_at && new Date(t.subscription_expires_at) >= now).length,
    expired: teachers.filter((t) => !t.is_active || (t.subscription_expires_at ? new Date(t.subscription_expires_at) < now : false)).length,
    pending: teachers.filter((t) => !t.is_active && !t.subscription_started_at).length,
  };

  const TABS: { key: FilterTab; label: string; color: string }[] = [
    { key: "all", label: "الكل", color: "#94a3b8" },
    { key: "active", label: "نشط", color: "#10b981" },
    { key: "expired", label: "منتهي / معطل", color: "#ef4444" },
    { key: "pending", label: "مراجعة", color: "#f59e0b" },
  ];

  return (
    <div className="glass-panel panel-content">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
            <Users size={17} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">إدارة حسابات المعلمين</h2>
            <p className="text-xs text-slate-500">الاشتراكات والصلاحيات والأسعار</p>
          </div>
        </div>

      </div>

      {/* Search + Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="search-input-wrapper" style={{ flex: "1 1 220px", minWidth: 0 }}>
          <Search className="search-icon" size={15} />
          <input
            type="text"
            className="search-input"
            placeholder="بحث بالاسم أو الإيميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filter === tab.key ? `${tab.color}20` : "rgba(255,255,255,0.04)",
                border: `1px solid ${filter === tab.key ? `${tab.color}50` : "var(--border-color)"}`,
                color: filter === tab.key ? tab.color : "var(--text-muted)",
              }}
            >
              {tab.label}
              <span className="font-mono" style={{ opacity: 0.8 }}>({counts[tab.key]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[rgba(8,12,20,0.4)]">
        <table className="report-table">
          <thead>
            <tr>
              <th>المعلم</th>
              <th>تاريخ التسجيل</th>
              <th>الطلاب / المجموعات</th>
              <th>سعر الاشتراك</th>
              <th>المميزات</th>
              <th>الحالة</th>
              <th>بداية الاشتراك</th>
              <th>انتهاء الاشتراك</th>
              <th>تجديد</th>
              {isSuperAdmin && <th>الظهور</th>}
              <th style={{ color: "#f87171" }}>حذف</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 11 : 10} className="text-center py-10 text-slate-600">
                  لا توجد نتائج
                </td>
              </tr>
            )}
            {filtered.map((teacher) => {
              const studentsCount = studentCounts[teacher.id] || 0;
              const groupsCount = groupCounts[teacher.id] || 0;
              const regDate = new Date(teacher.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
              const formattedStart = teacher.subscription_started_at ? new Date(teacher.subscription_started_at).toISOString().split("T")[0] : "";
              const formattedExpiry = teacher.subscription_expires_at ? new Date(teacher.subscription_expires_at).toISOString().split("T")[0] : "";
              const isExpired = teacher.subscription_expires_at ? new Date(teacher.subscription_expires_at) < now : false;
              const isNew = !teacher.is_active && !teacher.subscription_started_at;
              const isUpdating = updatingId === teacher.id;

              return (
                <tr key={teacher.id} style={{ opacity: isUpdating ? 0.6 : 1, transition: "opacity 0.2s" }}>
                  {/* Name */}
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 font-bold text-white flex-wrap">
                        {teacher.name}
                        {teacher.is_admin && <span className="private-badge" style={{ fontSize: "0.6rem", padding: "1px 5px" }}>مدير</span>}
                        {teacher.phone && (
                          <a href={`https://wa.me/${teacher.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                            className="w-6 h-6 rounded-full flex items-center justify-center bg-teal-500/15 text-teal-400 hover:bg-teal-500 hover:text-black transition-all">
                            <Phone size={11} />
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 monospace">{teacher.email || "—"}</span>
                    </div>
                  </td>

                  {/* Reg Date */}
                  <td className="text-sm text-slate-400">{regDate}</td>

                  {/* Stats */}
                  <td>
                    <div className="flex gap-3 text-sm">
                      <span><span className="text-slate-500 text-xs">مجموعات </span><strong className="monospace text-blue-400">{groupsCount}</strong></span>
                      <span><span className="text-slate-500 text-xs">طلاب </span><strong className="monospace text-teal-400">{studentsCount}</strong></span>
                    </div>
                  </td>

                  {/* Subscription Price */}
                  <td>
                    {editingPrice?.id === teacher.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="search-input"
                          style={{ width: "80px", padding: "4px 8px", fontSize: "0.82rem" }}
                          value={editingPrice.val}
                          onChange={(e) => setEditingPrice({ id: teacher.id, val: e.target.value })}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onUpdatePrice(teacher.id, Number(editingPrice.val));
                              setEditingPrice(null);
                            }
                            if (e.key === "Escape") setEditingPrice(null);
                          }}
                        />
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-black transition-all"
                          style={{ border: "none", cursor: "pointer" }}
                          onClick={() => { onUpdatePrice(teacher.id, Number(editingPrice.val)); setEditingPrice(null); }}
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="flex items-center gap-1.5 group"
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                        onClick={() => setEditingPrice({ id: teacher.id, val: String(teacher.subscription_price || 0) })}
                        title="اضغط لتعديل السعر"
                      >
                        <DollarSign size={13} className="text-emerald-500" />
                        <span className="font-mono font-bold text-emerald-400 text-sm group-hover:text-emerald-300 transition-colors">
                          {(teacher.subscription_price || 0).toLocaleString("ar-EG")}
                        </span>
                        <span className="text-xs text-slate-600">ج</span>
                      </button>
                    )}
                  </td>

                  {/* Features */}
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                      onClick={() => onOpenFeatures(teacher)}
                      disabled={isUpdating}
                    >
                      <Settings size={13} />المميزات
                    </button>
                  </td>

                  {/* Status */}
                  <td>
                    <button
                      className="toggle-button"
                      onClick={() => onToggleActive(teacher.id, !!teacher.is_active)}
                      disabled={isUpdating}
                      style={{ color: isNew ? "#f59e0b" : teacher.is_active && !isExpired ? "#10b981" : "#ef4444" }}
                    >
                      {teacher.is_active && !isExpired
                        ? <><ToggleRight size={36} /><span className="text-sm font-semibold">نشط</span></>
                        : <><ToggleLeft size={36} /><span className="text-sm font-semibold">{isNew ? "مراجعة" : isExpired ? "منتهي" : "معطل"}</span></>
                      }
                    </button>
                  </td>

                  {/* Start Date */}
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-600" />
                      <input type="date" className="search-input" value={formattedStart} disabled={isUpdating}
                        onChange={(e) => onUpdateStartDate(teacher.id, e.target.value)}
                        style={{ padding: "4px 8px", fontSize: "0.82rem", width: "130px" }} />
                    </div>
                  </td>

                  {/* Expiry Date */}
                  <td>
                    {teacher.is_super_admin ? (
                      <span className="private-badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "4px 8px" }}>مدى الحياة</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} style={{ color: isExpired ? "#ef4444" : "var(--text-muted)" }} />
                        <input type="date" className="search-input" value={formattedExpiry} disabled={isUpdating}
                          onChange={(e) => onUpdateExpiration(teacher.id, e.target.value)}
                          style={{ padding: "4px 8px", fontSize: "0.82rem", width: "130px", border: isExpired ? "1px solid rgba(239,68,68,0.4)" : "1px solid var(--border-color)", color: isExpired ? "#f87171" : "#fff" }} />
                      </div>
                    )}
                  </td>

                  {/* Renew Year */}
                  <td>
                    {!teacher.is_super_admin && (
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", background: "rgba(20,184,166,0.08)", borderColor: "rgba(20,184,166,0.2)", color: "#5eead4" }}
                        onClick={() => onRenewYear(teacher)}
                        disabled={isUpdating}
                        title="تجديد الاشتراك سنة من اليوم"
                      >
                        <RefreshCw size={12} />+سنة
                      </button>
                    )}
                  </td>

                  {/* Visibility */}
                  {isSuperAdmin && (
                    <td>
                      {!teacher.is_super_admin ? (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", background: teacher.hidden_from_admin ? "rgba(239,68,68,0.1)" : "rgba(20,184,166,0.1)", borderColor: teacher.hidden_from_admin ? "rgba(239,68,68,0.3)" : "rgba(20,184,166,0.3)", color: teacher.hidden_from_admin ? "#f87171" : "#5eead4" }}
                          onClick={() => onToggleVisibility(teacher.id, !!teacher.hidden_from_admin)}
                          disabled={isUpdating}
                        >
                          {teacher.hidden_from_admin ? <><Eye size={12} style={{ marginLeft: 3 }} />إظهار</> : <><EyeOff size={12} style={{ marginLeft: 3 }} />إخفاء</>}
                        </button>
                      ) : <span className="text-xs text-slate-600">محمي</span>}
                    </td>
                  )}

                  {/* Delete */}
                  <td>
                    {!teacher.is_super_admin ? (
                      <button className="btn-icon" onClick={() => onDeleteTeacher(teacher)} disabled={isUpdating} style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <Trash2 size={15} className="color-danger" />
                      </button>
                    ) : <span className="text-xs text-slate-600">محمي</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
