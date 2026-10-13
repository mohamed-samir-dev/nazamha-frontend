"use client";

import { useState } from "react";
import { Grade, Group, Question } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Printer, RefreshCw, ChevronDown, ChevronUp, Settings2, Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { ML } from "./types";
import { SectionType } from "../../_hooks/useFormsPreview";

const sel: React.CSSProperties = {
  width: "100%", padding: "0.65rem 0.75rem", borderRadius: 10,
  background: "rgba(8,12,20,0.8)", border: "1px solid var(--border-color)",
  color: "var(--text-primary)", fontSize: "0.88rem", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.2s",
};

const PRESET_INSTRUCTIONS = [
  "يمنع استخدام الهاتف المحمول أثناء الامتحان.",
  "يمنع تبادل الأوراق بين الطلاب.",
  "اقرأ جميع الأسئلة جيدًا قبل الإجابة.",
  "اكتب بياناتك كاملة قبل البدء.",
  "في حالة وجود أي استفسار، ارفع يدك ولا تتحدث مع زملائك.",
];

const MAX_CUSTOM = 5;

function InstructionsEditor({ instructions, setInstructions }: { instructions: string[]; setInstructions: (v: string[]) => void }) {
  const [newText, setNewText] = useState("");

  const toggle = (text: string) => {
    setInstructions(instructions.includes(text) ? instructions.filter(i => i !== text) : [...instructions, text]);
  };

  const addCustom = () => {
    const t = newText.trim();
    if (!t || instructions.includes(t)) return;
    const customCount = instructions.filter(i => !PRESET_INSTRUCTIONS.includes(i)).length;
    if (customCount >= MAX_CUSTOM) return;
    setInstructions([...instructions, t]);
    setNewText("");
  };

  const removeCustom = (text: string) => setInstructions(instructions.filter(i => i !== text));
  const customInstructions = instructions.filter(i => !PRESET_INSTRUCTIONS.includes(i));
  const canAddMore = customInstructions.length < MAX_CUSTOM;

  return (
    <div style={{ marginTop: "0.65rem" }}>
      <label className="form-label">
        تعليمات الامتحان
        <span style={{ color: "var(--text-muted)", fontWeight: 400, marginRight: 4 }}>({instructions.length} محددة)</span>
      </label>
      <div style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {PRESET_INSTRUCTIONS.map(text => (
          <label key={text} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer", fontSize: "0.83rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
            <input type="checkbox" checked={instructions.includes(text)} onChange={() => toggle(text)}
              style={{ accentColor: "var(--color-teal)", width: 14, height: 14, marginTop: 2, flexShrink: 0 }} />
            {text}
          </label>
        ))}
        {customInstructions.map(text => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.83rem", color: "var(--color-teal)" }}>
            <input type="checkbox" checked onChange={() => removeCustom(text)}
              style={{ accentColor: "var(--color-teal)", width: 14, height: 14, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{text}</span>
            <button type="button" onClick={() => removeCustom(text)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      {canAddMore && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <Input value={newText} onChange={e => setNewText(e.target.value)} placeholder="أضف تعليمة خاصة..."
            onKeyDown={e => e.key === "Enter" && addCustom()} style={{ flex: 1 }} />
          <button type="button" onClick={addCustom} disabled={!newText.trim()}
            style={{ padding: "0 0.7rem", borderRadius: 10, border: "1px solid rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.08)", color: "var(--color-teal)", cursor: newText.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontFamily: "inherit", opacity: newText.trim() ? 1 : 0.5 }}>
            <Plus size={13} /> إضافة
          </button>
        </div>
      )}
    </div>
  );
}

function SectionOrderEditor({ sectionOrder, setSectionOrder, labels }: {
  sectionOrder: SectionType[];
  setSectionOrder: (v: SectionType[]) => void;
  labels: Record<SectionType, string>;
}) {
  if (sectionOrder.length < 2) return null;

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sectionOrder];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSectionOrder(next);
  };

  return (
    <div style={{ marginTop: "0.65rem" }}>
      <label className="form-label">
        ترتيب أقسام الامتحان
        <span style={{ color: "var(--text-muted)", fontWeight: 400, marginRight: 4, fontSize: "0.72rem" }}>الأول في القائمة يظهر أولاً</span>
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {sectionOrder.map((type, idx) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.65rem", borderRadius: 8, background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)" }}>
            <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>
              <span style={{ color: "var(--text-muted)", marginLeft: "0.4rem", fontSize: "0.75rem" }}>{idx + 1}.</span>
              {labels[type]}
            </span>
            <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
              style={{ background: "none", border: "none", cursor: idx === 0 ? "not-allowed" : "pointer", color: idx === 0 ? "var(--text-muted)" : "var(--color-teal)", opacity: idx === 0 ? 0.3 : 1, padding: 3, display: "flex", borderRadius: 5 }}>
              <ArrowUp size={14} />
            </button>
            <button type="button" onClick={() => move(idx, 1)} disabled={idx === sectionOrder.length - 1}
              style={{ background: "none", border: "none", cursor: idx === sectionOrder.length - 1 ? "not-allowed" : "pointer", color: idx === sectionOrder.length - 1 ? "var(--text-muted)" : "var(--color-teal)", opacity: idx === sectionOrder.length - 1 ? 0.3 : 1, padding: 3, display: "flex", borderRadius: 5 }}>
              <ArrowDown size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PreviewSettingsProps {
  teacher: string; setTeacher: (v: string) => void;
  subj: string; setSubj: (v: string) => void;
  examTitle: string; setExamTitle: (v: string) => void;
  date: string; setDate: (v: string) => void;
  gId: string; setGId: (v: string) => void;
  grpId: string; setGrpId: (v: string) => void;
  instructions: string[]; setInstructions: (v: string[]) => void;
  numForms: number; setNumForms: (v: number) => void;
  totalScore: number;
  questions: Question[];
  grades: Grade[];
  filteredGroups: Group[];
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  onGenerate: () => void;
  forms: { id: number }[];
  printing: number | null;
  onPrint: (elIdx: number, label: string) => void;
  sectionOrder: SectionType[];
  setSectionOrder: (v: SectionType[]) => void;
  sectionLabels: Record<SectionType, string>;
}

export function PreviewSettings({
  teacher, setTeacher, subj, setSubj, examTitle, setExamTitle,
  date, setDate, gId, setGId, grpId, setGrpId, instructions, setInstructions,
  numForms, setNumForms, totalScore,
  questions, grades, filteredGroups,
  settingsOpen, setSettingsOpen, onGenerate,
  forms, printing, onPrint,
  sectionOrder, setSectionOrder, sectionLabels,
}: PreviewSettingsProps) {
  return (
    <div style={{ borderBottom: "1px solid var(--border-color)" }}>
      <style>{settingsStyles}</style>

      <button onClick={() => setSettingsOpen(!settingsOpen)}
        style={{ width: "100%", padding: "0.85rem 1rem", background: "transparent", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-primary)", fontFamily: "inherit", transition: "background 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
        <span style={{ fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Settings2 size={13} color="var(--color-teal)" />
          </div>
          إعدادات الامتحان والتوليد
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {!settingsOpen && forms.length > 0 && (
            <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: 20, background: "rgba(20,184,166,0.1)", color: "var(--color-teal)", border: "1px solid rgba(20,184,166,0.2)" }}>
              {forms.length} نماذج جاهزة
            </span>
          )}
          {settingsOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </button>

      {settingsOpen && (
        <div style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>

          {/* Paper data */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "0.85rem" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: 3, height: 11, borderRadius: 2, background: "var(--color-teal)", display: "inline-block" }} />
              بيانات تظهر في الورقة
            </p>
            <div className="settings-grid">
              <div>
                <label className="form-label">اسم المدرس</label>
                <Input value={teacher} onChange={e => setTeacher(e.target.value)} placeholder="اسم المدرس" />
              </div>
              <div>
                <label className="form-label">المادة</label>
                <Input value={subj} onChange={e => setSubj(e.target.value)} placeholder="مثال: الفيزياء" />
              </div>
              <div>
                <label className="form-label">اسم الامتحان</label>
                <Input value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder="امتحان الفصل الأول" />
              </div>
              <div>
                <label className="form-label">التاريخ</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">الصف</label>
                <select value={gId} onChange={e => { setGId(e.target.value); setGrpId(""); }} style={sel}
                  onFocus={e => (e.target.style.borderColor = "rgba(20,184,166,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border-color)")}>
                  <option value="">— بدون صف —</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">المجموعة</label>
                <select value={grpId} onChange={e => setGrpId(e.target.value)} style={sel}
                  onFocus={e => (e.target.style.borderColor = "rgba(20,184,166,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border-color)")}>
                  <option value="">— بدون مجموعة —</option>
                  {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <InstructionsEditor instructions={instructions} setInstructions={setInstructions} />
            <SectionOrderEditor sectionOrder={sectionOrder} setSectionOrder={setSectionOrder} labels={sectionLabels} />
          </div>

          {/* Generation settings */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "0.85rem" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: 3, height: 11, borderRadius: 2, background: "#818cf8", display: "inline-block" }} />
              إعدادات التوليد
            </p>
            <div style={{ display: "flex", gap: "0.65rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div>
                <label className="form-label">عدد النماذج</label>
                <Input type="number" min={1} value={numForms} onChange={e => setNumForms(Number(e.target.value))} style={{ width: 75 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label className="form-label">الدرجة الكلية للامتحان</label>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.5rem 0.85rem", borderRadius: 10,
                  background: "rgba(20,184,166,0.07)",
                  border: "1.5px solid rgba(20,184,166,0.3)",
                }}>
                  <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-teal)", lineHeight: 1, letterSpacing: "-0.5px" }}>{totalScore}</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-teal)" }}>درجة</span>
                    <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>من إعدادات الامتحان</span>
                  </div>
                </div>
              </div>
              <Button onClick={onGenerate} leftIcon={<RefreshCw size={14} />} disabled={!questions.length}>
                توليد النماذج
              </Button>
            </div>

            {forms.length > 0 && (
              <div style={{ marginTop: "0.7rem", paddingTop: "0.7rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>طباعة:</span>
                {forms.map((_, fi) => (
                  <button key={fi} onClick={() => onPrint(fi, `نموذج ${fi + 1}`)} disabled={printing !== null}
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.38rem 0.75rem", borderRadius: 8, background: printing === fi ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${printing === fi ? "rgba(20,184,166,0.3)" : "var(--border-color)"}`, color: printing === fi ? "var(--color-teal)" : "var(--text-secondary)", cursor: printing !== null ? "not-allowed" : "pointer", fontSize: "0.76rem", fontFamily: "inherit", fontWeight: 600, transition: "all 0.2s", opacity: printing !== null && printing !== fi ? 0.5 : 1 }}>
                    <Printer size={12} />
                    {printing === fi ? "جاري..." : `نموذج ${fi + 1}`}
                  </button>
                ))}
                <button onClick={() => onPrint(forms.length, "نموذج المدرس")} disabled={printing !== null}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.38rem 0.75rem", borderRadius: 8, background: printing === forms.length ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.06)", border: `1px solid ${printing === forms.length ? "rgba(245,158,11,0.4)" : "rgba(245,158,11,0.2)"}`, color: "var(--color-amber)", cursor: printing !== null ? "not-allowed" : "pointer", fontSize: "0.76rem", fontFamily: "inherit", fontWeight: 600, transition: "all 0.2s", opacity: printing !== null && printing !== forms.length ? 0.5 : 1 }}>
                  <Printer size={12} />
                  {printing === forms.length ? "جاري..." : "نموذج المدرس"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const settingsStyles = `
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.65rem;
  }
  @media (max-width: 600px) {
    .settings-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 380px) {
    .settings-grid { grid-template-columns: 1fr !important; }
  }
`;
