import { Shield } from "lucide-react";

export function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-48 -right-48 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="absolute -bottom-48 -left-48 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-size-[48px_48px]" />
    </div>
  );
}

export function LoginHeader() {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-teal-500/20 to-teal-600/10 ring-1 ring-teal-500/30 shadow-lg shadow-teal-500/10">
        <Shield className="h-8 w-8 text-teal-400" strokeWidth={1.5} />
      </div>
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/6 px-3 py-1">
        <span className="text-xs tracking-widest text-teal-400">للمسؤولين فقط</span>
      </div>
      <h1 className="text-3xl font-bold text-white tracking-tight">لوحة الإدارة</h1>
      <p className="mt-2 text-sm text-slate-500">سجّل دخولك للوصول إلى لوحة التحكم</p>
    </div>
  );
}
