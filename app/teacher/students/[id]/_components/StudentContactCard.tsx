import { useState, useEffect } from "react";
import { Phone, Mail, Briefcase, Users } from "lucide-react";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { Student } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { InfoRow } from "./InfoRow";
import { StudentsService } from "@/lib/services/studentsService";

interface Props {
  student: Student;
  onSaved: (updated: Partial<Student>) => void;
}

export function StudentContactCard({ student, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Student>>({});
  const [families, setFamilies] = useState<{ familyId: string; familyName: string }[]>([]);

  useEffect(() => {
    StudentsService.getSiblings().then((fams) =>
      setFamilies(fams.map((f) => ({
        familyId: f.familyId,
        familyName:
          f.members.find((m) => m.sibling_family_name)?.sibling_family_name ||
          `عائلة ${f.members[0]?.name?.trim().split(/\s+/)[1] || f.members[0]?.name || ""}`,
      })))
    ).catch(() => {});
  }, []);

  const startEdit = () => {
    setForm({
      parent_phone: student.parent_phone,
      parent_job: student.parent_job,
      student_email: student.student_email,
      sibling_family_id: student.sibling_family_id ?? "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const familyChanged = (form.sibling_family_id || null) !== (student.sibling_family_id || null);

      if (familyChanged && !form.sibling_family_id) {
        // فصل الطالب عن العائلة
        await StudentsService.unlinkSibling(student.id);
        const updated = await StudentsService.updateStudent(student.id, {
          parent_phone: form.parent_phone,
          parent_job: form.parent_job,
          student_email: form.student_email,
        });
        onSaved({ ...updated, sibling_family_id: null, sibling_family_name: null });
      } else {
        const selectedFamily = families.find((f) => f.familyId === form.sibling_family_id);
        const updated = await StudentsService.updateStudent(student.id, {
          parent_phone: form.parent_phone,
          parent_job: form.parent_job,
          student_email: form.student_email,
          ...(familyChanged && form.sibling_family_id ? {
            sibling_family_id: form.sibling_family_id,
            sibling_family_name: selectedFamily?.familyName ?? null,
          } : {}),
        });
        onSaved(updated);
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const currentFamilyName = student.sibling_family_id
    ? families.find((f) => f.familyId === student.sibling_family_id)?.familyName ||
      student.sibling_family_name ||
      "عائلة مرتبطة"
    : null;

  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title">
        <Phone size={16} style={{ color: "var(--color-teal)" }} />
        <span>بيانات التواصل</span>
        {!editing && (
          <button onClick={startEdit} style={{ marginRight: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--color-teal)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", padding: "2px 8px", borderRadius: "6px", fontFamily: "inherit" }}>
            <FiEdit2 size={13} /> تعديل
          </button>
        )}
      </h3>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input label="هاتف ولي الأمر" value={form.parent_phone || ""} onChange={(e) => setForm((p) => ({ ...p, parent_phone: e.target.value }))} placeholder="01012345678" />
          <Input label="وظيفة ولي الأمر" value={form.parent_job || ""} onChange={(e) => setForm((p) => ({ ...p, parent_job: e.target.value }))} placeholder="مهندس، دكتور..." />
          <Input label="إيميل الطالب" type="email" value={form.student_email || ""} onChange={(e) => setForm((p) => ({ ...p, student_email: e.target.value }))} placeholder="student@example.com" />
          <div className="form-group">
            <label className="form-label">العائلة</label>
            <select
              className="form-input"
              value={form.sibling_family_id || ""}
              onChange={(e) => setForm((p) => ({ ...p, sibling_family_id: e.target.value || "" }))}
            >
              <option value="">بدون عائلة</option>
              {families.map((f) => (
                <option key={f.familyId} value={f.familyId}>{f.familyName}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
            <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <FiX size={14} /> إلغاء
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "0.6rem", borderRadius: "8px", background: "var(--color-teal)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <FiSave size={14} /> {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <InfoRow icon={<Phone size={15} />} label="هاتف ولي الأمر" value={
            student.parent_phone
              ? <a href={`https://wa.me/20${student.parent_phone.replace(/^0/, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  {student.parent_phone} <FaWhatsapp size={14} />
                </a>
              : "—"
          } />
          <InfoRow icon={<Briefcase size={15} />} label="وظيفة ولي الأمر" value={student.parent_job || "—"} />
          <InfoRow icon={<Mail size={15} />} label="إيميل الطالب" value={student.student_email || "—"} />
          <InfoRow icon={<Users size={15} />} label="العائلة" value={
            currentFamilyName
              ? <span style={{ color: "var(--color-teal)", fontWeight: 600 }}>{currentFamilyName}</span>
              : "—"
          } />
        </div>
      )}
    </div>
  );
}
