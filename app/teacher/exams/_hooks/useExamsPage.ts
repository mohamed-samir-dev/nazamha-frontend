"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AuthService } from "@/lib/services/authService";
import { questionsService } from "@/lib/services/questionsService";
import { examsService } from "@/lib/services/examsService";
import { Exam, Student, Grade, Group as GroupType, QuestionBank } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { StudentsService } from "@/lib/services/studentsService";
import { getErrorMessage } from "@/lib/errors";

export type { GroupType as Group };

export type ToastType = "success" | "error";

export interface Toast {
  message: string;
  type: ToastType;
}

export function useExamsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [loadingExamId, setLoadingExamId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Read URL query params on initial mount
  const initialGradeId = searchParams.get("gradeId") || "";
  const initialGroupId = searchParams.get("groupId") || "";
  const initialBankId = searchParams.get("bankId") || "";

  const [selectedGradeId, setSelectedGradeId] = useState(initialGradeId);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Update URL search parameters without triggering a full page reload
  const updateUrlParams = useCallback(
    (paramsToUpdate: Record<string, string | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      for (const [key, value] of Object.entries(paramsToUpdate)) {
        if (!value) {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      }
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Initialize teacher info, groups, grades, and question banks
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const currentUser = await AuthService.getUser();
        if (!currentUser || cancelled) return;
        setUserId(currentUser.id);
        setTeacherName(currentUser.name ?? "");

        const [grps, grds, allBanks] = await Promise.all([
          GroupsService.getGroupsByTeacherId(),
          GradesService.getGradesByTeacherId(currentUser.id),
          questionsService.getBanksByTeacherId(currentUser.id),
        ]);
        if (cancelled) return;

        const typedGroups = grps as GroupType[];
        const gradeIdsWithGroups = new Set(typedGroups.map((g) => g.grade_id).filter(Boolean));
        setGroups(typedGroups);
        setGrades(grds.filter((g) => gradeIdsWithGroups.has(g.id)));
        setBanks(allBanks);

        // If URL had a bankId and groupId, auto-load that exam
        if (initialBankId && initialGroupId) {
          const matchingBank = allBanks.find((b) => b.id === initialBankId);
          if (matchingBank) {
            try {
              const exam = await examsService.findOrCreateByBank(
                {
                  bank_id: matchingBank.id,
                  group_id: matchingBank.group_id ?? initialGroupId,
                  title: matchingBank.exam_title || matchingBank.title,
                  max_score: matchingBank.total_score ?? 100,
                  exam_date: matchingBank.exam_date ?? "",
                },
                currentUser.id
              );
              if (!cancelled) setSelectedExam(exam);
            } catch {
              // Ignore silent init error
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          showToast(getErrorMessage(err, "حدث خطأ أثناء تحميل البيانات"), "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [initialBankId, initialGroupId, showToast]);

  const handleGradeSelect = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSelectedGroupId("");
    setStudents([]);
    setSelectedExam(null);
    updateUrlParams({ gradeId, groupId: null, bankId: null });
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedExam(null);
    updateUrlParams({ groupId, bankId: null });
  };

  const handleSelectBank = async (bank: QuestionBank) => {
    setLoadingExamId(bank.id);
    try {
      const exam = await examsService.findOrCreateByBank(
        {
          bank_id: bank.id,
          group_id: bank.group_id ?? selectedGroupId,
          title: bank.exam_title || bank.title,
          max_score: bank.total_score ?? 100,
          exam_date: bank.exam_date ?? "",
        },
        userId ?? undefined
      );
      setSelectedExam(exam);
      updateUrlParams({ bankId: bank.id });
    } catch (err) {
      showToast(getErrorMessage(err, "حدث خطأ أثناء فتح الامتحان"), "error");
    } finally {
      setLoadingExamId(null);
    }
  };

  const handleBackToExams = () => {
    setSelectedExam(null);
    updateUrlParams({ bankId: null });
  };

  // Load students strictly for the selected group, including parent_phone for WhatsApp
  useEffect(() => {
    if (!selectedGroupId) {
      setStudents([]);
      return;
    }
    let cancelled = false;
    async function loadStudents() {
      try {
        const studentData = await StudentsService.getStudentsByTeacherId(
          "id,name,code,group_id,grade_id,parent_phone",
          selectedGroupId
        );
        if (!cancelled) {
          setStudents(studentData.filter((s) => s.group_id === selectedGroupId));
        }
      } catch (err) {
        if (!cancelled) {
          showToast(getErrorMessage(err, "حدث خطأ أثناء تحميل بيانات الطلاب"), "error");
        }
      }
    }
    loadStudents();
    return () => {
      cancelled = true;
    };
  }, [selectedGroupId, showToast]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const examsForGroup = banks.filter((b) => {
    const groupMatch = b.group_id === selectedGroupId || !b.group_id;
    const gradeMatch = !b.grade_id || b.grade_id === selectedGroup?.grade_id;
    return groupMatch && gradeMatch;
  });

  return {
    loading,
    loadingExamId,
    userId,
    teacherName,
    grades,
    groups,
    selectedGradeId,
    selectedGroupId,
    handleGradeSelect,
    handleGroupSelect,
    exams: examsForGroup,
    students,
    selectedExam,
    setSelectedExam,
    handleSelectBank,
    handleBackToExams,
    toast,
    showToast,
  };
}
