"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

function LinkSubscriptionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirmLink = async () => {
    setError(null);

    if (!token) {
      setError("رابط التأكيد غير صالح أو مفقود. يرجى استخدام الرابط المرسل لبريدك الإلكتروني.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<{ success: boolean; message: string; teacher?: any }>(
        "/polar/link",
        { token: token.trim() }
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.replace("/teacher");
        }, 1500);
      } else {
        setError(response.message || "فشل تأكيد ربط الاشتراك.");
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تأكيد الربط. قد يكون الرابط قد انتهت صلاحيته.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans" dir="rtl">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-xl z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            نظامها • ربط الاشتراك
          </div>
          <h1 className="text-2xl font-extrabold text-white">تأكيد ربط الاشتراك</h1>
          <p className="text-xs text-slate-400 mt-2">
            تم إثبات طلب شراء جديد على اشتراكك في نظامها. يرجى تأكيد الربط لتفعيل الاشتراك فوراً على حسابك الحالي.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">تم ربط الاشتراك بنجاح!</h2>
              <p className="text-xs text-slate-400">جاري نقلك إلى لوحة تحكم المعلم...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-300 space-y-2 leading-relaxed">
              <div className="font-semibold text-teal-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                أمان حسابك مضمون
              </div>
              <p>
                بالضغط على الزر أدناه، سيتم ربط هذا الاشتراك بحسابك وتمديد فترة الصلاحية. لن تتغير كلمة المرور أو أي بيانات أخرى في حسابك.
              </p>
            </div>

            <button
              onClick={handleConfirmLink}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>تأكيد الربط وتفعيل الاشتراك</span>
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <Link
            href="/teacher"
            className="text-xs text-slate-400 hover:text-teal-400 transition-colors"
          >
            الذهاب إلى لوحة المعلم
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LinkSubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
        </div>
      }
    >
      <LinkSubscriptionContent />
    </Suspense>
  );
}
