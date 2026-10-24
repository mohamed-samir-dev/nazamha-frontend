"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { studentsForPeriod, contextGroups, AttendanceMembership, AttendanceContext } from "@/lib/utils/attendancePeriod";
import { AuthService } from "@/lib/services/authService";
import { Group, Student, Grade, AttendanceRecord } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { OfflineCache, AttendanceQueue } from "@/lib/offlineQueue";
import { mergeAttendance } from "@/lib/utils/attendanceResolution";
import { getTodayCairo, getYearCairo, getMonthCairo } from "@/lib/utils/dateUtils";
import { monthBounds, weekBounds, scheduledDates, withAttendanceGuests } from "../_utils/attendanceView";
import { useAttendanceClock } from "./useAttendanceClock";

export function useAttendanceData() {
  const now = useAttendanceClock();
  const today = getTodayCairo();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [memberships, setMemberships] = useState<AttendanceMembership[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(getMonthCairo);
  const [selectedYear, setSelectedYear] = useState(getYearCairo);
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<"week" | "month">("month");
  const [retry, setRetry] = useState(0);
  const [metadataVersion, setMetadataVersion] = useState(0);
  const request = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const mounted = useRef(true);
  const metadataWarning = useRef<string | null>(null);
  const latestContext = useRef<AttendanceContext | null>(null);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cachedGroups = OfflineCache.loadGroups(), cachedStudents = OfflineCache.loadStudents();
      const cachedContext = OfflineCache.loadAttendanceContext();
      setGroups(cachedGroups); setStudents(cachedStudents); setGrades(OfflineCache.loadGrades());
      if (cachedContext) { setMemberships(cachedContext.memberships); latestContext.current = cachedContext; setGroups(contextGroups(cachedGroups, cachedContext)); }
      try {
        const user = await AuthService.getUser();
        if (cancelled) return;
        if (!user) { setError("يرجى تسجيل الدخول"); return; }
        setUserId(user.id);
        if (navigator.onLine) {
          const results = await Promise.allSettled([
            GroupsService.getGroupsByTeacherId(retry > 0),
            StudentsService.getStudentsByTeacherId("id,name,code,center_student_code,card_qr_token,group_id,grade_id,is_suspended,suspended_until,suspension_reason,created_at,group_join_date", { fresh: retry > 0 }),
            GradesService.getGradesByTeacherId(user.id),
          ]);
          if (cancelled) return;
          const [gr, st, gd] = results;
          if (gr.status === "fulfilled") { const currentGroups = latestContext.current ? contextGroups(gr.value, latestContext.current) : gr.value; setGroups(currentGroups); OfflineCache.saveGroups(currentGroups); }
          if (st.status === "fulfilled") { setStudents(st.value); OfflineCache.saveStudents(st.value); }
          if (gd.status === "fulfilled") { setGrades(gd.value); OfflineCache.saveGrades(gd.value); }
          metadataWarning.current = results.some(r => r.status === "rejected") ? "تعذر تحديث بعض البيانات؛ المعروض نسخة محفوظة" : null;
        } else metadataWarning.current = "بدون اتصال — بيانات محفوظة";
        if (metadataWarning.current) { setStale(true); setError(metadataWarning.current); }
        if (retry > 0) setMetadataVersion(n => n + 1);
      } catch {
        if (!cancelled) setError("تعذر تحميل البيانات؛ حاول مرة أخرى");
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [retry]);

  const month = useMemo(() => monthBounds(selectedMonth, selectedYear), [selectedMonth, selectedYear]);
  const week = useMemo(() => weekBounds(today, weekOffset), [today, weekOffset]);
  const period = viewMode === "month" ? month : week;
  const keys = [...new Set([period.start.slice(0, 7), period.end.slice(0, 7), month.start.slice(0, 7)])].sort();
  const monthsKey = keys.join(",");
  const periodKey = `${userId}|${viewMode}|${period.start}|${period.end}|${monthsKey}|${metadataVersion}`;
  const activePeriod = useRef({ key: periodKey, loadedKey });
  useLayoutEffect(() => { activePeriod.current = { key: periodKey, loadedKey }; }, [periodKey, loadedKey]);
  const rangeStart = `${keys[0]}-01`, last = keys[keys.length - 1].split("-").map(Number);
  const rangeEnd = monthBounds(last[1], last[0]).end;

  const loadAttendance = useCallback(async () => {
    if (!userId) return;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const version = ++revision.current;
    setRefreshing(true);
    const active = () => mounted.current && !controller.signal.aborted && version === revision.current;
    try {
      const cached = OfflineCache.loadAttendanceRecords().filter(r => r.teacher_id === userId && monthsKey.includes(r.session_date.slice(0, 7)));
      let rows = cached;
      let incomplete = !navigator.onLine;
      if (navigator.onLine) {
        const contextRequest = AttendanceService.getContext({ start: rangeStart, end: rangeEnd, signal: controller.signal }).catch(() => null);
        const [results, context] = await Promise.all([Promise.allSettled(monthsKey.split(",").map(async key => {
          const [year, month] = key.split("-").map(Number);
          const records = await AttendanceService.getAttendanceRecords(month, year, { signal: controller.signal });
          return { month, year, records };
        })), contextRequest]);
        if (!active()) return;
        rows = results.flatMap((result, i) => result.status === "fulfilled" ? result.value.records : cached.filter(r => r.session_date.startsWith(monthsKey.split(",")[i])));
        incomplete = results.some(result => result.status === "rejected");
        for (const result of results) if (result.status === "fulfilled") OfflineCache.replaceAttendanceMonth(userId, result.value.month, result.value.year, result.value.records);
        if (context) {
          latestContext.current = context;
          setMemberships(context.memberships);
          setGroups(current => contextGroups(current, context));
          OfflineCache.saveAttendanceContext(context);
        } else incomplete = true;
      }
      if (!active()) return;
      const queued = AttendanceQueue.getAll().filter(q => q.teacher_id === userId && !q._error && monthsKey.includes(q.session_date.slice(0, 7))).map(q => ({ ...q, id: `offline-${q.student_id}-${q.group_id}-${q.session_date}`, created_at: q._queuedAt } as AttendanceRecord));
      setAttendance(mergeAttendance(rows, queued));
      setLoadedKey(periodKey);
      setStale(incomplete || !!metadataWarning.current);
      setError(incomplete ? "تعذر تأكيد أحدث البيانات — العرض فقط" : metadataWarning.current);
      if (!incomplete) OfflineCache.setLastSync();
    } catch {
      if (active()) { setStale(true); setError("تعذر تحديث الحضور؛ حاول مرة أخرى"); setLoadedKey(periodKey); }
    } finally { if (active()) setRefreshing(false); }
  }, [userId, monthsKey, periodKey, rangeStart, rangeEnd]);

  useEffect(() => { void Promise.resolve().then(loadAttendance); return () => request.current?.abort(); }, [loadAttendance]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => { void loadAttendance(); }, 150); };
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("attendance") : null;
    if (channel) channel.onmessage = refresh;
    window.addEventListener("online", refresh);
    window.addEventListener("attendance-queue-changed", refresh);
    return () => { clearTimeout(timer); channel?.close(); window.removeEventListener("online", refresh); window.removeEventListener("attendance-queue-changed", refresh); };
  }, [loadAttendance]);

  const updateGroupLocally = useCallback((updated: Group) => {
    setGroups(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated, attendance_sessions: g.attendance_sessions?.map(s => ({ ...s, cancelled: !!updated.cancelled_sessions?.includes(s.session_date) })) } : g));
    OfflineCache.saveGroups(OfflineCache.loadGroups().map(g => g.id === updated.id ? { ...g, ...updated } : g));
  }, []);
  const commitAttendance = useCallback((update: AttendanceRecord[] | ((rows: AttendanceRecord[]) => AttendanceRecord[])) => {
    if (activePeriod.current.key === activePeriod.current.loadedKey) {
      revision.current++;
      request.current?.abort();
      setRefreshing(false);
    }
    setAttendance(update);
  }, []);
  const periodStudents = useMemo(() => withAttendanceGuests(studentsForPeriod(students, memberships, period.start, period.end, attendance), students, groups, attendance, period.start, period.end), [students, memberships, groups, attendance, period.start, period.end]);
  const monthlyStudents = useMemo(() => withAttendanceGuests(studentsForPeriod(students, memberships, month.start, month.end, attendance), students, groups, attendance, month.start, month.end), [students, memberships, groups, attendance, month.start, month.end]);
  const groupMap = useMemo(() => new Map(groups.map(g => [g.id, g])), [groups]);
  const filter = useCallback((student: Student) => (selectedGradeId === "all" || (student.grade_id || groupMap.get(student.group_id || "")?.grade_id) === selectedGradeId) && (selectedGroupId === "all" || student.group_id === selectedGroupId), [selectedGradeId, selectedGroupId, groupMap]);
  const filteredStudents = useMemo(() => periodStudents.filter(filter).sort((a, b) => (a.code || "").localeCompare(b.code || "", "ar", { numeric: true })), [periodStudents, filter]);
  const filteredMonthly = useMemo(() => monthlyStudents.filter(filter), [monthlyStudents, filter]);
  const targetGroups = useMemo(() => groups.filter(g => (selectedGradeId === "all" || g.grade_id === selectedGradeId) && (selectedGroupId === "all" || g.id === selectedGroupId)), [groups, selectedGradeId, selectedGroupId]);
  const sessionDates = useMemo(() => [...new Set(targetGroups.flatMap(g => scheduledDates(g, period.start, period.end)))].sort(), [targetGroups, period.start, period.end]);
  const monthSessionDates = useMemo(() => [...new Set(targetGroups.flatMap(g => scheduledDates(g, month.start, month.end)))].sort(), [targetGroups, month.start, month.end]);
  const setReportPeriod = (value: string) => {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    const [year, month] = value.split("-").map(Number);
    if (year < 2000 || year > 2100 || month < 1 || month > 12) return;
    setSelectedMonth(month); setSelectedYear(year);
  };
  return {
    loading, refreshing, error, stale, userId, now, today, tableLoading: !!userId && loadedKey !== periodKey,
    readOnly: stale || refreshing || loadedKey !== periodKey, retry: () => { setError(null); setRetry(n => n + 1); },
    groups, setGroups, students, grades, attendance, setAttendance: commitAttendance, selectedGradeId, setSelectedGradeId,
    selectedGroupId, setSelectedGroupId, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
    weekOffset, setWeekOffset, viewMode, setViewMode, period, setReportPeriod, reportPeriod: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`,
    filteredStudents, monthlyStudents: filteredMonthly, sessionDates, monthSessionDates, loadAttendance, updateGroupLocally,
  };
}
