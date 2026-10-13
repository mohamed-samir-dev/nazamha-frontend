import { BillsRepository } from "@/lib/repositories/billsRepository";
import { Bill } from "@/lib/types";
import { appCache } from "@/lib/appCache";

const BILLS_CACHE_KEY = "bills:all";
const BILLS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export const BillsService = {
  /**
   * Fetch all bills for the authenticated teacher.
   * Results are cached for 3 minutes and shared across all consumers
   * (useBills + useFinancialReports) to prevent duplicate /api/bills requests.
   *
   * Cache is invalidated after any mutation (add, update, delete, generate recurring).
   */
  async getBillsByTeacherId(_teacherId: string, year?: number): Promise<Bill[]> {
    if(year) return BillsRepository.getBillsByTeacherId(_teacherId, year);
    const cached = appCache.get<Bill[]>(BILLS_CACHE_KEY);
    if (cached) return cached;
    const data = await BillsRepository.getBillsByTeacherId(_teacherId);
    appCache.set(BILLS_CACHE_KEY, data, BILLS_CACHE_TTL);
    return data;
  },

  /** Invalidate the bills cache — call after any mutation */
  invalidateCache(): void {
    appCache.invalidate(BILLS_CACHE_KEY);
  },

  async addBill(bill: Omit<Bill, "id" | "created_at">): Promise<Bill> {
    const result = await BillsRepository.addBill(bill);
    appCache.invalidate(BILLS_CACHE_KEY);
    return result;
  },

  async deleteBill(id: string): Promise<void> {
    await BillsRepository.deleteBill(id);
    appCache.invalidate(BILLS_CACHE_KEY);
  },

  async deleteBills(ids: string[]): Promise<void> {
    await BillsRepository.deleteBills(ids);
    appCache.invalidate(BILLS_CACHE_KEY);
  },

  async updateBill(id: string, updates: Partial<Omit<Bill, "id" | "created_at" | "teacher_id">>): Promise<Bill> {
    const result = await BillsRepository.updateBill(id, updates);
    appCache.invalidate(BILLS_CACHE_KEY);
    return result;
  },

  async generateRecurringBillsForMonth(targetMonth: number, targetYear: number, teacherId: string, currentBills: Bill[]): Promise<Bill[]> {
    const allRecurring = currentBills.filter(b => b.is_recurring);
    if (allRecurring.length === 0) {
      throw new Error("لا توجد فواتير متكررة مسجلة بعد!");
    }

    const uniqueTemplatesMap = new Map<string, Bill>();
    for (const b of allRecurring) {
      const key = `${b.title}|${b.category}|${b.amount}`;
      if (!uniqueTemplatesMap.has(key)) uniqueTemplatesMap.set(key, b);
    }
    const uniqueTemplates = Array.from(uniqueTemplatesMap.values());

    const toInsert = uniqueTemplates.filter(template =>
      !currentBills.some(
        b =>
          b.is_recurring &&
          b.billing_month === targetMonth &&
          b.billing_year === targetYear &&
          b.title === template.title &&
          b.category === template.category &&
          Number(b.amount) === Number(template.amount)
      )
    );

    if (toInsert.length === 0) {
      throw new Error(`الفواتير المتكررة موجودة بالفعل لهذا الشهر!`);
    }

    const insertRows = toInsert.map(b => ({
      teacher_id: teacherId,
      title: b.title,
      amount: b.amount,
      category: b.category,
      billing_month: targetMonth,
      billing_year: targetYear,
      is_recurring: true,
    }));

    const result = await BillsRepository.addBills(insertRows);
    appCache.invalidate(BILLS_CACHE_KEY);
    return result;
  },

  async deleteRecurringBillsForMonth(monthNum: number, yearNum: number, teacherId: string): Promise<void> {
    await BillsRepository.deleteRecurringBillsForMonth(monthNum, yearNum, teacherId);
    appCache.invalidate(BILLS_CACHE_KEY);
  },
};
