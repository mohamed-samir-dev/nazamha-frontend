/** @jest-environment jsdom */
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {useOnlineSync} from '@/app/teacher/attendance/scan/_hooks/useOnlineSync';
import {AttendanceQueue} from '@/lib/offlineQueue';
import {AttendanceRepository} from '@/lib/repositories/attendanceRepository';
let value:ReturnType<typeof useOnlineSync>;
const record:any={teacher_id:'t',student_id:'s',group_id:'g',session_date:'2026-10-23',month:10,year:2026,status:'present'};
async function mount(onSynced=jest.fn()){const root=createRoot(document.createElement('div'));function C(){value=useOnlineSync(onSynced);return null;}await act(async()=>root.render(React.createElement(C)));return ()=>act(async()=>root.unmount());}
beforeEach(()=>{localStorage.clear();(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;Object.defineProperty(navigator,'onLine',{configurable:true,value:false});AttendanceQueue.add(record);});
afterEach(()=>jest.restoreAllMocks());
test('reconnect triggers one sync despite repeated events, then refreshes confirmed attendance',async()=>{
 let resolve:any;const sync=jest.spyOn(AttendanceRepository,'syncQueue').mockImplementation(()=>new Promise(r=>resolve=r)),done=jest.fn();
 const close=await mount(done);expect(sync).not.toHaveBeenCalled();
 Object.defineProperty(navigator,'onLine',{configurable:true,value:true});
 await act(async()=>{window.dispatchEvent(new Event('online'));window.dispatchEvent(new Event('online'));});expect(sync).toHaveBeenCalledTimes(1);expect(value.syncing).toBe(true);
 await act(async()=>{AttendanceQueue.clear();resolve(1);});expect(done).toHaveBeenCalledWith(1);expect(value.pendingCount).toBe(0);expect(value.syncing).toBe(false);await close();
});
test('sync exception retains pending records and provides a retryable error',async()=>{
 const sync=jest.spyOn(AttendanceRepository,'syncQueue').mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(0);
 const close=await mount();await act(async()=>value.syncQueue());expect(value.syncError).toBeTruthy();expect(value.pendingCount).toBe(1);expect(AttendanceQueue.count()).toBe(1);
 await act(async()=>value.syncQueue());expect(sync).toHaveBeenCalledTimes(2);expect(value.syncError).toBeNull();await close();
});
test('server-rejected pending entries remain visible with error, never confirmed',async()=>{
 jest.spyOn(AttendanceRepository,'syncQueue').mockImplementation(async()=>{AttendanceQueue.reject(AttendanceQueue.getAll()[0],'موقوف');return 0;});
 const done=jest.fn(),close=await mount(done);await act(async()=>value.syncQueue());expect(value.pendingCount).toBe(1);expect(value.syncError).toContain('لم تُقبل');expect(done).toHaveBeenCalledWith(0);await close();
});
