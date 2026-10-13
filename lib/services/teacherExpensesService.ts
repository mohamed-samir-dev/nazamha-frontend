import { TeacherExpensesRepository } from "@/lib/repositories/teacherExpensesRepository";
import { TeacherExpense, ExpenseStatistics } from "@/lib/types";

export const TeacherExpensesService = {
  getAll: (params?: {
    year?: number;
    month?: number;
    expense_type?: string;
    payment_status?: string;
  }) => TeacherExpensesRepository.getAll(params),

  getStatistics: (year?: number) => TeacherExpensesRepository.getStatistics(year),

  add: (expense: Omit<TeacherExpense, "id" | "created_at" | "updated_at" | "teacher_id" | "_virtual">) => 
    TeacherExpensesRepository.add(expense),

  update: (
    id: string, 
    updates: Partial<Omit<TeacherExpense, "id" | "created_at" | "updated_at" | "teacher_id" | "_virtual">>
  ) => TeacherExpensesRepository.update(id, updates),

  remove: (id: string) => TeacherExpensesRepository.remove(id),
  confirmPayment: (id: string, month: number, year: number) => TeacherExpensesRepository.confirmPayment(id, month, year),
};
