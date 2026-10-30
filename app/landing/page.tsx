"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  QrCode,
  MessageSquare,
  Sparkles,
  Receipt,
  Users,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  BookOpen,
  FileText,
  Clock,
  HelpCircle,
  Building2,
  Lock,
  ChevronDown,
  ChevronUp,
  Star,
  Send,
  UserCheck,
  Check,
  X,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PaymentBadges } from "@/components/landing/PaymentBadges";

export default function DedicatedLandingPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    plan: "باقة 500 ريال (المعلم المتميز)",
    notes: "",
  });

  const isAr = lang === "ar";
  const toggleLanguage = () => setLang((prev) => (prev === "ar" ? "en" : "ar"));

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSubmitted(true);
    }, 900);
  };

  const faqsAr = [
    {
      q: "ما هي العملة المستخدمة في عرض وباقات الاشتراك؟",
      a: "جميع الأسعار المعروضة بالريال السعودي (SAR / ر.س). يتم احتساب الرسوم بالريال السعودي بدون أي رسوم خفية أو فروق عملة للبطاقات الصادرة من المملكة والخليج.",
    },
    {
      q: "ما هي وسائل الدفع الإلكتروني المعتمدة؟",
      a: "تقبل المنظومة بطاقات مدى (Mada)، وفيزا (Visa)، وماستركارد (Mastercard)، وأبل باي (Apple Pay)، مع توافق كامل ومشفر مع معايير الأمان العالمية PCI-DSS.",
    },
    {
      q: "هل يتوفر ضمان لاسترداد الأموال؟",
      a: "نعم! نوفر ضمان استرداد كامل للأموال بنسبة 100% لمدة 14 يوماً من تاريخ الاشتراك الأول في حال عدم الرضا عن المنظومة لأي سبب.",
    },
    {
      q: "هل أحتاج إلى شراء أجهزة مخصصة لمسح بطاقات QR؟",
      a: "لا! يمكنك استخدام كاميرا أي هاتف ذكي (آيفون أو أندرويد) أو تابلت، أو كاميرا اللابتوب، بالإضافة لدعم ماسحات الباركود اليدوية للمراكز الكبيرة.",
    },
    {
      q: "كيف تعمل ميزة إرسال إشعارات الواتساب التلقائية؟",
      a: "فور مسح بطاقة QR للطالب أثناء دخوله الحصة، يقوم النظام بإرسال إشعار WhatsApp فوري لولي الأمر يفيد بوصول الطالب ووقته، وعند الغياب يُرسل تنبيه فوري تلقائياً.",
    },
    {
      q: "هل تدعم المنظومة السناتر والمراكز ذات المعلمين المتعددين؟",
      a: "نعم! باقة المراكز والسناتر (800 ر.س) مخصصة لإدارة سنتر تعليمي كامل يضم عدة معلمين ومساعدين، وإدارة القاعات والمواعيد والتقارير المالية المجمعة.",
    },
  ];

  const faqsEn = [
    {
      q: "What currency is used for the subscription plans?",
      a: "All displayed plans and prices are in Saudi Riyals (SAR). Charges are billed in SAR with complete transparency and zero hidden exchange fees for cards in Saudi Arabia and the GCC.",
    },
    {
      q: "What payment methods are supported?",
      a: "The system supports Mada cards, Visa, Mastercard, and Apple Pay, protected by 256-bit SSL encryption and full PCI-DSS compliance.",
    },
    {
      q: "Is there a money-back guarantee?",
      a: "Yes! We provide an unconditional 100% 14-day money-back guarantee from the initial subscription date if the platform does not meet your expectations.",
    },
    {
      q: "Do I need special hardware to scan student QR codes?",
      a: "No! Any smartphone camera (iOS or Android), tablet, or laptop webcam works seamlessly. Fast USB / wireless barcode scanners are also supported.",
    },
    {
      q: "How does automated WhatsApp notification work?",
      a: "The moment a student's QR card is scanned upon entry, an automated WhatsApp alert is instantly dispatched to the parent confirming attendance time. Absence alerts are sent automatically as well.",
    },
    {
      q: "Does the platform support educational centers with multiple tutors?",
      a: "Yes! The Center & Academy plan (800 SAR) allows full management of multi-teacher centers, room scheduling, assistant roles, and consolidated financial reports.",
    },
  ];

  const currentFaqs = isAr ? faqsAr : faqsEn;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950 ${
        isAr ? "" : "font-sans"
      }`}
    >
      {/* Header with Language Switcher */}
      <LandingHeader lang={lang} onToggleLang={toggleLanguage} />

      {/* Floating Language Switcher Pill */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0f172a]/90 backdrop-blur-md border border-teal-500/40 text-teal-300 hover:text-white hover:bg-teal-500/20 shadow-xl transition-all text-xs font-bold active:scale-95"
        >
          <Globe className="w-4 h-4 text-teal-400" />
          <span>{isAr ? "English" : "العربية"}</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-xs text-teal-300 font-semibold shadow-inner">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>
                {isAr
                  ? "المنصة السحابية الأولى لإدارة التعليم والسناتر في المملكة 🇸🇦"
                  : "Leading Cloud Platform for Tutors & Academies in KSA 🇸🇦"}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.25] sm:leading-[1.2]">
              {isAr ? (
                <>
                  أدِر طلابك، وسجّل الحضور بـ{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                    QR في ثانية
                  </span>
                  ، ونظّم ماليتك بكل ثقة
                </>
              ) : (
                <>
                  Manage Students, Scan{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                    QR Attendance in Seconds
                  </span>
                  , and Automate Billing
                </>
              )}
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              {isAr
                ? "النظام المتكامل للمعلمين والسناتر التعليمية: مسح سريع للباركود، إشعارات واتساب تلقائية فورية لأولياء الأمور، بنك أسئلة واختبارات بالذكاء الاصطناعي، ومتابعة كاملة للمصروفات والاشتراكات بالريال السعودي."
                : "The complete system for private tutors and educational centers: lightning-fast QR scanning, automated WhatsApp parent alerts, AI question bank & exam generator, and end-to-end tuition billing in SAR."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/landing#pricing"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-base shadow-xl shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{isAr ? "استعراض الباقات والأسعار" : "View Plans & Pricing"}</span>
                {isAr ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </Link>

              <Link
                href="/teacher/login"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/15 transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-teal-400" />
                <span>{isAr ? "دخول المعلمين والتجربة" : "Teacher Login / Demo"}</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 border-t border-white/10 max-w-xl mx-auto">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>{isAr ? "ضمان استرداد 14 يوماً" : "14-Day Money Back"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>{isAr ? "دفع إلكتروني آمن 100%" : "100% Secure Payment"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{isAr ? "تفعيل فوري للاشتراك" : "Instant Activation"}</span>
              </div>
            </div>

          </div>

          {/* Interactive Live Mockup */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-white/15 to-white/5 border border-white/15 shadow-2xl backdrop-blur-2xl">
              <div className="rounded-xl bg-[#0b1220] border border-white/10 overflow-hidden p-4 sm:p-6 lg:p-8">
                
                {/* Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">
                        {isAr ? "لوحة تحكم المعلم الذكية | سنتر التميز" : "Smart Tutor Dashboard | Center Portal"}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isAr ? "اليوم: الأحد | الجلسة الحالية: الصف الثالث الثانوي - مجموعة (أ)" : "Active Session: Grade 12 - Advanced Physics Group A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 ml-1.5 animate-ping"></span>
                      {isAr ? "سكانر الحضور نشط الآن" : "QR Scanner Live"}
                    </span>
                  </div>
                </div>

                {/* 3 Interactive Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                  
                  {/* Card 1: Fast QR Attendance */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                        <QrCode className="w-4 h-4 text-teal-400" />
                        <span>{isAr ? "مسح فوري بـ QR" : "Instant QR Scan"}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">0.3s</span>
                    </div>

                    <div className="bg-[#080c14] p-3 rounded-lg border border-teal-500/30 flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-white p-1 shrink-0 flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-slate-900" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-white">{isAr ? "عبدالرحمن خالد السعد" : "Abdulrahman K. Al-Saad"}</p>
                        <p className="text-[11px] text-slate-400">#ST-8821 | Group 3A</p>
                        <span className="text-[10px] text-teal-400 font-bold">{isAr ? "تم تسجيل الحضور بنجاح ✓" : "Attended Verified ✓"}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {isAr
                        ? "سكانر يدعم الكاميرا وماسح الباركود السريع لآلاف الطلاب دون أي تأخير."
                        : "Supports smartphone camera and laser barcode scanners for rapid attendance."}
                    </p>
                  </div>

                  {/* Card 2: WhatsApp Automation */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? "إشعار واتساب تلقائي" : "Auto WhatsApp Alert"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{isAr ? "تنبيه فوري" : "Instant"}</span>
                    </div>

                    <div className="bg-[#06241b] p-3 rounded-lg border border-emerald-500/30 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold">
                        <span>{isAr ? "واتساب المعلم 🟢" : "WhatsApp Bot 🟢"}</span>
                        <span>{isAr ? "الآن" : "Now"}</span>
                      </div>
                      <p className="text-[11px] text-emerald-100 leading-snug">
                        {isAr
                          ? "«ولي أمر الطالب: نفيدكم بحضور الطالب لحصة الفيزياء اليوم الساعة 04:30 م. شكراً لاهتمامكم.»"
                          : '"Dear Parent: Student Abdulrahman has safely arrived at Physics class at 04:30 PM."'}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {isAr
                        ? "إرسال آلي دون تدخل يدوي، يرفع ثقة أولياء الأمور ويقلل نسب الغياب بنسبة 40%."
                        : "Zero manual effort, boosting parent confidence and cutting absenteeism by 40%."}
                    </p>
                  </div>

                  {/* Card 3: Billing & Revenue in SAR */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Receipt className="w-4 h-4 text-amber-400" />
                        <span>{isAr ? "التحصيل المالي والاشتراكات" : "Tuition & Billing in SAR"}</span>
                      </div>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono">SAR</span>
                    </div>

                    <div className="bg-[#080c14] p-3 rounded-lg border border-amber-500/30 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{isAr ? "إيرادات الاشتراكات:" : "Monthly Tuition:"}</span>
                        <span className="font-bold text-emerald-400 font-mono">14,800 SAR</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{isAr ? "مبيعات الكتب والمذكرات:" : "Booklets & Materials:"}</span>
                        <span className="font-bold text-teal-400 font-mono">3,250 SAR</span>
                      </div>
                      <div className="pt-1 border-t border-white/10 flex justify-between items-center text-white font-bold">
                        <span>{isAr ? "نسبة التحصيل:" : "Paid Ratio:"}</span>
                        <span className="text-emerald-400">96%</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {isAr
                        ? "إصدار فواتير وسندات قبض فورية ومتابعة غير المسددين بضغطة زر واحدة."
                        : "Track overdue fees, print instant invoices, and automate billing."}
                    </p>
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES SECTION
          ═══════════════════════════════════════════════ */}
      <section id="features" className="py-20 bg-[#060910] border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAr ? "مزايا مصممة خصيصاً لاحتياجات المعلم والسنتر" : "Purpose-Built for Modern Educators"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {isAr ? "كل ما تحتاجه لإدارة حصصك ومجموعاتك في شاشة واحدة" : "Everything You Need in One Unified Screen"}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {isAr
                ? "تخلّص من الدفاتر الورقية المعقدة والأخطاء الحسابية، واعتمد على نظام رقمي ذكي يوفر وقتك ويحفظ حقوقك المالية."
                : "Eliminate manual paperwork and lost payments with an automated platform that saves 15+ hours weekly."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 mb-5 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {isAr ? "بطاقات QR وحضور فوري" : "Instant QR Attendance"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "توليد وطباعة بطاقات عضوية لكل طالب تحتوي على كود QR فريد. مسح بالكاميرا أو السكانر السريع في أجزاء من الثانية مع كشف التأخير والغياب آلياً."
                  : "Generate and print branded student QR cards. Fast scanner recognition in 0.3s with automatic tardiness and absence logging."}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {isAr ? "إشعارات واتساب التلقائية" : "Automated WhatsApp Alerts"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "إرسال رسائل WhatsApp آلية ومباشرة لهواتف أولياء الأمور لحظة دخول الطالب، تنبيهات فورية في حال الغياب، وتذكيرات مواعيد الاختبارات ودفع الرسوم."
                  : "Automatic WhatsApp messages sent directly to parents upon entry, absence alerts, exam grade cards, and gentle fee reminders."}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {isAr ? "امتحانات وبنوك أسئلة بالذكاء الاصطناعي" : "AI Exam & Question Generator"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "توليد اختبارات وبنوك أسئلة ذكية بنقرة واحدة وفق المنهج الدراسي، رصد الدرجات، واستخراج نماذج مطبوعة بصيغة PDF معدة للطباعة الفورية."
                  : "Generate curriculum-aligned quizzes and question banks via AI, grade student results, and export print-ready PDF exam papers."}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {isAr ? "الفواتير والاشتراكات والمذكرات" : "Tuition, Subscriptions & Books"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "إدارة شاملة للاشتراكات الشهرية ونظام الحصص، بيع وتوزيع المذكرات والكتب الدراسية، تتبع المخزون، وحساب رواتب المساعدين والمصروفات بالريال."
                  : "Manage monthly subscriptions, study material inventory, assistant payroll, and detailed expense tracking in SAR."}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {isAr ? "نظام المراكز والسناتر المتعددة" : "Multi-Tutor Academy Portal"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "لوحة تحكم خاصة لإدارة المركز بالكامل، إضافة معلمين ومساعدين وتحديد صلاحياتهم بدقة، توزيع القاعات والجداول، وحساب نسب الأرباح مجمعة."
                  : "Comprehensive center control panel for multiple tutors, classroom scheduling, staff permissions, and consolidated financial reporting."}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {isAr ? "تقارير بيانية وتصدير Excel/PDF" : "Analytics & Excel/PDF Exports"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "رسوم بيانية توضح نسب الحضور، تدفق الأرباح، تقييم درجات الطلاب، مع إمكانية استخراج كافة الكشوفات والتقارير بصيغة Excel و PDF بضغطة زر."
                  : "Interactive graphs tracking attendance rates, revenue, student evaluations, and one-click Excel/PDF report generation."}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS (3 Simple Steps)
          ═══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 bg-[#080c14] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {isAr ? "ابدأ في دقائق معدودة.. كيف يعمل النظام؟" : "Get Started in Minutes - How it Works"}
            </h2>
            <p className="text-sm text-slate-400">
              {isAr ? "واجهة بسيطة وسهلة لا تحتاج أي خبرة تقنية سابقة للبدء." : "Intuitive interface requiring zero technical background."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-white/10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xl font-black flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="text-lg font-bold text-white">{isAr ? "سجّل وأنشئ مجموعاتك" : "1. Create Your Groups"}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "حدد صفوفك الدراسية ومواعيد المجموعات، وأضف طلابك يدوياً أو استوردهم دفعة واحدة من ملف Excel."
                  : "Set your grade levels and schedules. Add students manually or import instantly from Excel."}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-white/10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xl font-black flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="text-lg font-bold text-white">{isAr ? "اطبع بطاقات الـ QR بنقرة زر" : "2. Print Student QR Cards"}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "النظام يولّد تلقائياً كروت هوية مميزة لكل طالب عليها كود QR واسم الطالب ومجموعته جاهزة للطباعة والتوزيع."
                  : "The system auto-generates branded student ID cards with unique QR codes ready to print."}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-white/10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xl font-black flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="text-lg font-bold text-white">{isAr ? "امسح الكود ودع النظام يعمل" : "3. Scan & Automate"}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "امسح الكود بالهاتف، وسيتكفل النظام برصد الحضور، إرسال إشعار الواتساب لولي الأمر، وتحديث الاشتراكات فورياً!"
                  : "Scan QR codes with any phone: attendance is logged, WhatsApp parent alerts are sent, and billing updates in real time!"}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRICING SECTION (Read-Only in SAR - No Subscribe Buttons)
          ═══════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 bg-[#060910] border-t border-white/5 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 text-xs font-bold">
              <span>{isAr ? "خطط الأسعار بالريال السعودي (SAR) 🇸🇦" : "Pricing Plans in Saudi Riyals (SAR) 🇸🇦"}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              {isAr ? "باقات واضحة تلائم مختلف أحجام العمل التعليمي" : "Clear Plans for Every Educational Scale"}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isAr
                ? "الأسعار موضحة بالريال السعودي للاستعراض والمقارنة، وتشمل ضمان استرداد كامل للأموال لمدة 14 يوماً."
                : "Prices are shown in SAR for comparison. All plans include an unconditional 14-day refund guarantee."}
            </p>

            {/* Billing Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                    : "bg-white/5 text-slate-300 hover:text-white"
                }`}
              >
                {isAr ? "الدفع الدوري" : "Standard Period"}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === "yearly"
                    ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                    : "bg-white/5 text-slate-300 hover:text-white"
                }`}
              >
                <span>{isAr ? "الاشتراك السنوي" : "Annual Plan"}</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-black">
                  {isAr ? "وفر 20%" : "Save 20%"}
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid (100 SAR, 500 SAR, 800 SAR) - READ ONLY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* TIER 1: 100 SAR */}
            <div className="rounded-2xl p-6 sm:p-8 bg-[#0b1220]/80 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                    {isAr ? "باقة المعلم الأساسية" : "Starter Tutor Plan"}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {isAr ? "البداية (Starter)" : "Starter Plan"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAr
                      ? "مثالية للمعلمين الجدد أو المجموعات الفردية الراغبين في تنظيم الحضور والدرجات."
                      : "Ideal for individual tutors managing up to 100 students."}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-4 pb-2 border-y border-white/10 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-mono">
                    {billingCycle === "monthly" ? "100" : "960"}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-amber-300 block font-mono">SAR</span>
                    <span className="text-[11px] text-slate-400">
                      {billingCycle === "monthly"
                        ? isAr ? "ريال سعودي / شهرياً" : "SAR / Month"
                        : isAr ? "ريال سعودي / سنوياً" : "SAR / Year"}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "حتى 100 طالب مسجل" : "Up to 100 students"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "حتى 5 مجموعات دراسية" : "Up to 5 groups"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "تسجيل الحضور السريع عبر كروت QR" : "Fast QR Code attendance scanning"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "إدارة الامتحانات ورصد الدرجات" : "Exam grades and marks recording"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "إدارة الاشتراكات والمدفوعات الأساسية" : "Basic subscription & tuition tracking"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "تصدير تقارير Excel و PDF" : "Excel and PDF exports"}</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>{isAr ? "إرسال واتساب تلقائي (متاح بالمحترف)" : "WhatsApp automation (available in Pro)"}</span>
                  </li>
                </ul>
              </div>

              {/* READ-ONLY BADGE (NO SUBSCRIBE BUTTON) */}
              <div className="pt-4 border-t border-white/10 text-center">
                <div className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>{isAr ? "باقة مخصصة للمعلمين المستقلين" : "Dedicated for Individual Tutors"}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {isAr ? "تشمل كافة الميزات الموضحة أعلاه" : "Includes all highlighted features"}
                </p>
              </div>
            </div>

            {/* TIER 2: 500 SAR (PRO - MOST POPULAR) */}
            <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[#0f1f2e] to-[#0b1724] border-2 border-teal-500/70 shadow-2xl shadow-teal-500/15 relative flex flex-col justify-between space-y-6 transform lg:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-teal-500/30 flex items-center gap-1.5 whitespace-nowrap">
                <Star className="w-3.5 h-3.5 fill-slate-950" />
                <span>{isAr ? "الخيار الأكثر طلباً وشعبية" : "Most Popular Choice"}</span>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                    {isAr ? "باقة المعلم المتميز والمحترف" : "Pro Educator Plan"}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {isAr ? "المحترف (Pro Advanced)" : "Pro Advanced Plan"}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {isAr
                      ? "الشاملة لكل المميزات: أتمتة الواتساب، بنك الأسئلة بالذكاء الاصطناعي، والمذكرات."
                      : "Complete with WhatsApp automation, AI quiz bank, and materials inventory."}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-4 pb-2 border-y border-white/10 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-mono">
                    {billingCycle === "monthly" ? "500" : "4,800"}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-amber-300 block font-mono">SAR</span>
                    <span className="text-[11px] text-slate-400">
                      {billingCycle === "monthly"
                        ? isAr ? "ريال سعودي / للباقة الموسعة" : "SAR / Extended Plan"
                        : isAr ? "ريال سعودي / سنوياً" : "SAR / Year"}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 text-xs text-slate-200 pt-2">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isAr ? "حتى 500 طالب مسجل" : "Up to 500 students"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isAr ? "مجموعات وفصول غير محدودة" : "Unlimited classes and groups"}</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-semibold text-teal-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "تكامل واتساب الآلي التام لأولياء الأمور" : "Automated WhatsApp parent messaging"}</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-semibold text-purple-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{isAr ? "صانع الامتحانات وبنك الأسئلة بالذكاء الاصطناعي" : "AI exam and question bank generator"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isAr ? "نظام بيع وتوزيع المذكرات والكتب" : "Book sales and inventory tracking"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isAr ? "إدارة رواتب المساعدين وحصص الإشراف" : "Assistant payroll management"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isAr ? "دعم فني متميز ذو أولوية" : "Priority WhatsApp support"}</span>
                  </li>
                </ul>
              </div>

              {/* READ-ONLY BADGE (NO SUBSCRIBE BUTTON) */}
              <div className="pt-4 border-t border-white/10 text-center">
                <div className="py-2.5 px-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-xs font-bold text-teal-300 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>{isAr ? "الباقة الأوسع انتشاراً ومزايا حصرية" : "Most Comprehensive Tutor Tier"}</span>
                </div>
                <p className="text-[11px] text-teal-300/80 mt-2">
                  {isAr ? "تشمل واتساب التلقائي وبنك الأسئلة" : "Includes WhatsApp & AI generation"}
                </p>
              </div>
            </div>

            {/* TIER 3: 800 SAR (CENTERS / ENTERPRISE) */}
            <div className="rounded-2xl p-6 sm:p-8 bg-[#0b1220]/80 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {isAr ? "باقة المراكز والسناتر" : "Academy & Center Plan"}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {isAr ? "السناتر والأكاديميات" : "Centers & Academies"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAr
                      ? "للمراكز التعليمية والسناتر متعددي المعلمين والقاعات والمساعدين."
                      : "For educational centers with multiple tutors, halls, and assistants."}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-4 pb-2 border-y border-white/10 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-mono">
                    {billingCycle === "monthly" ? "800" : "7,600"}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-amber-300 block font-mono">SAR</span>
                    <span className="text-[11px] text-slate-400">
                      {billingCycle === "monthly"
                        ? isAr ? "ريال سعودي / للسنتر الكامل" : "SAR / Full Center"
                        : isAr ? "ريال سعودي / سنوياً" : "SAR / Year"}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "عدد غير محدود من الطلاب" : "Unlimited students & groups"}</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-semibold text-white">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "إدارة متعددة المعلمين تحت سنتر واحد" : "Multi-tutor center portal"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "إدارة القاعات والمواعيد وحجز الفصول" : "Room and hall scheduling"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "حسابات متعددة الموظفين بصلاحيات دقيقة" : "Multi-staff & reception logins"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "تقارير مالية مجمعة للسنتر ونسب المعلمين" : "Consolidated center revenue reports"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{isAr ? "تدريب كامل ودعم فني مخصص 24/7" : "Full team onboarding & 24/7 priority support"}</span>
                  </li>
                </ul>
              </div>

              {/* READ-ONLY BADGE (NO SUBSCRIBE BUTTON) */}
              <div className="pt-4 border-t border-white/10 text-center">
                <div className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-amber-300 flex items-center justify-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? "حل شامل للمراكز والأكاديميات الكبرى" : "Enterprise for Academies & Centers"}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {isAr ? "تعدد المعلمين والقاعات والمساعدين" : "Multi-teacher, room & assistant support"}
                </p>
              </div>
            </div>

          </div>

          {/* Guarantee Banner */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-[#0b1724] to-emerald-950/40 border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-right">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  {isAr ? "ضمان ذهبي لاسترداد الأموال لمدة 14 يوماً بنسبة 100%" : "100% 14-Day Money-Back Guarantee"}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAr
                    ? "جرب المنظومة بكامل طاقتها.. إذا لم تناسب احتياجاتك، يمكنك استرداد أموالك مباشرة بدون أي أسئلة."
                    : "Try the platform with confidence. If you're not completely satisfied, request a full refund within 14 days."}
                </p>
              </div>
            </div>

            <Link
              href="/refund"
              className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-teal-300 hover:text-white text-xs font-bold shrink-0 transition"
            >
              {isAr ? "قراءة سياسة الاسترجاع" : "View Refund Policy"}
            </Link>
          </div>

          {/* Payment Badges */}
          <div className="mt-10 text-center space-y-3">
            <p className="text-xs text-slate-400 font-medium">
              {isAr ? "المدفوعات الإلكترونية آمنة ومعتمدة بالريال السعودي عبر:" : "Secure e-payments accepted in SAR via:"}
            </p>
            <PaymentBadges />
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FAQ SECTION
          ═══════════════════════════════════════════════ */}
      <section id="faq" className="py-20 bg-[#060910] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isAr ? "إجابات واضحة لجميع تساؤلاتك" : "Clear Answers to Common Questions"}</span>
            </div>
            <h2 className="text-3xl font-black text-white">
              {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="space-y-3">
            {currentFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-[#0f172a]/60 border border-white/10 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-right flex items-center justify-between text-sm sm:text-base font-bold text-white hover:text-teal-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-teal-400 shrink-0 mr-2 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 mr-2 ml-2" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CONTACT FORM SECTION (NO LOCATION / NO ADDRESS)
          ═══════════════════════════════════════════════ */}
      <section id="contact" className="py-20 bg-[#080c14] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Info Side (NO LOCATION / NO ADDRESS) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  {isAr ? "تواصل معنا" : "Contact Us"}
                </span>
                <h2 className="text-3xl font-black text-white">
                  {isAr ? "هل لديك أي استفسار قبل البدء؟" : "Have Questions or Need Assistance?"}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr
                    ? "فريقنا مستعد دائماً لمساعدتك في الإجابة عن أي استفسار وتوفير الدعم السريع لحسابك."
                    : "Our team is ready to answer your inquiries and assist you promptly."}
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">{isAr ? "البريد الإلكتروني المباشر:" : "Direct Email:"}</span>
                    <a href="mailto:loutfallaasfora@gmail.com" dir="ltr" className="hover:text-white transition font-mono font-bold">
                      loutfallaasfora@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">{isAr ? "الهاتف وخدمة واتساب:" : "Phone & WhatsApp:"}</span>
                    <a href="https://wa.me/201012486445" target="_blank" rel="noopener noreferrer" dir="ltr" className="hover:text-white transition font-mono font-bold">
                      01012486445
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">{isAr ? "أوقات الدعم والمساعدة:" : "Support Hours:"}</span>
                    <span>{isAr ? "يومياً من 9:00 صباحاً حتى 11:00 مساءً" : "Daily: 9:00 AM – 11:00 PM"}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200">
                <p className="font-bold mb-1">{isAr ? "دعم فني سريع ومباشر" : "Fast Direct Response"}</p>
                <p className="text-[11px] text-teal-300/80">
                  {isAr ? "نرد على رسائل واستفسارات الواتساب في أقل من ساعتين." : "We typically reply to inquiries within 2 hours."}
                </p>
              </div>
            </div>

            {/* Form Side */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a]/70 border border-white/10">
                {contactSubmitted ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {isAr ? "شكراً لتواصلك معنا!" : "Thank You!"}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto">
                      {isAr
                        ? "تم استلام استفسارك بنجاح وسيتواصل معك فريق الدعم عبر الواتساب أو البريد في أقرب وقت."
                        : "Your message has been received. Our team will contact you via WhatsApp or Email shortly."}
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="px-4 py-2 rounded-lg bg-white/10 text-xs font-semibold text-white"
                    >
                      {isAr ? "إرسال رسالة أخرى" : "Send Another Message"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          {isAr ? "الاسم الكامل *" : "Full Name *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder={isAr ? "أ / محمد علي" : "John Doe"}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          {isAr ? "رقم الجوال أو الواتساب *" : "Phone or WhatsApp *"}
                        </label>
                        <input
                          type="tel"
                          required
                          dir="ltr"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="+20 101 xxx xxxx"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          {isAr ? "البريد الإلكتروني *" : "Email Address *"}
                        </label>
                        <input
                          type="email"
                          required
                          dir="ltr"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="tutor@example.com"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          {isAr ? "الباقة المستفسر عنها" : "Interested Plan"}
                        </label>
                        <select
                          value={contactForm.plan}
                          onChange={(e) => setContactForm({ ...contactForm, plan: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0f172a] border border-white/10 text-white focus:outline-none focus:border-teal-500 text-xs"
                        >
                          <option value="باقة 100 ريال (المعلم الأساسية)">{isAr ? "باقة 100 ريال (المعلم الأساسية)" : "100 SAR Starter Plan"}</option>
                          <option value="باقة 500 ريال (المعلم المتميز)">{isAr ? "باقة 500 ريال (المعلم المتميز)" : "500 SAR Pro Plan"}</option>
                          <option value="باقة 800 ريال (السناتر والمراكز)">{isAr ? "باقة 800 ريال (السناتر والمراكز)" : "800 SAR Center Plan"}</option>
                          <option value="طلب مخصص لمجمع تعليمي">{isAr ? "طلب مخصص لمجمع تعليمي" : "Custom Enterprise Request"}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        {isAr ? "تفاصيل استفسارك أو عدد الطلاب" : "Inquiry Details or Student Count"}
                      </label>
                      <textarea
                        rows={3}
                        value={contactForm.notes}
                        onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                        placeholder={isAr ? "اكتب استفسارك هنا..." : "Type your message or questions here..."}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                    >
                      {contactLoading ? (
                        <span>{isAr ? "جاري الإرسال..." : "Sending..."}</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{isAr ? "إرسال الاستفسار الآن" : "Submit Inquiry"}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <LandingFooter lang={lang} />
    </div>
  );
}
