"use client";

import { useState } from "react";
import { X, Eye, EyeOff, UserCheck } from "lucide-react";
import { StaffUser, CenterTeacher } from "@/lib/types";
import {
  validateName, validateEmail, validatePassword,
} from "../../teachers/_components/validation";

// ── Shared ────────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="text-[0.75rem] text-red-400 mt-0.5">{msg}</p>;
}

function PasswordInput({ value, onChange, placeholder = "كلمة المرور" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
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

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base">{title}</h2>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Add Assistant Modal ───────────────────────────────────────────────────────
interface AddAssistantModalProps {
  teachers: CenterTeacher[];
  preselectedTeacherId?: string;
  onClose: () => void;
  onCreated: () => void;
  createFn: (data: { name: string; email: string; password: string; teacher_id: string }) => Promise<StaffUser>;
}

export function AddAssistantModal({ teachers, preselectedTeacherId, onClose, onCreated, createFn }: AddAssistantModalProps) {
  const [form, setForm] = useState({ name: "", email: "", password: "", teacher_id: preselectedTeacherId || "" });
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
      teacher_id: form.teacher_id ? "" : "يجب اختيار المدرس",
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
      await createFn({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        teacher_id: form.teacher_id,
      });
      onCreated();
    } catch (err: any) {
      setServerError(err.message || "فشل إضافة المساعد");
    } finally {
      setLoading(false);
    }
  };

  const preselectedTeacher = preselectedTeacherId
    ? teachers.find(t => t.id === preselectedTeacherId)
    : null;

  return (
    <ModalShell title="إضافة مساعد جديد" onClose={onClose}>
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
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">المدرس *</label>
          {preselectedTeacher ? (
            <div className="px-3 py-2.5 rounded-lg bg-violet-500/[0.06] border border-violet-500/20 flex items-center gap-2">
              <UserCheck size={14} className="text-violet-400 shrink-0" />
              <span className="text-[0.85rem] font-semibold text-white">{preselectedTeacher.name}</span>
            </div>
          ) : (
            <>
              <select
                className={`form-input ${errors.teacher_id ? "border-red-500/50" : ""}`}
                value={form.teacher_id}
                onChange={e => set("teacher_id", e.target.value)}
              >
                <option value="">اختر المدرس</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}{t.subject ? ` — ${t.subject}` : ""}</option>
                ))}
              </select>
              <FieldError msg={errors.teacher_id} />
            </>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "جاري الإضافة..." : "إضافة مساعد"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Edit Assistant Modal ──────────────────────────────────────────────────────
interface EditAssistantModalProps {
  assistant: StaffUser;
  onClose: () => void;
  onUpdated: (a: StaffUser) => void;
  updateFn: (id: string, data: { name?: string }) => Promise<StaffUser>;
}

export function EditAssistantModal({ assistant, onClose, onUpdated, updateFn }: EditAssistantModalProps) {
  const [name, setName] = useState(assistant.name);
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const err = validateName(name);
    setNameError(err);
    if (err) return;
    setLoading(true);
    setServerError("");
    try {
      const updated = await updateFn(assistant.id, { name: name.trim() });
      onUpdated(updated);
    } catch (err: any) {
      setServerError(err.message || "فشل التحديث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={`تعديل — ${assistant.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{serverError}</div>}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">الاسم *</label>
          <input
            className={`form-input ${nameError ? "border-red-500/50" : ""}`}
            value={name}
            onChange={e => { setName(e.target.value); setNameError(""); setServerError(""); }}
          />
          <FieldError msg={nameError} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">البريد الإلكتروني</label>
          <input className="form-input" value={assistant.email} disabled dir="ltr" style={{ opacity: 0.5, cursor: "not-allowed" }} />
          <p className="text-[0.72rem] text-slate-600 mt-0.5">لا يمكن تغيير البريد الإلكتروني</p>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "جاري الحفظ..." : "حفظ"}
          </button>
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
    } catch (err: any) {
      setServerError(err.message || "فشل تغيير كلمة المرور");
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "جاري التغيير..." : "تغيير"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
