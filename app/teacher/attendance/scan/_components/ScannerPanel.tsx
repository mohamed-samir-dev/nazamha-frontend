"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CrossGroupConfirm, LastScan } from "../_hooks/useScanSession";

interface Props {
  scanning: boolean;
  selectedGroupId: string;
  scannerDivId: string;
  lastScan: LastScan | null;
  crossGroupConfirm: CrossGroupConfirm | null;
  onConfirmCrossGroup: () => void;
  onCancelCrossGroup: () => void;
}

export function ScannerPanel({
  scanning, selectedGroupId, scannerDivId,
  lastScan, crossGroupConfirm,
  onConfirmCrossGroup, onCancelCrossGroup,
}: Props) {
  return (
    <section className="glass-panel p-4 sm:p-5 flex flex-col items-center justify-center min-h-[320px] sm:min-h-[420px] relative">
      {!scanning && (
        <div className="flex flex-col items-center justify-center gap-4 text-center py-10 px-6">
          <div className="text-teal-400 opacity-20">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="3" height="3" />
              <rect x="14" y="7" width="3" height="3" />
              <rect x="7" y="14" width="3" height="3" />
              <path d="M14 14h3v3" />
            </svg>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-semibold text-slate-300">
              {selectedGroupId ? "اضغط «تشغيل الكاميرا» لبدء السكان" : "اختر المجموعة أولاً"}
            </p>
            <p className="text-sm text-slate-500">وجّه الكاميرا نحو QR الطالب وسيتم تسجيله تلقائياً</p>
          </div>
        </div>
      )}

      {lastScan && (
        <div className={`w-full max-w-[480px] px-4 py-3 rounded-xl font-bold text-sm flex items-start gap-2 shadow-[0_4px_15px_rgba(0,0,0,0.3)] animate-[slideUp_0.3s_ease] ${
          lastScan.success
            ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
            : "bg-red-500/15 border border-red-500/40 text-red-400"
        }`}>
          <span className="flex-shrink-0 mt-0.5">
            {lastScan.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </span>
          <span className="leading-snug break-words min-w-0">
            {lastScan.success ? `حضر: ${lastScan.name}` : lastScan.name}
          </span>
        </div>
      )}

      <div className="relative w-full max-w-[480px]">
        <div
          id={scannerDivId}
          style={{
            width: "100%",
            borderRadius: 16,
            overflow: "hidden",
            minHeight: scanning ? 300 : 0,
          }}
        />

        {crossGroupConfirm && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center rounded-2xl backdrop-blur-sm">
            <AlertCircle size={40} className="text-amber-400 mb-3 flex-shrink-0" />
            <h3 className="text-white mb-3 font-bold text-lg">تسجيل حضور خارج المجموعة</h3>
            
            <div className="bg-slate-800/60 rounded-lg p-4 mb-4 w-full space-y-3 text-right">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                <span className="text-slate-400 text-sm">اسم الطالب:</span>
                <strong className="text-white text-base">{crossGroupConfirm.student.name}</strong>
              </div>
              
              <div className="space-y-2">
                <p className="text-amber-300 text-sm font-semibold">هذا الطالب مسجل في:</p>
                <div className="bg-slate-900/50 rounded p-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs">المجموعة:</span>
                    <strong className="text-amber-400 text-sm">{crossGroupConfirm.originalGroupName}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs">موعد الحصص:</span>
                    <strong className="text-emerald-400 text-sm">{crossGroupConfirm.originalGroupSchedule}</strong>
                  </div>
                  {crossGroupConfirm.nextScheduledDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">الموعد القادم:</span>
                      <strong className={`text-sm ${crossGroupConfirm.scheduledDateIsToday ? 'text-green-400' : 'text-blue-400'}`}>
                        {crossGroupConfirm.nextScheduledDate}
                        {crossGroupConfirm.scheduledDateIsToday && " (اليوم)"}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-700">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {crossGroupConfirm.reason}
                </p>
              </div>
            </div>
            
            <p className="text-white text-sm mb-4 font-semibold">
              هل توافق على تسجيل حضوره في مجموعته الأصلية؟
            </p>
            
            <div className="flex gap-3 w-full">
              <Button
                onClick={onCancelCrossGroup}
                style={{ flex: 1, justifyContent: "center", background: "rgba(100,116,139,0.4)", border: "none", fontSize: "0.9rem", fontWeight: "600", color: "#e2e8f0" }}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                style={{ flex: 1, justifyContent: "center", fontSize: "0.9rem", fontWeight: "600" }}
                onClick={onConfirmCrossGroup}
              >
                موافق، سجّل الحضور
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
