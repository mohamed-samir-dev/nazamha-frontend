"use client";

import { useState } from "react";
import { FileText, Plus, BookOpen, LayoutTemplate, Pencil, Copy, Trash2, Sparkles, ChevronDown } from "lucide-react";
import { QuestionBank } from "@/lib/types";
import { useExamsGenerator, ExamForm } from "./_hooks/useExamsGenerator";
import { ExamModal } from "./_components/ExamModal";
import { QuestionsEditor } from "./_components/QuestionsEditor";
import { FormsPreview } from "./_components/FormsPreview";

type Tab = "questions" | "preview";

export default function GeneratorPage() {
  const {
    teacherName, exams, selectedExamId, selectedExam, questions,
    grades, groups, loading,
    selectExam, filteredGroups,
    createExam, updateExam, deleteExam, duplicateExam, updateExamTotalScore,
    addQuestion, updateQuestion, deleteQuestion, reorderQuestions,
  } = useExamsGenerator();

  const [showCreate, setShowCreate] = useState(false);
  const [editingExam, setEditingExam] = useState<QuestionBank | null>(null);
  const [tab, setTab] = useState<Tab>("questions");
  const [examsExpanded, setExamsExpanded] = useState(true);

  const editInitialData: ExamForm | undefined = editingExam ? {
    title: editingExam.title,
    subject: editingExam.subject || "",
    exam_title: editingExam.exam_title || "",
    exam_date: editingExam.exam_date || "",
    grade_id: editingExam.grade_id || "",
    group_id: editingExam.group_id || "",
    total_score: editingExam.total_score || 100,
  } : undefined;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--text-muted)", gap: "0.75rem" }}>
      <div style={{ width: 18, height: 18, border: "2px solid var(--color-teal)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      جاري التحميل...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="gen-page">
      <style>{pageStyles}</style>

      {/* ── Header ── */}
      <div className="gen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="gen-icon">
            <Sparkles size={20} color="var(--color-teal)" />
          </div>
          <div>
            <h1 className="gen-title">نماذج الامتحانات</h1>
            <p className="gen-subtitle">أنشئ وادر نماذج الامتحانات بسهولة</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-new-exam">
          <Plus size={15} />
          <span className="btn-label">امتحان جديد</span>
        </button>
      </div>

      {/* ── Exams List ── */}
      <div className="section-card" style={{ marginBottom: "1.25rem" }}>
        <div
          className="section-header"
          onClick={() => setExamsExpanded(v => !v)}
          style={{ borderBottom: examsExpanded ? "1px solid var(--border-color)" : "none" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <FileText size={14} color="var(--color-teal)" />
            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)" }}>قائمة الامتحانات</span>
            <span className="count-badge">{exams.length}</span>
          </div>
          <ChevronDown size={15} color="var(--text-muted)" style={{ transform: examsExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }} />
        </div>

        {examsExpanded && (
          <div style={{ padding: "0.85rem" }}>
            {exams.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.83rem" }}>
                <FileText size={28} color="var(--color-teal)" style={{ opacity: 0.3, marginBottom: 10 }} />
                <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>لا يوجد امتحانات بعد</div>
                <div>ابدأ بإنشاء أول امتحان</div>
              </div>
            ) : (
              <div className="exams-grid">
                {exams.map(exam => {
                  const isSelected = selectedExamId === exam.id;
                  const grade = exam.grade_id ? grades.find(g => g.id === exam.grade_id) : null;
                  const group = exam.group_id ? groups.find(g => g.id === exam.group_id) : null;
                  const examQCount = selectedExamId === exam.id ? questions.length : null;
                  return (
                    <div
                      key={exam.id}
                      onClick={() => { selectExam(exam.id); setTab("questions"); }}
                      className={`exam-card${isSelected ? " exam-card--selected" : ""}`}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="exam-card-title" style={{ color: isSelected ? "var(--color-teal)" : "var(--text-primary)", fontWeight: isSelected ? 700 : 600 }}>
                            {exam.title}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", marginTop: "0.35rem" }}>
                            {exam.subject && <Badge color="#a5b4fc" bg="rgba(99,102,241,0.1)" border="rgba(99,102,241,0.2)">{exam.subject}</Badge>}
                            {grade && <Badge color="var(--color-teal)" bg="rgba(20,184,166,0.08)" border="rgba(20,184,166,0.18)">{grade.name}</Badge>}
                            {group && <Badge color="var(--color-amber)" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.18)">{group.name}</Badge>}
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.45rem", flexWrap: "wrap" }}>
                            {exam.total_score && (
                              <span style={{ fontSize: "0.68rem", color: "#34d399", display: "flex", alignItems: "center", gap: 3 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
                                {exam.total_score} درجة
                              </span>
                            )}
                            {exam.exam_date && (
                              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                📅 {new Date(exam.exam_date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                              </span>
                            )}
                            {isSelected && examQCount !== null && (
                              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{examQCount} سؤال</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <IconBtn title="تعديل" onClick={() => setEditingExam(exam)} hoverColor="var(--text-primary)"><Pencil size={11} /></IconBtn>
                          <IconBtn title="نسخ" onClick={() => duplicateExam(exam.id)} hoverColor="var(--color-teal)"><Copy size={11} /></IconBtn>
                          <IconBtn title="حذف" onClick={() => deleteExam(exam.id)} hoverColor="var(--color-danger)"><Trash2 size={11} /></IconBtn>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Editor ── */}
      {!selectedExamId ? (
        <div className="section-card empty-state">
          <div style={{ textAlign: "center", maxWidth: 360, padding: "2rem 1.5rem" }}>
            <div className="empty-icon">
              <FileText size={22} color="var(--color-teal)" style={{ opacity: 0.7 }} />
            </div>
            <p style={{ margin: "0 0 0.35rem", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>اختر امتحاناً للبدء</p>
            <p style={{ margin: "0 0 1.5rem", color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.6 }}>
              اختر امتحاناً من القائمة أعلاه أو أنشئ امتحاناً جديداً
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-empty-create"
            >
              <Plus size={14} /> إنشاء امتحان جديد
            </button>
          </div>
        </div>
      ) : (
        <div className="section-card">
          {/* Editor header */}
          <div className="editor-header">
            <div className="editor-info">
              <div className="editor-icon-wrap">
                <FileText size={13} color="var(--color-teal)" />
              </div>
              <span className="editor-exam-title">{selectedExam?.title}</span>
              {selectedExam?.subject && (
                <span className="badge-subject">{selectedExam.subject}</span>
              )}
              <span className="badge-count">{questions.length} سؤال</span>
            </div>

            <div className="tabs-wrap">
              {([
                { key: "questions" as Tab, label: "الأسئلة", shortLabel: "أسئلة", icon: <BookOpen size={12} /> },
                { key: "preview" as Tab, label: "توليد النماذج", shortLabel: "نماذج", icon: <LayoutTemplate size={12} /> },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`tab-btn${tab === t.key ? " tab-btn--active" : ""}`}
                >
                  {t.icon}
                  <span className="tab-label-full">{t.label}</span>
                  <span className="tab-label-short">{t.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor content */}
          <div className="editor-body">
            {tab === "questions" && (
              <QuestionsEditor
                questions={questions}
                totalScore={selectedExam?.total_score || null}
                onAddQuestion={addQuestion}
                onUpdateQuestion={updateQuestion}
                onDeleteQuestion={deleteQuestion}
                onReorder={reorderQuestions}
                onUpdateTotalScore={updateExamTotalScore}
              />
            )}
            {tab === "preview" && (
              <FormsPreview
                questions={questions}
                bankTitle={selectedExam?.exam_title || selectedExam?.title || ""}
                subject={selectedExam?.subject || ""}
                examDate={selectedExam?.exam_date || ""}
                teacherName={teacherName}
                gradeId={selectedExam?.grade_id || ""}
                groupId={selectedExam?.group_id || ""}
                examTotalScore={selectedExam?.total_score || null}
                grades={grades}
                groups={groups}
              />
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <ExamModal mode="create" grades={grades} groups={groups} filteredGroups={filteredGroups} onSubmit={createExam} onClose={() => setShowCreate(false)} />
      )}
      {editingExam && (
        <ExamModal mode="edit" initialData={editInitialData} grades={grades} groups={groups} filteredGroups={filteredGroups} onSubmit={form => updateExam(editingExam.id, form)} onClose={() => setEditingExam(null)} />
      )}
    </div>
  );
}

const pageStyles = `
  .gen-page {
    padding: clamp(0.5rem, 2vw, 1.25rem);
  }
  @media (max-width: 600px) {
    .gen-page { padding: 0.5rem 0; }
    .section-card { border-radius: 0; border-left: none; border-right: none; }
    .gen-header { padding: 0 0.75rem; }
  }
  .gen-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.1rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .gen-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: linear-gradient(135deg, rgba(20,184,166,0.2), rgba(20,184,166,0.05));
    border: 1px solid rgba(20,184,166,0.3);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 18px rgba(20,184,166,0.1);
    flex-shrink: 0;
  }
  .gen-title {
    margin: 0; font-size: clamp(1rem, 4vw, 1.2rem);
    font-weight: 800; color: var(--text-primary); line-height: 1.2;
  }
  .gen-subtitle {
    margin: 0; font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;
  }
  .btn-new-exam {
    display: flex; align-items: center; gap: 0.45rem;
    padding: 0.55rem 1.1rem; border-radius: 10px;
    background: linear-gradient(135deg, rgba(20,184,166,0.2), rgba(20,184,166,0.08));
    border: 1px solid rgba(20,184,166,0.35);
    color: var(--color-teal); cursor: pointer;
    font-weight: 700; font-size: 0.85rem; font-family: inherit;
    transition: all 0.2s; white-space: nowrap;
  }
  .btn-new-exam:hover {
    background: linear-gradient(135deg, rgba(20,184,166,0.28), rgba(20,184,166,0.14));
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(20,184,166,0.15);
  }
  .section-card {
    border: 1px solid var(--border-color);
    border-radius: 14px;
    overflow: hidden;
  }
  .section-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.85rem 1rem; cursor: pointer;
    transition: background 0.15s;
  }
  .section-header:hover { background: rgba(255,255,255,0.02); }
  .count-badge {
    font-size: 0.67rem; padding: 2px 7px; border-radius: 20px;
    background: rgba(20,184,166,0.12); color: var(--color-teal);
    border: 1px solid rgba(20,184,166,0.2); font-weight: 700;
  }
  .exams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 0.55rem;
  }
  .exam-card {
    border-radius: 10px; cursor: pointer;
    padding: 0.8rem 0.9rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border-color);
    border-top: 2px solid transparent;
    transition: all 0.18s;
  }
  .exam-card:hover {
    background: rgba(255,255,255,0.05);
    border-color: rgba(20,184,166,0.25);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(0,0,0,0.2);
  }
  .exam-card--selected {
    background: linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.05)) !important;
    border-color: rgba(20,184,166,0.45) !important;
    border-top-color: var(--color-teal) !important;
  }
  .exam-card-title {
    font-size: 0.83rem; line-height: 1.4;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .empty-state {
    display: flex; align-items: center; justify-content: center;
    min-height: 280px;
  }
  .empty-icon {
    width: 54px; height: 54px; border-radius: 50%;
    background: rgba(20,184,166,0.08); border: 1px solid rgba(20,184,166,0.18);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.1rem;
  }
  .btn-empty-create {
    display: inline-flex; align-items: center; gap: 0.45rem;
    padding: 0.6rem 1.35rem; border-radius: 10px;
    background: rgba(20,184,166,0.12); border: 1px solid rgba(20,184,166,0.3);
    color: var(--color-teal); cursor: pointer;
    font-weight: 700; font-size: 0.85rem; font-family: inherit;
    transition: background 0.2s;
  }
  .btn-empty-create:hover { background: rgba(20,184,166,0.2); }
  .editor-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--border-color);
    background: rgba(0,0,0,0.2);
    flex-wrap: wrap; gap: 0.6rem;
  }
  .editor-info {
    display: flex; align-items: center; gap: 0.5rem;
    min-width: 0; flex: 1;
  }
  .editor-icon-wrap {
    width: 26px; height: 26px; border-radius: 7px;
    background: rgba(20,184,166,0.1); border: 1px solid rgba(20,184,166,0.2);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .editor-exam-title {
    font-weight: 700; font-size: 0.85rem; color: var(--text-primary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    max-width: min(220px, 40vw);
  }
  .badge-subject {
    font-size: 0.65rem; padding: 2px 7px; border-radius: 20px;
    background: rgba(99,102,241,0.1); color: #a5b4fc;
    border: 1px solid rgba(99,102,241,0.18); font-weight: 600; flex-shrink: 0;
  }
  .badge-count {
    font-size: 0.65rem; padding: 2px 7px; border-radius: 20px;
    background: rgba(255,255,255,0.04); color: var(--text-muted);
    border: 1px solid var(--border-color); flex-shrink: 0;
  }
  .tabs-wrap {
    display: flex; gap: 0.2rem;
    background: rgba(255,255,255,0.03);
    border-radius: 9px; padding: 3px;
    border: 1px solid var(--border-color);
    flex-shrink: 0;
  }
  .tab-btn {
    display: flex; align-items: center; gap: 0.3rem;
    padding: 0.32rem 0.8rem; border-radius: 6px; border: none;
    background: transparent;
    color: var(--text-muted);
    font-weight: 500; font-size: 0.78rem;
    cursor: pointer; font-family: inherit;
    transition: all 0.2s;
    border-right: 2px solid transparent;
  }
  .tab-btn--active {
    background: linear-gradient(135deg, rgba(20,184,166,0.18), rgba(20,184,166,0.07));
    color: var(--color-teal);
    font-weight: 700;
    border-right-color: var(--color-teal);
  }
  .tab-label-short { display: none; }
  .editor-body { padding: clamp(0.75rem, 2vw, 1.25rem); }

  /* ── Mobile ── */
  @media (max-width: 600px) {
    .gen-subtitle { display: none; }
    .exams-grid { grid-template-columns: 1fr 1fr; }
    .editor-exam-title { max-width: 30vw; }
    .badge-subject { display: none; }
    .tab-label-full { display: none; }
    .tab-label-short { display: inline; }
    .tab-btn { padding: 0.32rem 0.65rem; }
  }
  @media (max-width: 400px) {
    .exams-grid { grid-template-columns: 1fr; }
    .gen-icon { width: 36px; height: 36px; border-radius: 10px; }
    .btn-new-exam { padding: 0.5rem 0.85rem; font-size: 0.8rem; }
    .editor-icon-wrap { display: none; }
    .badge-count { display: none; }
  }
`;

function IconBtn({ children, onClick, title, hoverColor }: { children: React.ReactNode; onClick: () => void; title: string; hoverColor: string }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "3px 4px", borderRadius: 5, display: "flex", transition: "color 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
      {children}
    </button>
  );
}

function Badge({ children, color, bg, border }: { children: React.ReactNode; color: string; bg: string; border: string }) {
  return (
    <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: 20, background: bg, color, border: `1px solid ${border}`, fontWeight: 600 }}>
      {children}
    </span>
  );
}
