"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X, ArrowLeft, ShieldCheck, Sparkles, Building2, UserCheck } from "lucide-react";

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#080c14]/85 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                إدارة الطلاب
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-normal border border-teal-500/30">
                  النسخة السحابية
                </span>
              </span>
              <p className="text-[11px] text-slate-400">منظومة المعلمين والمراكز التعليمية الذكية</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="/#features" className="hover:text-teal-400 transition-colors">
              المميزات
            </Link>
            <Link href="/#pricing" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
              <span>الأسعار</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">بالريال (SAR)</span>
            </Link>
            <Link href="/#how-it-works" className="hover:text-teal-400 transition-colors">
              كيف يعمل؟
            </Link>
            <Link href="/#faq" className="hover:text-teal-400 transition-colors">
              الأسئلة الشائعة
            </Link>
            <Link href="/#contact" className="hover:text-teal-400 transition-colors">
              تواصل معنا
            </Link>
            <Link href="/refund" className="hover:text-teal-400 transition-colors text-xs text-slate-400 hover:text-white">
              سياسة الاسترجاع
            </Link>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/center/login"
              className="text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>دخول المراكز</span>
            </Link>

            <Link
              href="/teacher/login"
              className="text-xs font-semibold text-white px-4 py-2 rounded-lg border border-white/15 hover:border-teal-500/40 hover:bg-white/5 transition flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>دخول المعلمين</span>
            </Link>

            <Link
              href="/#pricing"
              className="text-xs font-bold text-slate-950 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 shadow-md shadow-teal-500/25 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>اشترك الآن</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            <Link
              href="/teacher/login"
              className="text-xs text-white bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
            >
              دخول
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white border border-white/10"
              aria-label="القائمة"
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
              href="/#features"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5"
            >
              المميزات
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5 flex items-center justify-between"
            >
              <span>خطط الأسعار بالريال السعودي</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">SAR</span>
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5"
            >
              كيف يعمل النظام؟
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5"
            >
              الأسئلة الشائعة
            </Link>
            <Link
              href="/#contact"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5"
            >
              تواصل معنا والدعم
            </Link>
            <div className="pt-2 border-t border-white/10 flex flex-col gap-1 text-xs text-slate-400">
              <Link href="/privacy" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 hover:text-white">
                سياسة الخصوصية
              </Link>
              <Link href="/terms" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 hover:text-white">
                الشروط والأحكام
              </Link>
              <Link href="/refund" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 hover:text-white">
                سياسة الاسترجاع والإلغاء
              </Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 hover:text-white">
                صفحة الاتصال الرسمية
              </Link>
            </div>
          </nav>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/teacher/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center text-xs font-bold py-2.5 rounded-lg border border-white/20 text-white"
            >
              تسجيل دخول المعلمين
            </Link>
            <Link
              href="/center/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center text-xs font-bold py-2.5 rounded-lg bg-white/5 text-slate-200"
            >
              تسجيل دخول السناتر والمراكز
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center text-xs font-bold py-2.5 rounded-lg bg-teal-500 text-slate-950 font-black"
            >
              عرض الباقات والاشتراك
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
