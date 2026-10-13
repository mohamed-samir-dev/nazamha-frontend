import { BookOpen } from "lucide-react";
import { StudentReport } from "./types";

export default function ReportHeader({ report }: { report: StudentReport }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
      {report.site_logo ? (
        <img
          src={report.site_logo}
          alt={report.site_name}
          style={{ width: "80px", height: "80px", objectFit: "contain", borderRadius: "16px", margin: "0 auto 1rem auto", display: "block" }}
        />
      ) : (
        <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(20,184,166,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
          <BookOpen size={28} style={{ color: "#14b8a6" }} />
        </div>
      )}
      <h1 className="report-header-title" style={{ fontSize: "1.5rem", color: "#ffffff", marginBottom: "0.25rem" }}>
        {report.site_name}
      </h1>
      <p className="report-header-sub" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
        تقرير الطالب
      </p>
    </div>
  );
}
