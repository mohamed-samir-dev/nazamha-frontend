"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/lib/DashboardContext";
import { cairoClock, todayGroups } from "@/lib/dashboardUtils";
import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/lib/apiClient";
import type { UnpaidStudent } from "./reports/_components/UnpaidStudentsModal";
import { UnpaidStudentsModal } from "./reports/_components/UnpaidStudentsModal";
import { FINANCIAL_CHANGED } from "@/lib/financialEvents";
import { QuickActions } from "./_components/QuickActions";
import { StatsGrid } from "./_components/StatsGrid";
import { TodaySessions } from "./_components/TodaySessions";
import { RecentActivity } from "./_components/RecentActivity";
import { DashboardBanner } from "./_components/DashboardBanner";
const arabicMonths=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
export default function DashboardOverview() {
 const router=useRouter();
 const {data, loading, refresh, updatedAt}=useDashboard();
 const [refreshing,setRefreshing]=useState(false);
 const [showUnpaidModal,setShowUnpaidModal]=useState(false);
 const [unpaidRows,setUnpaidRows]=useState<UnpaidStudent[]>([]);
 const [unpaidLoading,setUnpaidLoading]=useState(false);
 const [unpaidError,setUnpaidError]=useState<string|null>(null);
 const [unpaidPage,setUnpaidPage]=useState(1);
 const [unpaidRetry,setUnpaidRetry]=useState(0);
 const [unpaidTotal,setUnpaidTotal]=useState(0);
 const [toast,setToast]=useState<{message:string;type:"success"|"error"}|null>(null);
 const [now,setNow]=useState(()=>new Date());
 const lastAttempt=useRef(0);
 const clock=cairoClock(now);
 const period=clock.year+"-"+clock.month;
 const previousPeriod=useRef(period);
 useEffect(()=>{if(previousPeriod.current!==period){previousPeriod.current=period;void refresh().catch(()=>{});}},[period,refresh]);
 useEffect(()=>{
   if(!showUnpaidModal || !data?.totals) return;
   let cancelled=false;setUnpaidLoading(true);setUnpaidError(null);
   api.get<{students:UnpaidStudent[];total:number}>(`/dashboard/payments?unpaid=1&month=${clock.month}&year=${clock.year}&page=${unpaidPage}`)
     .then(result=>{if(!cancelled){setUnpaidRows(rows=>unpaidPage===1?result.students:[...rows,...result.students]);setUnpaidTotal(result.total);}})
     .catch(()=>{if(!cancelled)setUnpaidError("تعذر تحميل الطلاب، أعد فتح القائمة للمحاولة");})
     .finally(()=>{if(!cancelled)setUnpaidLoading(false);});
   return()=>{cancelled=true;};
 },[showUnpaidModal,unpaidPage,unpaidRetry,clock.month,clock.year,Boolean(data?.totals)]);
 const currentMonthName=arabicMonths[clock.month-1];
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60_000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{
   let timer:ReturnType<typeof setTimeout>;
   const update=()=>{lastAttempt.current=Date.now();void refresh().catch(()=>{});};
   const focus=()=>{if(document.visibilityState==="visible" && Date.now()-Math.max(updatedAt,lastAttempt.current)>=60_000) update();};
   const financial=()=>{clearTimeout(timer);timer=setTimeout(update,100);};
   window.addEventListener("focus",focus);document.addEventListener("visibilitychange",focus);window.addEventListener(FINANCIAL_CHANGED,financial);
   return()=>{clearTimeout(timer);window.removeEventListener("focus",focus);document.removeEventListener("visibilitychange",focus);window.removeEventListener(FINANCIAL_CHANGED,financial);};
 },[refresh,updatedAt]);
 const handleRefresh=useCallback(async()=>{setRefreshing(true);try{await refresh();setToast({message:"تم تحديث البيانات بنجاح.",type:"success"})}catch{setToast({message:"حدث خطأ أثناء التحديث.",type:"error"})}finally{setRefreshing(false)}},[refresh]);
 const summary=useMemo(()=>{
   const students=data?.students||[], groups=data?.groups||[], grades=data?.grades||[];
   const studentIds=new Set(students.map(s=>s.id));
   const subs=(data?.subscriptions||[]).filter(s=>s.month===clock.month&&s.year===clock.year&&studentIds.has(s.student_id));
   const paid=new Set(subs.filter(s=>s.status==="paid"||s.status==="exempt").map(s=>s.student_id));
   const due=new Set(subs.filter(s=>s.status==="due").map(s=>s.student_id));
   const groupMap=new Map(groups.map(g=>[g.id,g]));const gradeMap=new Map(grades.map(g=>[g.id,g]));
   return {paid:paid.size,due:due.size,unpaid:students.filter(s=>due.has(s.id)).map(s=>({id:s.id,name:s.name,code:s.code,groupName:groupMap.get(s.group_id||"")?.name,gradeName:gradeMap.get(s.grade_id||groupMap.get(s.group_id||"")?.grade_id||"")?.name}))};
 },[data,clock.month,clock.year]);
 const groups=data?.groups||[],students=data?.students||[],attendance=data?.attendance||[];
 const sessions=useMemo(()=>todayGroups(data?.groups||[],now),[data,now]);
 const banner=data?.teacher.banner;
 const hasAttendance=data?.teacher.has_attendance_feature!==false;
 const totalBooksDelivered=data?.totalBooksDelivered||0;
 const paidThisMonth=data?.totals?.paid ?? summary.paid,unpaidCount=data?.totals?.due ?? summary.due,unpaidStudents=data?.totals ? unpaidRows : summary.unpaid;
 if(loading) return <Spinner fullScreen/>;
 return <div>
  {banner?.enabled && banner.message && <DashboardBanner message={banner.message} type={banner.type}/>}
  <div className="flex items-center justify-between flex-wrap gap-4 mb-7 pb-5 border-b border-white/8">
   <div><h1 className="text-[1.75rem] font-bold mb-1 bg-linear-to-l from-slate-400 to-white bg-clip-text text-transparent">لوحة التحكم</h1><p className="text-sm text-slate-500">نظرة عامة وإدارة المجموعات التعليمية</p></div>
   <button type="button" onClick={handleRefresh} disabled={refreshing} className="btn btn-secondary disabled:opacity-60" aria-busy={refreshing}>{refreshing ? "جاري التحديث…" : "تحديث"}</button>
  </div>
  <QuickActions hasAttendance={hasAttendance} onAddStudent={()=>router.push("/teacher/students?action=new")}/>
  <StatsGrid totalStudents={data?.totals?.totalStudents ?? students.length} paidThisMonth={paidThisMonth} totalGroups={groups.length} totalBooksDelivered={totalBooksDelivered} currentMonthName={currentMonthName} unpaidCount={unpaidCount} onUnpaidClick={()=>{setUnpaidRows([]);setUnpaidPage(1);setUnpaidTotal(0);setUnpaidLoading(true);setShowUnpaidModal(true);}}/>
  <div className="mt-8"><p className="text-sm font-semibold text-slate-400 mb-4">مجموعات اليوم ({sessions.length})</p><TodaySessions groups={sessions} students={students} hasAttendance={hasAttendance} todayArabic={clock.day}/></div>
  <div className="mt-6"><RecentActivity groups={groups} attendance={attendance}/></div>
  {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
  <UnpaidStudentsModal isOpen={showUnpaidModal} onClose={()=>setShowUnpaidModal(false)} students={unpaidStudents} loading={Boolean(data?.totals) && unpaidLoading} error={unpaidError} hasMore={unpaidRows.length<unpaidTotal} onLoadMore={()=>{if(unpaidError)setUnpaidRetry(value=>value+1);else setUnpaidPage(page=>page+1);}} currentMonthName={currentMonthName}/>
 </div>;
}
