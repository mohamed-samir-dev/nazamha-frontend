"use client";

import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  errorMsg: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
  email, password, showPassword, loading, errorMsg,
  onEmailChange, onPasswordChange, onTogglePassword, onSubmit,
}: LoginFormProps) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/3 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="space-y-5">

        <div className="space-y-2">
          <label htmlFor="email" className="block text-xs font-semibold tracking-wider text-slate-500">
            البريد الإلكتروني
          </label>
          <div className="relative">
            <input
              id="email" type="email" required placeholder="admin@example.com"
              value={email} onChange={(e) => onEmailChange(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-white/5 py-3 pl-4 pr-10 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all duration-200 focus:border-teal-500/60 focus:bg-teal-500/6 focus:ring-2 focus:ring-teal-500/15"
              style={{ direction: "ltr", textAlign: "left" }}
            />
            <Mail size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-xs font-semibold tracking-wider text-slate-500">
            كلمة المرور
          </label>
          <div className="relative">
            <input
              id="password" type={showPassword ? "text" : "password"} required placeholder="••••••••"
              value={password} onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-white/5 py-3 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all duration-200 focus:border-teal-500/60 focus:bg-teal-500/6 focus:ring-2 focus:ring-teal-500/15"
              style={{ direction: "ltr", textAlign: "left" }}
            />
            <Lock size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <button
              type="button" tabIndex={-1} onClick={onTogglePassword}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-teal-400"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-xs text-red-400">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
            {errorMsg}
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit" disabled={loading}
            className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:bg-teal-400 hover:shadow-teal-400/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-linear-to-r from-white/0 via-white/5 to-white/0" />
            {loading
              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              : "دخول"}
          </button>
        </div>

      </form>
    </div>
  );
}
