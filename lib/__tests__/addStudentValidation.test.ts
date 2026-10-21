/** @jest-environment jsdom */
import React, {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {AddStudentForm} from '@/app/teacher/students/_components/AddStudentForm';
jest.mock('@/app/teacher/students/_components/FamilyMatchBox',()=>({FamilyMatchBox:()=>null}));
jest.mock('@/app/teacher/students/_components/BulkImportModal',()=>({BulkImportModal:()=>null}));
jest.mock('@/lib/services/studentsService',()=>({StudentsService:{lookupFamily:jest.fn().mockResolvedValue({family:null})}}));
let host: HTMLDivElement, root: Root;
const submit=jest.fn();
beforeEach(async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  submit.mockReset(); submit.mockResolvedValue(true);
  host=document.createElement('div'); document.body.append(host); root=createRoot(host);
  await act(async()=>root.render(React.createElement(AddStudentForm,{grades:[{id:'grade',name:'الأولى'}] as any,groupsProp:[],hasCenterMode:false,subTeachers:[],isLoading:false,onSubmit:submit,onBulkDone:()=>{}})));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
async function input(selector:string,value:string){
  const field=host.querySelector<HTMLInputElement>(selector)!;
  await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(field,value);field.dispatchEvent(new Event('input',{bubbles:true}));});
}
async function send(){await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));}
test('name and phone errors appear while editing, before submitting',async()=>{
  await input('input[placeholder="الاسم الكامل للطالب"]','محمد123');
  expect(host.textContent).toContain('اسم الطالب يجب'); expect(submit).not.toHaveBeenCalled();
  await input('input[placeholder="الاسم الكامل للطالب"]','محمد أحمد');
  expect(host.textContent).not.toContain('اسم الطالب يجب');
  await input('input[type="tel"]','123'); expect(host.textContent).toContain('11 رقمًا');
  await input('input[type="tel"]','01012345678'); expect(host.textContent).not.toContain('11 رقمًا');
});
test('missing grade and invalid year block requests and show field errors',async()=>{
  await input('input[placeholder="الاسم الكامل للطالب"]','محمد أحمد');
  await input('input[type="number"]','1900'); expect(host.textContent).toContain('2020 إلى 2040');
  await send(); expect(submit).not.toHaveBeenCalled(); expect(host.textContent).toContain('اختر السنة الدراسية أولًا');
});
test('server validation remains visible inside the form and retains entered values',async()=>{
  await input('input[placeholder="الاسم الكامل للطالب"]','محمد أحمد');
  await act(async()=>{const grade=host.querySelector<HTMLSelectElement>('#new-student-grade')!;grade.value='grade';grade.dispatchEvent(new Event('change',{bubbles:true}));});
  submit.mockResolvedValue({error:'الطالب مسجل بالفعل'});
  await send(); expect(host.textContent).toContain('الطالب مسجل بالفعل');
  expect(host.querySelector<HTMLInputElement>('input[placeholder="الاسم الكامل للطالب"]')!.value).toBe('محمد أحمد');
});
