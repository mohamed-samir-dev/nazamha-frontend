import type {
  FinancialFilters,
  FinancialKPIs,
  DailyRevenuePoint,
  MonthlySummaryRow,
  StageRevenueRow,
  GroupRevenueRow,
  PaymentTransactionRow,
  OutstandingStudentRow,
  AcademicYearOption,
  GradeStat,
  BookStat,
} from "../_types/financialTypes";
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

export const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export interface StudentRef {
  id: string;
  name: string;
  code?: string;
  group_id?: string | null;
  grade_id?: string | null;
  subscription_start_month?: number | null;
  subscription_start_year?: number | null;
  is_suspended?: boolean;
}

/**
 * Normalizes any value (ObjectId or string) to a string.
 */
export const s = (v: unknown): string =>
  v == null ? "" : typeof v === "string" ? v : String(v);

/**
 * Returns current year, month (0-indexed), and day in the target timezone.
 * Defaults to "Africa/Cairo".
 */
export function getCairoNow(tz = "Africa/Cairo"): { year: number; month: number; day: number } {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz || "Africa/Cairo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    const year = Number(parts.find((p) => p.type === "year")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value) - 1; // 0-based
    const day = Number(parts.find((p) => p.type === "day")?.value);
    return { year, month, day };
  } catch {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }
}

/**
 * Calculate net subscription amount:
 * If exempt -> 0 (properly waived).
 * Else -> max(0, amount - discount).
 */
export function netSubscriptionAmount(sub: MonthlySubscription): number {
  if (sub.status === "exempt") return 0;
  return Math.max(0, Number(sub.amount ?? 0) - Number(sub.discount ?? 0));
}

/**
 * Determines whether a student was enrolled/eligible for a specific month and year.
 * Prevents charging students for months prior to their joining date.
 */
export function isStudentEligibleForMonth(
  student: StudentRef,
  month: number,
  year: number,
  defaultAcademicStartYear: number
): boolean {
  const startMonth = Number(student.subscription_start_month) || 8;
  const startYear = Number(student.subscription_start_year) || defaultAcademicStartYear;
  return year * 100 + month >= startYear * 100 + startMonth;
}

/**
 * Resolves teacher's academic years and active month-year pairs.
 */
export function resolveAcademicYears(
  teacher: Teacher | null,
  currentYear: number,
  currentMonthZeroBased: number
): {
  currentAcademicYearKey: string;
  options: AcademicYearOption[];
} {
  const currentMonthOneBased = currentMonthZeroBased + 1;
  const currentAcademicStartYear = currentMonthOneBased >= 7 ? currentYear : currentYear - 1;

  const rawTeacherMonthYears = teacher?.academic_year?.active_month_years;
  const rawTeacherMonths = teacher?.academic_year?.active_months ?? [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];

  const buildActiveMonthsForStartYear = (startYear: number): { month: number; year: number }[] => {
    if (startYear === currentAcademicStartYear && rawTeacherMonthYears && rawTeacherMonthYears.length > 0) {
      return [...rawTeacherMonthYears].sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month));
    }
    const sorted = [...rawTeacherMonths].sort((a, b) => {
      const aVal = a >= 7 ? a : a + 12;
      const bVal = b >= 7 ? b : b + 12;
      return aVal - bVal;
    });
    return sorted.map((m) => ({
      month: m,
      year: m >= 7 ? startYear : startYear + 1,
    }));
  };

  const yearsToSupport = [
    currentAcademicStartYear + 1,
    currentAcademicStartYear,
    currentAcademicStartYear - 1,
    currentAcademicStartYear - 2,
  ];

  const options: AcademicYearOption[] = yearsToSupport.map((startYear) => {
    const endYear = startYear + 1;
    const key = `${startYear}/${endYear}`;
    return {
      key,
      label: key,
      startYear,
      endYear,
      activeMonths: buildActiveMonthsForStartYear(startYear),
      isCurrent: startYear === currentAcademicStartYear,
    };
  });

  return {
    currentAcademicYearKey: `${currentAcademicStartYear}/${currentAcademicStartYear + 1}`,
    options,
  };
}

/**
 * Determines payment method label from notes or receipt or default.
 */
export function resolvePaymentMethod(sub: MonthlySubscription): string {
  const notes = (sub.notes || "").toLowerCase();
  const receipt = (sub.receipt_number || "").toLowerCase();
  if (notes.includes("انستاباي") || notes.includes("instapay")) return "انستاباي";
  if (notes.includes("فودافون") || notes.includes("vodafone")) return "فودافون كاش";
  if (notes.includes("تحويل") || notes.includes("بنك") || notes.includes("bank")) return "تحويل بنكي";
  if (receipt.startsWith("scan_") || receipt.length > 8) return "دفع إلكتروني / ماسح";
  return "نقداً";
}

/**
 * Checks if a payment method matches the active payment method filter.
 */
export function matchesPaymentMethodFilter(method: string, filter?: string): boolean {
  if (!filter || filter === "all") return true;
  if (filter === "cash") return method === "نقداً";
  if (filter === "electronic") return method !== "نقداً";
  return true;
}

