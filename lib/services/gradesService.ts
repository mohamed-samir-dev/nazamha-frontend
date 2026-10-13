import { GradesRepository } from "@/lib/repositories/gradesRepository";
import { Grade } from "@/lib/types";
import { OfflineCache } from "@/lib/offlineQueue";

export const GradesService = {
  async getGradesByTeacherId(teacherId: string): Promise<Grade[]> {
    return GradesRepository.getGradesByTeacherId(teacherId);
  },

  async getAllGrades(): Promise<Grade[]> {
    return GradesRepository.getAllGrades();
  },

  async addGrade(grade: Omit<Grade, "id" | "created_at">): Promise<Grade> {
    const result = await GradesRepository.addGrade(grade);
    OfflineCache.saveGrades([]);
    return result;
  },

  async updateGrade(id: string, updates: Partial<Grade>): Promise<void> {
    await GradesRepository.updateGrade(id, updates);
    OfflineCache.saveGrades([]);
  },

  async deleteGrade(id: string): Promise<void> {
    await GradesRepository.deleteGrade(id);
    OfflineCache.saveGrades([]);
  }
};
