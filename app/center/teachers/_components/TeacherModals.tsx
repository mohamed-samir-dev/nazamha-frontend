"use client";

import { useState } from "react";
import { X, Eye, EyeOff, GraduationCap, UserCheck } from "lucide-react";
import { CenterTeacher, StaffUser } from "@/lib/types";
import {
  validateName, validateEmail, validatePassword,
  validatePhone, validateSubject,
} from "./validation";
import { getErrorMessage } from "@/lib/errors";

// ── Shared field error display ────────────────────────────────────────────────
function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="text-[0.75rem] text-red-400 mt-0.5">{msg}</p>;
}

// ── Password input with show/hide ─────────────────────────────────────────────
function PasswordInput({
  value, onChange, placeholder = "كلمة المرور",
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        className="form-input"
        type={show ? "text" : "password"}
        dir="ltr"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: "2.5rem" }}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow(p => !p)}
        style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#1e2433] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md border border-white/10 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base">{title}</h2>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Create Teacher Modal ──────────────────────────────────────────────────────
interface CreateTeacherModalProps {
  onClose: () => void;
  onCreated: (t: CenterTeacher) => void;
  createFn: (data: { name: string; email: string; password: string; phone?: string; subject?: string }) => Promise<CenterTeacher>;
}

export function CreateTeacherModal({ onClose, onCreated, createFn }: CreateTeacherModalProps) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", subject: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
    setServerError("");
  };

  const validate = () => {
    const e: Record<string, string> = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      phone: validatePhone(form.phone),
      subject: validateSubject(form.subject),
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const t = await createFn({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || undefined,
      });
      onCreated(t);
    } catch (err: unknown) {
      setServerError(getErrorMessage(err, "حدث خطأ أثناء إضافة المدرس."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="إضافة مدرس جديد" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && (
          <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{serverError}</div>
        )}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">الاسم *</label>
          <input className={`form-input ${errors.name ? "border-red-500/50" : ""}`} value={form.name} onChange={e => set("name", e.target.value)} />
          <FieldError msg={errors.name} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">البريد الإلكتروني *</label>
          <input className={`form-input ${errors.email ? "border-red-500/50" : ""}`} type="email" dir="ltr" value={form.email} onChange={e => set("email", e.target.value)} autoComplete="off" />
          <FieldError msg={errors.email} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">كلمة المرور *</label>
          <PasswordInput value={form.password} onChange={v => set("password", v)} />
          <FieldError msg={errors.password} />
          {!errors.password && form.password && form.password.length < 8 && (
            <p className="text-[0.72rem] text-slate-500 mt-0.5">8 أحرف على الأقل</p>
          )}
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">المادة</label>
          <input className={`form-input ${errors.subject ? "border-red-500/50" : ""}`} value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="مثال: رياضيات، فيزياء..." />
          <FieldError msg={errors.subject} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">رقم الهاتف</label>
          <input className={`form-input ${errors.phone ? "border-red-500/50" : ""}`} dir="ltr" value={form.phone} onChange={e => set("phone", e.target.value)} inputMode="tel" />
          <FieldError msg={errors.phone} />
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "جاري الإضافة..." : "إضافة المدرس"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Edit Teacher Modal ────────────────────────────────────────────────────────
interface EditTeacherModalProps {
  teacher: CenterTeacher;
  onClose: () => void;
  onUpdated: (t: CenterTeacher) => void;
  updateFn: (id: string, data: Partial<CenterTeacher>) => Promise<CenterTeacher>;
}

export function EditTeacherModal({ teacher, onClose, onUpdated, updateFn }: EditTeacherModalProps) {
  const [form, setForm] = useState({ name: teacher.name, phone: teacher.phone || "", subject: teacher.subject || "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); setServerError(""); };

  const validate = () => {
    const e: Record<string, string> = {
      name: validateName(form.name),
      phone: validatePhone(form.phone),
      subject: validateSubject(form.subject),
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const updated = await updateFn(teacher.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || undefined,
      });
      onUpdated(updated);
    } catch (err: unknown) {
      setServerError(getErrorMessage(err, "حدث خطأ أثناء تحديث بيانات المدرس."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={`تعديل — ${teacher.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{serverError}</div>}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">الاسم *</label>
          <input className={`form-input ${errors.name ? "border-red-500/50" : ""}`} value={form.name} onChange={e => set("name", e.target.value)} />
          <FieldError msg={errors.name} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">البريد الإلكتروني</label>
          <input className="form-input" value={teacher.email} disabled dir="ltr" style={{ opacity: 0.5, cursor: "not-allowed" }} />
          <p className="text-[0.72rem] text-slate-600 mt-0.5">لا يمكن تغيير البريد الإلكتروني</p>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">المادة</label>
          <input className={`form-input ${errors.subject ? "border-red-500/50" : ""}`} value={form.subject} onChange={e => set("subject", e.target.value)} />
          <FieldError msg={errors.subject} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">رقم الهاتف</label>
          <input className={`form-input ${errors.phone ? "border-red-500/50" : ""}`} dir="ltr" value={form.phone} onChange={e => set("phone", e.target.value)} inputMode="tel" />
          <FieldError msg={errors.phone} />
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "جاري الحفظ..." : "حفظ"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Reset Password Modal ──────────────────────────────────────────────────────
interface ResetPasswordModalProps {
  name: string;
  onClose: () => void;
  onReset: (password: string) => Promise<void>;
}

export function ResetPasswordModal({ name, onClose, onReset }: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const pe = validatePassword(password);
    const ce = password !== confirm ? "كلمتا المرور غير متطابقتين" : "";
    setErrors({ password: pe, confirm: ce });
    if (pe || ce) return;
    setLoading(true);
    try {
      await onReset(password);
    } catch (err: unknown) {
      setServerError(getErrorMessage(err, "حدث خطأ أثناء تغيير كلمة المرور."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={`تغيير كلمة المرور — ${name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{serverError}</div>}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">كلمة المرور الجديدة *</label>
          <PasswordInput value={password} onChange={v => { setPassword(v); setErrors(p => ({ ...p, password: "" })); setServerError(""); }} />
          <FieldError msg={errors.password} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">تأكيد كلمة المرور *</label>
          <PasswordInput value={confirm} onChange={v => { setConfirm(v); setErrors(p => ({ ...p, confirm: "" })); }} placeholder="أعد كتابة كلمة المرور" />
          <FieldError msg={errors.confirm} />
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "جاري التغيير..." : "تغيير"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Confirm Toggle Modal ──────────────────────────────────────────────────────
interface ConfirmToggleModalProps {
  teacher: CenterTeacher;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmToggleModal({ teacher, onClose, onConfirm }: ConfirmToggleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const deactivating = teacher.is_active;

  const handle = async () => {
    setLoading(true);
    setError("");
    try { await onConfirm(); }
    catch (err: any) { setError(err.message || "حدث خطأ، حاول مرة أخرى"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`bg-[#1e2433] rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm border ${deactivating ? "border-red-500/30" : "border-teal-500/30"}`}>
        <h2 className={`font-bold text-base mb-3 ${deactivating ? "text-red-400" : "text-teal-400"}`}>
          {deactivating ? "تعطيل المدرس" : "تفعيل المدرس"}
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          {deactivating
            ? <>هل أنت متأكد من تعطيل <strong className="text-white">{teacher.name}</strong>؟ سيتم منعه من تسجيل الدخول.</>
            : <>هل تريد تفعيل <strong className="text-white">{teacher.name}</strong>؟</>
          }
        </p>
        {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm mb-4">{error}</div>}
        <div className="flex gap-3 justify-end">
          <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button className={`btn ${deactivating ? "btn-danger" : "btn-primary"}`} onClick={handle} disabled={loading}>
            {loading ? "جاري..." : deactivating ? "تعطيل" : "تفعيل"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Assistant Modal ───────────────────────────────────────────────────────
interface AddAssistantModalProps {
  teacherId: string;
  teacherName: string;
  onClose: () => void;
  onCreated: (a: StaffUser) => void;
  createFn: (data: { name: string; email: string; password: string; teacher_id: string }) => Promise<StaffUser>;
}

export function AddAssistantModal({ teacherId, teacherName, onClose, onCreated, createFn }: AddAssistantModalProps) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); setServerError(""); };

  const validate = () => {
    const e = { name: validateName(form.name), email: validateEmail(form.email), password: validatePassword(form.password) };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const a = await createFn({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, teacher_id: teacherId });
      onCreated(a);
    } catch (err: any) {
      setServerError(err.message || "فشل إضافة المساعد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={`إضافة مساعد لـ ${teacherName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{serverError}</div>}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">الاسم *</label>
          <input className={`form-input ${errors.name ? "border-red-500/50" : ""}`} value={form.name} onChange={e => set("name", e.target.value)} />
          <FieldError msg={errors.name} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">البريد الإلكتروني *</label>
          <input className={`form-input ${errors.email ? "border-red-500/50" : ""}`} type="email" dir="ltr" value={form.email} onChange={e => set("email", e.target.value)} autoComplete="off" />
          <FieldError msg={errors.email} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">كلمة المرور *</label>
          <PasswordInput value={form.password} onChange={v => set("password", v)} />
          <FieldError msg={errors.password} />
        </div>
        <div className="px-3 py-2 rounded-lg bg-violet-500/[0.06] border border-violet-500/20 flex items-center gap-2">
          <UserCheck size={14} className="text-violet-400 shrink-0" />
          <span className="text-[0.8rem] text-slate-400">سيتم ربط المساعد بـ <strong className="text-white">{teacherName}</strong></span>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "جاري الإضافة..." : "إضافة"}</button>
        </div>
      </form>
    </ModalShell>
  );
}
