import React from "react";

export function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", flexWrap: "wrap" }}>
      <span style={{ color: "var(--text-secondary)", marginTop: "2px", flexShrink: 0 }}>{icon}</span>
      <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", minWidth: "90px", flexShrink: 0 }}>{label}:</span>
      <span style={{ fontSize: "0.9rem", color: "#fff", flex: 1, minWidth: 0, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}
