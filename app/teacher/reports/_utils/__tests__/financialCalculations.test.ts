import {
  getCairoNow,
  netSubscriptionAmount,
  isStudentEligibleForMonth,
  resolveAcademicYears,
  calculateDateRangeBounds,
  calculateKPIs,
  calculateDailyRevenue,
  calculateMonthlySummary,
  calculateStageRevenue,
  calculateGroupRevenue,
  calculatePaymentTransactions,
  calculateOutstandingStudents,
  calculateTopGradeAnnual,
  calculateTopBook,
  type StudentRef,
} from "../financialCalculations";
import type {
  MonthlySubscription,
  BookSale,
  Bill,
  Salary,
  TeacherExpense,
  Grade,
  Group,
  Teacher,
} from "@/lib/types";
import type { FinancialFilters } from "../../_types/financialTypes";

describe("Financial Calculations & Business Rules", () => {
  const currentNow = { year: 2026, month: 10, day: 1 }; // November 1, 2026 (0-indexed month 10 = Nov)

  const mockTeacher: Partial<Teacher> = {
    id: "t1",
    name: "الأستاذ أحمد",
    settings: { timezone: "Africa/Cairo" } as any,
    academic_year: {
      active_months: [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
    },
  };

  const { options: academicYearOpts } = resolveAcademicYears(
    mockTeacher as Teacher,
    currentNow.year,
    currentNow.month
  );
  const currentAcademicOpt = academicYearOpts.find((o) => o.isCurrent)!;

  test("Timezone handling: getCairoNow resolves correctly", () => {
    const now = getCairoNow("Africa/Cairo");
    expect(now).toHaveProperty("year");
    expect(now).toHaveProperty("month");
    expect(now).toHaveProperty("day");
    expect(typeof now.year).toBe("number");
  });

  test("netSubscriptionAmount: handles exempt, discounts, and zero", () => {
    expect(netSubscriptionAmount({ status: "exempt", amount: 200, discount: 0 } as any)).toBe(0);
    expect(netSubscriptionAmount({ status: "paid", amount: 200, discount: 50 } as any)).toBe(150);
    expect(netSubscriptionAmount({ status: "due", amount: 300, discount: 100 } as any)).toBe(200);
    expect(netSubscriptionAmount({ status: "due", amount: 100, discount: 120 } as any)).toBe(0);
  });

  test("isStudentEligibleForMonth: student who joined in October is not charged for September", () => {
    const student: StudentRef = {
      id: "s1",
      name: "محمود",
      subscription_start_month: 10,
      subscription_start_year: 2026,
    };

    expect(isStudentEligibleForMonth(student, 9, 2026, 2026)).toBe(false); // Ineligible for Sept
    expect(isStudentEligibleForMonth(student, 10, 2026, 2026)).toBe(true); // Eligible for Oct
    expect(isStudentEligibleForMonth(student, 11, 2026, 2026)).toBe(true); // Eligible for Nov
    expect(isStudentEligibleForMonth(student, 1, 2027, 2026)).toBe(true); // Eligible for Jan
  });

  test("Academic year boundary: spans across December (2026) and January (2027)", () => {
    const months = currentAcademicOpt.activeMonths;
    const dec = months.find((m) => m.month === 12);
    const jan = months.find((m) => m.month === 1);

    expect(dec).toBeDefined();
    expect(jan).toBeDefined();
    expect(dec!.year).toBe(2026);
    expect(jan!.year).toBe(2027);
  });

  test("Inactive month generates 0 due obligations and no artificial debt", () => {
    const defaultFilters: FinancialFilters = {
      periodType: "specific_month",
      selectedAcademicYear: "2026/2027",
      selectedYear: 2026,
      selectedMonth: 7, // July is inactive (active_months starts at 8)
      customStartDate: "",
      customEndDate: "",
      selectedGradeId: "all",
      selectedGroupId: "all",
      selectedPaymentMethod: "all",
      selectedTeacherId: "all",
    };

    const bounds = calculateDateRangeBounds(defaultFilters, currentAcademicOpt, currentNow);
    const students: StudentRef[] = [
      { id: "s1", name: "طالب 1", subscription_start_month: 8, subscription_start_year: 2026 },
    ];
    const kpis = calculateKPIs({
      filters: defaultFilters,
      bounds,
      academicYearOpt: currentAcademicOpt,
      students,
      studentIdSet: new Set(["s1"]),
      allSubs: [],
      allSales: [],
      bills: [],
      salaries: [],
      teacherExpenses: [],
      currentNow,
    });

    expect(kpis.isMonthActive).toBe(false);
    expect(kpis.totalDue).toBe(0);
    expect(kpis.collectionRate).toBe(100);
  });

  test("Late payment rule: student paying in Nov for an Oct subscription counts in Nov collected revenue", () => {
    const student: StudentRef = {
      id: "s1",
      name: "أحمد",
      subscription_start_month: 8,
      subscription_start_year: 2026,
    };

    const octSub: MonthlySubscription = {
      id: "sub-oct",
      student_id: "s1",
      teacher_id: "t1",
      month: 10,
      year: 2026,
      status: "paid",
      amount: 250,
      discount: 0,
      paid_at: "2026-11-04T12:00:00.000Z", // Paid in November!
    } as any;

    const novFilters: FinancialFilters = {
      periodType: "current_month", // November 2026
      selectedAcademicYear: "2026/2027",
      selectedYear: 2026,
      selectedMonth: 11,
      customStartDate: "",
      customEndDate: "",
      selectedGradeId: "all",
      selectedGroupId: "all",
      selectedPaymentMethod: "all",
      selectedTeacherId: "all",
    };

    const bounds = calculateDateRangeBounds(novFilters, currentAcademicOpt, currentNow);
    const kpis = calculateKPIs({
      filters: novFilters,
      bounds,
      academicYearOpt: currentAcademicOpt,
      students: [student],
      studentIdSet: new Set(["s1"]),
      allSubs: [octSub],
      allSales: [],
      bills: [],
      salaries: [],
      teacherExpenses: [],
      currentNow,
    });

    // In November's collected revenue, this payment IS counted because paid_at is in November!
    expect(kpis.totalCollected).toBe(250);
    expect(kpis.subscriptionCollected).toBe(250);
  });

  test("Daily revenue analysis: every day in month is generated with zero-fill", () => {
    const points = calculateDailyRevenue({
      year: 2026,
      month: 11, // 30 days
      allSubs: [
        {
          id: "sub1",
          student_id: "s1",
          status: "paid",
          amount: 200,
          discount: 0,
          paid_at: "2026-11-05T10:00:00.000Z",
        } as any,
      ],
      allSales: [
        {
          id: "sale1",
          student_id: "s1",
          status: "active",
          final_price: 150,
          created_at: new Date("2026-11-05T14:00:00.000Z"),
        } as any,
      ],
      studentIdSet: new Set(["s1"]),
      paymentMethodFilter: "all",
    });

    expect(points.length).toBe(30);
    const day5 = points.find((p) => p.day === 5)!;
    expect(day5.subscriptions).toBe(200);
    expect(day5.books).toBe(150);
    expect(day5.total).toBe(350);

    const day6 = points.find((p) => p.day === 6)!;
    expect(day6.subscriptions).toBe(0);
    expect(day6.books).toBe(0);
    expect(day6.total).toBe(0);
  });

  test("Collection Rate: does not divide by zero and handles partials", () => {
    const filters: FinancialFilters = {
      periodType: "current_month",
      selectedAcademicYear: "2026/2027",
      selectedYear: 2026,
      selectedMonth: 11,
      customStartDate: "",
      customEndDate: "",
      selectedGradeId: "all",
      selectedGroupId: "all",
      selectedPaymentMethod: "all",
      selectedTeacherId: "all",
    };
    const bounds = calculateDateRangeBounds(filters, currentAcademicOpt, currentNow);

    const students: StudentRef[] = [
      { id: "s1", name: "علي", subscription_start_month: 8, subscription_start_year: 2026 },
      { id: "s2", name: "عمر", subscription_start_month: 8, subscription_start_year: 2026 },
    ];

    const subs: MonthlySubscription[] = [
      { id: "1", student_id: "s1", month: 11, year: 2026, status: "paid", amount: 200, discount: 0, paid_at: "2026-11-02T10:00:00.000Z" } as any,
      { id: "2", student_id: "s2", month: 11, year: 2026, status: "due", amount: 200, discount: 0 } as any,
    ];

    const kpis = calculateKPIs({
      filters,
      bounds,
      academicYearOpt: currentAcademicOpt,
      students,
      studentIdSet: new Set(["s1", "s2"]),
      allSubs: subs,
      allSales: [],
      bills: [],
      salaries: [],
      teacherExpenses: [],
      currentNow,
    });

    expect(kpis.totalDue).toBe(400);
    expect(kpis.totalCollected).toBe(200);
    expect(kpis.collectionRate).toBe(50);
  });

  test("Top Grade Annual & Best Selling Book preservation", () => {
    const grades: Grade[] = [
      { id: "g1", name: "الصف الأول الثانوي" },
      { id: "g2", name: "الصف الثالث الثانوي" },
    ];
    const students: StudentRef[] = [
      { id: "s1", name: "سالم", grade_id: "g1" },
      { id: "s2", name: "طارق", grade_id: "g2" },
      { id: "s3", name: "كريم", grade_id: "g2" },
    ];
    const subs: MonthlySubscription[] = [
      { id: "1", student_id: "s1", month: 9, year: 2026, status: "paid", amount: 100, discount: 0 } as any,
      { id: "2", student_id: "s2", month: 9, year: 2026, status: "paid", amount: 300, discount: 0 } as any,
      { id: "3", student_id: "s3", month: 9, year: 2026, status: "paid", amount: 300, discount: 0 } as any,
    ];

    const topGrade = calculateTopGradeAnnual({
      grades,
      groups: [],
      students,
      studentIdSet: new Set(["s1", "s2", "s3"]),
      allSubs: subs,
      academicYearOpt: currentAcademicOpt,
    });

    expect(topGrade).not.toBeNull();
    expect(topGrade!.id).toBe("g2");
    expect(topGrade!.earnings).toBe(600);

    const sales: BookSale[] = [
      { id: "b1", student_id: "s1", book_id: { id: "bk1", name: "كتاب الفيزياء", price: 100 }, status: "active", final_price: 100, year: 2026, month: 11 } as any,
      { id: "b2", student_id: "s2", book_id: { id: "bk1", name: "كتاب الفيزياء", price: 100 }, status: "active", final_price: 100, year: 2026, month: 11 } as any,
      { id: "b3", student_id: "s3", book_id: { id: "bk2", name: "كتاب الكيمياء", price: 120 }, status: "cancelled", final_price: 120, year: 2026, month: 11 } as any,
    ];

    const bounds = calculateDateRangeBounds({
      periodType: "current_academic_year",
      selectedAcademicYear: "2026/2027",
      selectedYear: 2026,
      selectedMonth: 11,
      customStartDate: "",
      customEndDate: "",
      selectedGradeId: "all",
      selectedGroupId: "all",
      selectedPaymentMethod: "all",
      selectedTeacherId: "all",
    }, currentAcademicOpt, currentNow);

    const topBook = calculateTopBook({
      allSales: sales,
      studentIdSet: new Set(["s1", "s2", "s3"]),
      bounds,
      academicYearOpt: currentAcademicOpt,
    });

    expect(topBook).not.toBeNull();
    expect(topBook!.name).toBe("كتاب الفيزياء");
    expect(topBook!.count).toBe(2);
    expect(topBook!.earnings).toBe(200);
  });
});
