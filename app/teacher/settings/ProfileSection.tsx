"use client";

import { useState } from "react";
import { User, Mail, Phone, Save, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";

interface Props {
  name: string;
  phone: string;
  email: string;
  saving: boolean;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSave: () => void;
  onToast: (message: string, type?: "success" | "error") => void;
}

export function ProfileSection({ name, phone, email, saving, onNameChange, onPhoneChange, onSave, onToast }: Props) {
  // Bug 4 fix: only flag an error when the field is non-empty AND invalid.
  // An empty phone is allowed (optional field), so coerce to boolean explicitly.
  const phoneError = phone.length > 0 && !/^01\d{9}$/.test(phone);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      onToast("يرجى ملء جميع حقول كلمة المرور", "error"); return;
    }
    if (newPassword.length < 6) {
      onToast("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل", "error"); return;
    }
    if (newPassword !== confirmPassword) {
      onToast("كلمة المرور الجديدة وتأكيدها غير متطابقتين", "error"); return;
    }
    setPwLoading(true);
    try {
      await api.patch("/auth/change-password", { currentPassword, newPassword });
      onToast("✓ تم تغيير كلمة المرور بنجاح");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: unknown) {
      onToast(getErrorMessage(err, "حدث خطأ أثناء تغيير كلمة المرور."), "error");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* بيانات الحساب */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <div className="form-group" style={{ flex: "1 1 200px" }}>
          <Input
            label="اسم المعلم الكامل"
            id="tName"
            type="text"
            required
            placeholder="مثال: أستاذ أحمد محمود"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            leftIcon={<User size={18} />}
          />
        </div>
        <div className="form-group" style={{ flex: "1 1 200px" }}>
          <Input
            label="رقم الهاتف (واتساب)"
            id="tPhone"
            type="tel"
            placeholder="01012345678"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            style={{ direction: "ltr", textAlign: "right", borderColor: phoneError ? "var(--color-danger)" : undefined }}
            leftIcon={<Phone size={16} />}
          />
          {phoneError && (
            <p style={{ fontSize: "0.78rem", color: "var(--color-danger)", marginTop: "0.25rem" }}>
              يجب أن يبدأ بـ 01 ويتكون من 11 رقم
            </p>
          )}
        </div>
        <div className="form-group" style={{ flex: "1 1 200px" }}>
          <Input
            label="البريد الإلكتروني"
            id="tEmail"
            type="email"
            value={email}
            disabled
            style={{ direction: "ltr", textAlign: "right", opacity: 0.6 }}
            leftIcon={<Mail size={18} />}
          />
        </div>
        <div style={{ flex: "1 1 100%", display: "flex", justifyContent: "flex-end" }}>
          {/* Bug 4 fix: disable the button when the phone is visibly invalid so the
              user gets immediate feedback instead of a confusing blocked submit. */}
          <Button type="button" variant="primary" onClick={onSave} isLoading={saving} disabled={!!phoneError} leftIcon={!saving && <Save size={16} />}>
            حفظ البيانات
          </Button>
        </div>
      </div>

      {/* تغيير كلمة المرور */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Lock size={16} style={{ color: "var(--color-teal)" }} />
          تغيير كلمة المرور
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <div className="form-group" style={{ flex: "1 1 200px" }}>
            <Input
              label="كلمة المرور الحالية"
              id="currentPw"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowCurrent((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>
          <div className="form-group" style={{ flex: "1 1 200px" }}>
            <Input
              label="كلمة المرور الجديدة"
              id="newPw"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowNew((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>
          <div className="form-group" style={{ flex: "1 1 200px" }}>
            <Input
              label="تأكيد كلمة المرور الجديدة"
              id="confirmPw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
            />
          </div>
          <div style={{ flex: "1 1 100%", display: "flex", justifyContent: "flex-end" }}>
            <Button type="button" variant="primary" onClick={handleChangePassword} isLoading={pwLoading} leftIcon={!pwLoading && <Save size={16} />}>
              تغيير كلمة المرور
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
