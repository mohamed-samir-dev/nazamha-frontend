import { TeacherExpensesRepository } from "@/lib/repositories/teacherExpensesRepository";
import { TeacherExpense } from "@/lib/types";

export const TeacherExpensesService = {
  getAll: (params?: {
    year?: number;
    month?: number;
    expense_type?: string;
    category?: string;
    payment_status?: string;
  }) => TeacherExpensesRepository.getAll(params),

  getCategories: () => TeacherExpensesRepository.getCategories(),

  getStatistics: (year?: number) => TeacherExpensesRepository.getStatistics(year),

  add: (expense: Partial<TeacherExpense>) => TeacherExpensesRepository.add(expense),

  update: (id: string, updates: Partial<TeacherExpense>) =>
    TeacherExpensesRepository.update(id, updates),

  recordPayment: (
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
  ) => TeacherExpensesRepository.recordPayment(id, payment),

  cancel: (id: string, reason: string) => TeacherExpensesRepository.cancel(id, reason),
  cancelExpense: (id: string, reason: string) => TeacherExpensesRepository.cancel(id, reason),

  remove: (id: string) => TeacherExpensesRepository.remove(id),
  confirmPayment: (id: string, month: number, year: number) =>
    TeacherExpensesRepository.confirmPayment(id, month, year),
};
