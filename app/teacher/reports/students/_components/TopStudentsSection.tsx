"use client";

import { useMemo } from "react";
import { Trophy, CheckCircle2, CreditCard, Users, ClipboardList, Sparkles } from "lucide-react";
import { RiMedalLine, RiWhatsappLine } from "react-icons/ri";
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
  onSendWhatsApp?: (student: Student) => void;
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];
const RANK_RING_COLORS = [
  "rgba(251,191,36,0.45)",
  "rgba(203,213,225,0.35)",
  "rgba(245,158,11,0.40)",
];

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

export default function TopStudentsSection({
  students,
  grades,
  groups,
  getAttendance,
  getLastExam,
  studentSubsInfo,
  examAverages,
  onSendWhatsApp,
}: Props) {
  const top = useMemo(() => {
    return students
      .map((s) => {
        const att = getAttendance(s.id);
        const total = att.total;
        const pct = total > 0 ? Math.round((att.present / total) * 100) : 0;
        const subsInfo = studentSubsInfo.get(s.id) ?? { hasAllPaid: true, lastPaidMonth: "—", arrears: 0 };
        const allPaid = subsInfo.hasAllPaid;
        const examAvg = examAverages.get(s.id) ?? null;
        const lastExam = getLastExam(s.id);
        return { s, pct, total, allPaid, examAvg, lastExam, arrears: subsInfo.arrears };
      })
      .filter(({ pct, total, allPaid, examAvg }) => {
        // شروط التميز المتكاملة:
        // 1) حضور لا يقل عن 80% (أو شهر جديد بلا حصص)
        const baseAttendance = (total === 0 || pct >= 80);
        // 2) التزام مالي (سداد كامل أو متأخرات أقل من شهرين)
        const basePayment = allPaid;
        // 3) تفوق دراسي: إذا توجد امتحانات، يشترط معدل 85%+؛ إذا لم تسجل امتحانات بعد، يكتفى بالحضور والالتزام
        const examCondition = examAvg === null ? total > 0 : examAvg >= 85;

        return baseAttendance && basePayment && examCondition;
      })
      .sort((a, b) => {
        // الأولوية 1: معدل الامتحانات
        const aScore = a.examAvg ?? -1;
        const bScore = b.examAvg ?? -1;
        if (bScore !== aScore) return bScore - aScore;

        // الأولوية 2: نسبة الحضور
        if (b.pct !== a.pct) return b.pct - a.pct;

        // الأولوية 3: إجمالي الحصص المحضورة
        if (b.total !== a.total) return b.total - a.total;

        // الأولوية 4: الاسم أبجدياً
        return a.s.name.localeCompare(b.s.name, "ar");
      });
  }, [students, getAttendance, getLastExam, studentSubsInfo, examAverages]);

  return (
    <div className="ts-section">
      {/* Header */}
      <div className="ts-header">
        <div className="ts-header-right">
          <div className="ts-header-icon">
            <Trophy size={22} color="#fbbf24" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3 className="ts-title">لوحة شرف الطلاب المتميزين</h3>
              <span style={{ fontSize: "0.72rem", background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)", padding: "2px 8px", borderRadius: 999, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Sparkles size={11} /> متفوقو الفترة
              </span>
            </div>
            <div className="ts-criteria">
              <span className="ts-chip ts-chip-green"><CheckCircle2 size={11} /> حضور ≥ 80%</span>
              <span className="ts-chip-sep">+</span>
              <span className="ts-chip ts-chip-blue"><CreditCard size={11} /> اشتراكات منتظمة</span>
              <span className="ts-chip-sep">+</span>
              <span className="ts-chip ts-chip-green"><CheckCircle2 size={11} /> درجات ≥ 85%</span>
            </div>
          </div>
        </div>
        <div className="ts-count-badge">
          <RiMedalLine size={15} color="#fbbf24" />
          <span>{top.length} طالب متميز</span>
        </div>
      </div>

      {/* Body */}
      <div className="ts-body">
        {top.length === 0 ? (
          <div className="ts-empty">
            <div className="ts-empty-icon"><Users size={26} /></div>
            <p className="ts-empty-title">لا يوجد طلاب مستوفون لشروط التميز حالياً</p>
            <p className="ts-empty-sub">المعايير: حضور 80%+ ومتأخرات أقل من شهرين (ودرجات 85%+ إن وجدت امتحانات مسجلة)</p>
          </div>
        ) : (
          <div className="ts-scroll-row">
            {top.map(({ s, pct, total, examAvg, lastExam }, idx) => {
              const medal = RANK_MEDALS[idx] ?? `#${idx + 1}`;
              const ringColor = RANK_RING_COLORS[idx] ?? "rgba(255,255,255,0.08)";
              const [c1, c2] = avatarColors(s.name);
              const gradeName = grades.find((g) => g.id === s.grade_id)?.name ?? "";
              const groupName = groups.find((g) => g.id === s.group_id)?.name ?? "";
              const examColor = examAvg === null ? "var(--text-muted)" : examAvg >= 85 ? "#10b981" : examAvg >= 50 ? "#f59e0b" : "#ef4444";
              const hasPhone = Boolean(s.parent_phone);

              return (
                <div key={s.id} className="ts-card" style={{ boxShadow: `0 0 0 1px ${ringColor}, 0 6px 24px rgba(0,0,0,0.22)` }}>
                  {/* Medal / Rank */}
                  <span className="ts-medal">{medal}</span>

                  {/* Avatar */}
                  <div className="ts-avatar" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                    {initials(s.name)}
                  </div>

                  {/* Name + badges */}
                  <span className="ts-name" title={s.name}>{s.name}</span>
                  <div className="ts-meta">
                    {gradeName && <span className="ts-meta-badge ts-meta-grade">{gradeName}</span>}
                    {groupName && <span className="ts-meta-badge ts-meta-group">{groupName}</span>}
                  </div>

                  {/* Stats row */}
                  <div className="ts-stats-row">
                    <div className="ts-stat-item">
                      <span className="ts-stat-val" style={{ color: "#10b981" }}>{total > 0 ? `${pct}%` : "—"}</span>
                      <span className="ts-stat-lbl">حضور</span>
                    </div>
                    <div className="ts-stat-divider" />
                    <div className="ts-stat-item">
                      <span className="ts-stat-val" style={{ color: examColor }}>
                        {examAvg !== null ? `${examAvg}%` : "—"}
                      </span>
                      <span className="ts-stat-lbl">معدل درجات</span>
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
                    <span className="ts-foot-badge ts-foot-green">✓ منتظم</span>
                    <span className="ts-foot-badge ts-foot-blue">✓ مسدد</span>
                    {onSendWhatsApp && hasPhone && (
                      <button
                        type="button"
                        onClick={() => onSendWhatsApp(s)}
                        title="إرسال رسالة تهنئة وتقرير لولي الأمر"
                        style={{
                          marginRight: "auto",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          background: "rgba(37,211,102,0.12)",
                          border: "1px solid rgba(37,211,102,0.3)",
                          color: "#25D366",
                          padding: "2px 7px",
                          borderRadius: 6,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <RiWhatsappLine size={13} />
                        <span>تهنئة</span>
                      </button>
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
