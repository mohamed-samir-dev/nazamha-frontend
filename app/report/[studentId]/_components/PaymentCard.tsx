import { CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { arabicMonths } from "./types";

interface Props {
  isPaid: boolean;
  loading: boolean;
  monthIndex: number;
}

export default function PaymentCard({ isPaid, loading, monthIndex }: Props) {
  return (
    <div
      className="report-card"
      style={{
        background: loading ? "rgba(255,255,255,0.04)" : isPaid ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
        border: `1px solid ${loading ? "rgba(255,255,255,0.1)" : isPaid ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
        borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", backdropFilter: "blur(10px)",
      }}
    >
      <h3 style={{ color: loading ? "rgba(255,255,255,0.4)" : isPaid ? "#10b981" : "#ef4444", fontSize: "1rem", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <DollarSign size={18} />
        حالة الدفع — {arabicMonths[monthIndex]}
      </h3>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Spinner />
          <p style={{ color: "rgba(255,255,255,0.45)", margin: 0, fontSize: "0.9rem" }}>
            جاري التحقق من حالة الدفع...
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isPaid
            ? <CheckCircle2 size={32} style={{ color: "#10b981" }} />
            : <XCircle size={32} style={{ color: "#ef4444" }} />}
          <div>
            <p className="report-text-white" style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", margin: 0 }}>
              {isPaid ? "تم الدفع ✅" : "لم يتم الدفع بعد ❌"}
            </p>
            <p className="report-text-muted" style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "0.85rem" }}>
              شهر {arabicMonths[monthIndex]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
