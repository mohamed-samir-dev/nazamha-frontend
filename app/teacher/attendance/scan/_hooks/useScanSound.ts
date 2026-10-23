"use client";
import {useCallback,useEffect,useRef,useState} from "react";

export function useScanSound(){
  const [soundEnabled,setSoundEnabled]=useState(true);
  const enabled=useRef(true),context=useRef<AudioContext|null>(null);
  useEffect(()=>{try {enabled.current=localStorage.getItem("attendance-scan-sound")!=="off";setSoundEnabled(enabled.current);}catch{} return ()=>{void context.current?.close().catch(()=>{});};},[]);
  const unlockSound=useCallback(()=>{
    if(!enabled.current) return;
    try {
      const Constructor=window.AudioContext || (window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
      if(!Constructor) return;
      if(!context.current || context.current.state==="closed") context.current=new Constructor();
      void context.current.resume().catch(()=>{});
    }catch { /* Sound must never interrupt attendance. */ }
  },[]);
  const playSuccess=useCallback(()=>{
    if(!enabled.current) return;
    const audio=context.current;if(!audio || audio.state!=="running") return;
    try {
      [740,988].forEach((frequency,index)=>{
        const oscillator=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+index*0.1;
        oscillator.type="sine";oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(0.13,start+0.012);gain.gain.exponentialRampToValueAtTime(0.001,start+0.13);
        oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(start);oscillator.stop(start+0.15);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      });
    }catch{}
  },[]);
  const toggleSound=useCallback(()=>{
    enabled.current=!enabled.current;setSoundEnabled(enabled.current);
    try {localStorage.setItem("attendance-scan-sound",enabled.current?"on":"off");}catch{}
    if(enabled.current) unlockSound();
  },[unlockSound]);
  return {soundEnabled,toggleSound,unlockSound,playSuccess};
}
