"use client";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  group_name: string | null;
  is_suspended: boolean;
  created_at: string;
}

interface Props {
  students: Student[];
  totalCount: number;
  activeCount: number;
  suspendedCount: number;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

function StatusBadge({ suspended }: { suspended: boolean }) {
  return (
    <span style={{
      fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: "999px",
      background: suspended ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)",
      color: suspended ? "#f87171" : "#4ade80",
      border: `1px solid ${suspended ? "rgba(248,113,113,0.3)" : "rgba(74,222,128,0.3)"}`,
      whiteSpace: "nowrap" as const,
    }}>
      {suspended ? "موقوف" : "نشط"}
    </span>
  );
}

export default function StudentsSection({ students, totalCount, activeCount, suspendedCount }: Props) {
  const router = useRouter();

  return (
    <div className="glass-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
        <h2 className="text-[0.92rem] font-semibold flex items-center gap-2">
          <Users size={15} className="text-teal-400" />
          <span>طلاب المدرس</span>
        </h2>
        <button
          className="btn btn-secondary"
          style={{ padding: "0.25rem 0.7rem", fontSize: "0.78rem" }}
          onClick={() => router.push("/center/students")}
        >
          عرض الكل
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-5 px-4 py-3 border-b border-white/[0.05]">
        <div className="text-center">
          <p className="text-[1.05rem] font-bold font-mono text-white">{totalCount}</p>
          <p className="text-[0.68rem] text-slate-500">الإجمالي</p>
        </div>
        <div className="text-center">
          <p className="text-[1.05rem] font-bold font-mono text-teal-400">{activeCount}</p>
          <p className="text-[0.68rem] text-slate-500">نشط</p>
        </div>
        {suspendedCount > 0 && (
          <div className="text-center">
            <p className="text-[1.05rem] font-bold font-mono text-red-400">{suspendedCount}</p>
            <p className="text-[0.68rem] text-slate-500">موقوف</p>
          </div>
        )}
      </div>

      {students.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <Users size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-[0.83rem]">لا يوجد طلاب لهذا المدرس</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden flex flex-col divide-y divide-white/[0.04]" style={{ maxHeight: 280, overflowY: "auto" }}>
            {students.map(s => (
              <div key={s.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[0.85rem] text-white truncate">{s.name}</p>
                  <p className="text-[0.72rem] text-slate-500 truncate">{s.group_name || "بدون مجموعة"}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge suspended={s.is_suspended} />
                  <span className="text-[0.68rem] text-slate-600">{fmt(s.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto" style={{ maxHeight: 280, overflowY: "auto" }}>
            <table className="students-table" style={{ minWidth: 400 }}>
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>المجموعة</th>
                  <th style={{ textAlign: "center" }}>الحالة</th>
                  <th style={{ textAlign: "center" }}>الإضافة</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, fontSize: "0.88rem" }}>{s.name}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{s.group_name || "—"}</td>
                    <td style={{ textAlign: "center" }}><StatusBadge suspended={s.is_suspended} /></td>
                    <td style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>{fmt(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
