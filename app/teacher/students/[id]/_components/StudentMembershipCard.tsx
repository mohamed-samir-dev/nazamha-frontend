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
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    api.get<{ items: Membership[]; total: number }>(`/students/${studentId}/memberships?page=${page}`)
      .then(result => { if (!cancelled) { setRows(result.items); setTotal(result.total); } })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [studentId, page]);
  return <section className="glass-panel p-6">
    <h2 className="font-bold mb-4">سجل المجموعات</h2>
    {loading ? <p role="status">جاري التحميل…</p> : error ? <p role="alert">تعذر تحميل السجل.</p> : rows.length === 0 ? <p>لا توجد انتقالات مسجلة بعد.</p> : <ul className="space-y-3">{rows.map(row => <li key={row._id}>
      <strong>{row.group_id?.name || "مجموعة سابقة"}</strong>
      <p>{row.starts_on} — {row.ends_on || "المجموعة الحالية"}</p>
      {row.reason === "imported current membership" && <small>بداية الفترة مأخوذة من بيانات الطالب السابقة.</small>}
    </li>)}</ul>}
    <div className="flex gap-3 mt-4">
      {page > 1 && <button disabled={loading} onClick={() => setPage(value => value - 1)}>السابق</button>}
      {page * 25 < total && <button disabled={loading} onClick={() => setPage(value => value + 1)}>التالي</button>}
    </div>
  </section>;
}
