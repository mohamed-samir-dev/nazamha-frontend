"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

interface Membership { _id: string; group_id: { name: string } | null; starts_on: string; ends_on: string | null; reason: string }
export function StudentMembershipCard({ studentId }: { studentId: string }) {
  const [rows, setRows] = useState<Membership[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    api.get<{ items: Membership[]; total: number }>(`/students/${studentId}/memberships?page=${page}`)
      .then(result => { if (!cancelled) { setRows(result.items); setTotal(result.total); } })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [studentId, page, retry]);
  const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
  return <section className="glass-panel" style={{ padding: "clamp(18px, 4vw, 32px)", marginBottom: 24 }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24 }}>
      <div><h2 style={{ margin: 0, fontSize: 21 }}>رحلة الطالب بين المجموعات</h2><p style={{ color: "var(--text-muted)", margin: "8px 0 0", fontSize: 13 }}>سجل زمني يحفظ فترات الانضمام والحضور السابقة.</p></div>
      <span style={{ background: "rgba(20,184,166,.12)", color: "var(--color-teal)", borderRadius: 12, padding: "8px 14px", whiteSpace: "nowrap" }}>{total} فترة</span>
    </header>
    {loading ? <p role="status">جاري تحميل السجل…</p> : error ? <div role="alert">تعذر تحميل السجل. <button onClick={() => setRetry(value => value + 1)}>إعادة المحاولة</button></div> : rows.length === 0 ? <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>لا توجد فترات مسجلة لهذا الطالب بعد.</div> :
    <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>{rows.map((row, index) => <li key={row._id} style={{ display: "flex", gap: 16, padding: 18, border: "1px solid var(--border-color)", borderRadius: 16, background: row.ends_on ? "rgba(255,255,255,.02)" : "rgba(20,184,166,.06)" }}>
      <span style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(20,184,166,.12)", color: "var(--color-teal)", flexShrink: 0 }}>{(page - 1) * 25 + index + 1}</span>
      <div style={{ flex: 1 }}><div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><strong style={{ fontSize: 16 }}>{row.group_id?.name || "مجموعة سابقة"}</strong><span style={{ fontSize: 11, color: row.ends_on ? "var(--text-muted)" : "var(--color-teal)" }}>{row.ends_on ? "فترة سابقة" : "المجموعة الحالية"}</span></div>
      <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", fontSize: 13 }}>من {dateLabel(row.starts_on)}{row.ends_on ? ` إلى ${dateLabel(row.ends_on)}` : " · مستمر حتى الآن"}</p>
      {row.reason === "imported current membership" && <small style={{ display: "block", marginTop: 8, color: "var(--text-muted)" }}>بداية الفترة مأخوذة من بيانات الطالب السابقة.</small>}</div>
    </li>)}</ol>}
    <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
      {page > 1 && <button className="btn btn-secondary" disabled={loading} onClick={() => setPage(value => value - 1)}>السابق</button>}
      {page * 25 < total && <button className="btn btn-secondary" disabled={loading} onClick={() => setPage(value => value + 1)}>التالي</button>}
    </div>
  </section>;
}
