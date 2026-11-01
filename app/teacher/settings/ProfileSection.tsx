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

export function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[\s\-_]/g, "");
}

export function ProfileSection({ name, phone, email, saving, onNameChange, onPhoneChange, onSave, onToast }: Props) {
  // Egyptian mobile numbers strictly start with 010, 011, 012, or 015 and have 11 digits
  const normalizedPhone = normalizeArabicDigits(phone);
  const phoneError = normalizedPhone.length > 0 && !/^01[0125]\d{8}$/.test(normalizedPhone);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handlePhoneInputChange = (val: string) => {
    onPhoneChange(normalizeArabicDigits(val));
  };

  const handleChangePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      onToast("يرجى ملء جميع حقول كلمة المرور", "error");
      return;
    }
    if (newPassword.length < 6) {
      onToast("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      onToast("كلمة المرور الجديدة وتأكيدها غير متطابقتين", "error");
      return;
    }
    setPwLoading(true);
    try {
      await api.patch("/auth/change-password", { currentPassword, newPassword });
      onToast("✓ تم تغيير كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      onToast(getErrorMessage(err, "حدث خطأ أثناء تغيير كلمة المرور."), "error");
    } finally {
      setPwLoading(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneError || saving) return;
    onSave();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* بيانات الحساب */}
      <form onSubmit={handleProfileSubmit}>
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
              onChange={(e) => handlePhoneInputChange(e.target.value)}
              style={{ direction: "ltr", textAlign: "right", borderColor: phoneError ? "var(--color-danger)" : undefined }}
              leftIcon={<Phone size={16} />}
            />
            {phoneError && (
              <p style={{ fontSize: "0.78rem", color: "var(--color-danger)", marginTop: "0.25rem" }}>
                يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقم
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
              style={{ direction: "ltr", textAlign: "right", opacity: 0.7 }}
              leftIcon={<Mail size={18} />}
            />
            <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              البريد الإلكتروني مرتبط بحسابك ولا يمكن تعديله من هنا.
            </p>
          </div>
          <div style={{ flex: "1 1 100%", display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={!!phoneError || !name.trim()}
              leftIcon={!saving && <Save size={16} />}
            >
              حفظ البيانات
            </Button>
          </div>
        </div>
      </form>

      {/* تغيير كلمة المرور */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Lock size={16} style={{ color: "var(--color-teal)" }} />
          تغيير كلمة المرور
        </h3>
        <form onSubmit={handleChangePassword}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <div className="form-group" style={{ flex: "1 1 200px" }}>
              <Input
                label="كلمة المرور الحالية"
                id="currentPw"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    aria-label={showCurrent ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    onClick={() => setShowCurrent((v) => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}
                  >
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
                autoComplete="new-password"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    aria-label={showNew ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    onClick={() => setShowNew((v) => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>
            <div className="form-group" style={{ flex: "1 1 200px" }}>
              <Input
                label="تأكيد كلمة المرور الجديدة"
                id="confirmPw"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>
            <div style={{ flex: "1 1 100%", display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="primary"
                isLoading={pwLoading}
                leftIcon={!pwLoading && <Save size={16} />}
              >
                تغيير كلمة المرور
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