/**
 * Parses a date or returns null if invalid.
 */
export function parseDateSafe(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d;
}

export interface DateRangeBounds {
  startDate: Date;
  endDate: Date;
  isSingleMonth: boolean;
  targetMonth?: number;
  targetYear?: number;
  label: string;
}

/**
 * Computes exact start and end dates for any chosen reporting period.
 */
export function calculateDateRangeBounds(
  filters: FinancialFilters,
  academicYearOpt: AcademicYearOption,
  currentNow: { year: number; month: number; day: number }
): DateRangeBounds {
  const { periodType, selectedYear, selectedMonth, customStartDate, customEndDate } = filters;

  if (periodType === "current_month") {
    const curYear = currentNow.year;
    const curMonth = currentNow.month + 1; // 1-based
    const start = new Date(curYear, curMonth - 1, 1, 0, 0, 0, 0);
    const end = new Date(curYear, curMonth, 0, 23, 59, 59, 999);
    return {
      startDate: start,
      endDate: end,
      isSingleMonth: true,
      targetMonth: curMonth,
      targetYear: curYear,
      label: `${ARABIC_MONTHS[curMonth - 1]} ${curYear}`,
    };
  }

  if (periodType === "specific_month") {
    const start = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    return {
      startDate: start,
      endDate: end,
      isSingleMonth: true,
      targetMonth: selectedMonth,
      targetYear: selectedYear,
      label: `${ARABIC_MONTHS[selectedMonth - 1]} ${selectedYear}`,
    };
  }

  if (periodType === "current_academic_year" || periodType === "previous_academic_year") {
    const active = academicYearOpt.activeMonths;
    if (active.length > 0) {
      const first = active[0];
      const last = active[active.length - 1];
      const start = new Date(first.year, first.month - 1, 1, 0, 0, 0, 0);
      const end = new Date(last.year, last.month, 0, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        isSingleMonth: false,
        label: `السنة الأكاديمية ${academicYearOpt.label}`,
      };
    }
    const start = new Date(academicYearOpt.startYear, 6, 1, 0, 0, 0, 0);
    const end = new Date(academicYearOpt.endYear, 5, 30, 23, 59, 59, 999);
    return {
      startDate: start,
      endDate: end,
      isSingleMonth: false,
      label: `السنة الأكاديمية ${academicYearOpt.label}`,
    };
  }

  // Fallback to current month
  const curYear = currentNow.year;
  const curMonth = currentNow.month + 1;
  return {
    startDate: new Date(curYear, curMonth - 1, 1, 0, 0, 0, 0),
    endDate: new Date(curYear, curMonth, 0, 23, 59, 59, 999),
    isSingleMonth: true,
    targetMonth: curMonth,
    targetYear: curYear,
    label: `${ARABIC_MONTHS[curMonth - 1]} ${curYear}`,
  };
}

/**
 * Complete KPI calculation respecting all accounting rules:
 * - Actual payment transaction dates for collected revenue
 * - Active academic months for obligations
 * - Excludes inactive months from creating fake debt
 * - Excludes future obligations from overdue debt
 * - Non-zero division safe collection rate
 */
