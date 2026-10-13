"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, UserPlus2, Search, Plus } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { useSiblings } from "./hooks/useSiblings";
import { FamilyCard } from "./components/FamilyCard";
import { DiscountModal } from "./components/DiscountModal";
import { AddFamilyModal } from "./components/AddFamilyModal";

export default function SiblingsPage() {
  const [showAddFamily, setShowAddFamily] = useState(false);

  const {
    families, loading, toast, setToast,
    search, setSearch, filteredFamilies,
    renamingId, setRenamingId, renameValue, setRenameValue, renameLoading,
    unlinkingId,
    discountModal, setDiscountModal,
    discountPercent, setDiscountPercent,
    discountReason, setDiscountReason,
    bookDiscountPercent, setBookDiscountPercent,
    bookDiscountReason, setBookDiscountReason,
    discountLoading,
    getGroup, getFamilyDisplayName, getFamilyDiscount,
    handleStartRename, handleRename, handleUnlink,
    openDiscountModal, handleSaveDiscount, handleAddFamily, handleDeleteFamily, handleRemoveDiscount,
  } = useSiblings();

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="siblings-page-wrapper">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-1">الأخوات</h1>
          <p className="text-sm text-[var(--text-muted)]">
            <span className="text-teal-400 font-semibold">{families.length}</span> عائلة
            {" · "}
            <span className="text-teal-400 font-semibold">{families.reduce((s, f) => s + f.members.length, 0)}</span> طالب مرتبط
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddFamily(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold transition-all shadow-[0_2px_12px_rgba(20,184,166,0.3)]"
          >
            <Plus size={15} /> إضافة عائلة
          </button>
          <Link href="/teacher/students">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--text-primary)] text-sm font-semibold transition-all">
              <UserPlus2 size={15} /> ربط أخوات جديدة
            </button>
          </Link>
        </div>
      </div>

      {/* Search */}
      {families.length > 0 && (
        <div className="relative mb-5 px-4 sm:px-0">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" style={{ right: 'calc(1rem + 16px)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم العائلة أو الطالب أو رقم الهاتف..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-500/50 focus:bg-white/8 transition-all"
          />
        </div>
      )}

      {/* Empty State */}
      {families.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl border border-white/8 bg-white/2 text-center mx-4 sm:mx-0">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Users size={28} className="text-teal-400" />
          </div>
          <p className="font-bold text-[var(--text-primary)]">لا توجد عائلات مرتبطة بعد</p>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">
            اذهب لصفحة الطلاب وستجد تنبيهاً تلقائياً عند وجود أخوات محتملين
          </p>
        </div>
      ) : filteredFamilies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[var(--text-muted)]">
          <Search size={28} />
          <p>لا توجد نتائج</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-0 sm:px-0">
          {filteredFamilies.map((family) => (
            <FamilyCard
              key={family.familyId}
              family={family}
              renamingId={renamingId}
              renameValue={renameValue}
              renameLoading={renameLoading}
              unlinkingId={unlinkingId}
              setRenameValue={setRenameValue}
              setRenamingId={setRenamingId}
              handleRename={handleRename}
              handleStartRename={handleStartRename}
              handleUnlink={handleUnlink}
              openDiscountModal={openDiscountModal}
              handleDeleteFamily={handleDeleteFamily}
              getGroup={getGroup}
              getFamilyDisplayName={getFamilyDisplayName}
              getFamilyDiscount={getFamilyDiscount}
            />
          ))}
        </div>
      )}

      {discountModal && (
        <DiscountModal
          discountModal={discountModal}
          discountPercent={discountPercent}
          discountReason={discountReason}
          bookDiscountPercent={bookDiscountPercent}
          bookDiscountReason={bookDiscountReason}
          discountLoading={discountLoading}
          setDiscountModal={setDiscountModal}
          setDiscountPercent={setDiscountPercent}
          setDiscountReason={setDiscountReason}
          setBookDiscountPercent={setBookDiscountPercent}
          setBookDiscountReason={setBookDiscountReason}
          handleSaveDiscount={handleSaveDiscount}
          handleRemoveDiscount={handleRemoveDiscount}
        />
      )}

      {showAddFamily && (
        <AddFamilyModal
          onClose={() => setShowAddFamily(false)}
          onCreated={(familyId, familyName) => {
            handleAddFamily(familyId, familyName);
            setShowAddFamily(false);
          }}
          existingFamilies={families}
          getFamilyDisplayName={getFamilyDisplayName}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
