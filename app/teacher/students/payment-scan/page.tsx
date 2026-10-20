"use client";
import { useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ScanLine, ShieldCheck, Keyboard, UserRound, Camera, CircleCheck } from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";
import { usePaymentScan } from "../_components/payment-scan/usePaymentScan";
import { ScannerView } from "../_components/payment-scan/ScannerView";
import { DueMonthsCard } from "../_components/payment-scan/DueMonthsCard";
import { ManualInput } from "../_components/payment-scan/ManualInput";
import { FlashMessage } from "../_components/payment-scan/FlashMessage";
import { ARABIC_MONTHS } from "../_components/payment-scan/types";
import styles from "./scan.module.css";

const noop = () => {};
export default function PaymentScanPage() {
  const { data } = useDashboard();
  const ownerId = data?.teacher?.id ?? data?.teacher?._id;
  // Mount the payment session only after its account identity is available.
  return ownerId ? <PaymentDesk key={ownerId} ownerId={ownerId} /> : <div className={styles.page} role="status">جاري تجهيز سكان الدفع…</div>;
}
function PaymentDesk({ownerId}: {ownerId: string}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const lastReview = useRef("");
  const state = usePaymentScan({ownerId, autoCamera: true, students: [], groups: [], onStudentUpdated: noop});
  useEffect(() => {
    if (state.loadingCode || state.isConfirming) return;
    const key = state.currentStudent?.id ?? (state.uncertain ? "pending-payment" : "");
    if (!key) { lastReview.current = ""; return; }
    if (lastReview.current === key || !window.matchMedia("(max-width: 850px)").matches) return;
    const frame = requestAnimationFrame(() => {
      const target = resultRef.current;
      if (!target) return;
      lastReview.current = key;
      // Dismiss the mobile keyboard without focusing a payment action.
      target.focus({preventScroll: true});
      target.scrollIntoView({block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
    });
    return () => cancelAnimationFrame(frame);
  }, [state.currentStudent?.id, state.uncertain, state.loadingCode, state.isConfirming]);
  return <div className={styles.page} dir="rtl">
    <header className={styles.header}>
      <div><span className={styles.eyebrow}><ScanLine size={15} /> تحصيل الاشتراكات</span><h1>سكان الدفع</h1><p>امسح كارت الطالب، والباقي علينا.</p></div>
      <Link className={styles.back} href="/teacher/students" onClick={e => {if (!state.canClose()) e.preventDefault();}} aria-disabled={state.locked}><ArrowRight size={16} /> الطلاب</Link>
    </header>
    <section className={styles.period} aria-label="فترة التحصيل">
      <div><strong>بتحصّل اشتراك شهر</strong><p>راجع الشهر قبل تشغيل الكاميرا.</p></div>
      <div className={styles.periodFields}>
        <label>الشهر<select aria-label="شهر الدفع" disabled={state.locked} value={state.selectedMonth} onChange={e => state.setSelectedMonth(Number(e.target.value))}>{ARABIC_MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}</select></label>
        <label>السنة<select aria-label="سنة الدفع" disabled={state.locked} value={state.selectedYear} onChange={e => state.setSelectedYear(Number(e.target.value))}>{Array.from({length: 101},(_,i) => 2000+i).map(y => <option key={y} value={y}>{y}</option>)}</select></label>
      </div>
      <span className={styles.auto}><ShieldCheck size={16} /> دفع تلقائي للحالات البسيطة</span>
    </section>
    <div className={styles.columns}>
      <section className={styles.panel}>
        <div className={styles.panelHeading}><span><Camera size={19} /> مسح كارت الطالب</span><small className={state.scanning ? styles.live : ""}>{state.isConfirming ? "جاري تسجيل الدفع" : state.loadingCode ? "جاري التعرف" : state.currentStudent ? "بانتظار المراجعة" : state.scanning ? "الكاميرا جاهزة" : "الكاميرا متوقفة"}</small></div>
        <div className={styles.camera}><ScannerView scanning={state.scanning} isStarting={state.isStarting} disabled={state.locked || state.loadingCode || !!state.currentStudent} onStart={state.startScanner} onStop={state.stopScanner} /></div>
        <div className={styles.hint}><CircleCheck size={17} /><p>لو المستحق هو الشهر المختار فقط، هنسجّل الدفع مباشرة. المتأخرات والإيقاف وأي مبلغ محتاج مراجعة، هيظهروا للتأكيد.</p></div>
        <div className={styles.manual}><h2><Keyboard size={17} /> إدخال الكود يدويًا</h2><p>مش معاك الكارت؟ اكتب الكود وراجع البيانات قبل الدفع.</p><ManualInput value={state.manualCode} onChange={state.setManualCode} onSubmit={state.handleManualSubmit} loading={state.loadingCode} disabled={state.locked} /></div>
      </section>
      <section ref={resultRef} tabIndex={-1} className={`${styles.panel} ${styles.resultPanel}`} aria-label="نتيجة المسح">
        <div className={styles.panelHeading}><span><UserRound size={19} /> نتيجة المسح</span><small>{ARABIC_MONTHS[state.selectedMonth]} {state.selectedYear}</small></div>
        <div className={styles.result}>
          <FlashMessage loading={state.loadingCode || state.isConfirming} saving={state.isConfirming} flashMsg={state.flashMsg} />
          {state.uncertain && !state.currentStudent && <button className="btn btn-primary" disabled={state.isConfirming} onClick={state.handleConfirmPayment}>التحقق وإعادة نفس العملية</button>}
          {state.currentStudent && state.dueMonths ? <>
            {state.currentStudent.is_suspended && <p className={styles.warning}>الطالب موقوف — راجع سبب الإيقاف قبل تأكيد استلام الدفع.</p>}
            <DueMonthsCard student={state.currentStudent} dueMonths={state.dueMonths} selectedSubs={state.selectedSubs} totalSelected={state.totalSelected} isConfirming={state.isConfirming} locked={state.locked} uncertain={state.uncertain} resolveAmount={state.resolveAmount} cardRef={cardRef} onConfirm={state.handleConfirmPayment} onDismiss={state.dismissCard} onToggle={id => state.setSelectedSubs(old => {const next=new Set(old); next.has(id)?next.delete(id):next.add(id); return next;})} />
            <button className={styles.refresh} disabled={state.locked || state.loadingCode} onClick={state.reloadStudent}>تحديث المستحقات</button>
          </> : !state.uncertain && !state.loadingCode && !state.flashMsg && <div className={styles.empty}><div><ScanLine size={42} /></div><h2>جاهزين للطالب التالي</h2><p>شغّل الكاميرا ووجّه الكارت داخل الإطار.<br />بيانات الطالب ونتيجة الدفع هتظهر هنا.</p></div>}
          {state.flashMsg?.type === "success" && <div className={styles.success}><CircleCheck size={40} /><h2>تم تسجيل الدفع بنجاح</h2><p>ابعد الكارت وامسح كارت الطالب التالي.</p></div>}
        </div>
      </section>
    </div>
  </div>;
}
