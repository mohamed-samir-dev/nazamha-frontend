"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import {
  UserCheck, Plus, Pencil, KeyRound, ToggleLeft, ToggleRight,
  Trash2, Search, X, ArrowRightLeft,
} from "lucide-react";
import { CenterService } from "@/lib/services/centerService";
import { CENTER_TEACHERS_KEY, CENTER_ASSISTANTS_KEY } from "@/lib/services/centerService";
import { StaffUser, CenterTeacher } from "@/lib/types";
import { CENTER_DASHBOARD_KEY } from "../page";
import { Toast } from "@/components/ui/Toast";
import {
  AddAssistantModal,
  EditAssistantModal,
  ResetPasswordModal,
} from "./_components/AssistantModals";
import { TransferModal } from "./_components/TransferModal";

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-white/[0.05] shrink-0" /><div className="h-3 w-28 rounded bg-white/[0.06]" /></div></td>
      <td><div className="h-3 w-36 rounded bg-white/[0.05]" /></td>
      <td><div className="h-3 w-24 rounded bg-white/[0.05]" /></td>
      <td><div className="h-5 w-12 rounded-full bg-white/[0.05] mx-auto" /></td>
      <td><div className="h-3 w-16 rounded bg-white/[0.05] mx-auto" /></td>
      <td><div className="flex gap-1.5 justify-center">{[1,2,3,4].map(i => <div key={i} className="h-7 w-7 rounded-lg bg-white/[0.05]" />)}</div></td>
    </tr>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: "0.72rem", padding: "0.18rem 0.65rem", borderRadius: "999px", whiteSpace: "nowrap",
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
      style={{ padding: "0.3rem 0.55rem", ...(danger ? { color: "#f87171" } : {}) }}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ── Format last login ─────────────────────────────────────────────────────────
