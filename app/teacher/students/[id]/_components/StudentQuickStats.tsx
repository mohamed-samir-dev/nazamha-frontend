"use client";

import { useEffect, useState } from "react";
import { DollarSign, Calendar, BookOpen, AlertTriangle } from "lucide-react";
import { MonthlySubscription, Student, BookDef } from "@/lib/types";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";
import { api as apiClient } from "@/lib/apiClient";

interface Props {
  student: Student;
  books: BookDef[];
  subs?: MonthlySubscription[];
}

export function StudentQuickStats({ student, books, subs: subsProp }: Props) {
  const [subs, setSubs] = useState<MonthlySubscription[]>(subsProp ?? []);
  const [absences, setAbsences] = useState(0);

  useEffect(() => {
    if (!subsProp) {
      SubscriptionsService.getStudentSubscriptions(student.id).then(setSubs).catch(() => {});
    }
    const now = new Date();
    apiClient.get(`/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}&student_id=${student.id}`)
      .then((records: unknown) => {
        const list = records as any[];
        setAbsences(list.filter((r) => r.status === "absent").length);
      })
      .catch(() => {});
  }, [student.id, subsProp]);

  const [purchasedBooksCount, setPurchasedBooksCount] = useState(0);
  const [totalBooks, setTotalBooks] = useState(books.length);

  useEffect(() => {
    apiClient.get(`/books/student/${student.id}`)
      .then((rows: unknown) => {
        const list = rows as any[];
        setPurchasedBooksCount(list.filter((r) => r.purchased).length);
        setTotalBooks(list.length);
      })
      .catch(() => {});
  }, [student.id]);

  const paidSubs = subs.filter((s) => s.status === "paid" || s.status === "exempt");

  // حساب الإجمالي: كل شهر مدفوع × (السعر - الخصم)
  const totalPaid = paidSubs.reduce((sum, s) => sum + Math.max(0, s.amount - s.discount), 0);

  const stats = [
    {
      icon: <DollarSign size={20} />,
      label: "إجمالي المدفوع",
      value: `${totalPaid.toLocaleString()} جنيه`,
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.2)",
    },
    {
      icon: <Calendar size={20} />,
      label: "أشهر مدفوعة",
      value: `${paidSubs.length} شهر`,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
    },
    {
      icon: <BookOpen size={20} />,
      label: "كتب مستلمة",
      value: `${purchasedBooksCount} / ${totalBooks}`,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
    },
    {
      icon: <AlertTriangle size={20} />,
      label: "غيابات الشهر",
      value: `${absences} غياب`,
      color: absences > 2 ? "#ef4444" : "#64748b",
      bg: absences > 2 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)",
      border: absences > 2 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)",
    },
  ];

  return (
    <div className="student-quick-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
      {stats.map(({ icon, label, value, color, bg, border }) => (
        <div key={label} style={{ padding: "1rem 1.25rem", borderRadius: "14px", background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
