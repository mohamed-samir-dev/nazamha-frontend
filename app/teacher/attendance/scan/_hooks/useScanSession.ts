"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { Html5Qrcode } from "html5-qrcode";
import { AuthService } from "@/lib/services/authService";
import { api } from "@/lib/apiClient";
import { Group, Student, Grade, ScannedEntry, AttendanceRecord } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { AttendanceQueue, OfflineCache } from "@/lib/offlineQueue";
import { appCache } from "@/lib/appCache";
import { getErrorMessage, getCameraErrorMessage } from "@/lib/errors";
import { getTodayCairo, getDateCairo, getDayOfWeekCairo } from "@/lib/utils/dateUtils";
import { codeText } from "@/lib/utils/studentSearch";
import { findStudentByQR } from "@/lib/utils/qrParser";
import {cameraScanConfig,isCameraConstraintError} from "@/lib/cameraScanConfig";

const invalidateAllTimeCache = () => appCache.invalidate("allTimeAttendanceMap");

export interface LastScan { name: string; success: boolean; pending?: boolean; }
export interface CrossGroupConfirm {
  context: {userId: string|null; selectedGroupId: string; sessionDate: string};
  student: Student;
  originalGroupName: string;
  originalGroupSchedule: string;
  nextScheduledDate: string | null;
  scheduledDateIsToday: boolean;
  reason: string;
}

const SCAN_COOLDOWN_MS = 3000;
const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// استخراج أرقام الأيام (0=أحد..6=سبت) من حقل day_of_week النصي
export function parseGroupDayNumbers(day_of_week: string): number[] {
  if (!day_of_week) return [];
  return day_of_week
    .split(/\s*[,،]\s*/)
    .map(d => DAYS_AR.map(v => v.replace(/[أإآ]/g,"ا")).indexOf(d.trim().replace(/[أإآ]/g,"ا")))
    .filter(n => n !== -1);
}

