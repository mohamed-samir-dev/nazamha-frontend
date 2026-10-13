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
import type { Grade, Group, SubTeacher, MonthlySubscription, BookSale, Bill, Salary, TeacherExpense, Student } from "@/lib/types";
import { DEFAULT_ERROR } from "@/lib/errors";

export const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export interface StudentRow {
  id: string;
  name: string;
  code?: string;
  group_id: string | null;
  grade_id?: string | null;
}

export interface GradeStat {
  id: string;
  name: string;
  paidThisMonth: number;
  earnings: number;
}

export interface BookStat {
  id: string;
  name: string;
  price: number;
  count: number;
  earnings: number;
}

export interface MonthReport {
  name: string;
  paidCount: number;
  subscriptionEarnings: number;
  bookEarnings: number;
  monthExpenses: number;
  netProfit: number;
  percentage: number;
  isCurrentMonth: boolean;
}

// normalize أي قيمة لـ string (ObjectId أو string)
const s = (v: unknown): string => (v == null ? "" : typeof v === "string" ? v : String(v));

// الطالب المعفي لا يُحسب في الإيرادات — صفر دايماً
const netAmount = (sub: MonthlySubscription): number =>
  sub.status === "exempt"
    ? 0
    : Math.max(0, Number(sub.amount ?? 0) - Number(sub.discount ?? 0));

