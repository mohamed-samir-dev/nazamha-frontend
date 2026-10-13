import { api } from "@/lib/apiClient";
import { Teacher } from "@/lib/types";
import { appCache } from "@/lib/appCache";

const TEACHER_CACHE_KEY = "teacher:me";

export const TeachersRepository = {
  async getTeacherById(_id: string): Promise<Teacher | null> {
    const cached = appCache.get<Teacher>(TEACHER_CACHE_KEY);
    if (cached) return cached;
    const data = await api.get<Teacher>("/teachers/me").catch(() => null);
    if (data) appCache.set(TEACHER_CACHE_KEY, data);
    return data;
  },

  invalidateCache(): void {
    appCache.invalidate(TEACHER_CACHE_KEY);
  },

  async updateTeacher(_id: string, updates: Partial<Teacher>): Promise<void> {
    await api.patch("/teachers/me", updates);
    appCache.invalidate(TEACHER_CACHE_KEY);
  },

  async getAllTeachers(): Promise<Teacher[]> {
    return api.get<Teacher[]>("/teachers");
  },
};
