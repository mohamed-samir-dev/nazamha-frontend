"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, GraduationCap, ClipboardCheck, UserX, FolderOpen } from "lucide-react";
import { CenterService } from "@/lib/services/centerService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { CenterDashboardData, Group, Student, AttendanceRecord } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

const MONTH_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function CenterReportsPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [dashData, setDashData] = useState<CenterDashboardData | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [dash, grps, stds] = await Promise.all([
          CenterService.getDashboard(),
          GroupsService.getGroupsByTeacherId(),
          StudentsService.getStudentsByTeacherId(),
        ]);
        setDashData(dash);
        setGroups(grps);
        setStudents(stds);
      } catch {
        setToast({ message: "فشل تحميل البيانات", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    AttendanceService.getAttendanceRecords(selectedMonth, selectedYear)
      .then(setAttendance)
      .catch(() => {});
  }, [selectedMonth, selectedYear]);

  // Attendance stats per group
  const groupStats = groups.map(g => {
    const groupStudents = students.filter(s => s.group_id === g.id);
    const groupAttendance = attendance.filter(r => r.group_id === g.id);
    const present = groupAttendance.filter(r => r.status === "present").length;
    const absent = groupAttendance.filter(r => r.status === "absent").length;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : null;
    return { group: g, studentsCount: groupStudents.length, present, absent, total, rate };
  }).filter(s => s.total > 0);

  const totalPresent = attendance.filter(r => r.status === "present").length;
  const totalAbsent = attendance.filter(r => r.status === "absent").length;
  const totalAttendance = totalPresent + totalAbsent;
  const overallRate = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : null;

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-7 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-[14px] bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
              التقارير
            </h1>
            <p className="text-sm text-slate-500">إحصائيات السنتر</p>
          </div>
        </div>
        {/* Month selector */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select className="form-input" style={{ margin: 0, width: "auto" }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-input" style={{ margin: 0, width: "auto" }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Overview stats */}
      {dashData && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
          {[
            { label: "المدرسون", value: dashData.teachers_count, icon: GraduationCap, color: "#5eead4" },
            { label: "الطلاب", value: students.length, icon: Users, color: "#34d399" },
            { label: "المجموعات", value: groups.length, icon: FolderOpen, color: "#fb923c" },
            { label: "حضور اليوم", value: totalPresent, icon: ClipboardCheck, color: "#4ade80" },
            { label: "غياب اليوم", value: totalAbsent, icon: UserX, color: "#f87171" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass-panel panel-content" style={{ padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <Icon size={16} style={{ color: stat.color }} />
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{stat.label}</span>
                </div>
                <p style={{ fontSize: "1.6rem", fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly attendance summary */}
      <div className="glass-panel panel-content mb-5">
        <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-secondary)" }}>
          ملخص الحضور — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
          {[
            { label: "إجمالي الحضور", value: totalPresent, color: "#4ade80" },
            { label: "إجمالي الغياب", value: totalAbsent, color: "#f87171" },
            { label: "نسبة الحضور", value: overallRate != null ? `${overallRate}%` : "—", color: overallRate != null ? (overallRate >= 75 ? "#4ade80" : overallRate >= 50 ? "#fbbf24" : "#f87171") : "var(--text-muted)" },
          ].map(item => (
            <div key={item.label} style={{ padding: "0.85rem 1rem", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>{item.label}</p>
              <p style={{ fontSize: "1.4rem", fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-group breakdown */}
      {groupStats.length > 0 && (
        <div className="glass-panel overflow-hidden">
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
              تفصيل الحضور بالمجموعات
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="students-table" style={{ minWidth: 500 }}>
              <thead>
                <tr>
                  <th>المجموعة</th>
                  <th style={{ textAlign: "center" }}>الطلاب</th>
                  <th style={{ textAlign: "center" }}>حضور</th>
                  <th style={{ textAlign: "center" }}>غياب</th>
                  <th style={{ textAlign: "center" }}>نسبة الحضور</th>
                </tr>
              </thead>
              <tbody>
                {groupStats.map(({ group, studentsCount, present, absent, rate }) => (
                  <tr key={group.id}>
                    <td style={{ fontWeight: 600 }}>{group.name}</td>
                    <td style={{ textAlign: "center", color: "var(--text-secondary)" }}>{studentsCount}</td>
                    <td style={{ textAlign: "center", color: "#4ade80" }}>{present}</td>
                    <td style={{ textAlign: "center", color: "#f87171" }}>{absent}</td>
                    <td style={{ textAlign: "center" }}>
                      {rate != null ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                          <div style={{ width: "60px", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${rate}%`, background: rate >= 75 ? "#4ade80" : rate >= 50 ? "#fbbf24" : "#f87171", borderRadius: "999px" }} />
                          </div>
                          <span style={{ fontSize: "0.82rem", color: rate >= 75 ? "#4ade80" : rate >= 50 ? "#fbbf24" : "#f87171", fontWeight: 600 }}>{rate}%</span>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
