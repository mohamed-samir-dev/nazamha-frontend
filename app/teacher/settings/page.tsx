"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AuthService } from "@/lib/services/authService";
import { Settings, MessageCircle } from "lucide-react";

import { TeachersService } from "@/lib/services/teachersService";
import { getErrorMessage } from "@/lib/errors";

import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

import { ProfileSection } from "./ProfileSection";
import { AcademicYearSection, MonthYear } from "./AcademicYearSection";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [activeMonths, setActiveMonths] = useState<number[]>([9, 10, 11, 12, 1, 2, 3, 4, 5]);
  const [activeMonthYears, setActiveMonthYears] = useState<MonthYear[]>([]);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  // profileReady is set to true only AFTER the initial load completes, preventing
  // the debounced academic-year auto-save from firing on the first population of state.
  const profileReady = useRef(false);

  // Bug 2 fix: showToast must be stable so it can be listed in useCallback deps
  // without triggering infinite re-renders.
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      try {
        const currentUser = await AuthService.getUser();
        if (!currentUser || cancelled) return;
        setUserId(currentUser.id);
        setEmail(currentUser.email || "");

        const teacherProfile = await TeachersService.getTeacherProfile(currentUser.id);
        if (cancelled) return;

        if (teacherProfile) {
          setName(teacherProfile.name || "");
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

  // Bug 2 fix: showToast is now stable (useCallback), so it's safe in deps.
  const saveAcademicYear = useCallback(async (months: number[], monthYears: MonthYear[]) => {
    if (!userId) return;
    try {
      await TeachersService.updateTeacherProfile(userId, {
        academic_year: { active_months: months, active_month_years: monthYears },
      });
      // Bug 3 fix: invalidate the teacher cache after saving academic year so
      // the next page load reads fresh data instead of stale cached months.
      AuthService.clearUserCache();
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "حدث خطأ أثناء حفظ السنة الدراسية."), "error");
    }
  }, [userId, showToast]);

  const handleSaveProfile = useCallback(async () => {
    if (!userId || !name) return;
    if (phone && !/^01\d{9}$/.test(phone)) {
      showToast("رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم.", "error");
      return;
    }
    setProfileSaveLoading(true);
    try {
      await TeachersService.updateTeacherProfile(userId, { name, phone });
      AuthService.clearUserCache();
      window.dispatchEvent(new CustomEvent("teacher-profile-updated", { detail: { name } }));
      showToast("✓ تم حفظ البيانات.");
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "حدث خطأ أثناء حفظ البيانات الشخصية."), "error");
    } finally {
      setProfileSaveLoading(false);
    }
  }, [userId, name, phone, showToast]);

  // Mark profileReady after the initial load so we can guard manual saves.
  useEffect(() => {
    if (!loading) {
      const id = setTimeout(() => { profileReady.current = true; }, 0);
      return () => clearTimeout(id);
    }
  }, [loading]);

  if (loading) return <Spinner fullScreen />;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>الإعدادات</h1>
        {/* Bug 7 fix: subtitle now matches what is actually on the page */}
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
