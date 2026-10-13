"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Pencil, Trash2, KeyRound, ToggleLeft, ToggleRight, X, Eye, EyeOff, ChevronRight, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/authService";
import { AdminCentersService } from "@/lib/services/centerService";
import { CenterUser } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

type ModalMode = "create" | "edit" | "reset-password" | "details" | null;

interface CenterWithCounts extends CenterUser {
  teachers_count: number;
  assistants_count: number;
}

export default function AdminCentersPage() {
  const router = useRouter();
  const [centers, setCenters] = useState<CenterWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<CenterWithCounts | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CenterWithCounts | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [newPassword, setNewPassword] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  useEffect(() => {
    async function init() {
      const user = await AuthService.getUser().catch(() => null);
      if (!user || !(user as any).is_admin) {
        router.replace("/admin/login");
        return;
      }
      setIsSuperAdmin(!!(user as any).is_super_admin);
      AdminCentersService.getCenters()
        .then(setCenters)
        .catch(() => showToast("فشل تحميل السناتر", "error"))
        .finally(() => setLoading(false));
    }
    init();
  }, [router]);

  const openCreate = () => {
    setForm({ name: "", email: "", password: "", phone: "", address: "" });
    setShowPassword(false);
    setModal("create");
  };

  const openEdit = (c: CenterWithCounts) => {
    setSelected(c);
    setForm({ name: c.name, email: c.email, password: "", phone: c.phone || "", address: c.address || "" });
    setModal("edit");
  };

  const openResetPassword = (c: CenterWithCounts) => {
    setSelected(c);
    setNewPassword("");
    setShowPassword(false);
    setModal("reset-password");
  };

  const openDetails = async (c: CenterWithCounts) => {
    setSelected(c);
    setModal("details");
    setDetailsLoading(true);
    try {
      const data = await AdminCentersService.getCenterById(c.id);
      setDetailsData(data);
    } catch {
      showToast("فشل تحميل تفاصيل السنتر", "error");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => { setModal(null); setSelected(null); setDetailsData(null); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      showToast("الاسم والبريد وكلمة المرور مطلوبة", "error"); return;
    }
    setActionLoading(true);
    try {
      const c = await AdminCentersService.createCenter({
        name: form.name, email: form.email, password: form.password,
        phone: form.phone || undefined, address: form.address || undefined,
      });
      setCenters(prev => [{ ...c, teachers_count: 0, assistants_count: 0 }, ...prev]);
      showToast("تم إنشاء السنتر بنجاح");
      closeModal();
    } catch (err: any) {
      showToast(err.message || "فشل إنشاء السنتر", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setActionLoading(true);
    try {
      const updated = await AdminCentersService.updateCenter(selected.id, {
        name: form.name, phone: form.phone || undefined, address: form.address || undefined,
      });
      setCenters(prev => prev.map(c => c.id === selected.id ? { ...c, ...updated } : c));
      showToast("تم تحديث بيانات السنتر");
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
      await AdminCentersService.resetPassword(selected.id, newPassword);
      showToast("تم تغيير كلمة المرور بنجاح");
      closeModal();
    } catch (err: any) {
      showToast(err.message || "فشل تغيير كلمة المرور", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (c: CenterWithCounts) => {
    setActionLoading(true);
    try {
      const res = await AdminCentersService.toggleStatus(c.id);
      setCenters(prev => prev.map(x => x.id === c.id ? { ...x, is_active: res.is_active } : x));
      showToast(res.is_active ? "تم تفعيل السنتر" : "تم تعطيل السنتر");
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
      await AdminCentersService.deleteCenter(confirmDelete.id);
      setCenters(prev => prev.filter(c => c.id !== confirmDelete.id));
      showToast("تم حذف السنتر بنجاح");
      setConfirmDelete(null);
    } catch (err: any) {
      showToast(err.message || "فشل الحذف", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-7 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}
            title="العودة للرئيسية"
          >
            <ArrowRight size={17} />
          </button>
          <div className="w-[44px] h-[44px] rounded-[14px] bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
              إدارة السناتر
            </h1>
            <p className="text-sm text-slate-500">{centers.length} سنتر مسجل</p>
          </div>
        </div>
        {isSuperAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /><span>إنشاء سنتر</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : centers.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد سناتر بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="students-table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th style={{ textAlign: "center" }}>المدرسون</th>
                  <th style={{ textAlign: "center" }}>الموظفون</th>
                  <th style={{ textAlign: "center" }}>الحالة</th>
                  <th style={{ textAlign: "center" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {centers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <button
                        onClick={() => openDetails(c)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem", padding: 0 }}
                      >
                        {c.name}
                        <ChevronRight size={14} color="var(--text-muted)" />
                      </button>
                    </td>
                    <td style={{ direction: "ltr", textAlign: "right", color: "var(--text-secondary)" }}>{c.email}</td>
                    <td style={{ textAlign: "center", color: "#5eead4" }}>{c.teachers_count}</td>
                    <td style={{ textAlign: "center", color: "#818cf8" }}>{c.assistants_count}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.75rem", padding: "0.2rem 0.7rem", borderRadius: "999px",
                        background: c.is_active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                        color: c.is_active ? "#4ade80" : "#f87171",
                        border: `1px solid ${c.is_active ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                      }}>
                        {c.is_active ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                        <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem" }} onClick={() => openEdit(c)} title="تعديل">
                          <Pencil size={14} />
                        </button>
                        {isSuperAdmin && (
                          <>
                            <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem" }} onClick={() => openResetPassword(c)} title="تغيير كلمة المرور">
                              <KeyRound size={14} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem" }} onClick={() => handleToggleStatus(c)} disabled={actionLoading}>
                              {c.is_active ? <ToggleRight size={14} color="#4ade80" /> : <ToggleLeft size={14} color="#f87171" />}
                            </button>
                            <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", color: "#f87171" }} onClick={() => setConfirmDelete(c)}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
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
              <h2 className="font-bold text-base">{modal === "create" ? "إنشاء سنتر جديد" : "تعديل بيانات السنتر"}</h2>
              <button onClick={closeModal} className="bg-transparent border-0 cursor-pointer text-slate-400"><X size={18} /></button>
            </div>
            <form onSubmit={modal === "create" ? handleCreate : handleEdit} className="flex flex-col gap-4">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">اسم السنتر *</label>
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
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">الهاتف</label>
                <input className="form-input" dir="ltr" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">العنوان</label>
                <input className="form-input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "جاري الحفظ..." : modal === "create" ? "إنشاء" : "حفظ"}
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

      {/* Center Details Modal */}
      {modal === "details" && selected && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-lg border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base">{selected.name}</h2>
              <button onClick={closeModal} className="bg-transparent border-0 cursor-pointer text-slate-400"><X size={18} /></button>
            </div>
            {detailsLoading ? (
              <div className="text-center py-8"><div className="spinner mx-auto" /></div>
            ) : detailsData ? (
              <div className="flex flex-col gap-4">
                {/* Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {[
                    { label: "البريد", value: detailsData.email },
                    { label: "الهاتف", value: detailsData.phone || "—" },
                    { label: "العنوان", value: detailsData.address || "—" },
                    { label: "تاريخ الإنشاء", value: detailsData.created_at ? new Date(detailsData.created_at).toLocaleDateString("ar-EG") : "—" },
                  ].map(item => (
                    <div key={item.label} style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{item.label}</p>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Teachers */}
                {detailsData.teachers?.length > 0 && (
                  <div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      المدرسون ({detailsData.teachers.length})
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {detailsData.teachers.map((t: any) => (
                        <div key={t._id || t.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: "0.85rem" }}>{t.name}</span>
                          <span style={{ fontSize: "0.75rem", color: t.is_active ? "#4ade80" : "#f87171" }}>{t.is_active ? "نشط" : "معطل"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Staff */}
                {detailsData.staff?.length > 0 && (
                  <div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      الموظفون ({detailsData.staff.length})
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {detailsData.staff.map((s: any) => (
                        <div key={s._id || s.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: "0.85rem" }}>{s.name}</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.permissions?.join(", ") || "لا صلاحيات"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-sm border border-red-500/30">
            <h2 className="font-bold text-base text-red-400 mb-3">تأكيد الحذف</h2>
            <p className="text-sm text-slate-400 mb-5">هل أنت متأكد من حذف السنتر <strong className="text-white">&quot;{confirmDelete.name}&quot;</strong>؟ لا يمكن التراجع.</p>
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