// توليد كل التواريخ الصالحة في نطاق [من أسبوع ماضي → اليوم فقط (لا تواريخ مستقبلية)]
export function getValidSessionDates(group: Group): string[] {
  const dayNums = parseGroupDayNumbers(group.day_of_week ?? "");
  if (!dayNums.length) return [];

  const startDate = group.start_date ?? group.created_at?.slice(0, 10) ?? null;

  // استخدام توقيت القاهرة
  const todayStr = getTodayCairo();
  const today = new Date(todayStr + "T00:00:00");

  // بداية الأسبوع الماضي (سبت الأسبوع السابق)
  const day = today.getDay();
  const diffToSat = day === 6 ? 0 : day + 1;
  const currentWeekSat = new Date(today);
  currentWeekSat.setDate(today.getDate() - diffToSat);

  const minDate = new Date(currentWeekSat);
  minDate.setDate(currentWeekSat.getDate() - 7); // أسبوع ماضٍ

  // نهاية النطاق = اليوم الحالي فقط (لا تواريخ مستقبلية)
  const maxDate = new Date(today);

  const dates: string[] = [];
  const cursor = new Date(minDate);
  while (cursor <= maxDate) {
    if (dayNums.includes(cursor.getDay())) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      if ((!startDate || dateStr >= startDate) && !group.cancelled_sessions?.includes(dateStr)) dates.push(dateStr);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// أقرب تاريخ صالح للمجموعة (اليوم فقط إذا كان من أيام المجموعة، وإلا أقرب يوم سابق)
export function getNearestValidDate(group: Group): string {
  const dates = getValidSessionDates(group);
  const today = getTodayCairo();
  if (!dates.length) return group.start_date ?? today;
  // اليوم نفسه لو موجود في جدول المجموعة
  if (dates.includes(today)) return today;
  // أقرب يوم سابق (لا نختار أبداً يوم مستقبلي)
  const past = dates.filter(d => d < today);
  return past.length ? past[past.length - 1] : today;
}

function detectCurrentGroup(groups: Group[]): Group | null {
  const todayStr = getTodayCairo();
  const cairoNow = getDateCairo();
  const todayAr = DAYS_AR[getDayOfWeekCairo()];
  const nowMins = cairoNow.getHours() * 60 + cairoNow.getMinutes();
  const match = groups.find(g => {
    if (!g.day_of_week || !g.time) return false;
    const startDate = g.start_date ?? g.created_at?.slice(0, 10) ?? null;
    if (startDate && todayStr < startDate) return false;
    const days = g.day_of_week.split(/\s*[,،]\s*|\s+،\s+/).map(d => d.trim());
    if (!days.includes(todayAr)) return false;
    const [h, m] = g.time.split(":").map(Number);
    const gMins = h * 60 + m;
    return nowMins >= gMins - 5 && nowMins <= gMins + 20;
  });
  return match ?? null;
}

export function useScanSession() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const today = getTodayCairo();
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [sessionDate, setSessionDate] = useState(today);
  const [validSessionDates, setValidSessionDates] = useState<string[]>([]);
  const [autoDetected, setAutoDetected] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [scannedToday, setScannedToday] = useState<ScannedEntry[]>([]);
  const [sessionRevision,setSessionRevision]=useState(0);
  const refreshSessionAttendance=useCallback(()=>setSessionRevision(v=>v+1),[]);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [crossGroupConfirm, setCrossGroupConfirm] = useState<CrossGroupConfirm | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [manualMsg, setManualMsg] = useState<{ text: string; type: "success" | "error" | "warn" } | null>(null);
  const [sessionDateError, setSessionDateError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cameraGeneration = useRef(0);
  const rawScanRef = useRef({text:"",at:0,pending:false});
  const lastTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const manualTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const manualBusy = useRef(false);
  const writesRevision = useRef(0);
  const processingRef = useRef<Set<string>>(new Set());
  const scannedIdsRef = useRef<Map<string, number>>(new Map());
  const autoGroupRef = useRef<string | null>(null);
  const manualOverrideRef = useRef(false);
  const handleQRSuccessRef = useRef<(text: string) => void>(() => {});
  const stateRef = useRef({
    userId: null as string | null,
    selectedGroupId: "",
    scannerPaused: false,
    students: [] as Student[],
    groups: [] as Group[],
    grades: [] as Grade[],
    scannedToday: [] as ScannedEntry[],
    sessionDate: today,
  });
  const scannerDivId = "qr-reader";

  useEffect(() => {
    stateRef.current = { userId, selectedGroupId, scannerPaused, students, groups, grades, scannedToday, sessionDate };
  }, [userId, selectedGroupId, scannerPaused, students, groups, grades, scannedToday, sessionDate]);
  useEffect(()=>{
    if((scanning || crossGroupConfirm) && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 900px)").matches) {
      document.getElementById(scannerDivId)?.scrollIntoView({behavior:"smooth",block:"center"});
    }
  },[scanning,crossGroupConfirm]);

  const showLastScan = useCallback((name: string, success: boolean, pending = false) => {
    if(lastTimer.current) clearTimeout(lastTimer.current);
    setLastScan({ name, success, pending });
    lastTimer.current = setTimeout(() => setLastScan(null), 2000);
  }, []);

  // ── startScanner ──────────────────────────────────────────────
  const startScanner = useCallback(async (groupId?: string) => {
    const gid = groupId ?? stateRef.current.selectedGroupId;
    if (!gid || scannerRef.current) return;
    const generation = ++cameraGeneration.current;
    try {
      const config = cameraScanConfig();
      const { Html5Qrcode: QrcodeClass } = await import("html5-qrcode");
      if(generation !== cameraGeneration.current) return;
      const qr = new QrcodeClass(scannerDivId);
      scannerRef.current = qr as unknown as Html5Qrcode;

      // FIX: استخدام handleQRSuccessRef بدل تكرار الكود
      const onScan = (decodedText: string) => handleQRSuccessRef.current(decodedText);

      try {
        await qr.start({ facingMode: "environment" }, config, onScan, () => {});
      } catch (error) {
        if(generation !== cameraGeneration.current) return;
        if(!isCameraConstraintError(error) && !/NotFoundError|DevicesNotFoundError/.test(String(error))) throw error;
        const cameras = await QrcodeClass.getCameras();
        if (!cameras?.length) throw new Error("لا توجد كاميرا");
        const back = cameras.find(c => /back|rear|environment/i.test(c.label));
        if(generation !== cameraGeneration.current) return;
        await qr.start(back ? back.id : cameras[cameras.length - 1].id, cameraScanConfig(false), onScan, () => {});
      }
      if(generation !== cameraGeneration.current) { try { await qr.stop(); qr.clear(); } catch {} return; }
      setScanning(true);
    } catch (err: unknown) {
      if(generation === cameraGeneration.current) { scannerRef.current = null; showLastScan(getCameraErrorMessage(err), false); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLastScan]);

  const stopScanner = useCallback(async () => {
    cameraGeneration.current++;
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // ── Auto-detect: fills group/grade only, never touches camera ──
  const applyAutoDetect = useCallback((grpData: Group[]) => {
    const match = detectCurrentGroup(grpData);
    if (!match) return;
    if (match.id === autoGroupRef.current) return;
    autoGroupRef.current = match.id;
    setSelectedGroupId(match.id);
    if (match.grade_id) setSelectedGradeId(match.grade_id);
    setAutoDetected(true);
    stateRef.current.selectedGroupId = match.id;
    // ضبط التواريخ الصالحة
    const dates = getValidSessionDates(match);
    setValidSessionDates(dates);
    const nearest = getNearestValidDate(match);
    setSessionDate(nearest);
    stateRef.current.sessionDate = nearest;
  }, []);

  // ── Load data on mount ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // عرض الـ cache فوراً
        const cachedGroups = OfflineCache.loadGroups();
        const cachedStudents = OfflineCache.loadStudents();
        const cachedGrades = OfflineCache.loadGrades();
        if (cachedGroups.length || cachedStudents.length) {
          setGroups(cachedGroups);
          setStudents(cachedStudents);
          stateRef.current.students = cachedStudents;
          stateRef.current.groups = cachedGroups;
          stateRef.current.grades = cachedGrades;
          setGrades(cachedGrades);
        }

        const currentUser = await AuthService.getUser();
        if (!currentUser || cancelled) return;
        setUserId(currentUser.id);
        stateRef.current.userId = currentUser.id;

        let grpData: Group[], stData: Student[], grdData: Grade[];
        if (navigator.onLine) {
          [grpData, stData, grdData] = await Promise.all([
            GroupsService.getGroupsByTeacherId(),
            StudentsService.getStudentsByTeacherId("id,name,code,center_student_code,group_id,grade_id,is_suspended,suspended_until,suspension_reason,created_at"),
            GradesService.getGradesByTeacherId(currentUser.id),
          ]);
          if (cancelled) return;
          OfflineCache.saveStudents(stData);
          OfflineCache.saveGroups(grpData);
          OfflineCache.saveGrades(grdData);
          OfflineCache.setLastSync();
        } else {
          grpData = OfflineCache.loadGroups();
          stData = OfflineCache.loadStudents();
          grdData = OfflineCache.loadGrades();
        }

        setGroups(grpData);
        setStudents(stData);
        setGrades(grdData);
        stateRef.current.students = stData;
        stateRef.current.groups = grpData;
        stateRef.current.grades = grdData;
        stateRef.current.userId = currentUser.id;
      } catch (e) {
        if (cancelled) return;
        console.error("[Load] error:", e);
        const grpData = OfflineCache.loadGroups();
        const stData = OfflineCache.loadStudents();
        const grdData = OfflineCache.loadGrades();
        setGroups(grpData);
        setStudents(stData);
        setGrades(grdData);
        stateRef.current.students = stData;
        stateRef.current.groups = grpData;
        stateRef.current.grades = grdData;
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep latest applyAutoDetect in a ref so effects always call the fresh version
  const applyAutoDetectRef = useRef(applyAutoDetect);
  useEffect(() => { applyAutoDetectRef.current = applyAutoDetect; }, [applyAutoDetect]);

  const searchParams = useSearchParams();
  const urlGroupId = searchParams.get("group");

  // ── Apply group from URL param (from dashboard "ابدأ الحضور" button) ──
  useEffect(() => {
    if (loading || groups.length === 0 || !urlGroupId) return;
    const match = groups.find(g => g.id === urlGroupId);
    if (!match) return;
    manualOverrideRef.current = true;
    autoGroupRef.current = match.id;
    stateRef.current.selectedGroupId = match.id;
    const dates = getValidSessionDates(match);
    const nearest = getNearestValidDate(match);
    Promise.resolve().then(() => {
      setSelectedGroupId(match.id);
      if (match.grade_id) setSelectedGradeId(match.grade_id);
      setAutoDetected(false);
      setValidSessionDates(dates);
      setSessionDate(nearest);
      stateRef.current.sessionDate = nearest;
    });
  }, [loading, groups, urlGroupId]);

  // ── Fire auto-detect once data is ready ──────────────────────
  useEffect(() => {
    if (loading || groups.length === 0 || manualOverrideRef.current) return;
    applyAutoDetectRef.current(groups);
  }, [loading, groups]);

  // ── Auto-start camera when group is set from URL ────────────
  const urlAutoStartedRef = useRef(false);
  useEffect(() => {
    if (!urlGroupId || !selectedGroupId || selectedGroupId !== urlGroupId) return;
    if (urlAutoStartedRef.current || scanning || scannerRef.current) return;
    urlAutoStartedRef.current = true;
    setIsStarting(true);
    startScanner(selectedGroupId).finally(() => setIsStarting(false));
  }, [urlGroupId, selectedGroupId, scanning, startScanner]);

  // ── Periodic auto-detect every 30s ───────────────────────────
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      if (manualOverrideRef.current) return;
      const grpData = stateRef.current.groups;
      if (grpData.length > 0) applyAutoDetectRef.current(grpData);
    }, 30_000);
    return () => clearInterval(interval);
  }, [loading]);

  // ── Load session attendance from Supabase after group is set ─
  useEffect(() => {
    if (!userId || !selectedGroupId || students.length === 0) return;
    let active = true;
    const revisionAtStart=writesRevision.current;
    async function loadSessionAttendance() {
      if (navigator.onLine) {
        try {
          const records = await api.get<(AttendanceRecord & { _id?:string; student_name?:string })[]>(
            `/attendance?group_id=${selectedGroupId}&session_date=${sessionDate}&status=present`
          );
          if (records && active) {
            if(revisionAtStart!==writesRevision.current) { refreshSessionAttendance(); return; }
            OfflineCache.replaceAttendanceSession(userId!,selectedGroupId,sessionDate,records);
            const currentStudents = stateRef.current.students;
            setScannedToday(records.map(r => {
              const st = currentStudents.find(s => s.id === r.student_id);
              return {
                recordId: r.id || r._id, studentId: r.student_id,
                studentName: st?.name ?? r.student_name ?? "طالب غير معروف",
                time: r.created_at ? new Date(r.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "—",
              };
            }));
          }
        } catch { if(active) showLastScan("تعذر تحميل سجل الجلسة؛ تحقق من الاتصال قبل المتابعة",false); }
      } else {
        const queued = AttendanceQueue.getAll().filter(r => r.teacher_id===userId && (r.scanner_group_id || r.group_id) === selectedGroupId && r.session_date === sessionDate);
        const cached=OfflineCache.loadAttendanceRecords().filter(r=>r.teacher_id===userId && r.status==="present" && ((r.group_id===selectedGroupId&&r.session_date===sessionDate)||(r.scanner_group_id===selectedGroupId&&r.scanner_session_date===sessionDate))).map(r=>({studentId:r.student_id,studentName:students.find(s=>s.id===r.student_id)?.name||"طالب",recordId:r.id,time:r.created_at?new Date(r.created_at).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}):"—"}));
        setScannedToday([...cached,...queued.filter(r=>!cached.some(c=>c.studentId===r.student_id)).map(r => {
          const st = students.find(s => s.id === r.student_id);
          return {
            queued:true, studentId: r.student_id,
            studentName: st?.name ?? "طالب غير معروف",
            time: new Date(r._queuedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          };
        })]);
      }
    }
    loadSessionAttendance();
    return () => { active=false; };
  }, [userId, selectedGroupId, sessionDate, students, sessionRevision]);

  useEffect(() => () => {
    if(lastTimer.current) clearTimeout(lastTimer.current);
    void stopScanner();
    if(manualTimer.current) clearTimeout(manualTimer.current);
  }, [stopScanner]);

  // ── مساعد مشترك: تسجيل حضور طالب بعد التحقق ──────────────────
  const commitAttendance = useCallback(async (
    student: Student,
    context = {...stateRef.current},
    confirmed = false,
  ) => {
    const { userId, sessionDate, selectedGroupId } = context;
    if (stateRef.current.userId !== userId || stateRef.current.sessionDate !== sessionDate || stateRef.current.selectedGroupId !== selectedGroupId) throw new Error("تغيرت الجلسة؛ أعد مسح الطالب");
    if (!userId) throw new Error("يرجى تسجيل الدخول");
    // ── Backend will automatically use student's original group_id ──────────
    // We send student.group_id explicitly, but backend enforces it anyway
    const [syear, smonth] = sessionDate.split("-").map(Number);
    const saved = await AttendanceService.upsertAttendanceRecord({
      teacher_id: userId, student_id: student.id,
      group_id: student.group_id || "", scanner_group_id: selectedGroupId, cross_group_confirmed: confirmed,
      session_date: sessionDate,
      month: smonth, year: syear, status: "present",
    });
    writesRevision.current++;
    invalidateAllTimeCache();
    if(stateRef.current.sessionDate!==sessionDate || stateRef.current.selectedGroupId!==selectedGroupId)return;
    const entry: ScannedEntry = {
      studentId: student.id, studentName: student.name,
      recordId: saved.state === "saved" ? saved.record.id : undefined, queued: saved.state === "queued",
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };
    if(stateRef.current.sessionDate === sessionDate && stateRef.current.selectedGroupId === selectedGroupId) setScannedToday(prev => prev.some(e => e.studentId === student.id) ? prev : [entry, ...prev]);
    return saved;
  }, [showLastScan]);

  const handleQRSuccess = useCallback(async (decodedText: string) => {
    const context = {...stateRef.current};
    const { userId, scannerPaused, students, groups, grades, scannedToday, selectedGroupId, sessionDate } = context;
    if (!userId || scannerPaused) return;
    
    const nowMs = Date.now();
    if(rawScanRef.current.pending || (rawScanRef.current.text === decodedText && nowMs - rawScanRef.current.at < SCAN_COOLDOWN_MS)) return;
    rawScanRef.current = {text:decodedText, at:nowMs, pending:true};
    // support center QR (/report/c/{code}), legacy URL (/report/{id}), and raw ID
    let scannedStudent: Student | undefined;
    try {
      scannedStudent = navigator.onLine
        ? await StudentsService.getStudentByQR(decodedText)
        : findStudentByQR(students, decodedText);
    } catch (error) { showLastScan(getErrorMessage(error), false); return; }
    finally { rawScanRef.current.pending = false; }
    if (stateRef.current.selectedGroupId !== selectedGroupId || stateRef.current.sessionDate !== sessionDate) return;
    if (!scannedStudent) { showLastScan("طالب غير مسجل عندك!", false); return; }
    const studentId = scannedStudent.id;
    if ((scannedIdsRef.current.get(studentId) ?? 0) + SCAN_COOLDOWN_MS > nowMs) return;
    if (processingRef.current.has(studentId)) return;
    processingRef.current.add(studentId);
    scannedIdsRef.current.set(studentId, nowMs);

    const student = scannedStudent;

    // Check suspension
    if (student.is_suspended && (!student.suspended_until || new Date(student.suspended_until) > new Date())) {
      processingRef.current.delete(studentId);
      const reason = student.suspension_reason ? ` — ${student.suspension_reason}` : "";
      showLastScan(`${student.name} — الطالب موقوف${reason}`, false);
      return;
    }

    // ── Cross-group validation via backend ────────────────────────────────
    if (student.group_id !== selectedGroupId) {
      try {
        const validation = await api.post<import("@/lib/types").CrossGroupValidation>("/attendance/validate-cross-group", {
          student_id: student.id,
          scanner_group_id: selectedGroupId,
          requested_date: sessionDate,
        });

        if(stateRef.current.selectedGroupId !== selectedGroupId || stateRef.current.sessionDate !== sessionDate) return;
        if (validation.decision === "deny") {
          processingRef.current.delete(studentId);
          showLastScan(`${student.name} — ${validation.reason}`, false);
          return;
        }

        if (validation.decision === "confirm") {
          setScannerPaused(true);
          setCrossGroupConfirm({
            student, context,
            originalGroupName: validation.studentGroupName,
            originalGroupSchedule: validation.studentGroupSchedule,
            nextScheduledDate: validation.nextScheduledDate,
            scheduledDateIsToday: validation.scheduledDateIsToday,
            reason: validation.reason,
          });
          processingRef.current.delete(studentId);
          return;
        }

        // decision === "allow" → continue to attendance recording
      } catch (e: unknown) {
        processingRef.current.delete(studentId);
        const errorMsg = getErrorMessage(e, "حدث خطأ في التحقق من صلاحية الحضور");
        showLastScan(errorMsg, false);
        return;
      }
    }

    if (scannedToday.some(e => e.studentId === student.id)) {
      processingRef.current.delete(studentId);
      showLastScan(`${student.name} — مسجل مسبقاً`, false);
      return;
    }

    try {
      const saved = await commitAttendance(student, context);
      if(saved) showLastScan(saved.state === "queued" ? `${student.name} — في انتظار المزامنة` : student.name, saved.state === "saved", saved.state === "queued");
    } catch (e: unknown) {
      const msg = getErrorMessage(e, "حدث خطأ أثناء تسجيل الحضور.");
      // If the backend message explicitly mentions suspension keywords, surface them directly
      showLastScan(msg.includes("محظور") || msg.includes("موقوف") ? `${student.name} — الطالب موقوف` : msg, false);
    } finally {
      processingRef.current.delete(studentId);
    }
  }, [showLastScan, commitAttendance]);

  // ربط الـ ref بالـ callback الحالي
  useLayoutEffect(() => { handleQRSuccessRef.current = handleQRSuccess; }, [handleQRSuccess]);

  const showManualMsg = useCallback((text: string, type: "success" | "error" | "warn") => {
    if(manualTimer.current) clearTimeout(manualTimer.current);
    setManualMsg({ text, type });
    manualTimer.current=setTimeout(() => setManualMsg(null), 3000);
  }, []);

  const handleManualSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if(manualBusy.current) return;
    manualBusy.current=true;
    try {
    const context = {...stateRef.current};
    const { userId, students, groups, scannedToday, selectedGroupId, sessionDate } = context;
    if(context.scannerPaused) {showManualMsg("راجع تأكيد الطالب الحالي أو أغلقه أولًا","warn");return;}
    if (!userId || !selectedGroupId || !getValidSessionDates(groups.find(g=>g.id===selectedGroupId) || {day_of_week:""} as Group).includes(sessionDate)) { showManualMsg("اختر جلسة متاحة أولًا","error"); return; }
    
    const group = groups.find(g => g.id === selectedGroupId);
    const fullCode = group?.code ? `${group.code}-${manualCode.trim()}` : manualCode.trim();
    const normalized = codeText(manualCode);
    const student = findStudentByQR(students, manualCode) ?? students.find(s => [s.code,s.center_student_code].some(c => c && [normalized,codeText(fullCode)].includes(codeText(c)))) ?? (/^\d+$/.test(normalized) ? students.find(s=>s.group_id===selectedGroupId && s.code && Number(s.code.split("-").at(-1))===Number(normalized)) : undefined);
    if (!student) { showManualMsg("الكود غير موجود", "error"); return; }
    if (student.is_suspended && (!student.suspended_until || new Date(student.suspended_until) > new Date())) {
      const reason = student.suspension_reason ? ` — ${student.suspension_reason}` : "";
      showManualMsg(`${student.name} — الطالب موقوف${reason}`, "error"); return;
    }
    if (scannedToday.some(e => e.studentId === student.id)) {
      showManualMsg(`${student.name} — مسجل مسبقاً ✓`, "warn"); return;
    }
    // ── Cross-group check للإدخال اليدوي ──────────────────────────
    if (student.group_id !== selectedGroupId) {
      try {
        const validation = await api.post<import("@/lib/types").CrossGroupValidation>("/attendance/validate-cross-group", {
          student_id: student.id,
          scanner_group_id: selectedGroupId,
          requested_date: sessionDate,
        });

        if(stateRef.current.selectedGroupId !== selectedGroupId || stateRef.current.sessionDate !== sessionDate) return;
        if (validation.decision === "deny") {
          showManualMsg(`${student.name} — ${validation.reason}`, "error");
          setManualCode("");
          return;
        }

        if (validation.decision === "confirm") {
          setScannerPaused(true);
          setCrossGroupConfirm({
            student, context,
            originalGroupName: validation.studentGroupName,
            originalGroupSchedule: validation.studentGroupSchedule,
            nextScheduledDate: validation.nextScheduledDate,
            scheduledDateIsToday: validation.scheduledDateIsToday,
            reason: validation.reason,
          });
          setManualCode("");
          return;
        }

        // decision === "allow" → continue below
      } catch (err: unknown) {
        showManualMsg(getErrorMessage(err, "حدث خطأ في التحقق من صلاحية الحضور"), "error");
        setManualCode("");
        return;
      }
    }
    try {
      const saved = await commitAttendance(student, context);
      if(!saved)return;
      showManualMsg(saved?.state === "queued" ? `${student.name} — في انتظار المزامنة` : `تم تسجيل ${student.name}`, saved?.state === "queued" ? "warn" : "success");
      setManualCode("");
    } catch (err: unknown) {
      showManualMsg(getErrorMessage(err, "حدث خطأ أثناء تسجيل الحضور. حاول مرة أخرى."), "error");
    }
    } finally { manualBusy.current = false; }
  }, [manualCode, showManualMsg, commitAttendance]);

  // FIX: handleGradeChange async مع await stopScanner
  const handleGradeChange = useCallback(async (v: string) => {
    manualOverrideRef.current = true;
    setCrossGroupConfirm(null); setScannerPaused(false);
    stateRef.current.selectedGroupId = "";
    await stopScanner();
    setSelectedGradeId(v);
    setSelectedGroupId("");
    setScannedToday([]);
    scannedIdsRef.current.clear();
    processingRef.current.clear();
  }, [scanning, stopScanner]);

  const handleGroupChange = useCallback(async (v: string) => {
    setCrossGroupConfirm(null); setScannerPaused(false);
    if(isStarting) await stopScanner();
    autoGroupRef.current = null;
    manualOverrideRef.current = true;
    setSelectedGroupId(v);
    stateRef.current.selectedGroupId = v;
    setScannedToday([]);
    scannedIdsRef.current.clear();
    processingRef.current.clear();
    // حساب التواريخ الصالحة وضبط التاريخ
    if (v) {
      const grp = stateRef.current.groups.find(g => g.id === v);
      if (grp) {
        const dates = getValidSessionDates(grp);
        setValidSessionDates(dates);
        const nearest = getNearestValidDate(grp);
        setSessionDate(nearest);
        stateRef.current.sessionDate = nearest;
      }
    } else {
      setValidSessionDates([]);
    }
    if (scanning) {
      await stopScanner();
      if (v) {
        setIsStarting(true);
        await startScanner(v);
        setIsStarting(false);
      }
    }
  }, [scanning, isStarting, stopScanner, startScanner]);

  const handleSessionDateChange = useCallback((date: string) => {
    if (validSessionDates.length && !validSessionDates.includes(date)) return;
    setCrossGroupConfirm(null); setScannerPaused(false);
    setSessionDateError(null);
    setSessionDate(date);
    stateRef.current.sessionDate = date;
    setScannedToday([]);
    scannedIdsRef.current.clear();
    processingRef.current.clear();
  }, [validSessionDates]);

  const handleConfirmCrossGroup = useCallback(async () => {
    if (!crossGroupConfirm) return;
    const st = crossGroupConfirm.student;
    scannedIdsRef.current.set(st.id, Date.now());
    setCrossGroupConfirm(null);
    try {
      const context = crossGroupConfirm.context;
      const saved = await commitAttendance(st, {...stateRef.current, ...context}, true);
      if(saved) showLastScan(saved.state === "queued" ? `${st.name} — في انتظار المزامنة` : st.name, saved.state === "saved", saved.state === "queued");
    } catch (e: unknown) {
      showLastScan(getErrorMessage(e, "حدث خطأ أثناء تسجيل الحضور."), false);
    } finally { setScannerPaused(false); }
  }, [crossGroupConfirm, showLastScan, commitAttendance]);

  const handleCancelCrossGroup = useCallback(() => {
    if (crossGroupConfirm) scannedIdsRef.current.set(crossGroupConfirm.student.id, Date.now());
    setCrossGroupConfirm(null);
    setScannerPaused(false);
  }, [crossGroupConfirm]);

  const handleRemoveScanned = useCallback(async (studentId: string) => {
    const { userId, sessionDate, scannedToday } = stateRef.current;
    const entry = scannedToday.find(e => e.studentId === studentId);
    if (!entry || !userId) return;
    try {
      if(entry.queued && AttendanceService.isSyncing()) throw new Error("انتظر انتهاء المزامنة قبل إلغاء الحضور");
      if(entry.queued && AttendanceQueue.getAll().some(r=>r.student_id===studentId && r.session_date===sessionDate)) AttendanceQueue.remove(studentId, sessionDate);
      else {
        if(!navigator.onLine) throw new Error("يلزم الاتصال لإلغاء سجل محفوظ");
        let id = entry.recordId;
        if(!id) {
          const rows = await api.get<{id?:string;_id?:string}[]>(`/attendance?session_date=${sessionDate}&student_id=${studentId}&status=present`);
          id = rows[0]?.id || rows[0]?._id;
        }
        if(id) await AttendanceService.deleteAttendanceRecord(id);
      }
      writesRevision.current++;
      if(stateRef.current.sessionDate!==sessionDate)return;
      setScannedToday(prev => prev.filter(e => e.studentId !== studentId));
      scannedIdsRef.current.delete(studentId); invalidateAllTimeCache();
    } catch(error) { showLastScan(getErrorMessage(error,"تعذر إلغاء الحضور"),false); }
  }, [showLastScan]);

  const manualPlaceholder = (() => {
    if (selectedGradeId && selectedGradeId !== "all") {
      const grade = grades.find(g => g.id === selectedGradeId);
      if (grade?.prefix) return `مثال: ${grade.prefix}1001`;
    }
    return "مثال: 10001";
  })();

  const groupCode = selectedGroupId
    ? (groups.find(g => g.id === selectedGroupId)?.code ?? null)
    : null;

  const groupStudentsCount = students.filter(s => s.group_id === selectedGroupId).length;

  // عدد الطلاب الحاضرين من مجموعات أخرى (cross-group)
  const crossGroupCount = scannedToday.filter(e => {
    const st = students.find(s => s.id === e.studentId);
    return st ? st.group_id !== selectedGroupId : false;
  }).length;

  const gradesWithGroups = grades.filter(gr => groups.some(g => g.grade_id === gr.id));

  return {
    loading, userId,
    groups, students, grades: gradesWithGroups,
    selectedGradeId, selectedGroupId, sessionDate,
    validSessionDates,
    scanning, isStarting, setIsStarting,
    scannedToday, lastScan,
    crossGroupConfirm, manualCode,
    manualPlaceholder, scannerDivId,
    groupStudentsCount,
    crossGroupCount,
    groupCode,
    manualMsg,
    sessionDateError,
    autoDetected,
    handleGradeChange, handleGroupChange, handleSessionDateChange,
    startScanner, stopScanner,
    handleManualSubmit,
    setManualCode,
    handleConfirmCrossGroup, handleCancelCrossGroup,
    handleRemoveScanned, refreshSessionAttendance,
  };
}
