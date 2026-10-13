import { api } from "@/lib/apiClient";
import { Bill } from "@/lib/types";
import { notifyFinancialChange } from "@/lib/financialEvents";

export const BillsRepository = {
  async getBillsByTeacherId(_teacherId: string, year?: number): Promise<Bill[]> {
    return api.get<Bill[]>(year ? `/bills?year=${year}` : "/bills");
  },

  async addBill(bill: Omit<Bill, "id" | "created_at">): Promise<Bill> {
    const result = await api.post<Bill>("/bills", bill);
    notifyFinancialChange();
    return result;
  },

  async addBills(bills: Omit<Bill, "id" | "created_at">[]): Promise<Bill[]> {
    const result = await api.post<Bill[]>("/bills/bulk", { bills });
    notifyFinancialChange();
    return result;
  },

  async deleteBill(id: string): Promise<void> {
    await api.delete(`/bills/${id}`);
    notifyFinancialChange();
  },

  async deleteBills(ids: string[]): Promise<void> {
    await api.post("/bills/bulk-delete", { ids });
    notifyFinancialChange();
  },

  async updateBill(id: string, updates: Partial<Omit<Bill, "id" | "created_at" | "teacher_id">>): Promise<Bill> {
    const result = await api.patch<Bill>(`/bills/${id}`, updates);
    notifyFinancialChange();
    return result;
  },

  async deleteRecurringBillsForMonth(monthNum: number, yearNum: number, _teacherId: string): Promise<void> {
    await api.delete(`/bills/recurring/${monthNum}?year=${yearNum}`);
    notifyFinancialChange();
  },
};
