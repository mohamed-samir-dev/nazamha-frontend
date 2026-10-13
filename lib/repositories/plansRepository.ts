import { api } from "@/lib/apiClient";
import { Plan } from "@/lib/types";

export const PlansRepository = {
  async getAllPlans(): Promise<Plan[]> {
    return api.get<Plan[]>("/plans");
  },

  async addPlan(plan: Omit<Plan, "id" | "created_at">): Promise<Plan> {
    return api.post<Plan>("/plans", plan);
  },

  async updatePlan(id: string, updates: Partial<Plan>): Promise<void> {
    await api.patch(`/plans/${id}`, updates);
  },

  async deletePlan(id: string): Promise<void> {
    await api.delete(`/plans/${id}`);
  },
};
