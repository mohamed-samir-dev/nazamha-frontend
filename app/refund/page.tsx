import React from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { RotateCcw, CheckCircle2, ShieldCheck, ArrowRight, HelpCircle, Clock, CreditCard } from "lucide-react";

export const metadata = {
  title: "سياسة الاسترجاع والإلغاء والاسترداد المالي",
  description: "سياسة الاسترداد المالي وإلغاء الاشتراك المعتمدة لمنصة إدارة الطلاب مع ضمان استرداد الأموال لمدة 14 يوماً.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col font-sans">
      <LandingHeader />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-teal-400 hover:text-teal-300">
            <ArrowRight className="w-4 h-4" />
            <span>العودة للصفحة الرئيسية</span>
          </Link>
        </div>

        {/* Title Header */}
        <div className="mb-12 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs mb-4 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ضمان رضا العميل واسترداد الأموال 100%</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
            سياسة الاسترجاع والإلغاء (Refund Policy)
          </h1>
          <p className="text-sm text-slate-400">
            تاريخ التحديث: 30 أكتوبر 2026 | نحرص على تقديم تجربة تعليمية وإدارية استثنائية ونضمن حقوقك المالية بالكامل.
          </p>
        </div>

        {/* Highlights Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
            <RotateCcw className="w-6 h-6 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-bold text-sm">ضمان 14 يوماً</h3>
              <p className="text-xs text-slate-400 mt-1">إمكانية استرداد كامل المبلغ خلال 14 يوماً من أول اشتراك بدون أي تعقيد.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
            <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-bold text-sm">سرعة المعالجة</h3>
              <p className="text-xs text-slate-400 mt-1">تتم مراجعة وقبول طلب الاسترداد خلال 24 - 48 ساعة كحد أقصى.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
            <CreditCard className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-bold text-sm">استرداد مباشر لنفس البطاقة</h3>
              <p className="text-xs text-slate-400 mt-1">يُعاد المبلغ مباشرة إلى نفس وسيلة الدفع الأصلية (مدى / فيزا / ماستركارد).</p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              1. نطاق سياسة الاسترجاع
            </h2>
            <p>
              نحن على ثقة تامة بجودة وكفاءة منظومة <strong>إدارة الطلاب</strong> وقدرتها على تنظيم مجموعاتك وتوفير وقتك وجهدك. ولذلك، نتيح لجميع المشتركين الجدد في الباقات المدفوعة (باقة 100 ر.س، باقة 500 ر.س، وباقة 800 ر.س) حق طلب استرداد كامل قيمة الاشتراك خلال <strong>14 يوماً تقويمياً</strong> تبدأ من تاريخ عملية الدفع الإلكتروني الأولى.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              2. شروط استحقاق الاسترداد
            </h2>
            <p>لكي يكون طلب الاسترداد مؤهلاً، يجب توافر الشروط البسيطة التالية:</p>
            <ul className="list-disc list-inside space-y-1.5 pr-2">
              <li>أن يتم تقديم الطلب كتابياً خلال فترة الضمان المحددة (14 يوماً من تاريخ الدفع).</li>
              <li>أن يكون الاشتراك قد تم سداده عبر إحدى قنوات الدفع الرسمية المعتمدة في الموقع.</li>
              <li>توضيح البريد الإلكتروني المسجل به الحساب ورقم المعاملة أو الفاتورة.</li>
              <li>ألا يكون الحساب قد تم حظره نتيجة انتهاك صريح لشروط الاستخدام أو محاولات إساءة استخدام الخدمة.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              3. آلية وخطوات طلب الاسترداد
            </h2>
            <p>لطلب استرداد الأموال، يمكنك اتباع إحدى الطرق السريعة التالية:</p>
            <ol className="list-decimal list-inside space-y-2 pr-2">
              <li>
                <strong>عبر البريد الإلكتروني:</strong> إرسال رسالة إلى <a href="mailto:loutfallaasfora@gmail.com" className="text-teal-400 font-mono hover:underline" dir="ltr">loutfallaasfora@gmail.com</a> بعنوان &quot;طلب استرداد اشتراك&quot; مع ذكر رقم الهاتف والبريد المسجل.
              </li>
              <li>
                <strong>عبر الدعم الفني المباشر (واتساب):</strong> التواصل مع فريق خدمة العملاء على الرقم المعتمد وإرفاق إشعار السداد.
              </li>
            </ol>
            <p className="text-xs text-slate-400 pt-1">
              سيقوم فريق الدعم المالي بمراجعة الطلب والموافقة عليه فوراً وإصدار أمر الإرجاع للبنك خلال 24 ساعة.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              4. مدة وصول المبلغ المسترد
            </h2>
            <p>
              تتم إعادة المبالغ المستردة <strong>إلى نفس بطاقة الدفع أو الحساب البنكي</strong> الذي تم استخدامه أثناء عملية الشراء (وفق لوائح بوابات الدفع الإلكتروني والبنك المركزي السعودي):
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <p>• <strong>بطاقات مدى (Mada):</strong> تستغرق عادة من 1 إلى 5 أيام عمل بنكية.</p>
              <p>• <strong>البطاقات الائتمانية (Visa / Mastercard):</strong> تستغرق من 5 إلى 14 يوم عمل حسب سياسة البنك المصدر للبطاقة.</p>
              <p>• <strong>Apple Pay:</strong> تعود العملية إلى البطاقة المربوطة بمحفظة العميل في غضون أيام عمل قليلة.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              5. سياسة إلغاء الاشتراك
            </h2>
            <p>
              يمكن للمشترك إلغاء تجديد الاشتراك في أي وقت ومن دون أي قيود أو رسوم إضافية عبر حسابه في لوحة الإعدادات أو بمراسلة الدعم. عند الإلغاء، يظل الحساب نشطاً حتى نهاية الفترة المدفوعة الحالية دون تجديد تلقائي للمدة التالية.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              6. مركز المساعدة والاتصال
            </h2>
            <p>
              إذا كان لديك أي سؤال عن الفواتير أو ترغب في مساعدة قبل اتخاذ قرار الاسترجاع، يسعدنا خدمتك دائماً:
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs">
                <span className="text-slate-400 block mb-0.5">البريد المالي:</span>
                <a href="mailto:loutfallaasfora@gmail.com" className="text-teal-400 font-mono font-bold hover:underline" dir="ltr">loutfallaasfora@gmail.com</a>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs">
                <span className="text-slate-400 block mb-0.5">واتساب الدعم السريع:</span>
                <a href="https://wa.me/201012486445" target="_blank" rel="noopener noreferrer" className="text-teal-400 font-mono font-bold hover:underline" dir="ltr">01012486445</a>
              </div>
            </div>
          </section>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
