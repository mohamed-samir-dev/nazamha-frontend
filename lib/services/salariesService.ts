import { SalariesRepository } from "@/lib/repositories/salariesRepository";
import { Salary } from "@/lib/types";

export const SalariesService = {
  getAll: (params?: { year?: number; month?: number; employee_id?: string; status?: string } | number) =>
    SalariesRepository.getAll(params),
  getById: (id: string) => SalariesRepository.getById(id),
  add: (s: Partial<Salary>) => SalariesRepository.add(s),
  update: (id: string, s: Partial<Salary>) => SalariesRepository.update(id, s),
  approve: (id: string) => SalariesRepository.approve(id),
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
  ) => SalariesRepository.recordPayment(id, payment),
  adjust: (id: string, adjustment: { amount: number; reason: string }) =>
    SalariesRepository.adjust(id, adjustment),
  cancel: (id: string, reason: string) => SalariesRepository.cancel(id, reason),
  adjustSalary: (id: string, adjustment: { amount: number; reason: string }) => SalariesRepository.adjust(id, adjustment),
  approveSalary: (id: string) => SalariesRepository.approve(id),
  cancelSalary: (id: string, reason: string) => SalariesRepository.cancel(id, reason),
  getReceipt: (id: string) => SalariesRepository.getReceipt(id),
  remove: (id: string) => SalariesRepository.remove(id),
  confirmPayment: (id: string, month: number, year: number) =>
    SalariesRepository.confirmPayment(id, month, year),
};
