import { api } from "@/lib/apiClient";
import { SubTeacher } from "@/lib/types";

export const SubTeachersRepository = {
  async getSubTeachersByCenterId(_centerId: string): Promise<SubTeacher[]> {
    return api.get<SubTeacher[]>("/sub-teachers");
  },

  async addSubTeacher(subTeacher: Omit<SubTeacher, "id" | "created_at">): Promise<SubTeacher> {
    return api.post<SubTeacher>("/sub-teachers", subTeacher);
  },

  async deleteSubTeacher(id: string): Promise<void> {
    await api.delete(`/sub-teachers/${id}`);
  },
};
