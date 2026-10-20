"use client";
import { CalendarDays, CheckCircle2, ChevronDown, Clock3, ReceiptText } from "lucide-react";
import { PaidEntry, ARABIC_MONTHS } from "./types";
import styles from "./paymentScan.module.css";

export function PaidList({ paidList }: { paidList: PaidEntry[] }) {
  return (
    <section aria-label="آخر عمليات الدفع" className={styles.history}>
      <header className={styles.historyHeader}>
        <span className={styles.headingIcon}><ReceiptText size={18} aria-hidden="true" /></span>
        <div className={styles.headingText}>
          <h3>آخر عمليات الدفع</h3>
          <p>آخر ٣٠ عملية مسجلة من سكان الدفع</p>
        </div>
        <span className={styles.count} aria-label={`${paidList.length} عملية`}>{paidList.length.toLocaleString("ar-EG")}</span>
      </header>
      {!paidList.length ? (
        <div className={styles.empty}>
          <ReceiptText size={28} aria-hidden="true" />
          <strong>لسه مفيش عمليات دفع</strong>
          <p>بعد تأكيد استلام الدفع، هتلاقي تفاصيل العملية هنا.</p>
        </div>
      ) : (
        <ul className={styles.receipts}>
          {paidList.map(entry => (
            <li key={entry.id} className={styles.receipt}>
              <div className={styles.receiptTop}>
                <div className={styles.student}>
                  <strong>{entry.name}</strong>
                  <span className={styles.studentCode}>كود الطالب <bdi>{entry.code || "—"}</bdi></span>
                </div>
                <div className={styles.amount}>
                  <span>المبلغ المسجل</span>
                  <strong>{entry.amount.toLocaleString("ar-EG")} <small>ج.م</small></strong>
                </div>
              </div>
              <div className={styles.months} aria-label="شهور الدفع">
                <CalendarDays size={14} aria-hidden="true" />
                {entry.months.map(m => <span key={`${m.year}-${m.month}`}>{ARABIC_MONTHS[m.month - 1]} {m.year}</span>)}
              </div>
              <div className={styles.receiptMeta}>
                <span className={styles.recorded}><CheckCircle2 size={13} aria-hidden="true" /> عملية مسجلة</span>
                <time dateTime={entry.created_at}>
                  <Clock3 size={13} aria-hidden="true" />
                  {new Date(entry.created_at).toLocaleString("ar-EG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </time>
              </div>
              <details className={styles.receiptDetails}>
                <summary><ReceiptText size={14} aria-hidden="true" /><span>رقم العملية</span><ChevronDown size={14} className={styles.chevron} aria-hidden="true" /></summary>
                <div className={styles.receiptNumber}><code dir="ltr">{entry.id}</code></div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
