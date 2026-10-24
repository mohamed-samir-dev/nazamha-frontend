"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { Loader2, XCircle } from "lucide-react";
import { PiStudentFill, PiChalkboardTeacherFill, PiCalendarCheckFill, PiCurrencyDollarSimpleFill, PiSealCheckFill, PiSealWarningFill } from "react-icons/pi";
import { MdVerified, MdCancel } from "react-icons/md";
import { formatTimeTo12H } from "@/app/report/[studentId]/_components/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

interface SubjectReport {
  student_id: string;
  teacher_name: string;
  subject: string;
  group_name: string;
  group_day: string;
  group_time: string;
  attendance_present: number;
  attendance_absent: number;
  attendance_total: number;
  attendance_compensated?:number;
  attendance_exempt?:number;
  attendance_guest?:number;
  isPaid: boolean;
}

interface CenterReport {
  center_student_code: string;
  name: string;
  grade_name: string;
  site_name: string;
  site_logo: string;
  subjects: SubjectReport[];
}

export default function CenterStudentReportPage({ params }: { params: Promise<{ centerCode: string }> }) {
  const { centerCode } = use(params);
  const [report, setReport] = useState<CenterReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/public/center-student/${centerCode}?token=${encodeURIComponent(new URLSearchParams(window.location.search).get("token") || "")}`)
      .then(r => r.ok ? r.json() : Promise.reject("not_found"))
      .then(data => setReport(data))
      .catch(() => setError("لم يتم العثور على بيانات الطالب."))
      .finally(() => setLoading(false));
  }, [centerCode]);

  if (loading) return (
    <div style={S.center}>
      <Loader2 size={40} color="#14b8a6" style={{ animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !report) return (
    <div style={{ ...S.center, flexDirection: "column", gap: "1rem", padding: "2rem", textAlign: "center" }}>
      <XCircle size={56} color="#ef4444" />
      <p style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{error || "خطأ غير متوقع"}</p>
    </div>
  );

  const monthName = MONTHS[new Date().getMonth()];
  const today = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div dir="rtl" style={S.page}>
      <style>{CSS}</style>

      {/* HERO */}
      <div style={S.hero}>
        <div style={S.brandRow}>
          {report.site_logo
            ? <img src={report.site_logo} alt="" style={S.logo} />
            : <div style={S.logoFallback}><PiChalkboardTeacherFill size={26} color="#fff" /></div>
          }
          <div>
            <div style={S.brandLabel}>تقرير الطالب — السنتر</div>
            <div style={S.brandName}>{report.site_name}</div>
          </div>
          <div style={S.dateBadge}>{today}</div>
        </div>

        <div style={S.studentCard}>
          <div style={S.avatarWrap}><PiStudentFill size={32} color="#fff" /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.studentName}>{report.name}</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: 6 }}>
              {report.grade_name && <Chip color="#818cf8">{report.grade_name}</Chip>}
              <Chip color="#14b8a6">{report.center_student_code}</Chip>
            </div>
          </div>
        </div>
      </div>

      {/* SUBJECTS */}
      <div style={S.body}>
        {report.subjects.map((sub, i) => {
          const pct = sub.attendance_total > 0 ? Math.round((sub.attendance_present / sub.attendance_total) * 100) : 0;
          const pctColor = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
          return (
            <div key={i} style={S.card}>
              {/* Subject header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                <PiChalkboardTeacherFill size={17} color="#14b8a6" />
                <span style={{ color: "#14b8a6", fontWeight: 700, fontSize: "0.82rem" }}>
                  {sub.subject || sub.teacher_name}
                </span>
                {sub.subject && sub.teacher_name && (
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>— {sub.teacher_name}</span>
                )}
                {sub.group_name && (
                  <span style={{ marginRight: "auto", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>{sub.group_name}</span>
                )}
              </div>

              {/* Group info */}
              {(sub.group_day || sub.group_time) && (
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
                  {sub.group_day && <InfoPill label="اليوم" value={sub.group_day} />}
                  {sub.group_time && <InfoPill label="الموعد" value={formatTimeTo12H(sub.group_time)} />}
                </div>
              )}

              {/* Attendance */}
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                  الحضور — {monthName}
                </div>
                <div className="grid3" style={{ marginBottom: "0.6rem" }}>
                  <StatBox num={sub.attendance_present} label="حضور" color="#10b981" icon={<MdVerified size={16} />} />
                  <StatBox num={sub.attendance_absent} label="غياب" color="#ef4444" icon={<MdCancel size={16} />} />
                  <StatBox num={sub.attendance_total} label="إجمالي" color="#818cf8" icon={<PiCalendarCheckFill size={16} />} />
                  <small style={{gridColumn:"1 / -1",color:"#94a3b8"}}>معوّض: {sub.attendance_compensated||0} · إعفاء: {sub.attendance_exempt||0} · حضور خارجي: {sub.attendance_guest||0}</small>
                </div>
                {sub.attendance_total > 0 && (
                  <div style={S.barTrack}>
                    <div className="bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${pctColor}88,${pctColor})` }} />
                  </div>
                )}
              </div>

              {/* Payment */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.8rem", background: sub.isPaid ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", borderRadius: 10, border: `1px solid ${sub.isPaid ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                <PiCurrencyDollarSimpleFill size={18} color={sub.isPaid ? "#10b981" : "#ef4444"} />
                {sub.isPaid
                  ? <><PiSealCheckFill size={18} color="#10b981" /><span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem" }}>تم سداد {monthName} ✅</span></>
                  : <><PiSealWarningFill size={18} color="#ef4444" /><span style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.85rem" }}>لم يتم سداد {monthName} ❌</span></>
                }
              </div>
            </div>
          );
        })}

        <div style={S.footer}>
          <PiChalkboardTeacherFill size={14} color="rgba(255,255,255,0.2)" />
          <span>{report.site_name}</span>
        </div>
      </div>
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

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "3px 10px", fontSize: "0.75rem" }}>
      <span style={{ color: "rgba(255,255,255,0.35)" }}>{label}: </span>
      <span style={{ color: "#fff", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function StatBox({ num, label, color, icon }: { num: number; label: string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "0.6rem 0.3rem", background: color + "12", border: `1px solid ${color}28`, borderRadius: 10 }}>
      <div style={{ color, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 900, color, lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: "0.68rem", color, opacity: .7, marginTop: 3 }}>{label}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:        { minHeight: "100dvh", background: "#080e1c", fontFamily: "'Segoe UI',Arial,sans-serif", direction: "rtl" },
  center:      { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100dvh", background: "#080e1c" },
  hero:        { position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#0d1b35 0%,#111e3a 60%,#0a1628 100%)", borderBottom: "1px solid rgba(20,184,166,0.12)", padding: "1.2rem 1rem 1.1rem" },
  brandRow:    { display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.2rem" },
  logo:        { width: 46, height: 46, objectFit: "contain", borderRadius: 10, flexShrink: 0 },
  logoFallback:{ width: 46, height: 46, borderRadius: 10, background: "linear-gradient(135deg,#14b8a6,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  brandLabel:  { color: "#14b8a6", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const },
  brandName:   { color: "#fff", fontSize: "1.05rem", fontWeight: 800 },
  dateBadge:   { marginRight: "auto", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" as const },
  studentCard: { background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.18)", borderRadius: 14, padding: "1rem 1.1rem", display: "flex", alignItems: "center", gap: "0.9rem" },
  avatarWrap:  { width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 20px rgba(20,184,166,.3)" },
  studentName: { color: "#fff", fontSize: "1.2rem", fontWeight: 800 },
  body:        { padding: "0.5rem 0", display: "flex", flexDirection: "column", gap: "0" },
  card:        { background: "rgba(255,255,255,0.035)", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "1rem", marginBottom: 4 },
  barTrack:    { height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 6, overflow: "hidden" },
  footer:      { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.8rem 0", color: "rgba(255,255,255,0.22)", fontSize: "0.72rem" },
};

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{margin:0!important;padding:0!important;background:#080e1c!important;min-height:100%}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem}
  .bar-fill{height:100%;border-radius:6px;transition:width .6s ease}
  @media(max-width:380px){.grid3{grid-template-columns:1fr 1fr}}
`;
