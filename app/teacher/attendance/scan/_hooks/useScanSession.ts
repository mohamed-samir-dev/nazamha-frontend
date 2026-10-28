"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import type { Html5Qrcode } from "html5-qrcode";
import { AuthService } from "@/lib/services/authService";
import { api } from "@/lib/apiClient";
import {
  Group,
  Student,
  Grade,
  ScannedEntry,
  AttendanceRecord,
} from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { AttendanceQueue, OfflineCache } from "@/lib/offlineQueue";
import { appCache } from "@/lib/appCache";
import { getErrorMessage, getCameraErrorMessage } from "@/lib/errors";
import {
  getTodayCairo,
  getDateCairo,
  getDayOfWeekCairo,
} from "@/lib/utils/dateUtils";
import { findStudentByQR } from "@/lib/utils/qrParser";
import { useScanSound } from "./useScanSound";
import { resolveManualStudent } from "../_utils/resolveManualStudent";
import {
  studentsForPeriod,
  contextGroups,
  type AttendanceContext,
} from "@/lib/utils/attendancePeriod";
import {
  cameraScanConfig,
  isCameraConstraintError,
} from "@/lib/cameraScanConfig";

const invalidateAllTimeCache = () =>
  appCache.invalidate("allTimeAttendanceMap");

export interface LastScan {
  name: string;
  success: boolean;
  pending?: boolean;
  info?: boolean;
}
export interface CrossGroupConfirm {
  validation?: import("@/lib/types").CrossGroupValidation;
  qrText?:string;
  manual?:boolean;
  context: {
    userId: string | null;
    selectedGroupId: string;
    sessionDate: string;
  };
  student: Student;
  originalGroupName: string;
  originalGroupSchedule: string;
  nextScheduledDate: string | null;
  scheduledDateIsToday: boolean;
  reason: string;
}

const SCAN_COOLDOWN_MS = 3000;
const DAYS_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

// استخراج أرقام الأيام (0=أحد..6=سبت) من حقل day_of_week النصي
export function parseGroupDayNumbers(day_of_week: string): number[] {
  if (!day_of_week) return [];
  return day_of_week
    .split(/\s*[,،]\s*/)
    .map((d) =>
      DAYS_AR.map((v) => v.replace(/[أإآ]/g, "ا")).indexOf(
        d.trim().replace(/[أإآ]/g, "ا"),
      ),
    )
    .filter((n) => n !== -1);
}

// حساب نطاق الأسبوع الحالي بتوقيت القاهرة (السبت 00:00:00 -> الجمعة 23:59:59)
export function getCurrentWeekRange(referenceDateStr?: string): { start: string; end: string } {
  const todayStr = referenceDateStr || getTodayCairo();
  const today = new Date(todayStr + "T00:00:00");
  const day = today.getDay(); // 0=أحد..6=سبت
  const diffToSat = day === 6 ? 0 : day + 1;
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - diffToSat);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return {
    start: formatDate(weekStart),
    end: formatDate(weekEnd),
  };
}

