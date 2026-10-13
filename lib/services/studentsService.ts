import { StudentsRepository, StudentsPage } from "@/lib/repositories/studentsRepository";
import { Student } from "@/lib/types";

export const StudentsService = {
  async getStudentByQR(raw: string): Promise<Student> {
    return StudentsRepository.getStudentByQR(raw);
  },
  async getStudentsByTeacherId(fields?: string): Promise<Student[]> {
    return StudentsRepository.getStudentsByTeacherId(fields);
  },

  async getStudentsPaginated(params: Parameters<typeof StudentsRepository.getStudentsPaginated>[0]): Promise<StudentsPage> {
    return StudentsRepository.getStudentsPaginated(params);
  },

  async getStudentById(id: string): Promise<Student | null> {
    return StudentsRepository.getStudentById(id);
  },

  async getAllStudents(): Promise<Student[]> {
    return StudentsRepository.getAllStudents();
  },

  async addStudentWithGeneratedCode(studentData: Omit<Student, "id" | "created_at" | "code">): Promise<Student> {
    return StudentsRepository.addStudent(studentData);
  },

  async bulkAddStudents(students: Parameters<typeof StudentsRepository.bulkAddStudents>[0]): Promise<{ inserted: number; students: Student[] }> {
    return StudentsRepository.bulkAddStudents(students);
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    return StudentsRepository.updateStudent(id, updates);
  },

  async deleteStudent(id: string): Promise<void> {
    return StudentsRepository.deleteStudent(id);
  },

  async deleteStudents(ids: string[]): Promise<void> {
    return StudentsRepository.deleteStudents(ids);
  },

  async createFamily(familyName?: string, parentPhone?: string): Promise<{ familyId: string; familyName: string; parentPhone: string | null }> {
    return StudentsRepository.createFamily(familyName, parentPhone);
  },

  async getSiblings(): Promise<{ familyId: string; members: Student[] }[]> {
    return StudentsRepository.getSiblings();
  },

  async lookupFamily(phone: string, studentName?: string): Promise<{ family: { familyId: string | null; members: Student[]; matchReason?: string } | null }> {
    return StudentsRepository.lookupFamily(phone, studentName);
  },

  async getPotentialSiblings(): Promise<{ key: string; reason: string; members: Student[] }[]> {
    return StudentsRepository.getPotentialSiblings();
  },

  async linkSiblings(studentIds: string[], familyName?: string): Promise<{ message: string; familyId: string; familyName: string }> {
    return StudentsRepository.linkSiblings(studentIds, familyName);
  },

  async renameFamily(familyId: string, familyName: string): Promise<void> {
    return StudentsRepository.renameFamily(familyId, familyName);
  },

  async unlinkSibling(studentId: string): Promise<void> {
    return StudentsRepository.unlinkSibling(studentId);
  },

  async transferFamily(studentId: string, targetFamilyId: string): Promise<{ familyId: string; familyName: string }> {
    return StudentsRepository.transferFamily(studentId, targetFamilyId);
  },

  async setFamilyDiscount(familyId: string, percent: number | null, reason?: string, bookPercent?: number | null, bookReason?: string): Promise<void> {
    return StudentsRepository.setFamilyDiscount(familyId, percent, reason, bookPercent, bookReason);
  },

  async deleteFamily(familyId: string): Promise<void> {
    return StudentsRepository.deleteFamily(familyId);
  },

  async suspendStudent(id: string, suspended_until?: string, suspension_reason?: string): Promise<Student> {
    return StudentsRepository.suspendStudent(id, suspended_until, suspension_reason);
  },

  async unsuspendStudent(id: string): Promise<Student> {
    return StudentsRepository.unsuspendStudent(id);
  },

  async checkSuspension(id: string): Promise<{ is_suspended: boolean; suspended_until: string | null; suspension_reason: string | null }> {
    return StudentsRepository.checkSuspension(id);
  },
};
