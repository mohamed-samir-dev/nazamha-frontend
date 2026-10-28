"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { studentsForPeriod, contextGroups, AttendanceMembership } from "@/lib/utils/attendancePeriod";
import { AuthService } from "@/lib/services/authService";
import { Group, Student, Grade, AttendanceRecord } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { OfflineCache, AttendanceQueue } from "@/lib/offlineQueue";
import { getGroupSessionDatesForWeek, getGroupSessionDates } from "../_utils/sessionDates";
import { getTodayCairo, getYearCairo, getMonthCairo } from "@/lib/utils/dateUtils";

export function useAttendanceData(currentMonthOnly = false) {

  const [todayYear, todayMonth] = [getYearCairo(), getMonthCairo()];
  const [loading, setLoading] = useState(true);
  const [loadedWeek,setLoadedWeek]=useState<number|null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [memberships,setMemberships]=useState<AttendanceMembership[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);
  const [selectedYear, setSelectedYear] = useState(todayYear);
  const [weekOffset, setWeekOffset] = useState(0);

  const fetchAttendance = useCallback(async (uid: string, offset: number, signal?: AbortSignal) => {
    const todayStr = getTodayCairo();
    const today = new Date(todayStr + "T00:00:00");
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diffToSat = day === 6 ? 0 : day + 1;
    weekStart.setDate(weekStart.getDate() - diffToSat + offset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);


    const months = new Set<string>();
    if(currentMonthOnly) months.add(`${getYearCairo()}-${getMonthCairo()}`);
    else {months.add(`${weekStart.getFullYear()}-${weekStart.getMonth() + 1}`);months.add(`${weekEnd.getFullYear()}-${weekEnd.getMonth() + 1}`);}

    const results = await Promise.all(
      Array.from(months).map(key => {
        const [y, m] = key.split("-").map(Number);
        return navigator.onLine ? AttendanceService.getAttendanceRecords(m, y).then(rows=>{OfflineCache.replaceAttendanceMonth(uid,m,y,rows);return rows;}) : Promise.resolve(OfflineCache.loadAttendanceRecords().filter(r=>r.teacher_id===uid && r.month===m && r.year===y));
      })
    );
    if (signal?.aborted) return;
    setSelectedMonth(currentMonthOnly?getMonthCairo():weekEnd.getMonth()+1); setSelectedYear(currentMonthOnly?getYearCairo():weekEnd.getFullYear());
    const allRecords = results.flat();
    const queued = AttendanceQueue.getAll().filter(q => q.teacher_id === uid && !q._error);
    const merged = [...allRecords];
    for (const q of queued) {
      const existing = merged.findIndex(r => r.student_id === q.student_id && r.session_date === q.session_date);
      if (existing >= 0) merged.splice(existing,1);
      {
        merged.push({ ...q, id: `offline-${q.student_id}-${q.session_date}`, created_at: q._queuedAt } as AttendanceRecord);
      }
    }
    return merged;
  }, [currentMonthOnly]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // عرض الـ cache فوراً بدون انتظار الـ network
        const cachedGroups = OfflineCache.loadGroups();
        const cachedStudents = OfflineCache.loadStudents();
        const cachedGrades = OfflineCache.loadGrades();
        const cachedContext=OfflineCache.loadAttendanceContext();
        if(cachedContext) setMemberships(cachedContext.memberships);
        if (cachedGroups.length || cachedStudents.length) {
          setGroups(cachedGroups);
          setStudents(cachedStudents);
          setGrades(cachedGrades);
        }

        // getUser يستخدم in-memory cache (5 دقائق) — لا waterfall حقيقي
        const currentUser = await AuthService.getUser();
        if (!currentUser) { setError("يرجى تسجيل الدخول"); setLoading(false); return; }
        if (cancelled) return;
        setUserId(currentUser.id);

        if (navigator.onLine) {

          const [grpData, stData, grdData, initialAtt, context] = await Promise.all([
            GroupsService.getGroupsByTeacherId(),
            StudentsService.getStudentsByTeacherId("id,name,code,center_student_code,group_id,grade_id,is_suspended,suspended_until,suspension_reason,created_at,group_join_date"),
            GradesService.getGradesByTeacherId(currentUser.id),
            fetchAttendance(currentUser.id, 0), AttendanceService.getContext(),
          ]);
          if (cancelled) return;
          setGroups(contextGroups(grpData,context)); setMemberships(context.memberships);
          OfflineCache.saveAttendanceContext(context);
          setStudents(stData);
          setGrades(grdData);
          setAttendance(initialAtt || []);
          setLoadedWeek(0);
          OfflineCache.saveStudents(stData);
          OfflineCache.saveGroups(contextGroups(grpData,context));
          OfflineCache.saveGrades(grdData);
          OfflineCache.setLastSync();
        }
      } catch {
        if (!cancelled) {
          if(navigator.onLine) setError("تعذر تحميل بيانات الحضور؛ أعد المحاولة.");
          setGroups(OfflineCache.loadGroups());
          setStudents(OfflineCache.loadStudents());
          setGrades(OfflineCache.loadGrades());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchAttendance]);


  // إعادة جلب الـ attendance عند تغيير الأسبوع (weekOffset)
  useEffect(() => {
    if (!userId) return; // weekOffset=0 جُلب بالفعل في load()
    const controller = new AbortController();

    fetchAttendance(userId, weekOffset, controller.signal)
      .then(merged => { if (merged) { setAttendance(merged); setLoadedWeek(weekOffset); } })
      .catch(() => { if (!controller?.signal.aborted) setError("تعذر تحميل الحضور؛ أعد فتح الصفحة للمحاولة."); });
    return () => controller.abort();
  }, [userId, weekOffset, fetchAttendance]);

  // استماع على تحديثات صفحة السكان
  useEffect(() => {
    if (!userId) return;
    const bc = new BroadcastChannel("attendance");
    let controller: AbortController | null = null;
    bc.onmessage = () => {
      controller?.abort();
      controller = new AbortController();
      fetchAttendance(userId, weekOffset, controller.signal)
        .then(merged => { if (merged) { setAttendance(merged); setLoadedWeek(weekOffset); } })
        .catch(() => { if (!controller?.signal.aborted) setError("تعذر تحميل الحضور؛ أعد فتح الصفحة للمحاولة."); });
    };
    return () => { controller?.abort(); bc.close(); };
  }, [userId, weekOffset, fetchAttendance]);

  const loadAttendance = useCallback(async () => {
    if (!userId) return;
    try {
      const merged = await fetchAttendance(userId, weekOffset);
      if (merged) setAttendance(merged);
    } catch {}
  }, [userId, weekOffset, fetchAttendance]);

  const updateGroupLocally = (updated: Group) => {
    setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
    const cached = OfflineCache.loadGroups();
    OfflineCache.saveGroups(cached.map(g => g.id === updated.id ? updated : g));
  };

  const addExtraSessionLocally = useCallback((session: {
    id: string;
    group_id: string;
    session_date: string;
    time: string;
    cancelled?: boolean;
    is_extra?: boolean;
    title?: string;
  }) => {
    setGroups(prev => {
      const updated = prev.map(g => {
        if (g.id !== session.group_id) return g;
        const currentSessions = g.attendance_sessions || [];
        const filtered = currentSessions.filter(s => s.session_date !== session.session_date);
        const newSessionItem = {
          id: session.id,
          session_date: session.session_date,
          time: session.time,
          cancelled: !!session.cancelled,
          is_extra: session.is_extra ?? true,
          title: session.title,
        };
        return {
          ...g,
          attendance_sessions: [...filtered, newSessionItem],
        };
      });
      OfflineCache.saveGroups(updated);
      return updated;
    });
  }, []);

  const weekStart = new Date(getTodayCairo()+"T12:00:00Z"); weekStart.setUTCDate(weekStart.getUTCDate()-((weekStart.getUTCDay()+1)%7)+weekOffset*7);
  const weekEnd=new Date(weekStart);weekEnd.setUTCDate(weekEnd.getUTCDate()+6);
  const monthStart=`${todayYear}-${String(todayMonth).padStart(2,"0")}-01`;
  const monthEnd=`${todayYear}-${String(todayMonth).padStart(2,"0")}-${new Date(todayYear,todayMonth,0).getDate()}`;
  const periodStudents=studentsForPeriod(students,memberships,currentMonthOnly?monthStart:weekStart.toISOString().slice(0,10),currentMonthOnly?monthEnd:weekEnd.toISOString().slice(0,10),attendance);
  const monthlyStudents=studentsForPeriod(students,memberships,`${selectedYear}-${String(selectedMonth).padStart(2,"0")}-01`,`${selectedYear}-${String(selectedMonth).padStart(2,"0")}-31`,attendance);
  const filteredStudents = periodStudents.filter(s => {
    const effectiveGradeId = s.grade_id || groups.find(g => g.id === s.group_id)?.grade_id;
    if (selectedGradeId !== "all" && effectiveGradeId !== selectedGradeId) return false;
    if (selectedGroupId !== "all" && s.group_id !== selectedGroupId) return false;
    return true;
  }).sort((a, b) => (a.code ?? "").localeCompare(b.code ?? "", undefined, { numeric: true }));

  const sessionDates = useMemo(() => {
    const targetGroups = selectedGroupId === "all"
      ? groups.filter(g => selectedGradeId === "all" || g.grade_id === selectedGradeId)
      : groups.filter(g => g.id === selectedGroupId);

    const allDates = new Set<string>();
    for (const g of targetGroups) {
      (currentMonthOnly?getGroupSessionDates(g,todayMonth,todayYear):getGroupSessionDatesForWeek(g, weekOffset)).forEach(d => allDates.add(d));
    }
    return Array.from(allDates).sort();
  }, [groups, selectedGroupId, selectedGradeId, weekOffset, currentMonthOnly, todayMonth, todayYear]);

  const monthSessionDates = useMemo(() => {
    const targetGroups = selectedGroupId === "all"
      ? groups.filter(g => selectedGradeId === "all" || g.grade_id === selectedGradeId)
      : groups.filter(g => g.id === selectedGroupId);

    const allDates = new Set<string>();
    for (const g of targetGroups) {
      getGroupSessionDates(g, selectedMonth, selectedYear).forEach(d => allDates.add(d));
    }
    return Array.from(allDates).sort();
  }, [groups, selectedGroupId, selectedGradeId, selectedMonth, selectedYear]);

  return {
    loading, isWeekLoading: !loading && loadedWeek !== null && loadedWeek !== weekOffset, error, userId,
    groups, setGroups, students, grades,
    attendance, setAttendance,
    selectedGradeId, setSelectedGradeId,
    selectedGroupId, setSelectedGroupId,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    weekOffset, setWeekOffset,
    filteredStudents,
    monthlyStudents: monthlyStudents.filter(s=>(selectedGroupId === "all" || s.group_id===selectedGroupId) && (selectedGradeId === "all" || s.grade_id===selectedGradeId)),
    sessionDates,
    monthSessionDates,
    loadAttendance,
    updateGroupLocally,
    addExtraSessionLocally,
  };
}
