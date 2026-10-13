import { SalariesRepository } from "@/lib/repositories/salariesRepository";
import { Salary } from "@/lib/types";

export const SalariesService = {
  getAll: (year?: number) => SalariesRepository.getAll(year),
  add: (s: Omit<Salary, "id" | "created_at" | "teacher_id">) => SalariesRepository.add(s),
  update: (id: string, s: Partial<Omit<Salary, "id" | "created_at" | "teacher_id">>) => SalariesRepository.update(id, s),
  remove: (id: string) => SalariesRepository.remove(id),
  confirmPayment: (id: string, month: number, year: number) => SalariesRepository.confirmPayment(id, month, year),
};
