import type {Student,Group,AttendanceRecord} from "@/lib/types";
export interface AttendanceMembership {student_id:string;group_id:string;grade_id?:string;starts_on:string;ends_on?:string|null}
export interface AttendanceContext {memberships:AttendanceMembership[];groups:Group[];sessions:{group_id:string;session_date:string;time:string;cancelled:boolean}[]}
export function contextGroups(current:Group[], context:AttendanceContext):Group[] {
 const groups=new Map(current.map(g=>[g.id,g]));
 for(const g of context.groups)groups.set(g.id,{...groups.get(g.id),...g});
 const sessions=new Map<string,AttendanceContext["sessions"]>();
 for(const s of context.sessions){const rows=sessions.get(s.group_id)||[];rows.push(s);sessions.set(s.group_id,rows);}
 return [...groups.values()].map(g=>{const rows=sessions.get(g.id)||[];return {...g,attendance_sessions:rows,cancelled_sessions:[...new Set([...(g.cancelled_sessions||[]),...rows.filter(s=>s.cancelled).map(s=>s.session_date)])]};});
}
export function studentsForPeriod(students:Student[],memberships:AttendanceMembership[],start:string,end:string,records:AttendanceRecord[]=[]):Student[]{
 const byStudent=new Map<string,AttendanceMembership[]>(),byRecord=new Map<string,AttendanceRecord[]>();
 for(const m of memberships){const rows=byStudent.get(m.student_id)||[];rows.push(m);byStudent.set(m.student_id,rows);}
 for(const r of records){const rows=byRecord.get(r.student_id)||[];rows.push(r);byRecord.set(r.student_id,rows);}
 const project=(s:Student):Student=>({...s,attendance_resolutions:Object.fromEntries((byRecord.get(s.id)||[]).filter(r=>r.group_id===s.group_id&&r.resolution).map(r=>[r.session_date,r.resolution!]))});
 return students.flatMap(student=>{
  const ownRecords=byRecord.get(student.id)||[];
  const history=(byStudent.get(student.id)||[]).sort((a,b)=>a.starts_on.localeCompare(b.starts_on)).map((m,index,all)=>{
    const next=all[index+1];
    if(!next || (m.ends_on && m.ends_on < next.starts_on)) return m;
    if(ownRecords.some(r=>r.group_id===m.group_id && r.session_date===next.starts_on && r.attendance_kind!=="guest" && r.attendance_kind!=="substitute")) return {...m,ends_on:next.starts_on};
    const previous=new Date(next.starts_on+"T12:00:00Z");previous.setUTCDate(previous.getUTCDate()-1);
    return {...m,ends_on:previous.toISOString().slice(0,10)};
  });
  if(!history.length){const joined=student.group_join_date||student.created_at?.slice(0,10);return joined&&joined>end?[]:[project(student)];}
  return history.filter(m=>m.starts_on<=end&&(!m.ends_on||m.ends_on>=start)&&(!m.ends_on||m.ends_on>=m.starts_on)).map(m=>project({...student,group_id:m.group_id,grade_id:m.grade_id||student.grade_id,group_join_date:m.starts_on,attendance_ends_on:m.ends_on||undefined,attendance_excluded_dates:ownRecords.filter(r=>r.group_id && r.group_id!==m.group_id && r.attendance_kind!=="guest"&&r.attendance_kind!=="substitute").map(r=>r.session_date)}));
 });
}
