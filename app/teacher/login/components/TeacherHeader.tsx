import { GraduationCap } from "lucide-react";

export default function TeacherHeader() {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 ring-1 ring-teal-500/30 shadow-lg shadow-teal-500/10">
        <GraduationCap className="h-8 w-8 text-teal-400" strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl font-bold text-white tracking-tight">بوابة المعلم</h1>
      <p className="mt-2 text-sm text-slate-500">سجّل دخولك للوصول إلى لوحة التحكم</p>
    </div>
  );
}
