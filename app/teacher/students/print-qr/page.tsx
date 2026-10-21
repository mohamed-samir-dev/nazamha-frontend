"use client";

import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { printInPlace } from "@/lib/printInPlace";
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getStudentQRValue } from "@/lib/utils/qrParser";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { Printer, ArrowRight, Search, Users, Download, GraduationCap, RefreshCw } from "lucide-react";
import { AuthService } from "@/lib/services/authService";
import { StudentsService } from "@/lib/services/studentsService";
import { SystemSettingsService } from "@/lib/services/systemSettingsService";
import { GradesService } from "@/lib/services/gradesService";
import { GroupsService } from "@/lib/services/groupsService";
import { Student, Group, Grade } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

const PAGE_SIZE = 20;

function PrintQRContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlGradeId = searchParams.get("gradeId") || "all";
  const urlGroupId = searchParams.get("groupId") || "all";

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [staticError, setStaticError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [allGradesList, setAllGradesList] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<Record<string, string>>({});
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [siteLogo, setSiteLogo] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("Student Tracker");
  const [teacherPhone, setTeacherPhone] = useState<string>("");
  // "teacher" = اسم + رقم المدرس | "image" = صورة المنصة
  const [qrHeaderType, setQrHeaderType] = useState<"teacher" | "image">("teacher");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const [codeFilter, setCodeFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState(urlGradeId);
  const [groupFilter, setGroupFilter] = useState(urlGroupId);

  // تخزين الطلاب المحددين في Map لضمان الاحتفاظ ببياناتهم عند التنقل بين الصفحات
  const [selectedStudents, setSelectedStudents] = useState<Map<string, Student>>(new Map());

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilter(codeFilter);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [codeFilter]);

  // load static data (grades, groups, settings, user)
  useEffect(() => {
    async function loadStatic() {
      try {
        const [currentUser, settings] = await Promise.all([
          AuthService.getUser(),
          SystemSettingsService.getSettings(),
        ]);
        if (!currentUser) return;
        setSiteName(currentUser.name ? `أ. ${currentUser.name}` : "Student Tracker");
        setTeacherPhone(currentUser.phone || "");
        if (settings) {
          setSiteLogo(settings.site_logo || "");
          setQrHeaderType(settings.qr_header_type ?? "teacher");
        }
        const [allGrades, fetchedGroups] = await Promise.all([
          GradesService.getGradesByTeacherId(currentUser.id),
          GroupsService.getGroupsByTeacherId(),
        ]);
        setAllGradesList(allGrades);
        setGrades(allGrades.reduce((acc, g) => ({ ...acc, [g.id]: g.name }), {}));
        setGroups(fetchedGroups.reduce((acc, g) => ({ ...acc, [g.id]: g.name }), {}));
        setAllGroups(fetchedGroups);
      } catch (error) {
        console.error("Error loading static data:", error);
        setStaticError("تعذر تحميل بيانات المدرس والمجموعات. أعد تحميل الصفحة قبل الطباعة.");
      }
    }
    loadStatic();
  }, []);

  // load students page
  const pageRequest = useRef(0);
  const loadStudents = useCallback(async () => {
    const request = ++pageRequest.current;
    setLoading(true);
    setFetchError(null);
    try {
      const result = await StudentsService.getStudentsPaginated({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedFilter || undefined,
        grade_id: gradeFilter !== "all" ? gradeFilter : undefined,
        group_id: groupFilter !== "all" ? groupFilter : undefined,
      });
      if (request !== pageRequest.current) return;
      const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
      if (currentPage > lastPage) { setCurrentPage(lastPage); return; }
      setStudents(result.students);
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading students:", error);
      if (request === pageRequest.current) setFetchError("حدث خطأ أثناء تحميل بيانات الطلاب. يرجى إعادة المحاولة.");
    } finally {
      if (request === pageRequest.current) setLoading(false);
    }
  }, [currentPage, debouncedFilter, gradeFilter, groupFilter]);

  useEffect(() => {
    loadStudents();
    return () => { pageRequest.current++; };
  }, [loadStudents]);

  // المجموعات المتاحة طبقاً للمرحلة الدراسية المختارة
  const availableGroups = useMemo(() => {
    if (gradeFilter === "all") return allGroups;
    return allGroups.filter(g => String(g.grade_id) === String(gradeFilter));
  }, [allGroups, gradeFilter]);

  // التحقق من تحديد جميع طلاب الصفحة الحالية
  const isAllCurrentPageSelected = useMemo(() => {
    return students.length > 0 && students.every(s => selectedStudents.has(s.id));
  }, [students, selectedStudents]);

  const toggleSelect = (student: Student) => {
    setSelectedStudents(prev => {
      const next = new Map(prev);
      if (next.has(student.id)) {
        next.delete(student.id);
      } else {
        next.set(student.id, student);
      }
      return next;
    });
  };

  const toggleSelectCurrentPage = () => {
    setSelectedStudents(prev => {
      const next = new Map(prev);
      if (isAllCurrentPageSelected) {
        students.forEach(s => next.delete(s.id));
      } else {
        students.forEach(s => next.set(s.id, s));
      }
      return next;
    });
  };

  const clearAllSelection = () => {
    setSelectedStudents(new Map());
  };

  // توليد HTML للطباعة بدون فتح نوافذ منبثقة (printInPlace)
  const renderAndPrint = async (targetStudents: Student[]) => {
    if (targetStudents.length === 0) {
      alert("لا يوجد طلاب للطباعة");
      return;
    }

    try {
      const cardsData = await Promise.all(
        targetStudents.map(async student => {
          const qrSvg = await QRCode.toString(getStudentQRValue(student), {
            type: "svg",
            width: 90,
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" },
          });
          return {
            name: student.name,
            code: student.code || "—",
            grade: student.grade_id ? grades[student.grade_id] || "—" : "—",
            group: student.group_id ? groups[student.group_id] || "—" : "—",
            qrSvg,
          };
        })
      );

      const buildCardHeader = () => {
        if (qrHeaderType === "image") {
          const logoSrc = siteLogo || `${baseUrl}/nazamha.webp`;
          return `<div class="id-card-header-img"><img src="${logoSrc}" class="id-card-logo-img" alt="logo"/></div>`;
        }
        return `
          <div class="id-card-teacher-name">
            <span>${siteName}</span>
            ${teacherPhone ? `<span class="id-card-teacher-phone">${teacherPhone}</span>` : ""}
          </div>`;
      };

      const cardsHtml = cardsData
        .map(
          c => `
        <div class="id-card">
          ${buildCardHeader()}
          <div class="id-card-name">${c.name}</div>
          <div class="id-card-body">
            <div class="id-card-details">
              <div class="detail-row"><span class="detail-label">الكود:</span><span class="detail-value code-value">${c.code}</span></div>
              <div class="detail-row"><span class="detail-label">السنة:</span><span class="detail-value">${c.grade}</span></div>
              <div class="detail-row"><span class="detail-label">المجموعة:</span><span class="detail-value">${c.group}</span></div>
            </div>
            <div class="qr-wrapper">${c.qrSvg || ""}</div>
          </div>
        </div>`
        )
        .join("");

      const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>بطاقات QR - طباعة</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          html,body{
            font-family:"Segoe UI",Arial,sans-serif;
            background:#fff;
            direction:rtl;
            color:#111;
            width:100%;
            -webkit-print-color-adjust:exact !important;
            print-color-adjust:exact !important;
          }
          .print-grid{
            display:grid;
            grid-template-columns:repeat(2,1fr);
            gap:12px;
            padding:12px;
            width:100%;
          }
          .id-card{
            border:1px solid #ccc;
            border-radius:10px;
            padding:12px;
            background:#fff;
            display:flex;
            flex-direction:column;
            gap:9px;
            width:100%;
            overflow:hidden;
            page-break-inside:avoid;
            break-inside:avoid;
          }
          .id-card-teacher-name{
            width:100%;
            text-align:center;
            display:flex;
            flex-direction:row;
            align-items:center;
            justify-content:center;
            gap:6px;
            padding-bottom:7px;
            border-bottom:2px solid #0d9488;
            flex-wrap:nowrap;
            overflow:hidden;
          }
          .id-card-header-img{
            width:100%;
            display:block;
            padding-bottom:7px;
            border-bottom:2px solid #0d9488;
          }
          .id-card-logo-img{
            width:100%;
            height:50px;
            object-fit:contain;
            display:block;
          }
          .id-card-teacher-name > span:first-child{
            font-size:13px;
            font-weight:700;
            color:#0d9488;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            flex:1;
            min-width:0;
          }
          .id-card-teacher-phone{
            font-size:11.5px;
            font-weight:600;
            color:#111;
            font-family:monospace;
            direction:ltr;
            background:#e0f2f1;
            border:1px solid #b2dfdb;
            border-radius:4px;
            padding:1px 5px;
            white-space:nowrap;
            flex-shrink:0;
          }
          .id-card-name{
            font-size:14px;
            font-weight:700;
            color:#111;
            text-align:center;
            padding:4px 0;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          }
          .id-card-body{
            display:flex;
            flex-direction:row;
            align-items:center;
            gap:8px;
          }
          .id-card-details{
            display:flex;
            flex-direction:column;
            gap:6px;
            flex:1;
            min-width:0;
            background:#f8f8f8;
            border:1px solid #e0e0e0;
            border-radius:6px;
            padding:10px;
          }
          .detail-row{
            display:flex;
            align-items:center;
            gap:6px;
            padding-bottom:6px;
            border-bottom:1px dashed #ddd;
          }
          .detail-row:last-child{border-bottom:none;padding-bottom:0}
          .detail-label{color:#888;flex-shrink:0;white-space:nowrap;font-size:12px}
          .detail-value{font-weight:600;color:#111;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
          .code-value{font-family:monospace;font-weight:700;color:#0d9488}
          .qr-wrapper{
            padding:5px;
            background:#fff;
            border-radius:6px;
            box-shadow:0 1px 4px rgba(0,0,0,0.12);
            display:inline-flex;
            flex-shrink:0;
            align-self:center;
          }
          @media print{
            html,body{
              margin:0;
              padding:0;
              -webkit-print-color-adjust:exact !important;
              print-color-adjust:exact !important;
            }
            .print-grid{gap:8px;padding:6px}
            .id-card{break-inside:avoid;page-break-inside:avoid}
            @page{size:A4 portrait;margin:6mm}
          }
        </style>
      </head><body>
        <div class="print-grid">${cardsHtml}</div>
      </body></html>`;

      await printInPlace({ html });
    } catch (err) {
      console.error("Error generating print content:", err);
      alert("حدث خطأ أثناء إعداد بطاقات الطباعة");
    }
  };

  const handlePrintSelected = async () => {
    const selectedList = Array.from(selectedStudents.values());
    if (selectedList.length === 0) {
      alert("يرجى تحديد طلاب أولاً للطباعة");
      return;
    }
    setIsPrinting(true);
    try {
      await renderAndPrint(selectedList);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const result = await StudentsService.getAllMatchingStudents({
        search: debouncedFilter || undefined,
        grade_id: gradeFilter !== "all" ? gradeFilter : undefined,
        group_id: groupFilter !== "all" ? groupFilter : undefined,
      });
      await renderAndPrint(result);
    } catch (err) {
      console.error("Print all error:", err);
      alert("حدث خطأ أثناء جلب الطلاب للطباعة");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      let exportList: Student[] = [];
      if (selectedStudents.size > 0) {
        exportList = Array.from(selectedStudents.values());
      } else {
        const result = await StudentsService.getAllMatchingStudents({
          search: debouncedFilter || undefined,
          grade_id: gradeFilter !== "all" ? gradeFilter : undefined,
          group_id: groupFilter !== "all" ? groupFilter : undefined,
        });
        exportList = result;
      }

      if (exportList.length === 0) {
        alert("لا يوجد طلاب للتصدير");
        return;
      }

      const { buildStudentQRWorkbook } = await import("@/lib/exportStudentQRWorkbook");
      const buffer = await buildStudentQRWorkbook(exportList.map(s => ({
        name: s.name, code: s.center_student_code || s.code || "",
        grade: s.grade_id ? grades[s.grade_id] || "" : "",
        group: s.group_id ? groups[s.group_id] || "" : "", qrValue: getStudentQRValue(s),
      })));
      const blob = new Blob([new Uint8Array(buffer)], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students-qr-${selectedStudents.size > 0 ? "selected" : "all"}.xlsx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Export Excel error:", err);
      alert("حدث خطأ أثناء تصدير ملف Excel");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && students.length === 0) return <Spinner fullScreen />;

  return (
    <div className="print-container print:bg-white print:p-0 print:w-full" dir="rtl">
      {/* Header */}
      <div className="no-print glass-panel mb-6 rounded-xl overflow-hidden">
        {/* Top Bar: Title + Main Actions */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-br from-teal-500/5 to-transparent border-b border-white/[0.08]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold mb-1.5 bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
                طباعة بطاقات QR
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  <strong className="text-[var(--text-primary)]">{total}</strong> طالب
                </span>
                <span className="text-white/20">•</span>
                {total > 0 && <span>صفحة <strong className="text-[var(--text-primary)]">{currentPage}</strong> من {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>}
                {selectedStudents.size > 0 && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="inline-flex items-center gap-1.5 text-teal-400 font-semibold">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                        <path d="M2 7L5.5 10.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {selectedStudents.size} محددة
                    </span>
                    <button
                      onClick={clearAllSelection}
                      className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer mr-1"
                    >
                      إلغاء التحديد
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => router.back()}
                leftIcon={<ArrowRight size={16} />}
                className="flex-1 sm:flex-initial"
              >
                <span>رجوع</span>
              </Button>
              {selectedStudents.size > 0 ? (
                <Button
                  variant="primary"
                  onClick={handlePrintSelected}
                  disabled={isPrinting}
                  isLoading={isPrinting}
                  leftIcon={<Printer size={16} />}
                  className="flex-1 sm:flex-initial"
                >
                  طباعة المحددة ({selectedStudents.size})
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handlePrint}
                  disabled={isPrinting || total === 0}
                  isLoading={isPrinting}
                  leftIcon={<Printer size={16} />}
                  className="flex-1 sm:flex-initial"
                >
                  <span className="hidden sm:inline">طباعة الكل ({total})</span>
                  <span className="sm:hidden">طباعة ({total})</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filters & Controls Bar */}
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4">
            {/* Row 1: Select All + Secondary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Select Current Page */}
              <label
                htmlFor="select-all"
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={isAllCurrentPageSelected}
                    onChange={toggleSelectCurrentPage}
                    className="peer w-5 h-5 cursor-pointer appearance-none rounded border-2 border-white/20 bg-white/5 checked:bg-teal-500 checked:border-teal-500 transition-all duration-200"
                  />
                  <svg
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  {isAllCurrentPageSelected
                    ? `إلغاء تحديد طلاب الصفحة (${students.length})`
                    : `تحديد طلاب الصفحة (${students.length})`
                  }
                </span>
              </label>

              <p className="text-xs text-[var(--text-secondary)]">ملف Excel يحتوي بيانات الطلاب وصورة QR فعلية لكل طالب، ويعمل بدون إنترنت.</p>
              {/* Secondary Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportExcel()}
                  disabled={isExporting || total === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  <span>{isExporting ? "جاري التصدير..." : selectedStudents.size > 0 ? `Excel للمحددة (${selectedStudents.size})` : "تنزيل Excel بصور QR"}</span>
                </button>
                {selectedStudents.size > 0 && (
                  <button
                    onClick={handlePrint}
                    disabled={isPrinting || total === 0}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer size={16} />
                    <span className="hidden sm:inline">طباعة الكل ({total})</span>
                    <span className="sm:hidden">الكل</span>
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Search & Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <div className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 pr-11 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  placeholder="ابحث بالكود أو الاسم..."
                  value={codeFilter}
                  onChange={e => setCodeFilter(e.target.value)}
                />
                {codeFilter && (
                  <button
                    onClick={() => setCodeFilter("")}
                    aria-label="مسح البحث"
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Grade Filter */}
              <div className="relative">
                <div className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10">
                  <GraduationCap size={18} />
                </div>
                <select
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 pr-11 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all cursor-pointer appearance-none"
                  value={gradeFilter}
                  onChange={e => {
                    setGradeFilter(e.target.value);
                    setGroupFilter("all");
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'left 1rem center',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all" style={{ background: '#1a1a1a', color: '#fff' }}>كل المراحل الدراسية</option>
                  {allGradesList.map(g => (
                    <option key={g.id} value={g.id} style={{ background: '#1a1a1a', color: '#fff' }}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Group Filter */}
              <div className="relative">
                <div className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10">
                  <Users size={18} />
                </div>
                <select
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 pr-11 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all cursor-pointer appearance-none"
                  value={groupFilter}
                  onChange={e => {
                    setGroupFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'left 1rem center',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all" style={{ background: '#1a1a1a', color: '#fff' }}>كل المجموعات</option>
                  <option value="none" style={{ background: '#1a1a1a', color: '#fff' }}>بدون مجموعة</option>
                  {availableGroups.map(g => (
                    <option key={g.id} value={g.id} style={{ background: '#1a1a1a', color: '#fff' }}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {staticError && <p role="alert" className="text-red-400">{staticError}</p>}
      {fetchError && (
        <div className="no-print glass-panel text-center p-8 mb-6 flex flex-col items-center gap-3 border border-red-500/30">
          <p className="text-[1.05rem] text-red-400 font-medium">{fetchError}</p>
          <Button variant="secondary" onClick={() => loadStudents()} leftIcon={<RefreshCw size={16} />}>
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* Pagination */}
      {!fetchError && total > PAGE_SIZE && (
        <div className="no-print flex items-center justify-center gap-2 p-3 mt-2 mb-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`bg-teal-500/10 border border-teal-500/30 rounded-lg px-[0.9rem] py-[0.35rem] text-[0.82rem] font-semibold transition-colors ${
              currentPage === 1 ? "text-[var(--text-muted)] cursor-not-allowed" : "text-teal-500 cursor-pointer hover:bg-teal-500/20"
            }`}
          >
            السابق
          </button>
          <span className="text-[0.82rem] text-[var(--text-muted)]">
            {currentPage} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(total / PAGE_SIZE), p + 1))}
            disabled={currentPage >= Math.ceil(total / PAGE_SIZE)}
            className={`bg-teal-500/10 border border-teal-500/30 rounded-lg px-[0.9rem] py-[0.35rem] text-[0.82rem] font-semibold transition-colors ${
              currentPage >= Math.ceil(total / PAGE_SIZE) ? "text-[var(--text-muted)] cursor-not-allowed" : "text-teal-500 cursor-pointer hover:bg-teal-500/20"
            }`}
          >
            التالي
          </button>
        </div>
      )}

      {/* Student Cards Grid or Empty */}
      {!fetchError && students.length === 0 ? (
        <div className="no-print glass-panel text-center p-12">
          <p className="text-[1.1rem] text-[var(--text-muted)]">لا يوجد طلاب مطابقين للفلتر المختار.</p>
        </div>
      ) : (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr))] max-sm:grid-cols-1 max-sm:gap-3 print:grid-cols-3 print:gap-2 print:w-full">
          {students.map(student => {
            const isSelected = selectedStudents.has(student.id);
            return (
              <div
                key={student.id}
                className="bg-[var(--bg-card)] backdrop-blur-[var(--glass-blur)] border border-[var(--border-color)] rounded-xl px-3 py-5 flex flex-col items-center gap-3 transition-[var(--transition-smooth)] shadow-[var(--glass-shadow)] hover:-translate-y-1 hover:border-teal-500/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(20,184,166,0.15)] print:break-inside-avoid print:border print:border-[#ccc] print:rounded-lg print:bg-white print:text-black print:p-[7px] print:gap-1 print:[backdrop-filter:none] print:translate-y-0 print:shadow-none"
                data-student-id={student.id}
                style={{
                  outline: isSelected ? "2px solid var(--color-teal)" : "none",
                  outlineOffset: "2px",
                  position: "relative",
                }}
              >
                {/* Checkbox */}
                <div
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`تحديد الطالب ${student.name}`}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      toggleSelect(student);
                    }
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    toggleSelect(student);
                  }}
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    zIndex: 2,
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: isSelected ? "2px solid var(--color-teal)" : "2px solid rgba(255,255,255,0.25)",
                    background: isSelected ? "var(--color-teal)" : "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(4px)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.18s ease",
                    boxShadow: isSelected ? "0 0 0 3px rgba(20,184,166,0.2)" : "none",
                  }}
                >
                  {isSelected && (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 6.5L5.5 10L11 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {/* Card Header */}
                {qrHeaderType === "image" ? (
                  <div className="w-full block pb-2 border-b-2 border-teal-500 print:border-teal-600 print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]">
                    <img
                      src={siteLogo || "/nazamha.webp"}
                      alt="logo"
                      style={{ width: "100%", height: 44, objectFit: "contain", display: "block" }}
                    />
                  </div>
                ) : (
                  <div className="w-full flex flex-row items-center justify-center gap-2 pb-[0.35rem] border-b-2 border-teal-500 overflow-hidden">
                    <span className="text-[0.9rem] font-bold text-teal-500 tracking-wide whitespace-nowrap overflow-hidden text-ellipsis min-w-0 flex-1 text-center">{siteName}</span>
                    {teacherPhone && (
                      <span className="text-[0.78rem] font-semibold text-[var(--text-primary)] font-mono ltr bg-teal-500/10 border border-teal-500/25 rounded-[5px] px-[6px] py-[1px] whitespace-nowrap shrink-0">
                        {teacherPhone}
                      </span>
                    )}
                  </div>
                )}

                {/* Student Name */}
                <div className="w-full text-center py-[0.3rem]">
                  <span className="font-bold text-[1rem] text-[var(--text-primary)] print:text-black">{student.name}</span>
                </div>

                {/* Info + QR row */}
                <div className="w-full flex flex-row items-center gap-2 pr-0">
                  {/* Details table */}
                  <div className="flex flex-col gap-2 min-w-0 w-full bg-black/10 border border-[var(--border-color)] rounded-lg p-3 print:bg-[#f8f8f8] print:border-[#e0e0e0]">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 print:border-dashed print:border-[#ddd]">
                      <span className="text-[0.8rem] text-[var(--text-muted)] print:text-[#666] shrink-0">الكود:</span>
                      <span className="font-bold font-mono text-teal-400 text-[0.85rem] print:text-teal-600 truncate">{student.code}</span>
                    </div>
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 print:border-dashed print:border-[#ddd]">
                      <span className="text-[0.8rem] text-[var(--text-muted)] print:text-[#666] shrink-0">السنة:</span>
                      <span className="font-semibold text-[var(--text-primary)] text-[0.85rem] print:text-black truncate">{student.grade_id ? grades[student.grade_id] : "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.8rem] text-[var(--text-muted)] print:text-[#666] shrink-0">المجموعة:</span>
                      <span className="font-semibold text-[var(--text-primary)] text-[0.85rem] print:text-black break-words min-w-0">{student.group_id ? groups[student.group_id] : "—"}</span>
                    </div>
                  </div>
                  {/* QR standalone */}
                  <div className="flex items-center justify-center shrink-0">
                    <div className="p-2 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] print:shadow-none">
                      <QRCodeSVG
                        value={getStudentQRValue(student)}
                        size={100}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PrintQRPage() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <PrintQRContent />
    </Suspense>
  );
}
