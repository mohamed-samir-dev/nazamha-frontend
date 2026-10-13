"use client";

import { useState, useEffect, useCallback } from "react";
import { questionsService } from "@/lib/services/questionsService";
import { GradesService } from "@/lib/services/gradesService";
import { GroupsService } from "@/lib/services/groupsService";
import { AuthService } from "@/lib/services/authService";
import { QuestionBank, Question, Grade, Group } from "@/lib/types";

export interface ExamForm {
  title: string;
  subject: string;
  exam_title: string;
  exam_date: string;
  grade_id: string;
  group_id: string;
  total_score: number;
}

export const emptyExamForm: ExamForm = {
  title: "", subject: "", exam_title: "", exam_date: "", grade_id: "", group_id: "", total_score: 100,
};

export function useExamsGenerator() {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [exams, setExams] = useState<QuestionBank[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthService.getUser().then(u => {
      if (!u) return;
      setTeacherId(u.id);
      setTeacherName(u.name || "");
      Promise.all([
        questionsService.getBanksByTeacherId(u.id),
        GradesService.getAllGrades(),
        GroupsService.getGroupsByTeacherId(),
      ]).then(([b, g, gr]) => {
        setExams(b);
        setGrades(g);
        setGroups(gr);
        setLoading(false);
      });
    });
  }, []);

  const loadQuestions = useCallback(async (examId: string) => {
    const qs = await questionsService.getQuestionsByBankId(examId);
    setQuestions(qs);
  }, []);

  const selectExam = (examId: string) => {
    setSelectedExamId(examId);
    loadQuestions(examId);
  };

  const filteredGroups = (gradeId: string) =>
    gradeId ? groups.filter(g => g.grade_id === gradeId) : groups;

  const createExam = async (form: ExamForm) => {
    if (!form.title.trim() || !teacherId) return null;
    const exam = await questionsService.addBank({
      teacher_id: teacherId,
      title: form.title.trim(),
      subject: form.subject.trim(),
      exam_title: form.exam_title.trim(),
      exam_date: form.exam_date,
      grade_id: form.grade_id || null,
      group_id: form.group_id || null,
      total_score: form.total_score || null,
    });
    setExams(prev => [exam, ...prev]);
    selectExam(exam.id);
    return exam;
  };

  const updateExam = async (id: string, form: ExamForm) => {
    const updated = await questionsService.updateBank(id, {
      title: form.title.trim(),
      subject: form.subject.trim(),
      exam_title: form.exam_title.trim(),
      exam_date: form.exam_date,
      grade_id: form.grade_id || null,
      group_id: form.group_id || null,
      total_score: form.total_score || null,
    });
    setExams(prev => prev.map(e => e.id === id ? updated : e));
    return updated;
  };

  const deleteExam = async (id: string) => {
    await questionsService.deleteBank(id);
    setExams(prev => prev.filter(e => e.id !== id));
    if (selectedExamId === id) { setSelectedExamId(null); setQuestions([]); }
  };

  const duplicateExam = async (id: string) => {
    const newExam = await questionsService.duplicateBank(id);
    setExams(prev => [newExam, ...prev]);
  };

  const updateExamTotalScore = async (score: number) => {
    if (!selectedExamId) return;
    const updated = await questionsService.updateBank(selectedExamId, { total_score: score });
    setExams(prev => prev.map(e => e.id === selectedExamId ? updated : e));
  };

  const addQuestion = async (q: Omit<Question, "id" | "bank_id" | "created_at">) => {
    if (!selectedExamId) return;
    // optimistic: add immediately with temp id
    const tempId = `temp_${Date.now()}`;
    const tempQ: Question = { ...q, id: tempId, bank_id: selectedExamId };
    setQuestions(prev => [...prev, tempQ]);
    try {
      const newQ = await questionsService.addQuestion({ ...q, bank_id: selectedExamId });
      setQuestions(prev => prev.map(q => q.id === tempId ? newQ : q));
    } catch {
      setQuestions(prev => prev.filter(q => q.id !== tempId));
    }
  };

  const updateQuestion = async (id: string, updates: Partial<Question>) => {
    // optimistic update
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    try {
      const updated = await questionsService.updateQuestion(id, updates);
      setQuestions(prev => prev.map(q => q.id === id ? updated : q));
    } catch {
      // revert on error — reload from server
      loadQuestions(selectedExamId!);
    }
  };

  const deleteQuestion = async (id: string) => {
    // optimistic delete
    setQuestions(prev => prev.filter(q => q.id !== id));
    try {
      await questionsService.deleteQuestion(id);
    } catch {
      loadQuestions(selectedExamId!);
    }
  };

  const reorderQuestions = (reordered: Question[]) => setQuestions(reordered);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  return {
    teacherName, exams, selectedExamId, selectedExam, questions,
    grades, groups, loading,
    selectExam, filteredGroups,
    createExam, updateExam, deleteExam, duplicateExam, updateExamTotalScore,
    addQuestion, updateQuestion, deleteQuestion, reorderQuestions,
  };
}
