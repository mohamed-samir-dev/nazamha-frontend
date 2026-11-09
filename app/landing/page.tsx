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
  Phone,
  Mail,
  Globe,
  Crown,
  Layers,
  Bot,
  FileSpreadsheet,
  Award,
  Headphones,
  BadgePercent,
} from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PaymentBadges } from "@/components/landing/PaymentBadges";

export default function DedicatedLandingPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [currency, setCurrency] = useState<"SAR" | "EGP">("SAR");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedPlanFeedback, setSelectedPlanFeedback] = useState<string | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    plan: "باقة 1000 ريال / 14,000 ج.م سنوياً (المحترف بالذكاء الاصطناعي - الأكثر طلباً)",
    notes: "",
  });

  const isAr = lang === "ar";
  const toggleLanguage = () => setLang((prev) => (prev === "ar" ? "en" : "ar"));

  // Smooth scroll and auto-select plan in contact form
  const handleSelectPlan = (planNameAr: string, planNameEn: string) => {
    const selected = isAr ? planNameAr : planNameEn;
    setContactForm((prev) => ({ ...prev, plan: selected }));
    setSelectedPlanFeedback(selected);
    const contactElem = document.getElementById("contact");
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: "smooth" });
    }
    setTimeout(() => {
      setSelectedPlanFeedback(null);
    }, 4500);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSubmitted(true);
    }, 900);
  };

  // 3 Annual-Only Pricing Plans (500/1000/1299 SAR & 7000/14000/17000 EGP)
  const plans = [
    {
      id: "starter-500",
      priceSAR: 500,
      priceEGP: 7000,
      nameAr: "باقة 500 ريال / 7,000 ج.م سنوياً (المعلم الأساسية)",
      nameEn: "500 SAR / 7,000 EGP Annual Starter Plan",
      badgeAr: "للمعلمين المستقلين",
      badgeEn: "For Individual Tutors",
      titleAr: "الأساسية (Starter)",
      titleEn: "Starter Plan",
      descAr: "انطلاقة مثالية للمعلم المستقل: مسح كروت QR، رصد الحضور والغياب وتنظيم المجموعات بكل سهولة طوال العام.",
      descEn: "Ideal for individual tutors managing attendance and classes with high-speed QR scans for the full academic year.",
      icon: QrCode,
      colorTheme: "slate",
      popular: false,
      featuresAr: [
        "حتى 150 طالب مسجل",
        "حتى 8 مجموعات دراسية",
        "توليد وطباعة كروت QR مخصصة للطلاب",
        "مسح فوري للحضور بالكاميرا (0.3 ثانية)",
        "رصد الغياب والتأخير وسجل الملاحظات",
        "كشوف الدرجات والامتحانات الدورية",
        "تسجيل الاشتراكات وسندات القبض",
        "تصدير تقارير Excel و PDF بنقرة زر",
        "دعم فني متجاوب عبر الواتساب",
      ],
      featuresEn: [
        "Up to 150 registered students",
        "Up to 8 classes/groups",
        "Printable custom student QR ID cards",
        "Instant camera QR scan (0.3s)",
        "Attendance, absence & tardy logs",
        "Periodic exam grades & scores",
        "Tuition records & payment receipts",
        "Export reports to Excel & PDF",
        "Fast responsive WhatsApp support",
      ],
      excludedAr: [
        "إشعارات الواتساب التلقائية للأهالي",
        "صانع الاختبارات بالذكاء الاصطناعي",
      ],
      excludedEn: [
        "Automated WhatsApp parent alerts",
        "AI exam & quiz generator",
      ],
    },
    {
      id: "pro-1000",
      priceSAR: 1000,
      priceEGP: 14000,
      nameAr: "باقة 1000 ريال / 14,000 ج.م سنوياً (المحترف بالذكاء الاصطناعي - الأكثر طلباً)",
      nameEn: "1000 SAR / 14,000 EGP Annual Pro AI Plan (Most Popular)",
      badgeAr: "الخيار الأكثر طلباً وشعبية ⭐",
      badgeEn: "Most Popular Choice ⭐",
      titleAr: "المحترف بالذكاء الاصطناعي (Pro AI)",
      titleEn: "Pro AI Educator",
      descAr: "المنظومة الأذكى والأشمل: بنك أسئلة واختبارات بالـ AI، أتمتة واتساب كاملة للأهالي، وإدارة المساعدين.",
      descEn: "The complete smart suite: AI exam generator, unlimited WhatsApp parent alerts, assistant logins & deep analytics.",
      icon: Sparkles,
      colorTheme: "teal",
      popular: true,
      featuresAr: [
        "حتى 1,000 طالب مسجل",
        "فصول ومجموعات غير محدودة",
        "صانع الامتحانات وبنوك الأسئلة بالذكاء الاصطناعي (AI)",
        "أتمتة WhatsApp غير محدودة (حضور، غياب، درجات، إعلانات)",
        "إدارة مساعدين المعلم (حتى 3 حسابات مساعدين بصلاحيات محددة)",
        "نظام متكامل للمخزون ومبيعات الكتب وسندات الصرف",
        "تقارير مالية تفصيلية ورسوم بيانية ذكية للأرباح",
        "استيراد وتصدير بيانات الطلاب بملف Excel في ثانية",
        "مدير حساب مخصص ودعم فني VIP مباشر",
      ],
      featuresEn: [
        "Up to 1,000 registered students",
        "Unlimited classes & groups",
        "Curriculum-aligned AI exam & question bank generator",
        "Unlimited WhatsApp alerts (attendance, grades, alerts)",
        "Assistant staff management (up to 3 assistant logins)",
        "Study booklet inventory, receipts & expenses",
        "Interactive revenue, profit & attendance charts",
        "Instant 1-click Excel student import & export",
        "Dedicated account manager & VIP direct support",
      ],
      excludedAr: [],
      excludedEn: [],
    },
    {
      id: "centers-1299",
      priceSAR: 1299,
      priceEGP: 17000,
      nameAr: "باقة 1299 ريال / 17,000 ج.م سنوياً (السناتر والأكاديميات الكبرى)",
      nameEn: "1299 SAR / 17,000 EGP Annual Center & Enterprise",
      badgeAr: "للمراكز والسناتر التعليمية 🏢",
      badgeEn: "For Centers & Academies 🏢",
      titleAr: "السناتر والأكاديميات (Enterprise)",
      titleEn: "Centers & Academies",
      descAr: "بوابة سحابية لإدارة مركز تعليمي كامل: معلمين متعددين، توزيع القاعات، وتقارير أرباح مجمعة.",
      descEn: "Multi-tutor academy portal: classroom scheduling, staff permissions, and consolidated financial splits.",
      icon: Building2,
      colorTheme: "amber",
      popular: false,
      featuresAr: [
        "عدد غير محدود من الطلاب والمجموعات",
        "إدارة معلمين متعددين تحت بوابة سنتر موحدة",
        "جدول القاعات والمواعيد ومنع تعارض الحصص",
        "حسابات متعددة الموظفين (استقبال، حسابات، مشرفين)",
        "تقارير مالية مجمعة للسنتر واحتساب نسب وأرباح المعلمين آلياً",
        "إرسال رسائل WhatsApp باسم ورقم السنتر المعتمد",
        "ربط ماسحات الباركود السريعة المتعددة بالقاعات",
        "تدريب كامل وتأهيل لفريق عمل المركز",
        "دعم فني VIP مخصص على مدار الساعة 24/7",
      ],
      featuresEn: [
        "Unlimited students & class groups",
        "Multi-tutor center portal under one unified brand",
        "Classroom scheduling & timetable conflict prevention",
        "Multi-staff role permissions (reception, billing, supervisors)",
        "Consolidated revenue reports & automated teacher revenue splits",
        "WhatsApp alerts branded with the center's official name",
        "Multi-hall laser barcode scanners support",
        "Comprehensive team onboarding & system setup",
        "24/7 dedicated VIP enterprise priority support",
      ],
      excludedAr: [],
      excludedEn: [],
    },
  ];

  const faqsAr = [
    {
      q: "ما هي الخطط المتاحة وما أسعارها بالريال والجنيه؟",
      a: "تتوفر 3 خطط باشتراك سنوي بالريال السعودي والجنيه المصري: باقة المعلم الأساسية (500 ر.س / 7,000 ج.م سنوياً)، باقة المحترف بالذكاء الاصطناعي الأكثر طلباً (1000 ر.س / 14,000 ج.م سنوياً)، وباقة السناتر والأكاديميات المتكاملة (1299 ر.س / 17,000 ج.م سنوياً). جميع الباقات تشمل تفعيل فوري وضمان استرداد 14 يوماً.",
    },
    {
      q: "هل الدفع سنوي فقط؟",
      a: "نعم، الاشتراكات سنوية فقط تمنحك استقراراً كاملاً وراحة بال طوال العام الدراسي بدون الحاجة للتجديد الشهري، مع الحصول على التحديثات والدعم الفني المستمر.",
    },
    {
      q: "ما هي وسائل الدفع الإلكتروني المعتمدة؟",
      a: "تقبل المنظومة بطاقات مدى (Mada)، وفيزا (Visa)، وماستركارد (Mastercard)، وأبل باي (Apple Pay)، وإنستاباي (InstaPay)، ومحافظ فودافون كاش للمدفوعات بالجنيه المصري. تتم جميع المعاملات عبر بوابات دفع آمنة ومشفرة 100% وفق معايير PCI-DSS العالمية.",
    },
    {
      q: "هل يتوفر ضمان لاسترداد الأموال في حال لم تناسبني المنظومة؟",
      a: "نعم وبكل ثقة! نقدم ضمان استرداد كامل للأموال بنسبة 100% لمدة 14 يوماً من تاريخ الاشتراك بدون أي تعقيدات، لأننا واثقون من جودة النظام وسهولته.",
    },
    {
      q: "هل أحتاج لشراء جهاز ماسح باركود خاص لمسح كروت الطلاب؟",
      a: "لا تحتاج لأي أجهزة خاصة! كاميرا أي جوال (آيفون أو أندرويد) أو تابلت أو كاميرا اللابتوب تكفي تماماً وتقوم بمسح الكود في 0.3 ثانية فقط. كما يدعم النظام الماسحات الليزرية السريعة للسناتر الكبيرة.",
    },
    {
      q: "هل تدعم باقة السناتر (1299 ر.س / 17,000 ج.م سنوياً) إضافة أكثر من معلم وقاعة؟",
      a: "نعم بالتأكيد! صُممت باقة السناتر خصيصاً للمراكز والسناتر والمعاهد، وتتيح إضافة عدد غير محدود من المعلمين، وتوزيع القاعات، وتحديد صلاحيات موظفي الاستقبال، مع احتساب نسب وأرباح كل معلم تلقائياً في تقارير مالية واضحة.",
    },
  ];

  const faqsEn = [
    {
      q: "What plans are available and what are their prices in SAR and EGP?",
      a: "We offer 3 comprehensive annual plans in SAR and EGP: Starter Plan (500 SAR / 7,000 EGP/year), Pro AI Plan Most Popular (1000 SAR / 14,000 EGP/year), and Centers & Enterprise (1299 SAR / 17,000 EGP/year). All plans include instant activation and a 14-day refund guarantee.",
    },
    {
      q: "Are subscriptions billed annually only?",
      a: "Yes, all subscriptions are billed annually to ensure seamless service and stability throughout the entire academic year without monthly renewal friction.",
    },
    {
      q: "What payment methods are supported in SAR and EGP?",
      a: "We support Mada, Visa, Mastercard, Apple Pay, InstaPay, and Vodafone Cash. All transactions are 100% encrypted and fully compliant with global PCI-DSS security standards.",
    },
    {
      q: "Is there a money-back refund guarantee?",
      a: "Yes! We offer an unconditional 100% 14-day money-back guarantee from your subscription date if the platform does not fully meet your expectations.",
    },
    {
      q: "Do I need special hardware to scan student QR codes?",
      a: "No special devices required! Any smartphone camera (iOS/Android), tablet, or laptop webcam scans student QR codes in just 0.3 seconds. USB/wireless laser scanners are also supported for busy centers.",
    },
    {
      q: "How does automated WhatsApp notification work?",
      a: "The instant a student's QR card is scanned at the door, the system automatically sends a WhatsApp alert to their parent confirming attendance and exact time. Instant absence alerts are dispatched as well.",
    },
    {
      q: "Does the Centers Plan support multiple tutors and rooms?",
      a: "Absolutely! The Centers & Enterprise plan (1299 SAR / 17,000 EGP per year) is purpose-built for academies and multi-tutor centers: manage unlimited tutors, rooms, schedules, and front-desk staff permissions, with automated teacher profit split calculations.",
    },
  ];

  const currentFaqs = isAr ? faqsAr : faqsEn;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950 overflow-x-hidden"
    >
      {/* Header */}
      <LandingHeader lang={lang} onToggleLang={toggleLanguage} />

      {/* Floating Language Switcher Pill */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0f172a]/90 backdrop-blur-md border border-teal-500/40 text-teal-300 hover:text-white hover:bg-teal-500/20 shadow-xl transition-all text-xs font-bold active:scale-95 cursor-pointer"
        >
          <Globe className="w-4 h-4 text-teal-400" />
          <span>{isAr ? "English" : "العربية"}</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[280px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 left-10 w-[300px] h-[250px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-xs text-teal-300 font-semibold shadow-inner">
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
                  أدِر طلابك بذكاء، وسجّل الحضور بـ{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">
                    QR في ثانية
                  </span>
                  ، وأتمِت إشعارات الواتساب
                </>
              ) : (
                <>
                  Manage Students, Scan{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">
                    QR Attendance in 0.3s
                  </span>
                  , and Automate WhatsApp
                </>
              )}
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              {isAr
                ? "منظومة سحابية متطورة للمعلمين والمراكز التعليمية: كروت باركود فورية، إشعارات واتساب تلقائية لأولياء الأمور، بنك أسئلة واختبارات بالذكاء الاصطناعي، ومتابعة كاملة للمصروفات والاشتراكات بالريال السعودي."
                : "Advanced cloud suite for private educators & centers: instant QR cards, automated WhatsApp parent alerts, AI quiz bank, and tuition billing in SAR."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
              <Link
                href="/landing#pricing"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-base shadow-xl shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{isAr ? "استعراض الخطط والأسعار" : "View Plans & Pricing"}</span>
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
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-300 border-t border-white/10 max-w-xl mx-auto">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? "ضمان استرداد 14 يوماً 100%" : "14-Day 100% Money Back"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>{isAr ? "دفع إلكتروني آمن ومعتمد" : "100% Secure Payments"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{isAr ? "تفعيل فوري خلال دقائق" : "Instant Account Activation"}</span>
              </div>
            </div>

          </div>

          {/* Interactive Live Mockup Preview */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-white/15 via-white/5 to-transparent border border-white/15 shadow-2xl backdrop-blur-2xl">
              <div className="rounded-xl bg-[#0b1220] border border-white/10 overflow-hidden p-4 sm:p-6 lg:p-8">
                
                {/* Window Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">
                        {isAr ? "لوحة تحكم المعلم والسنتر الذكية" : "Smart Educator & Center Dashboard"}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isAr ? "الجلسة النشطة: فيزياء الصف الثالث الثانوي - مجموعة التميز (أ)" : "Active Class: Grade 12 Advanced Physics - Group A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 ml-1.5 animate-ping"></span>
                      {isAr ? "سكانر الـ QR متصل ونشط" : "QR Scanner Live & Connected"}
                    </span>
                  </div>
                </div>

                {/* 3 Live Interactive Simulation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                  
                  {/* Card 1: Fast QR Attendance */}
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                        <QrCode className="w-4 h-4 text-teal-400" />
                        <span>{isAr ? "مسح فوري بـ QR" : "Instant QR Scan"}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold">0.3s</span>
                    </div>

                    <div className="bg-[#080c14] p-3 rounded-lg border border-teal-500/30 flex items-center gap-3 shadow-inner">
                      <div className="w-12 h-12 rounded bg-white p-1 shrink-0 flex items-center justify-center shadow">
                        <QrCode className="w-10 h-10 text-slate-900" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-white">{isAr ? "عبدالرحمن خالد السعد" : "Abdulrahman K. Al-Saad"}</p>
                        <p className="text-[11px] text-slate-400 font-mono">#ST-8821 | Group 3A</p>
                        <span className="text-[10px] text-teal-400 font-bold block">{isAr ? "تم تسجيل الحضور بنجاح ✓" : "Attendance Verified ✓"}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {isAr
                        ? "مسح ذكي بالكاميرا أو السكانر السريع بدون أجهزة معقدة وبأعلى دقة."
                        : "Smart scan via smartphone camera or laser scanner with zero lag."}
                    </p>
                  </div>

                  {/* Card 2: WhatsApp Automation */}
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? "إشعار واتساب تلقائي" : "Auto WhatsApp Alert"}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">{isAr ? "فوري" : "Instant"}</span>
                    </div>

                    <div className="bg-[#06241b] p-3 rounded-lg border border-emerald-500/30 text-xs space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold">
                        <span>{isAr ? "بوت واتساب المنظومة 🟢" : "System WhatsApp Bot 🟢"}</span>
                        <span>{isAr ? "الآن" : "Now"}</span>
                      </div>
                      <p className="text-[11px] text-emerald-100 leading-relaxed">
                        {isAr
                          ? "«ولي أمر الطالب: نفيدكم بحضور الطالب لحصة الفيزياء اليوم الساعة 04:30 م. شكراً لاهتمامكم.»"
                          : '"Dear Parent: Student Abdulrahman has safely arrived at Physics class at 04:30 PM."'}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {isAr
                        ? "إرسال آلي يرفع ثقة الأهالي ويقضي على الغياب والتسرب تماماً."
                        : "Automated alerts boosting parent trust and eliminating unnotified absence."}
                    </p>
                  </div>

                  {/* Card 3: Billing & Revenue in SAR */}
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Receipt className="w-4 h-4 text-amber-400" />
                        <span>{isAr ? "التحصيل المالي بالريال" : "Tuition & Billing in SAR"}</span>
                      </div>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono font-bold">SAR</span>
                    </div>

                    <div className="bg-[#080c14] p-3 rounded-lg border border-amber-500/30 space-y-2 text-xs shadow-inner">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{isAr ? "إيرادات الاشتراكات:" : "Monthly Tuition:"}</span>
                        <span className="font-bold text-emerald-400 font-mono">14,800 SAR</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{isAr ? "مبيعات الكتب والمذكرات:" : "Booklets & Materials:"}</span>
                        <span className="font-bold text-teal-400 font-mono">3,250 SAR</span>
                      </div>
                      <div className="pt-1.5 border-t border-white/10 flex justify-between items-center text-white font-bold">
                        <span>{isAr ? "نسبة التحصيل الشهري:" : "Monthly Paid Ratio:"}</span>
                        <span className="text-emerald-400 font-mono">96%</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {isAr
                        ? "متابعة المتأخرات وإصدار السندات والفواتير بنقرة زر واحدة."
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
          METRICS & TRUST BAR
          ═══════════════════════════════════════════════ */}
      <section className="py-10 bg-[#05080f] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-teal-400 mb-1">
                <Zap className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">0.3s</p>
              <p className="text-xs text-slate-400">{isAr ? "سرعة مسح بطاقة الـ QR" : "QR Scan Speed"}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">+50,000</p>
              <p className="text-xs text-slate-400">{isAr ? "طالب مدار عبر المنظومة" : "Students Managed"}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-purple-400 mb-1">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">100%</p>
              <p className="text-xs text-slate-400">{isAr ? "أتمتة إشعارات الواتساب" : "WhatsApp Automation"}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">14 {isAr ? "يوماً" : "Days"}</p>
              <p className="text-xs text-slate-400">{isAr ? "ضمان استرداد ذهبي كامل" : "Money-Back Guarantee"}</p>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES SECTION
          ═══════════════════════════════════════════════ */}
      <section id="features" className="py-20 bg-[#060910] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAr ? "مزايا مصممة خصيصاً للمعلم والسنتر" : "Purpose-Built for Modern Educators"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {isAr ? "كل ما تحتاجه لإدارة حصصك ومجموعاتك في مكان واحد" : "Everything You Need in One Unified Screen"}
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
                  ? "توليد كروت هوية مميزة لكل طالب بكود QR فريد. مسح بالكاميرا أو السكانر في أجزاء من الثانية مع كشف الغياب والتأخير آلياً."
                  : "Generate branded student QR cards. Fast scanner recognition in 0.3s with automatic tardiness and absence logging."}
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
                  ? "إرسال رسائل WhatsApp آلية ومباشرة لهواتف أولياء الأمور لحظة دخول الطالب، تنبيهات الغياب الفورية، وإشعارات درجات الامتحانات والاشتراكات."
                  : "Automatic WhatsApp messages sent directly to parents upon entry, absence alerts, exam grade cards, and fee reminders."}
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
                  ? "توليد اختبارات وبنوك أسئلة ذكية بنقرة واحدة وفق المنهج الدراسي، رصد الدرجات، واستخراج نماذج مطبوعة بصيغة PDF فورية."
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
                  ? "إدارة شاملة للاشتراكات الشهرية ونظام الحصص، بيع وتوزيع المذكرات والكتب الدراسية، تتبع المخزون، وحساب رواتب المساعدين بالريال."
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
              {isAr ? "واجهة بسيطة وسلسة لا تحتاج أي خبرة تقنية سابقة للبدء." : "Intuitive interface requiring zero technical background."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-white/10 text-center space-y-4 hover:border-teal-500/30 transition">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xl font-black flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="text-lg font-bold text-white">{isAr ? "أنشئ صفوفك ومجموعاتك" : "1. Create Your Groups"}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "حدد صفوفك ومواعيد حصصك، وأضف طلابك يدوياً أو استوردهم دفعة واحدة من ملف Excel بنقرة زر."
                  : "Set your grade levels and schedules. Add students manually or import instantly from Excel."}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-white/10 text-center space-y-4 hover:border-teal-500/30 transition">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xl font-black flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="text-lg font-bold text-white">{isAr ? "اطبع بطاقات الـ QR بضغطة زر" : "2. Print Student QR Cards"}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "يولّد النظام تلقائياً بطاقات تعريفية مميزة لكل طالب تحتوي على كود QR واسمه ومجموعته جاهزة للطباعة."
                  : "The system auto-generates branded student ID cards with unique QR codes ready to print."}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-white/10 text-center space-y-4 hover:border-teal-500/30 transition">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xl font-black flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="text-lg font-bold text-white">{isAr ? "امسح الكود ودع النظام يؤتمت كل شيء" : "3. Scan & Automate"}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "امسح الكود بكاميرا الجوال، وسيقوم النظام بتسجيل الحضور، إرسال رسالة الواتساب لولي الأمر، وتحديث الاشتراكات فورياً!"
                  : "Scan QR codes with any phone: attendance is logged, WhatsApp parent alerts are sent, and billing updates in real time!"}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRICING SECTION (4 DISTINCT PLANS IN SAR)
          500 SAR - 699 SAR - 1000 SAR - 1299 SAR
          ═══════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 bg-[#060910] border-t border-white/5 relative">
        {/* Ambient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[400px] bg-teal-500/10 rounded-full blur-[170px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 text-xs font-bold shadow-inner">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{isAr ? "خطط الأسعار بالريال السعودي (SAR) والجنيه المصري (EGP) 🇸🇦 🇪🇬" : "Pricing Plans in SAR & EGP 🇸🇦 🇪🇬"}</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              {isAr ? "ثلاث باقات سنوية واضحة تلائم كافة أحجام العمل التعليمي" : "Three Annual Plans for Every Educational Scale"}
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {isAr
                ? "اشتراك سنوي شامل يمنحك استقراراً تاماً طوال العام الدراسي، مع ضمان ذهبي لاسترداد الأموال بنسبة 100% لمدة 14 يوماً وتفعيل فوري لحسابك."
                : "Comprehensive annual subscription for seamless stability throughout the academic year. Includes 100% 14-day money-back guarantee."}
            </p>

            {/* Currency Switcher & Annual Badge */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="p-1 rounded-2xl bg-[#0f172a] border border-white/10 inline-flex items-center gap-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => setCurrency("SAR")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currency === "SAR"
                      ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/25"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <span>🇸🇦</span>
                  <span>{isAr ? "بالريال السعودي (SAR)" : "Saudi Riyal (SAR)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrency("EGP")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currency === "EGP"
                      ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/25"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <span>🇪🇬</span>
                  <span>{isAr ? "بالجنيه المصري (EGP)" : "Egyptian Pound (EGP)"}</span>
                </button>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-teal-500/10 border border-teal-500/25 text-xs text-teal-300 font-semibold shadow-inner">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isAr
                    ? "اشتراك سنوي موحّد بدون تجديد شهري متكرر أو رسوم خفية"
                    : "Annual subscription with zero monthly renewal friction"}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((p) => {
              const IconComp = p.icon;
              const isPopular = p.popular;
              const price = currency === "SAR" ? p.priceSAR : p.priceEGP;
              const altPrice = currency === "SAR" ? p.priceEGP : p.priceSAR;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                    isPopular
                      ? "bg-gradient-to-b from-[#0f2334] via-[#0b1b28] to-[#08131e] border-2 border-teal-400 shadow-2xl shadow-teal-500/25 lg:-translate-y-2"
                      : p.colorTheme === "amber"
                      ? "bg-gradient-to-b from-[#19150c] to-[#0b1220] border border-amber-500/40 hover:border-amber-400/70"
                      : "bg-[#0b1220]/90 border border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Popular Floating Badge */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/40 flex items-center gap-1.5 whitespace-nowrap">
                      <Star className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{isAr ? p.badgeAr : p.badgeEn}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Badge & Title */}
                    <div>
                      {!isPopular && (
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                            p.colorTheme === "amber"
                              ? "text-amber-400"
                              : "text-teal-400"
                          }`}
                        >
                          {isAr ? p.badgeAr : p.badgeEn}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isPopular
                              ? "bg-teal-400/20 text-teal-300"
                              : p.colorTheme === "amber"
                              ? "bg-amber-400/20 text-amber-300"
                              : "bg-white/10 text-slate-300"
                          }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <h3 className="text-2xl font-black text-white leading-tight">
                          {isAr ? p.titleAr : p.titleEn}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-400 mt-2 min-h-[36px] leading-relaxed">
                        {isAr ? p.descAr : p.descEn}
                      </p>
                    </div>

                    {/* Price Block */}
                    <div className="pt-4 pb-3 border-y border-white/10 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                          {price.toLocaleString()}
                        </span>
                        <div>
                          <span className="text-xs font-black text-amber-300 block font-mono">
                            {currency === "SAR" ? "SAR" : "EGP"}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-medium">
                            {currency === "SAR"
                              ? isAr ? "ريال سعودي / سنوياً" : "SAR / Year"
                              : isAr ? "جنيه مصري / سنوياً" : "EGP / Year"}
                          </span>
                        </div>
                      </div>

                      {/* Dual currency indicator */}
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/5">
                        <span className="font-semibold text-slate-300">
                          {currency === "SAR"
                            ? isAr ? `أو ${altPrice.toLocaleString()} جنيه مصري 🇪🇬` : `Or: ${altPrice.toLocaleString()} EGP 🇪🇬`
                            : isAr ? `أو ${altPrice.toLocaleString()} ريال سعودي 🇸🇦` : `Or: ${altPrice.toLocaleString()} SAR 🇸🇦`}
                        </span>
                        <span className="text-[10px] text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                          {isAr ? "سنوياً" : "Annual"}
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {isAr ? "المميزات المتضمنة في الخطة:" : "Included Features:"}
                      </p>
                      <ul className="space-y-2.5 text-xs text-slate-300">
                        {(isAr ? p.featuresAr : p.featuresEn).map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                isPopular
                                  ? "text-teal-400"
                                  : p.colorTheme === "amber"
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            />
                            <span className="leading-snug">{f}</span>
                          </li>
                        ))}

                        {/* Excluded features if any */}
                        {(isAr ? p.excludedAr : p.excludedEn).map((ex, i) => (
                          <li key={`ex-${i}`} className="flex items-start gap-2 text-slate-500">
                            <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[10px] shrink-0 mt-0.5 text-slate-600">✕</span>
                            <span className="leading-snug line-through">{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Action Button */}
                  <div className="pt-6 border-t border-white/10 mt-6">
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(p.nameAr, p.nameEn)}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                        isPopular
                          ? "bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black shadow-teal-500/30"
                          : p.colorTheme === "amber"
                          ? "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-amber-500/20"
                          : "bg-white/10 hover:bg-teal-500 hover:text-slate-950 text-white border border-white/15"
                      }`}
                    >
                      <span>{isAr ? "اختر هذه الخطة السنوية" : "Select This Annual Plan"}</span>
                      {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>

                    <p className="text-[10px] text-center text-slate-400 mt-2">
                      {isAr ? "ضمان استرداد 14 يوماً 100%" : "14-Day 100% Refund Guarantee"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Comparison Summary Table */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-[#0b1220]/70 border border-white/10 p-5 sm:p-7 overflow-x-auto">
            <div className="text-center mb-6">
              <h4 className="text-lg font-bold text-white">
                {isAr ? "مقارنة سريعة بين الخطط السنوية الثلاث" : "Quick Annual Plan Comparison Matrix"}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? "اختر ما يناسب عدد طلابك ومستوى الأتمتة الذي تحتاجه" : "Choose the right tier for your student count and automation needs"}
              </p>
            </div>

            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className={`pb-3 font-bold ${isAr ? "text-right" : "text-left"}`}>{isAr ? "الميزة" : "Feature"}</th>
                  <th className="pb-3 text-center font-bold text-slate-300">
                    <div>500 SAR / 7,000 EGP</div>
                    <span className="text-[10px] text-slate-400 font-normal">{isAr ? "سنوياً" : "Annual"}</span>
                  </th>
                  <th className="pb-3 text-center font-bold text-teal-400 bg-teal-500/10 rounded-t-lg">
                    <div>1,000 SAR / 14,000 EGP ⭐</div>
                    <span className="text-[10px] text-teal-300 font-normal">{isAr ? "الأكثر طلباً" : "Most Popular"}</span>
                  </th>
                  <th className="pb-3 text-center font-bold text-amber-400">
                    <div>1,299 SAR / 17,000 EGP 🏢</div>
                    <span className="text-[10px] text-amber-300 font-normal">{isAr ? "سنوياً" : "Annual"}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className={`py-3 font-medium ${isAr ? "text-right" : "text-left"}`}>{isAr ? "عدد الطلاب المسموح" : "Student Limit"}</td>
                  <td className="py-3 text-center font-mono">150</td>
                  <td className="py-3 text-center font-mono font-bold text-teal-300 bg-teal-500/10">1,000</td>
                  <td className="py-3 text-center font-bold text-amber-300">{isAr ? "غير محدود" : "Unlimited"}</td>
                </tr>
                <tr>
                  <td className={`py-3 font-medium ${isAr ? "text-right" : "text-left"}`}>{isAr ? "مسح كروت QR في 0.3 ثانية" : "0.3s QR Attendance"}</td>
                  <td className="py-3 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-3 text-center text-emerald-400 font-bold bg-teal-500/10">✓</td>
                  <td className="py-3 text-center text-emerald-400 font-bold">✓</td>
                </tr>
                <tr>
                  <td className={`py-3 font-medium ${isAr ? "text-right" : "text-left"}`}>{isAr ? "أتمتة إشعارات الواتساب للأهالي" : "Auto WhatsApp Alerts"}</td>
                  <td className="py-3 text-center text-slate-600">—</td>
                  <td className="py-3 text-center text-teal-300 font-bold bg-teal-500/10">✓ ({isAr ? "غير محدود" : "Unlimited"})</td>
                  <td className="py-3 text-center text-amber-300 font-bold">✓ ({isAr ? "باسم السنتر" : "Branded"})</td>
                </tr>
                <tr>
                  <td className={`py-3 font-medium ${isAr ? "text-right" : "text-left"}`}>{isAr ? "صانع الاختبارات بالذكاء الاصطناعي" : "AI Quiz Generator"}</td>
                  <td className="py-3 text-center text-slate-600">—</td>
                  <td className="py-3 text-center text-teal-300 font-bold bg-teal-500/10">✓</td>
                  <td className="py-3 text-center text-amber-300 font-bold">✓</td>
                </tr>
                <tr>
                  <td className={`py-3 font-medium ${isAr ? "text-right" : "text-left"}`}>{isAr ? "إدارة مساعدين المعلم" : "Assistant Logins"}</td>
                  <td className="py-3 text-center text-slate-600">—</td>
                  <td className="py-3 text-center font-mono text-teal-300 bg-teal-500/10">{isAr ? "حتى 3 مساعدين" : "Up to 3"}</td>
                  <td className="py-3 text-center font-bold text-amber-300">{isAr ? "صلاحيات متعددة" : "Multi-Staff"}</td>
                </tr>
                <tr>
                  <td className={`py-3 font-medium ${isAr ? "text-right" : "text-left"}`}>{isAr ? "إدارة سنتر متعدد المعلمين والقاعات" : "Multi-Tutor Center"}</td>
                  <td className="py-3 text-center text-slate-600">—</td>
                  <td className="py-3 text-center text-slate-600 bg-teal-500/10">—</td>
                  <td className="py-3 text-center text-amber-300 font-bold">✓ ({isAr ? "سنتر متكامل" : "Full Academy"})</td>
                </tr>
              </tbody>
            </table>
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
                    ? "جرّب المنظومة بكامل طاقتها.. إذا لم تناسبك لأي سبب، يمكنك استرداد أموالك مباشرة بدون أي أسئلة."
                    : "Try the platform with total confidence. If it doesn't fit your workflow, get a full refund within 14 days."}
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
            <PaymentBadges lang={lang} />
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
                    className="w-full p-4 sm:p-5 text-right flex items-center justify-between text-sm sm:text-base font-bold text-white hover:text-teal-300 transition-colors cursor-pointer"
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
          CONTACT FORM SECTION
          ═══════════════════════════════════════════════ */}
      <section id="contact" className="py-20 bg-[#080c14] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Info Side */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  {isAr ? "تواصل معنا" : "Contact Us"}
                </span>
                <h2 className="text-3xl font-black text-white">
                  {isAr ? "هل لديك أي استفسار أو ترغب في الاشتراك؟" : "Have Questions or Ready to Subscribe?"}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr
                    ? "فريقنا جاهز لمساعدتك في اختيار الباقة الأنسب، تهيئة بيانات طلابك، وبدء استخدام النظام في دقائق."
                    : "Our team is ready to answer questions, configure your groups, and get you started in minutes."}
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition">
                  <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">{isAr ? "البريد الإلكتروني المباشر:" : "Direct Email:"}</span>
                    <a href="mailto:no-reply@alshariyaa.com" dir="ltr" className="hover:text-white transition font-mono font-bold">
                      no-reply@alshariyaa.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">{isAr ? "الهاتف وخدمة واتساب المباشرة:" : "Phone & WhatsApp Support:"}</span>
                    <a href="https://wa.me/201012486445" target="_blank" rel="noopener noreferrer" dir="ltr" className="hover:text-white transition font-mono font-bold text-emerald-300">
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
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isAr ? "تفعيل سريع ودعم فوري" : "Fast Activation & Direct Support"}</span>
                </p>
                <p className="text-[11px] text-teal-300/80 leading-relaxed">
                  {isAr ? "نقوم بالرد على رسائل واستفسارات الواتساب وتفعيل الحسابات في غضون دقائق." : "We reply to inquiries and activate subscriptions promptly."}
                </p>
              </div>
            </div>

            {/* Form Side */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a]/80 border border-white/10 relative">
                
                {/* Visual Feedback when plan selected */}
                {selectedPlanFeedback && (
                  <div className="mb-4 p-3 rounded-xl bg-teal-500/15 border border-teal-400/40 text-xs text-teal-200 flex items-center gap-2 animate-fadeIn">
                    <Sparkles className="w-4 h-4 text-teal-300 shrink-0" />
                    <span>
                      {isAr
                        ? `تم اختيار «${selectedPlanFeedback}». أكمل بياناتك وسيتم تفعيل حسابك مباشرة!`
                        : `Selected "${selectedPlanFeedback}". Enter your details for instant activation!`}
                    </span>
                  </div>
                )}

                {contactSubmitted ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {isAr ? "شكراً لتواصلك معنا!" : "Thank You!"}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                      {isAr
                        ? "تم استلام طلبك بنجاح وسيتواصل معك فريق العمل عبر الواتساب لتفعيل حسابك وتوفير كود الدخول فورياً."
                        : "Your inquiry has been received. Our team will contact you via WhatsApp shortly to activate your access."}
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="px-4 py-2 rounded-lg bg-white/10 text-xs font-semibold text-white hover:bg-white/15 transition cursor-pointer"
                    >
                      {isAr ? "إرسال استفسار آخر" : "Send Another Message"}
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
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs transition"
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
                          placeholder="+966 5x xxx xxxx"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs transition"
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
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          {isAr ? "الخطة المطلوبة أو المستفسر عنها" : "Selected Plan"}
                        </label>
                        <select
                          value={contactForm.plan}
                          onChange={(e) => setContactForm({ ...contactForm, plan: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b1220] border border-white/15 text-white focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                        >
                          <option value="باقة 500 ريال / 7,000 ج.م سنوياً (المعلم الأساسية)">
                            {isAr ? "باقة 500 ريال / 7,000 ج.م سنوياً (المعلم الأساسية - حتى 150 طالب)" : "500 SAR / 7,000 EGP Annual Starter Plan (Up to 150 students)"}
                          </option>
                          <option value="باقة 1000 ريال / 14,000 ج.م سنوياً (المحترف بالذكاء الاصطناعي - الأكثر طلباً)">
                            {isAr ? "باقة 1000 ريال / 14,000 ج.م سنوياً (المحترف بالذكاء الاصطناعي - الأكثر طلباً ⭐)" : "1000 SAR / 14,000 EGP Annual Pro AI Plan (Most Popular ⭐)"}
                          </option>
                          <option value="باقة 1299 ريال / 17,000 ج.م سنوياً (السناتر والأكاديميات الكبرى)">
                            {isAr ? "باقة 1299 ريال / 17,000 ج.م سنوياً (السناتر والأكاديميات الكبرى 🏢)" : "1299 SAR / 17,000 EGP Annual Center & Enterprise Plan 🏢"}
                          </option>
                          <option value="طلب مخصص لمجمع تعليمي أو سنتر ضخم">
                            {isAr ? "طلب مخصص لمجمع تعليمي أو سنتر ضخم" : "Custom Enterprise Request"}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        {isAr ? "تفاصيل استفسارك أو عدد الطلاب التقريبي" : "Inquiry Details or Student Count"}
                      </label>
                      <textarea
                        rows={3}
                        value={contactForm.notes}
                        onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                        placeholder={isAr ? "اكتب استفسارك هنا، أو عدد طلابك وسنقوم بالتواصل معك سريعاً..." : "Type your message or student count here..."}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs transition"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-lg shadow-teal-500/25 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      {contactLoading ? (
                        <span>{isAr ? "جاري الإرسال والتسجيل..." : "Submitting..."}</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{isAr ? "إرسال وتفعيل الاشتراك الآن" : "Submit & Activate Subscription"}</span>
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