// توليد كل تواريخ حصص المجموعة في الشهر بالكامل (بما في ذلك الحصص الإضافية وحصص الأسبوع الحالي)
export function getMonthSessionDates(group: Group, month?: number, year?: number): string[] {
  const todayStr = getTodayCairo();
  const todayDate = new Date(todayStr + "T00:00:00");
  const targetMonth = month ?? (todayDate.getMonth() + 1);
  const targetYear = year ?? todayDate.getFullYear();

  const dayNums = parseGroupDayNumbers(group.day_of_week ?? "");
  const startDate = group.start_date ?? group.created_at?.slice(0, 10) ?? null;
  const cancelled = new Set(group.cancelled_sessions || []);
  const dates = new Set<string>();

  // 1. كل الحصص الدورية في الشهر المستهدف
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(targetYear, targetMonth - 1, day);
    if (dayNums.includes(d.getDay())) {
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if ((!startDate || dateStr >= startDate) && !cancelled.has(dateStr)) {
        dates.add(dateStr);
      }
    }
  }

  // 2. الحصص الإضافية في الشهر
  const monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, "0")}-`;
  const extraSessions = (group.attendance_sessions || []).filter(
    (s) => s.is_extra && !s.cancelled
  );
  for (const s of extraSessions) {
    if (
      s.session_date.startsWith(monthPrefix) &&
      (!startDate || s.session_date >= startDate) &&
      !cancelled.has(s.session_date)
    ) {
      dates.add(s.session_date);
    }
  }

  // 3. ضمان وجود حصص الأسبوع الحالي كاملة حتى لو امتد الأسبوع لبداية أو نهاية شهر آخر
  const { start: weekStartStr, end: weekEndStr } = getCurrentWeekRange(todayStr);
  const weekStart = new Date(weekStartStr + "T00:00:00");
  const weekEnd = new Date(weekEndStr + "T00:00:00");
  const cursor = new Date(weekStart);
  while (cursor <= weekEnd) {
    if (dayNums.includes(cursor.getDay())) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      if ((!startDate || dateStr >= startDate) && !cancelled.has(dateStr)) {
        dates.add(dateStr);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const s of extraSessions) {
    if (
      s.session_date >= weekStartStr &&
      s.session_date <= weekEndStr &&
      (!startDate || s.session_date >= startDate) &&
      !cancelled.has(s.session_date)
    ) {
      dates.add(s.session_date);
    }
  }

  return Array.from(dates).sort();
}

// توليد التواريخ المسموح بالتسجيل فيها (حصص الأسبوع الحالي فقط من السبت إلى الجمعة)
export function getValidSessionDates(group: Group): string[] {
  const allDates = getMonthSessionDates(group);
  const { start, end } = getCurrentWeekRange();
  return allDates.filter((d) => d >= start && d <= end);
}

// أقرب تاريخ صالح للمجموعة في الأسبوع الحالي
export function getNearestValidDate(group: Group): string {
  const dates = getValidSessionDates(group);
  const today = getTodayCairo();
  if (!dates.length) return group.start_date ?? today;
  // اليوم نفسه لو موجود في جدول المجموعة للأسبوع الحالي
  if (dates.includes(today)) return today;
  // أقرب يوم سابق في هذا الأسبوع
  const pastInWeek = dates.filter((d) => d <= today);
  if (pastInWeek.length) return pastInWeek[pastInWeek.length - 1];
  // أول يوم قادم في هذا الأسبوع (لو لسه ما بدأتش حصص الأسبوع)
  return dates[0];
}

function detectCurrentGroup(groups: Group[]): Group | null {
  const todayStr = getTodayCairo();
  const cairoNow = getDateCairo();
  const todayAr = DAYS_AR[getDayOfWeekCairo()];
  const nowMins = cairoNow.getHours() * 60 + cairoNow.getMinutes();
  const match = groups.find((g) => {
    if (!g.day_of_week || !g.time) return false;
    const startDate = g.start_date ?? g.created_at?.slice(0, 10) ?? null;
    if (startDate && todayStr < startDate) return false;
    if (
      !parseGroupDayNumbers(g.day_of_week).includes(DAYS_AR.indexOf(todayAr)) ||
      g.cancelled_sessions?.includes(todayStr)
    )
      return false;
    const [h, m] = g.time.split(":").map(Number);
    const gMins = h * 60 + m;
    return nowMins >= gMins - 5 && nowMins <= gMins + 20;
  });
  const matches = groups.filter((g) => {
    if (!g.time || !getValidSessionDates(g).includes(todayStr)) return false;
    const [h, m] = g.time.split(":").map(Number);
    return nowMins >= h * 60 + m - 5 && nowMins <= h * 60 + m + 20;
  });
  return matches.length === 1 ? (match ?? null) : null;
}

export function useScanSession() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadRevision, setLoadRevision] = useState(0);
  const [studentsReady, setStudentsReady] = useState(false);
  const studentsReadyRef = useRef(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [queuedScans, setQueuedScans] = useState(0);
  const [pastDateAcknowledged, setPastDateAcknowledged] = useState(false);
  const pastAcknowledgedRef = useRef(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const deletingRef = useRef(new Set<string>());
  const [attendanceContext, setAttendanceContext] =
    useState<AttendanceContext | null>(null);
  const [cameraTools, setCameraTools] = useState<{
    torch: boolean;
    zoom?: { min: number; max: number };
  }>({ torch: false });
  const [cameraDevices, setCameraDevices] = useState<
    { id: string; label: string }[]
  >([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const cameraDeviceRef = useRef("");
  const cameraStartSettled = useRef<Promise<void>>(Promise.resolve());
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { soundEnabled, soundReady, toggleSound, unlockSound, playSuccess } =
    useScanSound();
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const today = getTodayCairo();
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [sessionDate, setSessionDate] = useState(today);
  const [validSessionDates, setValidSessionDates] = useState<string[]>([]);
  const [monthSessionDates, setMonthSessionDates] = useState<string[]>([]);
  const [autoDetected, setAutoDetected] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [scannedToday, setScannedToday] = useState<ScannedEntry[]>([]);
  const [sessionRevision, setSessionRevision] = useState(0);
  const refreshSessionAttendance = useCallback(
    () => setSessionRevision((v) => v + 1),
    [],
  );
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [crossGroupConfirm, setCrossGroupConfirm] =
    useState<CrossGroupConfirm | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [sessionDateError, setSessionDateError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cameraGeneration = useRef(0);
  const epochRef = useRef(0);
  const operationRef = useRef(false);
  const confirmRef = useRef<CrossGroupConfirm | null>(null);
  const confirmationTextRef = useRef("");
  const queueRef = useRef<{ text: string; manual: boolean; epoch: number }[]>(
    [],
  );
  const activeTextRef = useRef("");
  const pumpRef = useRef<() => Promise<void>>(async () => {});
  const lastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writesRevision = useRef(0);
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
  const resetOperation = useCallback(() => {
    epochRef.current++;
    queueRef.current = [];
    setQueuedScans(0);
    confirmRef.current = null;
    setCrossGroupConfirm(null);
    setScannerPaused(false);
    pastAcknowledgedRef.current = false;
    setPastDateAcknowledged(false);
    setLastScan(null);
    stateRef.current.scannedToday = [];
    stateRef.current.scannerPaused = false;
    setScannedToday([]);
  }, []);
  const scannerDivId = "qr-reader";

  useEffect(() => {
    stateRef.current = {
      userId,
      selectedGroupId,
      scannerPaused,
      students,
      groups,
      grades,
      scannedToday,
      sessionDate,
    };
  }, [
    userId,
    selectedGroupId,
    scannerPaused,
    students,
    groups,
    grades,
    scannedToday,
    sessionDate,
  ]);
  useEffect(() => {
    if (
      (scanning || crossGroupConfirm) &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 900px)").matches
    ) {
      document
        .getElementById(scannerDivId)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [scanning, crossGroupConfirm]);

  const showLastScan = useCallback(
    (name: string, success: boolean, pending = false, info = false) => {
      if (lastTimer.current) clearTimeout(lastTimer.current);
      setLastScan({ name, success, pending, info });
      if (success) playSuccess();
      // Acknowledged saves disappear quickly. Errors remain until dismissed or the next operation.
      if (success || info)
        lastTimer.current = setTimeout(
          () => setLastScan(null),
          success ? 1400 : 2400,
        );
    },
    [playSuccess],
  );

  // ── startScanner ──────────────────────────────────────────────
  const startScanner = useCallback(
    async (groupId?: string) => {
      const gid = groupId ?? stateRef.current.selectedGroupId;
      const group = stateRef.current.groups.find((g) => g.id === gid);
      const date = stateRef.current.sessionDate;
      if (!gid || !group || !getValidSessionDates(group).includes(date)) {
        setSessionDateError("اختر جلسة صالحة قبل تشغيل الكاميرا");
        return;
      }
      if (date < getTodayCairo() && !pastAcknowledgedRef.current) {
        setSessionDateError("أكد التسجيل في الجلسة السابقة أولًا");
        return;
      }
      unlockSound();
      if (scannerRef.current) return;
      const generation = ++cameraGeneration.current;
      const previousStart = cameraStartSettled.current;
      let finishStart: () => void = () => {};
      cameraStartSettled.current = new Promise<void>((resolve) => {
        finishStart = resolve;
      });
      try {
        await previousStart;
        if (generation !== cameraGeneration.current) return;
        const deviceId = cameraDeviceRef.current;
        const config = cameraScanConfig(!deviceId);
        if (!deviceId)
          config.videoConstraints = {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          };
        const { Html5Qrcode: QrcodeClass } = await import("html5-qrcode");
        if (generation !== cameraGeneration.current) return;
        const qr = new QrcodeClass(scannerDivId);
        scannerRef.current = qr as unknown as Html5Qrcode;

        // FIX: استخدام handleQRSuccessRef بدل تكرار الكود
        const onScan = (decodedText: string) => {
          if (generation === cameraGeneration.current)
            handleQRSuccessRef.current(decodedText);
        };

        try {
          await qr.start(
            deviceId || { facingMode: "environment" },
            config,
            onScan,
            () => {},
          );
        } catch (error) {
          if (generation !== cameraGeneration.current) return;
          if (
            !isCameraConstraintError(error) &&
            !/NotFoundError|DevicesNotFoundError/.test(String(error))
          )
            throw error;
          const cameras = await QrcodeClass.getCameras();
          if (!cameras?.length) throw new Error("لا توجد كاميرا");
          const back = cameras.find((c) =>
            /back|rear|environment/i.test(c.label),
          );
          if (generation !== cameraGeneration.current) return;
          await qr.start(
            back ? back.id : cameras[cameras.length - 1].id,
            cameraScanConfig(false),
            onScan,
            () => {},
          );
        }
        if (generation !== cameraGeneration.current) {
          try {
            await qr.stop();
            qr.clear();
          } catch {}
          scannerRef.current = null;
          return;
        }
        setScanning(true);
        if (typeof QrcodeClass.getCameras === "function")
          void QrcodeClass.getCameras()
            .then((devices) => {
              if (generation === cameraGeneration.current)
                setCameraDevices(devices);
            })
            .catch(() => {});
        setTorchOn(false);
        try {
          const capabilities =
            qr.getRunningTrackCapabilities() as MediaTrackCapabilities & {
              torch?: boolean;
              zoom?: { min: number; max: number };
            };
          setCameraTools({
            torch: !!capabilities.torch,
            zoom: capabilities.zoom,
          });
          const settings =
            qr.getRunningTrackSettings() as MediaTrackSettings & {
              zoom?: number;
            };
          setZoom(settings.zoom ?? capabilities.zoom?.min ?? 1);
        } catch {
          setCameraTools({ torch: false });
        }
        const track = document
          .getElementById(scannerDivId)
          ?.querySelector("video")?.srcObject as MediaStream | null;
        track?.getVideoTracks?.().forEach((t) =>
          t.addEventListener(
            "ended",
            () => {
              if (generation === cameraGeneration.current) {
                scannerRef.current = null;
                setScanning(false);
                showLastScan(
                  "توقفت الكاميرا؛ اضغط تشغيل الكاميرا للاستئناف",
                  false,
                );
              }
            },
            { once: true },
          ),
        );
      } catch (err: unknown) {
        try {
          if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => {});
            scannerRef.current.clear();
          }
        } catch {}
        scannerRef.current = null;
        setScanning(false);
        if (generation === cameraGeneration.current) {
          showLastScan(getCameraErrorMessage(err), false);
        }
      } finally {
        finishStart();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [showLastScan, unlockSound],
  );

  const stopScanner = useCallback(async () => {
    cameraGeneration.current++;
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      try {
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    setCameraTools({ torch: false });
    setTorchOn(false);
  }, []);

  // ── Auto-detect: fills group/grade only, never touches camera ──
  const applyAutoDetect = useCallback((grpData: Group[]) => {
    const match = detectCurrentGroup(grpData);
    if (
      !match ||
      operationRef.current ||
      confirmRef.current ||
      scannerRef.current
    )
      return;
    if (match.id === autoGroupRef.current) return;
    autoGroupRef.current = match.id;
    stateRef.current.scannedToday = [];
    setScannedToday([]);
    scannedIdsRef.current.clear();
    setSelectedGroupId(match.id);
    if (match.grade_id) setSelectedGradeId(match.grade_id);
    setAutoDetected(true);
    stateRef.current.selectedGroupId = match.id;
    // ضبط التواريخ الصالحة وحصص الشهر
    const dates = getValidSessionDates(match);
    const monthDates = getMonthSessionDates(match);
    setValidSessionDates(dates);
    setMonthSessionDates(monthDates);
    const nearest = getNearestValidDate(match);
    setSessionDate(nearest);
    stateRef.current.sessionDate = nearest;
  }, []);

  // ── Load data on mount ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadError(null);
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
        if (cancelled) return;
        if (!currentUser) throw new Error("انتهت الجلسة؛ سجل الدخول مرة أخرى");
        setUserId(currentUser.id);
        stateRef.current.userId = currentUser.id;

        let grpData: Group[], stData: Student[], grdData: Grade[];
        if (navigator.onLine) {
          // A large student roster must not delay choosing a session or opening the online QR reader.
          const studentsRequest = Promise.allSettled([
            StudentsService.getStudentsByTeacherId(
              "id,name,code,center_student_code,group_id,grade_id,is_suspended,suspended_until,suspension_reason,created_at",
            ),
          ]);
          const [groupResult, gradeResult] = await Promise.allSettled([
            GroupsService.getGroupsByTeacherId(),
            GradesService.getGradesByTeacherId(currentUser.id),
          ]);
          if (cancelled) return;
          grpData =
            groupResult.status === "fulfilled"
              ? groupResult.value
              : OfflineCache.loadGroups();
          grdData =
            gradeResult.status === "fulfilled"
              ? gradeResult.value
              : OfflineCache.loadGrades();
          setGroups(grpData);
          setGrades(grdData);
          stateRef.current.groups = grpData;
          stateRef.current.grades = grdData;
          setLoading(false);
          const [studentResult] = await studentsRequest;
          if (cancelled) return;
          stData =
            studentResult.status === "fulfilled"
              ? studentResult.value
              : OfflineCache.loadStudents();
          studentsReadyRef.current = studentResult.status === "fulfilled";
          setStudentsReady(studentsReadyRef.current);
          const responses = [groupResult, studentResult, gradeResult];
          if (responses.some((r) => r.status === "rejected"))
            setLoadError(
              "تعذر تحديث بعض بيانات السكان؛ المتاح ظاهر أمامك. أعد المحاولة لتحديث البيانات.",
            );
          try {
            if (studentResult.status === "fulfilled")
              OfflineCache.saveStudents(stData);
            if (groupResult.status === "fulfilled")
              OfflineCache.saveGroups(grpData);
            if (gradeResult.status === "fulfilled")
              OfflineCache.saveGrades(grdData);
            OfflineCache.setLastSync();
          } catch {
            setLoadError(
              "تعذر حفظ نسخة البيانات على الجهاز؛ يلزم الإنترنت للتعرف على البطاقات.",
            );
          }
        } else {
          studentsReadyRef.current = true;
          setStudentsReady(true);
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
        setLoadError(
          getErrorMessage(e, "تعذر تحميل بيانات السكان؛ أعد المحاولة"),
        );
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRevision]);

  // keep latest applyAutoDetect in a ref so effects always call the fresh version
  const applyAutoDetectRef = useRef(applyAutoDetect);
  useEffect(() => {
    applyAutoDetectRef.current = applyAutoDetect;
  }, [applyAutoDetect]);

  const searchParams = useSearchParams();
  const urlGroupId = searchParams.get("group");

  const appliedUrlRef = useRef<string | null>(null);
  // ── Apply group from URL param (from dashboard "ابدأ الحضور" button) ──
  useEffect(() => {
    if (
      loading ||
      groups.length === 0 ||
      !urlGroupId ||
      appliedUrlRef.current === urlGroupId
    )
      return;
    const match = groups.find((g) => g.id === urlGroupId);
    if (!match) return;
    appliedUrlRef.current = urlGroupId;
    manualOverrideRef.current = true;
    autoGroupRef.current = match.id;
    stateRef.current.selectedGroupId = match.id;
    const dates = getValidSessionDates(match);
    const monthDates = getMonthSessionDates(match);
    const nearest = getNearestValidDate(match);
    Promise.resolve().then(() => {
      setSelectedGroupId(match.id);
      if (match.grade_id) setSelectedGradeId(match.grade_id);
      setAutoDetected(false);
      setValidSessionDates(dates);
      setMonthSessionDates(monthDates);
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
    if (!urlGroupId || !selectedGroupId || selectedGroupId !== urlGroupId)
      return;
    if (
      urlAutoStartedRef.current ||
      scanning ||
      scannerRef.current ||
      !validSessionDates.includes(sessionDate) ||
      sessionDate !== getTodayCairo()
    )
      return;
    urlAutoStartedRef.current = true;
    setIsStarting(true);
    startScanner(selectedGroupId).finally(() => setIsStarting(false));
  }, [
    urlGroupId,
    selectedGroupId,
    scanning,
    startScanner,
    validSessionDates,
    sessionDate,
  ]);

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

  // Load confirmed server records and the current device queue for this session.
  useEffect(() => {
    if (!userId || !selectedGroupId || !validSessionDates.includes(sessionDate))
      return;
    let active = true;
    const revisionAtStart = writesRevision.current;
    async function loadSessionAttendance() {
      if (navigator.onLine) {
        try {
          const records = await api.get<
            (AttendanceRecord & { _id?: string; student_name?: string })[]
          >(
            `/attendance?group_id=${selectedGroupId}&session_date=${sessionDate}&status=present`,
          );
          if (records && active) {
            setSessionDateError(null);
            if (revisionAtStart !== writesRevision.current) {
              refreshSessionAttendance();
              return;
            }
            OfflineCache.replaceAttendanceSession(
              userId!,
              selectedGroupId,
              sessionDate,
              records,
            );
            const currentStudents = stateRef.current.students;
            const entries: ScannedEntry[] = [...records]
              .sort((a, b) =>
                (b.created_at || "").localeCompare(a.created_at || ""),
              )
              .map((r) => {
                const st = currentStudents.find((s) => s.id === r.student_id);
                return {
                  recordId: r.id || r._id,
                  studentId: r.student_id,
                  studentName: st?.name ?? r.student_name ?? "طالب غير معروف",
                  time: r.created_at
                    ? new Date(r.created_at).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—",
                };
              });
            const queued = AttendanceQueue.getAll().filter(
              (r) =>
                r.teacher_id === userId &&
                (r.scanner_group_id || r.group_id) === selectedGroupId &&
                (r.scanner_session_date || r.session_date) === sessionDate,
            );
            entries.push(
              ...queued
                .filter(
                  (r) => !entries.some((e) => e.studentId === r.student_id),
                )
                .map((r) => ({
                  studentId: r.student_id,
                  studentName:
                    currentStudents.find((s) => s.id === r.student_id)?.name ||
                    "طالب",
                  queued: true,
                  time: new Date(r._queuedAt).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })),
            );
            stateRef.current.scannedToday = entries;
            setScannedToday(entries);
          }
        } catch {
          if (active)
            setSessionDateError(
              "تعذر تحميل سجل الجلسة؛ أعد المحاولة. الخادم سيظل يتحقق من تكرار التسجيل.",
            );
        }
      } else {
        const queued = AttendanceQueue.getAll().filter(
          (r) =>
            r.teacher_id === userId &&
            (r.scanner_group_id || r.group_id) === selectedGroupId &&
            (r.scanner_session_date || r.session_date) === sessionDate,
        );
        const cached = OfflineCache.loadAttendanceRecords()
          .filter(
            (r) =>
              r.teacher_id === userId &&
              r.status === "present" &&
              ((r.group_id === selectedGroupId &&
                r.session_date === sessionDate) ||
                (r.scanner_group_id === selectedGroupId &&
                  r.scanner_session_date === sessionDate)),
          )
          .map((r) => ({
            studentId: r.student_id,
            studentName:
              students.find((s) => s.id === r.student_id)?.name || "طالب",
            recordId: r.id,
            time: r.created_at
              ? new Date(r.created_at).toLocaleTimeString("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
          }));
        setScannedToday([
          ...cached,
          ...queued
            .filter((r) => !cached.some((c) => c.studentId === r.student_id))
            .map((r) => {
              const st = students.find((s) => s.id === r.student_id);
              return {
                queued: true,
                studentId: r.student_id,
                studentName: st?.name ?? "طالب غير معروف",
                time: new Date(r._queuedAt).toLocaleTimeString("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              };
            }),
        ]);
      }
    }
    loadSessionAttendance();
    return () => {
      active = false;
    };
  }, [
    userId,
    selectedGroupId,
    sessionDate,
    students,
    sessionRevision,
    validSessionDates,
  ]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    AttendanceService.getContext()
      .then((context) => {
        if (active && context?.memberships) {
          setAttendanceContext(context);
          setGroups((prev) => {
            const merged = contextGroups(prev, context);
            stateRef.current.groups = merged;
            const currentSelected = stateRef.current.selectedGroupId;
            if (currentSelected) {
              const currentGrp = merged.find((g) => g.id === currentSelected);
              if (currentGrp) {
                const dates = getValidSessionDates(currentGrp);
                const monthDates = getMonthSessionDates(currentGrp);
                setValidSessionDates(dates);
                setMonthSessionDates(monthDates);
              }
            }
            return merged;
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId, loadRevision]);

  useEffect(() => {
    const hide = () => {
      if (document.hidden) void stopScanner();
    };
    const pageHide = () => {
      void stopScanner();
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", pageHide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", pageHide);
    };
  }, [stopScanner]);

  useEffect(
    () => () => {
      epochRef.current++;
      queueRef.current = [];
      if (lastTimer.current) clearTimeout(lastTimer.current);
      void stopScanner();
    },
    [stopScanner],
  );

  // ── مساعد مشترك: تسجيل حضور طالب بعد التحقق ──────────────────
  const commitAttendance = useCallback(
    async (
      student: Student,
      context = { ...stateRef.current },
    confirmed = false,
    crossGroup?:{action:"guest"|"compensate"|"exempt";target_date?:string;reason?:string;qr_text?:string},
    qrText?:string,
    ) => {
      const { userId, sessionDate, selectedGroupId } = context;
      if (
        !getValidSessionDates(
          stateRef.current.groups.find((g) => g.id === selectedGroupId) ||
            ({ day_of_week: "" } as Group),
        ).includes(sessionDate)
      )
        throw new Error("الجلسة لم تعد متاحة؛ راجع تاريخ الحصة");
      if (
        stateRef.current.userId !== userId ||
        stateRef.current.sessionDate !== sessionDate ||
        stateRef.current.selectedGroupId !== selectedGroupId
      )
        throw new Error("تغيرت الجلسة؛ أعد مسح الطالب");
      if (!userId) throw new Error("يرجى تسجيل الدخول");
      // ── Backend will automatically use student's original group_id ──────────
      // We send student.group_id explicitly, but backend enforces it anyway
      const [syear, smonth] = sessionDate.split("-").map(Number);
      const saved = await AttendanceService.upsertAttendanceRecord({
        teacher_id: userId,
        student_id: student.id,
        group_id: student.group_id || "",
        scanner_group_id: selectedGroupId,
        cross_group_confirmed: confirmed,
      ...(crossGroup?{cross_group_action:crossGroup.action,target_date:crossGroup.target_date,reason:crossGroup.reason,qr_text:crossGroup.qr_text}:{qr_text:qrText}),
        session_date: sessionDate,
        month: smonth,
        year: syear,
        status: "present",
      });
      writesRevision.current++;
      invalidateAllTimeCache();
      if (
        stateRef.current.sessionDate !== sessionDate ||
        stateRef.current.selectedGroupId !== selectedGroupId
      )
        return;
      const entry: ScannedEntry = {
        studentId: student.id,
        studentName: student.name,
        recordId: saved.state === "saved" ? saved.record.id : undefined,
        queued: saved.state === "queued",
        time: new Date().toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      if (
        stateRef.current.sessionDate === sessionDate &&
        stateRef.current.selectedGroupId === selectedGroupId
      ) {
        stateRef.current.scannedToday = [
          entry,
          ...stateRef.current.scannedToday.filter(
            (e) => e.studentId !== student.id,
          ),
        ];
        setScannedToday(stateRef.current.scannedToday);
      }
      return saved;
    },
    [],
  );

  // One operation owns lookup, validation, confirmation and save. Different cards wait in order.
  const pump = useCallback(async () => {
    if (operationRef.current || confirmRef.current) return;
    const item = queueRef.current.shift();
    setQueuedScans(queueRef.current.length);
    if (!item) return;
    if (item.epoch !== epochRef.current) {
      void pumpRef.current();
      return;
    }
    operationRef.current = true;
    activeTextRef.current = item.text;
    const context = { ...stateRef.current };
    const active = () => item.epoch === epochRef.current;
    try {
      const group = context.groups.find(
        (g) => g.id === context.selectedGroupId,
      );
      if (
        !context.userId ||
        !group ||
        !getValidSessionDates(group).includes(context.sessionDate)
      )
        throw new Error("اختر جلسة متاحة أولًا");
      if (context.sessionDate < getTodayCairo() && !pastAcknowledgedRef.current)
        throw new Error("أكد التسجيل في الجلسة السابقة أولًا");
      setBusy("جاري التعرف على الطالب…");
      setLastScan(null);
      let student: Student | undefined;
      if (item.manual) {
        if (!studentsReadyRef.current)
          throw new Error(
            "انتظر اكتمال تحميل قائمة الطلاب أو أعد تحميلها قبل الإدخال اليدوي",
          );
        student = resolveManualStudent(context.students, item.text, group);
      }
      if (!student) {
        // فحص الذاكرة المحلية أولاً للاستجابة اللحظية (0ms) وتفادي انتظار الشبكة لكل طالب
        student = findStudentByQR(context.students, item.text);
        if (!student && navigator.onLine) {
          student = await StudentsService.getStudentByQR(item.text).catch(() => undefined);
        }
      }
      if (!active()) return;
      if (!student) throw new Error("الكود غير موجود؛ راجع كود الطالب كاملًا");
      if (
        student.is_suspended &&
        (!student.suspended_until ||
          new Date(student.suspended_until) > new Date())
      )
        throw new Error(
          `${student.name} — الطالب موقوف${student.suspension_reason ? " — " + student.suspension_reason : ""}`,
        );
      // فحص التكرار لجميع الطلاب سواء من نفس المجموعة أو من مجموعة أخرى لمنع تعليق الطابور بنافذة تأكيد
      if (
        stateRef.current.scannedToday.some((e) => e.studentId === student.id)
      ) {
        const queued = stateRef.current.scannedToday.some(
          (e) => e.studentId === student.id && e.queued,
        );
        showLastScan(
          `${student.name} — ${queued ? "مسجل على الجهاز وفي انتظار المزامنة" : "مسجل مسبقًا"}`,
          false,
          queued,
          !queued,
        );
        return;
      }
      if (student.group_id !== context.selectedGroupId) {
        setBusy(`جاري التحقق من حضور ${student.name}…`);
        const validation = await api.post<
          import("@/lib/types").CrossGroupValidation
        >("/attendance/validate-cross-group", {
          student_id: student.id,
          scanner_group_id: context.selectedGroupId,
          requested_date: context.sessionDate,
          teacher_id:context.userId,
          qr_text:item.manual?undefined:item.text,
        });
        if (!active()) return;
        if (validation.decision === "deny")
          throw new Error(`${student.name} — ${validation.reason}`);
        if (validation.decision === "confirm") {
          const confirmation = {
            validation,
            qrText:item.manual?undefined:item.text,
            manual:item.manual,
            student,
            context,
            originalGroupName: validation.studentGroupName,
            originalGroupSchedule: validation.studentGroupSchedule,
            nextScheduledDate: validation.nextScheduledDate,
            scheduledDateIsToday: validation.scheduledDateIsToday,
            reason: validation.reason,
          };
          confirmationTextRef.current = item.text;
          confirmRef.current = confirmation;
          setCrossGroupConfirm(confirmation);
          stateRef.current.scannerPaused = true;
          setScannerPaused(true);
          if (item.manual) setManualCode("");
          return;
        }
      }
      setBusy(`جاري تسجيل ${student.name}…`);
      const saved = await commitAttendance(student, context,false,undefined,item.manual?undefined:item.text);
      if (item.manual && active() && saved) setManualCode("");
      if (active() && saved)
        showLastScan(
          saved.state === "queued"
            ? `${student.name} — في انتظار المزامنة`
            : `تم تسجيل حضور ${student.name} · ${student.code || student.center_student_code || ""}`,
          saved.state === "saved",
          saved.state === "queued",
        );
    } catch (error) {
      if (active())
        showLastScan(
          getErrorMessage(error, "تعذر التسجيل؛ حاول مرة أخرى"),
          false,
        );
    } finally {
      operationRef.current = false;
      activeTextRef.current = "";
      setBusy(null);
      if (!confirmRef.current) void pumpRef.current();
    }
  }, [commitAttendance, showLastScan]);
  useLayoutEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const enqueue = useCallback(
    async (text: string, manual = false) => {
      text = text.trim();
      if (!text) return;
      if (confirmRef.current) return;
      const now = Date.now();
      if (
        activeTextRef.current === text ||
        queueRef.current.some((item) => item.text === text)
      )
        return;
      const last = scannedIdsRef.current.get(text);
      if (!manual && last && now - last < SCAN_COOLDOWN_MS) return;
      if (queueRef.current.length >= 5) {
        showLastScan(
          "طابور المسح ممتلئ؛ انتظر انتهاء التسجيل ثم أعد مسح البطاقة",
          false,
        );
        return;
      }
      scannedIdsRef.current.set(text, now);
      queueRef.current.push({ text, manual, epoch: epochRef.current });
      setQueuedScans(queueRef.current.length);
      await pumpRef.current();
    },
    [showLastScan],
  );
  useLayoutEffect(() => {
    handleQRSuccessRef.current = (text) => {
      void enqueue(text);
    };
  }, [enqueue]);

  const handleManualSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      unlockSound();
      if (operationRef.current || confirmRef.current) {
        showLastScan(
          "انتظر اكتمال تسجيل الطالب الحالي أو راجع تأكيده",
          false,
          false,
          true,
        );
        return;
      }
      if (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 900px)").matches
      )
        document.getElementById(scannerDivId)?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "center",
        });
      await enqueue(manualCode, true);
    },
    [manualCode, enqueue, unlockSound, showLastScan],
  );

  // FIX: handleGradeChange async مع await stopScanner
  const handleGradeChange = useCallback(
    async (v: string) => {
      manualOverrideRef.current = true;
      resetOperation();
      stateRef.current.selectedGroupId = "";
      await stopScanner();
      setValidSessionDates([]);
      setMonthSessionDates([]);
      setSelectedGradeId(v);
      setSelectedGroupId("");
      setScannedToday([]);
      scannedIdsRef.current.clear();
    },
    [stopScanner, resetOperation],
  );

  const handleGroupChange = useCallback(
    async (v: string) => {
      resetOperation();
      setSessionDateError(null);
      if (isStarting) await stopScanner();
      autoGroupRef.current = null;
      manualOverrideRef.current = true;
      setSelectedGroupId(v);
      stateRef.current.selectedGroupId = v;
      setScannedToday([]);
      scannedIdsRef.current.clear();
      // حساب التواريخ الصالحة وضبط التاريخ
      if (v) {
        const grp = stateRef.current.groups.find((g) => g.id === v);
        if (grp) {
          if (grp.grade_id) setSelectedGradeId(grp.grade_id);
          const dates = getValidSessionDates(grp);
          const monthDates = getMonthSessionDates(grp);
          setValidSessionDates(dates);
          setMonthSessionDates(monthDates);
          const nearest = getNearestValidDate(grp);
          setSessionDate(nearest);
          stateRef.current.sessionDate = nearest;
        }
      } else {
        setValidSessionDates([]);
        setMonthSessionDates([]);
      }
      if (scanning) {
        await stopScanner();
        if (v && stateRef.current.sessionDate === getTodayCairo()) {
          setIsStarting(true);
          await startScanner(v);
          setIsStarting(false);
        }
      }
    },
    [scanning, isStarting, stopScanner, startScanner, resetOperation],
  );

  const handleSessionDateChange = useCallback(
    (date: string) => {
      const group = stateRef.current.groups.find(
        (g) => g.id === stateRef.current.selectedGroupId,
      );
      if (!group) return;

      const { start: weekStart, end: weekEnd } = getCurrentWeekRange();

      // 1. حصة مستقبلية بعد نهاية الأسبوع الحالي
      if (date > weekEnd) {
        const msg = "غير مسموح بتسجيل او تعديل غياب حصه مستقبليه";
        setSessionDateError(msg);
        showLastScan(msg, false);
        return;
      }

      // 2. حصة من أسبوع منتهي قبل بداية الأسبوع الحالي
      if (date < weekStart) {
        const msg = "أسبوع منتهي — غير مسموح بتسجيل أو تعديل غياب حصة في أسبوع منتهي";
        setSessionDateError(msg);
        showLastScan(msg, false);
        return;
      }

      // 3. التأكد من أن الحصة متاحة في جدول الأسبوع الحالي
      const currentValid = getValidSessionDates(group);
      if (!currentValid.includes(date)) {
        const msg = "هذه الحصة غير متاحة في جدول المجموعة لهذا الأسبوع";
        setSessionDateError(msg);
        showLastScan(msg, false);
        return;
      }

      void stopScanner();
      resetOperation();
      setSessionDateError(null);
      setSessionDate(date);
      stateRef.current.sessionDate = date;
      setScannedToday([]);
      scannedIdsRef.current.clear();
    },
    [stopScanner, resetOperation, showLastScan],
  );

  const handleConfirmCrossGroup = useCallback(async (choice?:{action:"guest"|"compensate"|"exempt";target_date?:string;reason?:string}) => {
    const confirmation = confirmRef.current;
    if (!confirmation || operationRef.current) return;
    unlockSound();
    operationRef.current = true;
    const epoch = epochRef.current;
    setBusy(`جاري تسجيل ${confirmation.student.name}…`);
    try {
      if(!choice)throw new Error("اختر طريقة تسجيل الحضور أولًا");
      if(!navigator.onLine)throw new Error("التعويض والحضور خارج المجموعة يحتاجان اتصالًا للتحقق والحفظ");
      const saved = await commitAttendance(
        confirmation.student,
        { ...stateRef.current, ...confirmation.context },
        true,
        {...choice,qr_text:confirmation.qrText},
      );
      if (epoch === epochRef.current && saved)
        showLastScan(
          saved.state === "queued"
            ? `${confirmation.student.name} — في انتظار المزامنة`
            : choice.action==="guest"?`تم تسجيل ${confirmation.student.name} كضيف. لم تتغير أي حصة أخرى.`:choice.action==="compensate"?`تم الحضور وتعويض غياب الحصة ${choice.target_date}. سجل الغياب الأصلي محفوظ.`:`تم الحضور وإعفاء الحصة ${choice.target_date} من الغياب، دون تسجيل حضور فعلي لها.`,
          saved.state === "saved",
          saved.state === "queued",
        );
      if (epoch === epochRef.current) {
        scannedIdsRef.current.set(confirmationTextRef.current, Date.now());
        confirmRef.current = null;
        setCrossGroupConfirm(null);
        setScannerPaused(false);
        stateRef.current.scannerPaused = false;
      }
    } catch (error) {
      if (epoch === epochRef.current)
        showLastScan(
          getErrorMessage(error, "تعذر التسجيل؛ أعد المحاولة أو ألغِ التأكيد"),
          false,
        );
    } finally {
      operationRef.current = false;
      setBusy(null);
      if (!confirmRef.current) void pumpRef.current();
    }
  }, [commitAttendance, showLastScan, unlockSound]);
  const handleCancelCrossGroup = useCallback(() => {
    if (operationRef.current) return;
    scannedIdsRef.current.set(confirmationTextRef.current, Date.now());
    confirmRef.current = null;
    setCrossGroupConfirm(null);
    setScannerPaused(false);
    stateRef.current.scannerPaused = false;
    setLastScan(null);
    void pumpRef.current();
  }, []);

  const handleRemoveScanned = useCallback(
    async (studentId: string) => {
      const { userId, sessionDate, selectedGroupId, scannedToday } =
        stateRef.current;
      const entry = scannedToday.find((e) => e.studentId === studentId);
      if (!entry || !userId || deletingRef.current.has(studentId)) return;
      if (
        !window.confirm(
          `إلغاء حضور ${entry.studentName} بتاريخ ${sessionDate}؟`,
        )
      )
        return;
      deletingRef.current.add(studentId);
      setDeletingIds([...deletingRef.current]);
      try {
        if (entry.queued && AttendanceService.isSyncing())
          throw new Error("انتظر انتهاء المزامنة قبل إلغاء الحضور");
        const queuedRecord = AttendanceQueue.getAll().find(
          (r) =>
            r.teacher_id === userId &&
            r.student_id === studentId &&
            (r.scanner_group_id || r.group_id) === selectedGroupId &&
            (r.scanner_session_date || r.session_date) === sessionDate,
        );
        if (entry.queued && queuedRecord)
          AttendanceQueue.remove(studentId, queuedRecord.session_date);
        else {
          if (!navigator.onLine)
            throw new Error("يلزم الاتصال لإلغاء سجل محفوظ");
          let id = entry.recordId;
          if (!id) {
            const rows = await api.get<{ id?: string; _id?: string }[]>(
              `/attendance?session_date=${sessionDate}&student_id=${studentId}&status=present`,
            );
            id = rows[0]?.id || rows[0]?._id;
          }
          if (!id)
            throw new Error(
              "تعذر تحديد سجل الحضور؛ أعد تحميل الجلسة قبل الإلغاء",
            );
          await AttendanceService.deleteAttendanceRecord(id);
        }
        writesRevision.current++;
        if (
          stateRef.current.sessionDate !== sessionDate ||
          stateRef.current.selectedGroupId !== selectedGroupId
        )
          return;
        stateRef.current.scannedToday = stateRef.current.scannedToday.filter(
          (e) => e.studentId !== studentId,
        );
        setScannedToday(stateRef.current.scannedToday);
        scannedIdsRef.current.clear();
        invalidateAllTimeCache();
      } catch (error) {
        showLastScan(getErrorMessage(error, "تعذر إلغاء الحضور"), false);
      } finally {
        deletingRef.current.delete(studentId);
        setDeletingIds([...deletingRef.current]);
      }
    },
    [showLastScan],
  );

  const manualPlaceholder = (() => {
    if (selectedGradeId && selectedGradeId !== "all") {
      const grade = grades.find((g) => g.id === selectedGradeId);
      if (grade?.prefix) return `مثال: ${grade.prefix}1001`;
    }
    return "مثال: 10001";
  })();

  const groupCode = selectedGroupId
    ? (groups.find((g) => g.id === selectedGroupId)?.code ?? null)
    : null;

  const studentMap = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students],
  );
  const eligibleStudents = useMemo(
    () =>
      studentsForPeriod(
        students,
        attendanceContext?.memberships || [],
        sessionDate,
        sessionDate,
      ).filter(
        (s) =>
          s.group_id === selectedGroupId &&
          (!s.created_at || s.created_at.slice(0, 10) <= sessionDate) &&
          (sessionDate !== getTodayCairo() ||
            !s.is_suspended ||
            (!!s.suspended_until && new Date(s.suspended_until) <= new Date())),
      ),
    [students, attendanceContext, selectedGroupId, sessionDate],
  );
  const groupStudentsCount = eligibleStudents.length;
  const remainingCount = useMemo(() => {
    const ids = new Set(scannedToday.map((e) => e.studentId));
    return eligibleStudents.filter((s) => !ids.has(s.id)).length;
  }, [eligibleStudents, scannedToday]);
  const crossGroupCount = useMemo(
    () =>
      scannedToday.filter(
        (e) => studentMap.get(e.studentId)?.group_id !== selectedGroupId,
      ).length,
    [scannedToday, studentMap, selectedGroupId],
  );

  const acknowledgePastDate = () => {
    pastAcknowledgedRef.current = true;
    setPastDateAcknowledged(true);
    setSessionDateError(null);
  };
  const applyCameraTool = async (constraint: MediaTrackConstraints) => {
    try {
      await scannerRef.current?.applyVideoConstraints(constraint);
    } catch {
      showLastScan("الجهاز لا يدعم ضبط الكاميرا المطلوب", false);
    }
  };
  const toggleTorch = async () => {
    const next = !torchOn;
    try {
      await scannerRef.current?.applyVideoConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      showLastScan("تعذر تشغيل الفلاش على هذا الجهاز", false);
    }
  };

  const gradesWithGroups = grades.filter((gr) =>
    groups.some((g) => g.grade_id === gr.id),
  );

  return {
    loading,
    userId,
    studentsReady,
    loadError,
    retryLoad: () => setLoadRevision((v) => v + 1),
    busy,
    queuedScans,
    pastDateAcknowledged,
    acknowledgePastDate,
    remainingCount,
    deletingIds,
    soundEnabled,
    soundReady,
    toggleSound,
    unlockSound,
    cameraTools,
    torchOn,
    toggleTorch,
    zoom,
    cameraDevices,
    selectedCameraId,
    switchCamera: async (id: string) => {
      if (operationRef.current || confirmRef.current || isStarting) return;
      setIsStarting(true);
      try {
        await stopScanner();
        cameraDeviceRef.current = id;
        setSelectedCameraId(id);
        await startScanner();
      } finally {
        setIsStarting(false);
      }
    },
    setCameraZoom: async (value: number) => {
      setZoom(value);
      await applyCameraTool({
        advanced: [{ zoom: value } as MediaTrackConstraintSet],
      });
    },
    dismissLastScan: () => setLastScan(null),
    groups,
    students,
    grades: gradesWithGroups,
    selectedGradeId,
    selectedGroupId,
    sessionDate,
    validSessionDates,
    monthSessionDates,
    scanning,
    isStarting,
    setIsStarting,
    scannedToday,
    lastScan,
    crossGroupConfirm,
    manualCode,
    manualPlaceholder,
    scannerDivId,
    groupStudentsCount,
    crossGroupCount,
    groupCode,
    sessionDateError,
    autoDetected,
    handleGradeChange,
    handleGroupChange,
    handleSessionDateChange,
    startScanner,
    stopScanner,
    handleManualSubmit,
    setManualCode,
    handleConfirmCrossGroup,
    handleCancelCrossGroup,
    handleRemoveScanned,
    refreshSessionAttendance,
  };
}
