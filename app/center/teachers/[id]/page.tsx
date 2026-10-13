"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import {
  GraduationCap, ArrowRight, Pencil, ToggleLeft, ToggleRight,
  KeyRound, X, Eye, EyeOff, ArrowRightLeft, Trash2, Plus, RefreshCw,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { CenterService, CENTER_TEACHERS_KEY, CENTER_ASSISTANTS_KEY } from "@/lib/services/centerService";
import { CenterTeacher, StaffUser } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";
import { whatsappLink } from "@/lib/phoneUtils";
import { CENTER_DASHBOARD_KEY } from "../../page";
import KpiCards from "./_components/KpiCards";
import GroupsSection from "./_components/GroupsSection";
import StudentsSection from "./_components/StudentsSection";
import AttendanceSection from "./_components/AttendanceSection";
import AssistantsDashSection from "./_components/AssistantsDashSection";
import {
  EditTeacherModal, ResetPasswordModal, ConfirmToggleModal,
} from "../_components/TeacherModals";

type ModalMode = "add-assistant" | "reset-assistant-password" | "transfer-assistant" | null;

const STATS_KEY = (id: string) => `/centers/me/teachers/${id}/stats`;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

export default function CenterTeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });

  // Modals state
  const [editTarget, setEditTarget] = useState(false);
  const [resetPwTarget, setResetPwTarget] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(false);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<StaffUser | null>(null);
  const [confirmDeleteAssistant, setConfirmDeleteAssistant] = useState<StaffUser | null>(null);
  const [transferTeacherId, setTransferTeacherId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "" });

  // ── SWR: Teachers list (reuse cache from teachers page) ──────────────────
  const { data: teachers = [], mutate: revalidateTeachers } = useSWR<CenterTeacher[]>(
    CENTER_TEACHERS_KEY,
    () => CenterService.getTeachers(),
    { dedupingInterval: 30_000, revalidateOnFocus: false, keepPreviousData: true }
  );

  const teacher = useMemo(() => teachers.find(t => t.id === id) ?? null, [teachers, id]);

  // ── SWR: Teacher stats ───────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading, error: statsError, mutate: revalidateStats } = useSWR(
    id ? STATS_KEY(id) : null,
    () => CenterService.getTeacherStats(id),
    { dedupingInterval: 30_000, revalidateOnFocus: false, keepPreviousData: true }
  );

  // ── SWR: Assistants ──────────────────────────────────────────────────────
  const assistantsKey = `${CENTER_ASSISTANTS_KEY}?teacher_id=${id}`;
  const { data: assistantsRes, mutate: revalidateAssistants } = useSWR(
    id ? assistantsKey : null,
    () => CenterService.getAssistants({ teacher_id: id }),
    { dedupingInterval: 30_000, revalidateOnFocus: false, keepPreviousData: true }
  );
  const assistants: StaffUser[] = assistantsRes?.data ?? [];

  const teachersLoading = !teachers.length;

  // Redirect if teacher not found after load
  if (!teachersLoading && !teacher) {
    router.replace("/center/teachers");
    return null;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleActive = async () => {
    if (!teacher) return;
    setActionLoading(true);
    try {
      const updated = await CenterService.updateTeacher(teacher.id, { is_active: !teacher.is_active });
      revalidateTeachers(prev => prev?.map(t => t.id === teacher.id ? { ...t, ...updated } : t), { revalidate: false });
      showToast(teacher.is_active ? "تم تعطيل المدرس" : "تم تفعيل المدرس");
      mutate(CENTER_DASHBOARD_KEY);
      setToggleTarget(false);
    } catch (err: any) {
      showToast(err.message || "فشل تغيير الحالة", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) { showToast("جميع الحقول مطلوبة", "error"); return; }
    setActionLoading(true);
    try {
      const a = await CenterService.createAssistant({ name: addForm.name, email: addForm.email, password: addForm.password, teacher_id: id });
      revalidateAssistants(prev => prev ? { ...prev, data: [a, ...prev.data] } : prev, { revalidate: false });
      showToast("تم إضافة المساعد بنجاح");
      setModal(null);
      setAddForm({ name: "", email: "", password: "" });
    } catch (err: any) {
      showToast(err.message || "فشل إضافة المساعد", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetAssistantPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssistant || newPassword.length < 6) { showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error"); return; }
    setActionLoading(true);
    try {
      await CenterService.resetAssistantPassword(selectedAssistant.id, newPassword);
      showToast("تم تغيير كلمة المرور بنجاح");
      setModal(null);
    } catch (err: any) {
      showToast(err.message || "فشل تغيير كلمة المرور", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssistant || !transferTeacherId) { showToast("يجب اختيار مدرس", "error"); return; }
    setActionLoading(true);
    try {
      await CenterService.transferAssistant(selectedAssistant.id, transferTeacherId);
      revalidateAssistants(prev => prev ? { ...prev, data: prev.data.filter(a => a.id !== selectedAssistant.id) } : prev, { revalidate: false });
      showToast("تم نقل المساعد بنجاح");
      setModal(null);
    } catch (err: any) {
      showToast(err.message || "فشل نقل المساعد", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAssistant = async (a: StaffUser) => {
    setActionLoading(true);
    try {
      const res = await CenterService.toggleAssistantStatus(a.id);
      revalidateAssistants(prev => prev ? { ...prev, data: prev.data.map(x => x.id === a.id ? { ...x, is_active: res.is_active } : x) } : prev, { revalidate: false });
      showToast(res.is_active ? "تم تفعيل المساعد" : "تم تعطيل المساعد");
    } catch (err: any) {
      showToast(err.message || "فشل تغيير الحالة", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAssistant = async () => {
    if (!confirmDeleteAssistant) return;
    setActionLoading(true);
    try {
      await CenterService.deleteAssistant(confirmDeleteAssistant.id);
      revalidateAssistants(prev => prev ? { ...prev, data: prev.data.filter(a => a.id !== confirmDeleteAssistant.id) } : prev, { revalidate: false });
      showToast("تم حذف المساعد بنجاح");
      setConfirmDeleteAssistant(null);
    } catch (err: any) {
      showToast(err.message || "فشل الحذف", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (teachersLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!teacher) return null;

  // ── Stats error ───────────────────────────────────────────────────────────
  const statsSection = statsError ? (
    <div className="glass-panel flex flex-col items-center justify-center py-12 gap-3 text-slate-500 mb-6">
      <p className="text-sm">تعذر تحميل إحصائيات المدرس</p>
      <button className="btn btn-secondary" onClick={() => revalidateStats()}>
        <RefreshCw size={14} /><span>إعادة المحاولة</span>
      </button>
    </div>
  ) : null;

  return (
    <div>
      {/* ── Back + Header ─────────────────────────────────────────────────── */}
      <div className="mb-6 pb-5 border-b border-white/[0.08]">
        {/* Top row: back + actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <button className="btn btn-secondary shrink-0" style={{ padding: "0.4rem 0.6rem" }} onClick={() => router.push("/center/teachers")}>
            <ArrowRight size={15} />
          </button>
          <div className="flex items-center gap-1.5">
            <button className="btn btn-secondary" style={{ padding: "0.35rem 0.6rem" }} title="تعديل" onClick={() => setEditTarget(true)}>
              <Pencil size={13} />
            </button>
            <button className="btn btn-secondary" style={{ padding: "0.35rem 0.6rem" }} title="تغيير كلمة المرور" onClick={() => setResetPwTarget(true)}>
              <KeyRound size={13} />
            </button>
            <button className="btn btn-secondary" style={{ padding: "0.35rem 0.6rem" }} title={teacher.is_active ? "تعطيل" : "تفعيل"} onClick={() => setToggleTarget(true)}>
              {teacher.is_active ? <ToggleRight size={13} color="#4ade80" /> : <ToggleLeft size={13} color="#f87171" />}
            </button>
          </div>
        </div>
        {/* Teacher identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
            <GraduationCap size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent leading-tight truncate">
                {teacher.name}
              </h1>
              <span style={{
                fontSize: "0.68rem", padding: "0.12rem 0.55rem", borderRadius: "999px", whiteSpace: "nowrap",
                background: teacher.is_active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                color: teacher.is_active ? "#4ade80" : "#f87171",
                border: `1px solid ${teacher.is_active ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
              }}>
                {teacher.is_active ? "نشط" : "معطل"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {teacher.subject && <span className="text-[0.72rem] text-violet-400">{teacher.subject}</span>}
              {teacher.phone && <span className="text-[0.72rem] text-slate-500" dir="ltr">{teacher.phone}</span>}
              {whatsappLink(teacher.phone) && (
                <a href={whatsappLink(teacher.phone)!} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.65rem] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-md hover:bg-green-500/20 transition-colors no-underline">
                  <FaWhatsapp size={9} /><span>واتساب</span>
                </a>
              )}
              {teacher.created_at && (
                <span className="text-[0.68rem] text-slate-600 hidden sm:inline">انضم {fmtDate(teacher.created_at)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <KpiCards
        studentsCount={stats?.students_count ?? 0}
        groupsCount={stats?.groups_count ?? 0}
        sessionsThisMonth={stats?.sessions_this_month ?? 0}
        attendanceRate={stats?.attendance_rate ?? null}
        loading={statsLoading && !stats}
      />

      {statsSection}

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      {stats && (
        <div className="flex flex-col gap-5">
          {/* Row 1: Students + Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            <StudentsSection
              students={stats.recent_students}
              totalCount={stats.students_count}
              activeCount={stats.active_students_count}
              suspendedCount={stats.suspended_count}
            />
            <AttendanceSection
              attendanceRate={stats.attendance_rate}
              presentCount={stats.present_count}
              absentCount={stats.absent_count}
            />
          </div>

          {/* Row 2: Groups */}
          <GroupsSection groups={stats.groups} teacherId={id} />

          {/* Row 3: Assistants */}
          <AssistantsDashSection
            assistants={assistants}
            actionLoading={actionLoading}
            onAdd={() => { setAddForm({ name: "", email: "", password: "" }); setShowPw(false); setModal("add-assistant"); }}
            onToggle={handleToggleAssistant}
            onResetPassword={a => { setSelectedAssistant(a); setNewPassword(""); setShowPw(false); setModal("reset-assistant-password"); }}
            onTransfer={a => { setSelectedAssistant(a); setTransferTeacherId(""); setModal("transfer-assistant"); }}
            onDelete={a => setConfirmDeleteAssistant(a)}
          />
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {editTarget && (
        <EditTeacherModal
          teacher={teacher}
          onClose={() => setEditTarget(false)}
          onUpdated={updated => {
            revalidateTeachers(prev => prev?.map(t => t.id === updated.id ? { ...t, ...updated } : t), { revalidate: false });
            setEditTarget(false);
            showToast("تم تحديث بيانات المدرس");
            mutate(CENTER_DASHBOARD_KEY);
          }}
          updateFn={CenterService.updateTeacher.bind(CenterService)}
        />
      )}

      {resetPwTarget && (
        <ResetPasswordModal
          name={teacher.name}
          onClose={() => setResetPwTarget(false)}
          onReset={async pw => {
            await CenterService.resetTeacherPassword(teacher.id, pw);
            showToast("تم تغيير كلمة المرور بنجاح");
            setResetPwTarget(false);
          }}
        />
      )}

      {toggleTarget && (
        <ConfirmToggleModal
          teacher={teacher}
          onClose={() => setToggleTarget(false)}
          onConfirm={handleToggleActive}
        />
      )}

      {/* Add Assistant Modal */}
      {modal === "add-assistant" && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-[#1e2433] rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md border border-white/10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[0.95rem]">إضافة مساعد لـ {teacher.name}</h2>
              <button onClick={() => setModal(null)} className="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-white"><X size={17} /></button>
            </div>
            <form onSubmit={handleAddAssistant} className="flex flex-col gap-4">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">الاسم *</label>
                <input className="form-input" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">البريد الإلكتروني *</label>
                <input className="form-input" type="email" dir="ltr" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">كلمة المرور *</label>
                <div style={{ position: "relative" }}>
                  <input className="form-input" type={showPw ? "text" : "password"} dir="ltr" value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} required style={{ paddingLeft: "2.5rem" }} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? "جاري الحفظ..." : "إضافة"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Assistant Password Modal */}
      {modal === "reset-assistant-password" && selectedAssistant && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-[#1e2433] rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm border border-white/10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[0.95rem]">تغيير كلمة مرور — {selectedAssistant.name}</h2>
              <button onClick={() => setModal(null)} className="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-white"><X size={17} /></button>
            </div>
            <form onSubmit={handleResetAssistantPw} className="flex flex-col gap-4">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">كلمة المرور الجديدة</label>
                <div style={{ position: "relative" }}>
                  <input className="form-input" type={showPw ? "text" : "password"} dir="ltr" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} style={{ paddingLeft: "2.5rem" }} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? "جاري الحفظ..." : "تغيير"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Assistant Modal */}
      {modal === "transfer-assistant" && selectedAssistant && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-[#1e2433] rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm border border-white/10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[0.95rem]">نقل المساعد — {selectedAssistant.name}</h2>
              <button onClick={() => setModal(null)} className="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-white"><X size={17} /></button>
            </div>
            <form onSubmit={handleTransfer} className="flex flex-col gap-4">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">المدرس الجديد *</label>
                <select className="form-input" value={transferTeacherId} onChange={e => setTransferTeacherId(e.target.value)} required>
                  <option value="">اختر المدرس الجديد</option>
                  {teachers.filter(t => t.id !== id).map(t => (
                    <option key={t.id} value={t.id}>{t.name}{t.subject ? ` — ${t.subject}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? "جاري النقل..." : "تأكيد النقل"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Assistant */}
      {confirmDeleteAssistant && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#1e2433] rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm border border-red-500/30">
            <h2 className="font-bold text-base text-red-400 mb-3">تأكيد الحذف</h2>
            <p className="text-sm text-slate-400 mb-5">هل أنت متأكد من حذف المساعد <strong className="text-white">&quot;{confirmDeleteAssistant.name}&quot;</strong>؟</p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-secondary" onClick={() => setConfirmDeleteAssistant(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={handleDeleteAssistant} disabled={actionLoading}>{actionLoading ? "جاري الحذف..." : "حذف"}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
