"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { Student, Group, Grade, BookDef, MonthlySubscription } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { TeachersService } from "@/lib/services/teachersService";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";

import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { RiUserLine } from "react-icons/ri";
import { MdOutlinePayments, MdOutlineMenuBook } from "react-icons/md";
import { TbCalendarStats } from "react-icons/tb";
import { HiOutlineDocumentText } from "react-icons/hi2";

import { OfflineCache } from "@/lib/offlineQueue";

import { StudentHeader } from "./_components/StudentHeader";
import { StudentInfoCard } from "./_components/StudentInfoCard";
import { StudentContactCard } from "./_components/StudentContactCard";
import { StudentFinancialCard } from "./_components/StudentFinancialCard";
import { StudentPaymentCard } from "./_components/StudentPaymentCard";
import { StudentBooksCard } from "./_components/StudentBooksCard";
import { StudentQuickStats } from "./_components/StudentQuickStats";
import { StudentNotesCard } from "./_components/StudentNotesCard";
import { StudentAttendanceCard } from "./_components/StudentAttendanceCard";
import { StudentMembershipCard } from "./_components/StudentMembershipCard";
import { StudentExamsCard } from "./_components/StudentExamsCard";

const TABS = [
  { id: "memberships", label: "سجل المجموعات", icon: <TbCalendarStats size={16} /> },
  { id: "overview",    label: "نظرة عامة",  icon: <RiUserLine size={16} /> },
  { id: "financial",  label: "المالية",     icon: <MdOutlinePayments size={16} /> },
  { id: "payments",   label: "سجل الدفع",  icon: <TbCalendarStats size={16} /> },
  { id: "attendance", label: "سجل الحضور", icon: <TbCalendarStats size={16} /> },
  { id: "exams",      label: "الامتحانات",  icon: <HiOutlineDocumentText size={16} /> },
  { id: "books",      label: "الكتب",       icon: <MdOutlineMenuBook size={16} /> },
  { id: "notes",      label: "الملاحظات",  icon: <HiOutlineDocumentText size={16} /> },
];

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const cachedTeacher = typeof window !== "undefined" ? OfflineCache.loadTeacher() : null;
  const [student, setStudent] = useState<Student | null>(null);
  const [groups, setGroups] = useState<Group[]>(() => typeof window !== "undefined" ? OfflineCache.loadGroups() : []);
  const [grades, setGrades] = useState<Grade[]>(() => (typeof window !== "undefined" && cachedTeacher?.id) ? OfflineCache.loadGrades(cachedTeacher.id) : []);
  const [teacherBooks, setTeacherBooks] = useState<BookDef[]>(() => cachedTeacher?.books || []);
  const [defaultMonthlyPrice, setDefaultMonthlyPrice] = useState(() => Number(cachedTeacher?.monthly_price) || 0);
  const [subs, setSubs] = useState<MonthlySubscription[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const handleCardSaved = (updated: Partial<Student>) => {
    setStudent((prev) => prev ? { ...prev, ...updated } : prev);
    if (student && ["discount_value", "family_discount_percent", "custom_monthly_price", "group_id", "subscription_start_month", "subscription_start_year"].some(key => key in updated)) {
      SubscriptionsService.getStudentSubscriptions(student.id).then(setSubs).catch(() => showToast("تم الحفظ، لكن تعذر تحديث سجل الدفع. أعد فتح الصفحة.", "error"));
    }
  };
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // الـ layout بيتحقق من الـ session — بنجيب الـ teacher من الـ cache مباشرة
        const currentUser = OfflineCache.loadTeacher();
        if (!currentUser?.id || cancelled) { router.replace("/teacher/login"); return; }

        // نجلب كل شيء بالتوازي — id موجود من URL params فلا حاجة لـ waterfall
        const [studentData, groupsData, gradesData, teacherProfile, subsData] = await Promise.all([
          StudentsService.getStudentById(id),
          GroupsService.getGroupsByTeacherId(),
          GradesService.getGradesByTeacherId(currentUser.id),
          TeachersService.getTeacherProfile(currentUser.id),
          SubscriptionsService.getStudentSubscriptions(id),
        ]);
        if (cancelled) return;

        if (!studentData) { router.replace("/teacher/students"); return; }

        setSubs(subsData);

        const normalized: Student = {
          ...studentData,
          received_books: Array.isArray(studentData.received_books) ? studentData.received_books : [],
        };

        setStudent(normalized);
        setGroups(groupsData);
        OfflineCache.saveGroups(groupsData);
        setGrades(gradesData);
        OfflineCache.saveGrades(gradesData, currentUser.id);
        setTeacherBooks(teacherProfile?.books || []);
        setDefaultMonthlyPrice(Number(teacherProfile?.monthly_price) || 0);
      } catch {
        if (!cancelled) showToast("حدث خطأ أثناء تحميل البيانات.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, router]);


const handleDelete = async () => {
    if (!student) return;
    if (!confirm(`هل أنت متأكد من حذف "${student.name}"؟`)) return;
    try {
      await StudentsService.deleteStudent(student.id);
      router.replace("/teacher/students");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "فشل حذف الطالب.", "error");
    }
  };

  if (loading) return <Spinner fullScreen />;
  if (!student) return <div className="glass-panel" role="alert" style={{ padding: 24 }}><p>تعذر تحميل بيانات الطالب.</p><button onClick={() => window.location.reload()}>إعادة المحاولة</button></div>;

  const group = groups.find((g) => g.id === student.group_id);
  const grade = grades.find((g) => g.id === student.grade_id);
  const studentBooks = teacherBooks.filter((b) => !b.grade_id || b.grade_id === student.grade_id);

  return (
    <div>
      <StudentHeader
        student={student}
        group={group}
        grade={grade}
        subs={subs}
        onDelete={handleDelete}
        onStudentUpdate={handleCardSaved}
        onNavigateToBooks={() => setActiveTab("books")}
      />

      <StudentQuickStats student={student} books={studentBooks} subs={subs} />

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.65rem 1.1rem",
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.88rem", fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--color-teal)" : "var(--text-muted)",
                borderBottom: isActive ? "2px solid var(--color-teal)" : "2px solid transparent",
                marginBottom: "-1px",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "memberships" && <StudentMembershipCard key={student.id} studentId={student.id} />}

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          <StudentInfoCard
            student={student}
            groups={groups}
            grades={grades}
            onSaved={handleCardSaved}
          />
          <StudentContactCard
            student={student}
            onSaved={handleCardSaved}
          />
        </div>
      )}

      {activeTab === "financial" && (
        <div style={{ maxWidth: "min(600px, 100%)" }}>
          <StudentFinancialCard
            defaultMonthlyPrice={defaultMonthlyPrice}
            student={student}
            group={group}
            onSaved={handleCardSaved}
          />
        </div>
      )}

      {activeTab === "payments" && (
        <StudentPaymentCard studentId={student.id} initialSubs={subs} onChanged={setSubs} />
      )}

      {activeTab === "exams" && (
        <div style={{ maxWidth: "min(700px, 100%)" }}>
          <StudentExamsCard studentId={student.id} />
        </div>
      )}

      {activeTab === "books" && (
        <StudentBooksCard student={student} />
      )}

      {activeTab === "attendance" && (
        <div style={{ maxWidth: "min(700px, 100%)" }}>
          <StudentAttendanceCard studentId={student.id} />
        </div>
      )}

      {activeTab === "notes" && (
        <StudentNotesCard
          student={student}
          onUpdate={(notes) => setStudent((s) => s ? { ...s, notes } : s)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
