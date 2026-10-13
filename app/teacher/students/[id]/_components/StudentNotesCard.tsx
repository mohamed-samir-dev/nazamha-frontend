import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";
import { Student } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";

interface Props {
  student: Student;
  onUpdate: (notes: string) => void;
}

export function StudentNotesCard({ student, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(student.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await StudentsService.updateStudent(student.id, { notes });
      onUpdate(notes);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title" style={{ marginBottom: "1rem" }}>
        <MessageSquare size={16} style={{ color: "var(--color-teal)" }} />
        <span>الملاحظات</span>
        {!editing ? (
          <button onClick={() => setEditing(true)} style={{ marginRight: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--color-teal)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", padding: "2px 8px", borderRadius: "6px", fontFamily: "inherit" }}>
            <FiEdit2 size={13} /> تعديل
          </button>
        ) : (
          <div style={{ marginRight: "auto", display: "flex", gap: "0.4rem" }}>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", padding: "2px 8px", borderRadius: "6px", fontFamily: "inherit" }}>
              <FiX size={13} /> إلغاء
            </button>
            <button onClick={handleSave} disabled={saving} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-teal)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", padding: "2px 8px", borderRadius: "6px", fontFamily: "inherit" }}>
              <FiSave size={13} /> {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        )}
      </h3>

      {editing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أضف ملاحظة عن الطالب... مثلاً: يحتاج متابعة، ممتاز في البرمجة..."
          rows={5}
          style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(20,184,166,0.3)", color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.9rem", resize: "vertical", outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
          autoFocus
        />
      ) : (
        <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", minHeight: "80px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.9rem", color: notes ? "var(--text-primary)" : "var(--text-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {notes || "لا توجد ملاحظات بعد. اضغط تعديل لإضافة ملاحظة."}
        </div>
      )}
    </div>
  );
}
