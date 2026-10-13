"use client";

import { useState, useEffect, useCallback, useRef, Fragment, useMemo } from "react";
import { CheckSquare, Square, AlertCircle, Printer, CreditCard, ChevronDown, ChevronUp, UserX, User, Trash2, Users, BookOpen, RefreshCw } from "lucide-react";

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
import { StudentProfileModal } from "@/components/features/StudentProfileModal";

import { printHtml } from "@/lib/printHtml";
import { AddStudentForm } from "./_components/AddStudentForm";
import { StudentsFilters } from "./_components/StudentsFilters";
import { BulkActionBar } from "./_components/BulkActionBar";
import { ConfirmDeleteDialog } from "./_components/ConfirmDeleteDialog";
import { PaymentScanModal } from "./_components/PaymentScanModal";

const PAGE_SIZE = 20;

interface PendingConfirm {
  ids: string[];
  message: string;
}

export default function StudentsManagement() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { groups } = useGroups();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teacherBooks, setTeacherBooks] = useState<BookDef[]>([]);
  const [hasCenterMode, setHasCenterMode] = useState(false);
  const [subTeachers, setSubTeachers] = useState<SubTeacher[]>([]);
  const [activeMonths, setActiveMonths] = useState<number[]>([9,10,11,12,1,2,3,4,5]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGradeId, setFilterGradeId] = useState("all");
  const [filterSubTeacherId, setFilterSubTeacherId] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [groupPages, setGroupPages] = useState<Map<string, number>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchInput, setSearchInput] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showPaymentScan, setShowPaymentScan] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [subsMap, setSubsMap] = useState<Map<string, MonthlySubscription[]> | null>(null);
  const [bookCountsMap, setBookCountsMap] = useState<Record<string, string[]>>({});

  const [suspendToast, setSuspendToast] = useState<{ students: { id: string; name: string }[] } | null>(null);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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

  const { data: dashData } = useDashboard();

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

        const [gradesData, teacherProfile, bookCounts, allBooks] = await Promise.all([
          GradesService.getGradesByTeacherId(currentUserId),
          // استخدم بيانات الـ teacher من الـ context مباشرة بدل طلب جديد
          dashData?.teacher
            ? Promise.resolve(dashData.teacher)
            : TeachersService.getTeacherProfile(currentUserId),
          BooksService.getStudentBookCounts().catch(() => ({} as Record<string, string[]>)),
          BooksService.getBooks().catch(() => [] as Book[]),
        ]);
        if (cancelled) return;
        setBookCountsMap(bookCounts);
        setGrades(gradesData);
        OfflineCache.saveGrades(gradesData, currentUserId);
        setTeacherBooks(allBooks.map((b: Book) => ({ id: b.id, name: b.name, price: b.price, grade_id: b.grade_id ?? undefined })));

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
  }, [dashData]);

  // Load students page whenever filters or page changes
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function loadStudentsPage() {
      setLoading(true);
      setSubsMap(null);
      try {
        const result = await StudentsService.getStudentsPaginated({
          page: currentPage,
          limit: PAGE_SIZE,
          search: searchQuery || undefined,
          group_id: activeFilter !== "all" ? (activeFilter === "none" ? "none" : activeFilter) : undefined,
          grade_id: filterGradeId !== "all" ? filterGradeId : undefined,
        });
        if (cancelled) return;
        const mapped = result.students.map((s) => ({
          ...s,
          months: Array.isArray(s.months) && s.months.length === 12 ? s.months : Array(12).fill(false),
          received_books: Array.isArray(s.received_books) ? s.received_books : [],
        }));
        setStudents(mapped);
        setTotalStudents(result.total);
        setLoading(false);

        const ids = mapped.map((s) => s.id).filter(Boolean);
        if (ids.length === 0) { setSubsMap(new Map()); return; }
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
  }, [currentPage, searchQuery, activeFilter, filterGradeId, userId, refreshKey]);

  const studentGradeIds = useMemo(() => new Set(
    students.map((s) => s.grade_id || groups.find((g) => g.id === s.group_id)?.grade_id).filter(Boolean) as string[]
  ), [students, groups]);

  // Filtering is now server-side; client only filters by sub_teacher (center mode)
  const filteredStudents = useMemo(() =>
    hasCenterMode && filterSubTeacherId !== "all"
      ? students.filter((s) => {
          const studentSubTId = groups.find((g) => g.id === s.group_id)?.sub_teacher_id;
          return studentSubTId === filterSubTeacherId;
        })
      : students,
    [students, hasCenterMode, filterSubTeacherId, groups]
  );

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
      setGroupPages(new Map());
      setSelectedIds(new Set());
      pendingFilters.current = null;
    }, 0);
  }, []);

  const handleFilterChange = useCallback((setter: (v: string) => void) => (v: string) => {
    setter(v);
    setCurrentPage(1);
    setGroupPages(new Map());
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

  const getGroupPage = (_key: string) => 1;
  const setGroupPage = (_key: string, _page: number) => {};

  const visibleStudents = useMemo(() =>
    groupedStudents.flatMap(({ key, students: gs }) => {
      if (collapsedGroups.has(key)) return [];
      return gs;
    }),
    [groupedStudents, collapsedGroups]
  );

  // ─── Add Student ──────────────────────────────────────────────────────────
  const handleAddStudent = async (data: { name: string; gradeId: string; groupId: string; parentPhone: string; subTeacherId: string; customMonthlyPrice: number | null; subscriptionStartMonth: number; subscriptionStartYear: number; join_family_id?: string; create_new_family?: boolean }) => {
    if (!data.name || !userId) { showToast("يرجى إدخال اسم الطالب.", "error"); return; }
    if (!data.gradeId) { showToast("يرجى اختيار السنة الدراسية.", "error"); return; }
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
      setStudents((prev) => prev.some((s) => s.id === newStudent.id) ? prev : [...prev, newStudent]);
      // لو الفلتر مش على الـ grade بتاع الطالب الجديد، ارجع للـ all عشان يظهر
      if (filterGradeId !== "all" && newStudent.grade_id && filterGradeId !== newStudent.grade_id) {
        setFilterGradeId("all");
      }
      if (activeFilter !== "all" && activeFilter !== (newStudent.group_id || "none")) {
        setActiveFilter(newStudent.group_id || "none");
      }
      const familyMsg = data.join_family_id ? " — تم ربطه بالعائلة تلقائياً ✅" : "";
      showToast(`تم إضافة الطالب بنجاح.${familyMsg}`);
      setShowRefreshHint(true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "فشل إضافة الطالب.", "error");
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
      setStudents((prev) => prev.filter((s) => !ids.includes(s.id)));
      showToast(ids.length === 1 ? "تم حذف الطالب بنجاح." : `تم حذف ${ids.length} طالب بنجاح.`);
    } catch {
      showToast("فشل الحذف من قاعدة البيانات.", "error");
    }
  }, [pendingConfirm]);

  const handleToggleBook = useCallback(async (student: Student, bookId: string) => {
    const prev = student.received_books || [];
    const updated = prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId];
    setStudents((s) => s.map((x) => x.id === student.id ? { ...x, received_books: updated } : x));
    try {
      await StudentsService.updateStudent(student.id, { received_books: updated });
    } catch {
      setStudents((s) => s.map((x) => x.id === student.id ? { ...x, received_books: prev } : x));
      showToast("حدث خطأ أثناء تعديل حالة الكتاب.", "error");
    }
  }, []);

  const handleChangeGroup = useCallback(async (studentId: string, newGroupId: string) => {
    const targetGroupId = newGroupId === "" ? null : newGroupId;
    setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, group_id: targetGroupId } : s));
    try {
      const updated = await StudentsService.updateStudent(studentId, { group_id: targetGroupId });
      setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, ...updated } : s));
      showToast("تم النقل بنجاح.");
    } catch {
      showToast("فشل نقل الطالب.", "error");
    }
  }, []);

  const handleSaveStudentProfile = async (studentId: string, updates: Partial<Student>) => {
    const updated = await StudentsService.updateStudent(studentId, updates);
    setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, ...updated } : s));
    showToast("تم تحديث بيانات الطالب بنجاح!");
  };

  // ─── Selection ────────────────────────────────────────────────────────────
  const toggleSelectStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleStudents.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(visibleStudents.map((s) => s.id)));
  };

  const allSelected = visibleStudents.length > 0 && selectedIds.size === visibleStudents.length;

  // ─── Print Payment Report ─────────────────────────────────────────────────
  const handlePrintPayments = async () => {
    const MONTH_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

    let allSubs: MonthlySubscription[] = [];
    try {
      allSubs = await SubscriptionsService.getAllTeacherSubscriptions();
    } catch { /* silent */ }

    const now = new Date();
    const nowMonth = now.getMonth() + 1;
    const nowYear = now.getFullYear();

    // Build map: studentId -> Map<"month-year", status>
    const subsMap = new Map<string, Map<string, string>>();
    for (const sub of allSubs) {
      if (sub.status === "not_due") continue;
      if (!subsMap.has(sub.student_id)) subsMap.set(sub.student_id, new Map());
      subsMap.get(sub.student_id)!.set(`${sub.month}-${sub.year}`, sub.status);
    }

    // Collect all unique month-year combos that appear across filtered students, sorted
    const monthYearSet = new Set<string>();
    for (const s of filteredStudents) {
      const studentSubs = subsMap.get(s.id);
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

    const rows = filteredStudents.map((s, i) => {
      const studentSubs = subsMap.get(s.id);
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
        @page{size:A4 landscape;margin:12mm 14mm 12mm 14mm}
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:12px;margin:0;padding:0;color:#111;background:#fff;direction:rtl}
        table{border-collapse:collapse;width:100%;table-layout:auto}
        th{background:#f3f4f6;padding:5px 7px;border:1px solid #ccc;font-size:11px;white-space:nowrap}
        td{padding:4px 7px;border:1px solid #ddd;white-space:nowrap}
        tr:nth-child(even) td{background:#fafafa}

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
      <p style="text-align:center;color:#666;margin-bottom:8px">إجمالي: ${filteredStudents.length} طالب — ${new Date().toLocaleDateString("ar-EG")}</p>
      ${legend}
      <table><thead><tr>
        <th style="border:1px solid #ddd;padding:6px">#</th>
        <th style="border:1px solid #ddd;padding:6px">الكود</th>
        <th style="border:1px solid #ddd;padding:6px">الاسم</th>
        ${headerCells}
      </tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print()</script>
    </body></html>`;

    printHtml(html);
  };

  // ─── Print ────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const rows = filteredStudents.map((s, i) => {
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
        @page{size:A4 landscape;margin:12mm 14mm 12mm 14mm}
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:12px;margin:0;padding:0;color:#111;background:#fff;direction:rtl}
        table{border-collapse:collapse;width:100%;table-layout:auto}
        th{background:#f3f4f6;padding:5px 7px;border:1px solid #ccc;font-size:11px;white-space:nowrap}
        td{padding:4px 7px;border:1px solid #ddd;white-space:nowrap}
        tr:nth-child(even) td{background:#fafafa}
      </style>
    </head><body>
      <h2 style="text-align:center;margin-bottom:4px">قائمة الطلاب</h2>
      <p style="text-align:center;color:#666;margin-bottom:12px">إجمالي: ${filteredStudents.length} طالب — ${new Date().toLocaleDateString("ar-EG")}</p>
      <table><thead><tr>
        <th style="border:1px solid #ddd;padding:6px">#</th>
        <th style="border:1px solid #ddd;padding:6px">الكود</th>
        <th style="border:1px solid #ddd;padding:6px">الاسم</th>
        <th style="border:1px solid #ddd;padding:6px">السنة</th>
        <th style="border:1px solid #ddd;padding:6px">المجموعة</th>
        <th style="border:1px solid #ddd;padding:6px">هاتف ولي الأمر</th>
        <th style="border:1px solid #ddd;padding:6px">بداية الاشتراك</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print()</script>
    </body></html>`;

    printHtml(html);
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
            <Button variant="primary" onClick={() => setShowPaymentScan(true)} leftIcon={<CreditCard size={16} />}>
              سكان الدفع
            </Button>
            <Button variant="danger" onClick={() => setShowSuspendConfirm(true)} isLoading={actionLoading} leftIcon={<UserX size={16} />}>
              إيقاف المتأخرين
            </Button>
            <Button variant="secondary" onClick={handlePrintPayments} leftIcon={<Printer size={16} />}>
              طباعة تقرير الدفع
            </Button>

          </div>
        </div>
        {/* Row 2: جدول الدليل */}
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
              setStudents((prev) => {
                const existingIds = new Set(prev.map((s) => s.id));
                const newOnes = inserted
                  .filter((s) => !existingIds.has(s.id))
                  .map((s) => ({
                    ...s,
                    months: Array.isArray(s.months) && s.months.length === 12 ? s.months : Array(12).fill(false),
                    received_books: Array.isArray(s.received_books) ? s.received_books : [],
                  }));
                return [...prev, ...newOnes];
              });
              showToast(`تم إضافة ${inserted.length} طالب بنجاح! ✓`);
              setShowRefreshHint(true);
            }}
          />

          {showRefreshHint && (
            <div style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: "12px", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--color-teal)", margin: 0, lineHeight: 1.5 }}>
                💡 لو الطالب مش ظاهر في الجدول، اضغط على تحديث
              </p>
              <button
                onClick={() => { setShowRefreshHint(false); setRefreshKey(k => k + 1); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.4)", borderRadius: "8px", color: "var(--color-teal)", cursor: "pointer", padding: "0.4rem 0.8rem", fontSize: "0.82rem", fontWeight: 600, width: "100%" }}
              >
                <RefreshCw size={14} />
                تحديث القائمة
              </button>
            </div>
          )}


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
            onPrint={handlePrint}
          />
          </div>

          <div className="px-4">
          <BulkActionBar
            count={selectedIds.size}
            isLoading={actionLoading}
            onDelete={handleBulkDelete}
            onClear={() => setSelectedIds(new Set())}
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
                              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginRight: "auto" }}>{groupStudents.length} طالب</span>
                            </button>
                          </td>
                        </tr>
                        {!isCollapsed && groupStudents.map((student, idx) => {
                          // إنشاء key فريد يعتمد على subsMap لإجبار React على إعادة render عند تحديث الاشتراكات
                          const studentSubs = subsMap?.get(student.id);
                          const subsKey = studentSubs 
                            ? studentSubs.map(s => `${s.id}-${s.status}`).join(',')
                            : 'loading';
                          const rowKey = `${student.id}-${subsKey}`;
                          
                          return (
                            <Fragment key={student.id ?? `student-${idx}`}>
                              <StudentTableRow
                                key={rowKey}
                                student={student}
                                groups={groups}
                                grades={grades}
                                teacherBooks={teacherBooks}
                                isSelected={selectedIds.has(student.id)}
                                subsOverride={studentSubs}
                                subsLoading={subsMap === null}
                                purchasedBooksCount={bookCountsMap[student.id]?.length ?? 0}
                                purchasedBookIds={bookCountsMap[student.id]}
                                onToggleSelect={toggleSelectStudent}
                                onToggleBook={handleToggleBook}
                                onDelete={handleDeleteStudent}
                                onUpdateGroup={handleChangeGroup}
                                onEdit={(s) => setEditingStudent(s)}
                                onSubsChanged={(studentId, updatedSubs) => {
                                  setSubsMap(prev => {
                                    const newMap = new Map(prev ?? []);
                                    newMap.set(studentId, updatedSubs);
                                    return newMap;
                                  });
                                }}
                                onStudentUpdate={(studentId, updated) =>
                                  setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, ...updated } : s))
                                }
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

      {showPaymentScan && (
        <PaymentScanModal
          students={students}
          groups={groups}
          subsMap={subsMap ?? undefined}
          onClose={() => setShowPaymentScan(false)}
          onStudentUpdated={(studentId, months) =>
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, months } : s))
          }
          onSubsPaid={(studentId, freshSubs) => {
            setSubsMap(prev => {
              const newMap = new Map(prev ?? []);
              newMap.set(studentId, freshSubs);
              return newMap;
            });
          }}
          onStudentsRefresh={(fresh) =>
            setStudents(fresh.map(s => ({
              ...s,
              months: Array.isArray(s.months) && s.months.length === 12 ? s.months : Array(12).fill(false),
              received_books: Array.isArray(s.received_books) ? s.received_books : [],
            })))
          }
        />
      )}

      <StudentProfileModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        groups={groups}
        grades={grades}
        onSave={handleSaveStudentProfile}
      />
    </div>
  );
}
