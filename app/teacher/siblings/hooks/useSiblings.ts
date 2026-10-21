"use client";

import { useState, useEffect, useMemo } from "react";
import { StudentsService } from "@/lib/services/studentsService";
import { canSaveFamilyDiscount, validateFamilyDiscount } from "@/lib/utils/familyDiscount";
import { GroupsService } from "@/lib/services/groupsService";
import { AuthService } from "@/lib/services/authService";
import { Group, Student } from "@/lib/types";
import { SiblingFamily, DiscountModalState } from "../types";

export function useSiblings() {
  const [families, setFamilies] = useState<SiblingFamily[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const [discountModal, setDiscountModal] = useState<DiscountModalState | null>(null);
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [bookDiscountPercent, setBookDiscountPercent] = useState("");
  const [bookDiscountReason, setBookDiscountReason] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);

  const load = async (signal?: AbortSignal) => {
    try {
      const user = await AuthService.getUser();
      if (!user || signal?.aborted) return;
      const [fams, grps] = await Promise.all([
        StudentsService.getSiblings(),
        GroupsService.getGroupsByTeacherId(),
      ]);
      if (signal?.aborted) return;
      setFamilies((fams as any[]).map((f) => ({ ...f, familyName: f.familyName, members: (f.members as any[]).filter((m) => m.id) })));
      setGroups(grps);
    } catch (error) {
      if (!signal?.aborted) setToast({ message: error instanceof Error ? error.message : "تعذر تحميل العائلات. أعد المحاولة.", type: "error" });
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);

  const getGroup = (groupId: string | null) =>
    groupId ? groups.find((g) => g.id === groupId) : null;

  const getFamilyDisplayName = (family: SiblingFamily) => {
    if (family.familyName) return family.familyName;
    const anyName = family.members.find((m) => m.sibling_family_name)?.sibling_family_name;
    if (anyName) return anyName;
    const parts = family.members[0]?.name?.trim().split(/\s+/) || [];
    return `عائلة ${parts[1] || parts[0] || ""}`;
  };

  const getFamilyDiscount = (family: SiblingFamily) => {
    const member = family.members.find((m) => m.family_discount_percent != null);
    const bookMember = family.members.find((m) => m.family_book_discount_percent != null);
    return {
      percent: member?.family_discount_percent ?? null,
      reason: member?.family_discount_reason ?? "",
      bookPercent: bookMember?.family_book_discount_percent ?? null,
      bookReason: bookMember?.family_book_discount_reason ?? "",
    };
  };

  const handleStartRename = (family: SiblingFamily) => {
    setRenamingId(family.familyId);
    setRenameValue(getFamilyDisplayName(family));
  };

  const handleRename = async (familyId: string) => {
    if (!renameValue.trim()) return;
    setRenameLoading(true);
    try {
      await StudentsService.renameFamily(familyId, renameValue.trim());
      setFamilies((prev) =>
        prev.map((f) =>
          f.familyId === familyId
            ? { ...f, familyName: renameValue.trim(), members: f.members.map((m) => ({ ...m, sibling_family_name: renameValue.trim() })) }
            : f
        )
      );
      setToast({ message: "✅ تم تحديث اسم العائلة", type: "success" });
      setRenamingId(null);
    } catch {
      setToast({ message: "فشل تحديث الاسم", type: "error" });
    } finally {
      setRenameLoading(false);
    }
  };

  const handleUnlink = async (student: { id: string; name: string }) => {
    setUnlinkingId(student.id);
    try {
      await StudentsService.unlinkSibling(student.id);
      setToast({ message: `تم فصل "${student.name}" عن العائلة`, type: "success" });
      await load();
    } catch {
      setToast({ message: "فشل فصل الطالب", type: "error" });
    } finally {
      setUnlinkingId(null);
    }
  };

  const openDiscountModal = (family: SiblingFamily) => {
    const { percent, reason, bookPercent, bookReason } = getFamilyDiscount(family);
    setDiscountModal({
      familyId: family.familyId,
      familyName: getFamilyDisplayName(family),
      currentPercent: percent,
      currentReason: reason,
      currentBookPercent: bookPercent,
      currentBookReason: bookReason,
    });
    setDiscountPercent(percent != null ? String(percent) : "");
    setDiscountReason(reason);
    setBookDiscountPercent(bookPercent != null ? String(bookPercent) : "");
    setBookDiscountReason(bookReason);
  };

  const handleSaveDiscount = async () => {
    if (!discountModal) return;

    const pct = discountPercent === "" ? null : Number(discountPercent);
    const bpct = bookDiscountPercent === "" ? null : Number(bookDiscountPercent);

    if (!canSaveFamilyDiscount(discountPercent, bookDiscountPercent)) {
      setToast({ message: validateFamilyDiscount(discountPercent) || validateFamilyDiscount(bookDiscountPercent) || "أدخل نسبة خصم واحدة أكبر من صفر على الأقل", type: "error" });
      return;
    }

    setDiscountLoading(true);
    try {
      await StudentsService.setFamilyDiscount(discountModal.familyId, pct, discountReason, bpct, bookDiscountReason);
      setFamilies((prev) =>
        prev.map((f) =>
          f.familyId === discountModal.familyId
            ? {
                ...f,
                members: f.members.map((m) => ({
                  ...m,
                  family_discount_percent: pct,
                  family_discount_reason: discountReason.trim() || null,
                  family_book_discount_percent: bpct,
                  family_book_discount_reason: bookDiscountReason.trim() || null,
                })),
              }
            : f
        )
      );
      const msgs = [];
      if (pct != null && pct > 0) msgs.push(`${pct}% اشتراك`);
      if (bpct != null && bpct > 0) msgs.push(`${bpct}% كتب`);
      setToast({ message: `✅ تم تطبيق خصم ${msgs.join(" و ")}`, type: "success" });
      setDiscountModal(null);
    } catch {
      setToast({ message: "فشل حفظ الخصم", type: "error" });
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!discountModal) return;

    // لو مفيش خصم أصلاً، بس اقفل الـ modal
    const { percent, bookPercent } = getFamilyDiscount(
      families.find((f) => f.familyId === discountModal.familyId)!
    );
    const hasExisting = (percent != null && percent > 0) || (bookPercent != null && bookPercent > 0);
    if (!hasExisting) {
      setDiscountModal(null);
      return;
    }

    setDiscountLoading(true);
    try {
      await StudentsService.setFamilyDiscount(discountModal.familyId, null, "", null, "");
      setFamilies((prev) =>
        prev.map((f) =>
          f.familyId === discountModal.familyId
            ? {
                ...f,
                members: f.members.map((m) => ({
                  ...m,
                  family_discount_percent: null,
                  family_discount_reason: null,
                  family_book_discount_percent: null,
                  family_book_discount_reason: null,
                })),
              }
            : f
        )
      );
      setToast({ message: "✅ تم إزالة الخصم", type: "success" });
      setDiscountModal(null);
    } catch {
      setToast({ message: "فشل إزالة الخصم", type: "error" });
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleAddFamily = async (familyId: string, familyName: string) => {
    setToast({ message: `✅ تم إنشاء ${familyName} بنجاح`, type: "success" });
    await load();
  };

  const handleDeleteFamily = async (family: SiblingFamily) => {
    try {
      await StudentsService.deleteFamily(family.familyId);
      setFamilies((prev) => prev.filter((f) => f.familyId !== family.familyId));
      setToast({ message: `✅ تم حذف ${getFamilyDisplayName(family)}`, type: "success" });
    } catch {
      setToast({ message: "فشل حذف العائلة", type: "error" });
    }
  };

  const filteredFamilies = useMemo(() => {
    if (!search.trim()) return families;
    const q = search.trim().toLowerCase();
    return families.filter((f) =>
      getFamilyDisplayName(f).toLowerCase().includes(q) ||
      f.parentPhone?.includes(q) ||
      f.members.some((m) => m.name.toLowerCase().includes(q) || m.parent_phone?.includes(q))
    );
  }, [families, search]);

  return {
    families, groups, loading, toast, setToast,
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
  };
}
