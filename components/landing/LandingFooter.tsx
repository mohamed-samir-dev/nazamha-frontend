import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Mail, Phone, Clock, Lock } from "lucide-react";
import { PaymentBadges } from "./PaymentBadges";

interface LandingFooterProps {
  lang?: "ar" | "en";
}

export function LandingFooter({ lang = "ar" }: LandingFooterProps) {
  const isAr = lang === "ar";

  return (
    <footer className="bg-[#05080e] border-t border-white/10 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
          
          {/* Col 1: Brand & About */}
          <div className="space-y-4">
            <Link href="/landing" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-teal-500/20 shrink-0">
                <GraduationCap className="w-5 h-5 font-bold" />
              </div>
              <span className="text-xl font-black text-white">
                {isAr ? "إدارة الطلاب" : "StudentTrack"}
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {isAr
                ? "المنصة السحابية المتكاملة لإدارة الطلاب والسناتر التعليمية، تسجيل الحضور الفوري بـ QR، أتمتة إشعارات الواتساب، وإدارة الفواتير والاشتراكات بالريال السعودي."
                : "The cloud platform for student & academy management, instant QR attendance, automated WhatsApp parent alerts, and billing in SAR."}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? "نظام معتمد وموثوق للمعلمين والسناتر" : "Trusted by Tutors & Academies"}</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">
              {isAr ? "روابط سريعة" : "Quick Links"}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/landing#features" className="hover:text-teal-400 transition-colors">
                  {isAr ? "مميزات المنظومة" : "Features"}
                </Link>
              </li>
              <li>
                <Link href="/landing#pricing" className="hover:text-teal-400 transition-colors">
                  {isAr ? "خطط الأسعار (بالريال السعودي)" : "Pricing (in SAR)"}
                </Link>
              </li>
              <li>
                <Link href="/landing#how-it-works" className="hover:text-teal-400 transition-colors">
                  {isAr ? "كيف تبدأ في 3 خطوات؟" : "How it Works"}
                </Link>
              </li>
              <li>
                <Link href="/landing#faq" className="hover:text-teal-400 transition-colors">
                  {isAr ? "الأسئلة المتكررة" : "FAQ"}
                </Link>
              </li>
              <li>
                <Link href="/teacher/login" className="hover:text-teal-400 transition-colors">
                  {isAr ? "تسجيل دخول المعلمين" : "Teacher Login"}
                </Link>
              </li>
              <li>
                <Link href="/center/login" className="hover:text-teal-400 transition-colors">
                  {isAr ? "تسجيل دخول المراكز والسناتر" : "Center Login"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Gateway Policies */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">
              {isAr ? "السياسات والشروط" : "Policies & Legal"}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</span>
                  <span className="text-[10px] bg-white/5 px-1 rounded text-slate-300">PDPL</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-teal-400 transition-colors">
                  {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-teal-400 transition-colors text-amber-300/90 font-medium">
                  {isAr ? "سياسة الاسترجاع والإلغاء (14 يوماً)" : "Refund Policy (14 Days)"}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-400 transition-colors">
                  {isAr ? "الدعم الفني وتواصل معنا" : "Support & Contact"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Details (NO LOCATION / NO ADDRESS) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">
              {isAr ? "معلومات التواصل المباشر" : "Contact Information"}
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">{isAr ? "البريد الإلكتروني:" : "Email:"}</span>
                  <a href="mailto:loutfallaasfora@gmail.com" dir="ltr" className="hover:text-white transition-colors font-mono">
                    loutfallaasfora@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">{isAr ? "الهاتف وواتساب:" : "Phone & WhatsApp:"}</span>
                  <a href="https://wa.me/201012486445" target="_blank" rel="noopener noreferrer" dir="ltr" className="hover:text-white transition-colors font-mono font-bold">
                    01012486445
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">{isAr ? "ساعات الدعم:" : "Support Hours:"}</span>
                  <span>{isAr ? "يومياً: 9:00 ص - 11:00 م" : "Daily: 9:00 AM - 11:00 PM"}</span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Payment Badges & Compliance Bar */}
        <div id="payment-security" className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-right space-y-1">
            <p className="text-xs font-semibold text-slate-300">
              {isAr ? "وسائل الدفع المعتمدة والآمنة بالريال السعودي (SAR)" : "Secure Accepted Payment Methods in SAR"}
            </p>
            <p className="text-[11px] text-slate-500">
              {isAr
                ? "جميع العمليات والمدفوعات الإلكترونية مشفرة بأحدث بروتوكولات الأمان SSL 256-bit ومتوافقة مع معايير PCI-DSS العالمية."
                : "All online transactions are encrypted via 256-bit SSL and fully compliant with global PCI-DSS standards."}
            </p>
          </div>

          <PaymentBadges />
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} {isAr ? "منصة إدارة الطلاب (StudentTrack). جميع الحقوق محفوظة." : "StudentTrack Platform. All Rights Reserved."}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-300">{isAr ? "الخصوصية" : "Privacy"}</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-300">{isAr ? "الشروط" : "Terms"}</Link>
            <span>•</span>
            <Link href="/refund" className="hover:text-slate-300">{isAr ? "الاسترجاع" : "Refund"}</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-300">{isAr ? "اتصل بنا" : "Contact"}</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
