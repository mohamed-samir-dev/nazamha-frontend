import {
  formatPhone,
  buildMessage,
  buildSubsMap,
  buildAttendanceMap,
  calcStats,
  filterStudents,
  DEFAULT_TEMPLATE,
} from "../reportHelpers";
import { Student, MonthlySubscription, AttendanceRecord } from "@/lib/types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeStudent = (overrides: Partial<Student> = {}): Student => ({
  id: "s1",
  name: "أحمد محمد",
  group_id: "g1",
  grade_id: "gr1",
  parent_phone: "01012345678",
  code: "A-0001",
  ...overrides,
});

const makeSub = (overrides: Partial<MonthlySubscription> = {}): MonthlySubscription => ({
  id: "sub1",
  student_id: "s1",
  teacher_id: "t1",
  month: 1,
  year: 2025,
  status: "paid",
  amount: 300,
  discount: 0,
  ...overrides,
});

const makeAttendance = (overrides: Partial<AttendanceRecord> = {}): AttendanceRecord => ({
  id: "a1",
  student_id: "s1",
  session_date: "2025-01-05",
  month: 1,
  year: 2025,
  status: "present",
  ...overrides,
});

// ─── formatPhone ─────────────────────────────────────────────────────────────

describe("formatPhone", () => {
  test("يحول رقم يبدأ بـ 0 لصيغة دولية مصرية", () => {
    expect(formatPhone("01012345678")).toBe("201012345678");
  });

  test("يضيف 20 لرقم لا يبدأ بـ 2", () => {
    expect(formatPhone("1012345678")).toBe("201012345678");
  });

  test("لا يغير رقم يبدأ بـ 20 بالفعل", () => {
    expect(formatPhone("201012345678")).toBe("201012345678");
  });

  test("يحذف الأحرف غير الرقمية", () => {
    expect(formatPhone("+20 101-234-5678")).toBe("201012345678");
  });

  test("لا يغير رقم يبدأ بـ 20 بالفعل (10 أرقام)", () => {
    expect(formatPhone("2012345678")).toBe("2012345678");
  });
});

// ─── buildMessage ─────────────────────────────────────────────────────────────

describe("buildMessage", () => {
  const student = makeStudent();
  const att = { present: 8, absent: 2 };

  test("يستبدل كل المتغيرات في القالب — مدفوع", () => {
    const msg = buildMessage(student, DEFAULT_TEMPLATE, att, true);
    expect(msg).toContain("أحمد محمد");
    expect(msg).toContain("8");
    expect(msg).toContain("2");
    expect(msg).toContain("تم الدفع ✅");
  });

  test("يستبدل حالة الدفع — غير مدفوع", () => {
    const msg = buildMessage(student, DEFAULT_TEMPLATE, att, false);
    expect(msg).toContain("لم يتم الدفع بعد ❌");
  });

  test("يستبدل جميع تكرارات المتغير", () => {
    const template = "[اسم_الطالب] — [اسم_الطالب]";
    const msg = buildMessage(student, template, att, true);
    expect(msg).toBe("أحمد محمد — أحمد محمد");
  });

  test("يتعامل مع حضور وغياب صفر", () => {
    const msg = buildMessage(student, DEFAULT_TEMPLATE, { present: 0, absent: 0 }, false);
    expect(msg).toContain("أيام الحضور: 0");
    expect(msg).toContain("أيام الغياب: 0");
  });
});

// ─── buildSubsMap ─────────────────────────────────────────────────────────────

describe("buildSubsMap", () => {
  test("يبني الـ map بشكل صحيح للشهر والسنة المحددين", () => {
    const subs = [
      makeSub({ student_id: "s1", month: 1, year: 2025, status: "paid" }),
      makeSub({ id: "sub2", student_id: "s2", month: 1, year: 2025, status: "due" }),
      makeSub({ id: "sub3", student_id: "s3", month: 2, year: 2025, status: "paid" }), // شهر تاني
    ];
    const map = buildSubsMap(subs, 1, 2025);
    expect(map.size).toBe(2);
    expect(map.get("s1")).toEqual({ paid: true, status: "paid" });
    expect(map.get("s2")).toEqual({ paid: false, status: "due" });
    expect(map.has("s3")).toBe(false); // شهر 2 مش في الـ map
  });

  test("يعتبر exempt كـ paid", () => {
    const subs = [makeSub({ status: "exempt" })];
    const map = buildSubsMap(subs, 1, 2025);
    expect(map.get("s1")?.paid).toBe(true);
  });

  test("يرجع map فاضية لو مفيش اشتراكات للشهر ده", () => {
    const subs = [makeSub({ month: 3, year: 2025 })];
    const map = buildSubsMap(subs, 1, 2025);
    expect(map.size).toBe(0);
  });

  test("يرجع map فاضية لو مفيش اشتراكات خالص", () => {
    const map = buildSubsMap([], 1, 2025);
    expect(map.size).toBe(0);
  });
});

// ─── buildAttendanceMap ───────────────────────────────────────────────────────

