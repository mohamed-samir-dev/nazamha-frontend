"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AuthService } from "@/lib/services/authService";
import { FINANCIAL_CHANGED } from "@/lib/financialEvents";
import { TeachersService } from "@/lib/services/teachersService";
import { StudentsService } from "@/lib/services/studentsService";
import { BillsService } from "@/lib/services/billsService";
import { SalariesService } from "@/lib/services/salariesService";
import { TeacherExpensesService } from "@/lib/services/teacherExpensesService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { SubTeachersService } from "@/lib/services/subTeachersService";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";
import { BooksService } from "@/lib/services/booksService";
import type {
  Grade,
  Group,
  SubTeacher,
  MonthlySubscription,
  BookSale,
  Bill,
  Salary,
  TeacherExpense,
  Student,
  Teacher,
} from "@/lib/types";
import { DEFAULT_ERROR } from "@/lib/errors";
import {
  ARABIC_MONTHS,
  getCairoNow,
  s,
  netSubscriptionAmount,
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
} from "../_utils/financialCalculations";
import type {
  FinancialFilters,
  PeriodType,
  FinancialKPIs,
  DailyRevenuePoint,
  MonthlySummaryRow,
  StageRevenueRow,
  GroupRevenueRow,
  PaymentTransactionRow,
  OutstandingStudentRow,
  GradeStat,
  BookStat,
} from "../_types/financialTypes";
import {
  exportFinancialReportToExcel,
  printFinancialStatement,
} from "../_utils/exportFinancialReports";

export { ARABIC_MONTHS };

