import { examsRepository } from "@/lib/repositories/examsRepository";
import { Exam, ExamGrade } from "@/lib/types";

export const examsService = {
  async findOrCreateByBank(bank: { bank_id: string; group_id: string; title: string; max_score?: number; exam_date?: string }, teacherId?: string): Promise<Exam> {
    const result = await examsRepository.findOrCreateByBank(bank);
    if (teacherId) examsRepository.invalidateAllGradesCache(teacherId);
    return result;
  },

  async getAllStudentsExamGrades(teacherId: string): Promise<Record<string, (Exam & { score: number | null })[]>> {
    return await examsRepository.getAllStudentsExamGrades(teacherId);
  },

  async getStudentExams(studentId: string): Promise<(Exam & { score: number | null })[]> {
    return await examsRepository.getStudentExams(studentId);
  },

  async getExamsByGroupId(groupId: string): Promise<Exam[]> {
    return await examsRepository.getExamsByGroupId(groupId);
  },

  async addExam(exam: Omit<Exam, "id" | "created_at">, teacherId?: string): Promise<Exam> {
    const result = await examsRepository.addExam(exam);
    if (teacherId) examsRepository.invalidateAllGradesCache(teacherId);
    return result;
  },

  async deleteExam(id: string, teacherId?: string): Promise<void> {
    await examsRepository.deleteExam(id);
    if (teacherId) examsRepository.invalidateAllGradesCache(teacherId);
  },

  async getGradesByExamId(examId: string): Promise<ExamGrade[]> {
    return await examsRepository.getGradesByExamId(examId);
  },

  async updateExam(id: string, updates: Partial<Omit<Exam, "id" | "created_at">>, teacherId?: string): Promise<void> {
    await examsRepository.updateExam(id, updates);
    if (teacherId) examsRepository.invalidateAllGradesCache(teacherId);
  },

  async upsertGrades(grades: Omit<ExamGrade, "id" | "created_at">[], teacherId?: string): Promise<void> {
    await examsRepository.upsertGrades(grades);
    if (teacherId) examsRepository.invalidateAllGradesCache(teacherId);
  },
};
