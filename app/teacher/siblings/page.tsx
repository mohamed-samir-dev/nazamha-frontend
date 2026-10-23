"use client";

import { useState } from "react";
import styles from "./siblings.module.css";
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
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <div><span className={styles.eyebrow}><Users size={16} /> الطلاب والعائلات</span><h1>الإخوات والعائلات</h1><p>اجمع الإخوات في عائلة واحدة وتابع خصوماتهم بسهولة.</p></div>
        <button className={styles.primary} onClick={() => setShowAddFamily(true)}><Plus size={18} /> إضافة عائلة</button>
      </header>
      <div className={styles.stats}>
        <div><span>العائلات</span><strong>{families.length.toLocaleString("ar-EG")}</strong></div>
        <div><span>الطلاب المرتبطون</span><strong>{families.reduce((sum,f) => sum+f.members.length,0).toLocaleString("ar-EG")}</strong></div>
        <div><span>عائلات بخصم</span><strong>{families.filter(f => {const d=getFamilyDiscount(f); return (d.percent || 0)>0 || (d.bookPercent || 0)>0;}).length.toLocaleString("ar-EG")}</strong></div>
      </div>
      <div className={styles.toolbar}>
        <label className={styles.search}><Search size={18} /><input aria-label="البحث عن عائلة أو طالب" value={search} onChange={e => setSearch(e.target.value)} placeholder="اسم العائلة، الطالب أو رقم الهاتف" />{search && <button onClick={() => setSearch("")} aria-label="مسح البحث">مسح</button>}</label>
        <Link className={styles.secondary} href="/teacher/students"><UserPlus2 size={16} /> ربط طالب من صفحة الطلاب</Link>
      </div>
      {families.length > 0 && <p className={styles.resultCount}>عرض {filteredFamilies.length} من {families.length} عائلة · افتح اسم الطالب لعرض ملفه</p>}
      {/* Empty State */}
      {families.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl border border-white/8 bg-white/2 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Users size={28} className="text-teal-400" />
          </div>
          <p className="font-bold text-[var(--text-primary)]">لا توجد عائلات مرتبطة بعد</p>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">
            ابدأ بإضافة عائلة، ثم اربط بها الطلاب من صفحة الطلاب.
          </p>
        </div>
      ) : filteredFamilies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[var(--text-muted)]">
          <Search size={28} />
          <p>لا توجد عائلات تطابق البحث</p><button className={styles.secondary} onClick={() => setSearch("")}>عرض كل العائلات</button>
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
