"use client";

import { useState } from "react";
import { AuthService } from "@/lib/services/authService";
import { LoginBackground, LoginHeader } from "./LoginBackground";
import { LoginForm } from "./LoginForm";
import { getLoginErrorMessage } from "@/lib/errors";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await AuthService.adminLogin(email, password);
      AuthService.clearUserCache();
      AuthService.cacheAdminUser(res.admin);
      // Set the token as a client-side cookie so the Edge middleware can read it.
      // In production the backend cookie is cross-origin and won't be forwarded
      // to the frontend domain, so we set it explicitly here from the response body.
      if ((res as any).token) {
        // Store in cookie for middleware (same-origin: middleware reads frontend domain cookies)
        document.cookie = `token=${(res as any).token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }
      window.location.href = "/admin";
    } catch (err) {
      setErrorMsg(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#080c14] px-4">
      <LoginBackground />
      <div className="relative z-10 w-full max-w-md">
        <LoginHeader />
        <LoginForm
          email={email}
          password={password}
          showPassword={showPassword}
          loading={loading}
          errorMsg={errorMsg}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onSubmit={handleLogin}
        />
        <p className="mt-6 text-center text-xs text-slate-600">
          هذه الصفحة مخصصة للمسؤولين فقط
        </p>
      </div>
    </div>
  );
}
