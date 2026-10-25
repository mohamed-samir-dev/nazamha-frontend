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
  compensated?: number;
  exempt?: number;
  absent: number;
  total: number;
  pct: number | null;
  isTransferred?: boolean;
}

export interface GroupReportRow {
  group: Group;
  gradeName: string;
  studentCount: number;
  avgPct: number;
  below75: number;
  totalSessions: number;
  cancelledSessions: number;
  plannedSessions: number;
  plannedCancelled: number;
  isFutureMonth: boolean;
}

export interface AbsenteeRow {
  student: Student;
  groupName: string;
  absentCount: number;
  lastAbsentDate: string;
}

function getCairoDateParts() {
  try {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
    const [y, m] = todayStr.split("-").map(Number);
    return { year: y, month: m, todayStr };
  } catch {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, todayStr: d.toISOString().slice(0, 10) };
  }
}

export function useAttendanceReports() {
  const cairoInitial = getCairoDateParts();
  const [initialLoading, setInitialLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [memberships, setMemberships] = useState<AttendanceMembership[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [lastSessionData, setLastSessionData] = useState<
    Record<string, { sessionDate: string; absentees: { id: string; name: string; code: string | null; parent_phone?: string | null }[] }>
  >({});
  const [loadingLastSession, setLoadingLastSession] = useState(false);
  const lastSessionFetchedRef = useRef(false);

  const [selectedMonth, setSelectedMonth] = useState(cairoInitial.month);
  const [selectedYear, setSelectedYear] = useState(cairoInitial.year);
  const [selectedGradeId, setSelectedGradeId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [absentThreshold, setAbsentThreshold] = useState(2);
  const isInitialMount = useRef(true);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const user = await AuthService.getUser();
      if (!user) return;
      const [grp, stu, grd, att, context] = await Promise.all([
        GroupsService.getGroupsByTeacherId(),
        StudentsService.getStudentsByTeacherId(
          "id,name,code,center_student_code,parent_phone,phone,group_id,grade_id,is_suspended,suspended_until,suspension_reason,created_at,group_join_date"
        ),
        GradesService.getGradesByTeacherId(user.id),
        AttendanceService.getAttendanceRecords(selectedMonth, selectedYear),
        AttendanceService.getContext(),
      ]);
      setGroups(contextGroups(grp, context));
      setMemberships(context.memberships);
      setStudents(stu);
      setGrades(grd);
      setAttendance(att);
    } catch {
      setError("تعذر تحميل بيانات التقرير؛ يرجى إعادة المحاولة.");
    } finally {
      setInitialLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // جلب سجلات الحضور فقط عند تغيير الشهر أو السنة
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    let active = true;
    setPeriodLoading(true);
    setError(null);

    AttendanceService.getAttendanceRecords(selectedMonth, selectedYear)
      .then((data) => {
        if (active) {
          setAttendance(data);
        }
      })
      .catch(() => {
        if (active) setError("تعذر تحميل حضور الفترة المحددة.");
      })
      .finally(() => {
        if (active) setPeriodLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedMonth, selectedYear]);

  // حساب دقيق لبداية ونهاية الشهر المختار
  const { monthStartStr, monthEndStr } = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    return {
      monthStartStr: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
      monthEndStr: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [selectedMonth, selectedYear]);

  const periodStudents = useMemo(
    () => studentsForPeriod(students, memberships, monthStartStr, monthEndStr, attendance),
    [students, memberships, monthStartStr, monthEndStr, attendance]
  );

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

  // خريطة الحضور (حاضر / غائب لكل طالب ومجموعة)
  const attendanceMap = useMemo(() => {
    const map = new Map<string, { presentDates: Set<string>; absentDates: Set<string> }>();
    for (const r of attendance) {
      if (r.attendance_kind === "guest" || r.attendance_kind === "substitute") continue;
      const key = `${r.student_id}|${r.group_id || ""}`;
      const cur = map.get(key) ?? { presentDates: new Set(), absentDates: new Set() };
      if (r.status === "present") cur.presentDates.add(r.session_date);
      else cur.absentDates.add(r.session_date);
      map.set(key, cur);
    }
    return map;
  }, [attendance]);

  // خريطة تواريخ الحصص المنتهية لكل مجموعة في الشهر المختار
  const groupSessionDatesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const g of groups) {
      const allDates = getGroupSessionDates(g, selectedMonth, selectedYear);
      const cancelledSet = new Set(g.cancelled_sessions ?? []);
      map.set(g.id, allDates.filter((d) => !cancelledSet.has(d) && isSessionExpired(d, sessionTime(g, d))));
    }
    return map;
  }, [groups, selectedMonth, selectedYear]);

  // حساب صفوف تقرير الطلاب
  const studentRows: StudentReportRow[] = useMemo(() => {
    const studentCountMap = new Map<string, number>();
    for (const s of filteredStudents) {
      studentCountMap.set(s.id, (studentCountMap.get(s.id) || 0) + 1);
    }

    return filteredStudents.map((s) => {
      const grp = groups.find((g) => g.id === s.group_id);
      const att = attendanceMap.get(`${s.id}|${s.group_id || ""}`) ?? {
        presentDates: new Set<string>(),
        absentDates: new Set<string>(),
      };
      const joinDate = s.group_join_date?.slice(0, 10) || s.created_at?.slice(0, 10) || null;
      const grpActiveDates = grp ? (groupSessionDatesMap.get(grp.id) ?? []) : [];
      const relevantDates = grpActiveDates.filter(
        (d) =>
          (!joinDate || d >= joinDate) &&
          (!s.attendance_ends_on || d <= s.attendance_ends_on) &&
          !s.attendance_excluded_dates?.includes(d) &&
          !s.attendance_resolutions?.[d]
      );
      const relevantSet = new Set(relevantDates);
      const present = [...att.presentDates].filter((d) => relevantSet.has(d)).length;
      const absent = relevantDates.filter((d) => !att.presentDates.has(d)).length;
      const total = relevantDates.length;
      const pct = total > 0 ? Math.round((present / total) * 100) : null;

      return {
        student: s,
        groupName: grp?.name ?? "—",
        gradeName: grades.find((g) => g.id === (s.grade_id || grp?.grade_id))?.name ?? "—",
        present,
        compensated: Object.values(s.attendance_resolutions || {}).filter((v) => v === "compensated").length,
        exempt: Object.values(s.attendance_resolutions || {}).filter((v) => v === "exempt").length,
        absent,
        total,
        pct,
        isTransferred: (studentCountMap.get(s.id) || 0) > 1,
      };
    }).sort((a, b) => {
      // وضع الطلاب الذين لا يملكون حصصاً (pct === null) في ذيل القائمة
      if (a.pct === null && b.pct === null) return 0;
      if (a.pct === null) return 1;
      if (b.pct === null) return -1;
      return a.pct - b.pct;
    });
  }, [filteredStudents, attendanceMap, groupSessionDatesMap, groups, grades]);

  // حساب صفوف تقرير المجموعات
  const groupRows: GroupReportRow[] = useMemo(() => {
    const today = getCairoDateParts().todayStr;
    const isFuture = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}` > today.slice(0, 7);

    return filteredGroups.map((g) => {
      const grpStudents = periodStudents.filter((s) => s.group_id === g.id);
      const allSessionDates = getGroupSessionDates(g, selectedMonth, selectedYear);
      const cancelledSet = new Set(g.cancelled_sessions ?? []);
      const activeSessions = allSessionDates.filter(
        (d) => !cancelledSet.has(d) && isSessionExpired(d, sessionTime(g, d))
      );

      const pcts = grpStudents
        .map((s) => {
          const att = attendanceMap.get(`${s.id}|${s.group_id || ""}`) ?? {
            presentDates: new Set<string>(),
            absentDates: new Set<string>(),
          };
          const joinDate = s.group_join_date?.slice(0, 10) || s.created_at?.slice(0, 10) || null;
          const relevantDates = activeSessions.filter(
            (d) =>
              (!joinDate || d >= joinDate) &&
              (!s.attendance_ends_on || d <= s.attendance_ends_on) &&
              !s.attendance_excluded_dates?.includes(d) &&
              !s.attendance_resolutions?.[d]
          );
          const relevantSet = new Set(relevantDates);
          const present = [...att.presentDates].filter((d) => relevantSet.has(d)).length;
          const total = relevantDates.length;
          return total > 0 ? Math.round((present / total) * 100) : null;
        })
        .filter((p): p is number => p !== null);

      const avgPct = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
      const below75 = pcts.filter((p) => p < 75).length;

      // الحصص المنتهية فعلياً فقط
      const expiredAll = allSessionDates.filter((d) => isSessionExpired(d, sessionTime(g, d)));
      const cancelledExpired = expiredAll.filter((d) => cancelledSet.has(d));

      return {
        group: g,
        gradeName: grades.find((gr) => gr.id === g.grade_id)?.name ?? "—",
        studentCount: grpStudents.length,
        avgPct,
        below75,
        totalSessions: expiredAll.length,
        cancelledSessions: cancelledExpired.length,
        plannedSessions: allSessionDates.length,
        plannedCancelled: allSessionDates.filter((d) => cancelledSet.has(d)).length,
        isFutureMonth: isFuture,
      };
    });
  }, [filteredGroups, periodStudents, attendanceMap, grades, selectedMonth, selectedYear]);

  // حساب الغائبين المتكررين
  const absenteeRows: AbsenteeRow[] = useMemo(() => {
    return filteredStudents
      .map((s) => {
        const att = attendanceMap.get(`${s.id}|${s.group_id || ""}`) ?? {
          presentDates: new Set<string>(),
          absentDates: new Set<string>(),
        };
        const grp = groups.find((g) => g.id === s.group_id);
        const joinDate = s.group_join_date?.slice(0, 10) || s.created_at?.slice(0, 10) || null;
        const absentDates = (groupSessionDatesMap.get(s.group_id || "") || []).filter(
          (d) =>
            (!joinDate || d >= joinDate) &&
            (!s.attendance_ends_on || d <= s.attendance_ends_on) &&
            !s.attendance_excluded_dates?.includes(d) &&
            !s.attendance_resolutions?.[d] &&
            !att.presentDates.has(d)
        );
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

  // جلب غائبي آخر حصة عند الطلب
  const fetchLastSessionIfNeeded = useCallback(async () => {
    if (lastSessionFetchedRef.current) return;
    setLoadingLastSession(true);
    try {
      const data = await AttendanceService.getLastSessionAbsentees();
      setLastSessionData(data);
      lastSessionFetchedRef.current = true;
    } catch {
      setError("تعذر تحميل تقرير غائبي آخر حصة؛ أعد المحاولة.");
    } finally {
      setLoadingLastSession(false);
    }
  }, []);

  const getLastSessionAbsentees = useCallback(
    (groupId: string) => {
      const entry = lastSessionData[groupId];
      if (!entry) {
        return {
          absentees: [],
          sessionDate: null,
          isLoaded: lastSessionFetchedRef.current,
        };
      }
      const absentees = entry.absentees.map((a) => ({
        student: { id: a.id, name: a.name, code: a.code, parent_phone: a.parent_phone } as Student,
        sessionDate: entry.sessionDate,
      }));
      return { absentees, sessionDate: entry.sessionDate, isLoaded: true };
    },
    [lastSessionData]
  );

  // إحصائيات عامة ملخصة
  const stats = useMemo(() => {
    // عدد الطلاب الفريدين الفعلي
    const total = new Set(filteredStudents.map((s) => s.id)).size;
    const validRows = studentRows.filter((r) => r.total > 0 && r.pct !== null);
    const pcts = validRows.map((r) => r.pct as number);
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
    initialLoading,
    periodLoading,
    loadingLastSession,
    error,
    clearError: () => setError(null),
    reload: loadData,
    students,
    groups,
    grades,
    availableGrades,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedGradeId,
    setSelectedGradeId,
    selectedGroupId,
    setSelectedGroupId,
    absentThreshold,
    setAbsentThreshold,
    studentRows,
    groupRows,
    absenteeRows,
    stats,
    availableGroups,
    getLastSessionAbsentees,
    fetchLastSessionIfNeeded,
  };
}
