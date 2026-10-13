"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ErrorProps {
  // Next.js error boundary injects `digest` and sometimes `status`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: Error & { digest?: string; status?: number; [key: string]: any };
  reset: () => void;
}

export default function TeacherError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // 401 errors that bubble up to the error boundary mean the layout
    // didn't catch them — redirect to login
    if (error.status === 401) {
      router.replace("/teacher/login");
    }
  }, [error, router]);

  if (error.status === 401) {
    return null; // redirect in progress
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.3)",
          color: "#f87171",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
        }}
      >
        ⚠
      </div>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary, #fff)" }}>
        حدث خطأ غير متوقع
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted, #94a3b8)", maxWidth: 320 }}>
        تعذّر تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للرئيسية.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          className="btn btn-primary"
          style={{ fontSize: "0.875rem" }}
        >
          إعادة المحاولة
        </button>
        <button
          onClick={() => router.push("/teacher")}
          className="btn btn-secondary"
          style={{ fontSize: "0.875rem" }}
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
