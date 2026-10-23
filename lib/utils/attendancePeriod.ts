import type {Student,Group,AttendanceRecord} from "@/lib/types";
export interface AttendanceMembership {student_id:string;group_id:string;grade_id?:string;starts_on:string;ends_on?:string|null}
export interface AttendanceContext {memberships:AttendanceMembership[];groups:Group[];sessions:{group_id:string;session_date:string;time:string;cancelled:boolean}[]}
export function contextGroups(current:Group[], context:AttendanceContext):Group[] {
 return [...new Map([...context.groups,...current].map(g=>[g.id,g])).values()].map(g=>({...g,attendance_sessions:context.sessions.filter(s=>s.group_id===g.id),cancelled_sessions:[...new Set([...(g.cancelled_sessions||[]),...context.sessions.filter(s=>s.group_id===g.id&&s.cancelled).map(s=>s.session_date)])]}));
}
export function studentsForPeriod(students:Student[],memberships:AttendanceMembership[],start:string,end:string,records:AttendanceRecord[]=[]):Student[]{
 return students.flatMap(student=>{
  const history=memberships.filter(m=>m.student_id===student.id).sort((a,b)=>a.starts_on.localeCompare(b.starts_on)).map((m,index,all)=>{
    const next=all[index+1];
    if(!next || (m.ends_on && m.ends_on < next.starts_on)) return m;
    if(records.some(r=>r.student_id===student.id && r.group_id===m.group_id && r.session_date===next.starts_on)) return {...m,ends_on:next.starts_on};
    const previous=new Date(next.starts_on+"T12:00:00Z");previous.setUTCDate(previous.getUTCDate()-1);
    return {...m,ends_on:previous.toISOString().slice(0,10)};
  });
  if(!history.length)return [student];
  return history.filter(m=>m.starts_on<=end&&(!m.ends_on||m.ends_on>=start)&&(!m.ends_on||m.ends_on>=m.starts_on)).map(m=>({...student,group_id:m.group_id,grade_id:m.grade_id||student.grade_id,group_join_date:m.starts_on,attendance_ends_on:m.ends_on||undefined,attendance_excluded_dates:records.filter(r=>r.student_id===student.id && r.group_id && r.group_id!==m.group_id).map(r=>r.session_date)}));
 });
}
