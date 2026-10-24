"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

const months=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
interface Props { month:number;year:number;onClose:()=>void;onReport:(month:number,year:number)=>Promise<void>; }
export function AttendanceReportModal(p:Props){
  const [month,setMonth]=useState(p.month),[year,setYear]=useState(p.year);
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  const pending=useRef(false),dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{dialog.current?.showModal();},[]);
  const close=()=>{if(!pending.current){dialog.current?.close();p.onClose();}};
  async function report(){
    if(pending.current)return;
    if(!Number.isInteger(year)||year<2000||year>2100){setError("اختر سنة صحيحة");return;}
    pending.current=true;setBusy(true);setError("");
    try{await p.onReport(month,year);}catch(e){setError(e instanceof Error?e.message:"تعذر عرض التقرير");}
    finally{pending.current=false;setBusy(false);}
  }
  return <dialog ref={dialog} className="modal-content" aria-labelledby="attendance-report-title" style={{maxWidth:380,margin:"auto",padding:"1.5rem",color:"var(--text-primary)"}} onCancel={e=>{e.preventDefault();close();}}>
    <h3 id="attendance-report-title" className="mb-4">تقرير الحضور</h3>
    <div className="flex gap-3 mb-4">
      <label className="flex-1 min-w-0 text-sm" htmlFor="attendance-report-month">الشهر<select id="attendance-report-month" className="form-input mt-1" value={month} disabled={busy} onChange={e=>setMonth(Number(e.target.value))}>{months.map((name,i)=><option key={name} value={i+1}>{name}</option>)}</select></label>
      <label className="flex-1 min-w-0 text-sm" htmlFor="attendance-report-year">السنة<input id="attendance-report-year" className="form-input mt-1" type="number" min={2000} max={2100} value={year} disabled={busy} onChange={e=>setYear(Number(e.target.value))}/></label>
    </div>
    {error&&<p role="alert" className="text-red-400 text-sm mb-3">{error}</p>}
    <div className="flex gap-3"><button type="button" className="btn btn-primary flex-1 justify-center" disabled={busy} onClick={()=>void report()}>{busy?<><LoaderCircle size={15} className="animate-spin"/>جاري التجهيز</>:"عرض التقرير"}</button><button type="button" className="btn btn-secondary flex-1 justify-center" disabled={busy} onClick={close}>إغلاق</button></div>
  </dialog>;
}
