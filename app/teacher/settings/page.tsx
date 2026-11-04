"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthService } from "@/lib/services/authService";
import { Settings, MessageCircle } from "lucide-react";

import { TeachersService } from "@/lib/services/teachersService";
import { getErrorMessage } from "@/lib/errors";
import { OfflineCache } from "@/lib/offlineQueue";

import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

import { ProfileSection, normalizeArabicDigits } from "./ProfileSection";
import { AcademicYearSection, MonthYear } from "./AcademicYearSection";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [activeMonths, setActiveMonths] = useState<number[]>([9, 10, 11, 12, 1, 2, 3, 4, 5]);
  const [activeMonthYears, setActiveMonthYears] = useState<MonthYear[]>([]);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);

  // Pre-fill immediately from OfflineCache if available to prevent layout flash
  useEffect(() => {
    const cached = OfflineCache.loadTeacher();
    if (cached) {
      if (cached.id) setUserId(cached.id);
      if (cached.name) setName(cached.name);
      if (cached.teacherCode) setTeacherCode(cached.teacherCode);
      if (cached.phone) setPhone(cached.phone);
      if (cached.email) setEmail(cached.email);
      if (cached.academic_year?.active_months?.length) {
        setActiveMonths(cached.academic_year.active_months);
      }
      if (cached.academic_year?.active_month_years?.length) {
        setActiveMonthYears(cached.academic_year.active_month_years);
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      try {
        const currentUser = await AuthService.getUser();
        if (!currentUser || cancelled) return;
        setUserId(currentUser.id);
        setEmail(currentUser.email || "");

        if (currentUser.teacherCode) setTeacherCode(currentUser.teacherCode);

        const teacherProfile = await TeachersService.getTeacherProfile(currentUser.id);
        if (cancelled) return;

        if (teacherProfile) {
          setName(teacherProfile.name || "");
          if (teacherProfile.teacherCode) setTeacherCode(teacherProfile.teacherCode);
          setPhone(teacherProfile.phone || "");
          if (teacherProfile.academic_year?.active_months?.length) {
            setActiveMonths(teacherProfile.academic_year.active_months);
          }
          if (teacherProfile.academic_year?.active_month_years?.length) {
            setActiveMonthYears(teacherProfile.academic_year.active_month_years);
          } else if (teacherProfile.academic_year?.active_months?.length) {
            const now = new Date();
            const cm = now.getMonth() + 1;
            const cy = now.getFullYear();
            const acStart = cm >= 7 ? cy : cy - 1;
            setActiveMonthYears(
              teacherProfile.academic_year.active_months.map((m) => ({
                month: m,
                year: m >= 7 ? acStart : acStart + 1,
              }))
            );
          }
        }
      } catch (err: unknown) {
        if (!cancelled) showToast(getErrorMessage(err, "حدث خطأ أثناء تحميل الإعدادات."), "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => { cancelled = true; };
  }, [showToast]);

  const saveAcademicYear = useCallback(async (months: number[], monthYears: MonthYear[]) => {
    if (!userId) return;
    try {
      await TeachersService.updateTeacherProfile(userId, {
        academic_year: { active_months: months, active_month_years: monthYears },
      });
      // Synchronize both in-memory cache and offline storage
      AuthService.clearUserCache();
      const currentTeacher = OfflineCache.loadTeacher();
      if (currentTeacher) {
        OfflineCache.saveTeacher({
          ...currentTeacher,
          academic_year: { active_months: months, active_month_years: monthYears },
        });
      }
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "حدث خطأ أثناء حفظ السنة الدراسية."), "error");
      throw err;
    }
  }, [userId, showToast]);

  const handleSaveProfile = useCallback(async () => {
    const trimmedName = name.trim();
    if (!userId || !trimmedName) return;

    const normalizedPhone = normalizeArabicDigits(phone);
    if (normalizedPhone && !/^01[0125]\d{8}$/.test(normalizedPhone)) {
      showToast("رقم الهاتف يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقم.", "error");
      return;
    }

    setProfileSaveLoading(true);
    try {
      await TeachersService.updateTeacherProfile(userId, { name: trimmedName, phone: normalizedPhone });
      AuthService.clearUserCache();

      // Synchronize with OfflineCache so subsequent visits don't flash old data
      const currentTeacher = OfflineCache.loadTeacher();
      if (currentTeacher) {
        OfflineCache.saveTeacher({
          ...currentTeacher,
          name: trimmedName,
          phone: normalizedPhone,
        });
      }

      window.dispatchEvent(new CustomEvent("teacher-profile-updated", { detail: { name: trimmedName } }));
      showToast("✓ تم حفظ البيانات بنجاح.");
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "حدث خطأ أثناء حفظ البيانات الشخصية."), "error");
    } finally {
      setProfileSaveLoading(false);
    }
  }, [userId, name, phone, showToast]);

  if (loading) return <Spinner fullScreen />;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>الإعدادات</h1>
        <p style={{ color: "var(--text-secondary)" }}>تخصيص بيانات الحساب وإعدادات السنة الدراسية</p>
      </div>

      <div className="settings-layout">
        <div className="settings-main">
          {/* البيانات الشخصية */}
          <div className="glass-panel panel-content" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
            <h2 className="panel-title" style={{ marginBottom: "1.5rem" }}>
              <Settings size={18} style={{ color: "var(--color-teal)" }} />
              <span>البيانات الشخصية</span>
            </h2>
            <ProfileSection
              name={name}
              teacherCode={teacherCode}
              phone={phone}
              email={email}
              saving={profileSaveLoading}
              onNameChange={setName}
              onPhoneChange={setPhone}
              onSave={handleSaveProfile}
              onToast={showToast}
            />
          </div>

          {/* السنة الدراسية */}
          <div className="glass-panel panel-content" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
            <AcademicYearSection
              activeMonths={activeMonths}
              activeMonthYears={activeMonthYears}
              onChange={(months, monthYears) => {
                setActiveMonths(months);
                setActiveMonthYears(monthYears);
              }}
              onSave={saveAcademicYear}
              onToast={showToast}
            />
          </div>
        </div>

        {/* Support Card */}
        <div className="settings-sidebar">
          <div className="glass-panel panel-content settings-support-card">
            <div className="settings-support-icon">
              <MessageCircle size={35} color="white" />
            </div>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "0.75rem", fontWeight: 700 }}>هل تحتاج إلى مساعدة؟</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "2rem", lineHeight: "1.6" }}>
              فريق الدعم الفني متواجد دائماً لمساعدتك في أي استفسار أو مشكلة تواجهك في المنصة.
            </p>
            <a
              href="https://wa.me/201012486445"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", backgroundColor: "#25D366", borderColor: "#25D366", color: "white", padding: "0.75rem", fontSize: "1rem" }}
            >
              <MessageCircle size={20} />
              تواصل معنا عبر واتساب
            </a>
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
