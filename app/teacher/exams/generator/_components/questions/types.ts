export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "essay";

export interface QuestionFormState {
  content: string;
  questionType: QuestionType;
  options: string[];
  optionImages: (string | null)[];
  correctAnswer: string;
  correctAnswers: string[];
  imageBase64: string | null;
  marks: number;
  teacherNotes: string;
  modelAnswer: string;
  essayLines: number;
  sectionName: string;
}

export const emptyForm = (): QuestionFormState => ({
  content: "",
  questionType: "single_choice",
  options: ["", "", "", ""],
  optionImages: [null, null, null, null],
  correctAnswer: "",
  correctAnswers: [],
  imageBase64: null,
  marks: 1,
  teacherNotes: "",
  modelAnswer: "",
  essayLines: 3,
  sectionName: "",
});
