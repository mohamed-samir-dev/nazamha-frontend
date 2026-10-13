import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "2rem",
        background:
          "radial-gradient(at 0% 0%, rgba(20,184,166,0.07) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59,130,246,0.07) 0px, transparent 50%)",
      }}
    >
      <div
        style={{
          fontSize: "6rem",
          fontWeight: 900,
          background: "linear-gradient(135deg, #14b8a6, #3b82f6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
        }}
      >
        404
      </div>

      <div
        style={{
          background: "rgba(15,23,42,0.65)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1rem",
          backdropFilter: "blur(12px)",
          padding: "2rem 3rem",
          textAlign: "center",
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)",
          maxWidth: "420px",
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#f8fafc",
            marginBottom: "0.5rem",
          }}
        >
          الصفحة غير موجودة
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
          الرابط الذي تبحث عنه غير موجود أو تم نقله.
        </p>

        <Link
          href="/teacher"
          style={{
            display: "inline-block",
            padding: "0.6rem 1.8rem",
            borderRadius: "0.5rem",
            background: "linear-gradient(135deg, #14b8a6, #0f766e)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.95rem",
            textDecoration: "none",
            boxShadow: "0 0 16px rgba(20,184,166,0.25)",
            transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
