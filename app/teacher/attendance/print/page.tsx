"use client";

import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useEffect } from "react";

export default function AttendancePrintPage() {
  useEffect(() => {
    let attempts = 0;
    const tryRead = () => {
      const raw = localStorage.getItem("attendance_print_html");
      if (raw) {
        localStorage.removeItem("attendance_print_html");
        document.open();
        document.write(sanitizeHtml(raw));
        document.close();
        window.onload = () => {
          window.print();
          window.onafterprint = () => window.close();
          setTimeout(() => window.close(), 3000);
        };
      } else if (attempts++ < 20) {
        setTimeout(tryRead, 100);
      }
    };
    tryRead();
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial", direction: "rtl" }}>
      <p style={{ color: "#666" }}>جاري تحميل بيانات الطباعة...</p>
    </div>
  );
}
