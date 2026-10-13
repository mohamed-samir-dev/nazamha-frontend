"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { Html5Qrcode } from "html5-qrcode";
import { AuthService } from "@/lib/services/authService";
import { api } from "@/lib/apiClient";
import { Group, Student, Grade, ScannedEntry } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { AttendanceQueue, OfflineCache } from "@/lib/offlineQueue";
import { appCache } from "@/lib/appCache";
import { getErrorMessage, getCameraErrorMessage } from "@/lib/errors";
import { getTodayCairo, getDateCairo, getDayOfWeekCairo } from "@/lib/utils/dateUtils";
import { findStudentByQR } from "@/lib/utils/qrParser";

const invalidateAllTimeCache = () => appCache.invalidate("allTimeAttendanceMap");

export interface LastScan { name: string; success: boolean; }
export interface CrossGroupConfirm {
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
    .map(d => DAYS_AR.indexOf(d.trim()))
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
      if (!startDate || dateStr >= startDate) dates.push(dateStr);
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
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [crossGroupConfirm, setCrossGroupConfirm] = useState<CrossGroupConfirm | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [manualMsg, setManualMsg] = useState<{ text: string; type: "success" | "error" | "warn" } | null>(null);
  const [sessionDateError, setSessionDateError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
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

  const showLastScan = useCallback((name: string, success: boolean) => {
    setLastScan({ name, success });
    setTimeout(() => setLastScan(null), 2500);
  }, []);

  // ── startScanner ──────────────────────────────────────────────
  const startScanner = useCallback(async (groupId?: string) => {
    const gid = groupId ?? stateRef.current.selectedGroupId;
    if (!gid || scannerRef.current) return;
    try {
      const config = { fps: 6, qrbox: { width: 220, height: 220 } };
      const { Html5Qrcode: QrcodeClass } = await import("html5-qrcode");
      const qr = new QrcodeClass(scannerDivId);
      scannerRef.current = qr as unknown as Html5Qrcode;

      // FIX: استخدام handleQRSuccessRef بدل تكرار الكود
      const onScan = (decodedText: string) => handleQRSuccessRef.current(decodedText);

      try {
        await qr.start({ facingMode: "environment" }, config, onScan, () => {});
      } catch {
        const cameras = await QrcodeClass.getCameras();
        if (!cameras?.length) throw new Error("لا توجد كاميرا");
        const back = cameras.find(c => /back|rear|environment/i.test(c.label));
        await qr.start(back ? back.id : cameras[cameras.length - 1].id, config, onScan, () => {});
      }
      setScanning(true);
    } catch (err: unknown) {
      scannerRef.current = null;
      showLastScan(getCameraErrorMessage(err), false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLastScan]);

  const stopScanner = useCallback(async () => {
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
    async function loadSessionAttendance() {
      if (navigator.onLine) {
        try {
          const records = await api.get<{ student_id: string; created_at: string; student_name?: string }[]>(
            `/attendance?group_id=${selectedGroupId}&session_date=${sessionDate}&status=present`
          );
          if (records) {
            const currentStudents = stateRef.current.students;
            setScannedToday(records.map(r => {
              const st = currentStudents.find(s => s.id === r.student_id);
              return {
                studentId: r.student_id,
                studentName: st?.name ?? r.student_name ?? "طالب غير معروف",
                time: new Date(r.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
              };
            }));
          }
        } catch {}
      } else {
        const queued = AttendanceQueue.getAll().filter(r => r.group_id === selectedGroupId && r.session_date === sessionDate);
        setScannedToday(queued.map(r => {
          const st = students.find(s => s.id === r.student_id);
          return {
            studentId: r.student_id,
            studentName: st?.name ?? "طالب غير معروف",
            time: new Date(r._queuedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          };
        }));
      }
    }
    loadSessionAttendance();
  }, [userId, selectedGroupId, sessionDate, students]);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
        try { scannerRef.current.clear(); } catch {}
      }
    };
  }, []);

  // ── مساعد مشترك: تسجيل حضور طالب بعد التحقق ──────────────────
  const commitAttendance = useCallback(async (
    student: Student,
  ) => {
    const { userId, sessionDate } = stateRef.current;
    if (!userId) return;
    // ── Backend will automatically use student's original group_id ──────────
    // We send student.group_id explicitly, but backend enforces it anyway
    const [syear, smonth] = sessionDate.split("-").map(Number);
    await AttendanceService.upsertAttendanceRecord({
      teacher_id: userId, student_id: student.id,
      group_id: student.group_id || "", // Backend overrides this with student's actual group
      session_date: sessionDate,
      month: smonth, year: syear, status: "present",
    });
    invalidateAllTimeCache();
    const entry: ScannedEntry = {
      studentId: student.id, studentName: student.name,
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };
    setScannedToday(prev => prev.some(e => e.studentId === student.id) ? prev : [entry, ...prev]);
  }, [showLastScan]);

  const handleQRSuccess = useCallback(async (decodedText: string) => {
    const { userId, scannerPaused, students, groups, grades, scannedToday, selectedGroupId, sessionDate } = stateRef.current;
    if (!userId || scannerPaused) return;
    
    const nowMs = Date.now();
    // support center QR (/report/c/{code}), legacy URL (/report/{id}), and raw ID
    let scannedStudent: Student | undefined;
    try {
      scannedStudent = navigator.onLine
        ? await StudentsService.getStudentByQR(decodedText)
        : findStudentByQR(students, decodedText);
    } catch (error) { showLastScan(getErrorMessage(error), false); return; }
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

        if (validation.decision === "deny") {
          processingRef.current.delete(studentId);
          showLastScan(`${student.name} — ${validation.reason}`, false);
          return;
        }

        if (validation.decision === "confirm") {
          setScannerPaused(true);
          setCrossGroupConfirm({
            student,
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
      await commitAttendance(student);
      showLastScan(student.name, true);
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
    setManualMsg({ text, type });
    setTimeout(() => setManualMsg(null), 3000);
  }, []);

  const handleManualSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const { userId, students, groups, scannedToday, selectedGroupId, sessionDate } = stateRef.current;
    if (!userId) return;
    
    const group = groups.find(g => g.id === selectedGroupId);
    const fullCode = group?.code ? `${group.code}-${manualCode.trim()}` : manualCode.trim();
    const student = students.find(s => s.code === fullCode) ?? students.find(s => s.code === manualCode.trim());
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

        if (validation.decision === "deny") {
          showManualMsg(`${student.name} — ${validation.reason}`, "error");
          setManualCode("");
          return;
        }

        if (validation.decision === "confirm") {
          setScannerPaused(true);
          setCrossGroupConfirm({
            student,
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
      await commitAttendance(student);
      showManualMsg(`تم تسجيل ${student.name}`, "success");
      setManualCode("");
    } catch (err: unknown) {
      showManualMsg(getErrorMessage(err, "حدث خطأ أثناء تسجيل الحضور. حاول مرة أخرى."), "error");
    }
  }, [manualCode, showManualMsg, commitAttendance]);

  // FIX: handleGradeChange async مع await stopScanner
  const handleGradeChange = useCallback(async (v: string) => {
    manualOverrideRef.current = true;
    setSelectedGradeId(v);
    setSelectedGroupId("");
    if (scanning) await stopScanner();
    setScannedToday([]);
    scannedIdsRef.current.clear();
    processingRef.current.clear();
  }, [scanning, stopScanner]);

  const handleGroupChange = useCallback(async (v: string) => {
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
  }, [scanning, stopScanner, startScanner]);

  const handleSessionDateChange = useCallback((date: string) => {
    if (validSessionDates.length && !validSessionDates.includes(date)) return;
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
    setScannerPaused(false);
    try {
      await commitAttendance(st);
      showLastScan(st.name, true);
    } catch (e: unknown) {
      showLastScan(getErrorMessage(e, "حدث خطأ أثناء تسجيل الحضور."), false);
    }
  }, [crossGroupConfirm, showLastScan, commitAttendance]);

  const handleCancelCrossGroup = useCallback(() => {
    if (crossGroupConfirm) scannedIdsRef.current.set(crossGroupConfirm.student.id, Date.now());
    setCrossGroupConfirm(null);
    setScannerPaused(false);
  }, [crossGroupConfirm]);

  const handleRemoveScanned = useCallback(async (studentId: string) => {
    const { userId, selectedGroupId, sessionDate } = stateRef.current;
    setScannedToday(prev => prev.filter(e => e.studentId !== studentId));
    scannedIdsRef.current.delete(studentId);
    if (navigator.onLine && userId) {
      try {
        const records = await api.get<{ id: string; _id?: string; student_id: string }[]>(
          `/attendance?group_id=${selectedGroupId}&session_date=${sessionDate}&student_id=${studentId}&status=present`
        );
        const record = records?.[0];
        const recordId = record?.id ?? record?._id;
        if (recordId) {
          await AttendanceService.deleteAttendanceRecord(recordId);
          invalidateAllTimeCache();
          new BroadcastChannel("attendance").postMessage("refresh");
        }
      } catch { /* silent */ }
    } else {
      AttendanceQueue.remove(studentId, sessionDate);
    }
  }, []);

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
    handleRemoveScanned,
  };
}
