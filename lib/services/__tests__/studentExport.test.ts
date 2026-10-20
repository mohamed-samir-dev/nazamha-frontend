jest.mock("@/lib/repositories/studentsRepository", () => ({ StudentsRepository: { getStudentsPaginated: jest.fn() } }));
import { StudentsRepository } from "@/lib/repositories/studentsRepository";
import { StudentsService } from "../studentsService";
test("export continues past the old 5000-student ceiling and preserves filters", async () => {
  const get = jest.mocked(StudentsRepository.getStudentsPaginated);
  get.mockImplementation(async params => ({ students: Array.from({ length: params.page === 11 ? 1 : 500 }, (_, i) => ({ id: `${(params.page - 1) * 500 + i}` })) as any, total: 5001, page: params.page, limit: 500 }));
  expect((await StudentsService.getAllMatchingStudents({ grade_id: "grade", search: "name" })).length).toBe(5001);
  expect(get).toHaveBeenLastCalledWith({ page: 11, limit: 500, grade_id: "grade", search: "name" });
});
test("a failed export page rejects instead of returning a partial report", async () => {
  jest.mocked(StudentsRepository.getStudentsPaginated).mockRejectedValueOnce(new Error("offline"));
  await expect(StudentsService.getAllMatchingStudents()).rejects.toThrow("offline");
});
