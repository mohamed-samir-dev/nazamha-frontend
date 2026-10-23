"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import type {Html5Qrcode} from "html5-qrcode";
import {api} from "@/lib/apiClient";
import {AuthService} from "@/lib/services/authService";
import {GroupsService} from "@/lib/services/groupsService";
import {StudentsService} from "@/lib/services/studentsService";
import {AttendanceRepository} from "@/lib/repositories/attendanceRepository";
import {AttendanceQueue,OfflineCache} from "@/lib/offlineQueue";
import type {AttendanceRecord,Group,Student} from "@/lib/types";
import {getTodayCairo} from "@/lib/utils/dateUtils";
import {matchesStudentSearch} from "@/lib/utils/studentSearch";
import {findStudentByQR,getStudentQRValue} from "@/lib/utils/qrParser";
import {cameraScanConfig,isCameraConstraintError} from "@/lib/cameraScanConfig";
import {getCameraErrorMessage} from "@/lib/errors";
import {QRModal} from "../../_components/QRModal";
import {ScannerPanel} from "./ScannerPanel";
import {useScanSound} from "../_hooks/useScanSound";
import {useOnlineSync} from "../_hooks/useOnlineSync";
import type {LastScan} from "../_hooks/useScanSession";
import styles from "../lessons.module.css";

interface Lesson {id:string;teacher_id:string;group_id:string;title:string;session_date:string;time:string;kind:"regular"|"extra";state:"scheduled"|"open"|"closed"|"cancelled";opens_at:string;closes_at:string;grace_minutes:number;roster:string[];version:number;events:{action:string;at:string;actor_type:string;reason:string}[]}
type Row=AttendanceRecord & {student_name?:string;student_code?:string};
interface Details {lesson:Lesson;records:Row[];audit:Row[];waiting:{id:string;name:string;code?:string}[];summary:{present:number;late:number;waiting:number;absent:number;unverified:number;finalized:boolean;cancelled:boolean}}
interface Operation {student:Student;raw?:string;source:"qr"|"manual";confirmed?:boolean;credit?:string;correction?:boolean}
const label:Record<string,string>={scheduled:"لم تُفتح",open:"مفتوحة",closed:"مغلقة",cancelled:"ملغاة",qr:"QR",manual:"يدوي",offline:"مزامنة / وقت غير مؤكد",correction:"تصحيح",bulk:"جماعي",automatic:"تلقائي",late:"متأخر",on_time:"في الموعد",unverified:"وقت غير مؤكد",mark:"تسجيل",correct:"تصحيح",void:"إلغاء"};
const errorText=(e:unknown)=>e instanceof Error?e.message:"تعذر تنفيذ العملية";
const clock=(date?:string|null)=>date?new Date(date).toLocaleTimeString("ar-EG",{timeZone:"Africa/Cairo",hour:"2-digit",minute:"2-digit"}):"—";

