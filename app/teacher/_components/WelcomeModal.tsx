"use client";

import { Settings, Users, UserPlus, X, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    num: 1,
    icon: Settings,
    label: "حدد الشهور الدراسية",
    desc: 'من "الإعدادات" حدد الشهور اللي هتدرّس فيها السنة دي',
    highlight: true,
    colors: {
      icon: "text-amber-400",
      iconBg: "bg-amber-400/10 border border-amber-400/20",
      card: "bg-amber-400/5 border border-amber-400/20 hover:border-amber-400/40 hover:bg-amber-400/8",
      badge: "bg-amber-400/10 text-amber-400 border border-amber-400/25",
      numBg: "bg-amber-400 text-amber-950",
      arrow: "text-amber-400",
    },
    clickable: true,
  },
  {
    num: 2,
    icon: Users,
    label: "أضف مجموعاتك الدراسية",
    desc: 'من قسم "المجموعات" في القائمة الجانبية',
    highlight: false,
    colors: {
      icon: "text-teal-400",
      iconBg: "bg-teal-400/10 border border-teal-400/20",
      card: "bg-teal-400/5 border border-teal-400/15",
      badge: "",
      numBg: "bg-teal-400 text-teal-950",
      arrow: "",
    },
    clickable: false,
  },
  {
    num: 3,
    icon: UserPlus,
    label: "أضف طلابك",
    desc: 'من قسم "الطلاب" وحدد المجموعة لكل طالب',
    highlight: false,
    colors: {
      icon: "text-indigo-400",
      iconBg: "bg-indigo-400/10 border border-indigo-400/20",
      card: "bg-indigo-400/5 border border-indigo-400/15",
      badge: "",
      numBg: "bg-indigo-400 text-indigo-950",
      arrow: "",
    },
    clickable: false,
  },
];

export function WelcomeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95dvh] flex flex-col bg-slate-950 border border-white/8">

        {/* top glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-teal-500/8 blur-2xl pointer-events-none" />

        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-white/15" />
        </div>

        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X size={16} />
        </button>

        <div className="px-5 pt-5 pb-6 sm:px-7 sm:pt-7 sm:pb-8 overflow-y-auto flex-1 flex flex-col gap-5">

          {/* header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 shadow-lg shadow-teal-900/50 mb-3">
              <Sparkles size={22} className="text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
              أهلاً بك! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              اتبع الخطوات دي{" "}
              <span className="text-teal-400 font-semibold">بالترتيب</span>{" "}
              عشان تبدأ صح
            </p>
          </div>

          {/* steps */}
          <div className="flex flex-col">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isLast = idx === STEPS.length - 1;
              return (
                <div key={idx} className="flex gap-3">
                  {/* left: number + connector */}
                  <div className="flex flex-col items-center gap-0 shrink-0 pt-3.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${step.colors.numBg}`}>
                      {step.num}
                    </span>
                    {!isLast && <div className="w-px flex-1 bg-white/8 my-1.5" />}
                  </div>

                  {/* right: card */}
                  <div className={`flex-1 mb-${isLast ? "0" : "2"}`}>
                    {step.clickable ? (
                      <button
                        type="button"
                        onClick={() => { onClose(); router.push("/teacher/settings"); }}
                        className={`w-full flex items-center gap-3 rounded-2xl p-3.5 text-right transition-all active:scale-[0.98] mb-2 ${step.colors.card}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${step.colors.iconBg}`}>
                          <Icon size={16} className={step.colors.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-white">{step.label}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${step.colors.badge}`}>
                              ابدأ هنا
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                        </div>
                        <ArrowLeft size={15} className={`${step.colors.arrow} opacity-60 shrink-0`} />
                      </button>
                    ) : (
                      <div className={`flex items-center gap-3 rounded-2xl p-3.5 mb-2 ${step.colors.card}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${step.colors.iconBg}`}>
                          <Icon size={16} className={step.colors.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white mb-0.5">{step.label}</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* warning */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-400/5 border border-amber-400/15">
            <CheckCircle2 size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400/80 leading-relaxed">
              اتبع الخطوات{" "}
              <span className="font-bold text-amber-400">بالترتيب</span>{" "}
              عشان كل حاجة تشتغل صح من أول يوم
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-black text-white bg-gradient-to-l from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 shadow-lg shadow-teal-900/40 transition-all active:scale-[0.98]"
          >
            فهمت، هبدأ دلوقتي 🚀
          </button>

          <div className="h-safe-bottom sm:hidden" />
        </div>
      </div>
    </div>
  );
}