describe("buildAttendanceMap", () => {
  test("يحسب الحضور والغياب بشكل صحيح", () => {
    const records = [
      makeAttendance({ status: "present" }),
      makeAttendance({ id: "a2", session_date: "2025-01-12", status: "present" }),
      makeAttendance({ id: "a3", session_date: "2025-01-19", status: "absent" }),
    ];
    const map = buildAttendanceMap(records);
    expect(map.get("s1")).toEqual({ present: 2, absent: 1 });
  });

  test("يتعامل مع طلاب متعددين", () => {
    const records = [
      makeAttendance({ student_id: "s1", status: "present" }),
      makeAttendance({ id: "a2", student_id: "s2", status: "absent" }),
    ];
    const map = buildAttendanceMap(records);
    expect(map.get("s1")).toEqual({ present: 1, absent: 0 });
    expect(map.get("s2")).toEqual({ present: 0, absent: 1 });
  });

  test("يرجع map فاضية لو مفيش سجلات", () => {
    const map = buildAttendanceMap([]);
    expect(map.size).toBe(0);
  });
});

// ─── calcStats ────────────────────────────────────────────────────────────────

describe("calcStats", () => {
  test("يحسب الإحصائيات بشكل صحيح", () => {
    const students = [
      makeStudent({ id: "s1", parent_phone: "01012345678" }),
      makeStudent({ id: "s2", parent_phone: "01098765432" }),
      makeStudent({ id: "s3", parent_phone: undefined }),
    ];
    const subsMap = new Map([
      ["s1", { paid: true, status: "paid" }],
      ["s2", { paid: false, status: "due" }],
    ]);
    const stats = calcStats(students, subsMap);
    expect(stats.total).toBe(3);
    expect(stats.paid).toBe(1);
    expect(stats.unpaid).toBe(1);
    expect(stats.withPhone).toBe(2);
  });

  test("يتجاهل الطلاب اللي status بتاعهم not_due في حساب unpaid", () => {
    const students = [makeStudent({ id: "s1" }), makeStudent({ id: "s2" })];
    const subsMap = new Map([
      ["s1", { paid: false, status: "not_due" }],
      ["s2", { paid: false, status: "due" }],
    ]);
    const stats = calcStats(students, subsMap);
    expect(stats.unpaid).toBe(1); // s1 مش محسوب
  });

  test("يرجع أصفار لو مفيش طلاب", () => {
    const stats = calcStats([], new Map());
    expect(stats).toEqual({ total: 0, paid: 0, unpaid: 0, withPhone: 0 });
  });
});

// ─── filterStudents ───────────────────────────────────────────────────────────

describe("filterStudents", () => {
  const students = [
    makeStudent({ id: "s1", name: "أحمد محمد", grade_id: "gr1", group_id: "g1", code: "A-0001" }),
    makeStudent({ id: "s2", name: "سارة علي", grade_id: "gr2", group_id: "g2", code: "B-0001" }),
    makeStudent({ id: "s3", name: "محمود حسن", grade_id: "gr1", group_id: "g1", code: "A-0002" }),
  ];
  const subsMap = new Map([
    ["s1", { paid: true, status: "paid" }],
    ["s2", { paid: false, status: "due" }],
    ["s3", { paid: false, status: "not_due" }],
  ]);
  const baseOpts = { filterGradeId: "all", filterGroupId: "all", filterPayment: "all" as const, searchQuery: "", subsMap };

  test("يرجع كل الطلاب لو مفيش فلتر", () => {
    expect(filterStudents(students, baseOpts)).toHaveLength(3);
  });

  test("يفلتر بالسنة الدراسية", () => {
    const result = filterStudents(students, { ...baseOpts, filterGradeId: "gr1" });
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.grade_id === "gr1")).toBe(true);
  });

  test("يفلتر بالمجموعة", () => {
    const result = filterStudents(students, { ...baseOpts, filterGroupId: "g2" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s2");
  });

  test("يفلتر الطلاب المدفوعين فقط", () => {
    const result = filterStudents(students, { ...baseOpts, filterPayment: "paid" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s1");
  });

  test("يفلتر الطلاب غير المدفوعين (due فقط، مش not_due)", () => {
    const result = filterStudents(students, { ...baseOpts, filterPayment: "unpaid" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s2");
  });

  test("يبحث بالاسم", () => {
    const result = filterStudents(students, { ...baseOpts, searchQuery: "سارة" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s2");
  });

  test("يبحث بالكود", () => {
    const result = filterStudents(students, { ...baseOpts, searchQuery: "A-0002" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s3");
  });

  test("البحث case-insensitive", () => {
    const result = filterStudents(students, { ...baseOpts, searchQuery: "a-0001" });
    expect(result).toHaveLength(1);
  });

  test("يجمع أكتر من فلتر مع بعض", () => {
    const result = filterStudents(students, { ...baseOpts, filterGradeId: "gr1", filterPayment: "paid" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s1");
  });
});
