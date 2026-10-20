"use client";

import { useState } from "react";
import { Users, Plus, X } from "lucide-react";
import { StudentsService } from "@/lib/services/studentsService";
import { Button } from "@/components/ui/Button";
import { SiblingFamily } from "../types";

interface Props {
  onClose: () => void;
  onCreated: (familyId: string, familyName: string) => void;
  existingFamilies: SiblingFamily[];
  getFamilyDisplayName: (family: SiblingFamily) => string;
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-500/50 transition-all";

export function AddFamilyModal({ onClose, onCreated, existingFamilies, getFamilyDisplayName }: Props) {
  const [familyName, setFamilyName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (!val) { setPhoneError("رقم الهاتف مطلوب"); return; }
    if (!/^01\d{9}$/.test(val)) { setPhoneError("يجب أن يكون 11 رقمًا ويبدأ بـ 01"); return; }
    const duplicate = existingFamilies.find((f) => f.parentPhone === val || f.members.some((m) => m.parent_phone === val));
    if (duplicate) { setPhoneError(`هذا الرقم مسجل بالفعل في عائلة "${getFamilyDisplayName(duplicate)}"`); return; }
    setPhoneError("");
  };

  const handleSubmit = async () => {
    if (!familyName.trim() || !phone || phoneError) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await StudentsService.createFamily(familyName.trim(), phone.trim());
      onCreated(res.familyId, res.familyName);
    } catch (error) {
      setError(error instanceof Error ? error.message : "تعذر إنشاء العائلة. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--bg-card,#1a1a2e)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Users size={17} className="text-teal-400" />
            <span className="font-bold text-sm text-teal-400">إضافة عائلة جديدة</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-white/8 hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              اسم العائلة <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="مثال: عائلة محمد"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              رقم هاتف الأب <span className="text-red-400">*</span>
            </label>
            <input
              className={`${inputCls} text-right`}
              type="tel"
              placeholder="01012345678"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              dir="ltr"
            />
            {phoneError && (
              <p className="text-xs text-red-400 mt-1.5">{phoneError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/8 bg-white/2">
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={submitting}
            leftIcon={<Plus size={15} />}
            disabled={!familyName.trim() || !phone || !!phoneError || submitting}
          >
            إنشاء العائلة
          </Button>
        </div>
      </div>
    </div>
  );
}