export function calculateKPIs(params: {
  filters: FinancialFilters;
  bounds: DateRangeBounds;
  academicYearOpt: AcademicYearOption;
  students: StudentRef[];
  studentIdSet: Set<string>;
  allSubs: MonthlySubscription[];
  allSales: BookSale[];
  bills: Bill[];
  salaries: Salary[];
  teacherExpenses: TeacherExpense[];
  currentNow: { year: number; month: number; day: number };
}): FinancialKPIs {
  const {
    filters,
    bounds,
    academicYearOpt,
    students,
    studentIdSet,
    allSubs,
    allSales,
    bills,
    salaries,
    teacherExpenses,
    currentNow,
  } = params;

  const currentPeriodNum = currentNow.year * 100 + (currentNow.month + 1);
  const activePairSet = new Set(academicYearOpt.activeMonths.map((p) => `${p.month}-${p.year}`));
  const isMonthActive = bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear
    ? activePairSet.has(`${bounds.targetMonth}-${bounds.targetYear}`)
    : true;

  // 1. Total Collected Revenue in Period (by transaction date)
  let subscriptionCollected = 0;
  const payingStudentIds = new Set<string>();

  for (const sub of allSubs) {
    if (sub.status !== "paid") continue;
    if (!studentIdSet.has(s(sub.student_id))) continue;

    const method = resolvePaymentMethod(sub);
    if (!matchesPaymentMethodFilter(method, filters.selectedPaymentMethod)) continue;

    const paidDate = parseDateSafe(sub.paid_at);
    let inPeriod = false;

    if (paidDate) {
      inPeriod = paidDate >= bounds.startDate && paidDate <= bounds.endDate;
    } else if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
      // Legacy fallback when paid_at wasn't recorded
      inPeriod = sub.month === bounds.targetMonth && sub.year === bounds.targetYear;
    } else {
      // Check if sub period is within active months
      inPeriod = activePairSet.has(`${sub.month}-${sub.year}`);
    }

    if (inPeriod) {
      const net = netSubscriptionAmount(sub);
      subscriptionCollected += net;
      payingStudentIds.add(s(sub.student_id));
    }
  }

  // Book sales collected in period
  let bookCollected = 0;
  for (const sale of allSales) {
    if (sale.status === "cancelled") continue;
    const sid = typeof sale.student_id === "object"
      ? s((sale.student_id as { id?: string; _id?: string }).id || (sale.student_id as { id?: string; _id?: string })._id)
      : s(sale.student_id);
    if (!studentIdSet.has(sid)) continue;

    const saleDate = parseDateSafe(sale.created_at);
    let inPeriod = false;
    if (saleDate) {
      inPeriod = saleDate >= bounds.startDate && saleDate <= bounds.endDate;
    } else if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
      inPeriod = sale.month === bounds.targetMonth && Number(sale.year) === bounds.targetYear;
    } else {
      inPeriod = activePairSet.has(`${sale.month}-${sale.year}`);
    }

    if (inPeriod) {
      bookCollected += Number(sale.final_price ?? 0);
    }
  }

  const totalCollected = subscriptionCollected + bookCollected;

  // 2. Total Due Amount for the Selected Period
  let totalDue = 0;
  let totalEligibleStudents = 0;
  let periodCollectedForDue = 0;
  let unpaidThisPeriodCount = 0;

  const studentMap = new Map(students.map((st) => [st.id, st]));

  if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
    const tMonth = bounds.targetMonth;
    const tYear = bounds.targetYear;

    if (isMonthActive) {
      // Count due obligations for this active month
      for (const st of students) {
        if (!studentIdSet.has(st.id)) continue;
        if (!isStudentEligibleForMonth(st, tMonth, tYear, academicYearOpt.startYear)) continue;

        totalEligibleStudents++;
        const sub = allSubs.find(
          (sItem) => s(sItem.student_id) === st.id && sItem.month === tMonth && sItem.year === tYear
        );

        if (sub) {
          if (sub.status !== "exempt") {
            const netDue = netSubscriptionAmount(sub);
            totalDue += netDue;
            if (sub.status === "paid") {
              periodCollectedForDue += netDue;
            } else if (sub.status === "due") {
              unpaidThisPeriodCount++;
            }
          }
        }
      }
    } else {
      // Inactive month generates 0 due obligations
      totalDue = 0;
      totalEligibleStudents = students.filter((st) => studentIdSet.has(st.id)).length;
    }
  } else {
    // Annual or custom range
    for (const { month: m, year: y } of academicYearOpt.activeMonths) {
      for (const st of students) {
        if (!studentIdSet.has(st.id)) continue;
        if (!isStudentEligibleForMonth(st, m, y, academicYearOpt.startYear)) continue;

        const sub = allSubs.find(
          (sItem) => s(sItem.student_id) === st.id && sItem.month === m && sItem.year === y
        );
        if (sub && sub.status !== "exempt") {
          const netDue = netSubscriptionAmount(sub);
          totalDue += netDue;
          if (sub.status === "paid") {
            periodCollectedForDue += netDue;
          }
        }
      }
    }
    totalEligibleStudents = students.filter((st) => studentIdSet.has(st.id)).length;
  }

  // 3. Outstanding Overdue Debt
  // Passed due dates that are still unpaid ('due'). Excludes future and inactive months.
  let outstandingDebt = 0;
  const overdueStudentSet = new Set<string>();

  for (const sub of allSubs) {
    if (sub.status !== "due") continue;
    if (!studentIdSet.has(s(sub.student_id))) continue;

    // Check if the month is active in the academic year
    if (!activePairSet.has(`${sub.month}-${sub.year}`)) continue;

    // Must be past or current period (not future)
    const subPeriod = sub.year * 100 + sub.month;
    if (subPeriod > currentPeriodNum) continue;

    // Check student eligibility
    const st = studentMap.get(s(sub.student_id));
    if (st && !isStudentEligibleForMonth(st, sub.month, sub.year, academicYearOpt.startYear)) continue;

    outstandingDebt += netSubscriptionAmount(sub);
    overdueStudentSet.add(s(sub.student_id));
  }

  // 4. Collection Rate (Amount based)
  let collectionRate = 0;
  if (totalDue > 0) {
    // Percentage of due obligations collected
    collectionRate = Math.min(100, Math.round((periodCollectedForDue / totalDue) * 100));
  } else {
    // No due obligations in this period
    collectionRate = 100;
  }

  // 5. Expenses in Period
  let totalExpenses = 0;
  for (const b of bills) {
    const m = Number(b.billing_month);
    const y = Number(b.billing_year);
    let inPeriod = false;
    if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
      inPeriod = m === bounds.targetMonth && y === bounds.targetYear;
    } else {
      inPeriod = activePairSet.has(`${m}-${y}`);
    }
    if (inPeriod) totalExpenses += Number(b.amount ?? 0);
  }

  for (const sal of salaries) {
    if (sal.status === "cancelled") continue;
    const m = Number(sal.month);
    const y = Number(sal.year);
    let inPeriod = false;
    if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
      inPeriod = m === bounds.targetMonth && y === bounds.targetYear;
    } else {
      inPeriod = activePairSet.has(`${m}-${y}`);
    }
    if (inPeriod) totalExpenses += Number(sal.amount ?? 0);
  }

  for (const exp of teacherExpenses) {
    if (exp.status === "cancelled") continue;
    const m = Number(exp.month);
    const y = Number(exp.year);
    let inPeriod = false;
    if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
      inPeriod = m === bounds.targetMonth && y === bounds.targetYear;
    } else {
      inPeriod = activePairSet.has(`${m}-${y}`);
    }
    if (inPeriod) totalExpenses += Number(exp.amount ?? 0);
  }

  const netProfit = totalCollected - totalExpenses;

  return {
    totalCollected,
    totalDue,
    outstandingDebt,
    collectionRate,
    subscriptionCollected,
    bookCollected,
    totalExpenses,
    netProfit,
    payingStudentsCount: payingStudentIds.size,
    totalEligibleStudents,
    unpaidStudentsCount: bounds.isSingleMonth ? unpaidThisPeriodCount : overdueStudentSet.size,
    isMonthActive,
    periodLabel: bounds.label,
  };
}

