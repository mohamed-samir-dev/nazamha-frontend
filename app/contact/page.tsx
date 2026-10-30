"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Mail, Phone, Clock, MessageSquare, Send, CheckCircle2, ArrowRight } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "استفسار عن باقات المعلمين",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col font-sans">
      <LandingHeader />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-teal-400 hover:text-teal-300">
            <ArrowRight className="w-4 h-4" />
            <span>العودة للصفحة الرئيسية</span>
          </Link>
        </div>

        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>نحن هنا لمساعدتك على مدار الساعة</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
            تواصل معنا وطلب الدعم الفني
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            فريقنا متاح للإجابة عن جميع استفساراتك، وتقديم عروض مخصصة للمراكز والسناتر الكبيرة، ومساعدتك في إعداد حسابك وربط أجهزة الحضور.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Contact Details (Left side in RTL) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-white/10 space-y-6">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-4">
                بيانات الاتصال الرسمية
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">البريد الإلكتروني المعتمد:</span>
                    <a href="mailto:loutfallaasfora@gmail.com" className="text-white hover:text-teal-400 font-mono text-sm">
                      loutfallaasfora@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">الهاتف وخدمة واتساب المباشرة:</span>
                    <a href="https://wa.me/201012486445" target="_blank" rel="noopener noreferrer" className="text-white hover:text-teal-400 font-mono text-sm" dir="ltr">
                      01012486445
                    </a>
                  </div>
                </div>


                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">أوقات عمل فريق الدعم:</span>
                    <p className="text-white text-sm">
                      يومياً: 9:00 صباحاً - 11:00 مساءً
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-950/40 to-emerald-950/20 border border-teal-500/25">
              <h3 className="text-base font-bold text-white mb-2">هل تمثل مركزاً أو مجمعاً تعليمياً كبيراً؟</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                نوفر للمراكز الكبرى باقات مخصصة تشمل تدريباً كاملاً للمساعدين وربط أجهزة الحضور ودمج بوابات الدفع.
              </p>
              <a
                href="https://wa.me/201012486445"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 hover:text-teal-200"
              >
                <span>تحدث مباشرة عبر واتساب</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a]/70 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">أرسل لنا رسالة وسنرد عليك في غضون ساعتين</h2>

              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">تم إرسال رسالتك بنجاح!</h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    شكراً لتواصلك معنا. سيقوم فريق الدعم أو المبيعات بالتواصل معك عبر الواتساب أو البريد الإلكتروني في أقرب وقت.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", phone: "", subject: "استفسار عن باقات المعلمين", message: "" });
                    }}
                    className="mt-4 px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                  >
                    إرسال رسالة أخرى
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        الاسم الكامل *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="أ / محمد عبدالله"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        رقم الجوال أو الواتساب *
                      </label>
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+966 5x xxx xxxx"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      required
                      dir="ltr"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="teacher@example.com"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      الموضوع / نوع الاستفسار
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#0f172a] border border-white/10 text-white focus:outline-none focus:border-teal-500 transition"
                    >
                      <option value="استفسار عن باقة 100 ريال">استفسار عن باقة المعلم الأساسية (100 ر.س)</option>
                      <option value="استفسار عن باقة 500 ريال">استفسار عن باقة المعلم المتميز (500 ر.س)</option>
                      <option value="استفسار عن باقة 800 ريال للسناتر">استفسار عن باقة السناتر والمراكز (800 ر.س)</option>
                      <option value="طلب دعم فني">طلب مساعدة ودعم فني</option>
                      <option value="استفسار مالي وفواتير">استفسار مالي أو بوابات دفع</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      تفاصيل الرسالة أو الاستفسار *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="اكتب استفسارك هنا، عدد طلابك، أو أي متطلبات خاصة..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>جاري الإرسال...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال الرسالة الآن</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
