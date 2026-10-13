import { useState } from "react";
import { User, Tag, BookOpen, Calendar } from "lucide-react";
import { FiEdit2, FiSave, FiX, FiCopy, FiCheck } from "react-icons/fi";
import { Student, Group, Grade } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { InfoRow } from "./InfoRow";
import { StudentsService } from "@/lib/services/studentsService";

const arabicMonthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const formatTimeTo12H = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${m || "00"} ${ampm}`;
};

interface Props {
  student: Student;
  groups: Group[];
  grades: Grade[];
  onSaved: (updated: Partial<Student>) => void;
}

export function StudentInfoCard({ student, groups, grades, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Student>>({});
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    const codeToCopy = student.center_student_code || student.code;
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const group = groups.find((g) => g.id === student.group_id);
  const grade = grades.find((g) => g.id === student.grade_id);

  const startEdit = () => {
    setForm({
      name: student.name,
      grade_id: student.grade_id,
      group_id: student.group_id,
      subscription_start_month: student.subscription_start_month,
      subscription_start_year: student.subscription_start_year,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await StudentsService.updateStudent(student.id, form);
      onSaved(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const startMonthLabel = student.subscription_start_month
    ? `${arabicMonthNames[student.subscription_start_month - 1]} ${student.subscription_start_year || ""}`
    : "—";

  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title">
        <User size={16} style={{ color: "var(--color-teal)" }} />
        <span>البيانات الأساسية</span>
        {!editing && (
          <button onClick={startEdit} style={{ marginRight: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--color-teal)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", padding: "2px 8px", borderRadius: "6px", fontFamily: "inherit" }}>
            <FiEdit2 size={13} /> تعديل
          </button>
        )}
      </h3>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input label="الاسم" value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <div className="form-group">
            <label className="form-label">السنة الدراسية</label>
            <select className="form-input" value={form.grade_id || ""} onChange={(e) => setForm((p) => ({ ...p, grade_id: e.target.value, group_id: null }))}>
              <option value="">-- اختر --</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">المجموعة</label>
            <select className="form-input" value={form.group_id || ""} onChange={(e) => setForm((p) => ({ ...p, group_id: e.target.value || null }))}>
              <option value="">بدون مجموعة</option>
              {groups.filter((g) => !form.grade_id || g.grade_id === form.grade_id).map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">شهر بداية الاشتراك</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select className="form-input" value={form.subscription_start_month || ""} onChange={(e) => setForm((p) => ({ ...p, subscription_start_month: Number(e.target.value) || null }))} style={{ flex: 2 }}>
                <option value="">—</option>
                {arabicMonthNames.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
              </select>
              <input type="number" className="form-input" value={form.subscription_start_year || ""} onChange={(e) => setForm((p) => ({ ...p, subscription_start_year: Number(e.target.value) || null }))} min={2020} max={2040} placeholder="السنة" style={{ flex: 1, direction: "ltr" }} />
            </div>
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
          <InfoRow icon={<User size={15} />} label="الاسم" value={student.name} />
          <InfoRow icon={<Tag size={15} />} label="الكود" value={
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: "monospace", color: "var(--color-teal)" }}>
                {student.center_student_code || student.code || "—"}
              </span>
              {(student.center_student_code || student.code) && (
                <button onClick={handleCopyCode} title="نسخ الكود" style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#10b981" : "var(--text-muted)", display: "flex", alignItems: "center", padding: "2px", borderRadius: "4px", transition: "color 0.2s" }}>
                  {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
                </button>
              )}
            </span>
          } />
          <InfoRow icon={<BookOpen size={15} />} label="السنة الدراسية" value={grade?.name || "—"} />
          <InfoRow icon={<BookOpen size={15} />} label="المجموعة" value={group ? `${group.name} (${group.day_of_week} - ${formatTimeTo12H(group.time)})` : "بدون مجموعة"} />
          <InfoRow icon={<Calendar size={15} />} label="بداية الاشتراك" value={startMonthLabel} />
        </div>
      )}
    </div>
  );
}
