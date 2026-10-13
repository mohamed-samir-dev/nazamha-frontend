"use client";

import { useState, useEffect } from "react";
import { UserCheck, Plus, Pencil, Trash2, KeyRound, ToggleLeft, ToggleRight, X, Eye, EyeOff, Shield } from "lucide-react";
import { CenterService } from "@/lib/services/centerService";
import { StaffUser, StaffPermission } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

const ALL_PERMISSIONS: { key: StaffPermission; label: string }[] = [
  { key: "attendance", label: "الحضور والغياب" },
  { key: "students", label: "الطلاب" },
  { key: "groups", label: "المجموعات" },
  { key: "teachers", label: "عرض المدرسين" },
  { key: "reports", label: "التقارير" },
  { key: "payments", label: "المدفوعات" },
  { key: "exams", label: "الامتحانات" },
];

type ModalMode = "create" | "edit" | "reset-password" | null;

export default function CenterStaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<StaffUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StaffUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "", permissions: [] as StaffPermission[] });
  const [newPassword, setNewPassword] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  useEffect(() => {
    CenterService.getStaff()
      .then(setStaff)
      .catch(() => showToast("فشل تحميل الموظفين", "error"))
      .finally(() => setLoading(false));
  }, []);

  const togglePermission = (perm: StaffPermission) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const openCreate = () => {
    setForm({ name: "", email: "", password: "", permissions: [] });
    setShowPassword(false);
    setModal("create");
  };

  const openEdit = (s: StaffUser) => {
    setSelected(s);
    setForm({ name: s.name, email: s.email, password: "", permissions: [...s.permissions] });
    setModal("edit");
  };

  const openResetPassword = (s: StaffUser) => {
    setSelected(s);
    setNewPassword("");
    setShowPassword(false);
    setModal("reset-password");
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      showToast("الاسم والبريد وكلمة المرور مطلوبة", "error"); return;
    }
    setActionLoading(true);
    try {
      const s = await CenterService.createStaff({ name: form.name, email: form.email, password: form.password, permissions: form.permissions });
      setStaff(prev => [s, ...prev]);
      showToast("تم إضافة الموظف بنجاح");
      closeModal();
    } catch (err: any) {
      showToast(err.message || "فشل إضافة الموظف", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setActionLoading(true);
    try {
      const updated = await CenterService.updateStaff(selected.id, { name: form.name, permissions: form.permissions });
      setStaff(prev => prev.map(s => s.id === selected.id ? { ...s, ...updated } : s));
      showToast("تم تحديث بيانات الموظف");
      closeModal();
    } catch (err: any) {
      showToast(err.message || "فشل التحديث", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || newPassword.length < 6) {
      showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error"); return;
    }
    setActionLoading(true);
    try {
      await CenterService.resetStaffPassword(selected.id, newPassword);
      showToast("تم تغيير كلمة المرور بنجاح");
      closeModal();
    } catch (err: any) {
      showToast(err.message || "فشل تغيير كلمة المرور", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (s: StaffUser) => {
    setActionLoading(true);
    try {
      const res = await CenterService.toggleAssistantStatus(s.id);
      setStaff(prev => prev.map(x => x.id === s.id ? { ...x, is_active: res.is_active } : x));
      showToast(res.is_active ? "تم تفعيل الموظف" : "تم تعطيل الموظف");
    } catch (err: any) {
      showToast(err.message || "فشل تغيير الحالة", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await CenterService.deleteStaff(confirmDelete.id);
      setStaff(prev => prev.filter(s => s.id !== confirmDelete.id));
      showToast("تم حذف الموظف بنجاح");
      setConfirmDelete(null);
    } catch (err: any) {
      showToast(err.message || "فشل الحذف", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-7 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-[14px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <UserCheck size={20} />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
              الموظفون
            </h1>
            <p className="text-sm text-slate-500">{staff.length} موظف مسجل</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /><span>إضافة موظف</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : staff.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <UserCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p>لا يوجد موظفون بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="students-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الصلاحيات</th>
                  <th style={{ textAlign: "center" }}>الحالة</th>
                  <th style={{ textAlign: "center" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ direction: "ltr", textAlign: "right", color: "var(--text-secondary)" }}>{s.email}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                        {s.permissions.length === 0 ? (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>لا توجد صلاحيات</span>
                        ) : s.permissions.map(p => (
                          <span key={p} style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
                            {ALL_PERMISSIONS.find(x => x.key === p)?.label || p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.75rem", padding: "0.2rem 0.7rem", borderRadius: "999px",
                        background: s.is_active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                        color: s.is_active ? "#4ade80" : "#f87171",
                        border: `1px solid ${s.is_active ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                      }}>
                        {s.is_active ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                        <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem" }} onClick={() => openEdit(s)} title="تعديل الصلاحيات">
                          <Shield size={14} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem" }} onClick={() => openResetPassword(s)} title="تغيير كلمة المرور">
                          <KeyRound size={14} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem" }} onClick={() => handleToggleActive(s)} disabled={actionLoading}>
                          {s.is_active ? <ToggleRight size={14} color="#4ade80" /> : <ToggleLeft size={14} color="#f87171" />}
                        </button>
                        <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", color: "#f87171" }} onClick={() => setConfirmDelete(s)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base">{modal === "create" ? "إضافة موظف جديد" : "تعديل صلاحيات الموظف"}</h2>
              <button onClick={closeModal} className="bg-transparent border-0 cursor-pointer text-slate-400"><X size={18} /></button>
            </div>
            <form onSubmit={modal === "create" ? handleCreate : handleEdit} className="flex flex-col gap-4">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">الاسم *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              {modal === "create" && (
                <>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">البريد الإلكتروني *</label>
                    <input className="form-input" type="email" dir="ltr" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">كلمة المرور *</label>
                    <div style={{ position: "relative" }}>
                      <input className="form-input" type={showPassword ? "text" : "password"} dir="ltr" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required style={{ paddingLeft: "2.5rem" }} />
                      <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {/* Permissions */}
              <div>
                <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>الصلاحيات</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {ALL_PERMISSIONS.map(({ key, label }) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.5rem 0.75rem", borderRadius: "8px", background: form.permissions.includes(key) ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${form.permissions.includes(key) ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`, transition: "all 0.15s" }}>
                      <input type="checkbox" checked={form.permissions.includes(key)} onChange={() => togglePermission(key)} style={{ accentColor: "#818cf8" }} />
                      <span style={{ fontSize: "0.82rem", color: form.permissions.includes(key) ? "#818cf8" : "var(--text-secondary)" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "جاري الحفظ..." : modal === "create" ? "إضافة" : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {modal === "reset-password" && selected && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-sm border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base">تغيير كلمة مرور — {selected.name}</h2>
              <button onClick={closeModal} className="bg-transparent border-0 cursor-pointer text-slate-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">كلمة المرور الجديدة</label>
                <div style={{ position: "relative" }}>
                  <input className="form-input" type={showPassword ? "text" : "password"} dir="ltr" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} style={{ paddingLeft: "2.5rem" }} />
                  <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "جاري الحفظ..." : "تغيير"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-sm border border-red-500/30">
            <h2 className="font-bold text-base text-red-400 mb-3">تأكيد الحذف</h2>
            <p className="text-sm text-slate-400 mb-5">هل أنت متأكد من حذف الموظف <strong className="text-white">&quot;{confirmDelete.name}&quot;</strong>؟</p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? "جاري الحذف..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