/**
 * Calculates daily collected revenue points for a specific month (Days 1 to DaysInMonth).
 * Zero-transaction days are preserved with value 0.
 */
export function calculateDailyRevenue(params: {
  year: number;
  month: number; // 1-12
  allSubs: MonthlySubscription[];
  allSales: BookSale[];
  studentIdSet: Set<string>;
  paymentMethodFilter: string;
}): DailyRevenuePoint[] {
  const { year, month, allSubs, allSales, studentIdSet, paymentMethodFilter } = params;

  const daysInMonth = new Date(year, month, 0).getDate();
  const points: DailyRevenuePoint[] = [];

  const subMap = new Map<number, number>();
  const bookMap = new Map<number, number>();

  for (const sub of allSubs) {
    if (sub.status !== "paid") continue;
    if (!studentIdSet.has(s(sub.student_id))) continue;

    const method = resolvePaymentMethod(sub);
    if (!matchesPaymentMethodFilter(method, paymentMethodFilter)) continue;

    const paidDate = parseDateSafe(sub.paid_at);
    if (!paidDate) continue;

    if (paidDate.getFullYear() === year && paidDate.getMonth() + 1 === month) {
      const day = paidDate.getDate();
      subMap.set(day, (subMap.get(day) ?? 0) + netSubscriptionAmount(sub));
    }
  }

  for (const sale of allSales) {
    if (sale.status === "cancelled") continue;
    const sid = typeof sale.student_id === "object"
      ? s((sale.student_id as { id?: string; _id?: string }).id || (sale.student_id as { id?: string; _id?: string })._id)
      : s(sale.student_id);
    if (!studentIdSet.has(sid)) continue;

    const saleDate = parseDateSafe(sale.created_at);
    if (!saleDate) continue;

    if (saleDate.getFullYear() === year && saleDate.getMonth() + 1 === month) {
      const day = saleDate.getDate();
      bookMap.set(day, (bookMap.get(day) ?? 0) + Number(sale.final_price ?? 0));
    }
  }

  const monthName = ARABIC_MONTHS[month - 1];
  for (let d = 1; d <= daysInMonth; d++) {
    const subs = subMap.get(d) ?? 0;
    const books = bookMap.get(d) ?? 0;
    points.push({
      day: d,
      dateStr: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      dateLabel: `${d} ${monthName}`,
      subscriptions: subs,
      books,
      total: subs + books,
    });
  }

  return points;
}

/**
 * Calculates Table A: Monthly Financial Summary.
 * Correctly distinguishes active and inactive academic months.
 */
