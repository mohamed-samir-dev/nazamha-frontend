"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import {
  GraduationCap, Plus, Pencil, KeyRound,
  ToggleLeft, ToggleRight, ExternalLink, Search, X, Trash2,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { CenterService } from "@/lib/services/centerService";
import { CENTER_TEACHERS_KEY, CENTER_ASSISTANTS_KEY } from "@/lib/services/centerService";
import { CenterTeacher, StaffUser } from "@/lib/types";
import { CENTER_DASHBOARD_KEY } from "../page";
import { whatsappLink } from "@/lib/phoneUtils";
import { Toast } from "@/components/ui/Toast";
import AssistantsSection from "./_components/AssistantsSection";
import {
  CreateTeacherModal, EditTeacherModal,
  ResetPasswordModal, ConfirmToggleModal,
} from "./_components/TeacherModals";

// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-white/[0.05]">
      {["w-28","w-36","w-20","w-24","w-16","w-24"].map((w,i) => (
        <td key={i} className="px-4 py-3"><div className={`h-3 ${w} rounded bg-white/[0.06]`} /></td>
      ))}
    </tr>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: "999px", whiteSpace: "nowrap",
      background: active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
      color: active ? "#4ade80" : "#f87171",
      border: `1px solid ${active ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
    }}>
      {active ? "نشط" : "معطل"}
    </span>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ onClick, title, children, danger = false, disabled = false }: {
  onClick: () => void; title: string; children: React.ReactNode; danger?: boolean; disabled?: boolean;
}) {
  return (
    <button
      className="btn btn-secondary"
      style={{ padding: "0.3rem 0.55rem", minWidth: 32, ...(danger ? { color: "#f87171" } : {}) }}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CenterTeachersPage() {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<CenterTeacher | null>(null);
  const [resetTarget, setResetTarget] = useState<CenterTeacher | null>(null);
  const [toggleTarget, setToggleTarget] = useState<CenterTeacher | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CenterTeacher | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ message: msg, type });

  // ── SWR: Teachers ─────────────────────────────────────────────────────────
  const { data: teachers = [], isLoading: teachersLoading, mutate: revalidateTeachers } = useSWR<CenterTeacher[]>(
    CENTER_TEACHERS_KEY,
    () => CenterService.getTeachers(),
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      onError: () => showToast("فشل تحميل البيانات", "error"),
    }
  );

  // ── SWR: Assistants (limit=500 للعرض داخل كل مدرس) ───────────────────────
  const assistantsAllKey = `${CENTER_ASSISTANTS_KEY}?limit=500`;
  const { data: assistantsRes, mutate: revalidateAssistants } = useSWR(
    assistantsAllKey,
    () => CenterService.getAssistants({ limit: 500 }),
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
    }
  );

  const loading = teachersLoading && !teachers.length;

  // بناء assistantsMap من الـ Cache
  const assistantsMap = useMemo<Record<string, StaffUser[]>>(() => {
    const map: Record<string, StaffUser[]> = {};
    for (const s of assistantsRes?.data ?? []) {
      if (s.teacher_id) {
        if (!map[s.teacher_id]) map[s.teacher_id] = [];
        map[s.teacher_id].push(s);
      }
    }
    return map;
  }, [assistantsRes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.subject || "").toLowerCase().includes(q) ||
      (t.phone || "").includes(q)
    );
  }, [teachers, search]);

  const activeCount = teachers.filter(t => t.is_active).length;

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    setActionLoading(true);
    try {
      const updated = await CenterService.updateTeacher(toggleTarget.id, { is_active: !toggleTarget.is_active });
      // Optimistic update في الـ Cache
      revalidateTeachers(
        prev => prev?.map(t => t.id === toggleTarget.id ? { ...t, ...updated } : t),
        { revalidate: false }
      );
      showToast(toggleTarget.is_active ? "تم تعطيل المدرس" : "تم تفعيل المدرس");
      mutate(CENTER_DASHBOARD_KEY);
      setToggleTarget(null);
    } catch (err: any) {
      showToast(err.message || "فشل تغيير الحالة", "error");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await CenterService.removeTeacher(confirmDelete.id);
      // تحديث Teachers Cache فقط
      revalidateTeachers(
        prev => prev?.filter(t => t.id !== confirmDelete.id),
        { revalidate: false }
      );
      // تحديث Assistants Cache لإزالة مساعدي المدرس المحذوف
      revalidateAssistants(
        prev => prev ? { ...prev, data: prev.data.filter(a => a.teacher_id !== confirmDelete.id) } : prev,
        { revalidate: false }
      );
      showToast("تم حذف المدرس بنجاح");
      setConfirmDelete(null);
      mutate(CENTER_DASHBOARD_KEY);
    } catch (err: any) {
      showToast(err.message || "فشل الحذف", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-6 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[12px] bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
            <GraduationCap size={19} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[1.4rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent leading-tight">
              المدرسون
            </h1>
            <p className="text-[0.8rem] text-slate-500 mt-0.5">
              {loading ? "جاري التحميل..." : `${teachers.length} مدرس — ${activeCount} نشط`}
            </p>
          </div>
        </div>
        <button className="btn btn-primary shrink-0" style={{ padding: "0.55rem 1rem", fontSize: "0.88rem" }} onClick={() => setShowCreate(true)}>
          <Plus size={15} /><span>إضافة مدرس</span>
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      {!loading && teachers.length > 0 && (
        <div className="relative mb-5">
          <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="form-input"
            style={{ paddingRight: "2.5rem", paddingLeft: search ? "2.5rem" : undefined }}
            placeholder="بحث بالاسم أو البريد أو المادة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  {["الاسم","البريد الإلكتروني","المادة","الهاتف","الحالة","الإجراءات"].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-[0.75rem] font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{[1,2,3].map(i => <SkeletonRow key={i} />)}</tbody>
            </table>
          </div>
        </div>
      ) : teachers.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center py-16 gap-4 text-slate-500">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
            <GraduationCap size={28} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-300 mb-1">لا يوجد مدرسون حتى الآن</p>
            <p className="text-sm">ابدأ بإضافة أول مدرس للسنتر</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /><span>إضافة مدرس</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <Search size={26} className="opacity-30" />
          <p className="text-sm">لا توجد نتائج لـ &quot;<span className="text-white">{search}</span>&quot;</p>
          <button className="btn btn-secondary text-sm" onClick={() => setSearch("")}>مسح البحث</button>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  {["الاسم","البريد الإلكتروني","المادة","الهاتف","الحالة","الإجراءات"].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-[0.75rem] font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [1,2,3].map(i => <SkeletonRow key={i} />)
                  : filtered.map((t, idx) => (
                  <tr key={t.id} style={{ borderBottom: idx < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    className="hover:bg-white/[0.02] transition-colors">
                    {/* الاسم */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/25 text-teal-400 flex items-center justify-center shrink-0">
                          <GraduationCap size={14} />
                        </div>
                        <span className="font-semibold text-white text-[0.88rem]">{t.name}</span>
                      </div>
                    </td>
                    {/* البريد */}
                    <td className="px-4 py-3 text-slate-400 text-[0.8rem] whitespace-nowrap" dir="ltr">{t.email}</td>
                    {/* المادة */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.subject
                        ? <span className="text-[0.72rem] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md">{t.subject}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    {/* الهاتف */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {t.phone && <span className="text-[0.8rem] text-slate-400" dir="ltr">{t.phone}</span>}
                        {whatsappLink(t.phone) && (
                          <a href={whatsappLink(t.phone)!} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[0.7rem] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-md hover:bg-green-500/20 transition-colors no-underline">
                            <FaWhatsapp size={10} />
                          </a>
                        )}
                        {!t.phone && <span className="text-slate-600">—</span>}
                      </div>
                    </td>
                    {/* الحالة */}
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge active={t.is_active} /></td>
                    {/* الإجراءات */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <ActionBtn onClick={() => router.push(`/center/teachers/${t.id}`)} title="عرض التفاصيل"><ExternalLink size={13} /></ActionBtn>
                        <ActionBtn onClick={() => setEditTarget(t)} title="تعديل"><Pencil size={13} /></ActionBtn>
                        <ActionBtn onClick={() => setResetTarget(t)} title="تغيير كلمة المرور"><KeyRound size={13} /></ActionBtn>
                        <ActionBtn onClick={() => setToggleTarget(t)} title={t.is_active ? "تعطيل" : "تفعيل"} disabled={actionLoading}>
                          {t.is_active ? <ToggleRight size={13} color="#4ade80" /> : <ToggleLeft size={13} color="#f87171" />}
                        </ActionBtn>
                        <ActionBtn onClick={() => setConfirmDelete(t)} title="حذف" danger><Trash2 size={13} /></ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateTeacherModal
          onClose={() => setShowCreate(false)}
          onCreated={t => {
            revalidateTeachers(prev => [t, ...(prev ?? [])], { revalidate: false });
            setShowCreate(false);
            showToast("تم إضافة المدرس بنجاح");
            mutate(CENTER_DASHBOARD_KEY);
          }}
          createFn={CenterService.createTeacher.bind(CenterService)}
        />
      )}

      {editTarget && (
        <EditTeacherModal
          teacher={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={updated => {
            revalidateTeachers(
              prev => prev?.map(t => t.id === updated.id ? { ...t, ...updated } : t),
              { revalidate: false }
            );
            setEditTarget(null);
            showToast("تم تحديث بيانات المدرس");
            mutate(CENTER_DASHBOARD_KEY);
          }}
          updateFn={CenterService.updateTeacher.bind(CenterService)}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          name={resetTarget.name}
          onClose={() => setResetTarget(null)}
          onReset={async (pw) => {
            await CenterService.resetTeacherPassword(resetTarget.id, pw);
            showToast("تم تغيير كلمة المرور بنجاح");
            setResetTarget(null);
          }}
        />
      )}

      {toggleTarget && (
        <ConfirmToggleModal
          teacher={toggleTarget}
          onClose={() => setToggleTarget(null)}
          onConfirm={handleToggleActive}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="bg-[#1e2433] rounded-2xl p-5 w-full max-w-sm border border-red-500/30">
            <h2 className="font-bold text-base text-red-400 mb-3">تأكيد الحذف</h2>
            <p className="text-sm text-slate-400 mb-5">
              هل أنت متأكد من حذف المدرس <strong className="text-white">&quot;{confirmDelete.name}&quot;</strong>؟
              سيتم حذف جميع مساعديه أيضاً.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? "جاري الحذف..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
