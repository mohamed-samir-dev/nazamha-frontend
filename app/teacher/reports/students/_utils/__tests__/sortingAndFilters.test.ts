import { Student } from "@/lib/types";

describe("Student reports global sorting and pagination logic", () => {
  const students: Student[] = Array.from({ length: 25 }, (_, i) => ({
    id: `s${i + 1}`,
    name: `طالب ${i + 1}`,
    group_id: "g1",
  }));

  const attendanceMock: Record<string, { present: number; absent: number; total: number }> = {};
  students.forEach((s, i) => {
    // i=0 has 0%, i=24 has 100%
    attendanceMock[s.id] = { present: i, absent: 24 - i, total: 24 };
  });

  const getAttendance = (id: string) => attendanceMock[id];

  it("sorts globally across all pages so page 1 gets top attendance students on desc sort", () => {
    const sortKey = "attendancePct";
    const sortDir = "desc" as string;
    const sorted = [...students].sort((a, b) => {
      const attA = getAttendance(a.id);
      const attB = getAttendance(b.id);
      const pctA = attA.total > 0 ? attA.present / attA.total : 0;
      const pctB = attB.total > 0 ? attB.present / attB.total : 0;
      return sortDir === "asc" ? pctA - pctB : pctB - pctA;
    });

    const PAGE_SIZE = 10;
    const page1 = sorted.slice(0, PAGE_SIZE);

    // In descending sort, top student (s25 with 100%) MUST be first on page 1
    expect(page1[0].id).toBe("s25");
    expect(page1[1].id).toBe("s24");
    expect(page1.length).toBe(10);
  });

  it("filters correctly by payment status", () => {
    const isStudentPaid = (id: string) => id === "s1" || id === "s2";
    const subsMap = new Map([
      ["s1", { paid: true, status: "paid" }],
      ["s2", { paid: true, status: "paid" }],
      ["s3", { paid: false, status: "due" }],
    ]);

    const testStudents: Student[] = [
      { id: "s1", name: "طالب 1", group_id: "g1" },
      { id: "s2", name: "طالب 2", group_id: "g1" },
      { id: "s3", name: "طالب 3", group_id: "g1" },
    ];

    const paidList = testStudents.filter((s) => isStudentPaid(s.id));
    expect(paidList.map(s => s.id)).toEqual(["s1", "s2"]);

    const unpaidList = testStudents.filter((s) => {
      const sub = subsMap.get(s.id);
      return !sub || sub.status === "due";
    });
    expect(unpaidList.map(s => s.id)).toEqual(["s3"]);
  });
});