export function calculateMonthlySummary(params: {
  academicYearOpt: AcademicYearOption;
  students: StudentRef[];
  studentIdSet: Set<string>;
  allSubs: MonthlySubscription[];
  allSales: BookSale[];
  bills: Bill[];
  salaries: Salary[];
  teacherExpenses: TeacherExpense[];
  currentNow: { year: number; month: number; day: number };
}): MonthlySummaryRow[] {
  const {
    academicYearOpt,
    students,
    studentIdSet,
    allSubs,
    allSales,
    bills,
    salaries,
    teacherExpenses,
    currentNow,
  } = params;

  const currentPeriodNum = currentNow.year * 100 + (currentNow.month + 1);
  const activePairSet = new Set(academicYearOpt.activeMonths.map((p) => `${p.month}-${p.year}`));

  // Construct calendar of academic year in natural chronological order:
  // e.g. July/August .. December of startYear, then January .. June of endYear
  const monthSequence: { month: number; year: number }[] = [];
  for (let m = 7; m <= 12; m++) monthSequence.push({ month: m, year: academicYearOpt.startYear });
  for (let m = 1; m <= 6; m++) monthSequence.push({ month: m, year: academicYearOpt.endYear });

  const rows: MonthlySummaryRow[] = monthSequence.map(({ month, year }) => {
    const isActive = activePairSet.has(`${month}-${year}`);
    const isCurrentMonth = month === currentNow.month + 1 && year === currentNow.year;
    const monthName = ARABIC_MONTHS[month - 1];

    if (!isActive) {
      return {
        month,
        year,
        name: monthName,
        isActive: false,
        isCurrentMonth,
        due: 0,
        collected: 0,
        remaining: 0,
        collectionRate: 100,
        payingCount: 0,
        debtCount: 0,
        expenses: 0,
        netProfit: 0,
      };
    }

    let due = 0;
    let collected = 0;
    let payingCount = 0;
    let debtCount = 0;
    const payingStudents = new Set<string>();

    for (const st of students) {
      if (!studentIdSet.has(st.id)) continue;
      if (!isStudentEligibleForMonth(st, month, year, academicYearOpt.startYear)) continue;

      const sub = allSubs.find(
        (sItem) => s(sItem.student_id) === st.id && sItem.month === month && sItem.year === year
      );

      if (sub && sub.status !== "exempt") {
        const net = netSubscriptionAmount(sub);
        due += net;
        if (sub.status === "paid") {
          collected += net;
          payingStudents.add(st.id);
        } else if (sub.status === "due") {
          debtCount++;
        }
      }
    }

    // Add book sales for this month
    const bookRevenue = allSales
      .filter((sale) => {
        if (sale.status === "cancelled") return false;
        const sid = typeof sale.student_id === "object"
          ? s((sale.student_id as { id?: string; _id?: string }).id || (sale.student_id as { id?: string; _id?: string })._id)
          : s(sale.student_id);
        return studentIdSet.has(sid) && sale.month === month && Number(sale.year) === year;
      })
      .reduce((sum, sale) => sum + Number(sale.final_price ?? 0), 0);

    collected += bookRevenue;
    payingCount = payingStudents.size;
    const remaining = Math.max(0, due - (collected - bookRevenue));
    const collectionRate = due > 0 ? Math.min(100, Math.round(((due - remaining) / due) * 100)) : (collected > 0 ? 100 : 0);

    // Expenses
    const monthExpenses =
      bills
        .filter((b) => Number(b.billing_month) === month && Number(b.billing_year) === year)
        .reduce((sum, b) => sum + Number(b.amount ?? 0), 0) +
      salaries
        .filter((s) => s.status !== "cancelled" && Number(s.month) === month && Number(s.year) === year)
        .reduce((sum, s) => sum + Number(s.amount ?? 0), 0) +
      teacherExpenses
        .filter((e) => e.status !== "cancelled" && Number(e.month) === month && Number(e.year) === year)
        .reduce((sum, e) => sum + Number(e.amount ?? 0), 0);

    const netProfit = collected - monthExpenses;

    return {
      month,
      year,
      name: monthName,
      isActive: true,
      isCurrentMonth,
      due,
      collected,
      remaining,
      collectionRate,
      payingCount,
      debtCount,
      expenses: monthExpenses,
      netProfit,
    };
  });

  return rows;
}

/**
 * Calculates Table B: Revenue by Educational Stage.
 */
export function calculateStageRevenue(params: {
  grades: Grade[];
  groups: Group[];
  students: StudentRef[];
  studentIdSet: Set<string>;
  allSubs: MonthlySubscription[];
  bounds: DateRangeBounds;
  academicYearOpt: AcademicYearOption;
}): StageRevenueRow[] {
  const { grades, groups, students, studentIdSet, allSubs, bounds, academicYearOpt } = params;

  const getEffectiveGradeId = (st: StudentRef): string | null =>
    (st.grade_id && st.grade_id !== "null" ? st.grade_id : null) ||
    groups.find((g) => g.id === st.group_id)?.grade_id ||
    null;

  const result: StageRevenueRow[] = [];
  const activePairSet = new Set(academicYearOpt.activeMonths.map((p) => `${p.month}-${p.year}`));

  const allStages = [...grades];

  for (const grade of allStages) {
    const stageStudents = students.filter(
      (st) => studentIdSet.has(st.id) && getEffectiveGradeId(st) === grade.id
    );
    if (stageStudents.length === 0) continue;

    const stageStudentIds = new Set(stageStudents.map((st) => st.id));
    let totalDue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    const paidStudentIds = new Set<string>();

    for (const sub of allSubs) {
      if (!stageStudentIds.has(s(sub.student_id))) continue;
      if (sub.status === "exempt") continue;

      let inScope = false;
      if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
        inScope = sub.month === bounds.targetMonth && sub.year === bounds.targetYear;
      } else {
        inScope = activePairSet.has(`${sub.month}-${sub.year}`);
      }
      if (!inScope) continue;

      const net = netSubscriptionAmount(sub);
      totalDue += net;

      if (sub.status === "paid") {
        totalCollected += net;
        paidStudentIds.add(s(sub.student_id));
      } else if (sub.status === "due") {
        totalOutstanding += net;
      }
    }

    const collectionRate = totalDue > 0 ? Math.min(100, Math.round((totalCollected / totalDue) * 100)) : (totalCollected > 0 ? 100 : 0);

    result.push({
      id: grade.id,
      name: grade.name,
      totalStudents: stageStudents.length,
      paidStudents: paidStudentIds.size,
      totalDue,
      totalCollected,
      totalOutstanding,
      collectionRate,
    });
  }

  // Handle students with no grade assigned
  const unassigned = students.filter((st) => studentIdSet.has(st.id) && !getEffectiveGradeId(st));
  if (unassigned.length > 0) {
    const unassignedIds = new Set(unassigned.map((st) => st.id));
    let totalDue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    const paidStudentIds = new Set<string>();

    for (const sub of allSubs) {
      if (!unassignedIds.has(s(sub.student_id))) continue;
      if (sub.status === "exempt") continue;

      let inScope = false;
      if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
        inScope = sub.month === bounds.targetMonth && sub.year === bounds.targetYear;
      } else {
        inScope = activePairSet.has(`${sub.month}-${sub.year}`);
      }
      if (!inScope) continue;

      const net = netSubscriptionAmount(sub);
      totalDue += net;
      if (sub.status === "paid") {
        totalCollected += net;
        paidStudentIds.add(s(sub.student_id));
      } else if (sub.status === "due") {
        totalOutstanding += net;
      }
    }

    result.push({
      id: "unassigned",
      name: "طلاب بدون سنة دراسية",
      totalStudents: unassigned.length,
      paidStudents: paidStudentIds.size,
      totalDue,
      totalCollected,
      totalOutstanding,
      collectionRate: totalDue > 0 ? Math.min(100, Math.round((totalCollected / totalDue) * 100)) : 0,
    });
  }

  return result.sort((a, b) => b.totalCollected - a.totalCollected);
}

