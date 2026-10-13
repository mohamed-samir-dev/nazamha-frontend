import Link from "next/link";
import { Users, Pencil, UserMinus, Check, X, Phone, Tag, Percent, Trash2, UserPlus } from "lucide-react";
import { SiblingFamily } from "../types";
import { Group } from "@/lib/types";

interface Props {
  family: SiblingFamily;
  renamingId: string | null;
  renameValue: string;
  renameLoading: boolean;
  unlinkingId: string | null;
  setRenameValue: (v: string) => void;
  setRenamingId: (id: string | null) => void;
  handleRename: (id: string) => void;
  handleStartRename: (family: SiblingFamily) => void;
  handleUnlink: (student: { id: string; name: string }) => void;
  openDiscountModal: (family: SiblingFamily) => void;
  handleDeleteFamily: (family: SiblingFamily) => void;
  getGroup: (groupId: string | null) => Group | null | undefined;
  getFamilyDisplayName: (family: SiblingFamily) => string;
  getFamilyDiscount: (family: SiblingFamily) => {
    percent: number | null;
    reason: string;
    bookPercent: number | null;
    bookReason: string;
  };
}

export function FamilyCard({
  family, renamingId, renameValue, renameLoading, unlinkingId,
  setRenameValue, setRenamingId, handleRename, handleStartRename,
  handleUnlink, openDiscountModal, handleDeleteFamily, getGroup, getFamilyDisplayName, getFamilyDiscount,
}: Props) {
  const displayName = getFamilyDisplayName(family);
  const isRenaming = renamingId === family.familyId;
  const phone = family.members.find((m) => m.parent_phone)?.parent_phone;
  const { percent: discPct, reason: discReason } = getFamilyDiscount(family);
  const hasDiscount = discPct != null && discPct > 0;
  const { bookPercent: bookDiscPct } = getFamilyDiscount(family);
  const hasBookDiscount = bookDiscPct != null && bookDiscPct > 0;
  const isEmpty = family.members.length === 0;

  return (
    <div className="rounded-none sm:rounded-2xl border-x-0 sm:border-x border-y border-white/8 bg-white/2 hover:bg-white/3 transition-colors overflow-hidden">

      {/* Family Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/6">
        {/* Left: icon + name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-500/12 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Users size={16} className="text-teal-400" />
          </div>

          {isRenaming ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(family.familyId);
                  if (e.key === "Escape") setRenamingId(null);
                }}
                className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-teal-500/50"
              />
              <button
                onClick={() => handleRename(family.familyId)}
                disabled={renameLoading}
                className="p-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500/25 transition-colors shrink-0"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setRenamingId(null)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[var(--text-muted)] hover:bg-white/10 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="font-bold text-[var(--text-primary)] break-words">{displayName}</span>
              <span className="text-xs text-[var(--text-muted)] bg-white/5 border border-white/8 px-2 py-0.5 rounded-full whitespace-nowrap">
                {family.members.length} أبناء
              </span>
              {phone && (
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] direction-ltr whitespace-nowrap" dir="ltr">
                  <Phone size={10} />{phone}
                </span>
              )}
              {hasDiscount && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/12 border border-teal-500/25 text-teal-400 whitespace-nowrap">
                  <Percent size={10} /> {discPct}% اشتراك
                </span>
              )}
              {hasBookDiscount && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/12 border border-indigo-500/25 text-indigo-400 whitespace-nowrap">
                  <Percent size={10} /> {bookDiscPct}% كتب
                </span>
              )}
              <button
                onClick={() => handleStartRename(family)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                title="تغيير اسم العائلة"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => !isEmpty && openDiscountModal(family)}
            disabled={isEmpty}
            title={isEmpty ? "أضف طالبًا أولاً لتفعيل الخصم" : "إدارة خصم العائلة"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hasDiscount || hasBookDiscount
                ? "bg-teal-500/15 border-teal-500/30 text-teal-400 hover:bg-teal-500/25"
                : "bg-white/5 border-white/10 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)]"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Tag size={12} />
            {hasDiscount && hasBookDiscount
              ? `${discPct}%·${bookDiscPct}%`
              : hasDiscount ? `${discPct}%`
              : hasBookDiscount ? `كتب ${bookDiscPct}%`
              : "خصم"}
          </button>
          <button
            onClick={() => {
              if (confirm(`هل تريد حذف عائلة "${getFamilyDisplayName(family)}"؟ سيتم فصل جميع الأعضاء وإزالة الخصم.`))
                handleDeleteFamily(family);
            }}
            title="حذف العائلة"
            className="p-1.5 rounded-lg bg-red-500/8 border border-red-500/18 text-red-400 hover:bg-red-500/18 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Discount info strip */}
      {(hasDiscount || hasBookDiscount) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/5 border-b border-teal-500/10 text-xs text-teal-400">
          <Percent size={11} />
          <span>
            {hasDiscount && `خصم اشتراك ${discPct}%${discReason ? ` · ${discReason}` : ""}`}
            {hasDiscount && hasBookDiscount && " | "}
            {hasBookDiscount && `خصم كتب ${bookDiscPct}%`}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="p-4">
        {/* Empty family notice */}
        {isEmpty && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/7 border border-amber-500/20 mb-4">
            <div className="flex items-center gap-2">
              <UserPlus size={14} className="text-amber-400 shrink-0" />
              <span className="text-xs text-amber-400">
                لا يوجد طلاب — لإضافة خصم يجب ربط طالب أولاً
              </span>
            </div>
            <Link href="/teacher/students">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/12 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors whitespace-nowrap">
                <UserPlus size={12} /> إدارة الطلاب
              </button>
            </Link>
          </div>
        )}

        {/* Members grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {family.members.map((student) => {
            const group = getGroup(student.group_id);
            const hasCustomPrice = student.custom_monthly_price != null;
            const basePrice = student.custom_monthly_price ?? group?.monthly_price;
            const activeDiscount = discPct != null && discPct > 0 ? discPct : student.discount_value || 0;
            const effectivePrice = basePrice != null && activeDiscount
              ? Math.round(basePrice * (1 - activeDiscount / 100))
              : basePrice;
            const isUnlinking = unlinkingId === student.id;

            return (
              <div
                key={`${family.familyId}-${student.id}`}
                className="relative rounded-xl bg-white/3 border border-white/8 hover:border-white/15 hover:bg-white/5 transition-all group"
              >
                {/* Unlink button */}
                <button
                  onClick={() => handleUnlink(student)}
                  disabled={isUnlinking}
                  title="فصل عن العائلة"
                  className="absolute top-2 left-2 p-1 rounded-md bg-red-500/8 border border-red-500/15 text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                >
                  {isUnlinking
                    ? <span className="block w-2.5 h-2.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <UserMinus size={11} />}
                </button>

                <Link href={`/teacher/students/${student.id}`} className="block p-3 pl-8">
                  <p className="font-bold text-[var(--text-primary)] text-sm mb-1 truncate">{student.name}</p>
                  {student.code && (
                    <span className="student-code-badge inline-block mb-1.5 text-xs">{student.code}</span>
                  )}
                  <p className="text-xs text-[var(--text-muted)] mb-1.5 truncate">
                    {group ? group.name : "بدون مجموعة"}
                  </p>
                  {basePrice != null && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeDiscount > 0 ? (
                        <>
                          <span className="text-xs text-[var(--text-muted)] line-through">{basePrice} ج</span>
                          <span className="text-xs text-violet-400 font-bold">{effectivePrice} ج</span>
                        </>
                      ) : (
                        <span className={`text-xs font-medium ${hasCustomPrice ? "text-indigo-400" : "text-[var(--text-muted)]"}`}>
                          {basePrice} ج{hasCustomPrice && <span className="text-[0.65rem] mr-1">(مخصص)</span>}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
