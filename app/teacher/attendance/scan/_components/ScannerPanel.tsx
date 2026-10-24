"use client";
import { useEffect, useRef } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Volume2,
  VolumeX,
  X,
  LoaderCircle,
  Flashlight,
} from "lucide-react";
import type { CrossGroupConfirm, LastScan } from "../_hooks/useScanSession";
import styles from "../scan.module.css";
import {CrossGroupOptions,type CrossGroupChoice} from "./CrossGroupOptions";
interface Props {
  scanning: boolean;
  selectedGroupId: string;
  scannerDivId: string;
  lastScan: LastScan | null;
  crossGroupConfirm: CrossGroupConfirm | null;
  onConfirmCrossGroup: (choice?:CrossGroupChoice) => void;
  onCancelCrossGroup: () => void;
  busy?: string | null;
  queuedScans?: number;
  isStarting?: boolean;
  sessionReady?: boolean;
  soundEnabled?: boolean;
  soundReady?: boolean;
  onUnlockSound?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onDismiss?: () => void;
  onToggleSound?: () => void;
  cameraDevices?: { id: string; label: string }[];
  selectedCameraId?: string;
  onSwitchCamera?: (id: string) => void;
  torchSupported?: boolean;
  torchOn?: boolean;
  onToggleTorch?: () => void;
  zoomRange?: { min: number; max: number };
  zoom?: number;
  onZoom?: (value: number) => void;
}
export function ScannerPanel(p: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!p.crossGroupConfirm) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => previous?.focus?.();
  }, [p.crossGroupConfirm]);
  function handleKeys(event: React.KeyboardEvent) {
    if (event.key === "Escape" && !p.busy) p.onCancelCrossGroup();
    if (event.key !== "Tab") return;
    const buttons = Array.from(dialog.current?.querySelectorAll<HTMLElement>(
      "button:not(:disabled),select:not(:disabled),textarea:not(:disabled),input:not(:disabled),summary",
    ) || []).filter(element=>{
      for(let parent=element.parentElement;parent&&parent!==dialog.current;parent=parent.parentElement){
        if(parent.tagName==="DETAILS"&&!parent.hasAttribute("open")&&!(element.tagName==="SUMMARY"&&element.parentElement===parent))return false;
      }
      return true;
    });
    if (!buttons?.length) {
      event.preventDefault();
      return;
    }
    const first = buttons[0],
      last = buttons[buttons.length - 1];
    if(!dialog.current?.contains(document.activeElement)){event.preventDefault();first.focus();return;}
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  return (
    <section className={`${styles.cameraCard} ${p.crossGroupConfirm ? styles.cameraReview : ""}`} aria-label="ماسح حضور الطلاب">
      <div className={styles.cameraHeading}>
        <span>
          <ScanLine size={19} /> سكان الحضور
        </span>
        <button
          className={styles.iconButton}
          type="button"
          aria-label={p.soundEnabled ? "كتم صوت النجاح" : "تشغيل صوت النجاح"}
          aria-pressed={p.soundEnabled}
          onClick={p.onToggleSound}
        >
          {p.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
      <div className={`${styles.viewport} ${p.crossGroupConfirm ? styles.reviewViewport : ""}`}>
        <div id={p.scannerDivId} className={styles.reader} />
        {!p.scanning && (
          <div className={styles.cameraEmpty}>
            <ScanLine size={68} />
            <strong>
              {p.isStarting
                ? "جاري فتح الكاميرا…"
                : p.sessionReady
                  ? "جاهز لاستقبال الطلاب"
                  : "اختر جلسة صالحة أولًا"}
            </strong>
            <p>وجّه QR داخل الإطار. التسجيل تلقائي للطالب المسموح له.</p>
          </div>
        )}
        {p.scanning && !p.crossGroupConfirm && !p.lastScan && !p.busy && (
          <div className={styles.readyHint}>
            جاهز · وجّه بطاقة الطالب داخل الإطار
          </div>
        )}
        <div aria-live="polite" aria-atomic="true" className={styles.feedback}>
          {p.busy && !p.crossGroupConfirm && (
            <div className={styles.busy}>
              <LoaderCircle size={22} className={styles.spin} />
              <strong>{p.busy}</strong>
            </div>
          )}
          {p.lastScan && !p.crossGroupConfirm && (
            <div
              className={`${styles.result} ${p.lastScan.pending ? styles.pending : p.lastScan.success ? styles.success : p.lastScan.info ? styles.info : styles.error}`}
            >
              {p.lastScan.success ? (
                <CheckCircle2 size={27} />
              ) : (
                <AlertCircle size={27} />
              )}
              <div>
                <strong>
                  {p.lastScan.success
                    ? "تم التسجيل بنجاح"
                    : p.lastScan.pending
                      ? "لم يؤكد على الخادم بعد"
                      : p.lastScan.info
                        ? "معلومة"
                        : "تعذر التسجيل"}
                </strong>
                <p>{p.lastScan.name}</p>
              </div>
              <button
                className={styles.iconButton}
                type="button"
                aria-label="إخفاء الرسالة"
                onClick={p.onDismiss}
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>
        {p.crossGroupConfirm && (
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cross-group-title"
            aria-describedby="cross-group-reason"
            onKeyDown={handleKeys}
            className={styles.confirmation}
          >
            <CrossGroupOptions key={`${p.crossGroupConfirm.student.id}-${p.crossGroupConfirm.context.selectedGroupId}-${p.crossGroupConfirm.context.sessionDate}`} confirmation={p.crossGroupConfirm} busy={!!p.busy} onConfirm={p.onConfirmCrossGroup} onCancel={p.onCancelCrossGroup}/>
            {p.lastScan && <p role="alert" className={styles.warning}>{p.lastScan.name}</p>}
          </div>
        )}
      </div>
      <div className={styles.cameraControls}>
        <button
          className={p.scanning ? styles.secondary : styles.primary}
          disabled={
            !!p.busy ||
            !!p.crossGroupConfirm ||
            p.isStarting ||
            (!p.scanning && !p.sessionReady)
          }
          onClick={p.scanning ? p.onStop : p.onStart}
        >
          {p.scanning ? <CameraOff size={19} /> : <Camera size={19} />}{" "}
          {p.isStarting
            ? "جاري التشغيل…"
            : p.scanning
              ? "إيقاف الكاميرا"
              : "تشغيل الكاميرا"}
        </button>
        {p.scanning && p.torchSupported && (
          <button
            className={styles.iconButton}
            aria-label="فلاش الكاميرا"
            aria-pressed={p.torchOn}
            onClick={p.onToggleTorch}
          >
            <Flashlight size={20} />
          </button>
        )}
      </div>
      {p.scanning && (p.cameraDevices?.length || 0) > 1 && (
        <label className={styles.zoom}>
          الكاميرا
          <select
            aria-label="اختيار الكاميرا"
            value={p.selectedCameraId || ""}
            disabled={!!p.busy || !!p.crossGroupConfirm || p.isStarting}
            onChange={(e) => p.onSwitchCamera?.(e.target.value)}
          >
            <option value="">اختيار تلقائي</option>
            {p.cameraDevices?.map((device, index) => (
              <option key={device.id} value={device.id}>
                {device.label || `كاميرا ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      )}
      {p.scanning && p.zoomRange && (
        <label className={styles.zoom}>
          تقريب الكاميرا
          <input
            aria-label="تقريب الكاميرا"
            type="range"
            min={p.zoomRange.min}
            max={p.zoomRange.max}
            step="0.1"
            value={p.zoom}
            onChange={(e) => p.onZoom?.(Number(e.target.value))}
          />
        </label>
      )}
      {p.soundEnabled && !p.soundReady && (
        <button className={styles.textButton} onClick={p.onUnlockSound}>
          اضغط لتفعيل صوت النجاح
        </button>
      )}
      <p className={styles.cameraFoot} role="status">
        {p.crossGroupConfirm
          ? `بانتظار قرارك${p.queuedScans ? ` · ${p.queuedScans} بطاقة بالدور` : ""}`
          : p.queuedScans
            ? `${p.queuedScans} بطاقة في انتظار المعالجة`
            : "نتيجة التسجيل تظهر هنا · صوت النجاح للحضور المؤكد فقط"}
      </p>
    </section>
  );
}