/**
 * Calculates Table C: Revenue by Group.
 */
export function calculateGroupRevenue(params: {
  groups: Group[];
  grades: Grade[];
  students: StudentRef[];
  studentIdSet: Set<string>;
  allSubs: MonthlySubscription[];
  bounds: DateRangeBounds;
  academicYearOpt: AcademicYearOption;
}): GroupRevenueRow[] {
  const { groups, grades, students, studentIdSet, allSubs, bounds, academicYearOpt } = params;
  const gradeMap = new Map(grades.map((g) => [g.id, g.name]));
  const activePairSet = new Set(academicYearOpt.activeMonths.map((p) => `${p.month}-${p.year}`));

  const result: GroupRevenueRow[] = [];

  for (const group of groups) {
    const groupStudents = students.filter(
      (st) => studentIdSet.has(st.id) && st.group_id === group.id
    );
    if (groupStudents.length === 0) continue;

    const groupStudentIds = new Set(groupStudents.map((st) => st.id));
    let totalDue = 0;
    let totalCollected = 0;
    const paidStudentIds = new Set<string>();

    for (const sub of allSubs) {
      if (!groupStudentIds.has(s(sub.student_id))) continue;
      if (sub.status === "exempt") continue;

      let inScope = false;
      if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
        inScope = sub.month === bounds.targetMonth && sub.year === bounds.targetYear;
      } else {
        inScope = activePairSet.has(`${sub.month}-${sub.year}`);
      }
      if (!inScope) continue;

      const net = netSubscriptionAmount(sub);
      totalDue += net;
      if (sub.status === "paid") {
        totalCollected += net;
        paidStudentIds.add(s(sub.student_id));
      }
    }

    const remaining = Math.max(0, totalDue - totalCollected);
    const collectionRate = totalDue > 0 ? Math.min(100, Math.round((totalCollected / totalDue) * 100)) : (totalCollected > 0 ? 100 : 0);

    result.push({
      id: group.id,
      name: group.name,
      gradeId: group.grade_id,
      gradeName: group.grade_id ? gradeMap.get(group.grade_id) || "—" : "—",
      totalStudents: groupStudents.length,
      paidStudents: paidStudentIds.size,
      totalDue,
      totalCollected,
      remaining,
      collectionRate,
    });
  }

  return result.sort((a, b) => b.totalCollected - a.totalCollected);
}

/**
 * Calculates Table D: Payment Transactions.
 * Individual payment records with accurate date and allocation.
 */
