"use client";

import { use } from "react";
import { useReportData } from "./_components/useReportData";

import { XCircle, Loader2 } from "lucide-react";
import { PiStudentFill, PiChalkboardTeacherFill, PiCalendarCheckFill, PiCurrencyDollarSimpleFill, PiExamFill, PiSealCheckFill, PiSealWarningFill } from "react-icons/pi";
import { TbClockHour4Filled, TbCalendarWeekFilled, TbCalendarFilled, TbSchoolFilled, TbUsersGroup } from "react-icons/tb";
import { MdVerified, MdCancel } from "react-icons/md";
import { HiSparkles } from "react-icons/hi2";

const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function PublicReportPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const { report, loading, error } = useReportData(studentId);

  if (loading) {
    return (
      <div style={S.center}>
        <Loader2 size={40} color="#14b8a6" style={{ animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ ...S.center, flexDirection: "column", gap: "1rem", padding: "2rem", textAlign: "center" }}>
        <XCircle size={56} color="#ef4444" />
        <p style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{error || "خطأ غير متوقع"}</p>
        <p style={{ color: "rgba(255,255,255,0.4)", margin: 0 }}>تأكد من صحة الرابط أو تواصل مع المعلم</p>
      </div>
    );
  }

  const monthIndex  = new Date().getMonth();
  const monthName   = MONTHS[monthIndex];
  const pct         = report.attendance_total > 0 ? Math.round((report.attendance_present / report.attendance_total) * 100) : 0;
  const pctColor    = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const pctLabel    = pct >= 75 ? "ممتاز 🌟" : pct >= 50 ? "مقبول ⚠️" : "ضعيف 🔴";
  const examPct     = report.last_exam_score != null && report.last_exam_max ? Math.round((report.last_exam_score / report.last_exam_max) * 100) : null;
  const examColor   = examPct == null ? "#94a3b8" : examPct >= 85 ? "#10b981" : examPct >= 50 ? "#f59e0b" : "#ef4444";
  const today       = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div dir="rtl" style={S.page}>
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <div className="report-hero" style={S.hero}>
        <div style={{ ...S.blob, top: -60, right: -60, background: "radial-gradient(circle, rgba(20,184,166,.35) 0%, transparent 70%)" }} />
        <div style={{ ...S.blob, bottom: -40, left: -40, background: "radial-gradient(circle, rgba(99,102,241,.25) 0%, transparent 70%)" }} />

        <div className="hero-inner">
          {/* Brand row */}
          <div style={S.brandRow}>
            {report.site_logo
              ? <img src={report.site_logo} alt="" style={S.logo} />
              : <div style={S.logoFallback}><PiChalkboardTeacherFill size={26} color="#fff" /></div>
            }
            <div>
              <div style={S.brandLabel}>تقرير الطالب</div>
              <div className="brand-name" style={S.brandName}>{report.site_name}</div>
            </div>
            <div className="date-badge" style={S.dateBadge}>{today}</div>
          </div>

          {/* Student card */}
          <div style={S.studentCard}>
            <div style={S.avatarWrap}>
              <PiStudentFill size={32} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="student-name" style={S.studentName}>{report.name}</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: 6 }}>
                {report.code && <Chip color="#14b8a6">{report.code}</Chip>}
                {report.grade_name && <Chip color="#818cf8">{report.grade_name}</Chip>}
              </div>
            </div>
            <HiSparkles size={22} color="rgba(20,184,166,.6)" style={{ flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="report-body" style={S.body}>

        {/* Group Info */}
        {(report.group_name || report.group_day || report.group_time || report.teacher_name) && (
          <Card title="بيانات المجموعة" icon={<TbUsersGroup size={17} color="#14b8a6" />}>
            <div className="grid2">
              {report.teacher_name && <InfoRow icon={<PiChalkboardTeacherFill size={16} color="#a5b4fc" />} label="المعلم" value={report.teacher_name} />}
              {report.group_name   && <InfoRow icon={<TbUsersGroup size={16} color="#a5b4fc" />}            label="المجموعة" value={report.group_name} />}
              {report.group_day    && <InfoRow icon={<TbCalendarWeekFilled size={16} color="#a5b4fc" />}    label="يوم الحصة" value={report.group_day} />}
              {report.group_time   && <InfoRow icon={<TbClockHour4Filled size={16} color="#a5b4fc" />}      label="موعد الحصة" value={report.group_time} />}
              {report.grade_name   && <InfoRow icon={<TbSchoolFilled size={16} color="#a5b4fc" />}          label="السنة الدراسية" value={report.grade_name} />}
            </div>
          </Card>
        )}

        {/* Attendance */}
        <Card title={`الحضور والغياب — ${monthName}`} icon={<PiCalendarCheckFill size={17} color="#14b8a6" />}>
          <div className="grid3" style={{ marginBottom: "1.1rem" }}>
            <StatBox num={report.attendance_present} label="حضور"  color="#10b981" icon={<MdVerified size={20} />} />
            <StatBox num={report.attendance_absent}  label="غياب"  color="#ef4444" icon={<MdCancel size={20} />} />
            <StatBox num={report.attendance_total}   label="إجمالي" color="#818cf8" icon={<PiCalendarCheckFill size={20} />} />
          </div>
          {report.attendance_total > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>نسبة الحضور</span>
                <span style={{ color: pctColor, fontWeight: 700, fontSize: "0.85rem" }}>{pct}% — {pctLabel}</span>
              </div>
              <div style={S.barTrack}>
                <div className="bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${pctColor}88,${pctColor})` }} />
              </div>
            </>
          )}
        </Card>

        {/* Payment */}
        <div style={{
          ...S.card,
          background: report.isPaid ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
          borderTop: `1px solid ${report.isPaid ? "rgba(16,185,129,0.22)" : "rgba(239,68,68,0.22)"}`,
          borderBottom: `1px solid ${report.isPaid ? "rgba(16,185,129,0.22)" : "rgba(239,68,68,0.22)"}`,
        }}>
          <CardTitle icon={<PiCurrencyDollarSimpleFill size={17} color={report.isPaid ? "#10b981" : "#ef4444"} />} color={report.isPaid ? "#10b981" : "#ef4444"}>
            حالة الدفع — {monthName}
          </CardTitle>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.85rem" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: report.isPaid ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {report.isPaid
                ? <PiSealCheckFill size={30} color="#10b981" />
                : <PiSealWarningFill size={30} color="#ef4444" />}
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>
                {report.isPaid ? "تم سداد الاشتراك ✅" : "لم يتم السداد بعد ❌"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.82rem", marginTop: 3 }}>
                اشتراك شهر {monthName}
              </div>
            </div>
          </div>
        </div>

        {/* Last Exam */}
        {report.last_exam_title && report.last_exam_score != null && (
          <Card title="آخر امتحان" icon={<PiExamFill size={17} color="#14b8a6" />}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>{report.last_exam_title}</div>
                {report.last_exam_date && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>
                    <TbCalendarFilled size={13} />
                    {report.last_exam_date}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: examColor, lineHeight: 1 }}>
                  {report.last_exam_score}
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>/{report.last_exam_max}</span>
                </div>
                {examPct != null && (
                  <span style={{ display: "inline-block", marginTop: 5, background: examColor + "22", border: `1px solid ${examColor}44`, color: examColor, fontSize: "0.72rem", fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
                    {examPct}% — {examPct >= 50 ? "ناجح" : "راسب"}
                  </span>
                )}
              </div>
            </div>
            {examPct != null && (
              <div style={{ ...S.barTrack, marginTop: "0.85rem" }}>
                <div className="bar-fill" style={{ width: `${examPct}%`, background: `linear-gradient(90deg,${examColor}88,${examColor})` }} />
              </div>
            )}
          </Card>
        )}

        {/* Footer */}
        <div style={S.footer}>
          <PiChalkboardTeacherFill size={14} color="rgba(255,255,255,0.2)" />
          {report.teacher_name && <span>المعلم: {report.teacher_name}</span>}
          <span style={{ opacity: .4 }}>•</span>
          <span>{report.site_name}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={S.card}>
      <CardTitle icon={icon}>{title}</CardTitle>
      <div style={{ marginTop: "0.85rem" }}>{children}</div>
    </div>
  );
}

