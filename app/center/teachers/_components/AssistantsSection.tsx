"use client";

import { useState } from "react";
import { mutate } from "swr";
import { UserCheck, Plus, KeyRound, ToggleLeft, ToggleRight, Trash2, ChevronDown, ChevronUp, ArrowRightLeft, X } from "lucide-react";
import { CenterService } from "@/lib/services/centerService";
import { StaffUser, CenterTeacher } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";
import { AddAssistantModal, ResetPasswordModal } from "./TeacherModals";
import { CENTER_DASHBOARD_KEY } from "../../page";

interface Props {
  teacherId: string;
  teacherName: string;
  allTeachers: CenterTeacher[];
  preloadedAssistants: StaffUser[];
  onAssistantsChange: (updated: StaffUser[]) => void;
}

export default function AssistantsSection({ teacherId, teacherName, allTeachers, preloadedAssistants, onAssistantsChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffUser | null>(null);
  const [transferTarget, setTransferTarget] = useState<StaffUser | null>(null);
  const [transferTeacherId, setTransferTeacherId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<StaffUser | null>(null);

  const assistants = preloadedAssistants;
  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ message: msg, type });

  const handleToggleActive = async (a: StaffUser) => {
    setActionLoading(true);
    try {
      const res = await CenterService.toggleAssistantStatus(a.id);
      onAssistantsChange(assistants.map(x => x.id === a.id ? { ...x, is_active: res.is_active } : x));
      showToast(res.is_active ? "تم تفعيل المساعد" : "تم تعطيل المساعد");
      mutate(CENTER_DASHBOARD_KEY);
    } catch (err: any) {
      showToast(err.message || "فشل تغيير الحالة", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await CenterService.deleteAssistant(confirmDelete.id);
      onAssistantsChange(assistants.filter(a => a.id !== confirmDelete.id));
      showToast("تم حذف المساعد بنجاح");
      setConfirmDelete(null);
      mutate(CENTER_DASHBOARD_KEY);
    } catch (err: any) {
      showToast(err.message || "فشل الحذف", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget || !transferTeacherId) { showToast("يجب اختيار مدرس", "error"); return; }
    setActionLoading(true);
    try {
      await CenterService.transferAssistant(transferTarget.id, transferTeacherId);
      onAssistantsChange(assistants.filter(a => a.id !== transferTarget.id));
      showToast("تم نقل المساعد بنجاح");
      setTransferTarget(null);
      mutate(CENTER_DASHBOARD_KEY);
    } catch (err: any) {
      showToast(err.message || "فشل نقل المساعد", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "0.75rem" }}>
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-violet-500/20 bg-violet-500/[0.05] text-violet-400 text-[0.8rem] font-semibold hover:bg-violet-500/10 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <UserCheck size={13} />
          المساعدون ({assistants.length})
        </span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div className="mt-2 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <div className="flex justify-end mb-2.5">
            <button
              className="btn btn-primary"
              style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
              onClick={() => setShowAdd(true)}
            >
              <Plus size={12} /><span>إضافة مساعد</span>
            </button>
          </div>

          {assistants.length === 0 ? (
            <p className="text-[0.78rem] text-slate-500 text-center py-3">لا يوجد مساعدون بعد</p>
          ) : (
            <div className="flex flex-col gap-2">
              {assistants.map(a => (
                <div key={a.id} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[0.83rem] font-semibold text-white truncate">{a.name}</p>
                        <span style={{
                          fontSize: "0.68rem", padding: "0.12rem 0.5rem", borderRadius: "999px", whiteSpace: "nowrap", flexShrink: 0,
                          background: a.is_active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                          color: a.is_active ? "#4ade80" : "#f87171",
                          border: `1px solid ${a.is_active ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                        }}>
                          {a.is_active ? "نشط" : "معطل"}
                        </span>
                      </div>
                      <p className="text-[0.7rem] text-slate-500 truncate" dir="ltr">{a.email}</p>
                    </div>
                    {/* Actions inline on sm+ */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      <button className="btn btn-secondary" style={{ padding: "0.22rem 0.45rem" }} title="نقل" onClick={() => { setTransferTarget(a); setTransferTeacherId(""); }}><ArrowRightLeft size={11} /></button>
                      <button className="btn btn-secondary" style={{ padding: "0.22rem 0.45rem" }} title="تغيير كلمة المرور" onClick={() => setResetTarget(a)}><KeyRound size={11} /></button>
                      <button className="btn btn-secondary" style={{ padding: "0.22rem 0.45rem" }} onClick={() => handleToggleActive(a)} disabled={actionLoading}>
                        {a.is_active ? <ToggleRight size={11} color="#4ade80" /> : <ToggleLeft size={11} color="#f87171" />}
                      </button>
                      <button className="btn btn-secondary" style={{ padding: "0.22rem 0.45rem", color: "#f87171" }} onClick={() => setConfirmDelete(a)}><Trash2 size={11} /></button>
                    </div>
                  </div>
                  {/* Actions below on mobile */}
                  <div className="flex sm:hidden items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.05]">
                    <button className="btn btn-secondary" style={{ padding: "0.22rem 0.45rem" }} title="نقل" onClick={() => { setTransferTarget(a); setTransferTeacherId(""); }}><ArrowRightLeft size={11} /></button>
                    <button className="btn btn-secondary" style={{ padding: "0.22rem 0.45rem" }} title="تغيير كلمة المرور" onClick={() => setResetTarget(a)}><KeyRound size={11} /></button>
                    <button className="btn btn-secondary" style={{ padding: "0.22rem 0.45rem" }} onClick={() => handleToggleActive(a)} disabled={actionLoading}>
                      {a.is_active ? <ToggleRight size={11} color="#4ade80" /> : <ToggleLeft size={11} color="#f87171" />}
                    </button>
                    <button className="btn btn-secondary" style={{ padding: "0.22rem 0.45rem", color: "#f87171" }} onClick={() => setConfirmDelete(a)}><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Assistant Modal */}
      {showAdd && (
        <AddAssistantModal
          teacherId={teacherId}
          teacherName={teacherName}
          onClose={() => setShowAdd(false)}
          onCreated={a => {
            onAssistantsChange([a, ...assistants]);
            setShowAdd(false);
            showToast("تم إضافة المساعد بنجاح");
            mutate(CENTER_DASHBOARD_KEY);
          }}
          createFn={CenterService.createAssistant.bind(CenterService)}
        />
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <ResetPasswordModal
          name={resetTarget.name}
          onClose={() => setResetTarget(null)}
          onReset={async (pw) => {
            await CenterService.resetAssistantPassword(resetTarget.id, pw);
            showToast("تم تغيير كلمة المرور بنجاح");
            setResetTarget(null);
          }}
        />
      )}

      {/* Transfer Modal */}
      {transferTarget && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setTransferTarget(null); }}>
          <div className="bg-[#1e2433] rounded-2xl p-5 w-full max-w-sm border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[0.95rem]">نقل المساعد — {transferTarget.name}</h2>
              <button onClick={() => setTransferTarget(null)} className="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07]">
              <p className="text-[0.72rem] text-slate-500 mb-0.5">المدرس الحالي</p>
              <p className="text-[0.88rem] font-semibold">{teacherName}</p>
            </div>
            <form onSubmit={handleTransfer} className="flex flex-col gap-4">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">المدرس الجديد *</label>
                <select className="form-input" value={transferTeacherId} onChange={e => setTransferTeacherId(e.target.value)} required>
                  <option value="">اختر المدرس الجديد</option>
                  {allTeachers.filter(t => t.id !== teacherId).map(t => (
                    <option key={t.id} value={t.id}>{t.name}{t.subject ? ` — ${t.subject}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setTransferTarget(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading || !transferTeacherId}>
                  {actionLoading ? "جاري النقل..." : "تأكيد النقل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="bg-[#1e2433] rounded-2xl p-5 w-full max-w-sm border border-red-500/30">
            <h2 className="font-bold text-base text-red-400 mb-3">تأكيد الحذف</h2>
            <p className="text-sm text-slate-400 mb-5">هل أنت متأكد من حذف المساعد <strong className="text-white">&quot;{confirmDelete.name}&quot;</strong>؟</p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>{actionLoading ? "جاري الحذف..." : "حذف"}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
