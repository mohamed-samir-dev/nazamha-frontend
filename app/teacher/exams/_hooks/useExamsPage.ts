"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthService } from "@/lib/services/authService";
import { questionsService } from "@/lib/services/questionsService";
import { examsService } from "@/lib/services/examsService";
import { Exam, Student, Grade, Group as GroupType, QuestionBank } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { StudentsService } from "@/lib/services/studentsService";

export type { GroupType as Group };

export type ToastType = "success" | "error";

export interface Toast {
  message: string;
  type: ToastType;
}

export function useExamsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

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
        const gradeIdsWithGroups = new Set((grps as GroupType[]).map(g => g.grade_id).filter(Boolean));
        setGroups(grps as GroupType[]);
        setGrades(grds.filter(g => gradeIdsWithGroups.has(g.id)));
        setBanks(allBanks);
      } catch {
        if (!cancelled) showToast("حدث خطأ أثناء تحميل البيانات", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [showToast]);

  const handleGradeSelect = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSelectedGroupId("");
    setStudents([]);
    setSelectedExam(null);
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedExam(null);
  };

  const handleSelectBank = async (bank: QuestionBank) => {
    try {
      const exam = await examsService.findOrCreateByBank({
        bank_id: bank.id,
        group_id: bank.group_id ?? selectedGroupId,
        title: bank.exam_title || bank.title,
        max_score: bank.total_score ?? 100,
        exam_date: bank.exam_date ?? "",
      }, userId ?? undefined);
      setSelectedExam(exam);
    } catch {
      showToast("حدث خطأ أثناء فتح الامتحان", "error");
    }
  };

  useEffect(() => {
    if (!selectedGroupId) return;
    let cancelled = false;
    async function loadStudents() {
      try {
        // نجلب فقط الـ fields اللازمة للامتحانات
        const studentData = await StudentsService.getStudentsByTeacherId("id,name,code,group_id,grade_id");
        if (!cancelled) setStudents(studentData.filter((s) => s.group_id === selectedGroupId));
      } catch {
        if (!cancelled) showToast("حدث خطأ أثناء تحميل الطلاب", "error");
      }
    }
    loadStudents();
    return () => { cancelled = true; };
  }, [selectedGroupId, showToast]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const examsForGroup = banks.filter((b) => {
    const groupMatch = b.group_id === selectedGroupId || !b.group_id;
    const gradeMatch = !b.grade_id || b.grade_id === selectedGroup?.grade_id;
    return groupMatch && gradeMatch;
  });

  const groupsForSelectedGrade = selectedGradeId
    ? groups.filter((g) => g.grade_id === selectedGradeId)
    : groups;

  return {
    loading,
    userId,
    teacherName,
    grades,
    groups,
    groupsForSelectedGrade,
    selectedGradeId,
    selectedGroupId,
    handleGradeSelect,
    handleGroupSelect,
    exams: examsForGroup,
    students,
    selectedExam,
    setSelectedExam,
    handleSelectBank,
    toast,
    showToast,
  };
}
