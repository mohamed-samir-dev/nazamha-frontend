"use client";
import type {Grade,Group} from "@/lib/types";
import {getTodayCairo} from "@/lib/utils/dateUtils";
import styles from "../scan.module.css";
interface Props {
 grades:Grade[];groups:Group[];selectedGradeId:string;selectedGroupId:string;sessionDate:string;validSessionDates:string[];
 scanning:boolean;isStarting:boolean;manualCode:string;manualPlaceholder:string;groupCode?:string|null;
 manualMsg?:{text:string;type:string}|null;sessionDateError?:string|null;autoDetected?:boolean;
 busy?:boolean;sessionReady?:boolean;
 onGradeChange:(value:string)=>void;onGroupChange:(value:string)=>void;onSessionDateChange:(value:string)=>void;
 onStartScanner:()=>void;onStopScanner:()=>void;onManualCodeChange:(value:string)=>void;onManualSubmit:(event:React.FormEvent)=>void;
}
export function SessionConfig(p:Props){
 const group=p.groups.find(g=>g.id===p.selectedGroupId),today=getTodayCairo();
 const start=group?.start_date || group?.created_at?.slice(0,10);
 return <section className={styles.card} aria-label="إعداد الجلسة والإدخال اليدوي">
  <details key={p.selectedGroupId || "empty"} open={!p.selectedGroupId || undefined} className={styles.settings}>
   <summary>إعدادات الجلسة <span>{p.autoDetected ? "تم اختيار حصة اليوم" : "تعديل المجموعة والتاريخ"}</span></summary>
   <div className={styles.fields}>
    <label htmlFor="scan-grade">السنة الدراسية</label>
    <select id="scan-grade" value={p.selectedGradeId} onChange={e=>p.onGradeChange(e.target.value)} disabled={p.busy}>
     <option value="">اختر السنة الدراسية</option>{p.grades.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
    </select>
    <label htmlFor="scan-group">المجموعة</label>
    <select id="scan-group" value={p.selectedGroupId} onChange={e=>p.onGroupChange(e.target.value)} disabled={!p.selectedGradeId || p.busy}>
     <option value="">اختر المجموعة</option>{p.groups.filter(g=>g.grade_id===p.selectedGradeId).map(g=><option key={g.id} value={g.id}>{g.name} · {g.day_of_week} · {g.time}</option>)}
    </select>
    <label htmlFor="scan-date">تاريخ الجلسة بتوقيت القاهرة</label>
    <select id="scan-date" value={p.validSessionDates.includes(p.sessionDate)?p.sessionDate:""} onChange={e=>p.onSessionDateChange(e.target.value)} disabled={!p.validSessionDates.length || p.busy}>
     {!p.validSessionDates.length && <option value="">لا توجد جلسة متاحة</option>}
     {[...p.validSessionDates].reverse().map(date=><option key={date} value={date}>{date===today ? "اليوم · " : "جلسة سابقة · "}{new Date(date+"T12:00:00Z").toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"Africa/Cairo"})}</option>)}
    </select>
    {p.selectedGroupId && !p.validSessionDates.length && <p className={styles.warning}>{start && start>today ? `المجموعة لم تبدأ بعد؛ موعد البداية ${start}` : "لا توجد حصص متاحة حتى اليوم في هذا الأسبوع والأسبوع السابق؛ راجع مواعيد المجموعة والحصص الملغاة."}</p>}
   </div>
  </details>
  <details className={styles.manual}>
   <summary>تسجيل بكود الطالب <span>بدون كاميرا</span></summary>
   <form onSubmit={p.onManualSubmit} className={styles.fields}>
    <label htmlFor="attendance-manual-code">كود الطالب الكامل أو QR</label>
    <p id="manual-help" className={styles.muted}>اكتب الكود كاملًا{p.groupCode ? `، أو رقمه المختصر داخل مجموعة ${p.groupCode}` : ""}. لن يُختار طالب إذا كان الكود مكررًا.</p>
    <div className={styles.manualRow}>
     <input id="attendance-manual-code" aria-describedby="manual-help" dir="ltr" autoComplete="off" spellCheck={false} placeholder={p.manualPlaceholder} value={p.manualCode} onChange={e=>p.onManualCodeChange(e.target.value)} disabled={!p.sessionReady || p.busy}/>
     <button className={styles.primary} type="submit" disabled={!p.sessionReady || p.busy || !p.manualCode.trim()}>{p.busy ? "انتظر…" : "تسجيل"}</button>
    </div>
   </form>
  </details>
 </section>;
}
