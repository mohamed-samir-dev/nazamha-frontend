"use client";

import { useState, useMemo, useEffect } from "react";
import { Question } from "@/lib/types";
import { FormSeed, GeneratedForm, seededShuffle } from "../_components/preview/types";
import { printHtml } from "@/lib/printHtml";

export type SectionType = "mcq" | "essay" | "multiple_choice" | "true_false";

const SECTION_LABELS: Record<SectionType, string> = {
  mcq: "اختيار من متعدد",
  essay: "مقالي",
  multiple_choice: "اختيار متعدد الإجابات",
  true_false: "صح وخطأ",
};

export function useFormsPreview(
  questions: Question[],
  bankTitle: string,
  subject: string,
  examDate: string,
  teacherName: string,
  gradeId: string,
  groupId: string,
  examTotalScore: number | null,
) {
  const [seeds, setSeeds] = useState<FormSeed[]>([]);
  const [printing, setPrinting] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [numForms, setNumForms] = useState(2);

  const totalScore = useMemo(
    () => examTotalScore ?? questions.reduce((s, q) => s + (q.marks ?? 1), 0),
    [examTotalScore, questions]
  );

  const questionsScore = questions.reduce((sum, question) => sum + (question.marks ?? 1), 0);
  const scoreError = questions.length > 0 && Math.abs(questionsScore - totalScore) > 0.000001
    ? `مجموع درجات الأسئلة (${questionsScore}) لا يساوي الدرجة الكلية (${totalScore}). عدّل درجات الأسئلة أو الدرجة الكلية من تبويب الأسئلة قبل توليد النماذج.`
    : null;

  const [teacher, setTeacher] = useState(teacherName);
  const [subj, setSubj] = useState(subject);
  const [examTitle, setExamTitle] = useState(bankTitle);
  const [date, setDate] = useState(examDate);
  const [gId, setGId] = useState(gradeId);
  const [grpId, setGrpId] = useState(groupId);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [sectionOrder, setSectionOrder] = useState<SectionType[]>([]);

  // Detect which section types exist in questions and init order
  useEffect(() => {
    const types = new Set<SectionType>();
    questions.forEach(q => {
      if (q.question_type === "essay") types.add("essay");
      else if (q.question_type === "multiple_choice") types.add("multiple_choice");
      else if (q.question_type === "true_false") types.add("true_false");
      else if (q.options?.length) types.add("mcq");
    });
    setSectionOrder(prev => {
      const existing = prev.filter(t => types.has(t));
      const newTypes = ([...types] as SectionType[]).filter(t => !prev.includes(t));
      return [...existing, ...newTypes];
    });
  }, [questions]);

  useEffect(() => {
    setTeacher(teacherName); setSubj(subject); setExamTitle(bankTitle);
    setDate(examDate); setGId(gradeId); setGrpId(groupId); setSeeds([]);
  }, [bankTitle, subject, examDate, teacherName, gradeId, groupId]);

  const forms = useMemo((): GeneratedForm[] => {
    if (!seeds.length || !questions.length || scoreError) return [];
    return seeds.map(seed => {
      const buckets: Record<SectionType, Question[]> = {
        mcq: questions.filter(q => (q.question_type === "single_choice" || q.question_type === "mcq" || (!q.question_type && q.options?.length))),
        essay: questions.filter(q => q.question_type === "essay"),
        multiple_choice: questions.filter(q => q.question_type === "multiple_choice"),
        true_false: questions.filter(q => q.question_type === "true_false"),
      };

      const shuffledBuckets: Record<SectionType, Question[]> = {
        mcq: seededShuffle(buckets.mcq, seed.poolSeed + 3),
        // Keep essay questions order identical across all forms so that
        // the model answers and teacher notes are 100% aligned with the answer key!
        essay: buckets.essay,
        multiple_choice: seededShuffle(buckets.multiple_choice, seed.poolSeed + 1),
        true_false: seededShuffle(buckets.true_false, seed.poolSeed + 2),
      };

      const order: SectionType[] = sectionOrder.length > 0 ? sectionOrder : ["mcq", "multiple_choice", "true_false", "essay"];
      const shuffledQs = order.flatMap(t => shuffledBuckets[t]).map((q, qi) => {
        if (!q.options?.length) return q;

        // True/False questions: never shuffle options; keep (A) صح, (B) خطأ
        if (q.question_type === "true_false") {
          return {
            ...q,
            options: ["صح", "خطأ"],
            option_images: [null, null],
          };
        }

        // Single Choice & Multiple Choice: shuffle options and track correct answers accurately
        const correctIndices = new Set<number>();
        const resolveOrigIdx = (val: string | null | undefined): number => {
          if (!val) return -1;
          if (val.startsWith("__img__") || val.startsWith("__idx__")) {
            return parseInt(val.slice(7), 10);
          }
          return q.options ? q.options.indexOf(val) : -1;
        };

        if (q.question_type === "multiple_choice") {
          (q.correct_answers || []).forEach(ca => {
            const idx = resolveOrigIdx(ca);
            if (idx !== -1) correctIndices.add(idx);
          });
        } else {
          const idx = resolveOrigIdx(q.correct_answer);
          if (idx !== -1) correctIndices.add(idx);
        }

        const optSeed = seed.optionSeeds[qi] ?? seed.poolSeed + qi;
        const paired = q.options.map((opt, i) => ({
          opt,
          img: q.option_images?.[i] ?? null,
          isCorrect: correctIndices.has(i),
        }));

        const shuffled = seededShuffle(paired, optSeed);
        const newOptions = shuffled.map(p => p.opt);
        const newImages = shuffled.map(p => p.img);

        let newCorrectAnswer: string | null = null;
        let newCorrectAnswers: string[] | null = null;

        if (q.question_type === "multiple_choice") {
          newCorrectAnswers = shuffled
            .map((p, i) => p.isCorrect ? (p.opt.trim() ? p.opt : `__img__${i}`) : null)
            .filter((v): v is string => v !== null);
        } else {
          const newIdx = shuffled.findIndex(p => p.isCorrect);
          if (newIdx !== -1) {
            newCorrectAnswer = shuffled[newIdx].opt.trim() ? shuffled[newIdx].opt : `__img__${newIdx}`;
          }
        }

        return {
          ...q,
          options: newOptions,
          option_images: newImages,
          correct_answer: newCorrectAnswer,
          correct_answers: newCorrectAnswers,
        };
      });

      return { id: seed.id, questions: shuffledQs };
    });
  }, [seeds, questions, sectionOrder, scoreError]);

  const generate = () => {
    if (!questions.length || scoreError) return;
    setSeeds(Array.from({ length: numForms }, (_, i) => ({
      id: i + 1,
      poolSeed: Math.floor(Math.random() * 0xffffffff),
      optionSeeds: Array.from({ length: questions.length }, () =>
        Math.floor(Math.random() * 0xffffffff)
      ),
    })));
  };

  const printOne = (elIdx: number, label: string) => {
    if (printing !== null || scoreError) return;
    const isAnswerKey = elIdx >= forms.length;
    const targetId = isAnswerKey ? "exam-preview-answer-key" : `exam-preview-form-${elIdx}`;
    const el = document.getElementById(targetId);
    if (!el) return;

    const clone = el.cloneNode(true) as HTMLElement;

    setPrinting(elIdx);
    const title = `امتحان ${examTitle || bankTitle} — ${label}`;
    const html = `<!DOCTYPE html><html dir="rtl"><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${title}</title>
      <style>
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        @page { size: A4 portrait; margin: 10mm 12mm 12mm 12mm; }
        body { margin: 0; padding: 0; background: #fff; font-family: 'Arial','Tahoma',sans-serif; direction: rtl; }
        .exam-form-page {
          width: 100% !important; max-width: 190mm !important; min-height: auto !important;
          padding: 0 !important; margin: 0 auto !important; background: #fff !important;
          color: #000 !important; font-family: 'Arial','Tahoma',sans-serif !important;
          font-size: 13px !important; line-height: 1.5 !important; direction: rtl !important;
        }
        .exam-question-item { break-inside: avoid !important; page-break-inside: avoid !important; }
        .mobile-print-btn {
          display: none;
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: #111; color: #fff; border: none; padding: 14px 32px;
          border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer;
          z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3); font-family: inherit;
        }
        @media (max-width: 768px) { .mobile-print-btn { display: block; } }
        @media print { .mobile-print-btn { display: none !important; } }
      </style>
    </head><body>
      ${clone.outerHTML}
      <button class="mobile-print-btn" onclick="window.print()">🖸 طباعة</button>
      <script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script>
    </body></html>`;

    printHtml(html);
    setTimeout(() => setPrinting(null), 1500);
  };

  return {
    forms, printing,
    settingsOpen, setSettingsOpen,
    numForms, setNumForms,
    totalScore, scoreError,
    teacher, setTeacher,
    subj, setSubj,
    examTitle, setExamTitle,
    date, setDate,
    gId, setGId,
    grpId, setGrpId,
    instructions, setInstructions,
    sectionOrder, setSectionOrder,
    SECTION_LABELS,
    generate, printOne,
  };
}
