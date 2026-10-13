import { api } from "@/lib/apiClient";
import { Salary } from "@/lib/types";
import { notifyFinancialChange } from "@/lib/financialEvents";

function normalize(s: any): Salary {
  return { ...s, id: s.id ?? String(s._id) };
}

export const SalariesRepository = {
  async getAll(year?: number): Promise<Salary[]> {
    const data = await api.get<any[]>(year ? `/salaries?year=${year}` : "/salaries");
    return data.map(normalize);
  },
  async add(salary: Omit<Salary, "id" | "created_at" | "teacher_id">): Promise<Salary> {
    const result = await api.post<any>("/salaries", salary);
    notifyFinancialChange();
    return normalize(result);
  },
  async update(id: string, updates: Partial<Omit<Salary, "id" | "created_at" | "teacher_id">>): Promise<Salary> {
    const result = await api.patch<any>(`/salaries/${id}`, updates);
    notifyFinancialChange();
    return normalize(result);
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/salaries/${id}`);
    notifyFinancialChange();
  },
  async confirmPayment(id: string, month: number, year: number): Promise<Salary> {
    const result = await api.patch<any>(`/salaries/${id}/pay`, { month, year });
    notifyFinancialChange();
    return normalize(result);
  },
};
