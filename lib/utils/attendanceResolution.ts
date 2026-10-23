import type {AttendanceRecord} from "@/lib/types";

export function attendanceSlot(records:AttendanceRecord[],studentId:string,date:string,groupId?:string|null){
 return records.find(r=>r.student_id===studentId&&r.session_date===date&&(!groupId||!r.group_id||r.group_id===groupId)&&r.attendance_kind!=="guest"&&r.attendance_kind!=="substitute");
}
export function attendanceForDates(records:AttendanceRecord[],studentId:string,dates:string[],groupId?:string|null){
 const required=dates.filter(d=>!attendanceSlot(records,studentId,d,groupId)?.resolution);
 const present=required.filter(d=>attendanceSlot(records,studentId,d,groupId)?.status==="present").length;
 return {present,total:required.length,absent:required.length-present,percent:required.length?Math.round(present/required.length*100):0,compensated:dates.filter(d=>attendanceSlot(records,studentId,d,groupId)?.resolution==="compensated").length,exempt:dates.filter(d=>attendanceSlot(records,studentId,d,groupId)?.resolution==="exempt").length};
}
