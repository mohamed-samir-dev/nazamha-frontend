"use client";

import { useState, useEffect } from "react";
import { StudentReport, formatTimeTo12H } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function useReportData(studentId: string, month?: number, year?: number) {
  const [report, setReport]                 = useState<StudentReport | null>(null);
  const [loading, setLoading]               = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError]                   = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setReport(null);
    async function load() {
      try {
        const search = new URLSearchParams(window.location.search);
        const access = search.has("card") ? `card=${encodeURIComponent(search.get("card") || "")}` : `token=${encodeURIComponent(search.get("token") || "")}`;
        const res = await fetch(`${API_BASE}/public/student/${studentId}?${access}${month ? `&month=${month}` : ""}${year ? `&year=${year}` : ""}`, { signal: controller.signal, cache: "no-store", referrerPolicy: "no-referrer" });
        if (!res.ok) { setError("لم يتم العثور على بيانات الطالب."); return; }
        const data = await res.json();
        if (controller.signal.aborted) return;
        setReport({
          ...data,
          group_time: data.group_time ? formatTimeTo12H(data.group_time) : "",
        });
      } catch {
        if (controller.signal.aborted) return;
        setError("حدث خطأ أثناء تحميل التقرير.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [studentId, month, year]);

  return { report, loading, paymentLoading, error };
}
