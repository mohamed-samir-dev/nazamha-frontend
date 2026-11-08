"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  ArrowLeft,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface CheckoutStatusResponse {
  status:
    | "completed_linked"
    | "completed_new_account"
    | "completed_existing_account_pending_verification"
    | "processing"
    | "failed";
  email?: string;
  name?: string;
  message: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutId = searchParams.get("checkout_id") || searchParams.get("checkoutId");

  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<CheckoutStatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const maxPollAttempts = 15; // Max 30 seconds (15 * 2s)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const demoParam = searchParams.get("demo");

  const fetchStatus = async () => {
    if (demoParam) {
      setLoading(false);
      if (demoParam === "linked") {
        setStatusData({
          status: "completed_linked",
          email: "ahmed.teacher@example.com",
          name: "أحمد محمود",
          message: "تم ربط وتفعيل الاشتراك في منصة نظامها بنجاح. يمكنك الآن الدخول والتمتع بكافة مزايا المنصة.",
        });
      } else if (demoParam === "existing") {
        setStatusData({
          status: "completed_existing_account_pending_verification",
          email: "existing.teacher@example.com",
          name: "محمد علي",
          message: "تم تأكيد الدفع! تم العثور على حساب مسجل بهذا البريد. يرجى مراجعة بريدك الإلكتروني لتأكيد ملكية الحساب وربط الاشتراك به.",
        });
      } else if (demoParam === "processing") {
        setStatusData({
          status: "processing",
          message: "جاري التحقق وتجهيز الحساب...",
        });
      } else {
        setStatusData({
          status: "completed_new_account",
          email: "ahmed.teacher@example.com",
          name: "أحمد محمود",
          message: "تم إنشاء حسابك بنجاح! تم إرسال رسالة إلى بريدك الإلكتروني تحتوي على رابط لإنشاء كلمة المرور وتفعيل الحساب.",
        });
      }
      return;
    }

    if (!checkoutId) {
      // Default to demo preview if user opens the page directly without checkout_id
      setStatusData({
        status: "completed_new_account",
        email: "ahmed.teacher@example.com",
        name: "أحمد محمود",
        message: "تم إنشاء حسابك بنجاح! تم إرسال رسالة إلى بريدك الإلكتروني تحتوي على رابط لإنشاء كلمة المرور وتفعيل الحساب.",
      });
      setLoading(false);
      return;
    }

    try {
      const data = await api.get<CheckoutStatusResponse>(
        `/polar/checkout-status?checkout_id=${encodeURIComponent(checkoutId)}`
      );

      setStatusData(data);
      setLoading(false);

      // If still processing and under max attempts, poll again in 2 seconds
      if (data.status === "processing" && pollCount < maxPollAttempts) {
        timerRef.current = setTimeout(() => {
          setPollCount((prev) => prev + 1);
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error fetching checkout status:", err);
      setErrorMsg(err.message || "تعذر الاتصال بالخادم للتحقق من عملية الدفع.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [checkoutId, pollCount]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans" dir="rtl">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-xl z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            نظامها • Nazamha Payments
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">حالة تجهيز الاشتراك</h1>

          {/* Interactive State Switcher for Live Preview */}
          {(!checkoutId || demoParam) && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-medium ml-1">معاينة الحالات:</span>
              <button
                type="button"
                onClick={() => setStatusData({
                  status: "completed_new_account",
                  email: "ahmed.teacher@example.com",
                  name: "أحمد محمود",
                  message: "تم إنشاء حسابك بنجاح! تم إرسال رسالة إلى بريدك الإلكتروني تحتوي على رابط لإنشاء كلمة المرور وتفعيل الحساب.",
                })}
                className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${statusData?.status === "completed_new_account" ? "bg-teal-500/20 text-teal-300 border-teal-500/40" : "bg-slate-800/80 text-slate-400 border-slate-700"}`}
              >
                عميل جديد
              </button>
              <button
                type="button"
                onClick={() => setStatusData({
                  status: "completed_existing_account_pending_verification",
                  email: "existing.teacher@example.com",
                  name: "محمد علي",
                  message: "تم تأكيد الدفع! تم العثور على حساب مسجل بهذا البريد. يرجى مراجعة بريدك الإلكتروني لتأكيد ملكية الحساب وربط الاشتراك به.",
                })}
                className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${statusData?.status === "completed_existing_account_pending_verification" ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : "bg-slate-800/80 text-slate-400 border-slate-700"}`}
              >
                عميل حالي
              </button>
              <button
                type="button"
                onClick={() => setStatusData({
                  status: "completed_linked",
                  email: "ahmed.teacher@example.com",
                  name: "أحمد محمود",
                  message: "تم تفعيل اشتراكك بنجاح!",
                })}
                className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${statusData?.status === "completed_linked" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-slate-800/80 text-slate-400 border-slate-700"}`}
              >
                مكتمل ومربوط
              </button>
              <button
                type="button"
                onClick={() => setStatusData({
                  status: "processing",
                  message: "جاري التحقق وتجهيز الحساب...",
                })}
                className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${statusData?.status === "processing" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-slate-800/80 text-slate-400 border-slate-700"}`}
              >
                جاري التجهيز
              </button>
            </div>
          )}
        </div>

        {/* State 1: Loading or Processing */}
        {loading || (statusData && statusData.status === "processing") ? (
          <div className="text-center py-6 space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
              <Clock className="w-8 h-8 text-teal-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-1">
                جاري التحقق وتجهيز الحساب...
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                تم استلام تأكيد الدفع من Polar بنجاح، ويجري الآن تفعيل الاشتراك وتهيئة بيانات المعلم تلقائياً دون أي تدخل يدوي.
              </p>
            </div>
            {pollCount > 3 && (
              <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5 pt-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                المحاولة {pollCount} من {maxPollAttempts}...
              </div>
            )}
            {pollCount >= maxPollAttempts && (
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 text-right text-xs text-slate-300 mt-4 leading-relaxed">
                💡 <strong>ملاحظة:</strong> عملية الدفع مسجلة بنجاح! إذا استغرق التجهيز وقتاً إضافياً، ستصلك رسالة تأكيد رسمية على بريدك الإلكتروني فور اكتمال التفعيل.
              </div>
            )}
          </div>
        ) : null}

        {/* State 2: Completed & Linked to Active Account */}
        {!loading && statusData && statusData.status === "completed_linked" && (
          <div className="text-center py-4 space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">تم تفعيل اشتراكك بنجاح! 🚀</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {statusData.message || "تم ربط وتفعيل الاشتراك في منصة نظامها بنجاح. يمكنك الآن الدخول والتمتع بكافة مزايا المنصة."}
              </p>
              {statusData.email && (
                <div className="inline-block mt-3 px-3 py-1 bg-slate-800/80 rounded-lg text-xs font-mono text-teal-300 border border-slate-700">
                  {statusData.email}
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                onClick={() => router.push("/teacher")}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-base shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>الانتقال إلى نظامها</span>
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* State 3: Completed New Account (Pending Activation & Password Setup) */}
        {!loading && statusData && statusData.status === "completed_new_account" && (
          <div className="text-center py-4 space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Mail className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">تم إنشاء حسابك بنجاح! 🎉</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                لقد أنشأنا حسابك كمعلم في منصة نظامها وربطنا الاشتراك به.
              </p>
              {statusData.email && (
                <div className="inline-block my-2 px-3 py-1 bg-slate-800 rounded-lg text-xs font-mono text-teal-300 border border-slate-700">
                  {statusData.email}
                </div>
              )}
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-right space-y-2">
              <div className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                الخطوة التالية لإكمال التفعيل:
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                أرسلنا الآن رسالة إلى بريدك الإلكتروني تحتوي على رابط آمن لتعيين كلمة المرور وتفعيل الحساب. يرجى فتح بريدك والضغط على الرابط.
              </p>
              <div className="text-[11px] text-slate-400">
                ⚠️ تأكد من فحص مجلد الرسائل غير المرغوب فيها (Spam / Junk) إذا لم تجد الرسالة فوراً.
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/teacher/login"
                className="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <span>الانتقال لصفحة تسجيل الدخول</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* State 4: Existing Account Found (Pending Email Ownership Verification) */}
        {!loading && statusData && statusData.status === "completed_existing_account_pending_verification" && (
          <div className="text-center py-4 space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Mail className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">تم تأكيد الدفع — تأكيد ربط الحساب 🔗</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                تم العثور على حساب معلم مسجل بالفعل بالبريد الإلكتروني:
              </p>
              {statusData.email && (
                <div className="inline-block my-2 px-3 py-1 bg-slate-800 rounded-lg text-xs font-mono text-teal-300 border border-slate-700">
                  {statusData.email}
                </div>
              )}
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-right space-y-2">
              <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                حفاظاً على أمان بياناتك:
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                لا نربط الاشتراكات بالحسابات المسجلة مسبقاً دون إثبات ملكية البريد. لقد أرسلنا رابط تأكيد آمن إلى بريدك الإلكتروني. بمجرد الضغط عليه، سيتم ربط الاشتراك بحسابك فوراً دون تغيير كلمة المرور.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/teacher"
                className="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <span>الذهاب إلى لوحة المعلم</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* State 5: Error or Failed */}
        {(!loading && statusData && statusData.status === "failed") || errorMsg ? (
          <div className="text-center py-4 space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">تعذر إكمال العملية</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {errorMsg || statusData?.message || "لم نتمكن من التحقق من نجاح عملية الدفع."}
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setLoading(true);
                  setPollCount(0);
                  fetchStatus();
                }}
                className="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
              <Link
                href="/"
                className="w-full py-3 px-6 text-slate-400 hover:text-slate-200 text-xs transition-colors text-center"
              >
                العودة للصفحة الرئيسية
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} نظامها • منصة إدارة المعلمين والطلاب. جميع الحقوق محفوظة.
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
