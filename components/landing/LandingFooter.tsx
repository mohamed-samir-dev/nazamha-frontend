import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Mail, Phone, MapPin, Clock, Lock } from "lucide-react";
import { PaymentBadges } from "./PaymentBadges";

export function LandingFooter() {
  return (
    <footer className="bg-[#05080e] border-t border-white/10 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          
          {/* Col 1: Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-teal-500/20">
                <GraduationCap className="w-5 h-5 font-bold" />
              </div>
              <span className="text-xl font-black text-white">إدارة الطلاب</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              المنصة السحابية المتكاملة لإدارة الطلاب والسناتر التعليمية، تسجيل الحضور الفوري بالباركود و QR، أتمتة إشعارات الواتساب، وإدارة الفواتير والاشتراكات بالريال السعودي.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>نظام موثوق ومعتمد للمؤسسات والمعلمين</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">روابط سريعة</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#features" className="hover:text-teal-400 transition-colors">
                  مميزات المنظومة
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-teal-400 transition-colors">
                  خطط الأسعار (بالريال السعودي)
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-teal-400 transition-colors">
                  كيف تبدأ في 3 خطوات؟
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-teal-400 transition-colors">
                  الأسئلة المتكررة
                </Link>
              </li>
              <li>
                <Link href="/teacher/login" className="hover:text-teal-400 transition-colors">
                  تسجيل دخول المعلمين
                </Link>
              </li>
              <li>
                <Link href="/center/login" className="hover:text-teal-400 transition-colors">
                  تسجيل دخول المراكز والسناتر
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Gateway Policies */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">السياسات والشروط</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span>سياسة الخصوصية</span>
                  <span className="text-[10px] bg-white/5 px-1 rounded text-slate-300">PDPL</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-teal-400 transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-teal-400 transition-colors text-amber-300/90 font-medium">
                  سياسة الاسترجاع والإلغاء (14 يوماً)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-400 transition-colors">
                  الدعم الفني وتواصل معنا
                </Link>
              </li>
              <li>
                <a href="#payment-security" className="hover:text-teal-400 transition-colors flex items-center gap-1">
                  <Lock className="w-3 h-3 text-teal-400" />
                  <span>معايير أمان الدفع الإلكتروني</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">معلومات التواصل</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <a href="mailto:loutfallaasfora@gmail.com" dir="ltr" className="hover:text-white transition-colors">
                  loutfallaasfora@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <a href="https://wa.me/201012486445" target="_blank" rel="noopener noreferrer" dir="ltr" className="hover:text-white transition-colors">
                  01012486445
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <span>المملكة العربية السعودية - الرياض</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <span>دعم فني: الأحد - الخميس (9:00 ص - 10:00 م)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Payment Badges & Compliance Bar */}
        <div id="payment-security" className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-right space-y-1">
            <p className="text-xs font-semibold text-slate-300">
              وسائل الدفع المعتمدة والآمنة بالريال السعودي (SAR)
            </p>
            <p className="text-[11px] text-slate-500">
              جميع العمليات والمدفوعات الإلكترونية مشفرة بأحدث بروتوكولات الأمان SSL 256-bit ومتوافقة مع معايير PCI-DSS العالمية.
            </p>
          </div>

          <PaymentBadges />
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} منصة إدارة الطلاب (StudentTrack). جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-300">الخصوصية</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-300">الشروط</Link>
            <span>•</span>
            <Link href="/refund" className="hover:text-slate-300">الاسترجاع</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-300">اتصل بنا</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
