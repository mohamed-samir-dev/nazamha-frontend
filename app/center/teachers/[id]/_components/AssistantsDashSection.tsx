"use client";
import { UserCheck, KeyRound, ToggleLeft, ToggleRight, Trash2, ArrowRightLeft, Plus } from "lucide-react";
import { StaffUser, StaffPermission } from "@/lib/types";

const PERMISSION_LABELS: Record<StaffPermission, string> = {
  attendance: "الحضور",
  students: "الطلاب",
  groups: "المجموعات",
  teachers: "المدرسين",
  reports: "التقارير",
  payments: "المدفوعات",
  exams: "الامتحانات",
};

interface Props {
  assistants: StaffUser[];
  actionLoading: boolean;
  onAdd: () => void;
  onToggle: (a: StaffUser) => void;
  onResetPassword: (a: StaffUser) => void;
  onTransfer: (a: StaffUser) => void;
  onDelete: (a: StaffUser) => void;
}

function ActionBtn({ onClick, title, children, danger = false, disabled = false }: {
  onClick: () => void; title: string; children: React.ReactNode; danger?: boolean; disabled?: boolean;
}) {
  return (
    <button
      className="btn btn-secondary"
      style={{ padding: "0.25rem 0.45rem", minWidth: 30, ...(danger ? { color: "#f87171" } : {}) }}
      onClick={onClick} title={title} disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function AssistantsDashSection({ assistants, actionLoading, onAdd, onToggle, onResetPassword, onTransfer, onDelete }: Props) {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
        <h2 className="text-[0.92rem] font-semibold flex items-center gap-2">
          <UserCheck size={15} className="text-indigo-400" />
          المساعدون ({assistants.length})
        </h2>
        <button className="btn btn-primary" style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }} onClick={onAdd}>
          <Plus size={13} /><span>إضافة</span>
        </button>
      </div>

      {assistants.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <UserCheck size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-[0.83rem]">لا يوجد مساعدون لهذا المدرس</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden flex flex-col divide-y divide-white/[0.04]" style={{ maxHeight: 340, overflowY: "auto" }}>
            {assistants.map(a => (
              <div key={a.id} className="px-4 py-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[0.88rem] text-white">{a.name}</p>
                    <p className="text-[0.72rem] text-slate-500 truncate" dir="ltr">{a.email}</p>
                  </div>
                  <span style={{
                    fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: "999px", whiteSpace: "nowrap",
                    background: a.is_active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                    color: a.is_active ? "#4ade80" : "#f87171",
                    border: `1px solid ${a.is_active ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                  }}>
                    {a.is_active ? "نشط" : "معطل"}
                  </span>
                </div>
                {a.permissions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {a.permissions.map(p => (
                      <span key={p} className="text-[0.62rem] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        {PERMISSION_LABELS[p] ?? p}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <ActionBtn onClick={() => onTransfer(a)} title="نقل"><ArrowRightLeft size={12} /></ActionBtn>
                  <ActionBtn onClick={() => onResetPassword(a)} title="تغيير كلمة المرور"><KeyRound size={12} /></ActionBtn>
                  <ActionBtn onClick={() => onToggle(a)} title={a.is_active ? "تعطيل" : "تفعيل"} disabled={actionLoading}>
                    {a.is_active ? <ToggleRight size={12} color="#4ade80" /> : <ToggleLeft size={12} color="#f87171" />}
                  </ActionBtn>
                  <ActionBtn onClick={() => onDelete(a)} title="حذف" danger><Trash2 size={12} /></ActionBtn>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto" style={{ maxHeight: 340, overflowY: "auto" }}>
            <table className="students-table" style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الصلاحيات</th>
                  <th style={{ textAlign: "center" }}>الحالة</th>
                  <th style={{ textAlign: "center" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {assistants.map(a => (
                  <tr key={a.id}>
                    <td>
                      <p style={{ fontWeight: 600, fontSize: "0.88rem", margin: 0 }}>{a.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, direction: "ltr" }}>{a.email}</p>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {a.permissions.length === 0 ? (
                          <span className="text-[0.7rem] text-slate-600">لا توجد صلاحيات</span>
                        ) : a.permissions.map(p => (
                          <span key={p} className="text-[0.65rem] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                            {PERMISSION_LABELS[p] ?? p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.7rem", padding: "0.12rem 0.55rem", borderRadius: "999px",
                        background: a.is_active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                        color: a.is_active ? "#4ade80" : "#f87171",
                        border: `1px solid ${a.is_active ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                      }}>
                        {a.is_active ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1 justify-center">
                        <ActionBtn onClick={() => onTransfer(a)} title="نقل"><ArrowRightLeft size={12} /></ActionBtn>
                        <ActionBtn onClick={() => onResetPassword(a)} title="تغيير كلمة المرور"><KeyRound size={12} /></ActionBtn>
                        <ActionBtn onClick={() => onToggle(a)} title={a.is_active ? "تعطيل" : "تفعيل"} disabled={actionLoading}>
                          {a.is_active ? <ToggleRight size={12} color="#4ade80" /> : <ToggleLeft size={12} color="#f87171" />}
                        </ActionBtn>
                        <ActionBtn onClick={() => onDelete(a)} title="حذف" danger><Trash2 size={12} /></ActionBtn>
                      </div>
                    </td>
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
