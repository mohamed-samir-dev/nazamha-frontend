"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AuthService } from "@/lib/services/authService";
import { Group, Student, Grade, AttendanceRecord } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { OfflineCache, AttendanceQueue } from "@/lib/offlineQueue";
import { getGroupSessionDatesForWeek, getGroupSessionDates } from "../_utils/sessionDates";
import { getTodayCairo, getYearCairo, getMonthCairo } from "@/lib/utils/dateUtils";

export function useAttendanceData() {
  const todayStr = getTodayCairo();
  const [todayYear, todayMonth] = [getYearCairo(), getMonthCairo()];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);
  const [selectedYear, setSelectedYear] = useState(todayYear);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // عرض الـ cache فوراً بدون انتظار الـ network
        const cachedGroups = OfflineCache.loadGroups();
        const cachedStudents = OfflineCache.loadStudents();
        const cachedGrades = OfflineCache.loadGrades();
        if (cachedGroups.length || cachedStudents.length) {
          setGroups(cachedGroups);
          setStudents(cachedStudents);
          setGrades(cachedGrades);
          setLoading(false);
        }

        // getUser يستخدم in-memory cache (5 دقائق) — لا waterfall حقيقي
        const currentUser = await AuthService.getUser();
        if (!currentUser) { setError("يرجى تسجيل الدخول"); setLoading(false); return; }
        if (cancelled) return;
        setUserId(currentUser.id);

        if (navigator.onLine) {
          const todayStr2 = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
          const [ty, tm] = todayStr2.split("-").map(Number);
          const [grpData, stData, grdData, initialAtt] = await Promise.all([
            GroupsService.getGroupsByTeacherId(),
            StudentsService.getStudentsByTeacherId("id,name,code,group_id,grade_id,is_suspended,suspended_until,suspension_reason,created_at,group_join_date"),
            GradesService.getGradesByTeacherId(currentUser.id),
            AttendanceService.getAttendanceRecords(tm, ty),
          ]);
          if (cancelled) return;
          setGroups(grpData);
          setStudents(stData);
          setGrades(grdData);
          setAttendance(initialAtt || []);
          OfflineCache.saveStudents(stData);
          OfflineCache.saveGroups(grpData);
          OfflineCache.saveGrades(grdData);
          OfflineCache.setLastSync();
        }
      } catch {
        if (!cancelled) {
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
  }, []);

  async function fetchAttendance(uid: string, offset: number, signal?: AbortSignal) {
    const todayStr = getTodayCairo();
    const today = new Date(todayStr + "T00:00:00");
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diffToSat = day === 6 ? 0 : day + 1;
    weekStart.setDate(weekStart.getDate() - diffToSat + offset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const months = new Set<string>();
    months.add(`${weekStart.getFullYear()}-${weekStart.getMonth() + 1}`);
    months.add(`${weekEnd.getFullYear()}-${weekEnd.getMonth() + 1}`);

    const results = await Promise.all(
      Array.from(months).map(key => {
        const [y, m] = key.split("-").map(Number);
        return AttendanceService.getAttendanceRecords(m, y);
      })
    );
    if (signal?.aborted) return;
    const allRecords = results.flat();
    const queued = AttendanceQueue.getAll();
    const merged = [...allRecords];
    for (const q of queued) {
      const exists = merged.some(r => r.student_id === q.student_id && r.session_date === q.session_date);
      if (!exists) {
        merged.push({ ...q, id: `offline-${q.student_id}-${q.session_date}`, created_at: q._queuedAt } as AttendanceRecord);
      }
    }
    return merged;
  }

  // إعادة جلب الـ attendance عند تغيير الأسبوع (weekOffset)
  useEffect(() => {
    if (!userId || weekOffset === 0) return; // weekOffset=0 جُلب بالفعل في load()
    const controller = new AbortController();
    fetchAttendance(userId, weekOffset, controller.signal)
      .then(merged => { if (merged) setAttendance(merged); })
      .catch(() => {});
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, weekOffset]);

  // استماع على تحديثات صفحة السكان
  useEffect(() => {
    if (!userId) return;
    const bc = new BroadcastChannel("attendance");
    let controller: AbortController | null = null;
    bc.onmessage = () => {
      controller?.abort();
      controller = new AbortController();
      fetchAttendance(userId, weekOffset, controller.signal)
        .then(merged => { if (merged) setAttendance(merged); })
        .catch(() => {});
    };
    return () => { controller?.abort(); bc.close(); };
  }, [userId, weekOffset]);

  const loadAttendance = useCallback(async () => {
    if (!userId) return;
    try {
      const merged = await fetchAttendance(userId, weekOffset);
      if (merged) setAttendance(merged);
    } catch {}
  }, [userId, weekOffset]);

  const updateGroupLocally = (updated: Group) => {
    setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
    const cached = OfflineCache.loadGroups();
    OfflineCache.saveGroups(cached.map(g => g.id === updated.id ? updated : g));
  };

  const filteredStudents = students.filter(s => {
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
      getGroupSessionDatesForWeek(g, weekOffset).forEach(d => allDates.add(d));
    }
    return Array.from(allDates).sort();
  }, [groups, selectedGroupId, selectedGradeId, weekOffset]);

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
    loading, error, userId,
    groups, setGroups, students, grades,
    attendance, setAttendance,
    selectedGradeId, setSelectedGradeId,
    selectedGroupId, setSelectedGroupId,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    weekOffset, setWeekOffset,
    filteredStudents,
    sessionDates,
    monthSessionDates,
    loadAttendance,
    updateGroupLocally,
  };
}
