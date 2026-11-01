import { Question, Grade, Group } from "@/lib/types";

export interface FormsPreviewProps {
  questions: Question[];
  bankTitle: string;
  subject: string;
  examDate: string;
  teacherName: string;
  gradeId: string;
  groupId: string;
  examTotalScore: number | null;
  grades: Grade[];
  groups: Group[];
}

export interface FormSeed {
  id: number;
  poolSeed: number;
  optionSeeds: number[];
}

export interface GeneratedForm {
  id: number;
  questions: Question[];
}

export const ML = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];

export function formLabel(idx: number): string {
  return String(idx + 1);
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return d; }
}

/** Resolve correct answer label for answer key */
export function resolveAnswerLabel(q: Question): string {
  const ca = q.correct_answer;
  const cas = q.correct_answers;

  if (q.question_type === "essay") return "مقالي";

  // true/false — options are fixed: أ = صح, ب = خطأ
  if (q.question_type === "true_false") {
    if (ca === "خطأ") return "ب (خطأ)";
    if (ca === "صح") return "أ (صح)";
    return ca || "—";
  }

  // multiple choice
  if (q.question_type === "multiple_choice") {
    const list = cas?.length ? cas : ca ? [ca] : [];
    if (!list.length) return "—";
    return list.map(c => {
      if (!c) return "—";
      if (c.startsWith("__idx__") || c.startsWith("__img__")) {
        const idx = parseInt(c.slice(7), 10);
        return ML[idx] ?? "—";
      }
      const i = q.options?.indexOf(c) ?? -1;
      return i !== -1 ? (ML[i] ?? c) : c;
    }).join(" + ");
  }

  // single choice
  if (!ca) return "—";
  if (ca.startsWith("__idx__") || ca.startsWith("__img__")) {
    const idx = parseInt(ca.slice(7), 10);
    return ML[idx] ?? "—";
  }
  const i = q.options?.indexOf(ca) ?? -1;
  return i !== -1 ? (ML[i] ?? ca) : ca;
}
