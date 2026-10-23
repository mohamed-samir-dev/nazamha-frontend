/** @jest-environment jsdom */
import React,{act,useState} from 'react';
import {createRoot,Root} from 'react-dom/client';
import {StudentsFilters} from '@/app/teacher/students/_components/StudentsFilters';
import {matchesStudentSearch} from '@/lib/utils/studentSearch';
test.each(['TPC7-','TPC7-0003','tpc7–٠٠٠٣','\u200fTPC7-0003'])('newly added student matches the same center-code query %s',query=>expect(matchesStudentSearch({name:'أحمد محمد',center_student_code:'TPC7-0003'},query)).toBe(true));
let root:Root,host:HTMLDivElement;
const changed=jest.fn();
const props={grades:[],groups:[],studentGradeIds:new Set<string>(),hasCenterMode:false,subTeachers:[],filterGradeId:'all',filterSubTeacherId:'all',activeFilter:'all',onGradeChange:()=>{},onSubTeacherChange:()=>{},onGroupChange:()=>{},onApplyFilters:()=>{},onPrint:()=>{}};
function Harness(){const [value,setValue]=useState('TPC7-');return React.createElement(StudentsFilters,{...props,searchQuery:value,onSearchChange:(v:string)=>{changed(v);setValue(v);},searching:true});}
beforeEach(async()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;changed.mockClear();host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root.render(React.createElement(Harness)));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
test('search field preserves the dash, announces pending search and clears while retaining focus',async()=>{
 const field=host.querySelector<HTMLInputElement>('[role="searchbox"]')!;
 expect(field.value).toBe('TPC7-');expect(field.dir).toBe('auto');expect(field.getAttribute('aria-busy')).toBe('true');
 expect(host.textContent).toContain('جاري البحث');
 await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label="مسح البحث"]')!.click());
 expect(changed).toHaveBeenCalledWith('');expect(field.value).toBe('');expect(document.activeElement).toBe(field);
});
test('Escape clears the search without submitting a form',async()=>{
 const field=host.querySelector<HTMLInputElement>('[role="searchbox"]')!;
 await act(async()=>field.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 expect(field.value).toBe('');
});
