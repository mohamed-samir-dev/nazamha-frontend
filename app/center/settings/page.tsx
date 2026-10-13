"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Building2, DoorOpen, ShieldCheck, ClipboardList,
  Eye, EyeOff, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, X,
  ChevronDown, ChevronUp, RefreshCw, Clock,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { CenterService } from "@/lib/services/centerService";
import { AuthService } from "@/lib/services/authService";
import { CenterUser, CenterRoom, CenterAuditEntry } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";
import { getAuditLabel, formatRelativeTime } from "./_components/auditUtils";

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon, title, children, className }: { icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-panel overflow-hidden${className ? ` ${className}` : ""}`}>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.07]">
        <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 shrink-0">
          {icon}
        </div>
        <h2 className="text-[1rem] font-bold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-group" style={{ margin: 0 }}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function Badge({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: "0.72rem", padding: "0.15rem 0.65rem", borderRadius: "999px", whiteSpace: "nowrap",
      background: active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
      color: active ? "#4ade80" : "#f87171",
      border: `1px solid ${active ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
    }}>
      {active ? "نشطة" : "غير نشطة"}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CenterSettingsPage() {
  const [centerData, setCenterData] = useState<CenterUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });

  // Center info form
  const [infoForm, setInfoForm] = useState({ name: "", manager_name: "", phone: "", whatsapp: "", email: "", address: "", governorate: "" });
  const [savingInfo, setSavingInfo] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Rooms
  const [rooms, setRooms] = useState<CenterRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomModal, setRoomModal] = useState<"add" | "edit" | null>(null);
  const [editRoom, setEditRoom] = useState<CenterRoom | null>(null);
  const [roomForm, setRoomForm] = useState({ name: "", capacity: "" });
  const [savingRoom, setSavingRoom] = useState(false);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState<CenterRoom | null>(null);

  // Audit log
  const [auditLogs, setAuditLogs] = useState<CenterAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);

  useEffect(() => {
    AuthService.getUser().then(user => {
      if (user) {
        const u = user as any;
        setCenterData(u);
        setInfoForm({
          name: u.name || "",
          manager_name: u.manager_name || "",
          phone: u.phone || "",
          whatsapp: u.whatsapp || "",
          email: u.email || "",
          address: u.address || "",
          governorate: u.governorate || "",
        });
      }
    }).catch(() => showToast("فشل تحميل البيانات", "error"))
      .finally(() => setLoading(false));

    CenterService.getRooms()
      .then(setRooms)
      .catch(() => {})
      .finally(() => setRoomsLoading(false));

    loadAudit(1);
  }, []);

  const loadAudit = useCallback((page: number) => {
    setAuditLoading(true);
    CenterService.getAuditLog(page, 20)
      .then(res => { setAuditLogs(res.data); setAuditPages(res.pages); setAuditPage(page); })
      .catch(() => {})
      .finally(() => setAuditLoading(false));
  }, []);

  // ── Save center info ───────────────────────────────────────────────────────
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoForm.name.trim() || infoForm.name.trim().length < 2) {
      showToast("اسم السنتر يجب أن يكون حرفين على الأقل", "error"); return;
    }
    setSavingInfo(true);
    try {
      const updated = await CenterService.updateInfo({
        name: infoForm.name.trim(),
        manager_name: infoForm.manager_name.trim() || undefined,
        phone: infoForm.phone.trim() || undefined,
        whatsapp: infoForm.whatsapp.trim() || undefined,
        address: infoForm.address.trim() || undefined,
        governorate: infoForm.governorate.trim() || undefined,
      });
      setCenterData(prev => prev ? { ...prev, ...updated } : updated);
      AuthService.clearUserCache();
      showToast("تم حفظ البيانات بنجاح");
    } catch (err: any) {
      showToast(err.message || "فشل حفظ البيانات", "error");
    } finally {
      setSavingInfo(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { showToast("كلمة المرور الجديدة غير متطابقة", "error"); return; }
    if (pwForm.next.length < 6) { showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error"); return; }
    setSavingPw(true);
    try {
      await AuthService.changePassword(pwForm.current, pwForm.next);
      showToast("تم تغيير كلمة المرور بنجاح");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      showToast(err.message || "فشل تغيير كلمة المرور", "error");
    } finally {
      setSavingPw(false);
    }
  };

  // ── Room handlers ──────────────────────────────────────────────────────────
  const openAddRoom = () => { setRoomForm({ name: "", capacity: "" }); setEditRoom(null); setRoomModal("add"); };
  const openEditRoom = (r: CenterRoom) => { setRoomForm({ name: r.name, capacity: String(r.capacity) }); setEditRoom(r); setRoomModal("edit"); };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimName = roomForm.name.trim();
    if (!trimName) { showToast("اسم القاعة مطلوب", "error"); return; }
    const cap = Number(roomForm.capacity);
    if (!Number.isInteger(cap) || cap < 1) { showToast("السعة يجب أن تكون رقماً صحيحاً موجباً", "error"); return; }
    setSavingRoom(true);
    try {
      if (roomModal === "add") {
        const r = await CenterService.createRoom({ name: trimName, capacity: cap });
        setRooms(prev => [r, ...prev]);
        showToast("تم إضافة القاعة بنجاح");
      } else if (editRoom) {
        const r = await CenterService.updateRoom(editRoom.id, { name: trimName, capacity: cap });
        setRooms(prev => prev.map(x => x.id === r.id ? r : x));
        showToast("تم تحديث القاعة بنجاح");
      }
      setRoomModal(null);
      loadAudit(1);
    } catch (err: any) {
      showToast(err.message || "فشل حفظ القاعة", "error");
    } finally {
      setSavingRoom(false);
    }
  };

  const handleToggleRoom = async (r: CenterRoom) => {
    try {
      const res = await CenterService.toggleRoom(r.id);
      setRooms(prev => prev.map(x => x.id === r.id ? { ...x, is_active: res.is_active } : x));
      showToast(res.is_active ? "تم تفعيل القاعة" : "تم تعطيل القاعة");
      loadAudit(1);
    } catch (err: any) {
      showToast(err.message || "فشل تغيير الحالة", "error");
    }
  };

  const handleDeleteRoom = async () => {
    if (!confirmDeleteRoom) return;
    try {
      await CenterService.deleteRoom(confirmDeleteRoom.id);
      setRooms(prev => prev.filter(x => x.id !== confirmDeleteRoom.id));
      showToast("تم حذف القاعة بنجاح");
      setConfirmDeleteRoom(null);
      loadAudit(1);
    } catch (err: any) {
      showToast(err.message || "فشل الحذف", "error");
    }
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-7 pb-5 border-b border-white/[0.08]">
        <div className="w-[44px] h-[44px] rounded-[14px] bg-slate-500/10 border border-slate-500/30 text-slate-400 flex items-center justify-center">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-[1.5rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
            إعدادات السنتر
          </h1>
          <p className="text-sm text-slate-500">{centerData?.name || "السنتر"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── 1. بيانات السنتر ─────────────────────────────────────────── */}
        <Section icon={<Building2 size={17} />} title="بيانات السنتر">
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="اسم السنتر *">
                <input className="form-input" value={infoForm.name} onChange={e => setInfoForm(p => ({ ...p, name: e.target.value }))} required />
              </Field>
              <Field label="اسم المدير">
                <input className="form-input" value={infoForm.manager_name} onChange={e => setInfoForm(p => ({ ...p, manager_name: e.target.value }))} />
              </Field>
              <Field label="رقم الهاتف *">
                <input className="form-input" dir="ltr" placeholder="01xxxxxxxxx" value={infoForm.phone} onChange={e => setInfoForm(p => ({ ...p, phone: e.target.value }))} />
              </Field>
              <Field label="رقم واتساب">
                <div className="relative">
                  <input className="form-input" dir="ltr" placeholder="01xxxxxxxxx" value={infoForm.whatsapp} onChange={e => setInfoForm(p => ({ ...p, whatsapp: e.target.value }))} style={{ paddingRight: "2.5rem" }} />
                  <FaWhatsapp size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
                </div>
              </Field>
              <Field label="البريد الإلكتروني">
                <input className="form-input" value={infoForm.email} disabled dir="ltr" style={{ opacity: 0.5, cursor: "not-allowed" }} />
              </Field>
              <Field label="المحافظة / المنطقة">
                <input className="form-input" value={infoForm.governorate} onChange={e => setInfoForm(p => ({ ...p, governorate: e.target.value }))} />
              </Field>
            </div>
            <Field label="العنوان">
              <input className="form-input" value={infoForm.address} onChange={e => setInfoForm(p => ({ ...p, address: e.target.value }))} />
            </Field>
            <div>
              <button type="submit" className="btn btn-primary" disabled={savingInfo}>
                {savingInfo ? "جاري الحفظ..." : "حفظ البيانات"}
              </button>
            </div>
          </form>
        </Section>

        {/* ── 2. القاعات ───────────────────────────────────────────────── */}
        <div className="hidden">
        <Section icon={<DoorOpen size={17} />} title="القاعات">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <button className="btn btn-primary" style={{ fontSize: "0.83rem", padding: "0.4rem 1rem" }} onClick={openAddRoom}>
                <Plus size={14} /><span>إضافة قاعة</span>
              </button>
            </div>

            {roomsLoading ? (
              <div className="flex flex-col gap-2">
                {[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />)}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <DoorOpen size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">لا توجد قاعات حتى الآن</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {rooms.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.12] transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <DoorOpen size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[0.9rem] text-white truncate">{r.name}</p>
                        <p className="text-[0.73rem] text-slate-500">السعة: {r.capacity} طالب</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge active={r.is_active} />
                      <button className="btn btn-secondary" style={{ padding: "0.28rem 0.5rem" }} title="تعديل" onClick={() => openEditRoom(r)}>
                        <Pencil size={13} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: "0.28rem 0.5rem" }} title={r.is_active ? "تعطيل" : "تفعيل"} onClick={() => handleToggleRoom(r)}>
                        {r.is_active ? <ToggleRight size={14} color="#4ade80" /> : <ToggleLeft size={14} color="#f87171" />}
                      </button>
                      <button className="btn btn-secondary" style={{ padding: "0.28rem 0.5rem", color: "#f87171" }} title="حذف" onClick={() => setConfirmDeleteRoom(r)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
        </div>

        {/* ── 3. الحساب والأمان ────────────────────────────────────────── */}
        <Section icon={<ShieldCheck size={17} />} title="الحساب والأمان">
          <div className="flex flex-col gap-5">
            {centerData?.last_login_at && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.07]">
                <Clock size={15} className="text-slate-500 shrink-0" />
                <div>
                  <p className="text-[0.78rem] text-slate-500">آخر تسجيل دخول</p>
                  <p className="text-[0.85rem] text-slate-300 font-medium">
                    {new Date(centerData.last_login_at).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            )}
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <p className="text-[0.85rem] font-semibold text-slate-400">تغيير كلمة المرور</p>
              {[
                { label: "كلمة المرور الحالية", key: "current" as const },
                { label: "كلمة المرور الجديدة", key: "next" as const },
                { label: "تأكيد كلمة المرور الجديدة", key: "confirm" as const },
              ].map(({ label, key }) => (
                <Field key={key} label={label}>
                  <div className="relative">
                    <input
                      className="form-input"
                      type={showPw ? "text" : "password"}
                      dir="ltr"
                      value={pwForm[key]}
                      onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                      required
                      style={{ paddingLeft: "2.5rem" }}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>
              ))}
              <div>
                <button type="submit" className="btn btn-primary" disabled={savingPw}>
                  {savingPw ? "جاري التغيير..." : "تغيير كلمة المرور"}
                </button>
              </div>
            </form>
          </div>
        </Section>

        {/* ── 4. السجل الإداري ─────────────────────────────────────────── */}
        <Section icon={<ClipboardList size={17} />} title="السجل الإداري" className="lg:col-span-2">
          {auditLoading ? (
            <div className="flex flex-col gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <ClipboardList size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">لا توجد نشاطات مسجلة حتى الآن</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {auditLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all">
                  <div className="w-2 h-2 rounded-full bg-teal-500/60 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.85rem] text-slate-200">{getAuditLabel(log.action, log.new_data)}</p>
                  </div>
                  <span className="text-[0.72rem] text-slate-600 whitespace-nowrap shrink-0 mt-0.5">
                    {formatRelativeTime(log.created_at)}
                  </span>
                </div>
              ))}
              {auditPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem" }}
                    disabled={auditPage <= 1} onClick={() => loadAudit(auditPage - 1)}>
                    السابق
                  </button>
                  <span className="text-[0.78rem] text-slate-500">{auditPage} / {auditPages}</span>
                  <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem" }}
                    disabled={auditPage >= auditPages} onClick={() => loadAudit(auditPage + 1)}>
                    التالي
                  </button>
                </div>
              )}
            </div>
          )}
        </Section>
      </div>

      {/* ── Room Modal ────────────────────────────────────────────────────── */}
      {roomModal && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-sm border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base">{roomModal === "add" ? "إضافة قاعة" : "تعديل القاعة"}</h2>
              <button onClick={() => setRoomModal(null)} className="bg-transparent border-0 cursor-pointer text-slate-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveRoom} className="flex flex-col gap-4">
              <Field label="اسم القاعة *">
                <input className="form-input" value={roomForm.name} onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))} required />
              </Field>
              <Field label="عدد الطلاب المسموح *">
                <input className="form-input" type="number" min={1} max={1000} step={1} dir="ltr"
                  value={roomForm.capacity} onChange={e => setRoomForm(p => ({ ...p, capacity: e.target.value }))} required />
              </Field>
              <div className="flex gap-3 justify-end mt-1">
                <button type="button" className="btn btn-secondary" onClick={() => setRoomModal(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={savingRoom}>
                  {savingRoom ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Room ───────────────────────────────────────────── */}
      {confirmDeleteRoom && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-sm border border-red-500/30">
            <h2 className="font-bold text-base text-red-400 mb-3">تأكيد الحذف</h2>
            <p className="text-sm text-slate-400 mb-5">
              هل أنت متأكد من حذف القاعة <strong className="text-white">&quot;{confirmDeleteRoom.name}&quot;</strong>؟
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-secondary" onClick={() => setConfirmDeleteRoom(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={handleDeleteRoom}>حذف</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