function CardTitle({ icon, color = "#14b8a6", children }: { icon: React.ReactNode; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color, fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.04em" }}>
      {icon}{children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ padding: "0.65rem 0.8rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", marginBottom: 3 }}>
        {icon}<span>{label}</span>
      </div>
      <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.92rem" }}>{value}</div>
    </div>
  );
}

function StatBox({ num, label, color, icon }: { num: number; label: string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "0.9rem 0.4rem", background: color + "12", border: `1px solid ${color}28`, borderRadius: 12 }}>
      <div style={{ color, marginBottom: 4 }}>{icon}</div>
      <div className="stat-num" style={{ fontSize: "1.9rem", fontWeight: 900, color, lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: "0.72rem", color, opacity: .7, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ background: color + "22", border: `1px solid ${color}44`, color, fontSize: "0.75rem", fontWeight: 700, padding: "3px 11px", borderRadius: 20, fontFamily: "monospace" }}>
      {children}
    </span>
  );
}

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  page:        { minHeight: "100dvh", background: "#080e1c", fontFamily: "'Segoe UI',Arial,sans-serif", direction: "rtl" },
  center:      { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100dvh", background: "#080e1c" },
  hero:        { position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#0d1b35 0%,#111e3a 60%,#0a1628 100%)", borderBottom: "1px solid rgba(20,184,166,0.12)", padding: "1.2rem 1rem 1.1rem" },
  blob:        { position: "absolute", width: 220, height: 220, borderRadius: "50%", pointerEvents: "none" },
  brandRow:    { display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.2rem" },
  logo:        { width: 46, height: 46, objectFit: "contain", borderRadius: 10, flexShrink: 0 },
  logoFallback:{ width: 46, height: 46, borderRadius: 10, background: "linear-gradient(135deg,#14b8a6,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  brandLabel:  { color: "#14b8a6", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const },
  brandName:   { color: "#fff", fontSize: "1.05rem", fontWeight: 800 },
  dateBadge:   { marginRight: "auto", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" as const },
  studentCard: { position: "relative", background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.18)", borderRadius: 14, padding: "1rem 1.1rem", display: "flex", alignItems: "center", gap: "0.9rem" },
  avatarWrap:  { width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 20px rgba(20,184,166,.3)" },
  studentName: { color: "#fff", fontSize: "1.2rem", fontWeight: 800 },
  body:        { padding: "0", display: "flex", flexDirection: "column", gap: "0" },
  card:        { background: "rgba(255,255,255,0.035)", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRadius: 0, padding: "1.1rem 1rem", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" },
  barTrack:    { height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 6, overflow: "hidden" },
  footer:      { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.6rem 0 0.4rem", color: "rgba(255,255,255,0.22)", fontSize: "0.72rem" },
};

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{margin:0!important;padding:0!important;background:#080e1c!important;background-color:#080e1c!important;background-image:none!important;min-height:100%}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.6rem}
  .bar-fill{height:100%;border-radius:6px;transition:width .6s ease}
  .report-body > *{margin-bottom:6px}
  .brand-name{font-size:clamp(.85rem,3.5vw,1.05rem);font-weight:800;color:#fff}
  .student-name{font-size:clamp(1rem,5vw,1.2rem);font-weight:800;color:#fff}
  .date-badge{display:none}
  @media(min-width:400px){.date-badge{display:block}}
  @media(max-width:380px){
    .grid2{grid-template-columns:1fr}
    .grid3{grid-template-columns:1fr 1fr}
    .stat-num{font-size:1.5rem!important}
  }

  /* ── DESKTOP ── */
  @media(min-width:768px){
    .report-hero{
      padding: 2.5rem 0 2rem !important;
    }
    .hero-inner{
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 3rem;
      display: flex;
      align-items: center;
      gap: 2.5rem;
    }
    .hero-inner > *:first-child{
      flex-shrink: 0;
    }
    .hero-inner > *:last-child{
      flex: 1;
    }
    .report-body{
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem 3rem;
      display: grid !important;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      align-items: start;
    }
    .report-body > *{
      margin-bottom: 0 !important;
      border-radius: 16px !important;
      border: 1px solid rgba(255,255,255,0.08) !important;
    }
    .report-body > *:last-child{
      grid-column: 1 / -1;
    }
    .grid2{grid-template-columns:1fr 1fr}
    .grid3{grid-template-columns:1fr 1fr 1fr}
  }

  @media(min-width:1100px){
    .hero-inner{ max-width:1200px }
    .report-body{ max-width:1200px; grid-template-columns: 1fr 1fr; gap:1.2rem }
  }
`;
