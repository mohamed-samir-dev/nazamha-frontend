"use client";

import {
  Settings, X, ToggleLeft, ToggleRight, Check
} from "lucide-react";
import { Teacher } from "@/lib/types";

interface Props {
  teacher: Teacher;
  updatingId: string | null;
  bannerMessage: string;
  bannerType: "info" | "warning" | "success" | "danger";
  onClose: () => void;
  onToggleBills: (id: string, current: boolean) => void;
  onToggleAttendance: (id: string, current: boolean) => void;
  onToggleCenterMode: (id: string, current: boolean) => void;
  onToggleCentersFeature: (id: string, current: boolean) => void;
  onUpdateBanner: (teacher: Teacher, enabled: boolean, message: string, type: string) => void;
  onToggleActive: (id: string, current: boolean) => void;
  onUpdateStartDate: (id: string, date: string) => void;
  onSetTeacher: (t: Teacher) => void;
  onSetBannerMessage: (v: string) => void;
  onSetBannerType: (v: "info" | "warning" | "success" | "danger") => void;
}

const FEATURE_ROWS = [
  {
    key: "has_bills_feature" as const,
    label: "ميزة الفواتير المالية",
    desc: "نظام الحسابات وإصدار فواتير الدفع للطلاب",
    color: "teal",
  },
  {
    key: "has_attendance_feature" as const,
    label: "ميزة الحضور والغياب",
    desc: "مسح QR وتسجيل حصص الطلاب",
    color: "teal",
  },
  {
    key: "is_center_mode" as const,
    label: "نظام السنتر",
    desc: "حسابات فرعية لمساعدي المعلم",
    color: "blue",
  },
  {
    key: "has_centers_feature" as const,
    label: "إدارة السناتر",
    desc: "عرض وإدارة السناتر من لوحة المعلم",
    color: "teal",
  },
];

export default function FeaturesModal({
  teacher, updatingId,
  bannerMessage, bannerType,
  onClose, onToggleBills, onToggleAttendance, onToggleCenterMode, onToggleCentersFeature,
  onUpdateBanner, onToggleActive, onUpdateStartDate,
  onSetTeacher, onSetBannerMessage, onSetBannerType,
}: Props) {
  const isUpdating = updatingId === teacher.id;
  const isNew = !teacher.is_active && !teacher.subscription_started_at;

  const handleToggle = (key: "has_bills_feature" | "has_attendance_feature" | "is_center_mode" | "has_centers_feature") => {
    const current = (teacher[key] as boolean) ?? (key === "has_attendance_feature" ? true : false);
    if (key === "has_bills_feature") onToggleBills(teacher.id, current);
    else if (key === "has_attendance_feature") onToggleAttendance(teacher.id, current);
    else if (key === "is_center_mode") onToggleCenterMode(teacher.id, current);
    else onToggleCentersFeature(teacher.id, current);
    onSetTeacher({ ...teacher, [key]: !current });
  };

  const getFeatureValue = (key: "has_bills_feature" | "has_attendance_feature" | "is_center_mode" | "has_centers_feature") => {
    if (key === "has_attendance_feature") return teacher.has_attendance_feature ?? true;
    if (key === "is_center_mode") return teacher.is_center_mode ?? false;
    if (key === "has_centers_feature") return teacher.has_centers_feature ?? false;
    return teacher.has_bills_feature;
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-panel panel-content" style={{ width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-teal-500/10 border border-teal-500/20">
              <Settings size={17} className="text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">صلاحيات ومميزات</h2>
              <p className="text-xs text-slate-500">{teacher.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Feature Toggles */}
          {FEATURE_ROWS.map(({ key, label, desc, color }) => {
            const val = getFeatureValue(key);
            return (
              <div key={key} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex justify-between items-center gap-3">
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <button
                  className="toggle-button"
                  onClick={() => handleToggle(key)}
                  disabled={isUpdating}
                  style={{ color: val ? (color === "blue" ? "var(--color-info)" : "var(--color-teal)") : "var(--text-muted)" }}
                >
                  {val ? <ToggleRight size={42} /> : <ToggleLeft size={42} />}
                </button>
              </div>
            );
          })}

          {/* Banner */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">بانر إشعار للمعلم</p>
                <p className="text-xs text-slate-500">رسالة تظهر في أعلى لوحة تحكم هذا المعلم</p>
              </div>
              <button
                className="toggle-button"
                onClick={() => {
                  const newEnabled = !(teacher.banner?.enabled ?? false);
                  const msg = bannerMessage || teacher.banner?.message || "";
                  const tp = bannerType || teacher.banner?.type || "info";
                  onUpdateBanner(teacher, newEnabled, msg, tp);
                  onSetTeacher({ ...teacher, banner: { enabled: newEnabled, message: msg, type: tp } });
                }}
                disabled={isUpdating}
                style={{ color: teacher.banner?.enabled ? "var(--color-amber)" : "var(--text-muted)" }}
              >
                {teacher.banner?.enabled ? <ToggleRight size={42} /> : <ToggleLeft size={42} />}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <select
                value={bannerType || teacher.banner?.type || "info"}
                onChange={(e) => onSetBannerType(e.target.value as "info" | "warning" | "success" | "danger")}
                className="search-input text-sm"
                style={{ padding: "0.4rem 0.75rem" }}
              >
                <option value="info">ℹ️ معلومة</option>
                <option value="warning">⚠️ تحذير</option>
                <option value="success">✅ نجاح</option>
                <option value="danger">❌ خطر</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="نص البانر..."
                  className="search-input text-sm flex-1"
                  style={{ padding: "0.4rem 0.75rem" }}
                  value={bannerMessage !== "" ? bannerMessage : (teacher.banner?.message || "")}
                  onChange={(e) => onSetBannerMessage(e.target.value)}
                />
                <button
                  className="btn btn-primary text-sm"
                  style={{ padding: "0.4rem 0.85rem", whiteSpace: "nowrap" }}
                  disabled={isUpdating}
                  onClick={() => {
                    const msg = bannerMessage !== "" ? bannerMessage : (teacher.banner?.message || "");
                    const tp = bannerType || teacher.banner?.type || "info";
                    const enabled = teacher.banner?.enabled ?? false;
                    onUpdateBanner(teacher, enabled, msg, tp);
                    onSetTeacher({ ...teacher, banner: { enabled, message: msg, type: tp } });
                    onSetBannerMessage("");
                  }}
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4">
          {isNew ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                هذا الحساب جديد وبانتظار موافقتك لتفعيله لأول مرة.
              </div>
              <button
                className="btn btn-primary w-full justify-center"
                style={{ background: "#10b981", borderColor: "#10b981" }}
                onClick={() => {
                  onToggleActive(teacher.id, false);
                  onUpdateStartDate(teacher.id, new Date().toISOString().split("T")[0]);
                  onSetTeacher({ ...teacher, is_active: true, subscription_started_at: new Date().toISOString() });
                }}
                disabled={isUpdating}
              >
                <Check size={16} />
                موافقة وتفعيل الحساب الآن
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary w-full justify-center" onClick={onClose}>
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
