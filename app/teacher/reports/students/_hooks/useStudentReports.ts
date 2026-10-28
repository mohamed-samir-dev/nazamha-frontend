"use client";

import {attendanceSlot} from "@/lib/utils/attendanceResolution";
import { useState, useEffect, useMemo, useRef } from "react";
import { AuthService } from "@/lib/services/authService";
import { TeachersService } from "@/lib/services/teachersService";
import { WhatsAppService } from "@/lib/services/whatsappService";
import { StudentsService } from "@/lib/services/studentsService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { SubscriptionsService, SubscriptionSummaryEntry } from "@/lib/services/subscriptionsService";
import { examsService } from "@/lib/services/examsService";
import { Student, Group, Grade, AttendanceRecord, BookDef, Exam } from "@/lib/types";
import { SortKey, SortDir } from "../_components/types";
import { appCache } from "@/lib/appCache";
import { getGroupSessionDates } from "../../../attendance/_utils/sessionDates";
import { buildStudentWhatsAppMessage, formatPhone, countMembershipAttendance } from "../_utils/reportHelpers";

const ALL_TIME_ATT_KEY = "allTimeAttendanceMap";
const SUBS_SUMMARY_KEY = "subscriptions:summary";

const ARABIC_MONTHS_LOCAL = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export const PAGE_SIZE = 10;

