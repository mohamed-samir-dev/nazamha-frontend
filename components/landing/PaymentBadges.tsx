import React from "react";
import Image from "next/image";

export function PaymentBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 sm:gap-4 ${className}`}>
      {/* Mada */}
      <div className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all text-xs font-semibold text-slate-200">
        <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1.5 animate-pulse"></span>
        مدى (Mada)
      </div>

      {/* Visa */}
      <div className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all text-xs font-semibold text-slate-200">
        <span className="text-[#1a1f71] bg-white px-1.5 py-0.5 rounded font-black text-[11px] ml-1.5">VISA</span>
        فيزا
      </div>

      {/* Mastercard */}
      <div className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all text-xs font-semibold text-slate-200">
        <span className="inline-flex items-center ml-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block -mr-1"></span>
        </span>
        ماستركارد
      </div>

      {/* Apple Pay */}
      <div className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all text-xs font-semibold text-slate-200">
        <span className="text-white font-bold ml-1.5">Pay</span>
        أبل باي
      </div>

      {/* PCI-DSS */}
      <div className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-300">
        <svg className="w-3.5 h-3.5 ml-1 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        دفع آمن ومشفّر 100% (PCI-DSS)
      </div>
    </div>
  );
}
