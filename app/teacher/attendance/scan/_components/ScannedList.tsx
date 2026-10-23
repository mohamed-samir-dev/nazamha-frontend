"use client";
import {useMemo,useState} from "react";
import {Trash2,Search,LoaderCircle} from "lucide-react";
import type {ScannedEntry,Student,Group} from "@/lib/types";
import {matchesStudentSearch} from "@/lib/utils/studentSearch";
import styles from "../scan.module.css";
interface Props {entries:ScannedEntry[];totalInGroup:number;crossGroupCount:number;onRemove:(id:string)=>void;students?:Student[];groups?:Group[];deletingIds?:string[];remainingCount?:number}
export function ScannedList(p:Props){
 const [search,setSearch]=useState(""),[limit,setLimit]=useState(30);
 const map=useMemo(()=>new Map(p.students?.map(s=>[s.id,s])),[p.students]);
 const groups=useMemo(()=>new Map(p.groups?.map(g=>[g.id,g.name])),[p.groups]);
 const entries=useMemo(()=>p.entries.filter(e=>matchesStudentSearch(map.get(e.studentId)||{name:e.studentName},search)),[p.entries,map,search]);
 return <section className={styles.card}>
  <details open className={styles.listDetails}><summary>حضور الجلسة <span>{p.entries.filter(e=>!e.queued).length} مؤكد · {p.entries.filter(e=>e.queued).length} معلق</span></summary>
   <p className={styles.muted}>سجلات الجلسة على الخادم ومعها المعلق على هذا الجهاز · من مجموعات أخرى: {p.crossGroupCount}</p>
   <label className={styles.search}><Search size={17}/><input aria-label="بحث في حضور الجلسة" placeholder="بحث بالاسم أو الكود" value={search} onChange={e=>{setSearch(e.target.value);setLimit(30);}}/></label>
   <div className={styles.attendanceList}>{entries.slice(0,limit).map(entry=>{const student=map.get(entry.studentId);const deleting=p.deletingIds?.includes(entry.studentId);return <div key={entry.studentId} className={styles.attendanceRow}>
    <div className={styles.entryIdentity}><strong>{entry.studentName}</strong><span><bdi>{student?.code || student?.center_student_code || "—"}</bdi> · {groups.get(student?.group_id||"") || "مجموعة غير متاحة"}</span><span className={entry.queued ? styles.amberText : styles.tealText}>{entry.queued ? "معلق على الجهاز" : "مؤكد على الخادم"} · {entry.time}</span></div>
    <button className={styles.iconButton} disabled={deleting} onClick={()=>p.onRemove(entry.studentId)} aria-label={`إلغاء حضور ${entry.studentName}`} title="إلغاء الحضور مع التأكيد">{deleting ? <LoaderCircle size={18} className={styles.spin}/> : <Trash2 size={18}/>}</button>
   </div>;})}</div>
   {!entries.length && <p className={styles.empty}>{search ? "لا توجد نتائج مطابقة" : "لم يسجل حضور بعد في هذه الجلسة"}</p>}
   {entries.length>limit && <button className={styles.secondary} onClick={()=>setLimit(v=>v+30)}>عرض المزيد ({entries.length-limit})</button>}
  </details>
 </section>;
}
