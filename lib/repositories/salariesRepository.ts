import { api } from "@/lib/apiClient";
import { Salary } from "@/lib/types";
import { notifyFinancialChange } from "@/lib/financialEvents";

function normalize(s: any): Salary {
  return { ...s, id: s.id ?? String(s._id) };
}

export const SalariesRepository = {
  async getAll(params?: { year?: number; month?: number; employee_id?: string; status?: string } | number): Promise<Salary[]> {
    let qs = "";
    if (typeof params === "number") {
      qs = `?year=${params}`;
    } else if (params) {
      const q = new URLSearchParams();
      if (params.year) q.set("year", String(params.year));
      if (params.month) q.set("month", String(params.month));
      if (params.employee_id) q.set("employee_id", params.employee_id);
      if (params.status) q.set("status", params.status);
      qs = q.toString() ? `?${q.toString()}` : "";
    }
    const data = await api.get<any[]>(`/salaries${qs}`);
    return data.map(normalize);
  },

  async getById(id: string): Promise<Salary> {
    const data = await api.get<any>(`/salaries/${id}`);
    return normalize(data);
  },

  async add(salary: Partial<Salary>): Promise<Salary> {
    const result = await api.post<any>("/salaries", salary);
    notifyFinancialChange();
    return normalize(result);
  },

  async update(id: string, updates: Partial<Salary>): Promise<Salary> {
    const result = await api.patch<any>(`/salaries/${id}`, updates);
    notifyFinancialChange();
    return normalize(result);
  },

  async approve(id: string): Promise<{ message: string; salary: Salary }> {
    const result = await api.patch<any>(`/salaries/${id}/approve`, {});
    notifyFinancialChange();
    return { message: result.message, salary: normalize(result.salary) };
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
  ): Promise<{ message?: string; salary?: Salary }> {
    const result = await api.post<any>(`/salaries/${id}/pay`, payment);
    notifyFinancialChange();
    return {
      message: result.message,
      salary: result.salary ? normalize(result.salary) : normalize(result),
    };
  },

  async adjust(id: string, adjustment: { amount: number; reason: string }): Promise<{ message: string; salary: Salary }> {
    const result = await api.post<any>(`/salaries/${id}/adjust`, adjustment);
    notifyFinancialChange();
    return { message: result.message, salary: normalize(result.salary) };
  },

  async cancel(id: string, reason: string): Promise<{ message: string; salary: Salary }> {
    const result = await api.post<any>(`/salaries/${id}/cancel`, { reason });
    notifyFinancialChange();
    return { message: result.message, salary: normalize(result.salary) };
  },

  async getReceipt(id: string): Promise<any> {
    return api.get<any>(`/salaries/receipt/${id}`);
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
