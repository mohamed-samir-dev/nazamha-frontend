/** @jest-environment jsdom */
import React,{act} from "react";
import {createRoot} from "react-dom/client";
import {api} from "@/lib/apiClient";
import {AttendanceRepository as repo} from "@/lib/repositories/attendanceRepository";
import {AttendanceQueue,OfflineCache} from "@/lib/offlineQueue";
import {AttendanceService} from "@/lib/services/attendanceService";
import {useAttendanceActions} from "@/app/teacher/attendance/_hooks/useAttendanceActions";
import {exportAttendancePrint} from "@/app/teacher/attendance/_utils/exportUtils";
import {printInPlace} from "@/lib/printInPlace";
import {studentsForPeriod} from "@/lib/utils/attendancePeriod";
import {getGroupSessionDates} from "@/app/teacher/attendance/_utils/sessionDates";
jest.mock("@/lib/apiClient",()=>({api:{post:jest.fn(),get:jest.fn(),delete:jest.fn()}}));
jest.mock("@/lib/printInPlace",()=>({printInPlace:jest.fn()}));
const date="2026-10-19";
const row:any={id:"saved",teacher_id:"t",student_id:"s",group_id:"g",session_date:date,status:"present",month:10,year:2026};
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();Object.defineProperty(navigator,"onLine",{configurable:true,value:true});jest.spyOn(window,"confirm").mockReturnValue(true);});
afterEach(()=>{jest.restoreAllMocks();});
test.each(["ليس لديك صلاحية","الجلسة ملغاة","تاريخ غير صالح"])("server rejection stays an error, never queued success: %s",async(message)=>{
 (api.post as jest.Mock).mockRejectedValue(new Error(message));await expect(repo.upsertAttendanceRecord(row)).rejects.toThrow(message);expect(AttendanceQueue.count()).toBe(0);
});
test("offline save explicitly returns queued",async()=>{
 Object.defineProperty(navigator,"onLine",{configurable:true,value:false});expect(await repo.upsertAttendanceRecord(row)).toEqual({state:"queued"});expect(AttendanceQueue.count()).toBe(1);
});
test("failed sync keeps the record and its error",async()=>{
 AttendanceQueue.add(row);(api.post as jest.Mock).mockRejectedValue(new Error("موقوف"));expect(await repo.syncQueue()).toBe(0);expect(AttendanceQueue.getAll()[0]._error).toBe("موقوف");
});
test("new scans during sync survive and overlapping sync shares one request",async()=>{
 AttendanceQueue.add(row);let resolve:any;(api.post as jest.Mock).mockImplementation(()=>new Promise(r=>resolve=r));
 const a=repo.syncQueue(),b=repo.syncQueue();AttendanceQueue.add({...row,student_id:"new"});resolve({data:[row],suspended_skipped:[]});
 expect(await a).toBe(1);expect(await b).toBe(1);expect(api.post).toHaveBeenCalledTimes(1);expect(AttendanceQueue.getAll().map(r=>r.student_id)).toEqual(["new"]);
});
test("pending attendance survives logout and is restored for its owner only",()=>{
 AttendanceQueue.add(row);AttendanceQueue.archive();AttendanceQueue.clear();AttendanceQueue.restore("other");expect(AttendanceQueue.count()).toBe(0);AttendanceQueue.restore("t");expect(AttendanceQueue.count()).toBe(1);
});
async function harness(initial:any[],students:any[]){
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;let rows=initial,actions:any;const toast=jest.fn(),root=createRoot(document.createElement("div"));
 function C(){actions=useAttendanceActions({userId:"t",attendance:rows,setAttendance:(next:any)=>{rows=typeof next==="function"?next(rows):next;},filteredStudents:students,showToast:toast,updateGroupLocally:jest.fn(),weekOffset:0});return null;}
 await act(async()=>root.render(React.createElement(C)));return {get rows(){return rows;},actions,toast,close:()=>act(async()=>root.unmount())};
}
test("one click converts absent to persisted present",async()=>{
 const del=jest.spyOn(AttendanceService,"deleteAttendanceRecord").mockResolvedValue();const add=jest.spyOn(AttendanceService,"addAttendanceRecord").mockResolvedValue(row);
 const h=await harness([{...row,status:"absent"}],[{id:"s",group_id:"g"}]);await act(async()=>h.actions.handleToggle({id:"s",group_id:"g"},date));
 expect(add).toHaveBeenCalled();expect(del).not.toHaveBeenCalled();expect(h.rows).toEqual([row]);await h.close();
});
test("bulk uses real records, excludes suspended student and removes old absent",async()=>{
 (api.post as jest.Mock).mockResolvedValue({data:[row],suspended_skipped:[]});
 const h=await harness([{...row,status:"absent"}],[{id:"s",group_id:"g"},{id:"stopped",group_id:"g",is_suspended:true}]);
 await act(async()=>h.actions.handleMarkAllSession(date,"g"));expect(h.rows).toEqual([row]);expect((api.post as jest.Mock).mock.calls[0][1].records).toHaveLength(1);await h.close();
});
test("partial clear reconciles successes without hiding failed record",async()=>{
 jest.spyOn(AttendanceService,"deleteAttendanceRecord").mockImplementation(async(id)=>{if(id==="fail")throw Error("network");});
 const failed={...row,id:"fail",student_id:"b"};const h=await harness([row,failed],[{id:"s",group_id:"g"},{id:"b",group_id:"g"}]);
 await act(async()=>h.actions.handleClearSession(date,"g"));expect(h.rows).toEqual([failed]);expect(h.toast).toHaveBeenCalledWith(expect.stringContaining("1"),"error");await h.close();
});
test("cancellation in group A does not remove group B print column",async()=>{
 jest.spyOn(AttendanceService,"getAttendanceRecords").mockResolvedValue([]);
 const groups:any=[{id:"a",name:"A",day_of_week:"الإثنين",start_date:"2026-01-01",cancelled_sessions:[date]},{id:"b",name:"B",day_of_week:"الإثنين",start_date:"2026-01-01",cancelled_sessions:[]}];
 await exportAttendancePrint([{id:"s",name:"Student",group_id:"b"}] as any,[],[],10,2026,"all",groups,new Set([date]));expect((printInPlace as jest.Mock).mock.calls[0][0].html).toContain("<th>19/10</th>");
});
test("attendance export awaits in-place printing and propagates its errors",async()=>{
 jest.spyOn(AttendanceService,"getAttendanceRecords").mockResolvedValue([]);
 const error=new Error("تعذر تجهيز الطباعة");
 (printInPlace as jest.Mock).mockRejectedValueOnce(error);
 await expect(exportAttendancePrint([] as any,[],[],10,2026,"all")).rejects.toBe(error);
 expect(printInPlace).toHaveBeenCalledWith({html:expect.stringContaining("كشف الحضور")});
});
test("historical memberships keep student in old roster and bound both periods",()=>{
 const students:any=[{id:"s",name:"S",group_id:"new"}];const memberships=[{student_id:"s",group_id:"old",starts_on:"2026-09-01",ends_on:"2026-10-10"},{student_id:"s",group_id:"new",starts_on:"2026-10-11",ends_on:null}];
 expect(studentsForPeriod(students,memberships,"2026-10-01","2026-10-31").map(s=>[s.group_id,s.group_join_date,s.attendance_ends_on])).toEqual([["old","2026-09-01","2026-10-10"],["new","2026-10-11",undefined]]);
});
test("transfer-day old attendance stays visible without counting a new-group absence",()=>{
 const students:any=[{id:"s",name:"S",group_id:"new"}];const memberships=[{student_id:"s",group_id:"old",starts_on:"2026-09-01",ends_on:"2026-10-11"},{student_id:"s",group_id:"new",starts_on:"2026-10-11",ends_on:null}];
 const rows=studentsForPeriod(students,memberships,"2026-10-01","2026-10-31",[{...row,group_id:"old",session_date:"2026-10-11"}]);
 expect(rows[0].attendance_ends_on).toBe("2026-10-11");expect(rows[1].attendance_excluded_dates).toContain("2026-10-11");
});
test("frozen past schedule survives changing weekday without dropping older legacy months",()=>{
 const group:any={id:"g",day_of_week:"الثلاثاء",start_date:"2026-01-01",attendance_sessions:[{session_date:"2026-10-12",time:"10:00",cancelled:false},{session_date:"2026-10-19",time:"10:00",cancelled:false}]};
 const dates=getGroupSessionDates(group,10,2026);expect(dates).toContain("2026-10-12");expect(dates).not.toContain("2026-10-13");expect(dates).toContain("2026-10-27");expect(getGroupSessionDates(group,9,2026).length).toBeGreaterThan(0);
});
