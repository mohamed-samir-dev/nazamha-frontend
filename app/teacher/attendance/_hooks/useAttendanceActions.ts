"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { Student, AttendanceRecord, Group } from "@/lib/types";
import { AttendanceService } from "@/lib/services/attendanceService";
import { GroupsService } from "@/lib/services/groupsService";
import { AttendanceQueue } from "@/lib/offlineQueue";
import { appCache } from "@/lib/appCache";
import { getErrorMessage } from "@/lib/errors";
import { getTodayCairo } from "@/lib/utils/dateUtils";
import {attendanceSlot,attendanceForDates} from "@/lib/utils/attendanceResolution";

const ALL_TIME_ATT_KEY = (teacherId: string) => `allTimeAttendanceMap:${teacherId}`;
const invalidateAllTimeCache = (teacherId: string) => appCache.invalidate(ALL_TIME_ATT_KEY(teacherId));

const isOfflineRecord = (id: string) => id.startsWith("offline-") || id.startsWith("optimistic-");

const deleteRecord = async (record: AttendanceRecord) => {
  if (isOfflineRecord(record.id)) {
    if(AttendanceService.isSyncing()) throw new Error("انتظر انتهاء المزامنة قبل إلغاء الحضور");
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
  const savingRef = useRef(new Set<string>());
  const isSaving = (groupId: string, dateStr: string) => savingKeys.has(`${groupId}-${dateStr}`);
  const addSaving = (groupId: string, dateStr: string) => setSavingKeys(prev => new Set(prev).add(`${groupId}-${dateStr}`));
  const removeSaving = (groupId: string, dateStr: string) => setSavingKeys(prev => { const s = new Set(prev); s.delete(`${groupId}-${dateStr}`); return s; });
  const [pendingDelete, setPendingDelete] = useState<{ record: AttendanceRecord; studentName: string } | null>(null);

  const today = getTodayCairo();

  const isPresent = (studentId: string, dateStr: string,groupId?:string|null) => attendanceSlot(attendance,studentId,dateStr,groupId)?.status==="present";

  const getAttendancePercent = (studentId: string, activeDates: string[], studentJoinDate?: string,groupId?:string|null) => {
    const relevantDates = studentJoinDate
      ? activeDates.filter(d => d >= studentJoinDate && d <= today)
      : activeDates.filter(d => d <= today);
    if (relevantDates.length === 0) return 0;
    return attendanceForDates(attendance,studentId,relevantDates,groupId).percent;
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
    if(savingRef.current.has(`${student.group_id || ""}-${dateStr}`)) { showToast("انتظر انتهاء حفظ الحصة","error"); return; }
    if (pendingKeys.current.has(key)) return; // منع double-click
    pendingKeys.current.add(key);

    const existing = attendanceRef.current.find(
      a => a.student_id === student.id && a.session_date === dateStr && (!a.group_id||a.group_id===student.group_id)
    );

    if(existing?.resolution){pendingKeys.current.delete(key);showToast("راجع التعويض أو الإعفاء في سكان الكاميرا قبل تعديل هذه الحصة","error");return;}
    if (existing?.status === "present") {
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
      setAttendance(prev => [...prev.filter(a => a.id !== existing?.id), optimisticRecord]);
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
        if (existing) setAttendance(prev => [...prev, existing]);
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
      setAttendance(prev => prev.some(r => r.id === pendingDelete.record.id) ? prev : [...prev, pendingDelete.record]);
      showToast("حدث خطأ أثناء حذف الحضور.", "error");
    }
  };

  const handleMarkAllSession = async (dateStr: string, groupId: string) => {
    if (!userId) return;
    if (weekOffset < 0) { showToast("أسبوع منتهي — لا يمكن التعديل", "error"); return; }
    if (dateStr > today) { showToast("لا يمكن تحضير تاريخ مستقبلي", "error"); return; }
    const savingKey = `${groupId}-${dateStr}`;
    if(filteredStudents.some(s=>(!groupId || s.group_id===groupId) && pendingKeys.current.has(`${s.id}-${dateStr}`))) { showToast("انتظر انتهاء حفظ الطلاب أولًا","error"); return; }
    if (savingRef.current.has(savingKey)) return;
    savingRef.current.add(savingKey);
    addSaving(groupId, dateStr);
    const sessionMonth = parseInt(dateStr.split("-")[1], 10);
    const sessionYear = parseInt(dateStr.split("-")[0], 10);
    const groupStudents = groupId ? filteredStudents.filter(s => s.group_id === groupId) : filteredStudents;
    const absentStudents = groupStudents.filter(s => (!s.attendance_ends_on || dateStr<=s.attendance_ends_on) && !s.attendance_excluded_dates?.includes(dateStr)).filter(s => !(s.is_suspended && (!s.suspended_until || new Date(s.suspended_until) > new Date())) && (s.group_join_date || s.created_at?.slice(0,10) || "") <= dateStr).filter(s =>
      !attendanceRef.current.some(a => a.student_id === s.id && a.session_date === dateStr && a.status === "present")
    );
    try {
      if (absentStudents.length === 0) { showToast("جميع الطلاب المتاحين محضّرون بالفعل"); return; }

      const toInsert = absentStudents.map(s => ({
        teacher_id: userId,
        student_id: s.id,
        group_id: s.group_id,
        session_date: dateStr,
        month: sessionMonth,
        year: sessionYear,
        status: "present" as const,
      }));
      const result = await AttendanceService.addAttendanceRecords(toInsert);
      const newRecords = result.data;
      // Replace each authoritative student/date row with its persisted record.
      if (newRecords.length > 0) {
        setAttendance((prev: AttendanceRecord[]) => [
          ...prev.filter(a => !newRecords.some(o => o.student_id === a.student_id && o.session_date === a.session_date)),
          ...newRecords,
        ]);
      }
      invalidateAllTimeCache(userId);
      showToast(`تم تحضير ${newRecords.length} طالب${result.suspended_skipped.length ? ` — تم استبعاد ${result.suspended_skipped.length} موقوف` : ""}`);
    } catch (err) {
      showToast(getErrorMessage(err, "حدث خطأ أثناء التحضير الجماعي."), "error");
    } finally {
      savingRef.current.delete(savingKey);
      removeSaving(groupId, dateStr);
    }
  };

  const handleClearSession = async (dateStr: string, groupId: string) => {
    if (!userId) return;
    if (weekOffset < 0) { showToast("أسبوع منتهي — لا يمكن التعديل", "error"); return; }
    if (dateStr > today) { showToast("لا يمكن مسح حصة مستقبلية", "error"); return; }
    const savingKey = `${groupId}-${dateStr}`;
    if(filteredStudents.some(s=>(!groupId || s.group_id===groupId) && pendingKeys.current.has(`${s.id}-${dateStr}`))) { showToast("انتظر انتهاء حفظ الطلاب أولًا","error"); return; }
    if (savingRef.current.has(savingKey) || !window.confirm("إلغاء حضور جميع طلاب هذه الحصة؟")) return;
    savingRef.current.add(savingKey);
    addSaving(groupId, dateStr);
    try {
      const groupStudents = groupId ? filteredStudents.filter(s => s.group_id === groupId) : filteredStudents;
      const toDelete = attendanceRef.current.filter(
        a => !a.id.startsWith("resolution-") && a.session_date === dateStr && (!groupId || a.group_id===groupId) && groupStudents.some(s => s.id === a.student_id)
      );
      const results = await Promise.allSettled(toDelete.map(r => deleteRecord(r)));
      const deleted = toDelete.filter((_, i) => results[i].status === "fulfilled");
      setAttendance(prev => prev.filter(a => !deleted.some(d => d.id === a.id)));
      invalidateAllTimeCache(userId);
      showToast(`تم مسح ${deleted.length} سجل${deleted.length < toDelete.length ? " — تعذر حذف بعض السجلات؛ حاول مجددًا" : ""}`, deleted.length < toDelete.length ? "error" : "success");
    } catch {
      showToast("حدث خطأ أثناء مسح الحصة.", "error");
    } finally {
      savingRef.current.delete(savingKey);
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
