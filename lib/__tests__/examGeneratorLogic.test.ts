import { Question } from "../types";
import { seededShuffle, resolveAnswerLabel, ML } from "../../app/teacher/exams/generator/_components/preview/types";
import { questionToForm, formToQuestion, validateForm } from "../../app/teacher/exams/generator/_components/questions/constants";

describe("Exam Generator - Form Shuffling and Answer Key Accuracy", () => {
  it("preserves stable identity and resolves accurate answer keys for text options after shuffling", () => {
    const q: Question = {
      id: "q1",
      bank_id: "b1",
      content: "ما هي عاصمة مصر؟",
      question_type: "single_choice",
      options: ["الإسكندرية", "القاهرة", "الجيزة", "طنطا"],
      option_images: [null, null, null, null],
      correct_answer: "القاهرة", // Index 1 originally -> Letter ب
      marks: 2,
    };

    // Simulate shuffling for Form A
    const seed = 12345;
    const correctIndices = new Set([1]);
    const paired = q.options!.map((opt, i) => ({
      opt,
      img: q.option_images?.[i] ?? null,
      isCorrect: correctIndices.has(i),
    }));

    const shuffled = seededShuffle(paired, seed);
    const newIdx = shuffled.findIndex(p => p.isCorrect);
    expect(newIdx).toBeGreaterThanOrEqual(0);

    const formQ: Question = {
      ...q,
      options: shuffled.map(p => p.opt),
      option_images: shuffled.map(p => p.img),
      correct_answer: shuffled[newIdx].opt,
    };

    const resolvedLabel = resolveAnswerLabel(formQ);
    // The resolved letter in AnswerKey must match the new shuffled position
    expect(resolvedLabel).toBe(ML[newIdx]);
    expect(formQ.options![newIdx]).toBe("القاهرة");
  });

  it("resolves accurate answer keys for image-only options after shuffling", () => {
    // Option 0 is an image with empty text, and is the correct answer
    const q: Question = {
      id: "q2",
      bank_id: "b1",
      content: "اختر الرسم البياني الصحيح:",
      question_type: "single_choice",
      options: ["", "", ""],
      option_images: ["/uploads/exams/graph_correct.webp", "/uploads/exams/graph_b.webp", "/uploads/exams/graph_c.webp"],
      correct_answer: "__img__0", // Option 0 is correct
      marks: 3,
    };

    const seed = 987654;
    const correctIndices = new Set([0]); // __img__0 -> index 0
    const paired = q.options!.map((opt, i) => ({
      opt,
      img: q.option_images?.[i] ?? null,
      isCorrect: correctIndices.has(i),
    }));

    const shuffled = seededShuffle(paired, seed);
    const newIdx = shuffled.findIndex(p => p.isCorrect);

    const formQ: Question = {
      ...q,
      options: shuffled.map(p => p.opt),
      option_images: shuffled.map(p => p.img),
      correct_answer: `__img__${newIdx}`,
    };

    const resolvedLabel = resolveAnswerLabel(formQ);
    expect(resolvedLabel).toBe(ML[newIdx]);
    expect(formQ.option_images![newIdx]).toBe("/uploads/exams/graph_correct.webp");
  });

  it("correctly handles multiple-choice questions with multiple correct answers after shuffling", () => {
    const q: Question = {
      id: "q3",
      bank_id: "b1",
      content: "أي من الآتي من الغازات النبيلة؟",
      question_type: "multiple_choice",
      options: ["الهيليوم", "الأكسجين", "النيون", "النيتروجين"],
      option_images: [null, null, null, null],
      correct_answers: ["الهيليوم", "النيون"], // Original indices 0 and 2
      marks: 4,
    };

    const seed = 554433;
    const correctIndices = new Set([0, 2]);
    const paired = q.options!.map((opt, i) => ({
      opt,
      img: q.option_images?.[i] ?? null,
      isCorrect: correctIndices.has(i),
    }));

    const shuffled = seededShuffle(paired, seed);
    const newCorrectIndices = shuffled
      .map((p, idx) => p.isCorrect ? idx : -1)
      .filter(idx => idx !== -1);

    const formQ: Question = {
      ...q,
      options: shuffled.map(p => p.opt),
      option_images: shuffled.map(p => p.img),
      correct_answers: newCorrectIndices.map(idx => shuffled[idx].opt),
    };

    const resolvedLabel = resolveAnswerLabel(formQ);
    const expectedLabel = newCorrectIndices.map(idx => ML[idx]).join(" + ");
    expect(resolvedLabel).toBe(expectedLabel);
  });

  it("keeps true/false options fixed (A = صح, B = خطأ) and returns unambiguous labels", () => {
    const qTrue: Question = {
      id: "q4",
      bank_id: "b1",
      content: "الشمس تشرق من الشرق.",
      question_type: "true_false",
      options: ["صح", "خطأ"],
      correct_answer: "صح",
      marks: 1,
    };

    const qFalse: Question = {
      id: "q5",
      bank_id: "b1",
      content: "القمر أكبر من الأرض.",
      question_type: "true_false",
      options: ["صح", "خطأ"],
      correct_answer: "خطأ",
      marks: 1,
    };

    expect(resolveAnswerLabel(qTrue)).toBe("أ (صح)");
    expect(resolveAnswerLabel(qFalse)).toBe("ب (خطأ)");
  });
});

