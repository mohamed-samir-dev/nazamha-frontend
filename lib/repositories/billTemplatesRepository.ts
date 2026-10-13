import { api } from "@/lib/apiClient";
import { BillTemplate } from "@/lib/types";

export const BillTemplatesRepository = {
  async getByTeacherId(_teacherId: string): Promise<BillTemplate[]> {
    return api.get<BillTemplate[]>("/bill-templates");
  },

  async add(template: Omit<BillTemplate, "id" | "created_at">): Promise<BillTemplate> {
    return api.post<BillTemplate>("/bill-templates", template);
  },

  async update(id: string, updates: Partial<Omit<BillTemplate, "id" | "created_at" | "teacher_id">>): Promise<BillTemplate> {
    return api.patch<BillTemplate>(`/bill-templates/${id}`, updates);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/bill-templates/${id}`);
  },
};
