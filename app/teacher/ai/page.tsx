"use client";

import { FaRobot, FaChartBar, FaExclamationTriangle, FaBullseye, FaFileAlt, FaLightbulb } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";

const features = [
  { icon: FaRobot,               color: "#818cf8", bg: "rgba(99,102,241,0.12)",  label: "تحليل شامل لأداء كل طالب." },
  { icon: FaChartBar,            color: "#34d399", bg: "rgba(52,211,153,0.12)",  label: "مقارنة المجموعات ومعرفة الأفضل أداءً." },
  { icon: FaExclamationTriangle, color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  label: "اكتشاف الطلاب الذين يحتاجون إلى تدخل مبكر." },
  { icon: FaBullseye,            color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "توقع نتائج الطلاب قبل الامتحانات." },
  { icon: FaFileAlt,             color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  label: "تقارير ذكية جاهزة للمشاركة مع أولياء الأمور." },
  { icon: FaLightbulb,           color: "#c084fc", bg: "rgba(192,132,252,0.12)", label: "توصيات مخصصة لتحسين أداء كل طالب." },
];

export default function AIPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 1.25rem",
      background: "var(--bg-primary)",
      direction: "rtl",
    }}>
      <div style={{ maxWidth: "680px", width: "100%", textAlign: "center" }}>

        {/* Glow orb */}
        <div style={{
          position: "relative",
          width: "96px",
          height: "96px",
          margin: "0 auto 2rem",
        }}>
          <div style={{
            position: "absolute",
            inset: "-12px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
            animation: "pulse 3s ease-in-out infinite",
          }} />
          <div style={{
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 48px rgba(99,102,241,0.5), 0 0 96px rgba(139,92,246,0.2)",
            position: "relative",
          }}>
            <HiSparkles size={42} color="#fff" />
          </div>
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(99,102,241,0.15)",
          color: "#a5b4fc",
          border: "1px solid rgba(99,102,241,0.35)",
          borderRadius: "999px",
          padding: "5px 18px",
          fontSize: "0.78rem",
          fontWeight: 700,
          marginBottom: "1.25rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}>
          🚀 قيد التطوير — سيصدر قريباً
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(1.75rem, 5vw, 2.6rem)",
          fontWeight: 900,
          lineHeight: 1.25,
          marginBottom: "1.25rem",
          background: "linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #c084fc 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          مستقبل إدارة الطلاب يبدأ هنا
        </h1>

        {/* Description */}
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "clamp(0.95rem, 2.5vw, 1.05rem)",
          lineHeight: 1.85,
          marginBottom: "2.5rem",
          maxWidth: "560px",
          margin: "0 auto 2.5rem",
        }}>
          قريبًا، سيعمل الذكاء الاصطناعي كمساعدك الشخصي، يحلل آلاف البيانات في ثوانٍ ليمنحك تقارير وتوصيات دقيقة تساعدك على رفع مستوى طلابك وزيادة نتائجهم.
        </p>

        {/* Divider */}
        <p style={{
          color: "var(--text-muted)",
          fontSize: "0.85rem",
          fontWeight: 600,
          marginBottom: "1.25rem",
          letterSpacing: "0.04em",
        }}>
          قريبًا ستتمكن من:
        </p>

        {/* Features grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "0.875rem",
          textAlign: "right",
        }}>
          {features.map(({ icon: Icon, color, bg, label }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              transition: "var(--transition-smooth)",
              backdropFilter: "blur(8px)",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.13)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
              }}
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
