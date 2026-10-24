/** @jest-environment jsdom */
import React,{act} from "react";
import {createRoot} from "react-dom/client";
import {CrossGroupOptions} from "@/app/teacher/attendance/scan/_components/CrossGroupOptions";
import {SessionConfig} from "@/app/teacher/attendance/scan/_components/SessionConfig";
import {api} from "@/lib/apiClient";
import {attendanceForDates} from "@/lib/utils/attendanceResolution";
import {studentsForPeriod} from "@/lib/utils/attendancePeriod";
jest.mock("@/lib/apiClient",()=>({api:{get:jest.fn(),post:jest.fn()}}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
const option={date:"2026-10-24",time:"17:00",group_id:"a",group_name:"أ",subject:"فيزياء",status:"absent"};
const confirmation:any={student:{id:"s",name:"أحمد",code:"A-1"},context:{selectedGroupId:"b",sessionDate:"2026-10-26"},originalGroupName:"أ",originalGroupSchedule:"السبت",reason:"اختر",validation:{alreadyPresent:false,canRecord:true,destinationGroupName:"ب",actualLesson:{date:"2026-10-26",time:"17:00"},previous:[option],future:[{...option,date:"2026-10-31",status:"unrecorded"}]}};
async function mount(extra:any={}){const node=document.createElement("div");document.body.appendChild(node);const root=createRoot(node),confirm=jest.fn(),cancel=jest.fn();let props={confirmation,busy:false,onConfirm:confirm,onCancel:cancel,...extra};await act(async()=>root.render(React.createElement(CrossGroupOptions,props)));return {node,confirm,cancel,render:async(p:any)=>{props={...props,...p};await act(async()=>root.render(React.createElement(CrossGroupOptions,props)));},close:async()=>{await act(async()=>root.unmount());node.remove();}};}
const click=async(element:Element|null)=>{expect(element).not.toBeNull();await act(async()=>{(element as HTMLElement).click();});};
const button=(node:Element,text:string)=>Array.from(node.querySelectorAll("button")).find(b=>b.textContent===text)!;
async function select(node:Element,value:string){const input=node.querySelector("select")!;await act(async()=>{input.value=value;input.dispatchEvent(new Event("change",{bubbles:true}));});}
beforeEach(()=>{jest.clearAllMocks();(api.get as jest.Mock).mockResolvedValue({data:[],total:0});});
afterEach(()=>{document.body.innerHTML="";});

test("shows only the student's name, original/destination groups and registration choices",async()=>{
 const h=await mount();expect(h.node.textContent).toContain("أحمد");expect(h.node.textContent).toContain("مجموعته الأصلية");expect(h.node.textContent).toContain("هيحضر مع");expect(h.node.textContent).toContain("طريقة التسجيل");
 expect(h.node.querySelectorAll("input:checked")).toHaveLength(0);expect(button(h.node,"تأكيد الحضور").disabled).toBe(true);
 expect(h.node.querySelector("textarea")).toBeNull();expect(h.node.querySelector("details")).toBeNull();expect(h.node.textContent).not.toMatch(/سجل التعويض|ملاحظة|اعتمده|تاريخ العملية|بانتظار التسجيل/);expect(api.get).not.toHaveBeenCalled();expect(h.confirm).not.toHaveBeenCalled();await h.close();
});
test("guest attendance requires explicit selection and the confirmation button",async()=>{
 const h=await mount();await click(h.node.querySelectorAll("input")[0]);expect(h.confirm).not.toHaveBeenCalled();await click(button(h.node,"تأكيد الحضور"));expect(h.confirm).toHaveBeenCalledWith({action:"guest",target_date:undefined});await h.close();
});
test.each([[1,"compensate","2026-10-24"],[2,"exempt","2026-10-31"]])("action %s requires one explicitly selected eligible lesson",async(index,action,date)=>{
 const h=await mount();await click(h.node.querySelectorAll("input")[Number(index)]);expect(button(h.node,"تأكيد الحضور").disabled).toBe(true);expect((h.node.querySelector("select") as HTMLSelectElement).value).toBe("");await select(h.node,String(date));expect(h.confirm).not.toHaveBeenCalled();await click(button(h.node,"تأكيد الحضور"));expect(h.confirm).toHaveBeenCalledWith({action,target_date:date});await h.close();
});
test("unavailable methods stay disabled without displaying long explanations",async()=>{
 const h=await mount({confirmation:{...confirmation,validation:{...confirmation.validation,previous:[],future:[],previousUnavailable:"لا يوجد غياب مؤهل",futureUnavailable:"لا توجد حصة قادمة"}}});const inputs=h.node.querySelectorAll("input");expect(inputs[1].disabled).toBe(true);expect(inputs[2].disabled).toBe(true);expect(inputs[0].disabled).toBe(false);expect(inputs[1].closest("label")?.title).toBe("لا يوجد غياب مؤهل");expect(h.node.textContent).toContain("غير متاح");await h.close();
});
test("cancel performs no attendance or history request",async()=>{
 const h=await mount();await click(button(h.node,"إلغاء"));expect(h.cancel).toHaveBeenCalledTimes(1);expect(h.confirm).not.toHaveBeenCalled();expect(api.post).not.toHaveBeenCalled();expect(api.get).not.toHaveBeenCalled();await h.close();
});
test("pending confirmation prevents repeated submissions",async()=>{
 const h=await mount();await click(h.node.querySelectorAll("input")[0]);await h.render({busy:true});expect(button(h.node,"جاري الحفظ…").disabled).toBe(true);await click(button(h.node,"جاري الحفظ…"));expect(h.confirm).not.toHaveBeenCalled();await h.close();
});
test("unavailable attendance shows its status without registration choices",async()=>{
 const h=await mount({confirmation:{...confirmation,validation:{...confirmation.validation,canRecord:false,attendanceUnavailable:"الحصة غير مفتوحة"}}});expect(h.node.textContent).toContain("الحصة غير مفتوحة");expect(h.node.querySelectorAll('input[type="radio"]')).toHaveLength(0);expect(h.node.querySelector("details")).toBeNull();await h.close();
});
test("an already recorded student shows a short message and a close button",async()=>{
 const h=await mount({confirmation:{...confirmation,validation:{...confirmation.validation,alreadyPresent:true}}});expect(h.node.textContent).toContain("مسجل بالفعل");expect(h.node.querySelectorAll('input[type="radio"]')).toHaveLength(0);await click(button(h.node,"إغلاق"));expect(h.cancel).toHaveBeenCalledTimes(1);expect(h.confirm).not.toHaveBeenCalled();await h.close();
});
test("reporting excludes compensation/exemption from required denominator and ignores guest numerator",()=>{const rows:any=[{student_id:"s",group_id:"a",session_date:"2026-10-01",status:"present"},{student_id:"s",group_id:"a",session_date:"2026-10-02",status:"absent",resolution:"compensated"},{student_id:"s",group_id:"a",session_date:"2026-10-03",status:"absent",resolution:"exempt"},{student_id:"s",group_id:"b",session_date:"2026-10-04",status:"present",attendance_kind:"guest"}];expect(attendanceForDates(rows,"s",["2026-10-01","2026-10-02","2026-10-03","2026-10-04"],"a")).toEqual({present:1,absent:1,total:2,percent:50,compensated:1,exempt:1});});
test("same-day guest attendance never removes the student's required original group lesson",()=>{const projected=studentsForPeriod([{id:"s",name:"أحمد",group_id:"a"}],[{student_id:"s",group_id:"a",starts_on:"2026-01-01"}],"2026-10-01","2026-10-31",[{id:"x",student_id:"s",group_id:"b",session_date:"2026-10-04",month:10,year:2026,status:"present",attendance_kind:"guest"}]);expect(projected[0].attendance_excluded_dates).toEqual([]);});
test("session settings stay visible after selecting a group, changing the date and starting the camera",async()=>{
 const host=document.createElement("div"),root=createRoot(host);document.body.appendChild(host);
 const base:any={grades:[{id:"grade",name:"الثالث الثانوي"}],groups:[{id:"a",grade_id:"grade",name:"أ",day_of_week:"السبت",time:"17:00"}],selectedGradeId:"grade",selectedGroupId:"",sessionDate:"2026-10-24",validSessionDates:["2026-10-24"],scanning:false,isStarting:false,manualCode:"",manualPlaceholder:"الكود",onGradeChange:jest.fn(),onGroupChange:jest.fn(),onSessionDateChange:jest.fn(),onManualCodeChange:jest.fn(),onManualSubmit:jest.fn()};
 for(const change of [{},{selectedGroupId:"a"},{selectedGroupId:"a",sessionDate:"2026-10-17"},{selectedGroupId:"a",scanning:true}]){
   await act(async()=>root.render(React.createElement(SessionConfig,{...base,...change})));
   const select=host.querySelector("#scan-group")!;expect(select).not.toBeNull();expect(select.closest("details")).toBeNull();expect(host.textContent).toContain("إعدادات الجلسة");
 }
 await act(async()=>root.unmount());host.remove();
});
