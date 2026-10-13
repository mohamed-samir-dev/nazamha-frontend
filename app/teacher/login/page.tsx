"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/authService";
import TeacherBackground from "./components/TeacherBackground";
import TeacherHeader from "./components/TeacherHeader";
import TeacherLoginForm from "./components/TeacherLoginForm";
import TeacherLoadingSpinner from "./components/TeacherLoadingSpinner";
import { getLoginErrorMessage } from "@/lib/errors";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("ot_teacher") && !localStorage.getItem("ot_token")) {
      setCheckingAuth(false);
      return;
    }
    AuthService.getUser()
      .then((user) => {
        if (!user) { localStorage.removeItem("ot_teacher"); localStorage.removeItem("ot_token"); setCheckingAuth(false); return; }
        const ut = (user as any).user_type;
        // Teacher or Assistant (staff with teacher_id) → go to /teacher
        if (ut === "teacher" || (ut === "staff" && (user as any).teacher_id)) {
          router.replace("/teacher");
        } else if (ut === "admin" || user.is_admin) {
          router.replace("/admin");
        } else {
          localStorage.removeItem("ot_teacher");
          localStorage.removeItem("ot_token");
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        localStorage.removeItem("ot_teacher");
        localStorage.removeItem("ot_token");
        setCheckingAuth(false);
      });
  }, [router]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Try teacher login first, then staff (assistant) login
      let token: string | undefined;
      try {
        const res = await AuthService.login(email, password);
        token = (res as any).token;
      } catch {
        const res = await AuthService.staffLogin(email, password);
        token = (res as any).token;
      }
      // Set token as client-accessible cookie so Next.js middleware can read it
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }
      router.replace("/teacher");
    } catch (err) {
      setErrorMsg(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) return <TeacherLoadingSpinner />;

  return (
    <div dir="rtl" className="relative flex min-h-screen items-center justify-center bg-[#080c14] px-4">
      <TeacherBackground />
      <div className="relative z-10 w-full max-w-md">
        <TeacherHeader />
        <TeacherLoginForm onSubmit={handleLogin} loading={loading} errorMsg={errorMsg} />
        <p className="mt-6 text-center text-xs text-slate-600">
          منصة متابعة الطلاب © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
