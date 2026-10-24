"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, LoaderCircle, X } from "lucide-react";
import { formatDateShort } from "../_utils/sessionDates";
import styles from "../attendance.module.css";
export type SessionState = "future" | "expired" | "active" | "cancelled";
interface Props {
  dateStr: string; state: SessionState; saving: boolean; groupId: string | null;
  isPastWeek: boolean; readOnly?: boolean;
  onMarkAll: (date: string, gid: string) => void; onClearSession: (date: string, gid: string) => void;
  onCancelSession: (gid: string, date: string, cancelled?: boolean) => void;
}
export function SessionHeaderCell(p: Props) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dialog.current?.showModal(); }, [open]);
  const canEdit = !p.isPastWeek && !p.readOnly && !p.saving && !!p.groupId;
  const canRecord = canEdit && (p.state === "active" || p.state === "expired");
  const close = () => { dialog.current?.close(); setOpen(false); };
  const run = (action: () => void) => { close(); action(); };
  return <th scope="col" className={styles.sessionHeader} data-state={p.state} data-date={p.dateStr}>
    <div><time dateTime={p.dateStr}>{formatDateShort(p.dateStr)}</time><small>{p.saving ? "جاري الحفظ" : p.state === "cancelled" ? "ملغاة" : p.state === "future" ? "قادمة" : p.state === "active" ? "اليوم" : "منتهية"}</small></div>
    <button type="button" className={styles.sessionMenuButton} aria-label={`إجراءات حصة ${p.dateStr}`} aria-haspopup="dialog" disabled={!canEdit} onClick={() => setOpen(true)} aria-busy={p.saving}>{p.saving ? <LoaderCircle size={17} className={styles.spin} /> : <MoreHorizontal size={19} />}</button>
    {open && createPortal(<dialog ref={dialog} className={styles.sessionDialog} aria-labelledby={`session-dialog-${p.groupId}-${p.dateStr}`} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className={styles.dialogHeading}><strong id={`session-dialog-${p.groupId}-${p.dateStr}`}>حصة {formatDateShort(p.dateStr)}</strong><button type="button" aria-label="إغلاق" onClick={close}><X size={18} /></button></div>
      <button type="button" disabled={!canRecord} onClick={() => run(() => p.onMarkAll(p.dateStr, p.groupId!))}>تحضير الكل</button>
      <button type="button" disabled={!canRecord} onClick={() => run(() => p.onClearSession(p.dateStr, p.groupId!))}>مسح الحضور</button>
      <button type="button" className={styles.dangerText} disabled={!canEdit} onClick={() => run(() => p.onCancelSession(p.groupId!, p.dateStr, p.state !== "cancelled"))}>{p.state === "cancelled" ? "استعادة الحصة" : "إلغاء الحصة"}</button>
    </dialog>, document.body)}
  </th>;
}
