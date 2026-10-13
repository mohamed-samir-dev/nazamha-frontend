"use client";

import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { MdOutlineWarningAmber } from "react-icons/md";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Group } from "@/lib/types";

interface DeleteGroupDialogProps {
  group: Group | null;
  studentCount: number;
  onConfirm: (groupId: string, deleteStudents: boolean) => Promise<void>;
  onClose: () => void;
}

export function DeleteGroupDialog({ group, studentCount, onConfirm, onClose }: DeleteGroupDialogProps) {
  const [deleteStudents, setDeleteStudents] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!group) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(group.id, deleteStudents);
    setLoading(false);
    setDeleteStudents(false);
  };

  const handleClose = () => {
    setDeleteStudents(false);
    onClose();
  };

  return (
    <Modal isOpen={!!group} onClose={handleClose} title="حذف المجموعة" maxWidth="460px">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        <div style={{
          display: "flex", alignItems: "flex-start", gap: "0.75rem",
          padding: "0.85rem 1rem", borderRadius: "10px",
          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
        }}>
          <MdOutlineWarningAmber size={20} style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            أنت على وشك حذف مجموعة <strong style={{ color: "var(--text-primary)" }}>&ldquo;{group.name}&rdquo;</strong>.
            {studentCount > 0 && (
              <> هذه المجموعة تحتوي على <strong style={{ color: "var(--color-danger)" }}>{studentCount} طالب</strong> مرتبطين بها.</>
            )}
          </div>
        </div>

        {studentCount > 0 && !deleteStudents && (
          <div style={{
            padding: "0.75rem 1rem", borderRadius: "8px",
            background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)",
            fontSize: "0.82rem", color: "#f59e0b", lineHeight: 1.7,
          }}>
            لن يتم حذف الطلاب، ولكنهم سيصبحون بدون مجموعة بعد حذف هذه المجموعة، وسيتوجب عليك تعيين مجموعة جديدة لهم لاحقاً من صفحة <strong>إدارة الطلاب</strong> حتى يمكن إدارتهم بشكل صحيح.
          </div>
        )}

        {studentCount > 0 && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            <input
              type="checkbox"
              checked={deleteStudents}
              onChange={(e) => setDeleteStudents(e.target.checked)}
              style={{ width: "15px", height: "15px", accentColor: "var(--color-danger)", cursor: "pointer", flexShrink: 0, marginTop: "2px" }}
            />
            <span>أوافق على حذف جميع طلاب هذه المجموعة مع حذف المجموعة.</span>
          </label>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
          <Button type="button" variant="secondary" onClick={handleClose}>إلغاء</Button>
          <Button type="button" variant="danger" isLoading={loading} leftIcon={<FiTrash2 size={14} />} onClick={handleConfirm}>
            حذف المجموعة
          </Button>
        </div>
      </div>
    </Modal>
  );
}
