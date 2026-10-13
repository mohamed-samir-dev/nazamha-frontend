import { api } from "@/lib/apiClient";
import { TeacherExpense, ExpenseStatistics } from "@/lib/types";
import { notifyFinancialChange } from "@/lib/financialEvents";

function normalize(exp: any): TeacherExpense {
  return { ...exp, id: exp.id ?? String(exp._id) };
}

export const TeacherExpensesRepository = {
  async getAll(params?: {
    year?: number;
    month?: number;
    expense_type?: string;
    payment_status?: string;
  }): Promise<TeacherExpense[]> {
    const query = new URLSearchParams();
    if (params?.year) query.append("year", String(params.year));
    if (params?.month) query.append("month", String(params.month));
    if (params?.expense_type) query.append("expense_type", params.expense_type);
    if (params?.payment_status) query.append("payment_status", params.payment_status);
    
    const url = query.toString() ? `/teacher-expenses?${query}` : "/teacher-expenses";
    const data = await api.get<any[]>(url);
    return data.map(normalize);
  },

  async getStatistics(year?: number): Promise<ExpenseStatistics> {
    const query = year ? `?year=${year}` : "";
    return await api.get<ExpenseStatistics>(`/teacher-expenses/statistics${query}`);
  },

  async add(expense: Omit<TeacherExpense, "id" | "created_at" | "updated_at" | "teacher_id" | "_virtual">): Promise<TeacherExpense> {
    const result = await api.post<any>("/teacher-expenses", expense);
    notifyFinancialChange();
    return normalize(result);
  },

  async update(
    id: string, 
    updates: Partial<Omit<TeacherExpense, "id" | "created_at" | "updated_at" | "teacher_id" | "_virtual">>
  ): Promise<TeacherExpense> {
    const result = await api.patch<any>(`/teacher-expenses/${id}`, updates);
    notifyFinancialChange();
    return normalize(result);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/teacher-expenses/${id}`);
    notifyFinancialChange();
  },
  async confirmPayment(id: string, month: number, year: number): Promise<TeacherExpense> {
    const result = await api.patch<any>(`/teacher-expenses/${id}/pay`, { month, year });
    notifyFinancialChange();
    return normalize(result);
  },
};
