/** @jest-environment jsdom */
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {useScanSound} from '@/app/teacher/attendance/scan/_hooks/useScanSound';
let audio:any,value:ReturnType<typeof useScanSound>;
async function mount(){const root=createRoot(document.createElement('div'));function C(){value=useScanSound();return null;}await act(async()=>root.render(React.createElement(C)));return ()=>act(async()=>root.unmount());}
beforeEach(()=>{
 localStorage.clear();(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 audio={state:'suspended',currentTime:0,destination:{},resume:jest.fn().mockImplementation(async()=>{audio.state='running';audio.onstatechange?.();}),close:jest.fn().mockResolvedValue(undefined),createOscillator:jest.fn(()=>({type:'',frequency:{value:0},connect:jest.fn(),start:jest.fn(),stop:jest.fn(),disconnect:jest.fn()})),createGain:jest.fn(()=>({gain:{setValueAtTime:jest.fn(),linearRampToValueAtTime:jest.fn(),exponentialRampToValueAtTime:jest.fn()},connect:jest.fn(),disconnect:jest.fn()}))};
 Object.defineProperty(window,'AudioContext',{configurable:true,value:jest.fn(()=>audio)});
});
afterEach(()=>jest.restoreAllMocks());
test('user starts audio, success produces two short tones, mute prevents them and persists',async()=>{
 const close=await mount();expect(audio.resume).not.toHaveBeenCalled();
 await act(async()=>value.unlockSound());expect(value.soundReady).toBe(true);
 await act(async()=>value.playSuccess());expect(audio.createOscillator).toHaveBeenCalledTimes(2);
 await act(async()=>value.toggleSound());expect(value.soundEnabled).toBe(false);expect(localStorage.getItem('attendance-scan-sound')).toBe('off');
 await act(async()=>value.playSuccess());expect(audio.createOscillator).toHaveBeenCalledTimes(2);await close();expect(audio.close).toHaveBeenCalled();
 const close2=await mount();expect(value.soundEnabled).toBe(false);await close2();
});
test('unsupported audio never prevents attendance',async()=>{
 Object.defineProperty(window,'AudioContext',{configurable:true,value:undefined});
 const close=await mount();expect(()=>value.unlockSound()).not.toThrow();expect(()=>value.playSuccess()).not.toThrow();await close();
});