export function LessonAttendance(){
 const [groups,setGroups]=useState<Group[]>([]),[students,setStudents]=useState<Student[]>([]),[lessons,setLessons]=useState<Lesson[]>([]),[userId,setUserId]=useState("");
 const [selected,setSelected]=useState(""),[details,setDetails]=useState<Details|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState<string|null>(null),[loading,setLoading]=useState(true);
 const [search,setSearch]=useState(""),[listSearch,setListSearch]=useState(""),[tab,setTab]=useState("present"),[hold,setHold]=useState<Operation|null>(null),[credit,setCredit]=useState("");
 const [last,setLast]=useState<LastScan|null>(null),[recent,setRecent]=useState<{text:string;at:string;source:string}[]>([]),[debt,setDebt]=useState<{student:Student;amount:number;months:number}|null>(null),[qrStudent,setQrStudent]=useState<Student|null>(null);
 const [scanning,setScanning]=useState(false),[starting,setStarting]=useState(false),[waitingCards,setWaitingCards]=useState(0),[cameraId,setCameraId]=useState(""),[devices,setDevices]=useState<{id:string;label:string}[]>([]),[torch,setTorch]=useState(false),[torchSupported,setTorchSupported]=useState(false);
 const [form,setForm]=useState({group_id:"",session_date:getTodayCairo(),time:"17:00",kind:"regular",title:"",grace_minutes:10,early_minutes:15,duration_minutes:120});
 const scanner=useRef<Html5Qrcode|null>(null),cameraGeneration=useRef(0),startPromise=useRef<Promise<void>|null>(null),alive=useRef(true),lock=useRef(false),holdRef=useRef<Operation|null>(null),queue=useRef<string[]>([]),cooldown=useRef(new Map<string,number>()),epoch=useRef(0);
 const current=useRef({details,students,userId});current.current={details,students,userId};
 const sound=useScanSound();
 const cacheKey=(owner:string)=>`ot_lesson_view:${owner}`;
 const refresh=useCallback(async()=>{
   const id=current.current.details?.lesson.id;
   if(!id || !navigator.onLine)return;
   const token=epoch.current;
   try{const data=await api.get<Details>(`/attendance/lessons/${id}`);if(alive.current&&token===epoch.current){setDetails(data);current.current.details=data;setError("");localStorage.setItem(cacheKey(current.current.userId),JSON.stringify(data));}}
   catch(e){if(alive.current&&token===epoch.current)setError(errorText(e));}
 },[]);
 const online=useOnlineSync(()=>{void refresh();});
 const notify=useCallback((text:string,success=false,pending=false,info=false,source="")=>{
   setLast({name:text,success,pending,info});setRecent(rows=>[{text,at:new Date().toISOString(),source},...rows].slice(0,5));if(success)sound.playSuccess();
 },[sound.playSuccess]);
 const stop=useCallback(async()=>{
   ++cameraGeneration.current;
   const pending=startPromise.current;if(pending)await pending.catch(()=>{});
   const instance=scanner.current;scanner.current=null;
   if(instance){try{if(instance.isScanning)await instance.stop();instance.clear();}catch{}}
   if(alive.current){setScanning(false);setTorch(false);setTorchSupported(false);}
 },[]);
 useEffect(()=>{
   alive.current=true;let active=true;
   const reset=()=>{++epoch.current;queue.current=[];holdRef.current=null;setHold(null);setDetails(null);setLessons([]);setStudents([]);setUserId("");void stop();};
   window.addEventListener("account-cache-cleared",reset);
   void (async()=>{try{
     const user=await AuthService.getUser();if(!active)return;
     const uid=user?.id || OfflineCache.loadTeacher()?.id;if(!uid)throw new Error("يرجى تسجيل الدخول");setUserId(uid);current.current.userId=uid;
     if(!navigator.onLine){const cached=JSON.parse(localStorage.getItem(cacheKey(uid))||"null") as Details|null;if(cached){setDetails(cached);setSelected(cached.lesson.id);setLessons([cached.lesson]);}setStudents(OfflineCache.loadStudents());setGroups(OfflineCache.loadGroups());setError("بيانات محفوظة على هذا الجهاز؛ التسجيل سيظل معلقًا حتى يتحقق الخادم.");return;}
     const result=await Promise.all([GroupsService.getGroupsByTeacherId(),StudentsService.getStudentsByTeacherId("id,name,code,center_student_code,group_id,grade_id,is_suspended,suspended_until,suspension_reason"),api.get<Lesson[]>("/attendance/lessons")]);
     if(!active)return;setGroups(result[0]);setStudents(result[1]);setLessons(result[2]);OfflineCache.saveStudents(result[1]);OfflineCache.saveGroups(result[0]);
     const params=new URLSearchParams(window.location.search),requested=params.get("lesson");
     if(requested&&result[2].some(l=>l.id===requested))setSelected(requested);
     const group=params.get("group");if(group&&result[0].some(g=>g.id===group))setForm(f=>({...f,group_id:group,time:result[0].find(g=>g.id===group)?.time||f.time}));
   }catch(e){if(active)setError(errorText(e));}finally{if(active)setLoading(false);}})();
   const hide=()=>{if(document.hidden)void stop();};document.addEventListener("visibilitychange",hide);
   return()=>{active=false;alive.current=false;++epoch.current;queue.current=[];void stop();window.removeEventListener("account-cache-cleared",reset);document.removeEventListener("visibilitychange",hide);};
 },[stop]);
 useEffect(()=>{
   if(!selected || !userId)return;let active=true;const token=++epoch.current;queue.current=[];setWaitingCards(0);holdRef.current=null;setHold(null);setDebt(null);setLast(null);setRecent([]);current.current.details=null;setDetails(null);void stop();
   if(!navigator.onLine){try{const cached=JSON.parse(localStorage.getItem(cacheKey(userId))||"null");if(cached?.lesson.id===selected){setDetails(cached);current.current.details=cached;}}catch{}return;}
   void api.get<Details>(`/attendance/lessons/${selected}`).then(data=>{if(active&&token===epoch.current){setDetails(data);current.current.details=data;localStorage.setItem(cacheKey(userId),JSON.stringify(data));setError("");}}).catch(e=>{if(active)setError(errorText(e));});
   return()=>{active=false;};
 },[selected,userId,stop]);
 useEffect(()=>{
   const poll=setInterval(()=>{if(!document.hidden&&!lock.current&&!holdRef.current)void refresh();},15000);
   const changed=()=>void refresh();window.addEventListener("focus",changed);
   const channel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("attendance"):null;if(channel)channel.onmessage=changed;
   return()=>{clearInterval(poll);window.removeEventListener("focus",changed);channel?.close();};
 },[refresh]);
 const checkDebt=async(student:Student)=>{
   if(!navigator.onLine)return;const token=epoch.current;
   try{const result=await api.get<{amount:number;months:number}>(`/attendance/debt/${student.id}`);if(alive.current&&token===epoch.current)setDebt(result.amount>0?{student,...result}:null);}catch{/* The server controls financial visibility; attendance has already completed. */}
 };
 const performRef=useRef<(op:Operation)=>Promise<void>>(async()=>{}),pumpRef=useRef<()=>Promise<void>>(async()=>{});
 const perform=async(op:Operation)=>{
   const data=current.current.details;if(!data)return;const token=epoch.current;
   const lesson=data.lesson;setBusy(`جاري تسجيل ${op.student.name}…`);
   try{
     const reason=op.correction?window.prompt("سبب تصحيح الحضور:"):undefined;
     if(op.correction&&(!reason||reason.trim().length<3))throw new Error("يلزم سبب واضح للتصحيح");
     const payload:Omit<AttendanceRecord,"id"|"created_at">={teacher_id:lesson.teacher_id,lesson_id:lesson.id,session_slot:lesson.kind==="regular"?"regular":lesson.id,student_id:op.student.id,group_id:lesson.group_id,session_date:lesson.session_date,month:Number(lesson.session_date.slice(5,7)),year:Number(lesson.session_date.slice(0,4)),status:"present",source:op.correction?"correction":op.source,qr:op.raw,cross_group_confirmed:op.confirmed,credit_lesson_id:op.credit,reason:reason||undefined,device_captured_at:new Date().toISOString()};
     if(!navigator.onLine){if(op.correction)throw new Error("التصحيح يحتاج اتصالًا بالخادم");AttendanceQueue.add({...payload,source:"offline"});if(token===epoch.current)notify(`${op.student.name} — معلق على الجهاز، لم يؤكد على الخادم`,false,true,false,op.source);return;}
     const result=await api.post<{record:Row;duplicate:boolean;student:Student}>(`/attendance/lessons/${lesson.id}/mark`,payload);
     if(token!==epoch.current||!alive.current)return;
     OfflineCache.saveAttendanceRecords([result.record]);
     notify(`${result.student.name} · ${result.student.code||""} — ${result.duplicate?"مسجل بالفعل":result.record.timing_state==="late"?`تم الحضور · متأخر ${result.record.late_minutes} دقيقة`:result.record.timing_state==="unverified"?"تم الحضور · وقت الوصول غير مؤكد":"تم الحفظ على الخادم"}`,!result.duplicate,false,result.duplicate,op.source);
     holdRef.current=null;setHold(null);setCredit("");await refresh();void checkDebt(op.student);
     if(typeof BroadcastChannel!=="undefined"){const c=new BroadcastChannel("attendance");c.postMessage("refresh");c.close();}
   }catch(e){if(token===epoch.current)notify(`${op.student.name} — ${errorText(e)}`,false,false,false,op.source);}
   finally{if(token===epoch.current)setBusy(null);}
 };
 performRef.current=perform;
 const accept=async(op:Operation)=>{
   const data=current.current.details;if(!data)return;
   if(!data.lesson.roster.includes(op.student.id)&&!op.confirmed){holdRef.current=op;setHold(op);setCredit("");return;}
   await performRef.current(op);
 };
 const pump=async()=>{
   if(lock.current||holdRef.current)return;
   const raw=queue.current.shift();setWaitingCards(queue.current.length);if(!raw)return;
   lock.current=true;const token=epoch.current;
   try{
     setBusy("جاري التعرف على الطالب…");setLast(null);
     const student=navigator.onLine?await StudentsService.getStudentByQR(raw):findStudentByQR(current.current.students,raw);
     if(token!==epoch.current)return;if(!student)throw new Error("الكارت غير معروف في البيانات المحفوظة");
     await accept({student,raw,source:"qr"});
   }catch(e){if(token===epoch.current)notify(errorText(e),false,false,false,"qr");}
   finally{lock.current=false;if(token===epoch.current)setBusy(null);if(!holdRef.current)void pumpRef.current();}
 };
 pumpRef.current=pump;
 const enqueue=(raw:string)=>{
   if(holdRef.current)return;const now=Date.now();if(now-(cooldown.current.get(raw)||0)<2500||queue.current.includes(raw))return;
   if(queue.current.length>=5){notify("الطابور ممتلئ؛ انتظر وأعد عرض البطاقة");return;}
   cooldown.current.set(raw,now);if(cooldown.current.size>500)cooldown.current.clear();queue.current.push(raw);setWaitingCards(queue.current.length);void pumpRef.current();
 };
 const enqueueRef=useRef(enqueue);enqueueRef.current=enqueue;
 const start=async()=>{
   const lesson=current.current.details?.lesson;if(!lesson||lesson.state!=="open"||starting||scanner.current)return;
   sound.unlockSound();setStarting(true);const token=++cameraGeneration.current;
   const run=(async()=>{try{
     const {Html5Qrcode}=await import("html5-qrcode");if(token!==cameraGeneration.current)return;
     const instance=new Html5Qrcode("lesson-qr-reader",{verbose:false});scanner.current=instance;
     const config=cameraScanConfig();
     try{await instance.start(cameraId||{facingMode:"environment"},config,text=>enqueueRef.current(text),()=>{});}catch(e){if(!isCameraConstraintError(e))throw e;await instance.start(cameraId||{facingMode:"environment"},cameraScanConfig(false),text=>enqueueRef.current(text),()=>{});}
     if(token!==cameraGeneration.current){if(instance.isScanning)await instance.stop();instance.clear();scanner.current=null;return;}
     setScanning(true);try{setDevices(await Html5Qrcode.getCameras());const caps=instance.getRunningTrackCapabilities() as MediaTrackCapabilities & {torch?:boolean};setTorchSupported(!!caps.torch);}catch{}
   }catch(e){scanner.current=null;if(alive.current&&token===cameraGeneration.current)notify(getCameraErrorMessage(e));}finally{if(alive.current)setStarting(false);}})();
   startPromise.current=run;await run;startPromise.current=null;
 };
 const manual=async(student:Student,correction=false)=>{if(lock.current||holdRef.current)return;lock.current=true;sound.unlockSound();try{await accept({student,source:"manual",correction});}finally{lock.current=false;void pumpRef.current();}};
 const create=async()=>{if(lock.current)return;lock.current=true;setBusy("جاري إنشاء الحصة…");try{const result=await api.post<Lesson>("/attendance/lessons",form);setLessons(rows=>[result,...rows]);setSelected(result.id);setError("");}catch(e){setError(errorText(e));}finally{lock.current=false;setBusy(null);}};
 const stateChange=async(state:Lesson["state"])=>{if(!details||lock.current)return;const reason=window.prompt(`سبب تغيير الحصة إلى «${label[state]}»:`);if(!reason||reason.trim().length<3)return;lock.current=true;setBusy("جاري تحديث الحصة…");await stop();try{const result=await api.patch<Lesson>(`/attendance/lessons/${details.lesson.id}/state`,{state,reason});setLessons(rows=>rows.map(l=>l.id===result.id?result:l));await refresh();}catch(e){setError(errorText(e));}finally{lock.current=false;setBusy(null);}};
 const remove=async(row:Row)=>{if(lock.current)return;lock.current=true;setBusy("جاري إلغاء الحضور…");try{await AttendanceRepository.deleteAttendanceRecord(row.id);await refresh();notify("تم إلغاء الحضور وحفظ تاريخه",false,false,true);}catch(e){notify(errorText(e));}finally{lock.current=false;setBusy(null);}};
 const replace=async(student:Student)=>{if(lock.current||!window.confirm(`إلغاء كارت ${student.name} القديم وإصدار بديل؟`))return;lock.current=true;setBusy("جاري إصدار الكارت…");try{const data=await api.post<Partial<Student>>(`/attendance/cards/${student.id}/replace`,{});const updated={...student,...data};setStudents(rows=>rows.map(s=>s.id===student.id?updated:s));setQrStudent(updated);notify("تم إصدار الكارت البديل؛ الكارت القديم لن يقبل عند تحقق الخادم",false,false,true);}catch(e){notify(errorText(e));}finally{lock.current=false;setBusy(null);}};
 const lesson=details?.lesson,summary=details?.summary;
 const pending=AttendanceQueue.getAll().filter(r=>r.teacher_id===lesson?.teacher_id&&r.lesson_id===lesson?.id);
 const matches=students.filter(s=>matchesStudentSearch(s,search)).slice(0,20);
 const held=!!hold,disabled=!!busy||held||online.syncing;
 const records=(details?.records||[]).filter(r=>matchesStudentSearch({name:r.student_name||"",code:r.student_code},listSearch));
 const targetLessons=hold?lessons.filter(l=>l.id!==lesson?.id&&l.state!=="cancelled"&&l.session_date<=getTodayCairo()&&l.roster.includes(hold.student.id)):[];
 if(loading)return <p role="status">جاري تحميل الحضور…</p>;
 return <main className={styles.page} dir="rtl">
  <header className={styles.header}><div><Link href="/teacher/attendance">← سجل الحضور</Link><h1>تسجيل حضور الطلاب</h1><p>اختر الحصة مرة واحدة، ثم استقبل بطاقات الطلاب</p></div><span className={styles.badge}>{online.isOnline?"الشبكة متاحة":"بدون إنترنت"}</span></header>
  {error&&<div role="alert" className={styles.warning}>{error}<button onClick={()=>void refresh()}>إعادة تحميل الحصة</button></div>}
  <section className={styles.card}><label>الحصة<select disabled={disabled||scanning||starting} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">اختر الحصة</option>{lessons.map(l=><option key={l.id} value={l.id}>{groups.find(g=>g.id===l.group_id)?.name} · {l.title} · {l.session_date} {l.time} · {label[l.state]}</option>)}</select></label>
   <details><summary>إنشاء حصة عادية أو إضافية</summary><div className={styles.form}>
    <label>المجموعة<select disabled={disabled} value={form.group_id} onChange={e=>setForm({...form,group_id:e.target.value,time:groups.find(g=>g.id===e.target.value)?.time||form.time})}><option value="">اختر المجموعة</option>{groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select></label>
    <label>التاريخ<input type="date" value={form.session_date} onChange={e=>setForm({...form,session_date:e.target.value})}/></label><label>الساعة<input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label>
    <label>نوع الحصة<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="regular">عادية من جدول المجموعة</option><option value="extra">إضافية / تعويضية مستقلة</option></select></label>
    <label>اسم الحصة<input maxLength={120} value={form.title} placeholder="مثل: مراجعة الوحدة الأولى" onChange={e=>setForm({...form,title:e.target.value})}/></label>
    <label>السماح بالتأخير (دقيقة)<input type="number" min={0} max={120} value={form.grace_minutes} onChange={e=>setForm({...form,grace_minutes:Number(e.target.value)})}/></label>
    <label>بداية الاستقبال قبل الموعد (دقيقة)<input type="number" min={0} max={120} value={form.early_minutes} onChange={e=>setForm({...form,early_minutes:Number(e.target.value)})}/></label>
    <label>نهاية الاستقبال بعد الموعد (دقيقة)<input type="number" min={15} max={480} value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:Number(e.target.value)})}/></label>
   </div><button disabled={disabled||!form.group_id||!online.isOnline} onClick={()=>void create()}>إنشاء الحصة</button></details>
  </section>
  {lesson&&<>
   <section className={styles.session}><div><strong>{groups.find(g=>g.id===lesson.group_id)?.name} · {lesson.title}</strong><p>{lesson.session_date} · الساعة {lesson.time} · {label[lesson.state]}</p><small>نافذة الحضور: {clock(lesson.opens_at)} – {clock(lesson.closes_at)} · السماح {lesson.grace_minutes} دقيقة</small></div><div className={styles.actions}>{lesson.state!=="open"&&lesson.state!=="cancelled"&&<button disabled={disabled||!online.isOnline} onClick={()=>void stateChange("open")}>فتح الحصة</button>}{lesson.state==="open"&&<button disabled={disabled||!online.isOnline} onClick={()=>void stateChange("closed")}>إغلاق التسجيل</button>}{lesson.state!=="cancelled"?<button disabled={disabled||!online.isOnline} onClick={()=>void stateChange("cancelled")}>إلغاء الحصة</button>:<button disabled={disabled||!online.isOnline} onClick={()=>void stateChange("scheduled")}>استعادة الحصة</button>}</div></section>
   {lesson.state==="cancelled"&&<p className={styles.warning}>الحصة ملغاة. التاريخ محفوظ ومستبعد من تقرير الانتظام.</p>}
   <div className={styles.grid}><section>
    <ScannerPanel scannerDivId="lesson-qr-reader" scanning={scanning} selectedGroupId={lesson.group_id} lastScan={last} crossGroupConfirm={null} onConfirmCrossGroup={()=>{}} onCancelCrossGroup={()=>{}} busy={hold?"المسح متوقف لمراجعة الطالب":busy} queuedScans={waitingCards} isStarting={starting} sessionReady={lesson.state==="open"&&!hold} soundEnabled={sound.soundEnabled} soundReady={sound.soundReady} onUnlockSound={sound.unlockSound} onToggleSound={sound.toggleSound} onDismiss={()=>setLast(null)} onStart={()=>void start()} onStop={()=>void stop()} cameraDevices={devices} selectedCameraId={cameraId} onSwitchCamera={id=>{void stop();setCameraId(id);}} torchSupported={torchSupported} torchOn={torch} onToggleTorch={()=>{void scanner.current?.applyVideoConstraints({advanced:[{torch:!torch} as MediaTrackConstraintSet]}).then(()=>setTorch(!torch)).catch(()=>notify("تعذر تشغيل الفلاش"));}}/>
    {hold&&<section role="dialog" aria-modal="true" aria-label="تأكيد الحضور الاستثنائي" className={styles.confirm}><h2>{hold.student.name}</h2><p>الكود {hold.student.code} · المجموعة الأصلية: {groups.find(g=>g.id===hold.student.group_id)?.name||"مجموعة سابقة"}</p><p>الطالب خارج قائمة هذه الحصة. هل تسجل حضورًا استثنائيًا؟</p><label>احتساب الحضور<select disabled={!!busy} value={credit} onChange={e=>setCredit(e.target.value)}><option value="">حضور مستقل في الحصة المفتوحة</option>{targetLessons.map(l=><option key={l.id} value={l.id}>تعويض: {l.title} · {l.session_date} {l.time}</option>)}</select></label><div className={styles.actions}><button disabled={!!busy} onClick={()=>{if(lock.current)return;lock.current=true;void performRef.current({...hold,confirmed:true,credit:credit||undefined}).finally(()=>{lock.current=false;if(!holdRef.current)void pumpRef.current();});}}>تأكيد الحضور</button><button disabled={!!busy} onClick={()=>{holdRef.current=null;setHold(null);setCredit("");void pumpRef.current();}}>إلغاء</button></div></section>}
    <div className={styles.counters}><div><b>{summary?.present||0}</b>حضور مؤكد</div><div><b>{summary?.late||0}</b>منهم متأخر</div><div><b>{pending.length}</b>معلق</div><div><b>{summary?.waiting||0}</b>{summary?.finalized?"غائب من المتوقعين":"منتظر"}</div></div>
    {!!summary?.unverified&&<p>وقت وصول غير مؤكد: {summary.unverified} — لا يُصنّف تأخيرهم من ساعة الجهاز.</p>}
    <section className={styles.card}><h2>آخر 5 عمليات على هذا الجهاز</h2>{recent.length?recent.map((r,i)=><p key={i}>{clock(r.at)} · {label[r.source]||r.source} · {r.text}</p>):<p>لم تتم عمليات على هذا الجهاز بعد.</p>}</section>
    {debt&&<section className={styles.warning}><strong>{debt.student.name}: مديونية {debt.amount.toLocaleString("ar-EG")} ج.م عن {debt.months} شهر</strong><p>الحضور مسجل بصورة مستقلة.</p><Link href={`/teacher/students/${debt.student.id}`}>فتح ملف الطالب للتحصيل</Link><button onClick={()=>setDebt(null)}>إخفاء</button></section>}
   </section><aside>
    <section className={styles.card}><h2>تسجيل يدوي وكارت بديل</h2><label>ابحث بالاسم أو الكود<input value={search} placeholder="اكتب اسم الطالب أو كوده" onChange={e=>setSearch(e.target.value)}/></label>{search.trim()&&matches.map(s=><div key={s.id} className={styles.row}><div><strong>{s.name}</strong><small>{s.code} · {groups.find(g=>g.id===s.group_id)?.name}</small></div><div className={styles.actions}><button disabled={disabled||lesson.state!=="open"} onClick={()=>void manual(s)}>حضور</button><button disabled={disabled||!online.isOnline||lesson.state==="cancelled"} onClick={()=>void manual(s,true)}>تصحيح</button><button disabled={disabled||!online.isOnline} onClick={()=>void replace(s)}>كارت بديل</button></div></div>)}</section>
    <section className={styles.card}><div className={styles.actions}><button onClick={()=>setTab("present")}>الحضور</button><button onClick={()=>setTab("waiting")}>{summary?.finalized?"الغائبون":"المنتظرون"}</button><button onClick={()=>setTab("history")}>سجل التعديلات</button><button onClick={()=>setTab("report")}>تقرير الحصة</button></div><label>بحث في القائمة<input value={listSearch} onChange={e=>setListSearch(e.target.value)}/></label>
     {tab==="present"&&records.filter(r=>r.status==="present").map(r=><div className={styles.row} key={r.id}><div><strong>{r.student_name} · {r.student_code}</strong><small>{clock(r.arrived_at||r.received_at||r.created_at)} · {label[r.source||""]||"سجل سابق"} · {label[r.timing_state||""]||"وقت غير محفوظ"}{r.late_minutes?` (${r.late_minutes} دقيقة بعد السماح)`:""}</small>{r.actual_lesson_id&&r.actual_lesson_id!==r.lesson_id&&<small>حضور تعويضي — الأصل: {lessons.find(l=>l.id===r.lesson_id)?.title||r.session_date}</small>}</div><button disabled={disabled||!online.isOnline} onClick={()=>void remove(r)}>إلغاء</button></div>)}
     {tab==="waiting"&&(details?.waiting||[]).filter(s=>matchesStudentSearch(s,listSearch)).map(s=><div key={s.id} className={styles.row}><span>{s.name} · {s.code}</span><button disabled={disabled||lesson.state!=="open"} onClick={()=>{const student=students.find(st=>st.id===s.id);if(student)void manual(student);}}>حضور</button></div>)}
     {tab==="history"&&<>{(details?.audit||[]).filter(r=>matchesStudentSearch({name:r.student_name||"",code:r.student_code},listSearch)).map(r=><details key={r.id}><summary>{r.student_name} · {r.session_date}</summary>{r.history?.length?r.history.map((e,i)=><p key={i}>{new Date(e.at).toLocaleString("ar-EG",{timeZone:"Africa/Cairo"})} · {label[e.action]||e.action} · {e.actor_type} ({e.actor_id}) · {e.reason}<br/><small>{e.before?JSON.stringify(e.before):""} ← {e.after?JSON.stringify(e.after):""}</small></p>):<p>لم يكن تاريخ التعديل محفوظًا لهذا السجل القديم.</p>}</details>)}{lesson.events?.map((e,i)=><p key={`event-${i}`}>{clock(e.at)} · الحصة: {label[e.action]||e.action} · {e.reason}</p>)}</>}
     {tab==="report"&&<div><h3>{lesson.title} — {lesson.session_date}</h3><p>{summary?.cancelled?"ملغاة — مستبعدة من الانتظام":summary?.finalized?"انتهت نافذة الحضور":"أعداد مبدئية — الحضور مفتوح أو لم تبدأ نافذته"}</p><p>متوقعون: {lesson.roster.length} · مؤكدون: {summary?.present} · متأخرون: {summary?.late} · غياب نهائي: {summary?.cancelled?"—":summary?.finalized?summary.absent:"لم يعتمد بعد"}</p><p>الانتظام للطلاب المتوقعين: {summary?.cancelled||!summary?.finalized?"غير معتمد":lesson.roster.length?`${Math.round((lesson.roster.length-summary.waiting)/lesson.roster.length*100)}٪`:"لا يوجد طلاب متوقعون"}</p><p>الحضور الاستثنائي يظهر في الحضور، ولا يرفع نسبة انتظام طلاب المجموعة فوق 100٪.</p><button onClick={()=>window.print()}>طباعة التقرير</button></div>}
    </section>
   </aside></div>
  </>}
  {online.pendingCount>0&&<section className={styles.card}><h2>الحضور المعلق على الجهاز</h2><p>يُراجع الخادم الكارت والحصة عند المزامنة. المرفوض يظل هنا للمراجعة والتصحيح.</p><button disabled={!online.isOnline||online.syncing} onClick={()=>void online.syncQueue()}>{online.syncing?"جاري المزامنة…":"إعادة محاولة المزامنة"}</button>{AttendanceQueue.getAll().filter(r=>r.teacher_id===lesson?.teacher_id||r.teacher_id===userId).map(r=><div key={r._queueId} className={styles.row}><div>{students.find(s=>s.id===r.student_id)?.name||r.student_id} · {r.session_date}<small>{lessons.find(l=>l.id===r.lesson_id)?.title} · {r._error||"بانتظار تأكيد الخادم"}</small></div><button disabled={!online.isOnline||online.syncing} onClick={()=>void online.retryRecord(r)}>إعادة محاولة</button><button disabled={online.syncing} onClick={()=>online.cancelPending(r)}>إلغاء المعلق</button></div>)}{online.syncError&&<p role="alert">{online.syncError}</p>}</section>}
  {qrStudent&&<><QRModal student={qrStudent} onClose={()=>setQrStudent(null)}/><span className={styles.srOnly}>{getStudentQRValue(qrStudent)}</span></>}
 </main>;
}
