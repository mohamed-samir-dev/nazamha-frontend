"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { StaffUser, CenterTeacher } from "@/lib/types";

interface TransferModalProps {
  assistant: StaffUser;
  teachers: CenterTeacher[];
  onClose: () => void;
  onTransferred: () => void;
  transferFn: (staffId: string, teacher_id: string) => Promise<void>;
}

export function TransferModal({ assistant, teachers, onClose, onTransferred, transferFn }: TransferModalProps) {
  const [newTeacherId, setNewTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentTeacher = teachers.find(t => t.id === assistant.teacher_id);
  const availableTeachers = teachers.filter(t => t.id !== assistant.teacher_id);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!newTeacherId) { setError("يجب اختيار المدرس الجديد"); return; }
    if (newTeacherId === assistant.teacher_id) {
      setError("هذا المساعد مرتبط بالفعل بهذا المدرس");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await transferFn(assistant.id, newTeacherId);
      onTransferred();
    } catch (err: any) {
      setError(err.message || "فشل نقل المساعد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-sm border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base">نقل مساعد</h2>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Info */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07]">
            <p className="text-[0.73rem] text-slate-500 mb-0.5">المساعد</p>
            <p className="text-[0.9rem] font-semibold">{assistant.name}</p>
          </div>
          <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07]">
            <p className="text-[0.73rem] text-slate-500 mb-0.5">المدرس الحالي</p>
            <p className="text-[0.9rem] font-semibold">{currentTeacher?.name ?? "—"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{error}</div>
          )}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">المدرس الجديد *</label>
            <select
              className={`form-input ${error && !newTeacherId ? "border-red-500/50" : ""}`}
              value={newTeacherId}
              onChange={e => { setNewTeacherId(e.target.value); setError(""); }}
            >
              <option value="">اختر المدرس الجديد</option>
              {availableTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}{t.subject ? ` — ${t.subject}` : ""}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !newTeacherId}>
              {loading ? "جاري النقل..." : "تأكيد النقل"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
