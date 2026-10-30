"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X, ArrowLeft, ArrowRight, Building2, UserCheck, Globe } from "lucide-react";

interface LandingHeaderProps {
  lang?: "ar" | "en";
  onToggleLang?: () => void;
}

export function LandingHeader({ lang = "ar", onToggleLang }: LandingHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAr = lang === "ar";

  const t = {
    brandTitle: isAr ? "إدارة الطلاب" : "StudentTrack",
    badge: isAr ? "النسخة السحابية" : "Cloud Edition",
    brandDesc: isAr ? "منظومة المعلمين والمراكز التعليمية" : "Smart Platform for Tutors & Academies",
    features: isAr ? "المميزات" : "Features",
    pricing: isAr ? "الأسعار" : "Pricing",
    pricingBadge: isAr ? "بالريال (SAR)" : "In SAR",
    howItWorks: isAr ? "كيف يعمل؟" : "How it Works",
    faq: isAr ? "الأسئلة الشائعة" : "FAQ",
    contact: isAr ? "تواصل معنا" : "Contact Us",
    refund: isAr ? "سياسة الاسترجاع" : "Refund Policy",
    centerLogin: isAr ? "دخول المراكز" : "Center Login",
    teacherLogin: isAr ? "دخول المعلمين" : "Teacher Login",
    viewPlans: isAr ? "استعراض الباقات" : "View Plans",
    langToggle: isAr ? "English" : "العربية",
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#080c14]/85 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link href="/landing" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                {t.brandTitle}
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-normal border border-teal-500/30">
                  {t.badge}
                </span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">{t.brandDesc}</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
            <Link href="/landing#features" className="hover:text-teal-400 transition-colors">
              {t.features}
            </Link>
            <Link href="/landing#pricing" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
              <span>{t.pricing}</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                {t.pricingBadge}
              </span>
            </Link>
            <Link href="/landing#how-it-works" className="hover:text-teal-400 transition-colors">
              {t.howItWorks}
            </Link>
            <Link href="/landing#faq" className="hover:text-teal-400 transition-colors">
              {t.faq}
            </Link>
            <Link href="/landing#contact" className="hover:text-teal-400 transition-colors">
              {t.contact}
            </Link>
            <Link href="/refund" className="hover:text-teal-400 transition-colors text-xs text-slate-400 hover:text-white">
              {t.refund}
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher Button */}
            {onToggleLang && (
              <button
                type="button"
                onClick={onToggleLang}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-teal-300 border border-teal-500/30 hover:border-teal-400 transition-all shadow-sm active:scale-95"
                title={isAr ? "Switch to English" : "التبديل إلى العربية"}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t.langToggle}</span>
              </button>
            )}

            <Link
              href="/center/login"
              className="text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>{t.centerLogin}</span>
            </Link>

            <Link
              href="/teacher/login"
              className="text-xs font-semibold text-white px-3.5 py-2 rounded-lg border border-white/15 hover:border-teal-500/40 hover:bg-white/5 transition flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>{t.teacherLogin}</span>
            </Link>

            <Link
              href="/landing#pricing"
              className="text-xs font-bold text-slate-950 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 shadow-md shadow-teal-500/25 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>{t.viewPlans}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center md:hidden gap-2">
            {/* Language Toggle Mobile */}
            {onToggleLang && (
              <button
                type="button"
                onClick={onToggleLang}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 text-xs font-bold text-teal-300 border border-teal-500/30"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t.langToggle}</span>
              </button>
            )}

            <Link
              href="/teacher/login"
              className="text-xs text-white bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
            >
              {isAr ? "دخول" : "Login"}
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white border border-white/10"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0f172a] px-4 pt-4 pb-6 space-y-3 animate-fadeIn">
          <nav className="flex flex-col gap-2 text-sm text-slate-200">
            <Link
              href="/landing#features"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5"
            >
              {t.features}
            </Link>
            <Link
              href="/landing#pricing"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5 flex items-center justify-between"
            >
              <span>{t.pricing}</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">SAR</span>
            </Link>
            <Link
              href="/landing#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5"
            >
              {t.howItWorks}
            </Link>
            <Link
              href="/landing#faq"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5"
            >
              {t.faq}
            </Link>
            <Link
              href="/landing#contact"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5"
            >
              {t.contact}
            </Link>
            <div className="pt-2 border-t border-white/10 flex flex-col gap-1 text-xs text-slate-400">
              <Link href="/privacy" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 hover:text-white">
                {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
              </Link>
              <Link href="/terms" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 hover:text-white">
                {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
              </Link>
              <Link href="/refund" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 hover:text-white">
                {isAr ? "سياسة الاسترجاع والإلغاء" : "Refund Policy"}
              </Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 hover:text-white">
                {isAr ? "صفحة الاتصال الرسمية" : "Contact Page"}
              </Link>
            </div>
          </nav>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/teacher/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center text-xs font-bold py-2.5 rounded-lg border border-white/20 text-white"
            >
              {t.teacherLogin}
            </Link>
            <Link
              href="/center/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center text-xs font-bold py-2.5 rounded-lg bg-white/5 text-slate-200"
            >
              {t.centerLogin}
            </Link>
            <Link
              href="/landing#pricing"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center text-xs font-bold py-2.5 rounded-lg bg-teal-500 text-slate-950 font-black"
            >
              {t.viewPlans}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
