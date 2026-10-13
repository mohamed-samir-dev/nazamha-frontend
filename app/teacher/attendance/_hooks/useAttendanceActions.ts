"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { Student, AttendanceRecord, Group } from "@/lib/types";
import { AttendanceService } from "@/lib/services/attendanceService";
import { GroupsService } from "@/lib/services/groupsService";
import { AttendanceQueue } from "@/lib/offlineQueue";
import { appCache } from "@/lib/appCache";
import { getErrorMessage } from "@/lib/errors";
import { getTodayCairo } from "@/lib/utils/dateUtils";

const ALL_TIME_ATT_KEY = (teacherId: string) => `allTimeAttendanceMap:${teacherId}`;
const invalidateAllTimeCache = (teacherId: string) => appCache.invalidate(ALL_TIME_ATT_KEY(teacherId));

const isOfflineRecord = (id: string) => id.startsWith("offline-") || id.startsWith("optimistic-");

const deleteRecord = async (record: AttendanceRecord) => {
  if (isOfflineRecord(record.id)) {
    AttendanceQueue.remove(record.student_id, record.session_date!);
  } else {
    await AttendanceService.deleteAttendanceRecord(record.id);
  }
};

interface Props {
  userId: string | null;
  attendance: AttendanceRecord[];
  setAttendance: (records: AttendanceRecord[] | ((prev: AttendanceRecord[]) => AttendanceRecord[])) => void;
  filteredStudents: Student[];
  showToast: (msg: string, type?: "success" | "error") => void;
  updateGroupLocally: (group: Group) => void;
  weekOffset: number;
}