export function calculatePaymentTransactions(params: {
  allSubs: MonthlySubscription[];
  students: StudentRef[];
  groups: Group[];
  grades: Grade[];
  studentIdSet: Set<string>;
  bounds: DateRangeBounds;
  academicYearOpt: AcademicYearOption;
  paymentMethodFilter: string;
}): PaymentTransactionRow[] {
  const {
    allSubs,
    students,
    groups,
    grades,
    studentIdSet,
    bounds,
    academicYearOpt,
    paymentMethodFilter,
  } = params;

  const studentMap = new Map(students.map((st) => [st.id, st]));
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));
  const gradeMap = new Map(grades.map((g) => [g.id, g.name]));
  const activePairSet = new Set(academicYearOpt.activeMonths.map((p) => `${p.month}-${p.year}`));

  const transactions: PaymentTransactionRow[] = [];

  for (const sub of allSubs) {
    if (sub.status !== "paid") continue;
    if (!studentIdSet.has(s(sub.student_id))) continue;

    const method = resolvePaymentMethod(sub);
    if (!matchesPaymentMethodFilter(method, paymentMethodFilter)) continue;

    const paidDate = parseDateSafe(sub.paid_at);
    let inPeriod = false;

    if (paidDate) {
      inPeriod = paidDate >= bounds.startDate && paidDate <= bounds.endDate;
    } else if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
      inPeriod = sub.month === bounds.targetMonth && sub.year === bounds.targetYear;
    } else {
      inPeriod = activePairSet.has(`${sub.month}-${sub.year}`);
    }

    if (!inPeriod) continue;

    const student = studentMap.get(s(sub.student_id));
    const effectiveGradeId =
      (student?.grade_id && student.grade_id !== "null" ? student.grade_id : null) ||
      (student?.group_id ? groups.find((g) => g.id === student.group_id)?.grade_id : null);

    const actualPaidDate = paidDate || bounds.startDate;

    transactions.push({
      id: sub.id || sub._id || `${s(sub.student_id)}-${sub.month}-${sub.year}`,
      studentId: s(sub.student_id),
      studentName: student?.name || "طالب غير معروف",
      studentCode: student?.code,
      groupId: student?.group_id,
      groupName: student?.group_id ? groupMap.get(student.group_id) || "—" : "—",
      gradeName: effectiveGradeId ? gradeMap.get(effectiveGradeId) || "—" : "—",
      month: sub.month,
      year: sub.year,
      monthLabel: `${ARABIC_MONTHS[sub.month - 1]} ${sub.year}`,
      paidAt: actualPaidDate.toLocaleString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      paidAtTimestamp: actualPaidDate.getTime(),
      amount: netSubscriptionAmount(sub),
      method,
      receiptNumber: sub.receipt_number,
      status: "paid",
    });
  }

  return transactions.sort((a, b) => b.paidAtTimestamp - a.paidAtTimestamp);
}

/**
 * Calculates Table E: Outstanding Students.
 * Shows students with unpaid obligations. Excludes future months.
 */
export function calculateOutstandingStudents(params: {
  allSubs: MonthlySubscription[];
  students: StudentRef[];
  groups: Group[];
  grades: Grade[];
  studentIdSet: Set<string>;
  academicYearOpt: AcademicYearOption;
  currentNow: { year: number; month: number; day: number };
  specificMonth?: { month: number; year: number } | null;
}): OutstandingStudentRow[] {
  const {
    allSubs,
    students,
    groups,
    grades,
    studentIdSet,
    academicYearOpt,
    currentNow,
    specificMonth,
  } = params;

  const currentPeriodNum = currentNow.year * 100 + (currentNow.month + 1);
  const activePairSet = new Set(academicYearOpt.activeMonths.map((p) => `${p.month}-${p.year}`));
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));
  const gradeMap = new Map(grades.map((g) => [g.id, g.name]));

  const byStudent = new Map<string, MonthlySubscription[]>();

  for (const sub of allSubs) {
    if (sub.status !== "due") continue;
    if (!studentIdSet.has(s(sub.student_id))) continue;

    const subPeriod = sub.year * 100 + sub.month;
    if (specificMonth) {
      if (sub.month !== specificMonth.month || sub.year !== specificMonth.year) continue;
    } else {
      // Must be within active months and not in future
      if (!activePairSet.has(`${sub.month}-${sub.year}`)) continue;
      if (subPeriod > currentPeriodNum) continue;
    }

    const sid = s(sub.student_id);
    if (!byStudent.has(sid)) byStudent.set(sid, []);
    byStudent.get(sid)!.push(sub);
  }

  const result: OutstandingStudentRow[] = [];

  for (const st of students) {
    if (!studentIdSet.has(st.id)) continue;
    const subs = byStudent.get(st.id);
    if (!subs || subs.length === 0) continue;

    // Filter by student join eligibility
    const validSubs = subs.filter((sub) =>
      isStudentEligibleForMonth(st, sub.month, sub.year, academicYearOpt.startYear)
    );
    if (validSubs.length === 0) continue;

    const effectiveGradeId =
      (st.grade_id && st.grade_id !== "null" ? st.grade_id : null) ||
      (st.group_id ? groups.find((g) => g.id === st.group_id)?.grade_id : null);

    let originalAmount = 0;
    let remainingBalance = 0;

    const overdueMonths = validSubs
      .sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month))
      .map((sub) => {
        const orig = Number(sub.amount ?? 0);
        const net = netSubscriptionAmount(sub);
        originalAmount += orig;
        remainingBalance += net;
        return {
          month: sub.month,
          year: sub.year,
          label: `${ARABIC_MONTHS[sub.month - 1]} ${sub.year}`,
          amount: orig,
          discount: Number(sub.discount ?? 0),
          netAmount: net,
        };
      });

    const overdueCount = overdueMonths.length;
    const latest = overdueMonths[overdueMonths.length - 1];
    const statusLabel =
      overdueCount === 1
        ? `متأخر شهر (${latest.label})`
        : `متأخر ${overdueCount} أشهر`;

    result.push({
      studentId: st.id,
      studentName: st.name,
      studentCode: st.code,
      groupId: st.group_id,
      groupName: st.group_id ? groupMap.get(st.group_id) || "—" : "—",
      gradeName: effectiveGradeId ? gradeMap.get(effectiveGradeId) || "—" : "—",
      overdueMonths,
      originalAmount,
      paidAmount: 0,
      remainingBalance,
      latestDueDate: latest.label,
      overdueCount,
      statusLabel,
    });
  }

  return result.sort((a, b) => b.remainingBalance - a.remainingBalance);
}

