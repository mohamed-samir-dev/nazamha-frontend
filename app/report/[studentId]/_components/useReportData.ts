"use client";

import { useState, useEffect } from "react";
import { StudentReport, formatTimeTo12H } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function useReportData(studentId: string) {
  const [report, setReport]                 = useState<StudentReport | null>(null);
  const [loading, setLoading]               = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError]                   = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/public/student/${studentId}?token=${encodeURIComponent(new URLSearchParams(window.location.search).get("token") || "")}`);
        if (!res.ok) { setError("لم يتم العثور على بيانات الطالب."); return; }
        const data = await res.json();
        setReport({
          ...data,
          group_time: data.group_time ? formatTimeTo12H(data.group_time) : "",
        });
      } catch {
        setError("حدث خطأ أثناء تحميل التقرير.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  return { report, loading, paymentLoading, error };
}
