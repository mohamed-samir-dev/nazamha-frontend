"use client";

import { HiOutlineUsers, HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineXCircle } from "react-icons/hi2";

interface Props {
  total: number;
  attendancePct: number;
  atRisk: number;
  highAbsence: number;
}

export default function ReportsStatsCards({ total, attendancePct, atRisk, highAbsence }: Props) {
  const attColor = attendancePct >= 75 ? "#10b981" : attendancePct >= 50 ? "#f59e0b" : "#ef4444";
  const attBg = attendancePct >= 75 ? "rgba(16,185,129,0.1)" : attendancePct >= 50 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";

  const cards = [
    {
      icon: <HiOutlineUsers size={22} />,
      value: total,
      label: "إجمالي الطلاب",
      emoji: "👨🎓",
      color: "#14b8a6",
      bg: "rgba(20,184,166,0.1)",
    },
    {
      icon: <HiOutlineCheckCircle size={22} />,
      value: `${attendancePct}%`,
      label: "نسبة الحضور العامة للشهر",
      emoji: "✅",
      color: attColor,
      bg: attBg,
    },
    {
      icon: <HiOutlineXCircle size={22} />,
      value: atRisk,
      label: "معرضون للفصل (حضور < 50%)",
      emoji: "🚨",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
    },
    {
      icon: <HiOutlineExclamationTriangle size={22} />,
      value: highAbsence,
      label: "أكثر من 3 غيابات",
      emoji: "⚠️",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    },
  ];

  return (
    <div className="sr-stats-grid">
      {cards.map((c, i) => (
        <div
          key={i}
          className="glass-panel sr-stat-card"
          style={{ "--sr-card-color": c.color } as React.CSSProperties}
        >
          <div className="sr-stat-icon" style={{ background: c.bg, color: c.color }}>
            {c.icon}
          </div>
          <div className="sr-stat-body">
            <div className="sr-stat-value" style={{ color: c.color }}>{c.value}</div>
            <div className="sr-stat-label">
              <span style={{ marginLeft: "4px" }}>{c.emoji}</span>{c.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
