"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Minus } from "lucide-react";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { CenterService } from "@/lib/services/centerService";
import { Group, Student, AttendanceRecord, CenterTeacher } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

function getWeekDates(offset: number): string[] {
  const today = new Date();
  const day = today.getDay();
  const diffToSat = day === 6 ? 0 : day + 1;
  const sat = new Date(today);
  sat.setDate(today.getDate() - diffToSat + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sat);
    d.setDate(sat.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function getGroupSessionDatesInWeek(group: Group, weekDates: string[]): string[] {
  const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const groupDays = (group.day_of_week || "")
    .split(/\s*[,،]\s*|\s+/)
    .map(d => d.trim())
    .filter(Boolean);
  const dayIndices = groupDays.map(d => DAYS_AR.indexOf(d)).filter(i => i !== -1);
  return weekDates.filter(date => {
    const d = new Date(date);
    return dayIndices.includes(d.getDay()) && !(group.cancelled_sessions || []).includes(date);
  });
}

export default function CenterAttendancePage() {
  const now = new Date();
  const [teachers, setTeachers] = useState<CenterTeacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split("T")[0]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  // Load teachers, groups, students
  useEffect(() => {
    async function load() {
      try {
        const [teachersData, groupsData, studentsData] = await Promise.all([
          CenterService.getTeachers(),
          GroupsService.getGroupsByTeacherId(),
          StudentsService.getStudentsByTeacherId(),
        ]);
        setTeachers(teachersData);
        setGroups(groupsData);
        setStudents(studentsData);
      } catch {
        showToast("فشل تحميل البيانات", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load attendance for current month
  const loadAttendance = useCallback(async () => {
    try {
      const weekDates = getWeekDates(weekOffset);
      const months = new Set<string>();
      weekDates.forEach(d => {
        const dt = new Date(d);
        months.add(`${dt.getFullYear()}-${dt.getMonth() + 1}`);
      });
      const results = await Promise.all(
        Array.from(months).map(key => {
          const [y, m] = key.split("-").map(Number);
          return AttendanceService.getAttendanceRecords(m, y);
        })
      );
      setAttendance(results.flat());
    } catch {}
  }, [weekOffset]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const weekDates = getWeekDates(weekOffset);

  // Filter groups by selected teacher
  const filteredGroups = selectedTeacherId === "all"
    ? groups
    : groups.filter(g => g.teacher_id === selectedTeacherId);

  // Groups that have sessions on selected date
  const groupsOnDate = filteredGroups.filter(g => {
    const sessionDates = getGroupSessionDatesInWeek(g, weekDates);
    return sessionDates.includes(selectedDate);
  });

  // Students for selected group on selected date
  const displayGroup = selectedGroupId !== "all"
    ? groups.find(g => g.id === selectedGroupId)
    : null;

  const displayStudents = displayGroup
    ? students.filter(s => s.group_id === displayGroup.id && !s.is_suspended)
    : [];

  const getStatus = (studentId: string): "present" | "absent" | null => {
    const rec = attendance.find(r => r.student_id === studentId && r.session_date === selectedDate);
    return rec ? rec.status : null;
  };

  const handleToggle = async (student: Student) => {
    const current = getStatus(student.id);
    const newStatus = current === "present" ? "absent" : "present";
    setSaving(student.id);
    try {
      await AttendanceService.upsertAttendanceRecord({
        student_id: student.id,
        group_id: student.group_id || undefined,
        teacher_id: displayGroup?.teacher_id,
        session_date: selectedDate,
        month: new Date(selectedDate).getMonth() + 1,
        year: new Date(selectedDate).getFullYear(),
        status: newStatus,
      });
      setAttendance(prev => {
        const filtered = prev.filter(r => !(r.student_id === student.id && r.session_date === selectedDate));
        return [...filtered, {
          id: `temp-${student.id}-${selectedDate}`,
          student_id: student.id,
          group_id: student.group_id || undefined,
          session_date: selectedDate,
          month: new Date(selectedDate).getMonth() + 1,
          year: new Date(selectedDate).getFullYear(),
          status: newStatus,
        }];
      });
    } catch (err: any) {
      showToast(err.message || "فشل تسجيل الحضور", "error");
    } finally {
      setSaving(null);
    }
  };

  const handleMarkAll = async (status: "present" | "absent") => {
    if (!displayGroup || displayStudents.length === 0) return;
    setSaving("all");
    try {
      const records = displayStudents.map(s => ({
        student_id: s.id,
        group_id: s.group_id || undefined,
        teacher_id: displayGroup.teacher_id,
        session_date: selectedDate,
        month: new Date(selectedDate).getMonth() + 1,
        year: new Date(selectedDate).getFullYear(),
        status,
      }));
      await AttendanceService.addAttendanceRecords(records);
      setAttendance(prev => {
        const studentIds = new Set(displayStudents.map(s => s.id));
        const filtered = prev.filter(r => !(studentIds.has(r.student_id) && r.session_date === selectedDate));
        return [...filtered, ...records.map((r, i) => ({ ...r, id: `temp-${r.student_id}-${selectedDate}-${i}` }))];
      });
      showToast(`تم تسجيل ${status === "present" ? "حضور" : "غياب"} الكل`);
    } catch {
      showToast("فشل تسجيل الحضور", "error");
    } finally {
      setSaving(null);
    }
  };

  const presentCount = displayStudents.filter(s => getStatus(s.id) === "present").length;
  const absentCount = displayStudents.filter(s => getStatus(s.id) === "absent").length;

  const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-7 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-[14px] bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
              الحضور والغياب
            </h1>
            <p className="text-sm text-slate-500">{selectedDate}</p>
          </div>
        </div>
        {/* Week navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button className="btn btn-secondary" style={{ padding: "0.4rem 0.7rem" }} onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronRight size={16} />
          </button>
          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", minWidth: "80px", textAlign: "center" }}>
            {weekOffset === 0 ? "هذا الأسبوع" : weekOffset === -1 ? "الأسبوع الماضي" : `${Math.abs(weekOffset)} أسابيع`}
          </span>
          <button className="btn btn-secondary" style={{ padding: "0.4rem 0.7rem" }} onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0}>
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel panel-content mb-5" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {teachers.length > 0 && (
          <div style={{ flex: "1 1 180px" }}>
            <label className="form-label" style={{ marginBottom: "0.35rem", display: "block" }}>المدرس</label>
            <select className="form-input" style={{ margin: 0 }} value={selectedTeacherId} onChange={e => { setSelectedTeacherId(e.target.value); setSelectedGroupId("all"); }}>
              <option value="all">كل المدرسين</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        <div style={{ flex: "1 1 180px" }}>
          <label className="form-label" style={{ marginBottom: "0.35rem", display: "block" }}>المجموعة</label>
          <select className="form-input" style={{ margin: 0 }} value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
            <option value="all">اختر مجموعة</option>
            {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {/* Week days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.4rem", marginBottom: "1.5rem" }}>
        {weekDates.map(date => {
          const d = new Date(date);
          const dayName = DAYS_AR[d.getDay()];
          const isSelected = date === selectedDate;
          const hasGroups = filteredGroups.some(g => getGroupSessionDatesInWeek(g, weekDates).includes(date));
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                padding: "0.5rem 0.25rem",
                borderRadius: "10px",
                border: `1px solid ${isSelected ? "rgba(20,184,166,0.5)" : "rgba(255,255,255,0.07)"}`,
                background: isSelected ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.02)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: "0.7rem", color: isSelected ? "var(--color-teal)" : "var(--text-muted)", marginBottom: "0.2rem" }}>{dayName}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: isSelected ? 700 : 400, color: isSelected ? "var(--color-teal)" : "var(--text-secondary)" }}>
                {d.getDate()}
              </div>
              {hasGroups && (
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: isSelected ? "var(--color-teal)" : "rgba(20,184,166,0.4)", margin: "0.2rem auto 0" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Groups on selected date */}
      {selectedGroupId === "all" && groupsOnDate.length > 0 && (
        <div className="glass-panel panel-content mb-5">
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>مجموعات اليوم ({groupsOnDate.length})</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {groupsOnDate.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className="btn btn-secondary"
                style={{ fontSize: "0.82rem", padding: "0.35rem 0.85rem" }}
              >
                {g.name} — {g.time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attendance sheet */}
      {selectedGroupId !== "all" && displayGroup && (
        <div className="glass-panel overflow-hidden">
          {/* Group header */}
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "1rem" }}>{displayGroup.name}</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{displayGroup.time} — {displayGroup.day_of_week}</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "#4ade80" }}>حاضر: {presentCount}</span>
              <span style={{ fontSize: "0.8rem", color: "#f87171" }}>غائب: {absentCount}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>لم يُسجَّل: {displayStudents.length - presentCount - absentCount}</span>
            </div>
          </div>

          {/* Mark all buttons */}
          {displayStudents.length > 0 && (
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem", color: "#4ade80", borderColor: "rgba(74,222,128,0.3)" }} onClick={() => handleMarkAll("present")} disabled={saving === "all"}>
                ✓ تسجيل حضور الكل
              </button>
              <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem", color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }} onClick={() => handleMarkAll("absent")} disabled={saving === "all"}>
                ✗ تسجيل غياب الكل
              </button>
            </div>
          )}

          {/* Students list */}
          {displayStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">لا يوجد طلاب في هذه المجموعة</div>
          ) : (
            <div>
              {displayStudents.map(student => {
                const status = getStatus(student.id);
                const isSavingThis = saving === student.id;
                return (
                  <div
                    key={student.id}
                    onClick={() => !isSavingThis && handleToggle(student)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1.25rem",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      cursor: isSavingThis ? "wait" : "pointer",
                      background: status === "present" ? "rgba(74,222,128,0.04)" : status === "absent" ? "rgba(248,113,113,0.04)" : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-muted)", minWidth: "50px" }}>{student.code || "—"}</span>
                      <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>{student.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {isSavingThis ? (
                        <div className="spinner" style={{ width: "18px", height: "18px" }} />
                      ) : status === "present" ? (
                        <CheckCircle2 size={22} color="#4ade80" />
                      ) : status === "absent" ? (
                        <XCircle size={22} color="#f87171" />
                      ) : (
                        <Minus size={22} color="var(--text-muted)" />
                      )}
                      <span style={{
                        fontSize: "0.75rem",
                        minWidth: "45px",
                        textAlign: "center",
                        color: status === "present" ? "#4ade80" : status === "absent" ? "#f87171" : "var(--text-muted)",
                      }}>
                        {status === "present" ? "حاضر" : status === "absent" ? "غائب" : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedGroupId === "all" && groupsOnDate.length === 0 && (
        <div className="glass-panel panel-content text-center py-12 text-slate-500">
          <ClipboardCheck size={36} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد حصص في هذا اليوم</p>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
