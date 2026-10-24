/** @jest-environment jsdom */
import React,{act} from "react";
import {createRoot} from "react-dom/client";
import {AuthService} from "@/lib/services/authService";
import {GroupsService} from "@/lib/services/groupsService";
import {StudentsService} from "@/lib/services/studentsService";
import {GradesService} from "@/lib/services/gradesService";
import {AttendanceService} from "@/lib/services/attendanceService";
import {api} from "@/lib/apiClient";
import {OfflineCache} from "@/lib/offlineQueue";
import {useAttendanceData} from "@/app/teacher/attendance/_hooks/useAttendanceData";
import {useAttendanceReports} from "@/app/teacher/attendance/reports/_hooks/useAttendanceReports";
import {useScanSession} from "@/app/teacher/attendance/scan/_hooks/useScanSession";
import {findStudentByQR,getStudentQRValue} from "@/lib/utils/qrParser";
import {Html5Qrcode} from "html5-qrcode";
jest.mock("html5-qrcode",()=>({Html5Qrcode:jest.fn().mockImplementation(()=>({start:jest.fn(),stop:jest.fn().mockResolvedValue(undefined),clear:jest.fn()}))}));
jest.mock("next/navigation",()=>({useSearchParams:()=>new URLSearchParams()}));
jest.mock("@/lib/apiClient",()=>({api:{post:jest.fn(),get:jest.fn(),delete:jest.fn()}}));
jest.mock("@/lib/services/authService",()=>({AuthService:{getUser:jest.fn()}}));
jest.mock("@/lib/services/groupsService",()=>({GroupsService:{getGroupsByTeacherId:jest.fn()}}));
jest.mock("@/lib/services/studentsService",()=>({StudentsService:{getStudentsByTeacherId:jest.fn()}}));
jest.mock("@/lib/services/gradesService",()=>({GradesService:{getGradesByTeacherId:jest.fn()}}));
beforeEach(()=>{
 jest.useFakeTimers().setSystemTime(new Date("2026-10-23T12:00:00Z"));
 jest.clearAllMocks();localStorage.clear();Object.defineProperty(navigator,"onLine",{configurable:true,value:true});
 (globalThis as any).BroadcastChannel=class{onmessage:any;close(){}postMessage(){}};
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 jest.spyOn(window,"confirm").mockReturnValue(true);
 (api.get as jest.Mock).mockResolvedValue([]);
 jest.spyOn(AttendanceService,"getContext").mockResolvedValue({memberships:[],groups:[],sessions:[]});
 (AuthService.getUser as jest.Mock).mockResolvedValue({id:"t"});
 (GroupsService.getGroupsByTeacherId as jest.Mock).mockResolvedValue([{id:"g",name:"G",day_of_week:"الإثنين",time:"10:00",start_date:"2026-01-01"}]);
 (StudentsService.getStudentsByTeacherId as jest.Mock).mockResolvedValue([{id:"s",name:"S",code:"0001",group_id:"g",created_at:"2026-10-01T12:00:00Z"}]);
 (GradesService.getGradesByTeacherId as jest.Mock).mockResolvedValue([]);
});
afterEach(()=>{jest.restoreAllMocks();jest.useRealTimers();});
async function harness(hook:()=>any){const root=createRoot(document.createElement("div"));let value:any;function C(){value=hook();return null;}
 await act(async()=>root.render(React.createElement(C)));return {get value(){return value;},close:()=>act(async()=>root.unmount())};
}
test("initial boundary week reads both months and returning to current reloads",async()=>{
 jest.useFakeTimers().setSystemTime(new Date("2026-11-02T12:00:00Z"));
 const read=jest.spyOn(AttendanceService,"getAttendanceRecords").mockImplementation(async(month)=>[{id:String(month),student_id:"s",session_date:month===10?"2026-10-31":"2026-11-02",status:"present",month,year:2026}]);
 const h=await harness(useAttendanceData);expect(read.mock.calls.map(c=>c[0])).toEqual(expect.arrayContaining([10,11]));
 await act(async()=>h.value.setWeekOffset(-1));const count=read.mock.calls.length;
 await act(async()=>h.value.setWeekOffset(0));expect(read.mock.calls.length).toBeGreaterThan(count);expect(h.value.attendance.some((r:any)=>r.month===11)).toBe(true);await h.close();
});
test("reports count elapsed unrecorded sessions and request parent phone",async()=>{
 jest.useFakeTimers().setSystemTime(new Date("2026-10-23T12:00:00Z"));jest.spyOn(AttendanceService,"getAttendanceRecords").mockResolvedValue([]);
 const h=await harness(useAttendanceReports);expect(h.value.studentRows[0]).toMatchObject({total:3,present:0,absent:3});expect((StudentsService.getStudentsByTeacherId as jest.Mock).mock.calls[0][0]).toContain("parent_phone");await h.close();
});
test("reports exclude sessions before student creation",async()=>{
 jest.useFakeTimers().setSystemTime(new Date("2026-10-23T12:00:00Z"));jest.spyOn(AttendanceService,"getAttendanceRecords").mockResolvedValue([]);
 (StudentsService.getStudentsByTeacherId as jest.Mock).mockResolvedValue([{id:"s",name:"S",group_id:"g",created_at:"2026-10-20T12:00:00Z"}]);
 const h=await harness(useAttendanceReports);expect(h.value.studentRows[0].total).toBe(0);await h.close();
});
test("cross-group removal uses returned record ID",async()=>{
 (StudentsService.getStudentsByTeacherId as jest.Mock).mockResolvedValue([{id:"s",name:"S",code:"0001",group_id:"original"}]);
 (api.post as jest.Mock).mockResolvedValue({decision:"allow"});
 jest.spyOn(AttendanceService,"upsertAttendanceRecord").mockResolvedValue({state:"saved",record:{id:"saved-id"} as any});
 const del=jest.spyOn(AttendanceService,"deleteAttendanceRecord").mockResolvedValue();
 const h=await harness(useScanSession);await act(async()=>h.value.handleGroupChange("g"));await act(async()=>h.value.acknowledgePastDate());await act(async()=>h.value.setManualCode("0001"));
 await act(async()=>h.value.handleManualSubmit({preventDefault(){}}));expect(h.value.scannedToday).toHaveLength(1);
 await act(async()=>h.value.handleRemoveScanned("s"));expect(del).toHaveBeenCalledWith("saved-id");expect(h.value.scannedToday).toHaveLength(0);await h.close();
});
test("date change during preflight prevents save in either session",async()=>{
 (StudentsService.getStudentsByTeacherId as jest.Mock).mockResolvedValue([{id:"s",name:"S",code:"0001",group_id:"original"}]);
 const h=await harness(useScanSession);await act(async()=>h.value.handleGroupChange("g"));await act(async()=>h.value.acknowledgePastDate());await act(async()=>h.value.setManualCode("0001"));
 let resolve:any;(api.post as jest.Mock).mockImplementation(()=>new Promise(r=>resolve=r));const save=jest.spyOn(AttendanceService,"upsertAttendanceRecord");let pending:any;
 await act(async()=>{pending=h.value.handleManualSubmit({preventDefault(){}});});
 await act(async()=>h.value.handleSessionDateChange(h.value.validSessionDates.find((d:string)=>d!==h.value.sessionDate)));
 await act(async()=>{resolve({decision:"allow"});await pending;});expect(save).not.toHaveBeenCalled();await h.close();
});
test("late session response cannot overwrite the new session list",async()=>{
 const h=await harness(useScanSession),pending:any[]=[];(api.get as jest.Mock).mockImplementation(()=>new Promise(r=>pending.push(r)));
 await act(async()=>h.value.handleGroupChange("g"));await act(async()=>h.value.acknowledgePastDate());const date=h.value.sessionDate;
 await act(async()=>h.value.handleSessionDateChange(h.value.validSessionDates.find((d:string)=>d!==date)));expect(pending).toHaveLength(2);
 await act(async()=>pending[1]([{student_id:"new",student_name:"New",created_at:"2026-10-19T12:00:00Z"}]));
 await act(async()=>pending[0]([{student_id:"old",student_name:"Old",created_at:"2026-10-12T12:00:00Z"}]));expect(h.value.scannedToday[0].studentId).toBe("new");await h.close();
});
test("a session read started before saving cannot erase the newly saved student",async()=>{
 const h=await harness(useScanSession),pending:any[]=[];(api.get as jest.Mock).mockImplementation(()=>new Promise(r=>pending.push(r)));
 await act(async()=>h.value.handleGroupChange("g"));await act(async()=>h.value.acknowledgePastDate());await act(async()=>h.value.setManualCode("0001"));
 jest.spyOn(AttendanceService,"upsertAttendanceRecord").mockResolvedValue({state:"saved",record:{id:"saved-id"} as any});
 await act(async()=>h.value.handleManualSubmit({preventDefault(){}}));expect(h.value.scannedToday).toHaveLength(1);
 await act(async()=>pending[0]([]));expect(h.value.scannedToday).toHaveLength(1);expect(pending).toHaveLength(2);
 await act(async()=>pending[1]([{id:"saved-id",student_id:"s",student_name:"S",session_date:h.value.sessionDate,status:"present",created_at:"2026-10-19T12:00:00Z"}]));await h.close();
});
test("attendance cache retains unified center QR identity",async()=>{
 const student:any={id:"s",name:"S",code:"TPC-0001",group_id:"g",center_student_code:"CENTER-1",card_qr_token:"test-token"};
 (StudentsService.getStudentsByTeacherId as jest.Mock).mockResolvedValue([student]);jest.spyOn(AttendanceService,"getAttendanceRecords").mockResolvedValue([]);
 const h=await harness(useAttendanceData);expect((StudentsService.getStudentsByTeacherId as jest.Mock).mock.calls[0][0]).toContain("center_student_code");expect(findStudentByQR(OfflineCache.loadStudents(),getStudentQRValue(student))?.id).toBe("s");await h.close();
});
test("camera completing after stop is released and cannot reactivate scanner",async()=>{
 let resolve:any;const camera={start:jest.fn().mockImplementation(()=>new Promise(r=>resolve=r)),stop:jest.fn().mockResolvedValue(undefined),clear:jest.fn()};
 (Html5Qrcode as unknown as jest.Mock).mockImplementation(()=>camera);
 const h=await harness(useScanSession);await act(async()=>h.value.handleGroupChange("g"));await act(async()=>h.value.acknowledgePastDate());let starting:any;
 await act(async()=>{starting=h.value.startScanner();});expect(camera.start).toHaveBeenCalledWith({facingMode:"environment"},expect.objectContaining({fps:10}),expect.any(Function),expect.any(Function));
 await act(async()=>h.value.stopScanner());await act(async()=>{resolve();await starting;});expect(h.value.scanning).toBe(false);expect(camera.stop).toHaveBeenCalled();expect(camera.clear).toHaveBeenCalled();await h.close();
});
