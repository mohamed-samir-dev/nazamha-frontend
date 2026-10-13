import { Group } from "@/lib/types";
export function cairoClock(now = new Date()) {
 const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).formatToParts(now);
 const get = (key:string) => parts.find(p=>p.type===key)!.value;
 const date = get("year")+"-"+get("month")+"-"+get("day");
 const days=["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
 return {date, month:Number(get("month")),year:Number(get("year")), minutes:Number(get("hour"))*60+Number(get("minute")), day:days[new Date(date+"T12:00:00Z").getUTCDay()]};
}
export function todayGroups(groups:Group[], now:Date) {
 const clock=cairoClock(now);
 return groups.filter(g=>{
  if (!(g.day_of_week||"").split(/[,،]/).map(d=>d.trim()).includes(clock.day)) return false;
  if ((g.cancelled_sessions||[]).includes(clock.date)) return false;
  const start=(g.start_date||g.created_at||"").slice(0,10);
  if(start && start>clock.date) return false;
  if(!g.time) return true;
  const [h,m]=g.time.split(":").map(Number);
  return clock.minutes<=h*60+m+60;
 });
}
