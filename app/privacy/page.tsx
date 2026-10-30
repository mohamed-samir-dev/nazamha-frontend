import React from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Shield, Lock, FileText, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "سياسة الخصوصية وسرية المعلومات",
  description: "سياسة الخصوصية وحماية البيانات الشخصية المعتمدة لمنصة إدارة الطلاب وفق الأنظمة والمعايير المعتمدة في المملكة العربية السعودية.",
};

export default function PrivacyPage() {
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
            <Shield className="w-3.5 h-3.5" />
            <span>متوافقة مع نظام حماية البيانات الشخصية (PDPL)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
            سياسة الخصوصية وسرية المعلومات
          </h1>
          <p className="text-sm text-slate-400">
            آخر تحديث: 30 أكتوبر 2026 | تسري هذه السياسة على جميع مستخدمي منصة إدارة الطلاب ومراكزها.
          </p>
        </div>

        {/* Content Clauses */}
        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              1. مقدمة والتزام المنصة
            </h2>
            <p>
              تلتزم منصة <strong>إدارة الطلاب</strong> (المشار إليها فيما بعد بـ "المنصة" أو "نحن") باحترام خصوصيتك وحماية بياناتك الشخصية وبيانات الطلاب والمعلمين والمراكز التعليمية المسجلين في المنصة. توضح هذه السياسة كيف نقوم بجمع، واستخدام، وتخزين، ومشاركة، وحماية بياناتك عند استخدامك لخدماتنا وموقعنا الإلكتروني، وذلك وفقاً للأنظمة واللوائح المعمول بها في المملكة العربية السعودية، وعلى رأسها <em>نظام حماية البيانات الشخصية (PDPL)</em>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              2. البيانات التي نقوم بجمعها
            </h2>
            <p>نقوم بجمع البيانات الضرورية فقط لتقديم الخدمات وتشغيل النظام التعليمي بكفاءة عالية:</p>
            <ul className="list-disc list-inside space-y-2 pr-2">
              <li>
                <strong>بيانات الحساب والاشتراك:</strong> الاسم، البريد الإلكتروني، رقم الجوال/واتساب، اسم المركز التعليمي أو اسم المعلم، وتفاصيل باقة الاشتراك المختارة.
              </li>
              <li>
                <strong>بيانات الطلاب والمجموعات:</strong> الأسماء، أرقام هواتف أولياء الأمور (لإرسال إشعارات الواتساب وسجلات الغياب والدرجات)، الصف الدراسي، والمجموعات التعليمية.
              </li>
              <li>
                <strong>سجلات الحضور والتقييم:</strong> سجلات مسح بطاقات QR وأوقات الحضور والانصراف، ودرجات الاختبارات الشهرية والتقارير الأكاديمية.
              </li>
              <li>
                <strong>بيانات المعاملات المالية والدفع:</strong> تفاصيل الفواتير، الاشتراكات الشهرية للطلاب، وسجلات عمليات الدفع. <em>ملاحظة هامة:</em> بيانات بطاقات الدفع البنكية (مثل أرقام البطاقات ورمز CVV) لا يتم تخزينها على خوادمنا نهائياً، بل تتم معالجتها مباشرة وبشكل مشفر عبر بوابات الدفع الإلكتروني المعتمدة والمرخصة من البنك المركزي السعودي (SAMA).
              </li>
              <li>
                <strong>البيانات التقنية:</strong> عنوان بروتوكول الإنترنت (IP)، نوع المتصفح، ومعلومات تسجيل الدخول لضمان حماية الحساب من أي اختراق.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              3. الغرض من جمع واستخدام البيانات
            </h2>
            <p>نستخدم البيانات المجمعة للأغراض التالية المشروعة:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>تشغيل النظام وإدارة حسابات المعلمين والمجموعات بكفاءة.</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>إرسال إشعارات الحضور والغياب والنتائج الفورية لأولياء الأمور عبر واتساب.</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>معالجة عمليات الدفع وتجديد الاشتراكات وإصدار الفواتير الرسمية.</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>تقديم الدعم الفني وحل المشكلات والاستفسارات للعملاء.</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              4. مشاركة وحماية البيانات
            </h2>
            <p>
              <strong>نؤكد بشكل قاطع:</strong> لا نقوم ببيع، أو تأجير، أو المتاجرة ببيانات المشتركين أو الطلاب أو أولياء الأمور لأي طرف ثالث أو لأغراض إعلانية على الإطلاق.
            </p>
            <p>
              تتم مشاركة البيانات فقط مع مزودي الخدمات المعتمدين الضروريين لتشغيل الخدمة (مثل بوابات الدفع الإلكتروني المرخصة وخدمات الاستضافة السحابية الآمنة)، وبموجب اتفاقيات سرية صارمة تلزمهم بعدم استخدام البيانات لأي غرض آخر.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              5. التدابير الأمنية وتشفير المعلومات
            </h2>
            <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-2">
              <div className="flex items-center gap-2 text-teal-300 font-bold">
                <Lock className="w-4 h-4" />
                <span>أعلى معايير الحماية والأمان السيبراني</span>
              </div>
              <p className="text-xs text-slate-300">
                نطبق إجراءات أمنية فنية وإدارية متقدمة تشمل التشفير الكامل لنقل البيانات (SSL/TLS 256-bit)، واستخدام جدران حماية معقدة، وتحديثات دورية لمنع أي وصول غير مصرح به أو تلف أو تسريب للبيانات، مع التوافق الكامل مع معايير أمان بطاقات الدفع العالمية PCI-DSS.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              6. حقوق المستخدم على بياناته
            </h2>
            <p>يحق لك كمستخدم في أي وقت:</p>
            <ul className="list-disc list-inside space-y-1 pr-2">
              <li>الوصول إلى جميع بياناتك المخزنة واستعراضها.</li>
              <li>تصحيح أو تعديل أو تحديث أي بيانات غير دقيقة.</li>
              <li>طلب حذف بيانات حسابك نهائياً عند انتهاء اشتراكك أو إلغائه.</li>
              <li>تصدير نسخ احتياطية من سجلاتك الطلابية والمالية بصيغ Excel أو PDF.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              7. التواصل والاستفسارات
            </h2>
            <p>
              إذا كان لديك أي سؤال أو استفسار حول سياسة الخصوصية وحماية البيانات، يسعدنا تواصلك مع مسؤول الخصوصية عبر البريد الإلكتروني:
            </p>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 w-fit text-teal-400 font-mono text-xs" dir="ltr">
              loutfallaasfora@gmail.com
            </div>
          </section>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
