"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { studentsForPeriod, contextGroups, AttendanceMembership } from "@/lib/utils/attendancePeriod";
import { AuthService } from "@/lib/services/authService";
import { StudentsService } from "@/lib/services/studentsService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { Student, Group, Grade, AttendanceRecord } from "@/lib/types";
import { getGroupSessionDates, isSessionExpired, sessionTime } from "../../_utils/sessionDates";

export interface StudentReportRow {
  student: Student;
  groupName: string;
  gradeName: string;
  present: number;
  absent: number;
  total: number;
  pct: number;
}

export interface GroupReportRow {
  group: Group;
  gradeName: string;
  studentCount: number;
  avgPct: number;
  below75: number;
  totalSessions: number;
  cancelledSessions: number;
}

export interface AbsenteeRow {
  student: Student;
  groupName: string;
  absentCount: number;
  lastAbsentDate: string;
}

export function useAttendanceReports() {
  const now = new Date();
  const [loading, setLoading] = useState(true);
  const [loadedPeriod,setLoadedPeriod]=useState(`${now.getFullYear()}-${now.getMonth()+1}`);
  const [error, setError] = useState<string|null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [memberships,setMemberships]=useState<AttendanceMembership[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [lastSessionData, setLastSessionData] = useState<Record<string, { sessionDate: string; absentees: { id: string; name: string; code: string | null }[] }>>({});
  const lastSessionFetchedRef = useRef(false);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedGradeId, setSelectedGradeId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [absentThreshold, setAbsentThreshold] = useState(2);
  const isInitialMount = useRef(true);

  useEffect(() => {
    async function load() {
      try {
        const user = await AuthService.getUser();
        if (!user) return;
        const [grp, stu, grd, att, context] = await Promise.all([
          GroupsService.getGroupsByTeacherId(),
          StudentsService.getStudentsByTeacherId("id,name,code,center_student_code,parent_phone,group_id,grade_id,is_suspended,suspended_until,suspension_reason,created_at,group_join_date"),
          GradesService.getGradesByTeacherId(user.id),
          AttendanceService.getAttendanceRecords(now.getMonth() + 1, now.getFullYear()), AttendanceService.getContext(),
        ]);
        setGroups(contextGroups(grp,context)); setMemberships(context.memberships);
        setStudents(stu);
        setGrades(grd);
        setAttendance(att);
      } catch {
        setError("تعذر تحميل التقرير؛ أعد المحاولة");
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // إعادة جلب الـ attendance عند تغيير الشهر/السنة فقط (ليس عند أول load)
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    let active = true;

    AttendanceService.getAttendanceRecords(selectedMonth, selectedYear)
      .then(data => { if (active) { setAttendance(data); setLoadedPeriod(`${selectedYear}-${selectedMonth}`); } })
      .catch(() => { if(active) setError("تعذر تحميل الفترة المطلوبة"); });
    return () => { active=false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const periodStudents=useMemo(()=>studentsForPeriod(students,memberships,`${selectedYear}-${String(selectedMonth).padStart(2,"0")}-01`,`${selectedYear}-${String(selectedMonth).padStart(2,"0")}-31`,attendance),[students,memberships,selectedMonth,selectedYear,attendance]);
  const filteredStudents = useMemo(() => {
    return periodStudents.filter((s) => {
      const grp = groups.find((g) => g.id === s.group_id);
      const effectiveGradeId = s.grade_id || grp?.grade_id;
      if (selectedGradeId !== "all" && effectiveGradeId !== selectedGradeId) return false;
      if (selectedGroupId !== "all" && s.group_id !== selectedGroupId) return false;
      return true;
    });
  }, [periodStudents, groups, selectedGradeId, selectedGroupId]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (selectedGradeId !== "all" && g.grade_id !== selectedGradeId) return false;
      if (selectedGroupId !== "all" && g.id !== selectedGroupId) return false;
      return true;
    });
  }, [groups, selectedGradeId, selectedGroupId]);

  // map: student_id -> { present dates set, absent dates set }
  const attendanceMap = useMemo(() => {
    const map = new Map<string, { presentDates: Set<string>; absentDates: Set<string> }>();
    for (const r of attendance) {
      const key=`${r.student_id}|${r.group_id||""}`;
      if(r.attendance_kind==="guest"||r.attendance_kind==="substitute")continue;
      const cur = map.get(key) ?? { presentDates: new Set(), absentDates: new Set() };
      if (r.status === "present") cur.presentDates.add(r.session_date);
      else cur.absentDates.add(r.session_date);
      map.set(key, cur);
    }
    return map;
  }, [attendance]);

  // map: group_id -> active session dates for selected month (past + today only)
  const groupSessionDatesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const g of groups) {
      const allDates = getGroupSessionDates(g, selectedMonth, selectedYear);
      const cancelledSet = new Set(g.cancelled_sessions ?? []);
      map.set(g.id, allDates.filter((d) => !cancelledSet.has(d) && isSessionExpired(d, sessionTime(g,d))));
    }
    return map;
  }, [groups, selectedMonth, selectedYear]);

  const studentRows: StudentReportRow[] = useMemo(() => {
    return filteredStudents.map((s) => {
      const grp = groups.find((g) => g.id === s.group_id);
      const att = attendanceMap.get(`${s.id}|${s.group_id||""}`) ?? { presentDates: new Set<string>(), absentDates: new Set<string>() };
      const joinDate = s.group_join_date?.slice(0, 10) || s.created_at?.slice(0,10) || null;
      // عدد الحصص الفعلية للمجموعة في الشهر بعد تاريخ الانضمام
      const grpActiveDates = grp ? (groupSessionDatesMap.get(grp.id) ?? []) : [];
      const relevantDates = grpActiveDates.filter(d=>(!joinDate||d>=joinDate)&&(!s.attendance_ends_on||d<=s.attendance_ends_on)&&!s.attendance_excluded_dates?.includes(d)&&!s.attendance_resolutions?.[d]);
      const relevantSet = new Set(relevantDates);
      const present = [...att.presentDates].filter((d) => relevantSet.has(d)).length;
      const absent = relevantDates.filter(d => !att.presentDates.has(d)).length;
      const total = relevantDates.length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        student: s,
        groupName: grp?.name ?? "—",
        gradeName: grades.find((g) => g.id === (s.grade_id || grp?.grade_id))?.name ?? "—",
        present,
        absent,
        total,
        pct,
      };
    }).sort((a, b) => a.pct - b.pct);
  }, [filteredStudents, attendanceMap, groupSessionDatesMap, groups, grades]);

  const groupRows: GroupReportRow[] = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
    return filteredGroups.map((g) => {
      const grpStudents = periodStudents.filter((s) => s.group_id === g.id);
      const allSessionDates = getGroupSessionDates(g, selectedMonth, selectedYear);
      const cancelledSet = new Set(g.cancelled_sessions ?? []);
      const activeSessions = allSessionDates.filter((d) => !cancelledSet.has(d) && isSessionExpired(d, sessionTime(g,d)));

      const pcts = grpStudents.map((s) => {
        const att = attendanceMap.get(`${s.id}|${s.group_id||""}`) ?? { presentDates: new Set<string>(), absentDates: new Set<string>() };
        const joinDate = s.group_join_date?.slice(0, 10) || s.created_at?.slice(0,10) || null;
        const relevantDates = activeSessions.filter(d=>(!joinDate||d>=joinDate)&&(!s.attendance_ends_on||d<=s.attendance_ends_on)&&!s.attendance_excluded_dates?.includes(d)&&!s.attendance_resolutions?.[d]);
        const relevantSet = new Set(relevantDates);
        const present = [...att.presentDates].filter((d) => relevantSet.has(d)).length;
        const total = relevantDates.length;
        return total > 0 ? Math.round((present / total) * 100) : 0;
      });

      const avgPct = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
      const below75 = pcts.filter((p) => p < 75).length;

      const pastDates = allSessionDates.filter((d) => d <= today);
      return {
        group: g,
        gradeName: grades.find((gr) => gr.id === g.grade_id)?.name ?? "—",
        studentCount: grpStudents.length,
        avgPct,
        below75,
        totalSessions: pastDates.length,
        cancelledSessions: pastDates.filter((d) => cancelledSet.has(d)).length,
      };
    });
  }, [filteredGroups, periodStudents, attendanceMap, grades, selectedMonth, selectedYear]);

  const absenteeRows: AbsenteeRow[] = useMemo(() => {
    return filteredStudents
      .map((s) => {
        const att = attendanceMap.get(`${s.id}|${s.group_id||""}`) ?? { presentDates: new Set<string>(), absentDates: new Set<string>() };
        const grp = groups.find((g) => g.id === s.group_id);
        const joinDate = s.group_join_date?.slice(0, 10) || s.created_at?.slice(0,10) || null;
        const absentDates = (groupSessionDatesMap.get(s.group_id || "") || []).filter(d => (!joinDate || d >= joinDate) && (!s.attendance_ends_on||d<=s.attendance_ends_on)&&!s.attendance_excluded_dates?.includes(d)&&!s.attendance_resolutions?.[d] && !att.presentDates.has(d));
        const sortedDates = [...absentDates].sort().reverse();
        return {
          student: s,
          groupName: grp?.name ?? "—",
          absentCount: absentDates.length,
          lastAbsentDate: sortedDates[0] ?? "",
        };
      })
      .filter((r) => r.absentCount >= absentThreshold)
      .sort((a, b) => b.absentCount - a.absentCount);
  }, [filteredStudents, attendanceMap, groups, absentThreshold, groupSessionDatesMap]);

  const fetchLastSessionIfNeeded = useCallback(async () => {
    if (lastSessionFetchedRef.current) return;
    try {
      const data = await AttendanceService.getLastSessionAbsentees();
      setLastSessionData(data); lastSessionFetchedRef.current = true;
    } catch { setError("تعذر تحميل التقرير؛ أعد المحاولة"); }
  }, [setError,setLastSessionData]);

  const getLastSessionAbsentees = useCallback((groupId: string) => {
    const entry = lastSessionData[groupId];
    if (!entry) return { absentees: [], sessionDate: null };
    const absentees = entry.absentees.map((a) => ({
      student: { id: a.id, name: a.name, code: a.code } as Student,
      sessionDate: entry.sessionDate,
    }));
    return { absentees, sessionDate: entry.sessionDate };
  }, [lastSessionData]);

  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const pcts = studentRows.map((r) => r.pct);
    const avgPct = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
    const below75 = pcts.filter((p) => p < 75).length;
    const perfect = pcts.filter((p) => p === 100).length;
    return { total, avgPct, below75, perfect };
  }, [filteredStudents, studentRows]);

  const availableGroups = useMemo(() => {
    return groups.filter((g) => selectedGradeId === "all" || g.grade_id === selectedGradeId);
  }, [groups, selectedGradeId]);

  const availableGrades = useMemo(() => {
    const gradeIds = new Set(groups.map((g) => g.grade_id).filter(Boolean));
    return grades.filter((g) => gradeIds.has(g.id));
  }, [grades, groups]);

  return {
    loading:loading || (!error && loadedPeriod !== `${selectedYear}-${selectedMonth}`), error,
    students, groups, grades, availableGrades,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    selectedGradeId, setSelectedGradeId,
    selectedGroupId, setSelectedGroupId,
    absentThreshold, setAbsentThreshold,
    studentRows, groupRows, absenteeRows,
    stats, availableGroups,
    getLastSessionAbsentees,
    fetchLastSessionIfNeeded,
  };
}
