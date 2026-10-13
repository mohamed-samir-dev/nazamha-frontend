"use client";

import { useRef } from "react";
import { X, CreditCard, ChevronDown, CheckCircle2 } from "lucide-react";
import { Student, MonthlySubscription, Group } from "@/lib/types";
import { ARABIC_MONTHS } from "./payment-scan/types";
import { usePaymentScan } from "./payment-scan/usePaymentScan";
import { DueMonthsCard } from "./payment-scan/DueMonthsCard";
import { ScannerView } from "./payment-scan/ScannerView";
import { ManualInput } from "./payment-scan/ManualInput";
import { FlashMessage } from "./payment-scan/FlashMessage";
import { PaidList } from "./payment-scan/PaidList";

interface Props {
  students: Student[];
  groups?: Group[];
  subsMap?: Map<string, MonthlySubscription[]>;
  onClose: () => void;
  onStudentUpdated: (studentId: string, months: boolean[]) => void;
  onSubsPaid?: (studentId: string, updatedSubs: MonthlySubscription[]) => void;
  onStudentsRefresh?: (students: Student[]) => void;
}

export function PaymentScanModal({ students, groups = [], subsMap, onClose, onStudentUpdated, onSubsPaid }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    now, selectedMonth, setSelectedMonth,
    scanning, isStarting, paidList,
    manualCode, setManualCode,
    dueMonths, currentStudent,
    selectedSubs, setSelectedSubs,
    isConfirming, loadingCode,
    flashMsg,
    totalSelected, resolveAmount,
    overduePopup,
    dismissCard, handleManualSubmit,
    handleConfirmPayment, startScanner, stopScanner,
  } = usePaymentScan({ students, groups, subsMap, onStudentUpdated, onSubsPaid });

  const handleClose = async () => { await stopScanner(); onClose(); };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-[520px] shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] min-h-[50vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Overdue Popup Overlay ── */}
        {overduePopup && currentStudent && dueMonths && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-t-3xl sm:rounded-2xl p-4">
            <div className="w-full max-w-[420px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden border border-amber-500/40 bg-[var(--bg-secondary)] shadow-[0_0_40px_rgba(245,158,11,0.2)]">
              <DueMonthsCard
                student={currentStudent}
                dueMonths={dueMonths}
                selectedSubs={selectedSubs}
                isConfirming={isConfirming}
                totalSelected={totalSelected}
                resolveAmount={resolveAmount}
                onToggle={id => setSelectedSubs(prev => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })}
                onConfirm={handleConfirmPayment}
                onDismiss={dismissCard}
                cardRef={cardRef}
              />
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <CreditCard size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-[1rem] font-bold text-[var(--text-primary)] leading-tight">سكان دفع الاشتراك</h2>
              <p className="text-xs text-[var(--text-muted)]">سكان QR أو أدخل الكود لتسجيل الدفع</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Month selector row */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap shrink-0">الشهر</span>
            <div className="relative flex-1 min-w-0">
              <select
                className="w-full py-2 pr-3 pl-7 bg-slate-900/80 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm font-semibold cursor-pointer outline-none appearance-none focus:border-teal-500 transition-all"
                value={selectedMonth}
                onChange={e => { setSelectedMonth(Number(e.target.value)); dismissCard(); }}
              >
                {ARABIC_MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}{i === now.getMonth() ? " — الحالي" : ""}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>
            {paidList.length > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 whitespace-nowrap shrink-0">
                <CheckCircle2 size={11} />
                <span className="hidden xs:inline">{paidList.length} مسجّل</span>
                <span className="xs:hidden">{paidList.length}</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Messages + DueMonthsCard (above scanner, scrollable) ── */}
        <div className="flex flex-col gap-3 px-4 sm:px-5 pt-3 pb-3 border-t border-[var(--border-color)] overflow-y-auto" style={{ maxHeight: "45vh" }}>
          <ManualInput
            value={manualCode}
            onChange={setManualCode}
            onSubmit={handleManualSubmit}
            loading={loadingCode}
          />

          {/* Due months card — shown inline only when NOT overdue popup (1 late month) */}
          {currentStudent && dueMonths && !loadingCode && !overduePopup && (
            <DueMonthsCard
              student={currentStudent}
              dueMonths={dueMonths}
              selectedSubs={selectedSubs}
              isConfirming={isConfirming}
              totalSelected={totalSelected}
              resolveAmount={resolveAmount}
              onToggle={id => setSelectedSubs(prev => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
              })}
              onConfirm={handleConfirmPayment}
              onDismiss={dismissCard}
              cardRef={cardRef}
            />
          )}
        </div>

        {/* ── Scanner ── */}
        <div className="px-4 sm:px-5 pb-3 border-t border-[var(--border-color)] shrink-0">
          <ScannerView
            scanning={scanning}
            isStarting={isStarting}
            onStart={startScanner}
            onStop={stopScanner}
          />
          {(flashMsg || loadingCode) && (
            <div className="mt-2">
              <FlashMessage flashMsg={flashMsg} loading={loadingCode} />
            </div>
          )}
        </div>

        {/* ── Paid list (scrollable) ── */}
        <div className="flex flex-col gap-3 px-4 sm:px-5 pt-3 pb-4 overflow-y-auto flex-1 min-h-0">
          <PaidList paidList={paidList} />
          <div className="h-1" />
        </div>

      </div>
    </div>
  );
}
