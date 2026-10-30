import React from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Scale, FileText, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";

export const metadata = {
  title: "الشروط والأحكام وسياسة الاستخدام",
  description: "الشروط والأحكام المنظمة لاستخدام منصة إدارة الطلاب والخدمات السحابية للمعلمين والمراكز التعليمية.",
};

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs mb-4">
            <Scale className="w-3.5 h-3.5" />
            <span>اتفاقية الاستخدام والخدمات السحابية</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
            الشروط والأحكام (Terms & Conditions)
          </h1>
          <p className="text-sm text-slate-400">
            آخر تحديث: 30 أكتوبر 2026 | يرجى قراءة هذه الشروط بعناية قبل الاشتراك أو استخدام المنصة.
          </p>
        </div>

        {/* Clauses */}
        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              1. القبول بالشروط
            </h2>
            <p>
              باستخدامك أو تسجيلك في منصة <strong>إدارة الطلاب</strong> (المنصة)، فإنك تقر وتوافق صراحة وبشكل قانوني على الالتزام بجميع بنود هذه الاتفاقية وسياسة الخصوصية وسياسة الاسترجاع المرفقة بها. إذا كنت لا توافق على أي بند من هذه الشروط، يُرجى التوقف فوراً عن استخدام المنصة.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              2. وصف الخدمة وطبيعتها
            </h2>
            <p>
              توفر المنصة نظاماً سحابياً كخدمة (SaaS) مخصصاً للمعلمين والمراكز والسناتر التعليمية، يشمل أدوات لإدارة الطلاب والمجموعات، وتسجيل الحضور والانصراف السريع باستخدام تقنية QR Code، وأتمتة إرسال التنبيهات لأولياء الأمور عبر الواتساب، وإدارة الفواتير والاشتراكات والرواتب، بالإضافة إلى توليد بنوك الأسئلة والاختبارات بالذكاء الاصطناعي.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              3. الحسابات وأمن المعلومات
            </h2>
            <ul className="list-disc list-inside space-y-2 pr-2">
              <li>يجب أن تكون المعلومات المقدمة أثناء التسجيل صحيحة ودقيقة ومحدثة.</li>
              <li>المستخدم هو المسؤول الوحيد عن الحفاظ على سرية بيانات تسجيل الدخول وكلمة المرور الخاصة بحسابه.</li>
              <li>يتحمل المستخدم المسؤولية الكاملة عن جميع الأنشطة التي تحدث تحت حسابه.</li>
              <li>يلتزم المستخدم بإبلاغ إدارة المنصة فوراً عن أي استخدام غير مصرح به لحسابه أو أي خرق أمني.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              4. الأسعار والمدفوعات بالريال السعودي (SAR)
            </h2>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <p>
                <strong>العملة المعتمدة:</strong> يتم تسعير جميع الباقات والخدمات بالريال السعودي (SAR / ر.س).
              </p>
              <p>
                <strong>طرق الدفع:</strong> تقبل المنصة وسائل الدفع الإلكتروني المعتمدة في المملكة العربية السعودية والخليج (مدى، فيزا، ماستركارد، وأبل باي).
              </p>
              <p>
                <strong>تفعيل الاشتراك:</strong> يتم تفعيل باقة الاشتراك وحساب المستخدم فور نجاح عملية السداد الإلكتروني دون أي تأخير.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              5. حقوق الملكية الفكرية
            </h2>
            <p>
              جميع محتويات المنصة، البرمجيات، الواجهات البرمجية، الأكواد، التصاميم، الشعارات، والعلامات التجارية هي ملكية فكرية حصرية لمنصة إدارة الطلاب ومحمية بموجب أنظمة حماية حقوق المؤلف والعلامات التجارية في المملكة العربية السعودية والمعاهدات الدولية.
            </p>
            <p>
              تبقى بيانات الطلاب والمذكرات والمحتوى التعليمي الخاص بالمعلم أو المركز ملكاً حصرياً للمشترك، ولا تكتسب المنصة أي حق ملكية عليها.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              6. الاستخدام المقبول والمحظورات
            </h2>
            <p>يحظر على المستخدم القيام بأي من الأمور التالية:</p>
            <ul className="list-disc list-inside space-y-1.5 pr-2">
              <li>محاولة تفكيك أو إجراء هندسة عكسية أو نسخ البرمجيات الخاصة بالمنصة.</li>
              <li>استخدام المنصة لإرسال رسائل مزعجة (Spam) أو غير قانونية لأولياء الأمور أو الطلاب.</li>
              <li>مشاركة بيانات الدخول مع أطراف خارجية بهدف مشاركة الحساب دون إذن رسمي.</li>
              <li>محاولة تجاوز أي من آليات الأمان أو التحقق أو الوصول غير المصرح به لقواعد البيانات.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              7. القانون الواجب التطبيق والاختصاص القضائي
            </h2>
            <p>
              تخضع هذه الشروط والأحكام وتفسر وفقاً للأنظمة واللوائح السارية في <strong>المملكة العربية السعودية</strong>. وتختص المحاكم المختصة في مدينة الرياض حصراً بالفصل في أي نزاع ينشأ عن أو يتعلق بهذه الاتفاقية.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              8. التواصل والدعم القانوني
            </h2>
            <p>
              لأي استفسار بخصوص هذه الشروط أو الاتفاقيات المؤسسية للمراكز التعليمية، يمكنكم مراسلتنا على:
            </p>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 w-fit text-teal-400 font-mono text-xs" dir="ltr">
              legal@studenttrack.app
            </div>
          </section>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