export function useFinancialReports() {
  // 1. Timezone-anchored Current Date (Africa/Cairo)
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
  const timezone = teacherProfile?.settings?.timezone || "Africa/Cairo";
  const currentNow = useMemo(() => getCairoNow(timezone), [timezone]);
  const CURRENT_YEAR = currentNow.year;
  const CURRENT_MONTH = currentNow.month; // 0-based index

  // 2. Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Raw Data
  const [students, setStudents] = useState<StudentRef[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subTeachers, setSubTeachers] = useState<SubTeacher[]>([]);
  const [allSubs, setAllSubs] = useState<MonthlySubscription[]>([]);
  const [allSales, setAllSales] = useState<BookSale[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [teacherExpenses, setTeacherExpenses] = useState<TeacherExpense[]>([]);
  const [hasCenterMode, setHasCenterMode] = useState(false);

  // 4. Academic Year Options
  const { currentAcademicYearKey, options: academicYearOptions } = useMemo(
    () => resolveAcademicYears(teacherProfile, CURRENT_YEAR, CURRENT_MONTH),
    [teacherProfile, CURRENT_YEAR, CURRENT_MONTH]
  );

  // 5. Filters State (PRIMARY OBJECTIVE: CURRENT MONTH FIRST)
  const [periodType, setPeriodType] = useState<PeriodType>("current_month");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(currentAcademicYearKey);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(CURRENT_MONTH + 1); // 1-based
  const [selectedGradeId, setSelectedGradeId] = useState<string>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  // Keep selectedAcademicYear synchronized if options load
  useEffect(() => {
    if (currentAcademicYearKey && (!selectedAcademicYear || selectedAcademicYear === "")) {
      setSelectedAcademicYear(currentAcademicYearKey);
    }
  }, [currentAcademicYearKey, selectedAcademicYear]);

  // Modals & Inspection States
  const [showUnpaid, setShowUnpaid] = useState(false);
  const [showAllGrades, setShowAllGrades] = useState(false);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [inspectedGradeId, setInspectedGradeId] = useState<string | null>(null);

  // 6. Data Fetching
  const loadVersion = useRef(0);
  const load = useCallback(
    async (silent = false) => {
      const version = ++loadVersion.current;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const user = await AuthService.getUser();
        if (!user || version !== loadVersion.current) return;

        // Fetch calendar years needed to cover current and comparison academic periods
        const selectedStartYear = Number(selectedAcademicYear.split("/")[0]) || CURRENT_YEAR;
        const yearsToFetch = [
          ...new Set([
            CURRENT_YEAR - 1,
            CURRENT_YEAR,
            CURRENT_YEAR + 1,
            selectedYear,
            selectedStartYear,
            selectedStartYear + 1,
          ]),
        ];

        const forYears = async <T,>(fetchYear: (year: number) => Promise<T[]>): Promise<T[]> =>
          (await Promise.all(yearsToFetch.map(fetchYear))).flat();

        const [
          teacher,
          studentsData,
          grps,
          grds,
          subsData,
          salesData,
          billsData,
          salariesData,
          expensesData,
        ] = await Promise.all([
          TeachersService.getTeacherProfile(user.id),
          StudentsService.getStudentsByTeacherId(
            "id,name,code,group_id,grade_id,subscription_start_month,subscription_start_year,is_suspended"
          ),
          GroupsService.getGroupsByTeacherId(),
          GradesService.getGradesByTeacherId(user.id),
          forYears((year) => SubscriptionsService.getAllTeacherSubscriptions(year)),
          forYears((year) => BooksService.getSales({ year: String(year) })),
          forYears((year) => BillsService.getBillsByTeacherId(user.id, year)),
          forYears((year) => SalariesService.getAll(year)),
          forYears((year) => TeacherExpensesService.getAll({ year })),
        ]);

        if (version !== loadVersion.current) return;

        setTeacherProfile(teacher);
        const centerMode = teacher?.is_center_mode || false;
        setHasCenterMode(centerMode);
        if (centerMode) {
          const subs = await SubTeachersService.getSubTeachersByCenterId(user.id);
          if (version !== loadVersion.current) return;
          setSubTeachers(subs || []);
        }

        setGroups(grps || []);
        setGrades(grds || []);

        const normalizedStudents: StudentRef[] = (studentsData || []).map(
          (st: Student & { _id?: string }) => ({
            id: s(st.id || st._id),
            name: st.name || "",
            code: st.code,
            group_id: s(st.group_id) || null,
            grade_id: s(st.grade_id) || null,
            subscription_start_month: (st as any).subscription_start_month,
            subscription_start_year: (st as any).subscription_start_year,
            is_suspended: (st as any).is_suspended,
          })
        );
        setStudents(normalizedStudents);

        const normalizedSubs: MonthlySubscription[] = (subsData || []).map(
          (sub: MonthlySubscription) => ({
            ...sub,
            id: s(sub.id || sub._id),
            student_id: s(sub.student_id),
            teacher_id: s(sub.teacher_id),
            month: Number(sub.month),
            year: Number(sub.year),
            amount: Number(sub.amount ?? 0),
            discount: Number(sub.discount ?? 0),
            paid_at: sub.paid_at,
            receipt_number: sub.receipt_number,
            notes: sub.notes,
            created_at: sub.created_at,
          })
        );
        setAllSubs(normalizedSubs);

        const activeSales = (salesData || []).filter((sale: BookSale) => sale.status === "active");
        setAllSales(activeSales);
        setBills(billsData || []);
        setSalaries(salariesData || []);
        setTeacherExpenses(expensesData || []);
      } catch {
        if (version === loadVersion.current) setError(DEFAULT_ERROR);
      } finally {
        if (version === loadVersion.current) setLoading(false);
      }
    },
    [CURRENT_MONTH, CURRENT_YEAR, selectedAcademicYear, selectedYear]
  );

  // Initial load
  const lastLoadRef = useRef(0);
  useEffect(() => {
    void (async () => {
      await load();
      lastLoadRef.current = Date.now();
    })();
    return () => {
      loadVersion.current++;
    };
  }, [load]);

  // Re-fetch on financial change event or tab visibility
  useEffect(() => {
    const THROTTLE_MS = 5 * 60 * 1000;
    let mutationTimer: ReturnType<typeof setTimeout>;
    const onEvent = () => {
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        lastLoadRef.current = Date.now();
        void load(true);
      }, 150);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastLoadRef.current < THROTTLE_MS) return;
      lastLoadRef.current = Date.now();
      load(true);
    };
    window.addEventListener(FINANCIAL_CHANGED, onEvent);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(mutationTimer);
      window.removeEventListener(FINANCIAL_CHANGED, onEvent);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // 7. Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      // Teacher filter (Center mode)
      if (selectedTeacherId !== "all") {
        const grp = groups.find((g) => g.id === st.group_id);
        if (grp?.sub_teacher_id !== selectedTeacherId) return false;
      }
      // Grade filter
      const effectiveGradeId =
        (st.grade_id && st.grade_id !== "null" ? st.grade_id : null) ||
        groups.find((g) => g.id === st.group_id)?.grade_id ||
        null;
      if (selectedGradeId !== "all" && effectiveGradeId !== selectedGradeId) return false;
      // Group filter
      if (selectedGroupId !== "all" && st.group_id !== selectedGroupId) return false;

      return true;
    });
  }, [students, groups, selectedTeacherId, selectedGradeId, selectedGroupId]);

  const studentIdSet = useMemo(
    () => new Set(filteredStudents.map((st) => st.id)),
    [filteredStudents]
  );

  // 8. Active Academic Year Option
  const activeAcademicYearOpt = useMemo(() => {
    const found = academicYearOptions.find((o) => o.key === selectedAcademicYear);
    return found || academicYearOptions.find((o) => o.isCurrent) || academicYearOptions[0];
  }, [academicYearOptions, selectedAcademicYear]);

  // 9. Filters object
  const currentFilters: FinancialFilters = useMemo(
    () => ({
      periodType,
      selectedAcademicYear,
      selectedYear,
      selectedMonth,
      selectedGradeId,
      selectedGroupId,
      selectedTeacherId,
      selectedPaymentMethod: "all",
    }),
    [
      periodType,
      selectedAcademicYear,
      selectedYear,
      selectedMonth,
      selectedGradeId,
      selectedGroupId,
      selectedTeacherId,
    ]
  );

  // 10. Date Bounds for Selected Period
  const dateBounds = useMemo(
    () => calculateDateRangeBounds(currentFilters, activeAcademicYearOpt, currentNow),
    [currentFilters, activeAcademicYearOpt, currentNow]
  );

  // 11. KPIs for Selected Period
  const kpis: FinancialKPIs = useMemo(
    () =>
      calculateKPIs({
        filters: currentFilters,
        bounds: dateBounds,
        academicYearOpt: activeAcademicYearOpt,
        students: filteredStudents,
        studentIdSet,
        allSubs,
        allSales,
        bills,
        salaries,
        teacherExpenses,
        currentNow,
      }),
    [
      currentFilters,
      dateBounds,
      activeAcademicYearOpt,
      filteredStudents,
      studentIdSet,
      allSubs,
      allSales,
      bills,
      salaries,
      teacherExpenses,
      currentNow,
    ]
  );

  // 12. Month-over-Month Comparison KPIs (Preserved from existing page)
  const prevMonthNum = CURRENT_MONTH === 0 ? 12 : CURRENT_MONTH; // 1-based
  const prevMonthYear = CURRENT_MONTH === 0 ? CURRENT_YEAR - 1 : CURRENT_YEAR;

  const prevSubs = useMemo(
    () =>
      allSubs.filter(
        (sub) =>
          sub.month === prevMonthNum &&
          sub.year === prevMonthYear &&
          (sub.status === "paid" || sub.status === "exempt") &&
          studentIdSet.has(s(sub.student_id))
      ),
    [allSubs, prevMonthNum, prevMonthYear, studentIdSet]
  );

  const prevMonthSubEarnings = useMemo(
    () => prevSubs.reduce((sum, sub) => sum + netSubscriptionAmount(sub), 0),
    [prevSubs]
  );

  const prevMonthBookEarnings = useMemo(
    () =>
      allSales
        .filter((sale) => {
          const sid =
            typeof sale.student_id === "object"
              ? s((sale.student_id as { id?: string; _id?: string }).id || (sale.student_id as { id?: string; _id?: string })._id)
              : s(sale.student_id);
          return (
            studentIdSet.has(sid) &&
            sale.month === prevMonthNum &&
            Number(sale.year) === prevMonthYear
          );
        })
        .reduce((sum, sale) => sum + Number(sale.final_price ?? 0), 0),
    [allSales, prevMonthNum, prevMonthYear, studentIdSet]
  );

  const prevMonthExpenses = useMemo(
    () =>
      bills
        .filter((b) => Number(b.billing_month) === prevMonthNum && Number(b.billing_year) === prevMonthYear)
        .reduce((sum, b) => sum + Number(b.amount ?? 0), 0) +
      salaries
        .filter((s) => Number(s.month) === prevMonthNum && Number(s.year) === prevMonthYear)
        .reduce((sum, s) => sum + Number(s.amount ?? 0), 0) +
      teacherExpenses
        .filter((e) => Number(e.month) === prevMonthNum && Number(e.year) === prevMonthYear)
        .reduce((sum, e) => sum + Number(e.amount ?? 0), 0),
    [bills, salaries, teacherExpenses, prevMonthNum, prevMonthYear]
  );

  const prevMonthGrossEarnings = prevMonthSubEarnings + prevMonthBookEarnings;
  const prevMonthNetProfit = prevMonthGrossEarnings - prevMonthExpenses;

  // 13. Daily Revenue Points (for Chart)
  const dailyRevenuePoints: DailyRevenuePoint[] = useMemo(() => {
    const targetMonth = dateBounds.targetMonth || CURRENT_MONTH + 1;
    const targetYear = dateBounds.targetYear || CURRENT_YEAR;
    return calculateDailyRevenue({
      year: targetYear,
      month: targetMonth,
      allSubs,
      allSales,
      studentIdSet,
      paymentMethodFilter: "all",
    });
  }, [
    dateBounds.targetMonth,
    dateBounds.targetYear,
    CURRENT_MONTH,
    CURRENT_YEAR,
    allSubs,
    allSales,
    studentIdSet,
  ]);

  // 14. Table A: Monthly Financial Summary
  const monthlySummary: MonthlySummaryRow[] = useMemo(
    () =>
      calculateMonthlySummary({
        academicYearOpt: activeAcademicYearOpt,
        students: filteredStudents,
        studentIdSet,
        allSubs,
        allSales,
        bills,
        salaries,
        teacherExpenses,
        currentNow,
      }),
    [
      activeAcademicYearOpt,
      filteredStudents,
      studentIdSet,
      allSubs,
      allSales,
      bills,
      salaries,
      teacherExpenses,
      currentNow,
    ]
  );

  // 15. Table B: Revenue by Educational Stage
  const stageRevenue: StageRevenueRow[] = useMemo(
    () =>
      calculateStageRevenue({
        grades,
        groups,
        students: filteredStudents,
        studentIdSet,
        allSubs,
        bounds: dateBounds,
        academicYearOpt: activeAcademicYearOpt,
      }),
    [grades, groups, filteredStudents, studentIdSet, allSubs, dateBounds, activeAcademicYearOpt]
  );

  // 16. Table C: Revenue by Group
  const groupRevenue: GroupRevenueRow[] = useMemo(
    () =>
      calculateGroupRevenue({
        groups,
        grades,
        students: filteredStudents,
        studentIdSet,
        allSubs,
        bounds: dateBounds,
        academicYearOpt: activeAcademicYearOpt,
      }),
    [groups, grades, filteredStudents, studentIdSet, allSubs, dateBounds, activeAcademicYearOpt]
  );

  // 17. Table D: Payment Transactions
  const paymentTransactions: PaymentTransactionRow[] = useMemo(
    () =>
      calculatePaymentTransactions({
        allSubs,
        students: filteredStudents,
        groups,
        grades,
        studentIdSet,
        bounds: dateBounds,
        academicYearOpt: activeAcademicYearOpt,
        paymentMethodFilter: "all",
      }),
    [allSubs, filteredStudents, groups, grades, studentIdSet, dateBounds, activeAcademicYearOpt]
  );

  // 18. Table E: Outstanding Students
  const outstandingStudents: OutstandingStudentRow[] = useMemo(
    () =>
      calculateOutstandingStudents({
        allSubs,
        students: filteredStudents,
        groups,
        grades,
        studentIdSet,
        academicYearOpt: activeAcademicYearOpt,
        currentNow,
        specificMonth:
          dateBounds.isSingleMonth && dateBounds.targetMonth && dateBounds.targetYear
            ? { month: dateBounds.targetMonth, year: dateBounds.targetYear }
            : null,
      }),
    [allSubs, filteredStudents, groups, grades, studentIdSet, activeAcademicYearOpt, currentNow, dateBounds]
  );

  // 19. Preserved Feature: Top Grade (Annual)
  const topGrade = useMemo(
    () =>
      calculateTopGradeAnnual({
        grades,
        groups,
        students: filteredStudents,
        studentIdSet,
        allSubs,
        academicYearOpt: activeAcademicYearOpt,
      }),
    [grades, groups, filteredStudents, studentIdSet, allSubs, activeAcademicYearOpt]
  );

  // 20. Preserved Feature: Best-Selling Book
  const topBook = useMemo(
    () =>
      calculateTopBook({
        allSales,
        studentIdSet,
        bounds: dateBounds,
        academicYearOpt: activeAcademicYearOpt,
      }),
    [allSales, studentIdSet, dateBounds, activeAcademicYearOpt]
  );

  // 21. Preserved Feature: Unpaid Students List for Selected Month
  const unpaidStudents = useMemo(() => {
    return outstandingStudents.map((st) => ({
      id: st.studentId,
      name: st.studentName,
      code: st.studentCode,
      gradeName: st.gradeName,
      groupName: st.groupName,
      amount: st.remainingBalance,
    }));
  }, [outstandingStudents]);

  // 22. Preserved Feature: Grades Stats List
  const gradesStats: GradeStat[] = useMemo(() => {
    return stageRevenue.map((sr) => ({
      id: sr.id,
      name: sr.name,
      paidThisMonth: sr.paidStudents,
      earnings: sr.totalCollected,
    }));
  }, [stageRevenue]);

  // 23. Preserved Feature: Books Stats List
  const booksStats: BookStat[] = useMemo(() => {
    const map = new Map<string, BookStat>();
    for (const sale of allSales) {
      if (sale.status === "cancelled") continue;
      const sid =
        typeof sale.student_id === "object"
          ? s((sale.student_id as { id?: string; _id?: string }).id || (sale.student_id as { id?: string; _id?: string })._id)
          : s(sale.student_id);
      if (!studentIdSet.has(sid)) continue;

      const bookObj =
        typeof sale.book_id === "object"
          ? (sale.book_id as { id?: string; _id?: string; name?: string; price?: number })
          : null;
      const bookId = bookObj ? s(bookObj.id || bookObj._id) : s(sale.book_id);
      const bookName = bookObj?.name || bookId;
      const bookPrice = bookObj ? Number(bookObj.price ?? 0) : Number(sale.price ?? 0);
      const earnings = Number(sale.final_price ?? 0);

      const existing = map.get(bookId);
      if (existing) {
        existing.count += 1;
        existing.earnings += earnings;
      } else {
        map.set(bookId, { id: bookId, name: bookName, price: bookPrice, count: 1, earnings });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.earnings - a.earnings);
  }, [allSales, studentIdSet]);

  // 24. Export Actions
  const handleExportExcel = useCallback(async () => {
    await exportFinancialReportToExcel({
      kpis,
      periodLabel: dateBounds.label,
      monthlySummary,
      stageRevenue,
      groupRevenue,
      transactions: paymentTransactions,
      outstandingStudents,
    });
  }, [kpis, dateBounds.label, monthlySummary, stageRevenue, groupRevenue, paymentTransactions, outstandingStudents]);

  // Open the in-page Print Preview modal (does not navigate away or open a new window)
  const handlePrintStatement = useCallback(() => {
    setShowPrintPreview(true);
  }, []);

  // Reset Filters Helper
  const resetFilters = useCallback(() => {
    setPeriodType("current_month");
    setSelectedAcademicYear(currentAcademicYearKey);
    setSelectedYear(CURRENT_YEAR);
    setSelectedMonth(CURRENT_MONTH + 1);
    setSelectedGradeId("all");
    setSelectedGroupId("all");
    setSelectedTeacherId("all");
  }, [currentAcademicYearKey, CURRENT_YEAR, CURRENT_MONTH]);

  return {
    loading,
    error,
    // Context data
    teacherProfile,
    grades,
    groups,
    subTeachers,
    filteredStudents,
    hasCenterMode,
    CURRENT_YEAR,
    CURRENT_MONTH,
    // Filter states & setters
    periodType,
    setPeriodType,
    selectedAcademicYear,
    setSelectedAcademicYear,
    academicYearOptions,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedGradeId,
    setSelectedGradeId,
    selectedGroupId,
    setSelectedGroupId,
    selectedTeacherId,
    setSelectedTeacherId,
    resetFilters,
    // Computed period data
    dateBounds,
    kpis,
    // Daily revenue points for chart
    dailyRevenuePoints,
    // The 5 Numerical Tables
    monthlySummary,
    stageRevenue,
    groupRevenue,
    paymentTransactions,
    outstandingStudents,
    // Existing Preserved Features
    topGrade,
    topBook,
    unpaidStudents,
    gradesStats,
    booksStats,
    // Backward compatibility aliases
    customStartDate: "",
    setCustomStartDate: () => {},
    customEndDate: "",
    setCustomEndDate: () => {},
    selectedPaymentMethod: "all",
    setSelectedPaymentMethod: () => {},
    totalSubscriptionEarnings: kpis.subscriptionCollected,
    totalBookEarnings: kpis.bookCollected,
    totalExpenses: kpis.totalExpenses,
    totalGrossEarnings: kpis.totalCollected,
    totalNetProfit: kpis.netProfit,
    currentMonthNetProfit: kpis.netProfit,
    currentMonthGrossEarnings: kpis.totalCollected,
    currentMonthExpenses: kpis.totalExpenses,
    currentMonthBookEarnings: kpis.bookCollected,
    prevMonthSubEarnings,
    prevMonthBookEarnings,
    prevMonthExpenses,
    prevMonthGrossEarnings,
    prevMonthNetProfit,
    monthsReport: monthlySummary.map((m) => ({
      name: m.name,
      paidCount: m.payingCount,
      subscriptionEarnings: m.due - m.remaining,
      bookEarnings: m.collected - (m.due - m.remaining),
      monthExpenses: m.expenses,
      netProfit: m.netProfit,
      percentage: m.collectionRate,
      isCurrentMonth: m.isCurrentMonth,
    })),
    // Modals & inspection
    showUnpaid,
    setShowUnpaid,
    showAllGrades,
    setShowAllGrades,
    showAllBooks,
    setShowAllBooks,
    showPrintPreview,
    setShowPrintPreview,
    inspectedGradeId,
    setInspectedGradeId,
    // Export actions
    handleExportExcel,
    handlePrintStatement,
  };
}
