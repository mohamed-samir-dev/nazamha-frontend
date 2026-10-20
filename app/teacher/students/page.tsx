"use client";

import { useState, useEffect, useCallback, useRef, Fragment, useMemo } from "react";
import { CheckSquare, Square, AlertCircle, Printer, CreditCard, ChevronDown, ChevronUp, UserX, User, Trash2, Users, BookOpen } from "lucide-react";

import { Student, Group, Grade, Book, BookDef, MonthlySubscription, SubTeacher } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { TeachersService } from "@/lib/services/teachersService";
import { OfflineCache } from "@/lib/offlineQueue";
import { useDashboard } from "@/lib/DashboardContext";
import { useGroups } from "@/lib/hooks/useGroups";
import { SubTeachersService } from "@/lib/services/subTeachersService";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";
import { BooksService } from "@/lib/services/booksService";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { StudentTableRow } from "@/components/features/StudentTableRow";

import { printInPlace } from "@/lib/printInPlace";
import { AddStudentForm } from "./_components/AddStudentForm";
import { StudentsFilters } from "./_components/StudentsFilters";
import { BulkActionBar } from "./_components/BulkActionBar";
import { ConfirmDeleteDialog } from "./_components/ConfirmDeleteDialog";
import Link from "next/link";

const PAGE_SIZE = 20;

interface PendingConfirm {
  ids: string[];
  message: string;
}

