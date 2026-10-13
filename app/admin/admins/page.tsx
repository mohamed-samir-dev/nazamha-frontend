"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/authService";
import { api } from "@/lib/apiClient";
import {
  Shield, UserPlus, Users, Check, AlertCircle, X,
  ToggleLeft, ToggleRight, Trash2, Clock, ChevronDown, ChevronUp,
  Eye, EyeOff, ArrowRight
} from "lucide-react";
import Link from "next/link";

const FINANCIAL_PERMISSIONS = [
  { key: "financial.viewRevenue", label: "رؤية الإيرادات والأرباح" },
  { key: "financial.viewInvoices", label: "رؤية الفواتير" },
  { key: "financial.editInvoices", label: "تعديل وإنشاء الفواتير" },
  { key: "financial.applyDiscount", label: "تطبيق الخصومات" },
  { key: "financial.applyExemption", label: "تطبيق الإعفاءات" },
  { key: "financial.editBookPrice", label: "تعديل أسعار الكتب" },
  { key: "centers.view", label: "إدارة السناتر" },
];

interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  financial_permissions: string[];
  allowed_teacher_ids: string[];
  teachers_count: number;
  last_login_at?: string;
  created_at: string;
}

interface Teacher {
  id: string;
  _id?: string;
  name: string;
  email: string;
  is_active: boolean;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  teacher_ids: string[];
  financial_permissions: string[];
}

const defaultForm: FormState = {
  name: "",
  email: "",
  password: "",
  teacher_ids: [],
  financial_permissions: [],
};

