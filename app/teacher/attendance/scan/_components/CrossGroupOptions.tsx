"use client";

import {useState} from "react";
import {UsersRound,History,CalendarCheck2,ArrowLeftRight} from "lucide-react";
import type {CrossGroupConfirm} from "../_hooks/useScanSession";
import styles from "../scan.module.css";

export interface CrossGroupChoice {
  action:"guest"|"compensate"|"exempt";
  target_date?:string;
  reason?:string;
}

interface Props {
  confirmation:CrossGroupConfirm;
  busy:boolean;
  onConfirm:(choice:CrossGroupChoice)=>void;
  onCancel:()=>void;
}

export function CrossGroupOptions({confirmation,busy,onConfirm,onCancel}:Props){
  const [action,setAction]=useState<CrossGroupChoice["action"]|"">("");
  const [target,setTarget]=useState("");
  const validation=confirmation.validation;
  const options=action==="compensate"?validation?.previous||[]:validation?.future||[];
  const canRecord=!validation?.alreadyPresent&&validation?.canRecord!==false;
  const valid=!!action&&(action==="guest"||options.some(lesson=>lesson.date===target));
  const choices=[
    {value:"guest" as const,title:"حضور كضيف",Icon:UsersRound,available:true,unavailable:""},
    {value:"compensate" as const,title:"تعويض حصة سابقة",Icon:History,available:!!validation?.previous?.length,unavailable:validation?.previousUnavailable||"لا يوجد غياب سابق للتعويض"},
    {value:"exempt" as const,title:"إعفاء حصة قادمة",Icon:CalendarCheck2,available:!!validation?.future?.length,unavailable:validation?.futureUnavailable||"لا توجد حصة قادمة للإعفاء"},
  ];

  return <>
    <div className={styles.confirmContent}>
      <div className={styles.crossHeading}>
        <span className={styles.crossHeadingIcon}><ArrowLeftRight size={18} aria-hidden="true"/></span>
        <div className={styles.crossHeadingText}>
          <h2 id="cross-group-title">الطالب من مجموعة أخرى</h2>
          <strong className={styles.studentName}>{confirmation.student.name}</strong>
        </div>
      </div>
      <dl id="cross-group-reason" className={styles.identity}>
        <div><dt>مجموعته الأصلية</dt><dd>{confirmation.originalGroupName}</dd></div>
        <div><dt>هيحضر مع</dt><dd>{validation?.destinationGroupName||"المجموعة المختارة"}</dd></div>
      </dl>
      {validation?.attendanceUnavailable&&<p role="status" className={styles.warning}>{validation.attendanceUnavailable}</p>}
      {validation?.alreadyPresent&&<p role="status" className={styles.crossRecorded}>مسجل بالفعل في المجموعة دي</p>}
      {canRecord&&<fieldset disabled={busy} className={styles.crossOptions}>
        <legend>طريقة التسجيل</legend>
        {choices.map(({value,title,Icon,available,unavailable})=><label
          key={value}
          title={available?undefined:unavailable}
          className={`${styles.crossChoice} ${action===value?styles.crossChoiceSelected:""} ${!available?styles.crossChoiceUnavailable:""}`}>
          <input type="radio" name="cross-group-action" checked={action===value} disabled={!available}
            onChange={()=>{setAction(value);setTarget("");}}/>
          <span className={styles.crossChoiceIcon}><Icon size={18} aria-hidden="true"/></span>
          <span className={styles.crossChoiceText}><strong>{title}</strong></span>
          {!available&&<span className={styles.crossUnavailableTag}>غير متاح</span>}
        </label>)}
        {(action==="compensate"||action==="exempt")&&<label className={styles.crossField}>
          <span>الحصة</span>
          <select aria-label="الحصة المحددة للتعويض أو الإعفاء" value={target} onChange={event=>setTarget(event.target.value)}>
            <option value="">اختر الحصة</option>
            {options.map(lesson=><option key={`${lesson.group_id}-${lesson.date}`} value={lesson.date}>{lesson.date} · {lesson.time}</option>)}
          </select>
        </label>}
      </fieldset>}
    </div>
    <div className={styles.confirmActions}>
      <button type="button" className={styles.secondary} disabled={busy} onClick={onCancel}>{canRecord?"إلغاء":"إغلاق"}</button>
      {canRecord&&<button type="button" className={styles.primary} disabled={busy||!valid}
        onClick={()=>{if(!busy&&valid&&action)onConfirm({action,target_date:action==="guest"?undefined:target});}}>
        {busy?"جاري الحفظ…":"تأكيد الحضور"}
      </button>}
    </div>
  </>;
}