function formatLastLogin(date?: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "أمس";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

// ── SWR fetcher for assistants (supports query params) ────────────────────────
function buildAssistantsKey(params: {
  search?: string; teacher_id?: string; status?: string; page: number;
}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.teacher_id) q.set("teacher_id", params.teacher_id);
  if (params.status) q.set("status", params.status);
  q.set("page", String(params.page));
  q.set("limit", "20");
  return `${CENTER_ASSISTANTS_KEY}?${q.toString()}`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CenterAssistantsPage() {
  const searchParams = useSearchParams();
  const preselectedTeacherId = searchParams.get("teacher_id") || "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState(preselectedTeacherId);
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [resetTarget, setResetTarget] = useState<StaffUser | null>(null);
  const [transferTarget, setTransferTarget] = useState<StaffUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StaffUser | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── SWR: Assistants (paginated + filtered) ────────────────────────────────
  const assistantsKey = buildAssistantsKey({
    search: debouncedSearch || undefined,
    teacher_id: teacherFilter || undefined,
    status: statusFilter || undefined,
    page,
  });

  const { data: assistantsRes, isLoading: loading, mutate: revalidateAssistants } = useSWR(
    assistantsKey,
    () => CenterService.getAssistants({
      search: debouncedSearch || undefined,
      teacher_id: teacherFilter || undefined,
      status: statusFilter || undefined,
      page,
      limit: 20,
    }),
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      onError: () => showToast("تعذر تحميل المساعدين", "error"),
    }
  );

  // ── SWR: Teachers (للـ filter dropdown) ──────────────────────────────────
  const { data: teachers = [] } = useSWR<CenterTeacher[]>(
    CENTER_TEACHERS_KEY,
    () => CenterService.getTeachers(),
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
    }
  );

  const assistants = assistantsRes?.data ?? [];
  const total = assistantsRes?.total ?? 0;
  const pages = assistantsRes?.pages ?? 1;

  const handleToggleStatus = async (a: StaffUser) => {
    setActionLoading(true);
    try {
      const res = await CenterService.toggleAssistantStatus(a.id);
      // Optimistic update في الـ Cache
      await revalidateAssistants(
        prev => prev ? { ...prev, data: prev.data.map(x => x.id === a.id ? { ...x, is_active: res.is_active } : x) } : prev,
        { revalidate: false }
      );
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
      setConfirmDelete(null);
      showToast("تم حذف المساعد بنجاح");
      // إعادة جلب بيانات المساعدين فقط
      await revalidateAssistants();
      mutate(CENTER_DASHBOARD_KEY);
    } catch (err: any) {
      showToast(err.message || "فشل الحذف", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const activeTeachers = useMemo(() => teachers.filter(t => t.is_active), [teachers]);
  const hasFilters = debouncedSearch || teacherFilter || statusFilter;

  return (
    <div style={{ minWidth: 0, maxWidth: "100%" }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-7 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-[44px] h-[44px] rounded-[14px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[1.4rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent leading-tight">
              المساعدون
            </h1>
            <p className="text-[0.8rem] text-slate-500 mt-0.5">
              {loading && !assistantsRes ? "جاري التحميل..." : `${total} مساعد مسجل`}
            </p>
          </div>
        </div>
        <button className="btn btn-primary shrink-0" style={{ padding: "0.55rem 1rem", fontSize: "0.88rem" }} onClick={() => setShowCreate(true)}>
          <Plus size={15} /><span>إضافة مساعد</span>
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5">
        <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="form-input"
            style={{ paddingTop: "0.45rem", paddingBottom: "0.45rem", paddingRight: "2.2rem", paddingLeft: search ? "2.2rem" : "0.7rem", fontSize: "0.85rem" }}
            placeholder="بحث بالاسم أو البريد..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="بحث عن مساعد"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
              aria-label="مسح البحث"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            className="form-input"
            style={{ padding: "0.45rem 0.7rem", fontSize: "0.85rem", minWidth: 0, flex: "1 1 0" }}
            value={teacherFilter}
            onChange={e => { setTeacherFilter(e.target.value); setPage(1); }}
            aria-label="فلتر المدرس"
          >
            <option value="">كل المدرسين</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ padding: "0.45rem 0.7rem", fontSize: "0.85rem", minWidth: 0, flex: "1 1 0" }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as "" | "active" | "inactive"); setPage(1); }}
            aria-label="فلتر الحالة"
          >
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">معطل</option>
          </select>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          {/* أول تحميل بدون بيانات سابقة → Skeleton */}
          {loading && !assistantsRes ? (
            <table className="students-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>المساعد</th><th>البريد الإلكتروني</th><th>المدرس</th>
                  <th style={{ textAlign: "center" }}>الحالة</th>
                  <th style={{ textAlign: "center" }}>آخر دخول</th>
                  <th style={{ textAlign: "center" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>{[1,2,3].map(i => <SkeletonRow key={i} />)}</tbody>
            </table>
          ) : assistants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-500 px-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <UserCheck size={30} />
              </div>
              <div className="text-center">
                {hasFilters ? (
                  <>
                    <p className="font-semibold text-slate-300 mb-1">لا توجد نتائج</p>
                    <p className="text-sm">جرب تغيير معايير البحث أو الفلتر</p>
                    <button className="btn btn-secondary text-sm mt-3" onClick={() => { setSearch(""); setTeacherFilter(""); setStatusFilter(""); }}>
                      مسح الفلاتر
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-slate-300 mb-1">لا يوجد مساعدون حتى الآن</p>
                    <p className="text-sm">أضف مساعداً واربطه بأحد المدرسين</p>
                    <button className="btn btn-primary mt-3" onClick={() => setShowCreate(true)}>
                      <Plus size={15} /><span>إضافة مساعد</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <table className="students-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>المساعد</th>
                  <th>البريد الإلكتروني</th>
                  <th>المدرس</th>
                  <th style={{ textAlign: "center" }}>الحالة</th>
                  <th style={{ textAlign: "center" }}>آخر دخول</th>
                  <th style={{ textAlign: "center" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {assistants.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                          <UserCheck size={14} />
                        </div>
                        {a.name}
                      </div>
                    </td>
                    <td style={{ direction: "ltr", textAlign: "right", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {a.email}
                    </td>
                    <td>
                      {a.teacher_name ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[0.82rem] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md whitespace-nowrap w-fit">
                            {a.teacher_name}
                          </span>
                          {a.teacher_subject && (
                            <span className="text-[0.72rem] text-slate-500 px-1">{a.teacher_subject}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <StatusBadge active={a.is_active} />
                    </td>
                    <td style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      {formatLastLogin(a.last_login_at)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                        <ActionBtn onClick={() => setEditTarget(a)} title="تعديل">
                          <Pencil size={13} />
                        </ActionBtn>
                        <ActionBtn onClick={() => setTransferTarget(a)} title="نقل إلى مدرس آخر">
                          <ArrowRightLeft size={13} />
                        </ActionBtn>
                        <ActionBtn onClick={() => setResetTarget(a)} title="تغيير كلمة المرور">
                          <KeyRound size={13} />
                        </ActionBtn>
                        <ActionBtn onClick={() => handleToggleStatus(a)} title={a.is_active ? "تعطيل" : "تفعيل"} disabled={actionLoading}>
                          {a.is_active
                            ? <ToggleRight size={13} color="#4ade80" />
                            : <ToggleLeft size={13} color="#f87171" />
                          }
                        </ActionBtn>
                        <ActionBtn onClick={() => setConfirmDelete(a)} title="حذف" danger>
                          <Trash2 size={13} />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            className="btn btn-secondary"
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            السابق
          </button>
          <span className="text-sm text-slate-400">{page} / {pages}</span>
          <button
            className="btn btn-secondary"
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
            disabled={page >= pages}
            onClick={() => setPage(p => p + 1)}
          >
            التالي
          </button>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showCreate && (
        <AddAssistantModal
          teachers={activeTeachers}
          preselectedTeacherId={preselectedTeacherId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            showToast("تم إضافة المساعد بنجاح");
            // تحديث المساعدين فقط
            revalidateAssistants();
            mutate(CENTER_DASHBOARD_KEY);
          }}
          createFn={CenterService.createAssistant.bind(CenterService)}
        />
      )}

      {editTarget && (
        <EditAssistantModal
          assistant={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={updated => {
            // Optimistic update بدون Request إضافي
            revalidateAssistants(
              prev => prev ? { ...prev, data: prev.data.map(a => a.id === updated.id ? { ...a, ...updated } : a) } : prev,
              { revalidate: false }
            );
            setEditTarget(null);
            showToast("تم تعديل المساعد بنجاح");
          }}
          updateFn={CenterService.updateAssistant.bind(CenterService)}
        />
      )}

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

      {transferTarget && (
        <TransferModal
          assistant={transferTarget}
          teachers={teachers}
          onClose={() => setTransferTarget(null)}
          onTransferred={() => {
            setTransferTarget(null);
            showToast("تم نقل المساعد بنجاح");
            revalidateAssistants();
            mutate(CENTER_DASHBOARD_KEY);
          }}
          transferFn={CenterService.transferAssistant.bind(CenterService)}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-sm border border-red-500/30">
            <h2 className="font-bold text-base text-red-400 mb-3">تأكيد الحذف</h2>
            <p className="text-sm text-slate-400 mb-5">
              هل أنت متأكد من حذف المساعد <strong className="text-white">&quot;{confirmDelete.name}&quot;</strong>؟
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
