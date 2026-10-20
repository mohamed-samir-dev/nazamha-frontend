"use client";

import { Trophy, CheckCircle2, CreditCard, Users, ClipboardList } from "lucide-react";
import { RiMedalLine } from "react-icons/ri";
import { Student, Grade, Group, Exam } from "@/lib/types";

interface Props {
  students: Student[];
  grades: Grade[];
  groups: Group[];
  getAttendance: (id: string) => { present: number; absent: number; total: number };
  isStudentPaid: (id: string) => boolean;
  getLastExam: (id: string) => (Exam & { score: number | null }) | null;
  studentSubsInfo: Map<string, { lastPaidMonth: string; arrears: number; hasAllPaid: boolean }>;
  examAverages: Map<string, number | null>;
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];
const RANK_RING_COLORS = ["rgba(251,191,36,0.35)", "rgba(203,213,225,0.25)", "rgba(245,158,11,0.3)"];

const AVATAR_COLORS = [
  ["#0d9488", "#0f766e"],
  ["#2563eb", "#1d4ed8"],
  ["#7c3aed", "#6d28d9"],
  ["#e11d48", "#be123c"],
  ["#d97706", "#b45309"],
  ["#059669", "#047857"],
];

function avatarColors(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string) {
  const p = name.trim().split(" ");
  return p.length >= 2 ? p[0][0] + p[1][0] : p[0].slice(0, 2);
}

export default function TopStudentsSection({ students, grades, groups, getAttendance, getLastExam, studentSubsInfo, examAverages }: Props) {
  const top = students
    .map((s) => {
      const att = getAttendance(s.id);
      const total = att.total;
      const pct = total > 0 ? Math.round((att.present / total) * 100) : 0;
      const subsInfo = studentSubsInfo.get(s.id) ?? { hasAllPaid: true, lastPaidMonth: "—", arrears: 0 };
      const allPaid = subsInfo.hasAllPaid;
      const examAvg = examAverages.get(s.id) ?? null;
      const lastExam = getLastExam(s.id);
      return { s, pct, total, allPaid, examAvg, lastExam };
    })
    .filter(({ pct, total, allPaid, examAvg }) => {
      // الشروط الأساسية: حضور 80%+ ومتأخرات أقل من شهرين
      const baseCondition = total > 0 && pct >= 80 && allPaid;
      // إذا مفيش امتحانات (examAvg === null)، نقبل الطالب
      // إذا في امتحانات، لازم المعدل >= 85%
      const examCondition = examAvg === null || examAvg >= 85;
      return baseCondition && examCondition;
    })
    .sort((a, b) => {
      // الترتيب: أعلى معدل امتحانات أولاً، ثم أعلى حضور
      const aScore = a.examAvg ?? -1;
      const bScore = b.examAvg ?? -1;
      if (bScore !== aScore) return bScore - aScore;
      return b.pct - a.pct;
    });

  return (
    <div className="ts-section">
      {/* Header */}
      <div className="ts-header">
        <div className="ts-header-right">
          <div className="ts-header-icon">
            <Trophy size={20} color="#fbbf24" />
          </div>
          <div>
            <h3 className="ts-title">الطلاب المتميزون</h3>
            <div className="ts-criteria">
              <span className="ts-chip ts-chip-green"><CheckCircle2 size={11} /> حضور ≥ 80%</span>
              <span className="ts-chip-sep">+</span>
              <span className="ts-chip ts-chip-blue"><CreditCard size={11} /> متأخرات &lt; شهرين</span>
              <span className="ts-chip-sep">+</span>
              <span className="ts-chip ts-chip-green"><CheckCircle2 size={11} /> درجات ≥ 85% (إن وجدت)</span>
            </div>
          </div>
        </div>
        <div className="ts-count-badge">
          <RiMedalLine size={14} color="#fbbf24" />
          <span>{top.length} طالب</span>
        </div>
      </div>

      {/* Body */}
      <div className="ts-body">
        {top.length === 0 ? (
          <div className="ts-empty">
            <div className="ts-empty-icon"><Users size={24} /></div>
            <p className="ts-empty-title">لا يوجد طلاب مستوفون للمعيار بعد</p>
            <p className="ts-empty-sub">حضور 80%+ ومتأخرات أقل من شهرين (ودرجات 85%+ إن وجدت امتحانات)</p>
          </div>
        ) : (
          <div className="ts-scroll-row">
            {top.map(({ s, pct, examAvg, lastExam }, idx) => {
              const medal = RANK_MEDALS[idx] ?? null;
              const ringColor = RANK_RING_COLORS[idx] ?? "rgba(255,255,255,0.08)";
              const [c1, c2] = avatarColors(s.name);
              const gradeName = grades.find((g) => g.id === s.grade_id)?.name ?? "";
              const groupName = groups.find((g) => g.id === s.group_id)?.name ?? "";
              const examColor = examAvg === null ? "var(--text-muted)" : examAvg >= 85 ? "#10b981" : examAvg >= 50 ? "#f59e0b" : "#ef4444";

              return (
                <div key={s.id} className="ts-card" style={{ boxShadow: `0 0 0 1px ${ringColor}, 0 4px 20px rgba(0,0,0,0.2)` }}>
                  {/* Medal */}
                  {medal && <span className="ts-medal">{medal}</span>}

                  {/* Avatar */}
                  <div className="ts-avatar" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                    {initials(s.name)}
                  </div>

                  {/* Name + badges */}
                  <span className="ts-name">{s.name}</span>
                  <div className="ts-meta">
                    {gradeName && <span className="ts-meta-badge ts-meta-grade">{gradeName}</span>}
                    {groupName && <span className="ts-meta-badge ts-meta-group">{groupName}</span>}
                  </div>

                  {/* Stats row */}
                  <div className="ts-stats-row">
                    <div className="ts-stat-item">
                      <span className="ts-stat-val" style={{ color: "#10b981" }}>{pct}%</span>
                      <span className="ts-stat-lbl">حضور</span>
                    </div>
                    <div className="ts-stat-divider" />
                    <div className="ts-stat-item">
                      <span className="ts-stat-val" style={{ color: examColor }}>
                        {examAvg !== null ? `${examAvg}%` : "—"}
                      </span>
                      <span className="ts-stat-lbl">درجات</span>
                    </div>
                    {lastExam && lastExam.score !== null && (
                      <>
                        <div className="ts-stat-divider" />
                        <div className="ts-stat-item">
                          <span className="ts-stat-val" style={{ color: examColor }}>{lastExam.score}/{lastExam.max_score}</span>
                          <span className="ts-stat-lbl ts-stat-exam-title" title={lastExam.title}>{lastExam.title}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="ts-bar">
                    <div className="ts-bar-fill" style={{ width: `${examAvg ?? pct}%`, background: examColor }} />
                  </div>

                  {/* Footer */}
                  <div className="ts-footer">
                    <span className="ts-foot-badge ts-foot-green">✓ حضور منتظم</span>
                    <span className="ts-foot-badge ts-foot-blue">✓ دافع</span>
                    {lastExam && (
                      <span className="ts-foot-badge ts-foot-green" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <ClipboardList size={10} /> آخر امتحان
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