export default function StudentsManagement() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const t = OfflineCache.loadTeacher();
    return (t?.id ?? (t as any)?._id) || null;
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [activePrintType, setActivePrintType] = useState<"payments" | "list" | null>(null);
  const printPending = useRef(false);
  const runPrint = async (type: "payments" | "list", action: () => Promise<void>) => {
    if (printPending.current) return;
    printPending.current = true;
    setActivePrintType(type);
    try { await action(); }
    catch (error) { showToast(error instanceof Error ? error.message : "تعذر تجهيز الطباعة.", "error"); }
    finally { printPending.current = false; setActivePrintType(null); }
  };

  const { groups } = useGroups();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>(() => {
    if (typeof window === "undefined") return [];
    const t = OfflineCache.loadTeacher();
    const currentUserId = (t?.id ?? (t as any)?._id) as string;
    return currentUserId ? OfflineCache.loadGrades(currentUserId) : [];
  });
  const [teacherBooks, setTeacherBooks] = useState<BookDef[]>([]);
  const [defaultMonthlyPrice, setDefaultMonthlyPrice] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const t = OfflineCache.loadTeacher();
    return Number(t?.monthly_price) || 0;
  });
  const pendingGroupIds = useRef(new Set<string>());
  const [groupUpdatingIds, setGroupUpdatingIds] = useState(new Set<string>());
  const [hasCenterMode, setHasCenterMode] = useState(false);
  const [subTeachers, setSubTeachers] = useState<SubTeacher[]>([]);
  const [activeMonths, setActiveMonths] = useState<number[]>([9,10,11,12,1,2,3,4,5]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGradeId, setFilterGradeId] = useState("all");
  const [filterSubTeacherId, setFilterSubTeacherId] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchInput, setSearchInput] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [subsMap, setSubsMap] = useState<Map<string, MonthlySubscription[]> | null>(null);
  const [bookCountsMap, setBookCountsMap] = useState<Record<string, string[]>>({});

  const [suspendToast, setSuspendToast] = useState<{ students: { id: string; name: string }[] } | null>(null);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const loadedQuery = useRef<string | null>(null);
  // نستخدم ref عشان نجمع تغييرات الفلتر ونبعت request واحد بس
  const pendingFilters = useRef<{ gradeId?: string; groupId?: string } | null>(null);
  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
        // إزالة تحديد طلاب المجموعة المطوية
        const groupStudentIds = new Set(
          (groupedStudents.find(g => g.key === groupKey)?.students ?? []).map(s => s.id)
        );
        setSelectedIds(prev => {
          const updated = new Set(prev);
          groupStudentIds.forEach(id => updated.delete(id));
          return updated;
        });
      }
      return next;
    });
  };

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  // Debounced search — wait 400ms before hitting server
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setSelectedIds(new Set()); }, [currentPage, searchQuery]);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("action") === "new") {
      setTimeout(() => {
        const formEl = document.querySelector(".panel-title, input[placeholder*='الاسم الكامل']");
        if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, []);

  const { data: dashData } = useDashboard();
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (event.key === "students-data-revision") setRefreshKey(k => k + 1); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Initial load: groups, grades, teacher profile (static data)
  useEffect(() => {
    let cancelled = false;
    async function loadStaticData() {
      try {
        // استخدم الـ teacher من DashboardContext أو OfflineCache — بدون /auth/me
        const teacherRaw = dashData?.teacher ?? OfflineCache.loadTeacher();
        if (!teacherRaw || cancelled) return;
        const currentUserId = (teacherRaw.id ?? teacherRaw._id) as string;
        setUserId(currentUserId);

        const [gradesData, teacherProfile, allBooks] = await Promise.all([
          GradesService.getGradesByTeacherId(currentUserId),
          // استخدم بيانات الـ teacher من الـ context مباشرة بدل طلب جديد
          dashData?.teacher
            ? Promise.resolve(dashData.teacher)
            : TeachersService.getTeacherProfile(currentUserId),
          BooksService.getBooks().catch(() => [] as Book[]),
        ]);
        if (cancelled) return;
        setGrades(gradesData);
        OfflineCache.saveGrades(gradesData, currentUserId);
        setTeacherBooks(allBooks.map((b: Book) => ({ id: b.id, name: b.name, price: b.price, grade_id: b.grade_id ?? undefined })));

        setDefaultMonthlyPrice(Number(teacherProfile?.monthly_price) || 0);
        const centerMode = teacherProfile?.is_center_mode || false;
        setHasCenterMode(centerMode);
        if (teacherProfile?.academic_year?.active_months?.length) {
          setActiveMonths(teacherProfile.academic_year.active_months);
        }
        if (centerMode) {
          const subs = await SubTeachersService.getSubTeachersByCenterId(currentUserId);
          if (!cancelled) setSubTeachers(subs);
        }
      } catch {
        if (!cancelled) showToast("حدث خطأ أثناء تحميل البيانات.", "error");
      }
    }
    loadStaticData();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashData?.teacher?.id]);

  // Load students page whenever filters or page changes
  useEffect(() => {
    const effectiveUserId = userId || (dashData?.teacher?.id ?? (dashData?.teacher as any)?._id) || (OfflineCache.loadTeacher()?.id ?? (OfflineCache.loadTeacher() as any)?._id);
    if (!effectiveUserId) return;
    if (!userId) setUserId(effectiveUserId);
    let cancelled = false;
    async function loadStudentsPage() {
      const queryKey = JSON.stringify([effectiveUserId, currentPage, searchQuery, activeFilter, filterGradeId, filterSubTeacherId]);
      // Refresh confirmed changes in the background; keep mounted rows and their data.
      if (loadedQuery.current !== queryKey) setLoading(true);
      try {
        const result = await StudentsService.getStudentsPaginated({
          page: currentPage,
          limit: PAGE_SIZE,
          search: searchQuery || undefined,
          group_id: activeFilter !== "all" ? (activeFilter === "none" ? "none" : activeFilter) : undefined,
          grade_id: filterGradeId !== "all" ? filterGradeId : undefined,
          sub_teacher_id: filterSubTeacherId !== "all" ? filterSubTeacherId : undefined,
        });
        if (cancelled) return;
        const mapped = result.students.map((s) => ({
          ...s,
          months: Array.isArray(s.months) && s.months.length === 12 ? s.months : Array(12).fill(false),
          received_books: Array.isArray(s.received_books) ? s.received_books : [],
        }));
        const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
        if (currentPage > lastPage) { setCurrentPage(lastPage); return; }
        setStudents(mapped);
        loadedQuery.current = queryKey;
        setTotalStudents(result.total);
        setLoading(false);

        const ids = mapped.map((s) => s.id).filter(Boolean);
        if (ids.length === 0) { setSubsMap(new Map()); return; }
        BooksService.getStudentBookCounts(ids).then(data => { if (!cancelled) setBookCountsMap(data); }).catch(() => { if (!cancelled) showToast("تعذر تحميل الكتب المستلمة.", "error"); });
        SubscriptionsService.getBatchSubscriptions(ids)
          .then((data) => {
            if (cancelled) return;
            const map = new Map<string, MonthlySubscription[]>();
            for (const [id, subs] of Object.entries(data)) map.set(id, subs);
            setSubsMap(map);
          })
          .catch(() => { if (!cancelled) setSubsMap(new Map()); });
      } catch {
        if (!cancelled) showToast("حدث خطأ أثناء تحميل الطلاب.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStudentsPage();
    return () => { cancelled = true; };
  // filterSubTeacherId مش هنا عمداً — filtering بتاعته client-side بس
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, activeFilter, filterGradeId, filterSubTeacherId, userId, refreshKey]);

  const studentGradeIds = useMemo(() => new Set(
    students.map((s) => s.grade_id || groups.find((g) => g.id === s.group_id)?.grade_id).filter(Boolean) as string[]
  ), [students, groups]);

  // Filtering is now server-side; client only filters by sub_teacher (center mode)
  const filteredStudents = students;

  // نجمع تغييرات الفلتر في timer واحد عشان لو اتغيرت السنة والمجموعة مع بعض يبعتوا request واحد بس
  const applyFilters = useCallback((gradeId?: string, groupId?: string) => {
    if (filterTimer.current) clearTimeout(filterTimer.current);
    pendingFilters.current = { ...pendingFilters.current, ...(gradeId !== undefined && { gradeId }), ...(groupId !== undefined && { groupId }) };
    filterTimer.current = setTimeout(() => {
      const f = pendingFilters.current;
      if (!f) return;
      if (f.gradeId !== undefined) setFilterGradeId(f.gradeId);
      if (f.groupId !== undefined) setActiveFilter(f.groupId);
      setCurrentPage(1);
      setSelectedIds(new Set());
      pendingFilters.current = null;
    }, 0);
  }, []);

  const handleFilterChange = useCallback((setter: (v: string) => void) => (v: string) => {
    setter(v);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  // ─── Group students by group_id ───────────────────────────────────────────
  const groupedStudents = useMemo(() => {
    const map = new Map<string, { label: string; students: Student[] }>();
    for (const s of filteredStudents) {
      const key = s.group_id || "__none__";
      const group = groups.find((g) => g.id === s.group_id);
      const label = group ? group.name : "بدون مجموعة";
      if (!map.has(key)) map.set(key, { label, students: [] });
      map.get(key)!.students.push(s);
    }
    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
  }, [filteredStudents, groups]);


  const visibleStudents = useMemo(() =>
    groupedStudents.flatMap(({ key, students: gs }) => {
      if (collapsedGroups.has(key)) return [];
      return gs;
    }),
    [groupedStudents, collapsedGroups]
  );

  // ─── Add Student ──────────────────────────────────────────────────────────
  const handleAddStudent = async (data: { name: string; gradeId: string; groupId: string; parentPhone: string; subTeacherId: string; customMonthlyPrice: number | null; subscriptionStartMonth: number; subscriptionStartYear: number; join_family_id?: string; create_new_family?: boolean; center_student_code?: string }) => {
    if (!data.name || !userId) { showToast("يرجى إدخال اسم الطالب.", "error"); return false; }
    if (!data.gradeId) { showToast("يرجى اختيار السنة الدراسية.", "error"); return false; }
    setActionLoading(true);
    try {
      const response = await StudentsService.addStudentWithGeneratedCode({
        teacher_id: userId,
        name: data.name,
        group_id: data.groupId || null,
        grade_id: data.gradeId,
        months: Array(12).fill(false),
        received_books: [],
        parent_phone: data.parentPhone,
        center_student_code: data.center_student_code,
        custom_monthly_price: data.customMonthlyPrice,
        subscription_start_month: data.subscriptionStartMonth,
        subscription_start_year: data.subscriptionStartYear,
        ...(data.join_family_id ? { join_family_id: data.join_family_id } : {}),
        ...(data.create_new_family ? { create_new_family: true } : {}),
});
      const { _subscriptions, ...rawStudent } = response as unknown as Student & { _subscriptions?: MonthlySubscription[] };
      const newStudent: Student = {
        ...rawStudent,
        months: Array.isArray(rawStudent.months) && rawStudent.months!.length === 12 ? rawStudent.months : Array(12).fill(false),
        received_books: Array.isArray(rawStudent.received_books) ? rawStudent.received_books : [],
      };
      // تحديث subsMap أولاً قبل students عشان StudentTableRow يلاقي الـ subsOverride موجود عند الـ mount
      setSubsMap(prev => {
        const newMap = new Map(prev ?? []);
        newMap.set(newStudent.id, _subscriptions ?? []);
        return newMap;
      });
      const matchesSearch = !searchQuery || newStudent.name.toLowerCase().includes(searchQuery.toLowerCase()) || (newStudent.code || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilters = matchesSearch && (filterGradeId === "all" || newStudent.grade_id === filterGradeId)
        && (activeFilter === "all" || (newStudent.group_id || "none") === activeFilter)
        && (filterSubTeacherId === "all" || groups.find(g => g.id === newStudent.group_id)?.sub_teacher_id === filterSubTeacherId);
      if (matchesFilters) {
        setTotalStudents(total => total + 1);
        if (currentPage === 1) setStudents(previous => [...previous, newStudent]
          .sort((a, b) => (a.code || "").localeCompare(b.code || "", "en") || a.id.localeCompare(b.id)).slice(0, PAGE_SIZE));
      }
      setCurrentPage(1);
      setRefreshKey(k => k + 1);
      // لو الفلتر مش على الـ grade بتاع الطالب الجديد، ارجع للـ all عشان يظهر
      if (filterGradeId !== "all" && newStudent.grade_id && filterGradeId !== newStudent.grade_id) {
        setFilterGradeId("all");
      }
      if (activeFilter !== "all" && activeFilter !== (newStudent.group_id || "none")) {
        setActiveFilter(newStudent.group_id || "none");
      }
      const familyMsg = data.join_family_id ? " — تم ربطه بالعائلة تلقائياً ✅" : "";
      showToast(`تم إضافة الطالب بنجاح.${familyMsg}`);
      return true;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "فشل إضافة الطالب.", "error");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoSuspend = async () => {
    setShowSuspendConfirm(false);
    setActionLoading(true);
    try {
      const result = await SubscriptionsService.autoSuspend(3);
      if (result.suspended === 0) {
        showToast("لا يوجد طلاب يستوفون شرط الإيقاف.");
      } else {
        setStudents(prev => prev.map(s =>
          result.students.some(r => r.id === s.id)
            ? { ...s, is_suspended: true, suspension_reason: "متأخرات لم تسدد (3 شهور أو أكثر)" }
            : s
        ));
        setSuspendToast({ students: result.students });
      }
    } catch {
      showToast("فشل تنفيذ الإيقاف التلقائي.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Delete with Confirm ──────────────────────────────────────────────────
  const handleDeleteStudent = useCallback((studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;
    setPendingConfirm({ ids: [studentId], message: `هل أنت متأكد من حذف "${target.name}"؟` });
  }, [students]);

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setPendingConfirm({ ids, message: `هل أنت متأكد من حذف ${ids.length} طالب؟` });
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingConfirm) return;
    const { ids } = pendingConfirm;
    setPendingConfirm(null);
    setSelectedIds(new Set());
    try {
      if (ids.length === 1) await StudentsService.deleteStudent(ids[0]);
      else await StudentsService.deleteStudents(ids);
      setRefreshKey(k => k + 1);
      showToast(ids.length === 1 ? "تم حذف الطالب بنجاح." : `تم حذف ${ids.length} طالب بنجاح.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "فشل الحذف من قاعدة البيانات.", "error");
    }
  }, [pendingConfirm]);

  const handleBulkMoveGroup = async (targetGroupId: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const newGroupId = targetGroupId === "none" ? null : targetGroupId;
    setActionLoading(true);
    try {
      await Promise.all(ids.map(id => StudentsService.updateStudent(id, { group_id: newGroupId })));
      setStudents(prev => prev.map(s => ids.includes(s.id) ? { ...s, group_id: newGroupId } : s));
      setSelectedIds(new Set());
      setRefreshKey(k => k + 1);
      const targetGroup = groups.find(g => g.id === newGroupId);
      showToast(`تم نقل ${ids.length} طالب إلى ${targetGroup ? targetGroup.name : "بدون مجموعة"} بنجاح.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "فشل نقل الطلاب.", "error");
    } finally {
      setActionLoading(false);
    }
  };


  const handleChangeGroup = useCallback(async (studentId: string, newGroupId: string) => {
    if (pendingGroupIds.current.has(studentId)) return;
    pendingGroupIds.current.add(studentId);
    setGroupUpdatingIds(new Set(pendingGroupIds.current));
    const targetGroupId = newGroupId === "" ? null : newGroupId;

    try {
      const response = await StudentsService.updateStudent(studentId, { group_id: targetGroupId });
      const { _subscriptions, ...updated } = response as Student & { _subscriptions?: MonthlySubscription[] };
      setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, ...updated } : s));
      const freshSubs = _subscriptions ?? await SubscriptionsService.getStudentSubscriptions(studentId).catch(() => null);
      if (freshSubs) setSubsMap(prev => new Map(prev ?? []).set(studentId, freshSubs));
      else showToast("تم النقل، لكن تعذر تحديث سجل الاشتراك.", "error");
      if (activeFilter !== "all" || filterSubTeacherId !== "all") setRefreshKey(k => k + 1);
      if (freshSubs) showToast("تم النقل بنجاح.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "فشل نقل الطالب.", "error");
    } finally {
      pendingGroupIds.current.delete(studentId);
      setGroupUpdatingIds(new Set(pendingGroupIds.current));
    }
  }, [activeFilter, filterSubTeacherId]);


  // ─── Selection ────────────────────────────────────────────────────────────
  const toggleSelectStudent = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSubsChanged = useCallback((studentId: string, updatedSubs: MonthlySubscription[]) => {
    setSubsMap(prev => {
      const newMap = new Map(prev ?? []);
      newMap.set(studentId, updatedSubs);
      return newMap;
    });
  }, []);

  const handleStudentUpdate = useCallback((studentId: string, updated: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, ...updated } : s));
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleStudents.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(visibleStudents.map((s) => s.id)));
  };

  const allSelected = visibleStudents.length > 0 && selectedIds.size === visibleStudents.length;

  const getPrintStudents = async () => selectedIds.size > 0
    ? students.filter(s => selectedIds.has(s.id))
    : !loading && totalStudents === students.length ? students
    : StudentsService.getAllMatchingStudents({ search: searchQuery || undefined, grade_id: filterGradeId === "all" ? undefined : filterGradeId, group_id: activeFilter === "all" ? undefined : activeFilter, sub_teacher_id: filterSubTeacherId === "all" ? undefined : filterSubTeacherId });

  // ─── Print Payment Report ─────────────────────────────────────────────────
  const handlePrintPayments = async () => {
    const MONTH_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

    let printStudents: Student[] = [];
    let allSubs: MonthlySubscription[] = [];
    try {
      printStudents = await getPrintStudents();
      const missingStudentIds = printStudents
        .map(s => s.id)
        .filter(id => !subsMap?.has(id));

      if (missingStudentIds.length > 0) {
        const chunks: string[][] = [];
        for (let i = 0; i < missingStudentIds.length; i += 100) {
          chunks.push(missingStudentIds.slice(i, i + 100));
        }
        const batches = await Promise.all(
          chunks.map(chunk => SubscriptionsService.getBatchSubscriptions(chunk, true))
        );
        for (const batch of batches) {
          allSubs.push(...Object.values(batch).flat());
        }
      }
      if (subsMap) {
        for (const s of printStudents) {
          if (!missingStudentIds.includes(s.id) && subsMap.has(s.id)) {
            allSubs.push(...(subsMap.get(s.id) ?? []));
          }
        }
      }
    } catch { showToast("تعذر تحميل تقرير الدفع. حاول مرة أخرى.", "error"); return; }

    const now = new Date();
    const nowMonth = now.getMonth() + 1;
    const nowYear = now.getFullYear();

    // Build map: studentId -> Map<"month-year", status>
    const printSubsStatusMap = new Map<string, Map<string, string>>();
    for (const sub of allSubs) {
      if (sub.status === "not_due") continue;
      if (!printSubsStatusMap.has(sub.student_id)) printSubsStatusMap.set(sub.student_id, new Map());
      printSubsStatusMap.get(sub.student_id)!.set(`${sub.month}-${sub.year}`, sub.status);
    }

    // Collect all unique month-year combos that appear across filtered students, sorted
    const monthYearSet = new Set<string>();
    for (const s of printStudents) {
      const studentSubs = printSubsStatusMap.get(s.id);
      if (studentSubs) studentSubs.forEach((_, key) => monthYearSet.add(key));
    }
    const monthYearCols = Array.from(monthYearSet)
      .map(k => { const [m, y] = k.split("-").map(Number); return { key: k, month: m, year: y }; })
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

    if (monthYearCols.length === 0) {
      alert("لا توجد بيانات دفع مسجلة للطلاب المحددين.");
      return;
    }

    const headerCells = monthYearCols.map(({ month, year }) =>
      `<th style="border:1px solid #ddd;padding:5px 8px;min-width:55px;font-size:11px">${MONTH_NAMES[month-1]}<br/><span style="font-weight:400;color:#888">${year}</span></th>`
    ).join("") + `<th style="border:1px solid #ddd;padding:5px 8px;min-width:70px;background:#e8f5e9">الإجمالي</th>`;

    const rows = printStudents.map((s, i) => {
      const studentSubs = printSubsStatusMap.get(s.id);
      let paid = 0, total = 0;
      const monthCells = monthYearCols.map(({ key, month, year }) => {
        const status = studentSubs?.get(key);
        if (!status) return `<td style="border:1px solid #ddd;padding:5px 8px;text-align:center;color:#ccc">—</td>`;
        total++;
        const isFuture = year > nowYear || (year === nowYear && month > nowMonth);
        let color: string, label: string;
        if (status === "paid")        { color = "#10b981"; label = "✓"; paid++; }
        else if (status === "exempt") { color = "#f59e0b"; label = "م"; paid++; }
        else if (isFuture)            { color = "#aaa";    label = "○"; }
        else                          { color = "#ef4444"; label = "✗"; }
        return `<td style="border:1px solid #ddd;padding:5px 8px;text-align:center;font-size:15px;font-weight:700;color:${color}">${label}</td>`;
      }).join("");
      const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
      const cardColor = pct === 100 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
      const summaryCell = `<td style="border:1px solid #ddd;padding:5px 8px;text-align:center;background:#f9fffe">
        <div style="font-size:15px;font-weight:800;color:${cardColor};line-height:1">${paid}</div>
        <div style="font-size:10px;color:#888;margin:1px 0">من ${total}</div>
        <div style="width:100%;height:4px;background:#eee;border-radius:99px;overflow:hidden;margin-top:3px">
          <div style="height:100%;width:${pct}%;background:${cardColor};border-radius:99px"></div>
        </div>
        <div style="font-size:9px;color:#aaa;margin-top:1px">${pct}%</div>
      </td>`;
      return `<tr>
        <td style="border:1px solid #ddd;padding:5px 8px;text-align:center">${i + 1}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;font-family:monospace;text-align:center">${s.center_student_code || s.code || "—"}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;font-weight:600">${s.name}</td>
        ${monthCells}
        ${summaryCell}
      </tr>`;
    }).join("");

    const legend = `<div style="display:flex;gap:16px;margin-bottom:10px;font-size:12px">
      <span><b style="color:#10b981">✓</b> مدفوع</span>
      <span><b style="color:#f59e0b">م</b> معفي</span>
      <span><b style="color:#ef4444">✗</b> مستحق</span>
      <span><b style="color:#aaa">○</b> لسه ما جاش وقته</span>
      <span style="color:#ccc">— غير مسجل</span>
    </div>`;

    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>تقرير الدفع</title>
      <style>
        @page{size:A4 landscape;margin:16mm 18mm 18mm 18mm}
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:12px;margin:0;padding:3mm;color:#111;background:#fff;direction:rtl;overflow-wrap:anywhere}
        table{border-collapse:collapse;width:100%;table-layout:fixed}
        th{background:#f3f4f6;padding:5px 7px;border:1px solid #ccc;font-size:11px;white-space:nowrap}
        td{padding:4px 7px;border:1px solid #ddd;white-space:nowrap}
        tr:nth-child(even) td{background:#fafafa}
        thead{display:table-header-group} tr{break-inside:avoid}
        th,td{white-space:normal!important;min-width:0!important;overflow-wrap:anywhere}
        th:first-child,td:first-child{width:40px;white-space:nowrap!important}
        th:nth-child(2),td:nth-child(2){width:80px}
        th:nth-child(3),td:nth-child(3){width:140px}

        .mobile-print-btn {
          display: none;
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #111;
          color: #fff;
          border: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          z-index: 9999;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          font-family: inherit;
        }

        @media print{ .mobile-print-btn { display: none !important; } }
        @media (max-width: 768px) { .mobile-print-btn { display: block; } }
      </style>
    </head><body>
      <h2 style="text-align:center;margin-bottom:4px">تقرير الدفع</h2>
      <p style="text-align:center;color:#666;margin-bottom:8px">إجمالي: ${printStudents.length} طالب — ${new Date().toLocaleDateString("ar-EG")}</p>
      ${legend}
      <table><thead><tr>
        <th style="border:1px solid #ddd;padding:6px">#</th>
        <th style="border:1px solid #ddd;padding:6px">الكود</th>
        <th style="border:1px solid #ddd;padding:6px">الاسم</th>
        ${headerCells}
      </tr></thead><tbody>${rows}</tbody></table>
    </body></html>`;

    await printInPlace({ html });
  };

  // ─── Print ────────────────────────────────────────────────────────────────
  const handlePrint = async () => {
    let printStudents: Student[];
    try { printStudents = await getPrintStudents(); } catch { showToast("تعذر تحميل قائمة الطباعة.", "error"); return; }
    const rows = printStudents.map((s, i) => {
      const group = groups.find((g) => g.id === s.group_id);
      const grade = grades.find((g) => g.id === (s.grade_id || groups.find((gr) => gr.id === s.group_id)?.grade_id));
      const startM = s.subscription_start_month;
      const startY = s.subscription_start_year;
      const startInfo = startM && startY ? `${["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"][startM-1]} ${startY}` : "—";
      return `<tr>
        <td style="border:1px solid #ddd;padding:5px 8px;text-align:center">${i + 1}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;font-family:monospace;text-align:center">${s.center_student_code || s.code || "—"}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;font-weight:600">${s.name}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;text-align:center">${grade?.name || "—"}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;text-align:center">${group?.name || "—"}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;text-align:center">${s.parent_phone || "—"}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;text-align:center">${startInfo}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
      <title>قائمة الطلاب</title>
      <style>
        @page{size:A4 landscape;margin:16mm 18mm 18mm 18mm}
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:12px;margin:0;padding:3mm;color:#111;background:#fff;direction:rtl;overflow-wrap:anywhere}
        table{border-collapse:collapse;width:100%;table-layout:fixed}
        th{background:#f3f4f6;padding:5px 7px;border:1px solid #ccc;font-size:11px;white-space:nowrap}
        td{padding:4px 7px;border:1px solid #ddd;white-space:nowrap}
        tr:nth-child(even) td{background:#fafafa}
        thead{display:table-header-group} tr{break-inside:avoid}
        th,td{white-space:normal!important;min-width:0!important;overflow-wrap:anywhere}
        th:first-child,td:first-child{width:40px;white-space:nowrap!important}
        th:nth-child(2),td:nth-child(2){width:80px}
        th:nth-child(3),td:nth-child(3){width:140px}
      </style>
    </head><body>
      <h2 style="text-align:center;margin-bottom:4px">قائمة الطلاب</h2>
      <p style="text-align:center;color:#666;margin-bottom:12px">إجمالي: ${printStudents.length} طالب — ${new Date().toLocaleDateString("ar-EG")}</p>
      <table><thead><tr>
        <th style="border:1px solid #ddd;padding:6px">#</th>
        <th style="border:1px solid #ddd;padding:6px">الكود</th>
        <th style="border:1px solid #ddd;padding:6px">الاسم</th>
        <th style="border:1px solid #ddd;padding:6px">السنة</th>
        <th style="border:1px solid #ddd;padding:6px">المجموعة</th>
        <th style="border:1px solid #ddd;padding:6px">هاتف ولي الأمر</th>
        <th style="border:1px solid #ddd;padding:6px">بداية الاشتراك</th>
      </tr></thead><tbody>${rows}</tbody></table>
    </body></html>`;

    await printInPlace({ html });
  };

  if (!userId && loading) return <Spinner fullScreen />;

  return (
    <div style={{ 
      marginTop: "0",
      marginRight: "calc(-2rem)",
      marginBottom: "calc(-2rem)",
      marginLeft: "calc(-2rem)",
      padding: "0"
    }}
    className="students-page-container">
      <style jsx>{`
        @media (max-width: 768px) {
          .students-page-container {
            margin-right: calc(-0.75rem) !important;
            margin-bottom: calc(-0.75rem) !important;
            margin-left: calc(-0.75rem) !important;
          }
          .students-header-section {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .students-page-container {
            margin-right: calc(-1.5rem) !important;
            margin-bottom: calc(-1.5rem) !important;
            margin-left: calc(-1.5rem) !important;
          }
          .students-header-section {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }
        @media (min-width: 1025px) {
          .students-header-section {
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }
      `}</style>
      {/* Header Section with Padding */}
      <div className="students-header-section">
      {/* Header */}
      <div className="mb-4">
        {/* Row 1: العنوان + الأزرار */}
        <div className="students-page-header">
          <div>
            <h1 className="students-page-title mb-1">إدارة الطلاب</h1>
            <p className="text-slate-400 text-sm">إضافة الطلاب وإدارة الاشتراكات والكتب المستلمة</p>
          </div>
          <div className="students-header-actions">
            <Link className="btn btn-primary" href="/teacher/students/payment-scan"><CreditCard size={16} />
              سكان الدفع
            </Link>
            <Button variant="danger" onClick={() => setShowSuspendConfirm(true)} isLoading={actionLoading} leftIcon={<UserX size={16} />}>
              إيقاف المتأخرين
            </Button>
            <Button
              variant="secondary"
              disabled={activePrintType !== null || loading}
              onClick={() => void runPrint("payments", handlePrintPayments)}
              leftIcon={<Printer size={16} />}
            >
              {activePrintType === "payments" ? "جاري تجهيز الطباعة…" : "طباعة تقرير الدفع"}
            </Button>

          </div>
        </div>
        <details style={{ marginTop: 12 }}><summary style={{ cursor: "pointer", color: "var(--text-muted)", fontSize: 13 }}>دليل الألوان وإجراءات الطلاب</summary>
        <div className="students-legend" style={{ marginTop: "0.75rem" }}>
          <div className="students-legend-section">
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>دلالة الألوان</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {([
                { color: "#10b981", border: "rgba(16,185,129,0.4)",   bg: "rgba(16,185,129,0.12)",  label: "مدفوع" },
                { color: "#f59e0b", border: "rgba(245,158,11,0.4)",   bg: "rgba(245,158,11,0.12)",  label: "معفي" },
                { color: "#ef4444", border: "rgba(239,68,68,0.5)",    bg: "rgba(239,68,68,0.12)",   label: "مستحق (الشهر الحالي)" },
                { color: "#64748b", border: "rgba(100,116,139,0.35)", bg: "rgba(100,116,139,0.08)", label: "مستحق (شهر قادم)" },
              ] as const).map(({ color, border, bg, label }) => (
                <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 7px", borderRadius: "999px", background: bg, border: `1px solid ${border}`, color, fontWeight: 500, fontSize: "0.8rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="students-legend-section">
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>عمود الكتب</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {([
                { color: "#10b981", label: "استلم كل كتب صفه",  example: "2/2" },
                { color: "#f59e0b", label: "استلم بعض الكتب",   example: "1/2" },
                { color: "var(--text-muted)", label: "لم يستلم أي كتاب", example: "0/2" },
              ] as const).map(({ color, label, example }) => (
                <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                  <BookOpen size={12} style={{ color, flexShrink: 0 }} />
                  <span>
                    <strong style={{ color }}>{example}</strong> — {label}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div className="students-legend-section">
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>أزرار الإجراءات</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {([
                { icon: <User size={12} />,   color: "#60a5fa", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)",  label: "ملف الطالب — عرض كل بيانات الطالب وسجل الدفع" },
                { icon: <Trash2 size={12} />, color: "#f87171", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   label: "حذف — حذف الطالب نهائياً" },
                { icon: <UserX size={12} />,  color: "#f87171", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)",  label: "إيقاف — منع الطالب من تسجيل الحضور حتى يسدد" },
                { icon: <Users size={12} />,  color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  label: "ربط بعائلة — للاستفادة من خصم الإخوة" },
              ] as const).map(({ icon, color, bg, border, label }) => (
                <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "5px", background: bg, border: `1px solid ${border}`, color, flexShrink: 0 }}>{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
        </details>
      </div>
      </div>

      {/* Main Content without padding */}
      <div className="dashboard-grid" style={{ alignItems: "start", gap: "0.75rem" }}>
        {/* Sidebar */}
        <aside className="flex flex-col gap-3">
          <AddStudentForm
            grades={grades}
            groupsProp={groups}
            hasCenterMode={hasCenterMode}
            subTeachers={subTeachers}
            isLoading={actionLoading}
            activeMonths={activeMonths}
            onSubmit={handleAddStudent}
            onBulkDone={(inserted) => {
              showToast(`تم إضافة ${inserted.length} طالب بنجاح! ✓`);
              setCurrentPage(1);
              setRefreshKey(k => k + 1);
            }}
          />



        </aside>

        {/* Main Table Panel */}
        <div className="glass-panel flex flex-col" style={{ minHeight: "600px", padding: "0.75rem 0 0" }}>
          <div className="px-4">
          <StudentsFilters
            grades={grades}
            groups={groups}
            studentGradeIds={studentGradeIds}
            hasCenterMode={hasCenterMode}
            subTeachers={subTeachers}
            searchQuery={searchInput}
            filterGradeId={filterGradeId}
            filterSubTeacherId={filterSubTeacherId}
            activeFilter={activeFilter}
            onSearchChange={(v) => setSearchInput(v)}
            onGradeChange={handleFilterChange(setFilterGradeId)}
            onSubTeacherChange={handleFilterChange(setFilterSubTeacherId)}
            onGroupChange={handleFilterChange(setActiveFilter)}
            onApplyFilters={applyFilters}
            onPrint={() => void runPrint("list", handlePrint)}
            preparingPrint={activePrintType === "list"}
            disabled={activePrintType !== null || loading}
            selectedCount={selectedIds.size}
          />
          </div>

          <div className="px-4">
          <BulkActionBar
            count={selectedIds.size}
            isLoading={actionLoading}
            groups={groups}
            onDelete={handleBulkDelete}
            onClear={() => setSelectedIds(new Set())}
            onMoveGroup={handleBulkMoveGroup}
          />
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-[rgba(8,12,20,0.4)]" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="students-table" style={{ minWidth: "900px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "center", minWidth: "40px" }}>
                    <button onClick={toggleSelectAll} className="bg-transparent border-0 cursor-pointer text-slate-400 flex mx-auto" title="تحديد الكل">
                      {allSelected ? <CheckSquare size={18} className="color-teal" /> : <Square size={18} />}
                    </button>
                  </th>
                  <th style={{ textAlign: "center", minWidth: "70px" }}>الكود</th>
                  <th style={{ textAlign: "center", minWidth: "110px" }}>السنة</th>
                  <th style={{ minWidth: "180px" }}>الاسم</th>
                  <th style={{ textAlign: "center", minWidth: "260px" }}>المجموعة</th>
                  <th style={{ textAlign: "center", minWidth: "280px" }}>الأشهر المستحقة</th>
                  <th style={{ textAlign: "center", minWidth: "90px" }}>الاشتراك</th>
                  <th style={{ textAlign: "center", minWidth: "130px" }}>الكتب</th>
                  <th style={{ textAlign: "center", minWidth: "80px" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center p-12"><Spinner /></td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-12">
                      <div className="flex flex-col items-center gap-4 text-slate-500 mx-auto">
                        <AlertCircle size={44} className="opacity-40" />
                        <p className="text-slate-400">لا يوجد طلاب للفلتر المحدد</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  groupedStudents.map(({ key, label, students: groupStudents }) => {
                    const isCollapsed = collapsedGroups.has(key);
                    return (
                      <Fragment key={key}>
                        <tr>
                          <td colSpan={9} style={{ padding: "0", borderBottom: "none" }}>
                            <button
                              onClick={() => toggleGroupCollapse(key)}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.55rem 1rem", background: "rgba(20,184,166,0.06)", border: "none", borderTop: "1px solid rgba(20,184,166,0.15)", borderBottom: isCollapsed ? "1px solid rgba(20,184,166,0.15)" : "none", cursor: "pointer", textAlign: "right" }}
                            >
                              {isCollapsed ? <ChevronDown size={15} color="var(--color-teal)" /> : <ChevronUp size={15} color="var(--color-teal)" />}
                              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--color-teal)" }}>{label}</span>
                              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginRight: "auto" }}>
                                {groupStudents.length} {totalStudents > PAGE_SIZE ? "طالب في هذه الصفحة" : "طالب"}
                              </span>
                            </button>
                          </td>
                        </tr>
                        {!isCollapsed && groupStudents.map((student, idx) => {
                          const studentSubs = subsMap?.get(student.id);
                          
                          return (
                            <Fragment key={student.id ?? `student-${idx}`}>
                              <StudentTableRow
                                key={student.id}
                                student={student}
                                defaultMonthlyPrice={defaultMonthlyPrice}
                                groupUpdating={groupUpdatingIds.has(student.id)}
                                groups={groups}
                                grades={grades}
                                teacherBooks={teacherBooks}
                                isSelected={selectedIds.has(student.id)}
                                subsOverride={studentSubs}
                                subsLoading={subsMap === null}
                                purchasedBookIds={bookCountsMap[student.id]}
                                onToggleSelect={toggleSelectStudent}
                                onDelete={handleDeleteStudent}
                                onUpdateGroup={handleChangeGroup}
                                onSubsChanged={handleSubsChanged}
                                onStudentUpdate={handleStudentUpdate}
                              />
                            </Fragment>
                          );
                        })}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>


          {/* Pagination */}
          {totalStudents > PAGE_SIZE && (
            <div className="px-4" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: "8px", color: currentPage === 1 ? "var(--text-muted)" : "var(--color-teal)", cursor: currentPage === 1 ? "not-allowed" : "pointer", padding: "0.35rem 0.9rem", fontSize: "0.82rem", fontWeight: 600 }}
              >
                السابق
              </button>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                صفحة {currentPage} من {Math.ceil(totalStudents / PAGE_SIZE)} — إجمالي {totalStudents} طالب
              </span>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(totalStudents / PAGE_SIZE)}
                style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: "8px", color: currentPage >= Math.ceil(totalStudents / PAGE_SIZE) ? "var(--text-muted)" : "var(--color-teal)", cursor: currentPage >= Math.ceil(totalStudents / PAGE_SIZE) ? "not-allowed" : "pointer", padding: "0.35rem 0.9rem", fontSize: "0.82rem", fontWeight: 600 }}
              >
                التالي
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Suspend Confirm Modal */}
      {showSuspendConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#1e2433] rounded-2xl p-6 max-w-[420px] w-full border border-red-500/30">
            <div className="flex items-center gap-2 mb-3">
              <UserX size={20} color="#ef4444" />
              <span className="font-bold text-base text-red-400">إيقاف الطلاب المتأخرين</span>
            </div>
            <p className="text-sm text-slate-400 mb-2 leading-relaxed">
              سيتم إيقاف كل الطلاب الذين عليهم <strong className="text-amber-400">3 شهور متأخرة أو أكثر</strong> لم يسددوها.
            </p>
            <p className="text-sm text-slate-500 mb-5">هل أنت متأكد من المتابعة؟</p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowSuspendConfirm(false)}>إلغاء</Button>
              <Button variant="danger" onClick={handleAutoSuspend} isLoading={actionLoading} leftIcon={<UserX size={16} />}>تأكيد الإيقاف</Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Result Toast */}
      {suspendToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] min-w-[320px] max-w-[480px] w-[90vw]">
          <div className="bg-[#1e2433] border border-red-500/40 rounded-xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <UserX size={17} color="#ef4444" />
              <span className="font-bold text-red-400 text-sm">تم إيقاف {suspendToast.students.length} طالب</span>
              <button onClick={() => setSuspendToast(null)} className="mr-auto bg-transparent border-0 cursor-pointer text-slate-500 text-lg leading-none">✕</button>
            </div>
            <div className="flex flex-col gap-0.5 max-h-[140px] overflow-y-auto mb-3">
              {suspendToast.students.map(s => (
                <span key={s.id} className="text-xs text-slate-400 pr-1">• {s.name}</span>
              ))}
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-400 leading-relaxed">
              ⚠ هؤلاء الطلاب لن يتمكنوا من تسجيل الحضور حتى يسددوا مستحقاتهم.
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {pendingConfirm && (
        <ConfirmDeleteDialog
          message={pendingConfirm.message}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingConfirm(null)}
        />
      )}



    </div>
  );
}
