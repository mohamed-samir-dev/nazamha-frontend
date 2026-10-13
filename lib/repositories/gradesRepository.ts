import { api } from "@/lib/apiClient";
import { Grade } from "@/lib/types";
import { appCache } from "@/lib/appCache";

const GRADES_KEY = "grades:me";

export const GradesRepository = {
  async getGradesByTeacherId(_teacherId: string): Promise<Grade[]> {
    const cached = appCache.get<Grade[]>(GRADES_KEY);
    if (cached) return cached;
    const data = await api.get<Grade[]>("/grades");
    appCache.set(GRADES_KEY, data);
    return data;
  },

  async getAllGrades(): Promise<Grade[]> {
    return GradesRepository.getGradesByTeacherId("");
  },

  async addGrade(grade: Omit<Grade, "id" | "created_at">): Promise<Grade> {
    const result = await api.post<Grade>("/grades", grade);
    appCache.invalidate(GRADES_KEY);
    return result;
  },

  async updateGrade(id: string, updates: Partial<Grade>): Promise<void> {
    await api.patch(`/grades/${id}`, updates);
    appCache.invalidate(GRADES_KEY);
  },

  async deleteGrade(id: string): Promise<void> {
    await api.delete(`/grades/${id}`);
    appCache.invalidate(GRADES_KEY);
  },
};