export function useFinancialReports() {
  // ── التاريخ الحالي يُحسب داخل الـ hook وليس على مستوى الـ module ──────────
  const now = useMemo(() => new Date(), []);
  const CURRENT_YEAR = now.getFullYear();
  const CURRENT_MONTH = now.getMonth(); // 0-based index

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subTeachers, setSubTeachers] = useState<SubTeacher[]>([]);
  const [allSubs, setAllSubs] = useState<MonthlySubscription[]>([]);
  const [allSales, setAllSales] = useState<BookSale[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [teacherExpenses, setTeacherExpenses] = useState<TeacherExpense[]>([]);
  const [hasCenterMode, setHasCenterMode] = useState(false);

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [showUnpaid, setShowUnpaid] = useState(false);
  const [showAllGrades, setShowAllGrades] = useState(false);
  const [showAllBooks, setShowAllBooks] = useState(false);

  const loadVersion = useRef(0);
  const load = useCallback(async (silent = false) => {
    const version = ++loadVersion.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      // استخدم in-memory cache للـ user — لا waterfall
      const user = await AuthService.getUser();
      if (!user || version !== loadVersion.current) return;

      const comparisonYear = CURRENT_MONTH === 0 ? CURRENT_YEAR - 1 : CURRENT_YEAR;
      const years = [...new Set([selectedYear, comparisonYear])];
      const forYears = async <T,>(fetchYear: (year: number) => Promise<T[]>): Promise<T[]> => (await Promise.all(years.map(fetchYear))).flat();
      const [teacher, studentsData, grps, grds, subsData, salesData, billsData, salariesData, expensesData] = await Promise.all([
        TeachersService.getTeacherProfile(user.id),
        StudentsService.getStudentsByTeacherId("id,name,code,group_id,grade_id"),
        GroupsService.getGroupsByTeacherId(),
        GradesService.getGradesByTeacherId(user.id),
        forYears(year => SubscriptionsService.getAllTeacherSubscriptions(year)),
        forYears(year => BooksService.getSales({ year: String(year) })),
        forYears(year => BillsService.getBillsByTeacherId(user.id, year)),
        forYears(year => SalariesService.getAll(year)),
        forYears(year => TeacherExpensesService.getAll({year})),
      ]);

      if (version !== loadVersion.current) return;

      const centerMode = teacher?.is_center_mode || false;
      setHasCenterMode(centerMode);
      if (centerMode) {
        const subs = await SubTeachersService.getSubTeachersByCenterId(user.id);
        if (version !== loadVersion.current) return;
        setSubTeachers(subs || []);
      }

      setGroups(grps || []);
      setGrades(grds || []);

      const normalizedStudents: StudentRow[] = (studentsData || []).map((st: Student & { _id?: string }) => ({
        id: s(st.id || st._id),
        name: st.name || "",
        code: st.code,
        group_id: s(st.group_id) || null,
        grade_id: s(st.grade_id) || null,
      }));
      setStudents(normalizedStudents);

      const normalizedSubs: MonthlySubscription[] = (subsData || []).map((sub: MonthlySubscription) => ({
        ...sub,
        id: s(sub.id || sub._id),
        student_id: s(sub.student_id),
        teacher_id: s(sub.teacher_id),
        month: Number(sub.month),
        year: Number(sub.year),
        amount: Number(sub.amount ?? 0),
        discount: Number(sub.discount ?? 0),
      }));
      setAllSubs(normalizedSubs);

      const activeSales = (salesData || []).filter((sale: BookSale) => sale.status === "active");
      setAllSales(activeSales);
      setBills(billsData || []);
      setSalaries(salariesData || []);
      setTeacherExpenses(expensesData || []);
    } catch (err: unknown) {
      if (version === loadVersion.current) setError(DEFAULT_ERROR);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }

  }, [selectedYear, CURRENT_MONTH, CURRENT_YEAR]);

  // initial load
  const lastLoadRef = useRef(0);
  useEffect(() => {
    void (async () => {
      await load();
      lastLoadRef.current = Date.now();
    })();
    return () => { loadVersion.current++; };
  }, [load]);

  // re-fetch on financial change event or tab visibility
  // throttle: لا تعيد الجلب إذا مضى أقل من 5 دقائق
  useEffect(() => {
    const THROTTLE_MS = 5 * 60 * 1000;
    let mutationTimer: ReturnType<typeof setTimeout>;
    const onEvent = () => { clearTimeout(mutationTimer); mutationTimer=setTimeout(()=>{lastLoadRef.current=Date.now();void load(true);},150); };
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

  // ── computed ──────────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() =>
    selectedTeacherId === "all"
      ? students
      : students.filter(st => {
          const grp = groups.find(g => g.id === st.group_id);
          return grp?.sub_teacher_id === selectedTeacherId;
        }),
    [students, groups, selectedTeacherId]
  );

  const studentIdSet = useMemo(
    () => new Set(filteredStudents.map(st => st.id)),
    [filteredStudents]
  );

  const getEffectiveGradeId = (st: StudentRow): string | null =>
    (st.grade_id && st.grade_id !== "null" ? st.grade_id : null)
    || groups.find(g => g.id === st.group_id)?.grade_id
    || null;

  // اشتراكات السنة المختارة، مدفوعة أو معفاة، للطلاب المفلترين فقط
  const yearSubs = useMemo(() =>
    allSubs.filter(sub =>
      sub.year === selectedYear &&
      (sub.status === "paid" || sub.status === "exempt") &&
      studentIdSet.has(s(sub.student_id))
    ),
    [allSubs, selectedYear, studentIdSet]
  );

  // مبيعات الكتب للطلاب المفلترين — بدون فلتر سنة (مستخدم لـ booksStats الكاملة)
  const filteredSales = useMemo(() =>
    allSales.filter(sale => {
      const sid = sale.student_id && typeof sale.student_id === "object"
        ? s((sale.student_id as { id?: string; _id?: string }).id || (sale.student_id as { id?: string; _id?: string })._id)
        : s(sale.student_id);
      return studentIdSet.has(sid);
    }),
    [allSales, studentIdSet]
  );

  // مبيعات الكتب للسنة المختارة فقط — تُستخدم في الـ KPIs والتقرير الشهري
  const yearFilteredSales = useMemo(() =>
    filteredSales.filter(sale => Number(sale.year) === selectedYear),
    [filteredSales, selectedYear]
  );

  const yearBills = useMemo(
    () => bills.filter(b => Number(b.billing_year) === selectedYear),
    [bills, selectedYear]
  );

  const yearSalaries = useMemo(
    () => salaries.filter(s => Number(s.year) === selectedYear),
    [salaries, selectedYear]
  );

  const yearTeacherExpenses = useMemo(
    () => teacherExpenses.filter(e => Number(e.year) === selectedYear),
    [teacherExpenses, selectedYear]
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalSubscriptionEarnings = yearSubs.reduce((sum, sub) => sum + netAmount(sub), 0);
  // FIX: use yearFilteredSales (selectedYear-scoped) not filteredSales (all years)
  const totalBookEarnings = yearFilteredSales.reduce((sum, sale) => sum + Number(sale.final_price ?? 0), 0);
  const totalExpenses = yearBills.reduce((sum, b) => sum + Number(b.amount ?? 0), 0)
    + yearSalaries.reduce((sum, s) => sum + Number(s.amount ?? 0), 0)
    + yearTeacherExpenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const totalGrossEarnings = totalSubscriptionEarnings + totalBookEarnings;
  const totalNetProfit = totalGrossEarnings - totalExpenses;

  const currentMonthNum = CURRENT_MONTH + 1; // 1-based
  const paidThisMonthCount = new Set(
    yearSubs.filter(sub => sub.month === currentMonthNum && sub.status === "paid").map(sub => s(sub.student_id))
  ).size;

  // ── الشهر السابق ──────────────────────────────────────────────────────────
  const prevMonthNum = CURRENT_MONTH === 0 ? 12 : CURRENT_MONTH; // 1-based
  const prevMonthYear = CURRENT_MONTH === 0 ? CURRENT_YEAR - 1 : CURRENT_YEAR;

  const prevSubs = allSubs.filter(sub =>
    sub.month === prevMonthNum && sub.year === prevMonthYear &&
    (sub.status === "paid" || sub.status === "exempt") &&
    studentIdSet.has(s(sub.student_id))
  );
  const prevMonthSubEarnings = prevSubs.reduce((sum, sub) => sum + netAmount(sub), 0);
  const prevMonthBookEarnings = filteredSales
    .filter(sale => sale.month === prevMonthNum && Number(sale.year) === prevMonthYear)
    .reduce((sum, sale) => sum + Number(sale.final_price ?? 0), 0);
  const prevMonthExpenses = bills
    .filter(b => Number(b.billing_month) === prevMonthNum && Number(b.billing_year) === prevMonthYear)
    .reduce((sum, b) => sum + Number(b.amount ?? 0), 0)
    + salaries
    .filter(s => Number(s.month) === prevMonthNum && Number(s.year) === prevMonthYear)
    .reduce((sum, s) => sum + Number(s.amount ?? 0), 0)
    + teacherExpenses
    .filter(e => Number(e.month) === prevMonthNum && Number(e.year) === prevMonthYear)
    .reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const prevMonthGrossEarnings = prevMonthSubEarnings + prevMonthBookEarnings;
  const prevMonthNetProfit = prevMonthGrossEarnings - prevMonthExpenses;

  // ── grades stats ──────────────────────────────────────────────────────────
  const gradesStats: GradeStat[] = useMemo(() => {
    const gradeIdsWithGroups = new Set(groups.map(g => g.grade_id).filter(Boolean));
    const result: GradeStat[] = grades.filter(grade => gradeIdsWithGroups.has(grade.id)).map(grade => {
      const gradeStudentIds = new Set(
        filteredStudents.filter(st => getEffectiveGradeId(st) === grade.id).map(st => st.id)
      );
      const gradeSubs = yearSubs.filter(sub => gradeStudentIds.has(s(sub.student_id)));
      const paidThisMonth = new Set(
        gradeSubs.filter(sub => sub.month === currentMonthNum && sub.status === "paid").map(sub => s(sub.student_id))
      ).size;
      const earnings = gradeSubs.reduce((sum, sub) => sum + netAmount(sub), 0);
      return { id: grade.id, name: grade.name, paidThisMonth, earnings };
    });

    // طلاب بدون سنة دراسية
    const generalIds = new Set(
      filteredStudents.filter(st => !getEffectiveGradeId(st)).map(st => st.id)
    );
    const generalSubs = yearSubs.filter(sub => generalIds.has(s(sub.student_id)));
    const generalPaid = new Set(
      generalSubs.filter(sub => sub.month === currentMonthNum && sub.status === "paid").map(sub => s(sub.student_id))
    ).size;
    const generalEarnings = generalSubs.reduce((sum, sub) => sum + netAmount(sub), 0);
    if (generalEarnings > 0 || generalPaid > 0) {
      result.push({ id: "general", name: "طلاب بدون سنة دراسية", paidThisMonth: generalPaid, earnings: generalEarnings });
    }

    return result.sort((a, b) => b.earnings - a.earnings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grades, filteredStudents, yearSubs, currentMonthNum, groups]);

  // ── books stats ───────────────────────────────────────────────────────────
  const booksStats: BookStat[] = useMemo(() => {
    const map = new Map<string, BookStat>();
    // Use yearFilteredSales so the breakdown matches the selected year KPIs
    for (const sale of yearFilteredSales) {
      const bookObj = typeof sale.book_id === "object" ? sale.book_id as { id?: string; _id?: string; name?: string; price?: number } : null;
      const bookId = bookObj ? s(bookObj.id || bookObj._id) : s(sale.book_id);
      const bookName = bookObj ? (bookObj.name || bookId) : bookId;
      const bookPrice = bookObj ? Number(bookObj.price ?? 0) : 0;
      const existing = map.get(bookId);
      if (existing) {
        existing.count += 1;
        existing.earnings += Number(sale.final_price ?? 0);
      } else {
        map.set(bookId, { id: bookId, name: bookName, price: bookPrice, count: 1, earnings: Number(sale.final_price ?? 0) });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.earnings - a.earnings);
  }, [yearFilteredSales]);

  // ── unpaid students ───────────────────────────────────────────────────────
  const unpaidStudents = useMemo(() => {
    const dueIds = new Set(
      allSubs
        .filter(sub =>
          sub.month === currentMonthNum && sub.year === selectedYear &&
          sub.status === "due" && studentIdSet.has(s(sub.student_id))
        )
        .map(sub => s(sub.student_id))
    );
    return filteredStudents
      .filter(st => dueIds.has(st.id))
      .map(st => ({
        id: st.id, name: st.name, code: st.code,
        gradeName: grades.find(g => g.id === getEffectiveGradeId(st))?.name,
        groupName: groups.find(g => g.id === st.group_id)?.name,
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubs, currentMonthNum, selectedYear, studentIdSet, filteredStudents, grades, groups]);

  // ── monthly breakdown ─────────────────────────────────────────────────────
  const monthsReport: MonthReport[] = useMemo(() =>
    ARABIC_MONTHS.map((name, index) => {
      const monthNum = index + 1;
      const monthSubs = yearSubs.filter(sub => sub.month === monthNum);
      const paidCount = new Set(monthSubs.filter(sub => sub.status === "paid").map(sub => s(sub.student_id))).size;
      const subscriptionEarnings = monthSubs.reduce((sum, sub) => sum + netAmount(sub), 0);
      // FIX: use yearFilteredSales — already scoped to selectedYear, no extra year check needed
      const bookEarnings = yearFilteredSales
        .filter(sale => sale.month === monthNum)
        .reduce((sum, sale) => sum + Number(sale.final_price ?? 0), 0);
      const monthExpenses = yearBills
        .filter(b => Number(b.billing_month) === monthNum)
        .reduce((sum, b) => sum + Number(b.amount ?? 0), 0)
        + yearSalaries
        .filter(s => Number(s.month) === monthNum)
        .reduce((sum, s) => sum + Number(s.amount ?? 0), 0)
        + yearTeacherExpenses
        .filter(e => Number(e.month) === monthNum)
        .reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
      const netProfit = subscriptionEarnings + bookEarnings - monthExpenses;
      const percentage = filteredStudents.length > 0
        ? Math.round((paidCount / filteredStudents.length) * 100)
        : 0;
      return {
        name, paidCount, subscriptionEarnings, bookEarnings,
        monthExpenses, netProfit, percentage,
        isCurrentMonth: index === CURRENT_MONTH && selectedYear === CURRENT_YEAR,
      };
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [yearSubs, yearFilteredSales, yearBills, yearSalaries, yearTeacherExpenses, filteredStudents, selectedYear, CURRENT_MONTH, CURRENT_YEAR]
  );

  return {
    loading, error,
    grades, groups, subTeachers,
    filteredStudents,
    selectedYear, setSelectedYear,
    selectedTeacherId, setSelectedTeacherId,
    hasCenterMode,
    CURRENT_YEAR, CURRENT_MONTH,
    // KPIs
    totalSubscriptionEarnings, totalBookEarnings,
    totalExpenses, totalGrossEarnings, totalNetProfit,
    paidThisMonthCount,
    // prev month
    prevMonthSubEarnings, prevMonthBookEarnings,
    prevMonthExpenses, prevMonthGrossEarnings, prevMonthNetProfit,
    // breakdowns
    gradesStats, booksStats, unpaidStudents, monthsReport,
    // modals
    showUnpaid, setShowUnpaid,
    showAllGrades, setShowAllGrades,
    showAllBooks, setShowAllBooks,
  };
}
