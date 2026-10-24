"use client";
import {useEffect,useState} from "react";
import type {CrossGroupConfirm} from "../_hooks/useScanSession";
import {api} from "@/lib/apiClient";
import {AttendanceService} from "@/lib/services/attendanceService";
import styles from "../scan.module.css";

export interface CrossGroupChoice {action:"guest"|"compensate"|"exempt";target_date?:string;reason?:string}
interface HistoryRow {actual_group_name?:string;target_group_name?:string;id:string;actual_date:string;actual_group_id:string;target_date:string;kind:"compensate"|"exempt";state:"approved"|"revoked"|"review";active:boolean;approved_by:string;history:{at:string;action:string;reason:string}[]}
export function CrossGroupOptions({confirmation,busy,onConfirm,onCancel}:{confirmation:CrossGroupConfirm;busy:boolean;onConfirm:(choice:CrossGroupChoice)=>void;onCancel:()=>void}){
 const [action,setAction]=useState<CrossGroupChoice["action"]|"">(""),[target,setTarget]=useState(""),[reason,setReason]=useState(""),[review,setReview]=useState(false);
 const [history,setHistory]=useState<HistoryRow[]>([]),[historyError,setHistoryError]=useState(""),[historyLoading,setHistoryLoading]=useState(false),[historyRevision,setHistoryRevision]=useState(0),[page,setPage]=useState(1),[total,setTotal]=useState(0);
 const [reversing,setReversing]=useState<HistoryRow|null>(null),[reverseReason,setReverseReason]=useState(""),[reverseBusy,setReverseBusy]=useState(false),[message,setMessage]=useState("");
 const v=confirmation.validation,options=action==="compensate"?v?.previous||[]:v?.future||[];
 useEffect(()=>{
   let active=true;setHistoryLoading(true);setHistoryError("");
   void api.get<{data:HistoryRow[];total:number}>(`/attendance/substitutions?student_id=${confirmation.student.id}&page=${page}&limit=10`).then(result=>{if(!result||!Array.isArray(result.data))throw new Error("استجابة غير مكتملة");if(active){setHistory(rows=>page===1?result.data:[...rows,...result.data]);setTotal(result.total);}}).catch(()=>{if(active)setHistoryError("تعذر تحميل سجل التعويض؛ أعد المحاولة قبل التراجع عن أي عملية.");}).finally(()=>{if(active)setHistoryLoading(false);});
   return()=>{active=false;};
 },[confirmation.student.id,page,historyRevision]);
 const changeAction=(value:typeof action)=>{setAction(value);setTarget("");setReview(false);};
 const valid=!!action&&(action==="guest"||options.some(l=>l.date===target));
 const summary=action==="guest"?"سيسجل الطالب حاضرًا كضيف في الحصة الحالية فقط. لا تعويض ولا إعفاء لحصة أخرى.":action==="compensate"?`سيُسجل حضور فعلي في الحصة الحالية، ويُربط بغياب الحصة ${target} كتعويض. سيبقى الغياب الأصلي محفوظًا.`:`سيُسجل حضور فعلي في الحصة الحالية، ويُعفى الطالب من غياب الحصة ${target} فقط. لن يُسجل حاضرًا في الحصة القادمة.`;
 async function reverse(){
   if(!reversing||reverseReason.trim().length<3||reverseBusy)return;
   setReverseBusy(true);setMessage("");
   try{await AttendanceService.revokeSubstitution(reversing.id,reverseReason.trim());setHistory(rows=>rows.map(r=>r.id===reversing.id?{...r,state:"revoked",active:false}:r));setReversing(null);setReverseReason("");setMessage("تم التراجع عن التعويض أو الإعفاء. الحضور الفعلي في الحصة الحالية محفوظ.");}
   catch(e){setMessage(e instanceof Error?e.message:"تعذر التراجع؛ أعد تحميل السجل");}
   finally{setReverseBusy(false);}
 }
 return <>
  <div className={styles.confirmContent}>
   <h2 id="cross-group-title">الطالب من مجموعة أخرى</h2>
   <strong className={styles.studentName}>{confirmation.student.name}</strong>
   <span className={styles.muted}>{confirmation.student.code||confirmation.student.center_student_code}</span>
   <dl className={styles.identity}><div><dt>المجموعة الأصلية</dt><dd>{confirmation.originalGroupName}</dd></div><div><dt>الحصة الحالية</dt><dd>{v?.destinationGroupName||"المجموعة المختارة"} · <bdi>{v?.actualLesson?.date||confirmation.context.sessionDate} {v?.actualLesson?.time||""}</bdi></dd></div><div><dt>حالة الحضور الحالي</dt><dd>{v?.alreadyPresent?"مسجل بالفعل":"لم يسجل بعد"}</dd></div></dl>
   <p id="cross-group-reason">هذا الطالب مسجل في مجموعة مختلفة. اختر طريقة تسجيل الحضور. سيظل في مجموعته الأصلية.</p>
   {v?.attendanceUnavailable&&<p role="status" className={styles.warning}>{v.attendanceUnavailable}</p>}
   {!v?.alreadyPresent&&v?.canRecord!==false&&<>
    {!review?<fieldset disabled={busy||reverseBusy} className={styles.crossOptions}><legend>طريقة تسجيل الحضور</legend>
     <label><input type="radio" name="cross-group-action" checked={action==="guest"} onChange={()=>changeAction("guest")}/> تسجيل حضور كضيف فقط</label>
     <label><input type="radio" name="cross-group-action" checked={action==="compensate"} disabled={!v?.previous?.length} onChange={()=>changeAction("compensate")}/> تعويض حصة سابقة</label>{!v?.previous?.length&&<small>{v?.previousUnavailable||"لا يوجد غياب سابق مؤهل للتعويض."}</small>}
     <label><input type="radio" name="cross-group-action" checked={action==="exempt"} disabled={!v?.future?.length} onChange={()=>changeAction("exempt")}/> إعفاء حصة قادمة</label>{!v?.future?.length&&<small>{v?.futureUnavailable||"لا توجد حصة قادمة مؤهلة للإعفاء."}</small>}
     {(action==="compensate"||action==="exempt")&&<label>الحصة المحددة<select aria-label="الحصة المحددة للتعويض أو الإعفاء" value={target} onChange={e=>setTarget(e.target.value)}><option value="">اختر الحصة بنفسك</option>{options.map(l=><option key={`${l.group_id}-${l.date}`} value={l.date}>{l.date} · {l.time} · {l.group_name} · {l.subject} · {l.status==="absent"?"غائب":"لم تبدأ"}</option>)}</select></label>}
     <label>ملاحظة اختيارية<textarea maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label>
    </fieldset>:<div role="status" className={styles.warning}><strong>راجع قبل التأكيد</strong><p>{summary}</p>{reason&&<p>الملاحظة: {reason}</p>}</div>}
   </>}
   <details><summary>سجل التعويض والإعفاء لهذا الطالب</summary>
    {historyLoading&&<p role="status">جاري تحميل السجل…</p>}{historyError&&<p role="alert">{historyError}<button disabled={historyLoading} onClick={()=>setHistoryRevision(r=>r+1)}>إعادة تحميل السجل</button></p>}
    {!historyLoading&&!history.length&&!historyError&&<p>لا توجد عمليات تعويض أو إعفاء مسجلة.</p>}
    {history.map(row=><div key={row.id} className={styles.substitutionRow}><strong>{row.kind==="compensate"?"تعويض سابق":"إعفاء قادم"} · {row.state==="approved"?"معتمد":row.state==="review"?"يحتاج مراجعة — لا يؤثر في الغياب":"تم التراجع"}</strong><p>الحضور الفعلي: {row.actual_group_name} · <bdi>{row.actual_date}</bdi> · الحصة الأصلية: {row.target_group_name} · <bdi>{row.target_date}</bdi></p><small>اعتمده: {row.approved_by}</small><details><summary>تاريخ العملية</summary>{row.history.map((e,i)=><p key={i}>{new Date(e.at).toLocaleString("ar-EG",{timeZone:"Africa/Cairo"})} · {e.action==="approve"?"اعتماد":e.action==="reverse"?"تراجع":"مراجعة"} · {e.reason}</p>)}</details>{row.state!=="revoked"&&<button disabled={busy||reverseBusy} onClick={()=>{setReversing(row);setReverseReason("");setMessage("");}}>مراجعة والتراجع عن العملية</button>}</div>)}
    {history.length<total&&<button disabled={historyLoading} onClick={()=>setPage(p=>p+1)}>عرض عمليات أقدم</button>}
   </details>
   {reversing&&<div className={styles.warning}><strong>تأكيد التراجع</strong><p>سيُلغى أثر {reversing.kind==="compensate"?"التعويض":"الإعفاء"} عن الحصة {reversing.target_date}. سيبقى الحضور الفعلي بتاريخ {reversing.actual_date} محفوظًا.</p><label>سبب التراجع<textarea maxLength={500} value={reverseReason} disabled={reverseBusy} onChange={e=>setReverseReason(e.target.value)}/></label><button disabled={busy||reverseBusy||reverseReason.trim().length<3} onClick={()=>void reverse()}>{reverseBusy?"جاري التراجع…":"تأكيد التراجع"}</button><button disabled={reverseBusy} onClick={()=>setReversing(null)}>إبقاء العملية</button></div>}
   {message&&<p role="status" className={styles.warning}>{message}</p>}
  </div>
  <div className={styles.confirmActions}>
   <button className={styles.secondary} disabled={busy||reverseBusy} onClick={onCancel}>{v?.alreadyPresent?"إغلاق":"إلغاء"}</button>
   {!v?.alreadyPresent&&v?.canRecord!==false&&<>{review&&<button className={styles.secondary} disabled={busy||reverseBusy} onClick={()=>setReview(false)}>تعديل الاختيار</button>}<button className={styles.primary} disabled={busy||reverseBusy||!valid||!!reversing} onClick={()=>{if(!review){setReview(true);return;}if(action)onConfirm({action,target_date:action==="guest"?undefined:target,reason:reason.trim()||undefined});}}>{busy?"جاري الحفظ…":review?"تأكيد وحفظ الحضور":"مراجعة الاختيار"}</button></>}
  </div>
 </>;
}
