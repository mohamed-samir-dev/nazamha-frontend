import { api } from "@/lib/apiClient";
import { Student } from "@/lib/types";
import { appCache } from "@/lib/appCache";

const STUDENTS_KEY = "students:me";
const STUDENTS_FIELDS_KEY = (fields: string) => `students:me:${fields}`;

export interface StudentsPage {
  students: Student[];
  total: number;
  page: number;
  limit: number;
}

export const StudentsRepository = {
  async getStudentByQR(raw: string): Promise<Student> {
    return api.get<Student>(`/students/scan?qr=${encodeURIComponent(raw)}`);
  },
  async getStudentsByTeacherId(fields?: string): Promise<Student[]> {
    const cacheKey = fields ? STUDENTS_FIELDS_KEY(fields) : STUDENTS_KEY;
    const cached = appCache.get<Student[]>(cacheKey);
    if (cached) return cached;
    const url = fields ? `/students?fields=${fields}` : "/students";
    const data = await api.get<Student[]>(url);
    appCache.set(cacheKey, data, 2 * 60 * 1000); // 2 دقيقة
    return data;
  },

  async getStudentsPaginated(params: {
    page: number;
    limit?: number;
    search?: string;
    group_id?: string;
    grade_id?: string;
    sub_teacher_id?: string;
  }): Promise<StudentsPage> {
    const q = new URLSearchParams();
    q.set("page", String(params.page));
    q.set("limit", String(params.limit ?? 50));
    if (params.search) q.set("search", params.search);
    if (params.group_id && params.group_id !== "all") q.set("group_id", params.group_id);
    if (params.grade_id && params.grade_id !== "all") q.set("grade_id", params.grade_id);
    if (params.sub_teacher_id) q.set("sub_teacher_id", params.sub_teacher_id);
    return api.get<StudentsPage>(`/students?${q.toString()}`);
  },

  async getStudentById(id: string): Promise<Student | null> {
    return api.get<Student>(`/students/${id}`).catch(() => null);
  },

  async getAllStudents(): Promise<Student[]> {
    return api.get<Student[]>("/students");
  },

  async addStudent(student: Omit<Student, "id" | "created_at">): Promise<Student> {
    const result = await api.post<Student>("/students", student);
    appCache.invalidatePrefix("students:me");
    return result;
  },

  async bulkAddStudents(students: {
    name: string;
    grade_id?: string | null;
    group_id?: string | null;
    parent_phone?: string;
    custom_monthly_price?: number | null;
    subscription_start_month?: number;
    subscription_start_year?: number;
  }[], idempotencyKey?: string): Promise<{ inserted: number; students: Student[] }> {
    const result = await api.post<{ inserted: number; students: Student[] }>("/students/bulk", { students }, idempotencyKey);
    appCache.invalidatePrefix("students:me");
    return result;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const result = await api.patch<Student>(`/students/${id}`, updates);
    appCache.invalidatePrefix("students:me");
    return result;
  },

  async deleteStudent(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
    appCache.invalidatePrefix("students:me");
  },

  async deleteStudents(ids: string[]): Promise<void> {
    await api.post("/students/bulk-delete", { ids });
    appCache.invalidatePrefix("students:me");
  },

  async createFamily(familyName?: string, parentPhone?: string): Promise<{ familyId: string; familyName: string; parentPhone: string | null }> {
    return api.post("/students/create-family", { familyName, parentPhone });
  },

  async getSiblings(): Promise<{ familyId: string; members: Student[] }[]> {
    return api.get("/students/siblings");
  },

  async lookupFamily(phone: string, studentName?: string): Promise<{ family: { familyId: string | null; members: Student[]; matchReason?: string } | null }> {
    const params = new URLSearchParams({ phone });
    if (studentName) params.append("studentName", studentName);
    return api.get(`/students/lookup-family?${params.toString()}`);
  },

  async getPotentialSiblings(): Promise<{ key: string; reason: string; members: Student[] }[]> {
    return api.get("/students/potential-siblings");
  },

  async linkSiblings(studentIds: string[], familyName?: string): Promise<{ message: string; familyId: string; familyName: string }> {
    return api.post("/students/link-siblings", { studentIds, familyName });
  },

  async renameFamily(familyId: string, familyName: string): Promise<void> {
    await api.post("/students/rename-family", { familyId, familyName });
  },

  async unlinkSibling(studentId: string): Promise<void> {
    await api.post("/students/unlink-sibling", { studentId });
  },

  async transferFamily(studentId: string, targetFamilyId: string): Promise<{ familyId: string; familyName: string }> {
    return api.post("/students/transfer-family", { studentId, targetFamilyId });
  },

  async setFamilyDiscount(familyId: string, percent: number | null, reason?: string, bookPercent?: number | null, bookReason?: string): Promise<void> {
    await api.post("/students/family-discount", { familyId, percent, reason, bookPercent, bookReason });
  },

  async deleteFamily(familyId: string): Promise<void> {
    await api.delete(`/students/family/${familyId}`);
  },

  async suspendStudent(id: string, suspended_until?: string, suspension_reason?: string): Promise<Student> {
    const result = await api.post<Student>(`/students/${id}/suspend`, { suspended_until, suspension_reason });
    appCache.invalidatePrefix("students:me");
    return result;
  },

  async unsuspendStudent(id: string): Promise<Student> {
    const result = await api.post<Student>(`/students/${id}/unsuspend`, {});
    appCache.invalidatePrefix("students:me");
    return result;
  },

  async checkSuspension(id: string): Promise<{ is_suspended: boolean; suspended_until: string | null; suspension_reason: string | null }> {
    return api.get(`/students/${id}/suspension`);
  },
};
