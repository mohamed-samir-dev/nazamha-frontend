export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#080e1c", minHeight: "100dvh" }}>
      {children}
    </div>
  );
}
