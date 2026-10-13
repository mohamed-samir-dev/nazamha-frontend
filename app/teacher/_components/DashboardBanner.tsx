"use client";

import { useState } from "react";
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

interface BannerProps {
  message: string;
  type: "info" | "warning" | "success" | "danger";
}

const CONFIG = {
  info:    { icon: Info,          iconColor: "text-blue-400",   bg: "bg-blue-500/[0.08]",   border: "border-blue-500/25" },
  warning: { icon: AlertTriangle, iconColor: "text-amber-400",  bg: "bg-amber-500/[0.08]",  border: "border-amber-500/25" },
  success: { icon: CheckCircle,   iconColor: "text-emerald-400",bg: "bg-emerald-500/[0.08]",border: "border-emerald-500/25" },
  danger:  { icon: AlertCircle,   iconColor: "text-red-400",    bg: "bg-red-500/[0.08]",    border: "border-red-500/25" },
};

export function DashboardBanner({ message, type }: BannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !message) return null;

  const { icon: Icon, iconColor, bg, border } = CONFIG[type] ?? CONFIG.info;

  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 mb-6 rounded-xl border ${bg} ${border}`}>
      <Icon size={18} className={`shrink-0 ${iconColor}`} />
      <span className="flex-1 text-sm font-medium text-slate-100 leading-relaxed">{message}</span>
      <button
        onClick={() => setDismissed(true)}
        className={`flex items-center justify-center p-0.5 rounded text-slate-500 transition-colors hover:${iconColor} cursor-pointer bg-transparent border-0`}
      >
        <X size={16} />
      </button>
    </div>
  );
}
