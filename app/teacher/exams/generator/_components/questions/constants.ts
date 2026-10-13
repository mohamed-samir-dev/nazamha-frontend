import { Question } from "@/lib/types";
import { QuestionFormState, QuestionType } from "./types";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "اختيار واحد",
  multiple_choice: "اختيار متعدد",
  true_false: "صح أو خطأ",
  essay: "مقالي",
};

export const TRUE_FALSE_OPTIONS = ["صح", "خطأ"];

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.75rem",
  borderRadius: 10,
  background: "rgba(15,23,42,0.8)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  outline: "none",
  transition: "border-color 0.2s",
  resize: "vertical" as const,
  boxSizing: "border-box" as const,
};

export const iconBtnStyle = (danger = false): React.CSSProperties => ({
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
  padding: "5px 6px",
  borderRadius: 7,
  display: "flex",
  alignItems: "center",
  transition: "color 0.15s, background 0.15s",
});

/** Map a Question from DB → QuestionFormState */
export function questionToForm(q: Question): QuestionFormState {
  const type = normalizeType(q.question_type);
  const opts =
    type === "true_false"
      ? [...TRUE_FALSE_OPTIONS]
      : q.options && q.options.length > 0
      ? [...q.options, "", ""].slice(0, Math.max(q.options.length, 4))
      : ["", "", "", ""];

  const images: (string | null)[] = opts.map(
    (_, i) => (q.option_images?.[i] ?? null)
  );

  // convert correct_answer to __idx__ if the option has an image and no text
  const resolveCorrectAnswer = (val: string | null | undefined): string => {
    if (!val) return "";
    const idx = opts.indexOf(val);
    if (idx !== -1 && images[idx] && !opts[idx].trim()) return `__idx__${idx}`;
    return val;
  };

  return {
    content: q.content,
    questionType: type,
    options: opts,
    optionImages: images,
    correctAnswer: resolveCorrectAnswer(q.correct_answer),
    correctAnswers: (q.correct_answers || []).map(resolveCorrectAnswer),
    imageBase64: q.image_base64 || null,
    marks: q.marks ?? 1,
    teacherNotes: q.teacher_notes || "",
    modelAnswer: q.model_answer || "",
    essayLines: q.essay_lines || 3,
    sectionName: q.section_name || "",
  };
}

/** Map QuestionFormState → DB payload */
export function formToQuestion(f: QuestionFormState) {
  const isChoice =
    f.questionType === "single_choice" ||
    f.questionType === "multiple_choice" ||
    f.questionType === "true_false";

  // keep track of original indices after filtering
  const filledWithIdx = f.options
    .map((o, i) => ({ text: o, img: f.optionImages[i] ?? null, origIdx: i }))
    .filter((o) => o.text.trim() || o.img);

  const resolveCorrect = (val: string): string => {
    if (!val) return "";
    if (val.startsWith("__idx__")) {
      const origIdx = parseInt(val.slice(7), 10);
      const newIdx = filledWithIdx.findIndex((o) => o.origIdx === origIdx);
      return newIdx !== -1 ? filledWithIdx[newIdx].text || `__img__${newIdx}` : "";
    }
    return val;
  };

  return {
    content: f.content,
    question_type: f.questionType as "single_choice" | "multiple_choice" | "true_false" | "essay",
    options: isChoice ? filledWithIdx.map((o) => o.text) : null,
    option_images: isChoice ? filledWithIdx.map((o) => o.img) : null,
    correct_answer:
      f.questionType === "single_choice" || f.questionType === "true_false"
        ? resolveCorrect(f.correctAnswer) || null
        : null,
    correct_answers:
      f.questionType === "multiple_choice"
        ? f.correctAnswers.map(resolveCorrect).filter(Boolean)
        : null,
    image_base64: f.imageBase64,
    marks: f.marks,
    teacher_notes: f.teacherNotes?.trim() || null,
    model_answer: f.questionType === "essay" ? (f.modelAnswer?.trim() || null) : null,
    essay_lines: f.questionType === "essay" ? f.essayLines : null,
    section_name: f.sectionName?.trim() || null,
  };
}

/** Validate form before save — returns error string or null */
export function validateForm(f: QuestionFormState): string | null {
  if (!f.content.trim() && !f.imageBase64)
    return "يجب كتابة نص السؤال أو إرفاق صورة";
  if (f.marks <= 0) return "يجب أن تكون الدرجة أكبر من صفر";

  if (f.questionType === "essay") return null;

  const filled = f.options.filter((o, i) => o.trim() || f.optionImages[i]);
  if (
    (f.questionType === "single_choice" ||
      f.questionType === "multiple_choice") &&
    filled.length < 2
  )
    return "يجب إضافة خيارين على الأقل";

  const emptyOpt = f.options.findIndex(
    (o, i) => !o.trim() && !f.optionImages[i] && i < filled.length
  );
  if (emptyOpt !== -1) return `الخيار ${emptyOpt + 1} فارغ`;

  if (
    f.questionType === "single_choice" ||
    f.questionType === "true_false"
  ) {
    if (!f.correctAnswer) return "يجب تحديد الإجابة الصحيحة";
  }
  if (f.questionType === "multiple_choice") {
    if (f.correctAnswers.length === 0) return "يجب تحديد إجابة صحيحة واحدة على الأقل";
  }
  return null;
}

function normalizeType(t?: string | null): QuestionFormState["questionType"] {
  if (t === "single_choice" || t === "multiple_choice" || t === "true_false" || t === "essay")
    return t;
  if (t === "mcq") return "single_choice";
  return "single_choice";
}
