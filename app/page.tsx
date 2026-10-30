"use client";

import React, { useState, useEffect } from "react";
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
  MapPin,
  Laptop,
  Smartphone,
} from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PaymentBadges } from "@/components/landing/PaymentBadges";
import { AuthService } from "@/lib/services/authService";

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
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

  // Check if user is already logged in to show a subtle banner/quick dashboard button
  useEffect(() => {
    AuthService.getUser()
      .then((user) => {
        if (user) setCurrentUser(user);
      })
      .catch(() => {});
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSubmitted(true);
    }, 900);
  };

  const faqs = [
    {
      q: "ما هي العملة المستخدمة في سداد الاشتراكات؟",
      a: "جميع الأسعار والاشتراكات لدينا بالريال السعودي (SAR / ر.س). يتم خصم المبلغ بالريال السعودي مباشرة بدون أي رسوم خفية أو فروق تحويل عملة للبطاقات الصادرة من المملكة العربية السعودية والخليج.",
    },
    {
      q: "ما هي وسائل الدفع الإلكتروني المتاحة؟",
      a: "نقبل جميع وسائل الدفع المعتمدة: بطاقات مدى (Mada)، البطاقات الائتمانية (Visa و Mastercard)، وأبل باي (Apple Pay). جميع المعاملات مشفرة بالكامل وآمنة عبر بوابات دفع مرخصة ومتوافقة مع معايير PCI-DSS.",
    },
    {
      q: "هل يتوفر ضمان لاسترداد الأموال في حال لم تناسبني المنصة؟",
      a: "نعم بكل تأكيد! نقدم ضمان استرداد كامل المبلغ بنسبة 100% لمدة 14 يوماً من تاريخ الاشتراك الأول. إذا لم تكن راضياً عن النظام لأي سبب، يمكنك مراسلتنا واسترداد أموالك مباشرة إلى نفس البطاقة البنكية دون أي تعقيد.",
    },
    {
      q: "هل أحتاج إلى شراء أجهزة خاصة لمسح بطاقات QR الخاصة بالطلاب؟",
      a: "لا! يمكنك استخدام كاميرا أي هاتف ذكي (آيفون أو أندرويد) أو جهاز لوحي (تابلت)، أو حتى كاميرا اللابتوب. كما يدعم النظام ماسحات الباركود اليدوية السريعة (USB / Wireless Barcode Scanners) للمراكز والسناتر الكبيرة.",
    },
    {
      q: "كيف تعمل ميزة إرسال إشعارات الواتساب التلقائية؟",
      a: "بمجرد مسح بطاقة QR للطالب أثناء دخوله الحصة، يقوم النظام بإرسال رسالة واتساب فورية لولي الأمر تفيد بوصول الطالب ووقته، وعند غياب الطالب يتم إرسال تنبيه فوري، بالإضافة لإمكانية إرسال درجات الاختبارات وتنبيهات المصروفات.",
    },
    {
      q: "هل تدعم المنصة السناتر والمراكز التعليمية التي تضم عدة معلمين؟",
      a: "نعم! باقة المراكز والسناتر (800 ر.س) مخصصة تماماً لهذا الغرض. تتيح للمركز إدارة عشرات المعلمين، حجز وتوزيع القاعات، تنظيم مواعيد المجموعات، ومتابعة الحسابات المالية المجمعة ونسب المعلمين في لوحة تحكم واحدة.",
    },
    {
      q: "هل يمكنني تجربة المنصة قبل الدفع؟",
      a: "نعم! يمكنك التسجيل وبدء تجربة مجانية لكافة الميزات الأساسية لاختبار المنظومة وسرعتها مع طلابك ومجموعاتك قبل اختيار باقتك المناسبة.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* Top Banner if already authenticated */}
      {currentUser && (
        <div className="bg-gradient-to-r from-teal-900/90 to-emerald-900/90 border-b border-teal-500/30 py-2.5 px-4 text-center text-xs font-medium text-teal-100 flex items-center justify-center gap-3">
          <span>مرحباً بك مجدداً أ / {currentUser.name || "المعلم"}. حسابك مفعل ونشط!</span>
          <Link
            href="/teacher"
            className="underline font-bold text-white hover:text-teal-200 flex items-center gap-1"
          >
            الانتقال للوحة التحكم الخاصة بك
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Header */}
      <LandingHeader />

      {/* ═══════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-xs text-teal-300 font-semibold shadow-inner">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>المنصة السحابية الأولى لإدارة التعليم والسناتر في المملكة 🇸🇦</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.25] sm:leading-[1.2]">
              أدِر طلابك، وسجّل الحضور بـ <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">QR في ثانية</span>، ونظّم ماليتك بكل ثقة
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              النظام المتكامل للمعلمين والسناتر التعليمية: مسح سريع للباركود، إشعارات واتساب تلقائية فورية لأولياء الأمور، بنك أسئلة واختبارات بالذكاء الاصطناعي، ومتابعة كاملة للمصروفات والاشتراكات بالريال السعودي.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/#pricing"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-base shadow-xl shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>اشترك الآن بالريال السعودي</span>
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <Link
                href="/teacher/login"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/15 transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-teal-400" />
                <span>دخول المعلمين والتجربة</span>
              </Link>
            </div>

            {/* Trust Micro-Metrics */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 border-t border-white/10 max-w-xl mx-auto">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>ضمان استرداد 14 يوماً</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>دفع إلكتروني آمن 100%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>تفعيل فوري للاشتراك</span>
              </div>
            </div>

          </div>

          {/* Interactive Hero Visual Showcase */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-white/15 to-white/5 border border-white/15 shadow-2xl backdrop-blur-2xl">
              <div className="rounded-xl bg-[#0b1220] border border-white/10 overflow-hidden p-4 sm:p-6 lg:p-8">
                
                {/* Simulated Dashboard Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">لوحة تحكم المعلم الذكية | سنتر التميز</h3>
                      <p className="text-xs text-slate-400">اليوم: الأحد | الجلسة الحالية: الصف الثالث الثانوي - مجموعة (أ)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1.5 animate-ping"></span>
                      سكانر الحضور نشط الآن
                    </span>
                  </div>
                </div>

                {/* 3 Interactive Mockup Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                  
                  {/* Card 1: Fast QR Attendance */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                        <QrCode className="w-4 h-4 text-teal-400" />
                        <span>مسح فوري بـ QR</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">0.3 ثانية</span>
                    </div>

                    <div className="bg-[#080c14] p-3 rounded-lg border border-teal-500/30 flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-white p-1 shrink-0 flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-slate-900" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-white">عبدالرحمن خالد السعد</p>
                        <p className="text-[11px] text-slate-400">كود: #ST-8821 | مجموعة 3A</p>
                        <span className="text-[10px] text-teal-400 font-bold">تم تسجيل الحضور بنجاح ✓</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      سكانر يدعم الكاميرا وماسح الباركود السريع لآلاف الطلاب دون أي تأخير.
                    </p>
                  </div>

                  {/* Card 2: WhatsApp Automation */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>إشعار واتساب تلقائي</span>
                      </div>
                      <span className="text-[10px] text-slate-400">فور تسجيل الحضور</span>
                    </div>

                    <div className="bg-[#06241b] p-3 rounded-lg border border-emerald-500/30 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold">
                        <span>واتساب المعلم 🟢</span>
                        <span>الآن</span>
                      </div>
                      <p className="text-[11px] text-emerald-100 leading-snug">
                        &quot;ولي أمر الطالب: عبدالرحمن خالد.. نفيدكم بحضور الطالب لحصة الفيزياء اليوم الساعة 04:30 م. شكراً لاهتمامكم.&quot;
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      إرسال آلي دون تدخل يدوي، يرفع ثقة أولياء الأمور ويقلل نسب الغياب بنسبة 40%.
                    </p>
                  </div>

                  {/* Card 3: Billing & Revenue in SAR */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Receipt className="w-4 h-4 text-amber-400" />
                        <span>التحصيل المالي والاشتراكات</span>
                      </div>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono">SAR</span>
                    </div>

                    <div className="bg-[#080c14] p-3 rounded-lg border border-amber-500/30 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>إيرادات الاشتراكات الشهرية:</span>
                        <span className="font-bold text-emerald-400 font-mono">14,800 ر.س</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>مبيعات المذكرات والكتب:</span>
                        <span className="font-bold text-teal-400 font-mono">3,250 ر.س</span>
                      </div>
                      <div className="pt-1 border-t border-white/10 flex justify-between items-center text-white font-bold">
                        <span>الطلاب المسددين:</span>
                        <span className="text-emerald-400">96% من الطلاب</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      إصدار فواتير وسندات قبض فورية ومتابعة غير المسددين بضغطة زر واحدة.
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
              <span>مزايا مصممة خصيصاً لاحتياجات المعلم العربي</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              كل ما تحتاجه لإدارة حصصك ومجموعاتك في شاشة واحدة
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              تخلّص من الدفاتر الورقية المعقدة والأخطاء الحسابية، واعتمد على نظام رقمي ذكي يوفر وقتك ويحفظ حقوقك المالية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 mb-5 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">بطاقات QR وحضور فوري</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                توليد وطباعة بطاقات عضوية لكل طالب تحتوي على كود QR فريد. مسح بالكاميرا أو السكانر السريع في أجزاء من الثانية مع كشف التأخير والغياب آلياً.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  <span>دعم الحضور البديل في مجموعات أخرى</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  <span>طباعة بطاقات جماعية بتصاميم احترافية</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">ربط وإشعارات واتساب التلقائية</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                إرسال رسائل WhatsApp آلية ومباشرة لهواتف أولياء الأمور لحظة دخول الطالب، تنبيهات فورية في حال الغياب، وتذكيرات مواعيد الاختبارات ودفع الرسوم.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>قوالب رسائل مخصصة باسم المعلم أو السنتر</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>إرسال تقارير الدرجات الشهرية آلياً</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">امتحانات وبنوك أسئلة بالذكاء الاصطناعي</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                توليد اختبارات وبنوك أسئلة ذكية بنقرة واحدة وفق المنهج الدراسي، رصد الدرجات، واستخراج نماذج مطبوعة بصيغة PDF معدة للطباعة الفورية.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>توقع مستوى الطالب وتحديد نقاط الضعف</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>نماذج امتحانات متعددة لمنع الغش</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">الفواتير والاشتراكات والمذكرات</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                إدارة شاملة للاشتراكات الشهرية ونظام الحصص، بيع وتوزيع المذكرات والكتب الدراسية، تتبع المخزون، وحساب رواتب المساعدين والمصروفات بالريال.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>كشف فوري بغير المسددين وتنبيههم</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>إدارة خصومات الأخوة والعائلات</span>
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">نظام المراكز والسناتر المتعددة</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                لوحة تحكم خاصة لإدارة المركز بالكامل، إضافة معلمين ومساعدين وتحديد صلاحياتهم بدقة، توزيع القاعات والجداول، وحساب نسب الأرباح مجمعة.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>إدارة القاعات والمواعيد وحجز الفصول</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>صلاحيات مخصصة لكل مساعد أو موظف استقبال</span>
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/40 hover:bg-white/[0.05] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">تقارير بيانية وتصدير Excel/PDF</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                رسوم بيانية توضح نسب الحضور، تدفق الأرباح، تقييم درجات الطلاب، مع إمكانية استخراج كافة الكشوفات والتقارير بصيغة Excel و PDF بضغطة زر.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                  <span>تصدير سريع لكشوفات الغياب والدرجات</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                  <span>تقارير مالية جاهزة لتدقيق الحسابات</span>
                </li>
              </ul>
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
              ابدأ في دقائق معدودة.. كيف يعمل النظام؟
            </h2>
            <p className="text-sm text-slate-400">
              واجهة بسيطة وسهلة لا تحتاج أي خبرة تقنية سابقة للبدء.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-white/10 text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xl font-black flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="text-lg font-bold text-white">سجّل وأنشئ مجموعاتك</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                حدد صفوفك الدراسية ومواعيد المجموعات، وأضف طلابك يدوياً أو استوردهم دفعة واحدة من ملف Excel.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-white/10 text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xl font-black flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="text-lg font-bold text-white">اطبع بطاقات الـ QR بضغطة زر</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                النظام يولّد تلقائياً كروت هوية مميزة لكل طالب عليها كود QR واسم الطالب ومجموعته جاهزة للطباعة والتوزيع.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-white/10 text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xl font-black flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="text-lg font-bold text-white">امسح الكود ودع النظام يعمل</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                امسح الكود بالهاتف، وسيتكفل النظام برصد الحضور، إرسال إشعار الواتساب لولي الأمر، وتحديث الاشتراكات فورياً!
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRICING SECTION (In SAR / بالريال السعودي)
          ═══════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 bg-[#060910] border-t border-white/5 relative">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 text-xs font-bold">
              <span>خطط واضحة وشفافة بالريال السعودي (SAR) 🇸🇦</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              اختر الخطة المناسبة لحجم عملك التعليمي
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              أسعار محددة بالريال السعودي، بدون عقود ملزمة أو رسوم إعداد، مع ضمان استرداد كامل للأموال لمدة 14 يوماً.
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
                الدفع الدوري المعتاد
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
                <span>الاشتراك السنوي</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-black">وفر 20%</span>
              </button>
            </div>
          </div>

          {/* Pricing Grid (100 SAR, 500 SAR, 800 SAR) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* TIER 1: 100 SAR */}
            <div className="rounded-2xl p-6 sm:p-8 bg-[#0b1220]/80 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">باقة المعلم الأساسية</span>
                  <h3 className="text-2xl font-black text-white mt-1">البداية (Starter)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    مثالية للمعلمين الجدد أو المجموعات الفردية الراغبين في تنظيم الحضور والدرجات.
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-4 pb-2 border-y border-white/10 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-mono">
                    {billingCycle === "monthly" ? "100" : "960"}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-300 block">ريال سعودي (SAR)</span>
                    <span className="text-[11px] text-slate-400">
                      {billingCycle === "monthly" ? "شهرياً" : "سنوياً (بدلاً من 1200)"}
                    </span>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>حتى <strong>100 طالب</strong> مسجل</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>حتى <strong>5 مجموعات</strong> دراسية</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>تسجيل الحضور السريع عبر كروت QR</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>إدارة الامتحانات ورصد الدرجات</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>إدارة الاشتراكات والمدفوعات الأساسية</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>تصدير تقارير Excel و PDF</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>إرسال واتساب تلقائي (متاح بالباقة المتميزة)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Link
                  href="/teacher/login"
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>اشترك في باقة 100 ريال</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <p className="text-[10px] text-center text-slate-500 mt-2">تشمل ضمان استرجاع 14 يوماً</p>
              </div>
            </div>

            {/* TIER 2: 500 SAR (PRO - MOST POPULAR) */}
            <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[#0f1f2e] to-[#0b1724] border-2 border-teal-500/70 shadow-2xl shadow-teal-500/15 relative flex flex-col justify-between space-y-6 transform lg:-translate-y-2">
              
              {/* Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-teal-500/30 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-slate-950" />
                <span>الخيار الأكثر طلباً وشعبية</span>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">باقة المعلم المتميز والمحترف</span>
                  <h3 className="text-2xl font-black text-white mt-1">المحترف (Pro Advanced)</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    الشاملة لكل المميزات: أتمتة الواتساب، بنك الأسئلة بالذكاء الاصطناعي، والمذكرات.
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-4 pb-2 border-y border-white/10 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-mono">
                    {billingCycle === "monthly" ? "500" : "4,800"}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-300 block">ريال سعودي (SAR)</span>
                    <span className="text-[11px] text-slate-400">
                      {billingCycle === "monthly" ? "للباقة الموسعة (أو فصلياً)" : "سنوياً (شامل كافة الخدمات)"}
                    </span>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-2.5 text-xs text-slate-200 pt-2">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>حتى <strong>500 طالب</strong> مسجل</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>مجموعات وفصول دراسية <strong>غير محدودة</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5 font-semibold text-teal-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span><strong>تكامل واتساب الآلي التام</strong> لأولياء الأمور</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-semibold text-purple-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><strong>صانع الامتحانات وبنك الأسئلة بالـ AI</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>نظام بيع وتوزيع المذكرات والكتب والمخزون</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>إدارة رواتب المساعدين وحصص الإشراف</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>تتبع الطلاب المتأخرين والمتعثرين دراسياً</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>دعم فني متميز ذو أولوية عبر الواتساب</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Link
                  href="/teacher/login"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>اشترك في باقة 500 ريال الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <p className="text-[10px] text-center text-teal-300/80 mt-2 font-medium">
                  ضمان استرداد كامل خلال 14 يوماً بدون أي قيد
                </p>
              </div>
            </div>

            {/* TIER 3: 800 SAR (CENTERS / ENTERPRISE) */}
            <div className="rounded-2xl p-6 sm:p-8 bg-[#0b1220]/80 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">باقة المراكز والسناتر</span>
                  <h3 className="text-2xl font-black text-white mt-1">السناتر والأكاديميات</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    للمراكز التعليمية والسناتر متعددي المعلمين والقاعات والمساعدين.
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-4 pb-2 border-y border-white/10 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-mono">
                    {billingCycle === "monthly" ? "800" : "7,600"}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-300 block">ريال سعودي (SAR)</span>
                    <span className="text-[11px] text-slate-400">
                      {billingCycle === "monthly" ? "للسنتر الكامل" : "سنوياً (للمؤسسات والسناتر)"}
                    </span>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span><strong>عدد غير محدود</strong> من الطلاب والمجموعات</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-semibold text-white">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span><strong>إدارة متعددة المعلمين</strong> تحت سنتر واحد</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>إدارة القاعات والمواعيد وجدول الحصص بالسنتر</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>حسابات متعددة الموظفين والاستقبال بصلاحيات مخصصة</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>تقارير مالية مجمعة للسنتر ونسب المعلمين</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>كافة مزايا واتساب والذكاء الاصطناعي وبنك الأسئلة</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>تدريب كامل لفريق العمل ودعم فني مخصص 24/7</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Link
                  href="/center/login"
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>اشترك في باقة السناتر (800 ريال)</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <p className="text-[10px] text-center text-slate-500 mt-2">تشمل إعداد وتهيئة مجانية للسنتر</p>
              </div>
            </div>

          </div>

          {/* Money Back Guarantee Banner */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-[#0b1724] to-emerald-950/40 border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-right">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">ضمان ذهبي لاسترداد الأموال لمدة 14 يوماً بنسبة 100%</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  جرب المنظومة بكامل طاقتها.. إذا لم تشعر بأنها وفرت وقتك وضاعفت كفاءة حصصك، يمكنك استرداد أموالك مباشرة بدون أي أسئلة.
                </p>
              </div>
            </div>

            <Link
              href="/refund"
              className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-teal-300 hover:text-white text-xs font-bold shrink-0 transition"
            >
              قراءة سياسة الاسترجاع
            </Link>
          </div>

          {/* Payment Badges & Compliance Box */}
          <div className="mt-10 text-center space-y-3">
            <p className="text-xs text-slate-400 font-medium">
              المدفوعات الإلكترونية آمنة ومعتمدة بالريال السعودي عبر:
            </p>
            <PaymentBadges />
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS & TRUST
          ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-[#080c14] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl font-black text-white">ماذا يقول المعلمون وأصحاب السناتر؟</h2>
            <p className="text-sm text-slate-400">قصص نجاح واقعية من معلمين وفروا عشرات الساعات أسبوعياً.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0f172a]/50 border border-white/10 space-y-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                &quot;ميزة مسح كود الـ QR مع رسائل الواتساب الفورية لولي الأمر نقلت شغلي في مكان تاني خالص. أولياء الأمور مبسوطين جداً من المتابعة الدقيقة، ونسب الغياب قلت بشكل ملحوظ.&quot;
              </p>
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs font-bold text-white">أستاذ أحمد القحطاني</p>
                <p className="text-[11px] text-slate-400">معلم رياضيات - 350 طالباً</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/50 border border-white/10 space-y-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                &quot;كنا بنعاني في السنتر من تداخل المواعيد وحسابات نسب المعلمين والمذكرات. باقة الـ 800 ريال للسنتر حلت كل المشاكل دي في أسبوع واحد وريحت الموظفين.&quot;
              </p>
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs font-bold text-white">إدارة مركز الرواد التعليمي</p>
                <p className="text-[11px] text-slate-400">الرياض - أكثر من 12 معلماً</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/50 border border-white/10 space-y-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                &quot;صانع الامتحانات وبنك الأسئلة بالذكاء الاصطناعي بيطلع نموذج الامتحان وتنسيق الـ PDF في دقائق، مع توزيع الدرجات بدقة عالية جداً. استثمار ممتاز.&quot;
              </p>
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs font-bold text-white">أ / هاني الشريف</p>
                <p className="text-[11px] text-slate-400">معلم فيزياء وكيمياء</p>
              </div>
            </div>
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
              <span>إجابات واضحة لجميع تساؤلاتك</span>
            </div>
            <h2 className="text-3xl font-black text-white">الأسئلة الشائعة</h2>
            <p className="text-sm text-slate-400">
              كل ما تود معرفته عن آليات السداد بالريال، بوابات الدفع، والخصائص التقنية.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
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
                      <ChevronUp className="w-5 h-5 text-teal-400 shrink-0 mr-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
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
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">تواصل معنا</span>
                <h2 className="text-3xl font-black text-white">هل لديك أي سؤال قبل الاشتراك؟</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  فريقنا مستعد لمساعدتك في اختيار الباقة الأنسب، أو تقديم عرض سعر مخصص للمراكز الكبيرة والمدارس.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Mail className="w-4 h-4 text-teal-400" />
                  <span dir="ltr">support@studenttrack.app</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Phone className="w-4 h-4 text-teal-400" />
                  <span dir="ltr">+966 50 000 0000 (واتساب مباشر)</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>الرياض، المملكة العربية السعودية</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200">
                <p className="font-bold mb-1">دعم فني سريع ومباشر</p>
                <p className="text-[11px] text-teal-300/80">
                  نرد على الاستفسارات في غضون ساعتين بحد أقصى خلال ساعات العمل الرسمية.
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
                    <h3 className="text-lg font-bold text-white">شكراً لتواصلك معنا!</h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto">
                      تم استلام استفسارك بنجاح وسيتواصل معك مستشار الحلول التعليمية عبر الواتساب أو البريد في أقرب وقت.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="px-4 py-2 rounded-lg bg-white/10 text-xs font-semibold text-white"
                    >
                      إرسال رسالة أخرى
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">الاسم الكريم *</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="أ / محمد علي"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">رقم الجوال أو الواتساب *</label>
                        <input
                          type="tel"
                          required
                          dir="ltr"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="+966 5x xxx xxxx"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs text-right"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">البريد الإلكتروني *</label>
                        <input
                          type="email"
                          required
                          dir="ltr"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="teacher@example.com"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">الباقة المهتم بها</label>
                        <select
                          value={contactForm.plan}
                          onChange={(e) => setContactForm({ ...contactForm, plan: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0f172a] border border-white/10 text-white focus:outline-none focus:border-teal-500 text-xs"
                        >
                          <option value="باقة 100 ريال (المعلم الأساسية)">باقة 100 ريال (المعلم الأساسية)</option>
                          <option value="باقة 500 ريال (المعلم المتميز)">باقة 500 ريال (المعلم المتميز)</option>
                          <option value="باقة 800 ريال (السناتر والمراكز)">باقة 800 ريال (السناتر والمراكز)</option>
                          <option value="طلب مخصص لمجمع تعليمي">طلب مخصص لمجمع تعليمي</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">تفاصيل استفسارك أو عدد الطلاب</label>
                      <textarea
                        rows={3}
                        value={contactForm.notes}
                        onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                        placeholder="اكتب استفسارك هنا، أو اطلب تجربة المنصة..."
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                    >
                      {contactLoading ? (
                        <span>جاري الإرسال...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال الاستفسار الآن</span>
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
      <LandingFooter />

    </div>
  );
}