export function useAttendanceActions({
  userId, attendance, setAttendance, filteredStudents, showToast, updateGroupLocally, weekOffset,
}: Props) {
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const isSaving = (groupId: string, dateStr: string) => savingKeys.has(`${groupId}-${dateStr}`);
  const addSaving = (groupId: string, dateStr: string) => setSavingKeys(prev => new Set(prev).add(`${groupId}-${dateStr}`));
  const removeSaving = (groupId: string, dateStr: string) => setSavingKeys(prev => { const s = new Set(prev); s.delete(`${groupId}-${dateStr}`); return s; });
  const [pendingDelete, setPendingDelete] = useState<{ record: AttendanceRecord; studentName: string } | null>(null);

  const today = getTodayCairo();

  const isPresent = (studentId: string, dateStr: string) =>
    attendance.some(a => a.student_id === studentId && a.session_date === dateStr && a.status === "present");

  const getRecord = (studentId: string, dateStr: string) =>
    attendance.find(a => a.student_id === studentId && a.session_date === dateStr);

  const getAttendancePercent = (studentId: string, activeDates: string[], studentJoinDate?: string) => {
    const relevantDates = studentJoinDate
      ? activeDates.filter(d => d >= studentJoinDate)
      : activeDates;
    if (relevantDates.length === 0) return 0;
    const present = attendance.filter(
      a => a.student_id === studentId && a.status === "present" && relevantDates.includes(a.session_date)
    ).length;
    return Math.round((present / relevantDates.length) * 100);
  };

  const attendanceRef = useRef(attendance);
  useLayoutEffect(() => { attendanceRef.current = attendance; }, [attendance]);
  // تتبع الـ keys اللي اتضغطت وفي الطريق (قبل ما الـ render يحصل)
  const pendingKeys = useRef<Set<string>>(new Set());

  const handleToggle = async (student: Student, dateStr: string) => {
    if (!userId) return;
    if (weekOffset < 0) { showToast("أسبوع منتهي — لا يمكن التعديل", "error"); return; }
    if (dateStr > today) { showToast("لا يمكن تسجيل حضور في تاريخ مستقبلي", "error"); return; }

    const key = `${student.id}-${dateStr}`;
    if (pendingKeys.current.has(key)) return; // منع double-click
    pendingKeys.current.add(key);

    const existing = attendanceRef.current.find(
      a => a.student_id === student.id && a.session_date === dateStr
    );

    if (existing) {
      setAttendance(prev => prev.filter(a => a.id !== existing.id));
    try { await deleteRecord(existing); invalidateAllTimeCache(userId); }
      catch {
        setAttendance(prev => [...prev, existing]);
        showToast("حدث خطأ أثناء حذف الحضور.", "error");
      } finally { pendingKeys.current.delete(key); }
    } else {
      const sessionMonth = parseInt(dateStr.split("-")[1], 10);
      const currentYear = parseInt(dateStr.split("-")[0], 10);
      const optimisticId = `optimistic-${student.id}-${dateStr}`;
      const optimisticRecord: AttendanceRecord = {
        id: optimisticId,
        teacher_id: userId,
        student_id: student.id,
        group_id: student.group_id,
        session_date: dateStr,
        month: sessionMonth,
        year: currentYear,
        status: "present",
        created_at: new Date().toISOString(),
      };
      setAttendance(prev => [...prev, optimisticRecord]);
      try {
        const newRecord = await AttendanceService.addAttendanceRecord({
          teacher_id: userId,
          student_id: student.id,
          group_id: student.group_id,
          session_date: dateStr,
          month: sessionMonth,
          year: currentYear,
          status: "present",
        });
        setAttendance(prev => prev.map(a => a.id === optimisticId ? newRecord : a));
        invalidateAllTimeCache(userId);
      } catch (err) {
        setAttendance(prev => prev.filter(a => a.id !== optimisticId));
        showToast(getErrorMessage(err, "حدث خطأ أثناء تسجيل الحضور."), "error");
      } finally { pendingKeys.current.delete(key); }
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const optimistic = attendance.filter(a => a.id !== pendingDelete.record.id);
    setAttendance(optimistic);
    setPendingDelete(null);
    try {
      await deleteRecord(pendingDelete.record);
      if (userId) invalidateAllTimeCache(userId);
    } catch {
      setAttendance(attendance);
      showToast("حدث خطأ أثناء حذف الحضور.", "error");
    }
  };

  const handleMarkAllSession = async (dateStr: string, groupId: string) => {
    if (!userId) return;
    if (weekOffset < 0) { showToast("أسبوع منتهي — لا يمكن التعديل", "error"); return; }
    if (dateStr > today) { showToast("لا يمكن تحضير تاريخ مستقبلي", "error"); return; }
    addSaving(groupId, dateStr);
    const sessionMonth = parseInt(dateStr.split("-")[1], 10);
    const sessionYear = parseInt(dateStr.split("-")[0], 10);
    const groupStudents = groupId ? filteredStudents.filter(s => s.group_id === groupId) : filteredStudents;
    const absentStudents = groupStudents.filter(s =>
      !attendanceRef.current.some(a => a.student_id === s.id && a.session_date === dateStr && a.status === "present")
    );
    let optimisticRecords: AttendanceRecord[] = [];
    try {
      if (absentStudents.length === 0) { removeSaving(groupId, dateStr); showToast("جميع الطلاب محضّرون بالفعل"); return; }

      // optimistic update فوري
      optimisticRecords = absentStudents.map(s => ({
        id: `optimistic-${s.id}-${dateStr}`,
        teacher_id: userId,
        student_id: s.id,
        group_id: s.group_id,
        session_date: dateStr,
        month: sessionMonth,
        year: sessionYear,
        status: "present" as const,
        created_at: new Date().toISOString(),
      }));
      setAttendance(prev => [...prev, ...optimisticRecords]);

      const toInsert = absentStudents.map(s => ({
        teacher_id: userId,
        student_id: s.id,
        group_id: s.group_id,
        session_date: dateStr,
        month: sessionMonth,
        year: sessionYear,
        status: "present" as const,
      }));
      const newRecords = await AttendanceService.addAttendanceRecords(toInsert);
      // استبدل الـ optimistic بالـ real records — لو الـ API رجع فاضي نفضل بالـ optimistic
      if (newRecords.length > 0) {
        setAttendance((prev: AttendanceRecord[]) => [
          ...prev.filter(a => !optimisticRecords.some(o => o.id === a.id)),
          ...newRecords,
        ]);
      }
      invalidateAllTimeCache(userId);
      showToast(`✓ تم تحضير ${absentStudents.length} طالب`);
    } catch (err) {
      // rollback — شيل الـ optimistic بس
      setAttendance((prev: AttendanceRecord[]) => prev.filter(a => !optimisticRecords.some(o => o.id === a.id)));
      showToast(getErrorMessage(err, "حدث خطأ أثناء التحضير الجماعي."), "error");
    } finally {
      removeSaving(groupId, dateStr);
    }
  };

  const handleClearSession = async (dateStr: string, groupId: string) => {
    if (!userId) return;
    if (weekOffset < 0) { showToast("أسبوع منتهي — لا يمكن التعديل", "error"); return; }
    if (dateStr > today) { showToast("لا يمكن مسح حصة مستقبلية", "error"); return; }
    addSaving(groupId, dateStr);
    try {
      const groupStudents = groupId ? filteredStudents.filter(s => s.group_id === groupId) : filteredStudents;
      const toDelete = attendanceRef.current.filter(
        a => a.session_date === dateStr && groupStudents.some(s => s.id === a.student_id)
      );
      await Promise.all(toDelete.map(r => deleteRecord(r)));
      setAttendance(prev => prev.filter(a => !toDelete.some(d => d.id === a.id)));
      invalidateAllTimeCache(userId);
      showToast(`تم مسح حضور ${toDelete.length} طالب`);
    } catch {
      showToast("حدث خطأ أثناء مسح الحصة.", "error");
    } finally {
      removeSaving(groupId, dateStr);
    }
  };

  const handleToggleCancelSession = async (groupId: string, dateStr: string) => {
    try {
      const updated = await GroupsService.toggleCancelSession(groupId, dateStr);
      updateGroupLocally(updated);
      const isCancelled = (updated.cancelled_sessions ?? []).includes(dateStr);
      showToast(isCancelled ? "تم إلغاء الحصة — لن تؤثر على التقارير" : "تم استعادة الحصة");
    } catch {
      showToast("حدث خطأ أثناء تغيير حالة الحصة.", "error");
    }
  };

  return {
    isSaving, pendingDelete, setPendingDelete, today,
    isPresent, getAttendancePercent,
    handleToggle, confirmDelete,
    handleMarkAllSession, handleClearSession,
    handleToggleCancelSession,
  };
}
