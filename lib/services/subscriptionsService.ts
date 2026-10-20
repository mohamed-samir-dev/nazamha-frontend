import { api as apiClient } from "@/lib/apiClient";
import { MonthlySubscription, SubscriptionStatus, Student } from "@/lib/types";
import { notifyFinancialChange } from "@/lib/financialEvents";
import { appCache } from "@/lib/appCache";

const SUBS_ALL_KEY = "subscriptions:all";
const SUBS_SUMMARY_KEY = "subscriptions:summary";

export interface SubscriptionSummaryEntry {
  studentId: string;
  overdueCount: number;
  paidEntries: { month: number; year: number }[];
  dueEntries: { month: number; year: number }[];
}

export interface PaymentReceipt { id: string; name: string; code: string; amount: number; months: { month: number; year: number }[]; created_at: string }
export const SubscriptionsService = {
  async lookupPaymentStudent(code: string): Promise<{ student: Student; subscriptions: MonthlySubscription[] }> { return apiClient.get(`/subscriptions/lookup?qr=${encodeURIComponent(code)}`); },
  async pay(studentId: string, items: { id: string; amount: number; discount: number }[], key: string, autoPeriod?: {month: number; year: number}): Promise<{ receipt: PaymentReceipt; student: Student; subscriptions: MonthlySubscription[] }> {
    const result = await apiClient.post<{ receipt: PaymentReceipt; student: Student; subscriptions: MonthlySubscription[] }>(`/subscriptions/student/${studentId}/pay`, { items, ...(autoPeriod ? {autoPeriod} : {}) }, key);
    appCache.invalidate(SUBS_ALL_KEY); appCache.invalidate(SUBS_SUMMARY_KEY); notifyFinancialChange();
    return result;
  },
  async recentPayments(): Promise<PaymentReceipt[]> { return apiClient.get("/subscriptions/payments/recent"); },
  async getStudentSubscriptions(studentId: string): Promise<MonthlySubscription[]> {
    return apiClient.get(`/subscriptions/student/${studentId}`);
  },

  async getBatchSubscriptions(studentIds: string[], allPeriods = false): Promise<Record<string, MonthlySubscription[]>> {
    if (studentIds.length === 0) return {};
    return apiClient.get(`/subscriptions/batch?studentIds=${studentIds.join(",")}${allPeriods ? "&allPeriods=1" : ""}`);
  },

  async getAllTeacherSubscriptions(year?: number): Promise<MonthlySubscription[]> {
    if(year) return apiClient.get<MonthlySubscription[]>(`/subscriptions?year=${year}`);
    const cached = appCache.get<MonthlySubscription[]>(SUBS_ALL_KEY);
    if (cached) return cached;
    const data = await apiClient.get<MonthlySubscription[]>(`/subscriptions`);
    appCache.set(SUBS_ALL_KEY, data, 2 * 60 * 1000); // 2 دقيقة
    return data;
  },

  async updateSubscription(id: string, updates: Partial<MonthlySubscription>): Promise<MonthlySubscription> {
    const result = await apiClient.patch<MonthlySubscription>(`/subscriptions/${id}`, updates);
    appCache.invalidate(SUBS_ALL_KEY);
    appCache.invalidate(SUBS_SUMMARY_KEY);
    notifyFinancialChange();
    return result;
  },

  async bulkUpdateSubscriptions(studentId: string, updates: { id: string; status: SubscriptionStatus }[]): Promise<MonthlySubscription[]> {
    const result = await apiClient.post<MonthlySubscription[]>(`/subscriptions/student/${studentId}/bulk-update`, { updates });
    appCache.invalidate(SUBS_ALL_KEY);
    appCache.invalidate(SUBS_SUMMARY_KEY);
    notifyFinancialChange();
    return result;
  },

  async regenerateSubscriptions(studentId: string): Promise<MonthlySubscription[]> {
    return apiClient.post(`/subscriptions/student/${studentId}/regenerate`, {});
  },

  async fixAmounts(): Promise<{ fixed: number }> {
    return apiClient.post(`/subscriptions/fix-amounts`, {});
  },

  async syncAllStudents(): Promise<{ synced: number }> {
    return apiClient.post(`/subscriptions/sync-all`, {});
  },

  async autoSuspend(months = 3): Promise<{ suspended: number; students: { id: string; name: string }[] }> {
    return apiClient.post(`/subscriptions/auto-suspend?months=${months}`, {});
  },

  async fixRolloverData(): Promise<{ fixed: number; removedYears: number[]; deletedSubscriptions: number }> {
    return apiClient.post(`/subscriptions/fix-rollover`, {});
  },

  async getSubscriptionsSummary(): Promise<SubscriptionSummaryEntry[]> {
    const cached = appCache.get<SubscriptionSummaryEntry[]>(SUBS_SUMMARY_KEY);
    if (cached) return cached;
    const data = await apiClient.get<SubscriptionSummaryEntry[]>("/subscriptions/summary");
    appCache.set(SUBS_SUMMARY_KEY, data, 2 * 60 * 1000);
    return data;
  },
};