export function useStudentReports() {
  const now = new Date();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [allTimeAttendanceMapState, setAllTimeAttendanceMapState] = useState<Map<string, { present: number; absent: number }>>(
    () => new Map()
  );
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [subsSummary, setSubsSummary] = useState<SubscriptionSummaryEntry[]>([]);
  const [teacherBooks, setTeacherBooks] = useState<BookDef[]>([]);
  const [examAverages, setExamAverages] = useState<Map<string, number | null>>(new Map());
  const [latestExamMapState, setLatestExamMapState] = useState<Map<string, (Exam & { score: number | null }) | null>>(new Map());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGradeId, setFilterGradeId] = useState("all");
  const [filterGroupId, setFilterGroupId] = useState("all");
  const [filterPayment, setFilterPayment] = useState<"all" | "paid" | "unpaid">("all");
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);
  const handleSetSearchQuery = (v: string) => { resetPage(); setSearchQuery(v); };
  const handleSetFilterGradeId = (v: string) => { resetPage(); setFilterGradeId(v); };
  const handleSetFilterGroupId = (v: string) => { resetPage(); setFilterGroupId(v); };
  const handleSetFilterPayment = (v: "all" | "paid" | "unpaid") => { resetPage(); setFilterPayment(v); };
  const handleSetSelectedMonthIndex = (v: number) => { resetPage(); setSelectedMonthIndex(v); };
  const handleSetSelectedYear = (v: number) => { resetPage(); setSelectedYear(v); };

  const monthNum = selectedMonthIndex + 1;
  const [isMonthLoading, setIsMonthLoading] = useState(false);
  const isInitialMonthMount = useRef(true);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("attendancePct");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const handleSort = (key: SortKey) => {
    resetPage();
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // A previous month request must never overwrite the currently selected month.
  useEffect(() => {
    let cancelled = false;
    if (isInitialMonthMount.current) {
      isInitialMonthMount.current = false;
    } else {
      setIsMonthLoading(true);
    }
    AttendanceService.getAttendanceRecords(monthNum, selectedYear)
      .then(data => { if (!cancelled) setAttendanceRecords(data || []); })
      .catch(() => { if (!cancelled) setToast({message:"تعذر تحميل الحضور للشهر المحدد",type:"error"}); })
      .finally(() => { if (!cancelled) setIsMonthLoading(false); });
    return () => { cancelled = true; };
  }, [monthNum, selectedYear]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const currentUser = await AuthService.getUser();
        if (!currentUser || cancelled) return;
        setTeacherId(currentUser.id);
        const cacheKey = `${ALL_TIME_ATT_KEY}:${currentUser.id}`;

        // Clear subscription cache to get fresh data
        appCache.invalidate(SUBS_SUMMARY_KEY);

        let allTimeMap = appCache.get<Map<string, { present: number; absent: number }>>(cacheKey);

        const [teacher, studentsData, groupsData, gradesData, summaryData, statsData, examSummary] = await Promise.all([
          TeachersService.getTeacherProfile(currentUser.id),
          StudentsService.getStudentsByTeacherId("id,name,code,grade_id,group_id,group_join_date,parent_phone,phone,notes,discount_value,discount_reason,custom_monthly_price,received_books"),
          GroupsService.getGroupsByTeacherId(),
          GradesService.getGradesByTeacherId(currentUser.id),
          SubscriptionsService.getSubscriptionsSummary(),
          allTimeMap ? Promise.resolve(null) : AttendanceService.getAllTimeAttendanceStats(),
          examsService.getReportSummary(),
        ]);

        if (cancelled) return;

        if (!allTimeMap && statsData) {
          allTimeMap = new Map<string, { present: number; absent: number }>();
          for (const [sid, counts] of Object.entries(statsData || {})) {
            allTimeMap.set(sid, counts);
          }
          appCache.set(cacheKey, allTimeMap, 5 * 60 * 1000);
        }
        if (allTimeMap) setAllTimeAttendanceMapState(allTimeMap);

        if (examSummary) {
          setExamAverages(new Map(Object.entries(examSummary).map(([id, row])=>[id,row.average])));
          setLatestExamMapState(new Map(Object.entries(examSummary).map(([id,row])=>[id,row.latest])));
        }

        setStudents(studentsData || []);
        setGroups(groupsData || []);
        setGrades(gradesData || []);
        setSubsSummary(summaryData || []);
        setTeacherBooks(teacher?.books || []);
      } catch {
        if (!cancelled) setToast({ message: "حدث خطأ أثناء تحميل البيانات.", type: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O(1) per-student summary lookup
  const subsLookupMap = useMemo(() => {
    const map = new Map<string, SubscriptionSummaryEntry>();
    for (const entry of subsSummary) {
      map.set(entry.studentId, entry);
    }
    return map;
  }, [subsSummary]);

  // subsMap for current month: determines paid/unpaid status for the selected month
  const subsMap = useMemo(() => {
    const map = new Map<string, { paid: boolean; status: string }>();
    for (const entry of subsSummary) {
      const paidMatch = entry.paidEntries.find(e => e.month === monthNum && e.year === selectedYear);
      if (paidMatch) {
        map.set(entry.studentId, { paid: true, status: "paid" });
        continue;
      }
      const dueMatch = entry.dueEntries.find(e => e.month === monthNum && e.year === selectedYear);
      if (dueMatch) {
        map.set(entry.studentId, { paid: false, status: "due" });
      }
    }
    return map;
  }, [subsSummary, monthNum, selectedYear]);

  const isStudentPaid = useMemo(
    () => (studentId: string) => subsMap.get(studentId)?.paid ?? false,
    [subsMap]
  );

  // Pre-computed per-student subscription info for table rows (O(1) access in render)
  const studentSubsInfo = useMemo(() => {
    const map = new Map<string, { lastPaidMonth: string; arrears: number; hasAllPaid: boolean }>();
    const nowD = new Date();
    const nowDate = nowD.getFullYear() * 100 + (nowD.getMonth() + 1);
    const selectedDate = selectedYear * 100 + monthNum;

    for (const entry of subsSummary) {
      let lastPaidMonth = "—";
      if (entry.paidEntries.length > 0) {
        const eligiblePaid = entry.paidEntries.filter(e => e.year * 100 + e.month <= nowDate);
        if (eligiblePaid.length > 0) {
          const latest = eligiblePaid.reduce((max, e) =>
            e.year * 100 + e.month > max.year * 100 + max.month ? e : max
          );
          lastPaidMonth = `${ARABIC_MONTHS_LOCAL[latest.month - 1]} ${latest.year}`;
        }
      }

      const arrears = entry.dueEntries.filter(e => e.year * 100 + e.month <= selectedDate).length;
      const overdueNow = entry.dueEntries.filter(e => e.year * 100 + e.month < nowDate).length;
      const hasAllPaid = overdueNow < 2;

      map.set(entry.studentId, { lastPaidMonth, arrears, hasAllPaid });
    }
    return map;
  }, [subsSummary, monthNum, selectedYear]);

  // map: student_id -> { present dates, absent dates }
  const attendanceDatesMap = useMemo(() => {
    const map = new Map<string, { presentDates: Set<string>; absentDates: Set<string> }>();
    for (const r of attendanceRecords) {
      if(r.resolution || r.attendance_kind==="guest"||r.attendance_kind==="substitute")continue;
      const cur = map.get(r.student_id) ?? { presentDates: new Set<string>(), absentDates: new Set<string>() };
      if (r.status === "present") cur.presentDates.add(r.session_date);
      else cur.absentDates.add(r.session_date);
      map.set(r.student_id, cur);
    }
    return map;
  }, [attendanceRecords]);

  // map: group_id -> active past session dates for selected month
  const groupSessionDatesMap = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
    const map = new Map<string, string[]>();
    for (const g of groups) {
      const allDates = getGroupSessionDates(g, monthNum, selectedYear);
      const cancelledSet = new Set(g.cancelled_sessions ?? []);
      map.set(g.id, allDates.filter((d) => !cancelledSet.has(d) && d <= today));
    }
    return map;
  }, [groups, monthNum, selectedYear]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, { present: number; absent: number; total: number }>();
    const groupMap = new Map(groups.map(group=>[group.id,group]));
    for (const s of students) {
      const grp = groupMap.get(s.group_id || "");
      const dates = grp ? (groupSessionDatesMap.get(grp.id) ?? []) : [];
      const joinDate = s.group_join_date?.slice(0, 10) ?? null;
      const relevantDates = dates.filter(d=>(!joinDate||d>=joinDate)&&!attendanceSlot(attendanceRecords,s.id,d,s.group_id)?.resolution);
      const att = attendanceDatesMap.get(s.id) ?? { presentDates: new Set<string>(), absentDates: new Set<string>() };
      map.set(s.id, countMembershipAttendance(relevantDates, att.presentDates, att.absentDates));
    }
    return map;
  }, [students, groups, groupSessionDatesMap, attendanceDatesMap, attendanceRecords]);

  const getStudentAttendance = (studentId: string) =>
    attendanceMap.get(studentId) ?? { present: 0, absent: 0, total: 0 };

  const getAllTimeAttendance = (studentId: string) =>
    allTimeAttendanceMapState.get(studentId) ?? { present: 0, absent: 0 };

  const getStudentLastExam = (studentId: string) =>
    latestExamMapState.get(studentId) ?? null;

  const filteredStudents = useMemo(() => {
    let list = students;
    if (filterGradeId !== "all") list = list.filter((s) => s.grade_id === filterGradeId);
    if (filterGroupId !== "all") list = list.filter((s) => s.group_id === filterGroupId);
    if (filterPayment === "paid") list = list.filter((s) => isStudentPaid(s.id));
    else if (filterPayment === "unpaid") list = list.filter((s) => {
      const sub = subsMap.get(s.id);
      return !sub || sub.status === "due";
    });
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || (s.code || "").toLowerCase().includes(q));
    }
    return list;
  }, [students, filterGradeId, filterGroupId, filterPayment, searchQuery, subsMap, isStudentPaid]);

  const lastAttendanceMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of attendanceRecords) {
      if (r.status === "present") {
        const cur = map.get(r.student_id);
        if (!cur || r.session_date > cur) map.set(r.student_id, r.session_date);
      }
    }
    return map;
  }, [attendanceRecords]);

  const sortedStudents = useMemo(() => [...filteredStudents].sort((a, b) => {
    const attA = getStudentAttendance(a.id);
    const attB = getStudentAttendance(b.id);
    const pctA = attA.total > 0 ? attA.present / attA.total : 0;
    const pctB = attB.total > 0 ? attB.present / attB.total : 0;
    let cmp = 0;
    if (sortKey === "attendancePct") cmp = pctA - pctB;
    else if (sortKey === "absent") cmp = attA.absent - attB.absent;
    else if (sortKey === "name") cmp = a.name.localeCompare(b.name, "ar");
    else if (sortKey === "lastAttendance") {
      const dA = lastAttendanceMap.get(a.id) ?? "";
      const dB = lastAttendanceMap.get(b.id) ?? "";
      cmp = dA.localeCompare(dB);
    }
    return sortDir === "asc" ? cmp : -cmp;
  }), [filteredStudents, sortKey, sortDir, attendanceMap, lastAttendanceMap]);

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / PAGE_SIZE));
  const pagedStudents = sortedStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filteredGroups = useMemo(
    () => (filterGradeId !== "all" ? groups.filter((g) => g.grade_id === filterGradeId) : groups),
    [groups, filterGradeId]
  );

  const last10Sessions = useMemo(() => {
    const dates = [...new Set(attendanceRecords.map((r) => r.session_date))].sort().reverse().slice(0, 10);
    return new Set(dates);
  }, [attendanceRecords]);

  const stats = useMemo(() => {
    const dueStudents = filteredStudents.filter((s) => {
      const sub = subsMap.get(s.id);
      return sub && sub.status !== "not_due";
    });
    const paid = dueStudents.filter((s) => isStudentPaid(s.id)).length;
    const noSub = filteredStudents.filter((s) => !subsMap.has(s.id)).length;
    let totalPresent = 0, totalSessions = 0;
    for (const s of filteredStudents) {
      const att = attendanceMap.get(s.id) ?? { present: 0, absent: 0, total: 0 };
      totalPresent += att.present;
      totalSessions += att.total;
    }
    const attendancePct = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;
    const atRisk = filteredStudents.filter((s) => {
      const att = attendanceMap.get(s.id) ?? { present: 0, absent: 0, total: 0 };
      return att.total > 0 && (att.present / att.total) * 100 < 50;
    }).length;
    const highAbsence = filteredStudents.filter((s) => {
      const att = attendanceMap.get(s.id) ?? { present: 0, absent: 0, total: 0 };
      return att.absent > 3;
    }).length;
    return {
      total: filteredStudents.length,
      paid,
      unpaid: dueStudents.length - paid + noSub,
      withPhone: filteredStudents.filter((s) => s.parent_phone).length,
      attendancePct,
      atRisk,
      highAbsence,
    };
  }, [filteredStudents, subsMap, isStudentPaid, attendanceMap]);

  const sendWhatsApp = async (student: Student) => {
    const rawPhone = student.parent_phone;
    if (!rawPhone) {
      setToast({ message: `لا يوجد رقم هاتف مسجل لولي أمر ${student.name}`, type: "error" });
      return;
    }
    const phone = formatPhone(rawPhone);
    const att = getStudentAttendance(student.id);
    const paid = isStudentPaid(student.id);
    const lastExam = getStudentLastExam(student.id);
    const subsInfo = studentSubsInfo.get(student.id);
    const monthName = ARABIC_MONTHS_LOCAL[selectedMonthIndex] || "";
    const msg = buildStudentWhatsAppMessage(
      student,
      att,
      paid,
      monthName,
      selectedYear,
      lastExam,
      subsInfo?.arrears ?? 0
    );

    try {
      await WhatsAppService.send(phone, msg);
      setToast({ message: `تم إرسال التقرير لولي أمر ${student.name} بنجاح ✅`, type: "success" });
    } catch {
      // Fallback: Open WhatsApp directly in new window
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setToast({ message: `تم فتح واتساب لإرسال تقرير ${student.name} 📱`, type: "success" });
    }
  };

  return {
    loading,
    students,
    groups,
    grades,
    filteredStudents,
    pagedStudents,
    filteredGroups,
    stats,
    attendanceMap,
    lastAttendanceMap,
    last10Sessions,
    getStudentAttendance,
    getAllTimeAttendance,
    isStudentPaid,
    subsMap,
    toast,
    setToast,
    searchQuery, setSearchQuery: handleSetSearchQuery,
    filterGradeId, setFilterGradeId: handleSetFilterGradeId,
    filterGroupId, setFilterGroupId: handleSetFilterGroupId,
    filterPayment, setFilterPayment: handleSetFilterPayment,
    selectedMonthIndex, setSelectedMonthIndex: handleSetSelectedMonthIndex,
    selectedYear, setSelectedYear: handleSetSelectedYear,
    page, setPage, totalPages,
    sortKey, setSortKey,
    sortDir, setSortDir,
    onSort: handleSort,
    isMonthLoading,
    sortedStudents,
    teacherBooks,
    sendWhatsApp,
    getStudentLastExam,
    examAverages,
    studentSubsInfo,
  };
}
