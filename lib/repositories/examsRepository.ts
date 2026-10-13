import { api } from "@/lib/apiClient";
import { appCache } from "@/lib/appCache";
import { Exam, ExamGrade } from "@/lib/types";

const EXAM_GRADES_CACHE_PREFIX = "examGrades:me:";

export const examsRepository = {
  async findOrCreateByBank(bank: { bank_id: string; group_id: string; title: string; max_score?: number; exam_date?: string }): Promise<Exam> {
    return api.post<Exam>("/exams/find-or-create", bank);
  },

  async getAllStudentsExamGrades(teacherId: string): Promise<Record<string, (Exam & { score: number | null })[]>> {
    const cacheKey = `${EXAM_GRADES_CACHE_PREFIX}${teacherId}`;
    const cached = appCache.get<Record<string, (Exam & { score: number | null })[]>>(cacheKey);
    if (cached) return cached;
    const data = await api.get<Record<string, (Exam & { score: number | null })[]>>(`/exams/all-grades`);
    appCache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes TTL
    return data;
  },

  invalidateAllGradesCache(teacherId: string): void {
    appCache.invalidate(`${EXAM_GRADES_CACHE_PREFIX}${teacherId}`);
  },

  async getStudentExams(studentId: string): Promise<(Exam & { score: number | null })[]> {
    return api.get<(Exam & { score: number | null })[]>(`/exams/student/${studentId}`);
  },

  async getExamsByGroupId(groupId: string): Promise<Exam[]> {
    return api.get<Exam[]>(`/exams?group_id=${groupId}`);
  },

  async addExam(exam: Omit<Exam, "id" | "created_at">): Promise<Exam> {
    return api.post<Exam>("/exams", exam);
  },

  async updateExam(id: string, updates: Partial<Omit<Exam, "id" | "created_at">>): Promise<void> {
    await api.patch(`/exams/${id}`, updates);
  },

  async deleteExam(id: string): Promise<void> {
    await api.delete(`/exams/${id}`);
  },

  async getGradesByExamId(examId: string): Promise<ExamGrade[]> {
    return api.get<ExamGrade[]>(`/exams/${examId}/grades`);
  },

  async upsertGrades(grades: Omit<ExamGrade, "id" | "created_at">[]): Promise<void> {
    if (grades.length === 0) return;
    await api.post(`/exams/${grades[0].exam_id}/grades`, { grades });
  },
};
