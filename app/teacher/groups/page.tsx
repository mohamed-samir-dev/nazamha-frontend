"use client";

import { useState, useEffect } from "react";
import { FolderPlus, CalendarCheck } from "lucide-react";
import { AuthService } from "@/lib/services/authService";
import { GradesService } from "@/lib/services/gradesService";
import { StudentsService } from "@/lib/services/studentsService";
import { SubTeachersService } from "@/lib/services/subTeachersService";
import { GroupsService } from "@/lib/services/groupsService";
import { Grade, Student, SubTeacher } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Download, ExternalLink, Copy, Check } from "lucide-react";
import { GroupsList } from "../_components/GroupsList";
import { CreateGroupModal } from "../_components/CreateGroupModal";
import { EditGroupModal } from "../_components/EditGroupModal";
import { DeleteGroupDialog } from "../_components/DeleteGroupDialog";
import { AcademicYearTabs } from "../_components/AcademicYearTabs";
import { useGroups } from "@/lib/hooks/useGroups";
import { Group } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";
import { getAcademicYear } from "@/lib/groupUtils";

const currentAcademicYear = getAcademicYear(new Date());

export default function GroupsPage() {
  const [loading, setLoading] = useState(true);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subTeachers, setSubTeachers] = useState<SubTeacher[]>([]);
  const [hasCenterMode, setHasCenterMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeYear, setActiveYear] = useState<string>(currentAcademicYear);

  const { groups, loading: groupsLoading, addGroup: cacheAdd, updateGroup: cacheUpdate, removeGroup: cacheRemove, removeGroups: cacheRemoveMany } = useGroups();

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const [calendarSyncInfo, setCalendarSyncInfo] = useState<{
    feedHttpUrl: string;
    webcalUrl: string;
    googleCalendarUrl: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const getCalendarUrls = (teacherId: string, sig: string) => {
    let apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // إذا كان الرابط localhost والمستخدم فاتح من الموبايل أو أي جهاز، نحوله إلى host الصفحة الحالية
    if (typeof window !== "undefined" && apiHost.includes("localhost") && window.location.hostname !== "localhost") {
      apiHost = apiHost.replace("localhost", window.location.hostname);
    }
    const feedHttpUrl = `${apiHost}/public/calendar/${teacherId}.ics?sig=${sig}`;
    const webcalUrl = feedHttpUrl.replace(/^https?:\/\//i, "webcal://");
    const googleCalendarUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;
    return { feedHttpUrl, webcalUrl, googleCalendarUrl };
  };

  const handleExportCalendar = async () => {
    if (groupsInYear.length === 0 && groups.length === 0) {
      showToast("لا توجد مجموعات لمزامنتها مع التقويم.", "error");
      return;
    }
    setSyncingCalendar(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token = typeof window !== "undefined" ? localStorage.getItem("ot_token") : null;
      const res = await fetch(`${base}/groups/calendar-sync-url`, {
        method: "GET",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error("فشل تجهيز رابط مزامنة التقويم");
      }
      const { teacherId, sig } = await res.json();
      const urls = getCalendarUrls(teacherId, sig);
      setCalendarSyncInfo(urls);

      // تنزيل ملف .ics وتوجيه المستخدم لتطبيق التقويم
      const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        // على iPhone/iPad: بروتوكول webcal:// يفتح مباشرة تطبيق التقويم ويطلب الاشتراك
        window.location.href = urls.webcalUrl;
      } else {
        // على Android والأجهزة الأخرى: تنزيل ملف .ics مباشرة (النقر عليه يفتحه فوراً في تقويم سامسونج أو Google Calendar)
        const downloadLink = document.createElement("a");
        downloadLink.href = urls.feedHttpUrl;
        downloadLink.setAttribute("download", "schedule.ics");
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      showToast("تم تجهيز مواعيد المجموعات للتقويم بنجاح!");
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "حدث خطأ أثناء مزامنة التقويم."), "error");
    } finally {
      setSyncingCalendar(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const teacher = await AuthService.getUser();
        if (!teacher) return;

        const [gradesData, studentsData] = await Promise.all([
          GradesService.getGradesByTeacherId(teacher.id),
          StudentsService.getStudentsByTeacherId("name,code,group_id,grade_id,is_suspended"),
        ]);

        setUserId(teacher.id);
        setHasCenterMode(teacher.is_center_mode || false);
        setGrades(gradesData);
        setStudents(studentsData);

        if (teacher.is_center_mode) {
          const subs = await SubTeachersService.getSubTeachersByCenterId(teacher.id);
          setSubTeachers(subs);
        }
      } catch {
        showToast("حدث خطأ أثناء تحميل البيانات.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("action") === "new") {
      setShowCreateModal(true);
    }
  }, []);

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) setDeletingGroup(group);
  };

  const handleConfirmDelete = async (groupId: string, deleteStudents: boolean) => {
    try {
      if (deleteStudents) {
        await GroupsService.deleteGroup(groupId, true);
        setStudents((prev) => prev.filter((s) => s.group_id !== groupId));
        showToast("تم حذف المجموعة وجميع طلابها بنجاح.");
      } else {
        await GroupsService.deleteGroup(groupId);
        setStudents((prev) => prev.map((s) => s.group_id === groupId ? { ...s, group_id: null } : s));
        showToast("تم حذف المجموعة وأصبح طلابها بدون مجموعة.");
      }
      cacheRemove(groupId);
      setSelectedIds((prev) => prev.filter((id) => id !== groupId));
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "حدث خطأ أثناء حذف المجموعة."), "error");
    } finally {
      setDeletingGroup(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} مجموعة؟ سيتم إلغاء تعيين طلابها.`)) return;
    try {
      await GroupsService.deleteGroupsBulk(selectedIds);
      cacheRemoveMany(selectedIds);
      setStudents((prev) => prev.map((s) => selectedIds.includes(s.group_id || "") ? { ...s, group_id: null } : s));
      showToast(`تم حذف ${selectedIds.length} مجموعة بنجاح.`);
      setSelectedIds([]);
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "حدث خطأ أثناء حذف المجموعات."), "error");
    }
  };

  const handleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleSelectAll = (ids: string[]) => setSelectedIds(ids);

  // استخراج كل السنوات الدراسية الموجودة في المجموعات
  const academicYears: string[] = Array.from(
    new Set(groups.map((g) => g.created_at ? getAcademicYear(new Date(g.created_at)) : currentAcademicYear))
  ).sort((a, b) => b.localeCompare(a)); // الأحدث أولاً

  // لو السنة الحالية مش موجودة في المجموعات، نضيفها كـ tab
  if (!academicYears.includes(currentAcademicYear)) academicYears.unshift(currentAcademicYear);

  const groupsInYear = groups.filter(
    (g) => (g.created_at ? getAcademicYear(new Date(g.created_at)) : currentAcademicYear) === activeYear
  );

  if (loading || groupsLoading) return <Spinner fullScreen />;

  return (
    <div style={{ 
      marginTop: "0",
      marginRight: "calc(-2rem)",
      marginBottom: "calc(-2rem)",
      marginLeft: "calc(-2rem)",
      padding: "0"
    }}
    className="groups-page-container">
      <style jsx>{`
        @media (max-width: 768px) {
          .groups-page-container {
            margin-right: calc(-0.75rem) !important;
            margin-bottom: calc(-0.75rem) !important;
            margin-left: calc(-0.75rem) !important;
          }
          .groups-header-section {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .groups-page-container {
            margin-right: calc(-1.5rem) !important;
            margin-bottom: calc(-1.5rem) !important;
            margin-left: calc(-1.5rem) !important;
          }
          .groups-header-section {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }
        @media (min-width: 1025px) {
          .groups-header-section {
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }
      `}</style>
      {/* Header Section with Padding */}
      <div className="groups-header-section">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-5 border-b border-white/[0.08]">
            <div>
              <h1 className="text-[1.5rem] sm:text-[1.75rem] font-bold mb-1 bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
                المجموعات
              </h1>
              <p className="text-sm text-slate-500">
                إدارة جميع مجموعاتك التعليمية ({groups.length} مجموعة)
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                isLoading={syncingCalendar}
                leftIcon={<CalendarCheck size={17} />}
                onClick={handleExportCalendar}
                title="إضافة مواعيد المجموعات الأسبوعية إلى تقويم الجهاز"
              >
                <span className="hidden sm:inline">مزامنة مع التقويم</span>
                <span className="sm:hidden">التقويم</span>
              </Button>
              <Button variant="primary" leftIcon={<FolderPlus size={17} />} onClick={() => setShowCreateModal(true)}>
                <span className="hidden sm:inline">مجموعة جديدة</span>
                <span className="sm:hidden">جديدة</span>
              </Button>
            </div>
          </div>

          {/* ── tabs السنوات الدراسية ── */}
          <AcademicYearTabs
            years={academicYears}
            activeYear={activeYear}
            currentYear={currentAcademicYear}
            groups={groups}
            onSelect={(y) => { setActiveYear(y); setSelectedIds([]); }}
          />
      </div>

          {/* Groups List without padding */}
          <GroupsList
            groups={groupsInYear}
            students={students}
            grades={grades}
            subTeachers={subTeachers}
            hasCenterMode={hasCenterMode}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onDelete={handleDeleteGroup}
            onDeleteSelected={handleDeleteSelected}
            onEdit={(group) => setEditingGroup(group)}
          />

          <CreateGroupModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            userId={userId}
            grades={grades}
            groups={groups}
            hasCenterMode={hasCenterMode}
            subTeachers={subTeachers}
            onCreated={(newGroup) => {
              cacheAdd(newGroup);
              showToast("تم إنشاء المجموعة بنجاح.");
            }}
            onGradeAdded={(grade) => setGrades((prev) => [...prev, grade])}
            onError={(msg) => showToast(msg, "error")}
          />

          <EditGroupModal
            isOpen={!!editingGroup}
            onClose={() => setEditingGroup(null)}
            group={editingGroup}
            grades={grades}
            groups={groups}
            hasCenterMode={hasCenterMode}
            subTeachers={subTeachers}
            onUpdated={(updated) => {
              cacheUpdate(updated);
              showToast("تم تعديل المجموعة بنجاح.");
            }}
            onGradeAdded={(grade) => setGrades((prev) => [...prev, grade])}
            onError={(msg) => showToast(msg, "error")}
          />

          <DeleteGroupDialog
            group={deletingGroup}
            studentCount={students.filter((s) => s.group_id === deletingGroup?.id).length}
            onConfirm={handleConfirmDelete}
            onClose={() => setDeletingGroup(null)}
          />

          {calendarSyncInfo && (
            <Modal
              isOpen={!!calendarSyncInfo}
              onClose={() => setCalendarSyncInfo(null)}
              title="مزامنة مواعيد المجموعات مع التقويم"
              maxWidth="520px"
            >
              <div className="space-y-4 text-right" dir="rtl">
                <p className="text-sm text-slate-300 leading-relaxed">
                  اختر الطريقة الأنسب لجهازك لإضافة جميع مواعيد حصصك الأسبوعية بتنبيهاتها:
                </p>

                {/* الخيار الأول: تحميل ملف التقويم */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-violet-500/40 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-white flex items-center gap-2">
                      <Download size={16} className="text-violet-400" />
                      تنزيل ملف التقويم (.ics)
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                      موصى به للموبايل
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    نزّل الملف وافتحه مباشرة ليقوم تطبيق التقويم (سامسونج، هواوي، جوجل) بإضافة كل المواعيد فوراً.
                  </p>
                  <a
                    href={calendarSyncInfo.feedHttpUrl}
                    download="schedule.ics"
                    className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition"
                  >
                    <Download size={14} />
                    تحميل الملف وفتحه في التقويم
                  </a>
                </div>

                {/* الخيار الثاني: الاشتراك المباشر عبر webcal */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-violet-500/40 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-white flex items-center gap-2">
                      <CalendarCheck size={16} className="text-emerald-400" />
                      اشتراك مباشر (تطبيق التقويم)
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      iPhone / Apple Calendar
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    يفتح تطبيق التقويم الافتراضي مباشرة لمزامنة المواعيد بشكل حيّ.
                  </p>
                  <a
                    href={calendarSyncInfo.webcalUrl}
                    className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                  >
                    <ExternalLink size={14} />
                    فتح في تطبيق التقويم (Webcal)
                  </a>
                </div>

                {/* الخيار الثالث: تقويم جوجل */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-violet-500/40 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-white flex items-center gap-2">
                      <ExternalLink size={16} className="text-blue-400" />
                      إضافة إلى Google Calendar
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    إضافة المواعيد مباشرة إلى حساب تقويم Google في المتصفح.
                  </p>
                  <a
                    href={calendarSyncInfo.googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                  >
                    <ExternalLink size={14} />
                    فتح في Google Calendar
                  </a>
                </div>

                {/* نسخ الرابط يدوياً */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(calendarSyncInfo.feedHttpUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                      showToast("تم نسخ رابط التقويم إلى الحافظة");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedLink ? "تم النسخ!" : "نسخ رابط التقويم يدوياً"}</span>
                  </button>
                  <Button variant="secondary" size="sm" onClick={() => setCalendarSyncInfo(null)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
