"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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

  const hiddenRef = useRef<HTMLDivElement>(null);

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
        mcq: questions.filter(q => q.question_type !== "essay" && q.question_type !== "multiple_choice" && q.question_type !== "true_false" && q.options?.length),
        essay: questions.filter(q => q.question_type === "essay"),
        multiple_choice: questions.filter(q => q.question_type === "multiple_choice"),
        true_false: questions.filter(q => q.question_type === "true_false"),
      };

      const shuffledBuckets: Record<SectionType, Question[]> = {
        mcq: seededShuffle(buckets.mcq, seed.poolSeed + 3),
        essay: seededShuffle(buckets.essay, seed.poolSeed),
        multiple_choice: seededShuffle(buckets.multiple_choice, seed.poolSeed + 1),
        true_false: seededShuffle(buckets.true_false, seed.poolSeed + 2),
      };

      const order: SectionType[] = sectionOrder.length > 0 ? sectionOrder : ["mcq", "multiple_choice", "true_false", "essay"];
      const shuffledQs = order.flatMap(t => shuffledBuckets[t]).map((q, qi) => {
        if (!q.options?.length) return q;
        const optSeed = seed.optionSeeds[qi] ?? seed.poolSeed + qi;
        const paired = q.options.map((opt, i) => ({ opt, img: q.option_images?.[i] ?? null }));
        const shuffled = seededShuffle(paired, optSeed);
        return { ...q, options: shuffled.map(p => p.opt), option_images: shuffled.map(p => p.img) };
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
    if (!hiddenRef.current || printing !== null || scoreError) return;
    const allEls = Array.from(hiddenRef.current.querySelectorAll(".exam-form-page")) as HTMLElement[];
    const el = allEls[elIdx];
    if (!el) return;

    // clone and fix page number to show 1 of 1 when printing single page
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".page-num-display").forEach(span => {
      (span as HTMLElement).textContent = "صفحة 1 من 1";
    });

    setPrinting(elIdx);
    const title = `امتحان ${examTitle || bankTitle} — ${label}`;
    const html = `<!DOCTYPE html><html dir="rtl"><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${title}</title>
      <style>
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #fff; font-family: 'Arial','Tahoma',sans-serif; direction: rtl; }
        @page { size: A4 portrait; margin: 0; }
        .exam-form-page {
          width: 210mm !important; min-height: 297mm !important;
          padding: 15mm 16mm 12mm !important; box-sizing: border-box !important;
          overflow: visible !important; background: #fff !important;
          color: #000 !important; font-family: 'Arial','Tahoma',sans-serif !important;
          font-size: 13px !important; line-height: 1.5 !important; direction: rtl !important;
        }
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
      <script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script>
    </body></html>`;

    printHtml(html);
    setTimeout(() => setPrinting(null), 2000);
  };

  return {
    forms, printing, hiddenRef,
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
