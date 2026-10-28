"use client";
import { useRef, useState } from "react";
import { Student, MonthlySubscription, Group } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { ARABIC_MONTHS } from "./payment-scan/types";
import { usePaymentScan } from "./payment-scan/usePaymentScan";
import { DueMonthsCard } from "./payment-scan/DueMonthsCard";
import { ScannerView } from "./payment-scan/ScannerView";
import { ManualInput } from "./payment-scan/ManualInput";
import { FlashMessage } from "./payment-scan/FlashMessage";
interface Props {
  ownerId?: string;
  students: Student[]; groups?: Group[]; subsMap?: Map<string, MonthlySubscription[]>;
  onClose: () => void; onStudentUpdated: (id: string, months: boolean[]) => void;
  onSubsPaid?: (id: string, subs: MonthlySubscription[]) => void;
  onStudentsRefresh?: (students: Student[]) => void;
  onStudentChanged?: (student: Student) => void;
}
export function PaymentScanModal({ ownerId, students, groups = [], subsMap, onClose, onStudentUpdated, onSubsPaid, onStudentChanged }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const state = usePaymentScan({ ownerId, students, groups, subsMap, onStudentUpdated, onSubsPaid, onStudentChanged });
  const close = async () => { if (!state.canClose()) return; state.dismissCard(); await state.stopScanner(); onClose(); };
  return <Modal isOpen onClose={close} closeDisabled={state.locked} title="سكان دفع الاشتراك" maxWidth="580px">
    <div className="flex flex-col gap-4" dir="rtl">
      <p className="text-sm text-[var(--text-secondary)]">ابحث عن الطالب بالكود أو الكاميرا. لن يُسجّل أي دفع إلا بعد مراجعة المبلغ وتأكيد استلامه.</p>
      <div className="flex gap-3">
        <label className="flex-1 text-sm">المستحقات حتى شهر
          <select aria-label="شهر الدفع" className="form-input" value={state.selectedMonth} disabled={state.locked} onChange={e => state.setSelectedMonth(Number(e.target.value))}>
            {ARABIC_MONTHS.map((month,i) => <option key={month} value={i}>{month}</option>)}
          </select>
        </label>
        <label className="w-28 text-sm">السنة
          <input aria-label="سنة الدفع" className="form-input" type="number" min={2000} max={2100} value={state.selectedYear} disabled={state.locked} onChange={e => state.setSelectedYear(Number(e.target.value))} />
        </label>
      </div>
      <ManualInput value={state.manualCode} onChange={state.setManualCode} onSubmit={state.handleManualSubmit} loading={state.loadingCode} disabled={state.locked} />
      <button type="button" className="btn btn-secondary" disabled={state.locked || state.loadingCode} onClick={async () => { await state.stopScanner(); setCameraMode(value => !value); }}>
        {cameraMode ? "إخفاء الكاميرا واستخدام الكود" : "استخدام الكاميرا"}
      </button>
      {cameraMode && <ScannerView scanning={state.scanning} isStarting={state.isStarting} disabled={state.locked || state.loadingCode || !!state.currentStudent} onStart={state.startScanner} onStop={state.stopScanner} />}
      <FlashMessage flashMsg={state.flashMsg} loading={state.loadingCode} />
      {state.uncertain && !state.currentStudent && <button type="button" className="btn btn-primary" disabled={state.isConfirming} onClick={state.handleConfirmPayment}>{state.isConfirming ? "جاري التحقق…" : "التحقق وإعادة نفس العملية"}</button>}
      {state.currentStudent && state.dueMonths && state.flashMsg?.type !== "success" && <>
        <DueMonthsCard student={state.currentStudent} dueMonths={state.dueMonths} selectedSubs={state.selectedSubs} isConfirming={state.isConfirming} locked={state.locked} uncertain={state.uncertain} totalSelected={state.totalSelected} resolveAmount={state.resolveAmount}
          onToggle={id => state.setSelectedSubs(old => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next; })}
          onConfirm={state.handleConfirmPayment} onDismiss={state.dismissCard} cardRef={cardRef} />
        <button type="button" className="btn btn-secondary" disabled={state.locked || state.loadingCode} onClick={state.reloadStudent}>تحديث بيانات الطالب والمستحقات</button>
      </>}
    </div>
  </Modal>;
}