describe("Question Form Conversions and Type Integrity", () => {
  it("converts all 4 question types to form and back without data loss", () => {
    const types = ["single_choice", "multiple_choice", "true_false", "essay"] as const;

    types.forEach(t => {
      const q: Question = {
        id: `q_${t}`,
        bank_id: "b1",
        content: `Test question for ${t}`,
        question_type: t,
        options: t === "essay" ? null : t === "true_false" ? ["صح", "خطأ"] : ["A", "B", "C", "D"],
        correct_answer: t === "single_choice" ? "A" : t === "true_false" ? "صح" : null,
        correct_answers: t === "multiple_choice" ? ["A", "C"] : null,
        essay_lines: t === "essay" ? 5 : null,
        marks: 2,
      };

      const formState = questionToForm(q);
      expect(formState.questionType).toBe(t);

      const saved = formToQuestion(formState);
      expect(saved.question_type).toBe(t);
      if (t === "multiple_choice") {
        expect(saved.correct_answers).toEqual(["A", "C"]);
      } else if (t === "single_choice" || t === "true_false") {
        expect(saved.correct_answer).toBe(q.correct_answer);
      }
    });
  });

  it("safely maps legacy mcq questions to single_choice", () => {
    const legacyQ: Question = {
      id: "legacy_1",
      bank_id: "b1",
      content: "Legacy question",
      question_type: "mcq" as any,
      options: ["1", "2"],
      correct_answer: "1",
      marks: 1,
    };

    const formState = questionToForm(legacyQ);
    expect(formState.questionType).toBe("single_choice");
  });

  it("validates question forms accurately", () => {
    // Empty content and no image -> invalid
    const empty = {
      content: "",
      questionType: "single_choice" as const,
      options: ["A", "B"],
      optionImages: [null, null],
      correctAnswer: "A",
      correctAnswers: [],
      imageBase64: null,
      marks: 1,
      teacherNotes: "",
      modelAnswer: "",
      essayLines: 3,
      sectionName: "",
    };
    expect(validateForm(empty)).toContain("يجب كتابة نص السؤال");

    // Single choice without correct answer -> invalid
    const noAnswer = { ...empty, content: "Valid content", correctAnswer: "" };
    expect(validateForm(noAnswer)).toContain("يجب تحديد الإجابة الصحيحة");

    // Multiple choice without any correct answers -> invalid
    const noMultiAnswer = { ...empty, content: "Valid content", questionType: "multiple_choice" as const, correctAnswers: [] };
    expect(validateForm(noMultiAnswer)).toContain("يجب تحديد إجابة صحيحة واحدة على الأقل");
  });
});
