"use client";
import type { Grade, Group } from "@/lib/types";
import styles from "../attendance.module.css";
interface Props { grades: Grade[]; groups: Group[]; selectedGradeId: string; selectedGroupId: string; onGradeChange: (v: string) => void; onGroupChange: (v: string) => void; }
export function AttendanceFilters(p: Props) {
  const gradeIds = new Set(p.groups.map(g => g.grade_id));
  return <div className={styles.filterPanel}><div className={styles.filters}>
    <label htmlFor="attendance-grade"><span>السنة</span><select id="attendance-grade" value={p.selectedGradeId} onChange={e => p.onGradeChange(e.target.value)}><option value="all">كل السنين</option>{p.grades.filter(g => gradeIds.has(g.id)).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
    <label htmlFor="attendance-group"><span>المجموعة</span><select id="attendance-group" value={p.selectedGroupId} onChange={e => p.onGroupChange(e.target.value)}><option value="all">كل المجموعات</option>{p.groups.filter(g => p.selectedGradeId === "all" || g.grade_id === p.selectedGradeId).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
  </div></div>;
}
