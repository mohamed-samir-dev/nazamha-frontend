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
    category?: string;
    payment_status?: string;
  }): Promise<TeacherExpense[]> {
    const query = new URLSearchParams();
    if (params?.year) query.append("year", String(params.year));
    if (params?.month) query.append("month", String(params.month));
    if (params?.expense_type) query.append("expense_type", params.expense_type);
    if (params?.category) query.append("category", params.category);
    if (params?.payment_status) query.append("payment_status", params.payment_status);

    const url = query.toString() ? `/teacher-expenses?${query}` : "/teacher-expenses";
    const data = await api.get<any[]>(url);
    return data.map(normalize);
  },

  async getCategories(): Promise<string[]> {
    return api.get<string[]>("/teacher-expenses/categories");
  },

  async getStatistics(year?: number): Promise<ExpenseStatistics> {
    const query = year ? `?year=${year}` : "";
    return await api.get<ExpenseStatistics>(`/teacher-expenses/statistics${query}`);
  },

  async add(expense: Partial<TeacherExpense>): Promise<TeacherExpense> {
    const result = await api.post<any>("/teacher-expenses", expense);
    notifyFinancialChange();
    return normalize(result);
  },

  async update(id: string, updates: Partial<TeacherExpense>): Promise<TeacherExpense> {
    const result = await api.patch<any>(`/teacher-expenses/${id}`, updates);
    notifyFinancialChange();
    return normalize(result);
  },

  async recordPayment(
    id: string,
    payment: {
      amount?: number;
      payment_date?: string;
      payment_method?: string;
      notes?: string;
      receipt_attachment?: string;
      month?: number;
      year?: number;
    }
  ): Promise<{ message?: string; expense?: TeacherExpense }> {
    const result = await api.post<any>(`/teacher-expenses/${id}/pay`, payment);
    notifyFinancialChange();
    return {
      message: result.message,
      expense: result.expense ? normalize(result.expense) : normalize(result),
    };
  },

  async cancel(id: string, reason: string): Promise<{ message: string; expense: TeacherExpense }> {
    const result = await api.post<any>(`/teacher-expenses/${id}/cancel`, { reason });
    notifyFinancialChange();
    return { message: result.message, expense: normalize(result.expense) };
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
