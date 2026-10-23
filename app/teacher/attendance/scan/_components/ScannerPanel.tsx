"use client";
import {useEffect,useRef} from "react";
import {Camera,CameraOff,CheckCircle2,AlertCircle,ScanLine,Volume2,VolumeX,X,LoaderCircle,Flashlight} from "lucide-react";
import type {CrossGroupConfirm,LastScan} from "../_hooks/useScanSession";
import styles from "../scan.module.css";
interface Props {
 scanning:boolean;selectedGroupId:string;scannerDivId:string;lastScan:LastScan|null;crossGroupConfirm:CrossGroupConfirm|null;
 onConfirmCrossGroup:()=>void;onCancelCrossGroup:()=>void;
 busy?:string|null;queuedScans?:number;isStarting?:boolean;sessionReady?:boolean;soundEnabled?:boolean;
 onStart?:()=>void;onStop?:()=>void;onDismiss?:()=>void;onToggleSound?:()=>void;
 torchSupported?:boolean;torchOn?:boolean;onToggleTorch?:()=>void;zoomRange?:{min:number;max:number};zoom?:number;onZoom?:(value:number)=>void;
}
export function ScannerPanel(p:Props){
 const dialog=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!p.crossGroupConfirm) return;
  const previous=document.activeElement as HTMLElement|null;
  dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
  return ()=>previous?.focus?.();
 },[p.crossGroupConfirm]);
 function handleKeys(event:React.KeyboardEvent){
  if(event.key==="Escape" && !p.busy) p.onCancelCrossGroup();
  if(event.key!=="Tab") return;
  const buttons=dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
  if(!buttons?.length) {event.preventDefault();return;}
  const first=buttons[0],last=buttons[buttons.length-1];
  if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
 }
 return <section className={styles.cameraCard} aria-label="ماسح حضور الطلاب">
  <div className={styles.cameraHeading}><span><ScanLine size={19}/> سكان الحضور</span><button className={styles.iconButton} type="button" aria-label={p.soundEnabled ? "كتم صوت النجاح" : "تشغيل صوت النجاح"} aria-pressed={p.soundEnabled} onClick={p.onToggleSound}>{p.soundEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}</button></div>
  <div className={styles.viewport}>
   <div id={p.scannerDivId} className={styles.reader}/>
   {!p.scanning && <div className={styles.cameraEmpty}><ScanLine size={68}/><strong>{p.isStarting ? "جاري فتح الكاميرا…" : p.sessionReady ? "جاهز لاستقبال الطلاب" : "اختر جلسة صالحة أولًا"}</strong><p>وجّه QR داخل الإطار. التسجيل تلقائي للطالب المسموح له.</p></div>}
   {p.scanning && !p.crossGroupConfirm && !p.lastScan && !p.busy && <div className={styles.readyHint}>جاهز · وجّه بطاقة الطالب داخل الإطار</div>}
   <div aria-live="polite" aria-atomic="true" className={styles.feedback}>
    {p.busy && !p.crossGroupConfirm && <div className={styles.busy}><LoaderCircle size={22} className={styles.spin}/><strong>{p.busy}</strong></div>}
    {p.lastScan && !p.crossGroupConfirm && <div className={`${styles.result} ${p.lastScan.pending ? styles.pending : p.lastScan.success ? styles.success : p.lastScan.info ? styles.info : styles.error}`}>
     {p.lastScan.success ? <CheckCircle2 size={27}/> : <AlertCircle size={27}/>}
     <div><strong>{p.lastScan.success ? "تم التسجيل بنجاح" : p.lastScan.pending ? "لم يؤكد على الخادم بعد" : p.lastScan.info ? "معلومة" : "تعذر التسجيل"}</strong><p>{p.lastScan.name}</p></div>
     <button className={styles.iconButton} type="button" aria-label="إخفاء الرسالة" onClick={p.onDismiss}><X size={20}/></button>
    </div>}
   </div>
   {p.crossGroupConfirm && <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="cross-group-title" aria-describedby="cross-group-reason" onKeyDown={handleKeys} className={styles.confirmation}>
    <div className={styles.confirmHeader}><AlertCircle size={24}/><h2 id="cross-group-title">الطالب من مجموعة أخرى</h2></div>
    <strong className={styles.studentName}>{p.crossGroupConfirm.student.name}</strong>
    <span dir="ltr" className={styles.muted}>{p.crossGroupConfirm.student.code || p.crossGroupConfirm.student.center_student_code}</span>
    <dl className={styles.identity}><div><dt>مجموعته الأصلية</dt><dd>{p.crossGroupConfirm.originalGroupName}</dd></div><div><dt>موعد المجموعة</dt><dd>{p.crossGroupConfirm.originalGroupSchedule}</dd></div>{p.crossGroupConfirm.nextScheduledDate && <div><dt>الحصة المحتسب عليها الحضور</dt><dd>{p.crossGroupConfirm.nextScheduledDate}</dd></div>}</dl>
    <p id="cross-group-reason">{p.crossGroupConfirm.reason}</p>
    <p className={styles.muted}>المسح متوقف لحين إتمام قرار هذا الطالب.</p>
    {p.lastScan && <p role="alert" className={styles.warning}>{p.lastScan.name}</p>}
    <div className={styles.confirmActions}><button className={styles.secondary} disabled={!!p.busy} onClick={p.onCancelCrossGroup}>إلغاء</button><button className={styles.primary} disabled={!!p.busy} onClick={p.onConfirmCrossGroup}>{p.busy ? "جاري التسجيل…" : "تأكيد الحضور"}</button></div>
   </div>}
  </div>
  <div className={styles.cameraControls}>
   <button className={p.scanning ? styles.secondary : styles.primary} disabled={!!p.busy || !!p.crossGroupConfirm || p.isStarting || (!p.scanning && !p.sessionReady)} onClick={p.scanning ? p.onStop : p.onStart}>{p.scanning ? <CameraOff size={19}/> : <Camera size={19}/>} {p.isStarting ? "جاري التشغيل…" : p.scanning ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}</button>
   {p.scanning && p.torchSupported && <button className={styles.iconButton} aria-label="فلاش الكاميرا" aria-pressed={p.torchOn} onClick={p.onToggleTorch}><Flashlight size={20}/></button>}
  </div>
  {p.scanning && p.zoomRange && <label className={styles.zoom}>تقريب الكاميرا<input aria-label="تقريب الكاميرا" type="range" min={p.zoomRange.min} max={p.zoomRange.max} step="0.1" value={p.zoom} onChange={e=>p.onZoom?.(Number(e.target.value))}/></label>}
  <p className={styles.cameraFoot} role="status">{p.crossGroupConfirm ? "بانتظار قرارك" : p.queuedScans ? `${p.queuedScans} بطاقة في انتظار المعالجة` : "نتيجة التسجيل تظهر هنا · صوت النجاح للحضور المؤكد فقط"}</p>
 </section>;
}