/**
 * Calculates existing feature: Highest-earning educational stage (Annual).
 * Calculates using actual collected subscription revenue for selected academic year.
 */
export function calculateTopGradeAnnual(params: {
  grades: Grade[];
  groups: Group[];
  students: StudentRef[];
  studentIdSet: Set<string>;
  allSubs: MonthlySubscription[];
  academicYearOpt: AcademicYearOption;
}): GradeStat | null {
  const { grades, groups, students, studentIdSet, allSubs, academicYearOpt } = params;
  const activePairSet = new Set(academicYearOpt.activeMonths.map((p) => `${p.month}-${p.year}`));

  const getEffectiveGradeId = (st: StudentRef): string | null =>
    (st.grade_id && st.grade_id !== "null" ? st.grade_id : null) ||
    groups.find((g) => g.id === st.group_id)?.grade_id ||
    null;

  let topGrade: GradeStat | null = null;

  for (const grade of grades) {
    const gradeStudentIds = new Set(
      students.filter((st) => studentIdSet.has(st.id) && getEffectiveGradeId(st) === grade.id).map((st) => st.id)
    );
    if (gradeStudentIds.size === 0) continue;

    let earnings = 0;
    const paidStudents = new Set<string>();

    for (const sub of allSubs) {
      if (!gradeStudentIds.has(s(sub.student_id))) continue;
      if (sub.status !== "paid") continue;
      if (!activePairSet.has(`${sub.month}-${sub.year}`)) continue;

      earnings += netSubscriptionAmount(sub);
      paidStudents.add(s(sub.student_id));
    }

    if (earnings > 0 || paidStudents.size > 0) {
      if (!topGrade || earnings > topGrade.earnings) {
        topGrade = {
          id: grade.id,
          name: grade.name,
          paidThisMonth: paidStudents.size,
          earnings,
        };
      }
    }
  }

  return topGrade;
}

/**
 * Calculates existing feature: Best-selling book.
 * Excludes cancelled sales. Displays sold quantity and revenue.
 */
export function calculateTopBook(params: {
  allSales: BookSale[];
  studentIdSet: Set<string>;
  bounds: DateRangeBounds;
  academicYearOpt: AcademicYearOption;
}): BookStat | null {
  const { allSales, studentIdSet, bounds, academicYearOpt } = params;
  const activePairSet = new Set(academicYearOpt.activeMonths.map((p) => `${p.month}-${p.year}`));

  const map = new Map<string, BookStat>();

  for (const sale of allSales) {
    if (sale.status === "cancelled") continue;
    const sid = typeof sale.student_id === "object"
      ? s((sale.student_id as { id?: string; _id?: string }).id || (sale.student_id as { id?: string; _id?: string })._id)
      : s(sale.student_id);
    if (!studentIdSet.has(sid)) continue;

    const saleDate = parseDateSafe(sale.created_at);
    let inScope = false;
    if (saleDate) {
      inScope = saleDate >= bounds.startDate && saleDate <= bounds.endDate;
    } else if (bounds.isSingleMonth && bounds.targetMonth && bounds.targetYear) {
      inScope = sale.month === bounds.targetMonth && Number(sale.year) === bounds.targetYear;
    } else {
      inScope = activePairSet.has(`${sale.month}-${sale.year}`);
    }
    if (!inScope) continue;

    const bookObj = typeof sale.book_id === "object"
      ? (sale.book_id as { id?: string; _id?: string; name?: string; price?: number })
      : null;
    const bookId = bookObj ? s(bookObj.id || bookObj._id) : s(sale.book_id);
    const bookName = bookObj?.name || bookId || "كتاب";
    const bookPrice = bookObj ? Number(bookObj.price ?? 0) : Number(sale.price ?? 0);
    const priceEarned = Number(sale.final_price ?? 0);

    const existing = map.get(bookId);
    if (existing) {
      existing.count += 1;
      existing.earnings += priceEarned;
    } else {
      map.set(bookId, {
        id: bookId,
        name: bookName,
        price: bookPrice,
        count: 1,
        earnings: priceEarned,
      });
    }
  }

  if (map.size === 0) return null;
  const sorted = Array.from(map.values()).sort((a, b) => b.earnings - a.earnings || b.count - a.count);
  return sorted[0];
}