export default function AdminsManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);

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
      const [adminsData, teachersData] = await Promise.all([
        api.get<AdminUser[]>("/admins"),
        api.get<any[]>("/teachers"),
      ]);
      setAdmins(adminsData || []);
      setTeachers((teachersData || []).map((t: any) => ({ id: t.id || t._id, name: t.name, email: t.email, is_active: t.is_active })));
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingAdmin(null);
    setForm(defaultForm);
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = async (admin: AdminUser) => {
    try {
      const data = await api.get<any>(`/admins/${admin.id}`);
      setEditingAdmin(admin);
      setForm({
        name: data.name,
        email: data.email,
        password: "",
        teacher_ids: data.allowed_teacher_ids || [],
        financial_permissions: data.financial_permissions || [],
      });
      setShowPassword(false);
      setShowModal(true);
    } catch {
      showToast("فشل تحميل بيانات الأدمن", "error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { showToast("الاسم والبريد مطلوبان", "error"); return; }
    if (!editingAdmin && !form.password) { showToast("كلمة المرور مطلوبة", "error"); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        teacher_ids: form.teacher_ids,
        financial_permissions: form.financial_permissions,
      };
      if (form.password) payload.password = form.password;

      if (editingAdmin) {
        await api.patch(`/admins/${editingAdmin.id}`, payload);
        showToast("تم تحديث الأدمن بنجاح");
      } else {
        await api.post("/admins", payload);
        showToast("تم إنشاء الأدمن بنجاح");
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (admin: AdminUser) => {
    try {
      await api.patch(`/admins/${admin.id}`, { is_active: !admin.is_active });
      setAdmins(admins.map(a => a.id === admin.id ? { ...a, is_active: !a.is_active } : a));
      showToast(admin.is_active ? "تم تعطيل الأدمن" : "تم تفعيل الأدمن");
    } catch {
      showToast("فشل تحديث الحالة", "error");
    }
  };

  const handleDeactivate = async (admin: AdminUser) => {
    if (!confirm(`هل تريد تعطيل حساب "${admin.name}" نهائياً؟ سيتم الاحتفاظ بجميع سجلاته.`)) return;
    try {
      await api.delete(`/admins/${admin.id}`);
      setAdmins(admins.filter(a => a.id !== admin.id));
      showToast("تم تعطيل الأدمن بنجاح");
    } catch {
      showToast("فشل تعطيل الأدمن", "error");
    }
  };

  const toggleTeacher = (tid: string) => {
    setForm(f => ({
      ...f,
      teacher_ids: f.teacher_ids.includes(tid)
        ? f.teacher_ids.filter(id => id !== tid)
        : [...f.teacher_ids, tid],
    }));
  };

  const togglePermission = (perm: string) => {
    setForm(f => ({
      ...f,
      financial_permissions: f.financial_permissions.includes(perm)
        ? f.financial_permissions.filter(p => p !== perm)
        : [...f.financial_permissions, perm],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-[3px] border-teal-500/10 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">إدارة المسؤولين (Admins)</h1>
            <span className="private-badge" style={{ background: "rgba(139,92,246,0.2)", color: "#c084fc", border: "1px solid rgba(139,92,246,0.3)" }}>
              <Shield size={13} style={{ marginLeft: 4 }} />
              Super Admin فقط
            </span>
          </div>
          <p className="text-slate-400 text-sm">إنشاء وإدارة حسابات المسؤولين وتحديد صلاحياتهم ونطاق المدرسين</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="btn btn-secondary">
            <ArrowRight size={16} />
            <span>لوحة التحكم</span>
          </Link>
          <button className="btn btn-primary" onClick={openCreate}>
            <UserPlus size={16} />
            <span>إضافة أدمن جديد</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
        <div className="glass-panel flex items-center gap-4 p-5 border-l-4 border-l-violet-500">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-violet-500/15 text-violet-400 border border-violet-500/20">
            <Shield size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">إجمالي الأدمنز</p>
            <p className="text-2xl font-bold font-mono">{admins.length}</p>
          </div>
        </div>
        <div className="glass-panel flex items-center gap-4 p-5 border-l-4 border-l-emerald-500">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Check size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">نشطون</p>
            <p className="text-2xl font-bold font-mono">{admins.filter(a => a.is_active).length}</p>
          </div>
        </div>
        <div className="glass-panel flex items-center gap-4 p-5 border-l-4 border-l-teal-500">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-teal-500/10 text-teal-400 border border-teal-500/25">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">إجمالي المدرسين</p>
            <p className="text-2xl font-bold font-mono">{teachers.length}</p>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="glass-panel panel-content">
        <h2 className="panel-title mb-4">
          <Shield size={17} style={{ color: "#a78bfa" }} />
          <span>قائمة المسؤولين</span>
        </h2>

        {admins.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Shield size={48} className="mx-auto mb-3 opacity-20" />
            <p>لا يوجد مسؤولون بعد. أضف أول أدمن الآن.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[rgba(8,12,20,0.4)]">
            <table className="report-table">
              <thead>
                <tr>
                  <th>الاسم والبريد</th>
                  <th>الحالة</th>
                  <th>المدرسون المسؤول عنهم</th>
                  <th>الصلاحيات المالية</th>
                  <th>آخر دخول</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <React.Fragment key={admin.id}>
                    <tr style={{ opacity: admin.is_active ? 1 : 0.55 }}>
                      <td>
                        <div className="font-bold text-white">{admin.name}</div>
                        <div className="text-xs text-slate-400 monospace mt-0.5">{admin.email}</div>
                      </td>
                      <td>
                        <button
                          className="toggle-button"
                          onClick={() => handleToggleActive(admin)}
                          style={{ color: admin.is_active ? "#10b981" : "#ef4444" }}
                        >
                          {admin.is_active ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
                          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                            {admin.is_active ? "نشط" : "معطل"}
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className="font-mono text-teal-400 font-bold">{admin.teachers_count}</span>
                        <span className="text-slate-500 text-xs mr-1">مدرس</span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {admin.financial_permissions.length === 0 ? (
                            <span className="text-xs text-slate-500">لا توجد صلاحيات مالية</span>
                          ) : (
                            admin.financial_permissions.slice(0, 2).map(p => (
                              <span key={p} className="private-badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(20,184,166,0.1)", color: "#5eead4", border: "1px solid rgba(20,184,166,0.2)" }}>
                                {FINANCIAL_PERMISSIONS.find(fp => fp.key === p)?.label.split(" ")[0] || p}
                              </span>
                            ))
                          )}
                          {admin.financial_permissions.length > 2 && (
                            <span className="text-xs text-slate-500">+{admin.financial_permissions.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {admin.last_login_at ? (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={12} />
                            {new Date(admin.last_login_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">لم يدخل بعد</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}
                            onClick={() => openEdit(admin)}
                          >
                            تعديل
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => setExpandedAdmin(expandedAdmin === admin.id ? null : admin.id)}
                            title="عرض التفاصيل"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                          >
                            {expandedAdmin === admin.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDeactivate(admin)}
                            title="تعطيل الحساب"
                            style={{ background: "none", border: "none", cursor: "pointer" }}
                          >
                            <Trash2 size={15} className="color-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedAdmin === admin.id && (
                      <tr key={`${admin.id}-expanded`}>
                        <td colSpan={6} style={{ background: "rgba(255,255,255,0.02)", padding: "1rem 1.5rem" }}>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-2">الصلاحيات المالية الكاملة:</p>
                              <div className="flex flex-col gap-1">
                                {FINANCIAL_PERMISSIONS.map(fp => (
                                  <div key={fp.key} className="flex items-center gap-2 text-sm">
                                    {admin.financial_permissions.includes(fp.key) ? (
                                      <Check size={14} className="text-emerald-400" />
                                    ) : (
                                      <X size={14} className="text-slate-600" />
                                    )}
                                    <span style={{ color: admin.financial_permissions.includes(fp.key) ? "#e2e8f0" : "#475569" }}>
                                      {fp.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-2">المدرسون المسموح بهم ({admin.teachers_count}):</p>
                              <div className="flex flex-wrap gap-1">
                                {teachers
                                  .filter(t => admin.allowed_teacher_ids?.includes(t.id))
                                  .map(t => (
                                    <span key={t.id} className="private-badge" style={{ fontSize: "0.72rem", padding: "2px 8px", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }}>
                                      {t.name}
                                    </span>
                                  ))}
                                {admin.teachers_count === 0 && <span className="text-xs text-slate-600">لا يوجد مدرسون مخصصون</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000, padding: "1rem", backdropFilter: "blur(4px)"
        }}>
          <div className="glass-panel panel-content" style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={20} style={{ color: "#a78bfa" }} />
                {editingAdmin ? `تعديل: ${editingAdmin.name}` : "إنشاء أدمن جديد"}
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
                    type="text" required className="search-input"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="اسم المسؤول"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    type="email" required className="search-input"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com" dir="ltr"
                  />
                </div>
              </div>

              <div className="form-group mb-5">
                <label className="form-label">{editingAdmin ? "كلمة مرور جديدة (اتركها فارغة للإبقاء)" : "كلمة المرور"}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="search-input" style={{ paddingLeft: "2.5rem" }}
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder={editingAdmin ? "اتركها فارغة للإبقاء على الحالية" : "كلمة المرور (6 أحرف على الأقل)"}
                    required={!editingAdmin}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Teachers Selection */}
              <div className="mb-5">
                <label className="form-label mb-2 block">
                  المدرسون المسموح بهم ({form.teacher_ids.length} محدد)
                </label>
                <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.5rem" }}>
                  {teachers.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">لا يوجد مدرسون</p>
                  ) : (
                    teachers.map(t => (
                      <label key={t.id} style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.5rem 0.75rem", borderRadius: "6px", cursor: "pointer",
                        background: form.teacher_ids.includes(t.id) ? "rgba(99,102,241,0.1)" : "transparent",
                        marginBottom: "2px"
                      }}>
                        <input
                          type="checkbox"
                          checked={form.teacher_ids.includes(t.id)}
                          onChange={() => toggleTeacher(t.id)}
                          style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#6366f1" }}
                        />
                        <span style={{ flex: 1, fontSize: "0.9rem", color: form.teacher_ids.includes(t.id) ? "#a5b4fc" : "var(--text-secondary)" }}>
                          {t.name}
                        </span>
                        <span className="text-xs monospace text-slate-500">{t.email}</span>
                        {!t.is_active && <span className="private-badge" style={{ fontSize: "0.6rem", padding: "1px 5px", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>معطل</span>}
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Financial Permissions */}
              <div className="mb-6">
                <label className="form-label mb-2 block">الصلاحيات المالية</label>
                <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {FINANCIAL_PERMISSIONS.map(fp => (
                    <label key={fp.key} style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.4rem 0.5rem", borderRadius: "6px", cursor: "pointer",
                      background: form.financial_permissions.includes(fp.key) ? "rgba(20,184,166,0.08)" : "transparent"
                    }}>
                      <input
                        type="checkbox"
                        checked={form.financial_permissions.includes(fp.key)}
                        onChange={() => togglePermission(fp.key)}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#14b8a6" }}
                      />
                      <span style={{ fontSize: "0.88rem", color: form.financial_permissions.includes(fp.key) ? "#5eead4" : "var(--text-secondary)" }}>
                        {fp.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving}>
                  <Check size={16} />
                  <span>{saving ? "جاري الحفظ..." : (editingAdmin ? "حفظ التعديلات" : "إنشاء الأدمن")}</span>
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
