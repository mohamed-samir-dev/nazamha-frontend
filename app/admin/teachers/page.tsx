"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/authService";
import { api } from "@/lib/apiClient";
import {
  Users, UserPlus, Shield, ArrowRight, Check, AlertCircle,
  X, Eye, EyeOff, Trash2, ToggleLeft, ToggleRight, Edit3,
  Calendar, BookOpen, ClipboardCheck, Settings, DollarSign,
} from "lucide-react";
import Link from "next/link";

function OnlineStatus({ lastSeenAt }: { lastSeenAt?: string }) {
  if (!lastSeenAt) return <span className="text-xs text-slate-600">—</span>;
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const isOnline = diffMin < 5;
  const isRecent = diffMin < 60;
  if (isOnline) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      أونلاين
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${isRecent ? "text-slate-400" : "text-slate-600"}`}>
      <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
      {diffMin < 60 ? `منذ ${diffMin} د` : diffMin < 1440 ? `منذ ${Math.floor(diffMin / 60)} س` : `منذ ${Math.floor(diffMin / 1440)} ي`}
    </span>
  );
}

interface TeacherRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subscription_price: number;
  is_active: boolean;
  is_super_admin?: boolean;
  hidden_from_admin?: boolean;
  has_bills_feature: boolean;
  has_attendance_feature: boolean;
  is_center_mode: boolean;
  plan_id?: string | null;
  subscription_expires_at?: string;
  last_seen_at?: string;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  color: string;
  has_bills: boolean;
  has_attendance: boolean;
  has_center_mode?: boolean;
  duration_months: number;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  subscription_price: string;
  plan_id: string;
  subscription_expires_at: string;
}

const defaultForm: FormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  subscription_price: "0",
  plan_id: "",
  subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
};

export default function TeachersManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const user = await AuthService.getUser();
      if (!user || !(user as any).is_super_admin) {
        router.replace("/admin");
        return;
      }
      setIsSuperAdmin(true);
      const [teachersData, plansData] = await Promise.all([
        api.get<TeacherRow[]>("/teachers"),
        api.get<Plan[]>("/plans").catch(() => []),
      ]);
      setTeachers(teachersData || []);
      setPlans(plansData || []);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errors.name = "الاسم مطلوب";
    else if (form.name.trim().length < 2) errors.name = "الاسم يجب أن يكون حرفين على الأقل";

    if (!form.email.trim()) errors.email = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "صيغة البريد الإلكتروني غير صحيحة";
    else {
      const emailLower = form.email.trim().toLowerCase();
      const duplicate = teachers.find(t => t.email.toLowerCase() === emailLower && t.id !== editingTeacher?.id);
      if (duplicate) errors.email = "هذا البريد الإلكتروني مستخدم بالفعل";
    }

    if (!editingTeacher) {
      if (!form.password) errors.password = "كلمة المرور مطلوبة";
      else if (form.password.length < 6) errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    } else if (form.password && form.password.length < 6) {
      errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }

    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) errors.phone = "رقم الهاتف غير صحيح";

    if (Number(form.subscription_price) < 0) errors.subscription_price = "السعر لا يمكن أن يكون سالباً";

    if (!form.subscription_expires_at) errors.subscription_expires_at = "تاريخ الانتهاء مطلوب";
    else if (new Date(form.subscription_expires_at) < new Date(new Date().toDateString())) errors.subscription_expires_at = "تاريخ الانتهاء لا يمكن أن يكون في الماضي";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setEditingTeacher(null);
    setForm(defaultForm);
    setFormErrors({});
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (teacher: TeacherRow) => {
    setEditingTeacher(teacher);
    setFormErrors({});
    setForm({
      name: teacher.name,
      email: teacher.email,
      password: "",
      phone: teacher.phone || "",
      subscription_price: String(teacher.subscription_price || 0),
      plan_id: teacher.plan_id || "",
      subscription_expires_at: teacher.subscription_expires_at
        ? new Date(teacher.subscription_expires_at).toISOString().split("T")[0]
        : defaultForm.subscription_expires_at,
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const applyPlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) { setForm(f => ({ ...f, plan_id: "" })); return; }
    const expires = new Date();
    expires.setMonth(expires.getMonth() + (plan.duration_months || 12));
    setForm(f => ({
      ...f,
      plan_id: planId,
      subscription_price: String(plan.price || 0),
      subscription_expires_at: expires.toISOString().split("T")[0],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        subscription_price: Number(form.subscription_price) || 0,
        plan_id: form.plan_id || null,
        subscription_expires_at: form.subscription_expires_at,
      };
      if (form.password) payload.password = form.password;

      if (editingTeacher) {
        await api.patch(`/teachers/${editingTeacher.id}`, payload);
        setTeachers(ts => ts.map(t => t.id === editingTeacher.id ? {
          ...t,
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          subscription_price: Number(form.subscription_price) || 0,
          plan_id: form.plan_id || null,
          subscription_expires_at: form.subscription_expires_at || t.subscription_expires_at,
        } : t));
        showToast("تم تحديث المدرس بنجاح");
      } else {
        await api.post("/teachers", payload);
        showToast("تم إنشاء حساب المدرس بنجاح");
        loadData();
      }
      setShowModal(false);
    } catch (err: any) {
      const msg: string = err.message || "حدث خطأ";
      if (msg.includes("البريد الإلكتروني مستخدم") || msg.includes("email")) {
        setFormErrors(prev => ({ ...prev, email: "هذا البريد الإلكتروني مستخدم بالفعل" }));
      } else {
        showToast(msg, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (teacher: TeacherRow) => {
    setUpdatingId(teacher.id);
    try {
      await api.patch(`/teachers/${teacher.id}`, { is_active: !teacher.is_active });
      setTeachers(ts => ts.map(t => t.id === teacher.id ? { ...t, is_active: !t.is_active } : t));
      showToast(teacher.is_active ? "تم تعطيل المدرس" : "تم تفعيل المدرس");
    } catch {
      showToast("فشل تحديث الحالة", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (teacher: TeacherRow) => {
    if (!confirm(`تحذير: سيتم حذف حساب "${teacher.name}" وكل بياناته نهائياً. هل أنت متأكد؟`)) return;
    setUpdatingId(teacher.id);
    try {
      await api.delete(`/teachers/${teacher.id}`);
      setTeachers(ts => ts.filter(t => t.id !== teacher.id));
      showToast(`تم حذف ${teacher.name} بنجاح`);
    } catch (err: any) {
      showToast(err.message || "فشل الحذف", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleVisibility = async (teacher: TeacherRow) => {
    setUpdatingId(teacher.id);
    try {
      const res = await api.patch<{ hidden_from_admin: boolean }>(`/teachers/${teacher.id}/visibility`, {});
      setTeachers(ts => ts.map(t => t.id === teacher.id ? { ...t, hidden_from_admin: res.hidden_from_admin } : t));
      showToast(res.hidden_from_admin ? "تم إخفاء المدرس عن الأدمن" : "تم إظهار المدرس للأدمن");
    } catch {
      showToast("فشل تحديث الظهور", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const isExpired = (t: TeacherRow) =>
    t.subscription_expires_at ? new Date(t.subscription_expires_at) < new Date() : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-[3px] border-teal-500/10 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = teachers.filter(t => t.is_active && !isExpired(t)).length;
  const expiredCount = teachers.filter(isExpired).length;

  return (
    <div className="p-8 min-h-screen bg-[var(--bg-primary)]">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">إدارة المدرسين</h1>
            <span className="private-badge" style={{ background: "rgba(139,92,246,0.2)", color: "#c084fc", border: "1px solid rgba(139,92,246,0.3)" }}>
              <Shield size={13} style={{ marginLeft: 4 }} />
              Super Admin فقط
            </span>
          </div>
          <p className="text-slate-400 text-sm">إنشاء وإدارة حسابات المدرسين والاشتراكات</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="btn btn-secondary">
            <ArrowRight size={16} />
            <span>لوحة التحكم</span>
          </Link>
          <button className="btn btn-primary" onClick={openCreate}>
            <UserPlus size={16} />
            <span>إضافة مدرس جديد</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8">
        <div className="glass-panel flex items-center gap-4 p-5 border-l-4 border-l-violet-500">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-violet-500/15 text-violet-400 border border-violet-500/20">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">إجمالي المدرسين</p>
            <p className="text-2xl font-bold font-mono">{teachers.length}</p>
          </div>
        </div>
        <div className="glass-panel flex items-center gap-4 p-5 border-l-4 border-l-emerald-500">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Check size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">نشطون</p>
            <p className="text-2xl font-bold font-mono">{activeCount}</p>
          </div>
        </div>
        <div className="glass-panel flex items-center gap-4 p-5 border-l-4 border-l-red-500">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-500/15 text-red-400 border border-red-500/20">
            <AlertCircle size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">منتهي الاشتراك</p>
            <p className="text-2xl font-bold font-mono">{expiredCount}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel panel-content">
        <h2 className="panel-title mb-4">
          <Users size={17} style={{ color: "var(--color-teal)" }} />
          <span>قائمة المدرسين</span>
        </h2>

        {teachers.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users size={48} className="mx-auto mb-3 opacity-20" />
            <p>لا يوجد مدرسون بعد. أضف أول مدرس الآن.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[rgba(8,12,20,0.4)]">
            <table className="report-table">
              <thead>
                <tr>
                  <th>المدرس</th>
                  <th>الحالة</th>
                  <th>المميزات</th>
                  <th>انتهاء الاشتراك</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الحضور الآن</th>
                  {isSuperAdmin && <th>الظهور للأدمن</th>}
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => {
                  const expired = isExpired(teacher);
                  const isUpdating = updatingId === teacher.id;
                  return (
                    <tr key={teacher.id} style={{ opacity: isUpdating ? 0.6 : 1, transition: "opacity 0.2s" }}>
                      <td>
                        <div className="font-bold text-white">{teacher.name}</div>
                        <div className="text-xs text-slate-400 monospace mt-0.5">{teacher.email}</div>
                        {teacher.phone && <div className="text-xs text-slate-500 mt-0.5">{teacher.phone}</div>}
                      </td>
                      <td>
                        <button
                          className="toggle-button"
                          onClick={() => handleToggleActive(teacher)}
                          disabled={isUpdating || !!teacher.is_super_admin}
                          style={{ color: teacher.is_active && !expired ? "#10b981" : "#ef4444" }}
                        >
                          {teacher.is_active && !expired ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
                          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                            {teacher.is_active && !expired ? "نشط" : expired ? "منتهي" : "معطل"}
                          </span>
                        </button>
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {teacher.has_bills_feature && (
                            <span className="private-badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(20,184,166,0.1)", color: "#5eead4", border: "1px solid rgba(20,184,166,0.2)" }}>
                              <BookOpen size={10} style={{ display: "inline", marginLeft: 3 }} />فواتير
                            </span>
                          )}
                          {teacher.has_attendance_feature && (
                            <span className="private-badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }}>
                              <ClipboardCheck size={10} style={{ display: "inline", marginLeft: 3 }} />حضور
                            </span>
                          )}
                          {teacher.is_center_mode && (
                            <span className="private-badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}>
                              <Settings size={10} style={{ display: "inline", marginLeft: 3 }} />سنتر
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {teacher.is_super_admin ? (
                          <span className="private-badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "3px 8px", fontSize: "0.78rem" }}>
                            مدى الحياة
                          </span>
                        ) : teacher.subscription_expires_at ? (
                          <div className="flex items-center gap-1 text-xs" style={{ color: expired ? "#f87171" : "var(--text-secondary)" }}>
                            <Calendar size={12} />
                            {new Date(teacher.subscription_expires_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="text-xs text-slate-400">
                        {new Date(teacher.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td>
                        <OnlineStatus lastSeenAt={teacher.last_seen_at} />
                      </td>
                      {isSuperAdmin && (
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{
                              fontSize: "0.78rem", padding: "0.3rem 0.7rem",
                              background: teacher.hidden_from_admin ? "rgba(239,68,68,0.1)" : "rgba(20,184,166,0.1)",
                              borderColor: teacher.hidden_from_admin ? "rgba(239,68,68,0.3)" : "rgba(20,184,166,0.3)",
                              color: teacher.hidden_from_admin ? "#f87171" : "#5eead4",
                            }}
                            onClick={() => handleToggleVisibility(teacher)}
                            disabled={isUpdating || !!teacher.is_super_admin}
                            title={teacher.hidden_from_admin ? "إظهار للأدمن" : "إخفاء عن الأدمن"}
                          >
                            {teacher.hidden_from_admin ? <Eye size={13} style={{ marginLeft: 4 }} /> : <EyeOff size={13} style={{ marginLeft: 4 }} />}
                            {teacher.hidden_from_admin ? "إظهار للأدمن" : "إخفاء عن الأدمن"}
                          </button>
                        </td>
                      )}
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}
                            onClick={() => openEdit(teacher)}
                            disabled={isUpdating}
                          >
                            <Edit3 size={13} style={{ marginLeft: 4 }} />تعديل
                          </button>
                          {!teacher.is_super_admin && (
                            <button
                              className="btn-icon"
                              onClick={() => handleDelete(teacher)}
                              disabled={isUpdating}
                              style={{ background: "none", border: "none", cursor: "pointer" }}
                              title="حذف المدرس"
                            >
                              <Trash2 size={15} className="color-danger" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000, padding: "1rem", backdropFilter: "blur(4px)",
        }}>
          <div className="glass-panel panel-content" style={{ width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={20} style={{ color: "var(--color-teal)" }} />
                {editingTeacher ? `تعديل: ${editingTeacher.name}` : "إنشاء مدرس جديد"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="form-label">الاسم</label>
                  <input
                    type="text" className={`search-input${formErrors.name ? " border-red-500/60" : ""}`}
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(p => ({ ...p, name: undefined })); }}
                    placeholder="اسم المدرس (حرفين على الأقل)"
                  />
                  {formErrors.name && <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.3rem" }}>{formErrors.name}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    type="text" className={`search-input${formErrors.email ? " border-red-500/60" : ""}`} dir="ltr"
                    value={form.email}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(p => ({ ...p, email: undefined })); }}
                    placeholder="email@example.com"
                  />
                  {formErrors.email && <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.3rem" }}>{formErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="form-label">{editingTeacher ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`search-input${formErrors.password ? " border-red-500/60" : ""}`} style={{ paddingLeft: "2.5rem" }}
                      value={form.password}
                      onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setFormErrors(p => ({ ...p, password: undefined })); }}
                      placeholder={editingTeacher ? "اتركها فارغة للإبقاء" : "6 أحرف على الأقل"}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.password && <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.3rem" }}>{formErrors.password}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الهاتف (اختياري)</label>
                  <input
                    type="text" className={`search-input${formErrors.phone ? " border-red-500/60" : ""}`} dir="ltr"
                    value={form.phone}
                    onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setFormErrors(p => ({ ...p, phone: undefined })); }}
                    placeholder="01xxxxxxxxx"
                  />
                  {formErrors.phone && <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.3rem" }}>{formErrors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="form-group">
                  <label className="form-label flex items-center gap-1.5">
                    <DollarSign size={13} className="text-emerald-500" />
                    سعر الاشتراك (جنيه)
                  </label>
                  <input
                    type="number" min="0" className={`search-input${formErrors.subscription_price ? " border-red-500/60" : ""}`}
                    value={form.subscription_price}
                    onChange={e => { setForm(f => ({ ...f, subscription_price: e.target.value })); setFormErrors(p => ({ ...p, subscription_price: undefined })); }}
                  />
                  {formErrors.subscription_price && <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.3rem" }}>{formErrors.subscription_price}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ انتهاء الاشتراك</label>
                  <input
                    type="date" className={`search-input${formErrors.subscription_expires_at ? " border-red-500/60" : ""}`}
                    value={form.subscription_expires_at}
                    onChange={e => { setForm(f => ({ ...f, subscription_expires_at: e.target.value })); setFormErrors(p => ({ ...p, subscription_expires_at: undefined })); }}
                  />
                  {formErrors.subscription_expires_at && <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.3rem" }}>{formErrors.subscription_expires_at}</p>}
                </div>
              </div>

              {/* Plan Selection */}
              {plans.length > 0 && (
                <div className="form-group mb-5">
                  <label className="form-label">الباقة (اختياري — يُفعّل المميزات تلقائياً)</label>
                  <select
                    className="search-input"
                    value={form.plan_id}
                    onChange={e => applyPlan(e.target.value)}
                  >
                    <option value="">— بدون باقة —</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.price} جنيه)</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving}>
                  <Check size={16} />
                  <span>{saving ? "جاري الحفظ..." : (editingTeacher ? "حفظ التعديلات" : "إنشاء المدرس")}</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl z-[100] flex items-center gap-3 shadow-2xl ${
          toast.type === "success"
            ? "bg-emerald-950 border border-emerald-600 text-emerald-50"
            : "bg-red-950 border border-red-600 text-red-50"
        }`}>
          {toast.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
