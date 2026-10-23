"use client";
import {Suspense,useState} from "react";
import {ArrowRight,RefreshCw,Wifi,WifiOff} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Spinner} from "@/components/ui/Spinner";
import {SessionConfig} from "./_components/SessionConfig";
import {ScannedList} from "./_components/ScannedList";
import {ScannerPanel} from "./_components/ScannerPanel";
import {useScanSession} from "./_hooks/useScanSession";
import {useOnlineSync} from "./_hooks/useOnlineSync";
import {AttendanceQueue} from "@/lib/offlineQueue";
import {getTodayCairo} from "@/lib/utils/dateUtils";
import styles from "./scan.module.css";
function QRScanPageInner(){
 const s=useScanSession(),router=useRouter();
 const [syncToast,setSyncToast]=useState("");
 const online=useOnlineSync(count=>{if(count>0)setSyncToast(`تم تأكيد ${count} سجل على الخادم`);s.refreshSessionAttendance();});
 const group=s.groups.find(g=>g.id===s.selectedGroupId),grade=s.grades.find(g=>g.id===s.selectedGradeId);
 const past=s.sessionDate<getTodayCairo(),valid=s.validSessionDates.includes(s.sessionDate);
 const ready=!!group && valid && (!past || s.pastDateAcknowledged);
 const pending=AttendanceQueue.getAll().filter(r=>r.teacher_id===s.userId);
 const confirmed=s.scannedToday.filter(e=>!e.queued).length,queued=s.scannedToday.filter(e=>e.queued).length;
 async function exit(){if(s.busy || s.crossGroupConfirm){if(!window.confirm("هناك عملية أو تأكيد قيد المراجعة؛ مغادرة السكان؟")) return;}
 if(pending.length && !window.confirm("يوجد حضور معلق محفوظ على الجهاز؛ مغادرة السكان؟")) return;await s.stopScanner();router.push("/teacher/attendance");}
 if(s.loading)return <Spinner fullScreen/>;
 return <div className={styles.page} dir="rtl">
  <header className={styles.header}><div><Link href="/teacher/attendance">الحضور والغياب</Link><h1>سكان الحضور</h1><p>مسح سريع · تسجيل واضح · متابعة الجلسة</p></div><button className={styles.secondary} onClick={exit}><ArrowRight size={17}/> رجوع للحضور</button></header>
  {s.loadError && <div role="alert" className={styles.warning}>{s.loadError}<button className={styles.textButton} disabled={!!s.busy || !!s.crossGroupConfirm} onClick={s.retryLoad}>إعادة تحميل البيانات</button></div>}
  <div className={styles.sessionBar}><div><strong>{group?.name || "اختر المجموعة لبدء الحضور"}{grade ? ` · ${grade.name}` : ""}</strong><p>{valid ? `${past ? "جلسة سابقة" : "اليوم"} · ${s.sessionDate}` : "لا توجد جلسة محددة صالحة"}</p></div><div className={styles.status}><span className={styles.pill}>{online.isOnline ? <Wifi size={15}/> : <WifiOff size={15}/>} {online.isOnline ? "الشبكة متاحة" : "بدون إنترنت"}</span>{pending.length>0 && <span className={`${styles.pill} ${styles.amberText}`}>{pending.length} معلق على الجهاز</span>}</div></div>
  {past && valid && <div role="status" className={styles.warning}>أنت تسجل حضور جلسة سابقة بتاريخ <bdi>{s.sessionDate}</bdi>.{!s.pastDateAcknowledged ? <button className={styles.textButton} onClick={s.acknowledgePastDate}>موافق، التسجيل لهذا التاريخ</button> : " تم تأكيد اختيارك لهذا التاريخ."}</div>}
  {s.sessionDateError && <div role="alert" className={styles.warning}>{s.sessionDateError}<button className={styles.textButton} onClick={s.refreshSessionAttendance}>إعادة المحاولة</button></div>}
  <div className={styles.layout}>
   <div className={styles.main}>
    <div className={styles.cameraSection}><ScannerPanel scanning={s.scanning} selectedGroupId={s.selectedGroupId} scannerDivId={s.scannerDivId} lastScan={s.lastScan} crossGroupConfirm={s.crossGroupConfirm} onConfirmCrossGroup={s.handleConfirmCrossGroup} onCancelCrossGroup={s.handleCancelCrossGroup} busy={s.busy} queuedScans={s.queuedScans} isStarting={s.isStarting} sessionReady={ready} soundEnabled={s.soundEnabled} soundReady={s.soundReady} onUnlockSound={s.unlockSound} onToggleSound={s.toggleSound} onDismiss={s.dismissLastScan} onStart={async()=>{if(s.isStarting)return;s.setIsStarting(true);try{await s.startScanner();}finally{s.setIsStarting(false);}}} onStop={s.stopScanner} torchSupported={s.cameraTools.torch} torchOn={s.torchOn} onToggleTorch={s.toggleTorch} zoomRange={s.cameraTools.zoom} zoom={s.zoom} onZoom={s.setCameraZoom}/></div>
    <div className={`${styles.counters} ${styles.countsSection}`} aria-label="إحصائيات الجلسة"><div className={styles.counter}><strong className={styles.tealText}>{confirmed}</strong><span>حضور مؤكد</span><small>على الخادم</small></div><div className={styles.counter}><strong className={styles.amberText}>{queued}</strong><span>معلق للجلسة</span><small>على هذا الجهاز</small></div><div className={styles.counter}><strong>{s.remainingCount}</strong><span>لم يسجل بعد</span><small>{s.studentsReady ? "من طلاب المجموعة" : "جارٍ تحديث قائمة الطلاب"}</small></div></div>
   </div>
   <aside className={styles.aside}>
    <div className={styles.settingsCard}><SessionConfig grades={s.grades} groups={s.groups} selectedGradeId={s.selectedGradeId} selectedGroupId={s.selectedGroupId} sessionDate={s.sessionDate} validSessionDates={s.validSessionDates} scanning={s.scanning} isStarting={s.isStarting} manualCode={s.manualCode} manualPlaceholder={s.manualPlaceholder} groupCode={s.groupCode} autoDetected={s.autoDetected} busy={!!s.busy || !!s.crossGroupConfirm} sessionReady={ready && s.studentsReady} onGradeChange={s.handleGradeChange} onGroupChange={s.handleGroupChange} onSessionDateChange={s.handleSessionDateChange} onStartScanner={s.startScanner} onStopScanner={s.stopScanner} onManualCodeChange={s.setManualCode} onManualSubmit={s.handleManualSubmit}/></div>
    <div className={styles.listSection}><ScannedList entries={s.scannedToday} totalInGroup={s.groupStudentsCount} crossGroupCount={s.crossGroupCount} remainingCount={s.remainingCount} onRemove={s.handleRemoveScanned} students={s.students} groups={s.groups} deletingIds={s.deletingIds}/></div>
   </aside>
  </div>
  {(pending.length>0 || syncToast || online.syncError) && <section className={styles.card} aria-label="مزامنة الحضور"><details><summary>المعلق على هذا الجهاز · {pending.length}</summary><p className={styles.muted}>يشمل كل الجلسات. المعلق لا يُحتسب حضورًا مؤكدًا قبل موافقة الخادم.</p><button className={styles.secondary} disabled={!online.isOnline || online.syncing || !pending.length} onClick={()=>void online.syncQueue()}><RefreshCw size={16} className={online.syncing ? styles.spin : ""}/>{online.syncing ? "جاري المزامنة…" : "إعادة محاولة رفع المعلق"}</button>{pending.map(r=>{const student=s.students.find(st=>st.id===r.student_id),g=s.groups.find(gr=>gr.id===(r.scanner_group_id||r.group_id));return <div key={r._queueId || `${r.student_id}-${r.session_date}`} className={styles.pendingRow}><strong>{student?.name || "طالب غير متاح في البيانات الحالية"} · <bdi>{student?.code || r.student_id}</bdi></strong><span>{g?.name || "مجموعة غير متاحة"} · {r.scanner_session_date || r.session_date}</span>{r._error && <p>{r._error}</p>}<span className={styles.muted}>لإلغاء المعلق افتح جلسته ثم استخدم إلغاء الحضور من القائمة.</span></div>;})}</details>{online.syncError && <p role="alert" className={styles.warning}>{online.syncError}</p>}{syncToast && <p role="status" className={styles.tealText}>{syncToast}</p>}</section>}
 </div>;
}
export default function QRScanPage(){return <Suspense fallback={<Spinner fullScreen/>}><QRScanPageInner/></Suspense>;}
