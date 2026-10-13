"use client";

import { useState } from "react";
import { MdBlock } from "react-icons/md";
import { FiX } from "react-icons/fi";

interface Props {
  studentName: string;
  onConfirm: (suspended_until: string | undefined, reason: string) => void;
  onClose: () => void;
  loading?: boolean;
}

const PRESETS = [
  { label: "أسبوع", days: 7 },
  { label: "أسبوعين", days: 14 },
  { label: "شهر", days: 30 },
  { label: "شهرين", days: 60 },
  { label: "حتى إشعار آخر", days: 0 },
];

export function SuspendModal({ studentName, onConfirm, onClose, loading }: Props) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    let until: string | undefined;
    if (selectedPreset !== null) {
      const preset = PRESETS[selectedPreset];
      if (preset.days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + preset.days);
        until = d.toISOString();
      }
    } else if (customDate) {
      until = new Date(customDate).toISOString();
    }
    onConfirm(until, reason);
  };

  const isValid = selectedPreset !== null || customDate !== "";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-card, #1a1f2e)", borderRadius: "16px",
        border: "1px solid rgba(239,68,68,0.25)", padding: "1.5rem",
        width: "100%", maxWidth: "420px", direction: "rtl",
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MdBlock size={20} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>إيقاف الطالب</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #94a3b8)" }}>{studentName}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted, #94a3b8)", padding: "4px" }}>
            <FiX size={18} />
          </button>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted, #94a3b8)", marginBottom: "0.5rem", fontWeight: 600 }}>مدة الإيقاف</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {PRESETS.map((p, i) => (
              <button key={i} onClick={() => { setSelectedPreset(i); setCustomDate(""); }}
                style={{
                  padding: "0.4rem 0.85rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  background: selectedPreset === i ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${selectedPreset === i ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                  color: selectedPreset === i ? "#ef4444" : "var(--text-secondary, #cbd5e1)",
                  transition: "all 0.15s",
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted, #94a3b8)", marginBottom: "0.4rem", fontWeight: 600 }}>أو حدد تاريخ انتهاء</div>
          <input
            key={selectedPreset ?? "custom"}
            type="date"
            value={customDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => { setCustomDate(e.target.value); setSelectedPreset(null); }}
            style={{
              width: "100%", padding: "0.5rem 0.75rem", borderRadius: "8px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "inherit", fontSize: "0.85rem", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted, #94a3b8)", marginBottom: "0.4rem", fontWeight: 600 }}>سبب الإيقاف (اختياري)</div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: عدم الالتزام بالمواعيد..."
            style={{
              width: "100%", padding: "0.5rem 0.75rem", borderRadius: "8px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "inherit", fontSize: "0.85rem", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ padding: "0.65rem 0.85rem", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.78rem", color: "#fca5a5", marginBottom: "1.25rem" }}>
          ⚠️ بعد الإيقاف، لن يتمكن الطالب من تسجيل الحضور عبر QR أو يدوياً
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button onClick={onClose} disabled={loading}
            style={{ flex: 1, padding: "0.6rem", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary, #cbd5e1)", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: "0.88rem" }}>
            إلغاء
          </button>
          <button onClick={handleConfirm} disabled={!isValid || loading}
            style={{ flex: 1, padding: "0.6rem", borderRadius: "10px", background: isValid ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${isValid ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`, color: isValid ? "#ef4444" : "var(--text-muted, #94a3b8)", cursor: isValid ? "pointer" : "not-allowed", fontFamily: "inherit", fontWeight: 700, fontSize: "0.88rem" }}>
            {loading ? "جاري الإيقاف..." : "تأكيد الإيقاف"}
          </button>
        </div>
      </div>
    </div>
  );
}
