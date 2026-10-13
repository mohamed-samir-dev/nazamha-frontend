export default function ReportFooter({ teacherName }: { teacherName?: string }) {
  if (!teacherName) return null;
  return (
    <div
      className="report-teacher"
      style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", marginTop: "2rem" }}
    >
      المعلم: {teacherName}
    </div>
  );
}
