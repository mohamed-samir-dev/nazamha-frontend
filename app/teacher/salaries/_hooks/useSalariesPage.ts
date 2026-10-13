"use client";

import { useState, useEffect, useMemo } from "react";
import { SalariesService } from "@/lib/services/salariesService";
import { TeacherExpensesService } from "@/lib/services/teacherExpensesService";
import { Salary, TeacherExpense, ExpenseType, PaymentStatus, PaymentMethod } from "@/lib/types";

export const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export const CURRENT_YEAR = new Date().getFullYear();
export const CURRENT_MONTH = new Date().getMonth() + 1;

export const EXPENSE_TYPES: { value: ExpenseType; label: string; icon: string; color: string }[] = [
  { value: "rent", label: "إيجار", icon: "🏢", color: "#8b5cf6" },
  { value: "utilities", label: "فواتير", icon: "⚡", color: "#3b82f6" },
  { value: "maintenance", label: "صيانة", icon: "🔧", color: "#ef4444" },
  { value: "supplies", label: "مستلزمات", icon: "📦", color: "#f59e0b" },
  { value: "transport", label: "مواصلات", icon: "🚗", color: "#10b981" },
  { value: "food", label: "طعام", icon: "🍽️", color: "#ec4899" },
  { value: "other", label: "أخرى", icon: "📝", color: "#6b7280" },
];

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: "paid", label: "مدفوع", color: "#10b981" },
  { value: "pending", label: "معلق", color: "#f59e0b" },
  { value: "overdue", label: "متأخر", color: "#ef4444" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "نقداً" },
  { value: "bank_transfer", label: "تحويل بنكي" },
  { value: "card", label: "بطاقة" },
  { value: "other", label: "أخرى" },
];

export interface SalaryForm {
  employee_name: string;
  role: string;
  amount: string;
  is_recurring: boolean;
  // one-time
  month: number;
  year: number;
  // recurring range
  start_month: number;
  start_year: number;
  end_month: number | "";
  end_year: number | "";
  notes: string;
  // expense fields
  title?: string;
  expense_type?: ExpenseType;
  category?: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  paid_date?: string;
}

const EMPTY_FORM: SalaryForm = {
  employee_name: "", 
  role: "", 
  amount: "",
  is_recurring: false,
  month: CURRENT_MONTH, 
  year: CURRENT_YEAR,
  start_month: CURRENT_MONTH, 
  start_year: CURRENT_YEAR,
  end_month: "", 
  end_year: "",
  notes: "",
  title: "",
  expense_type: "other",
  category: "",
  payment_method: "cash",
  payment_status: "pending",
  paid_date: "",
};

type CombinedItem = (Salary | TeacherExpense) & { _itemType: "salary" | "expense" };

export function useSalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [expenses, setExpenses] = useState<TeacherExpense[]>([]);
  const [viewMode, setViewMode] = useState<"salaries" | "expenses">("salaries");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SalaryForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [filterMonth, setFilterMonth] = useState(CURRENT_MONTH);
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      SalariesService.getAll(),
      TeacherExpensesService.getAll()
    ])
      .then(([salariesData, expensesData]) => { 
        if (!cancelled) {
          setSalaries(salariesData);
          setExpenses(expensesData);
        }
      })
      .catch(() => { if (!cancelled) setError("حدث خطأ أثناء تحميل البيانات"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (viewMode === "salaries") {
      return salaries
        .filter(s => s.month === filterMonth && s.year === filterYear)
        .map(s => ({ ...s, _itemType: "salary" as const }));
    } else {
      return expenses
        .filter(e => e.month === filterMonth && e.year === filterYear)
        .map(e => ({ ...e, _itemType: "expense" as const }));
    }
  }, [salaries, expenses, viewMode, filterMonth, filterYear]);

  const totalMonth = filtered.reduce((sum, item) => sum + item.amount, 0);

  const totalYear = useMemo(() => {
    if (viewMode === "salaries") {
      return salaries.filter(s => s.year === filterYear).reduce((sum, s) => sum + s.amount, 0);
    } else {
      return expenses.filter(e => e.year === filterYear).reduce((sum, e) => sum + e.amount, 0);
    }
  }, [salaries, expenses, viewMode, filterYear]);

  const employeeCount = useMemo(
    () => new Set(salaries.map(s => s.employee_name.trim().toLowerCase())).size,
    [salaries]
  );

  const availableYears = useMemo(() => {
    const years = new Set([
      ...salaries.map(s => s.year),
      ...expenses.map(e => e.year)
    ]);
    years.add(CURRENT_YEAR);
    return Array.from(years).sort((a, b) => b - a);
  }, [salaries, expenses]);

  function openAdd() {
    setEditingId(null);
    if (viewMode === "salaries") {
      setForm({
        ...EMPTY_FORM,
        employee_name: "",
        role: "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        title: "",
        expense_type: "other",
        category: "",
        payment_method: "cash",
        payment_status: "paid",
        paid_date: "",
      });
    }
    setFormError("");
    setShowForm(true);
  }

  function openEdit(item: CombinedItem) {
    setEditingId(item.id);
    
    if (item._itemType === "salary") {
      const s = item as Salary;
      setForm({
        employee_name: s.employee_name,
        role: s.role,
        amount: String(s.amount),
        is_recurring: s.is_recurring,
        month: s.month,
        year: s.year,
        start_month: s.start_month ?? s.month,
        start_year: s.start_year ?? s.year,
        end_month: s.end_month ?? "",
        end_year: s.end_year ?? "",
        notes: s.notes || "",
      });
    } else {
      const e = item as TeacherExpense;
      setForm({
        title: e.title,
        expense_type: e.expense_type,
        category: e.category || "",
        amount: String(e.amount),
        is_recurring: e.is_recurring,
        month: e.month,
        year: e.year,
        start_month: e.start_month ?? e.month,
        start_year: e.start_year ?? e.year,
        end_month: e.end_month ?? "",
        end_year: e.end_year ?? "",
        payment_method: e.payment_method || "cash",
        payment_status: e.payment_status,
        paid_date: e.paid_date || "",
        notes: e.notes || "",
        employee_name: "",
        role: "",
      });
    }
    
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (viewMode === "salaries") {
      if (!form.employee_name.trim() || !form.role.trim() || !form.amount) {
        setFormError("يرجى ملء جميع الحقول المطلوبة");
        return;
      }
    } else {
      if (!form.title?.trim() || !form.expense_type || !form.amount) {
        setFormError("يرجى ملء جميع الحقول المطلوبة");
        return;
      }
    }
    
    const amount = Number(form.amount);
    if (isNaN(amount) || amount <= 0) { 
      setFormError("المبلغ يجب أن يكون رقماً موجباً"); 
      return; 
    }

    setActionLoading(true);
    try {
      if (viewMode === "salaries") {
        const payload = {
          employee_name: form.employee_name.trim(),
          role: form.role.trim(),
          amount,
          is_recurring: form.is_recurring,
          month: form.is_recurring ? form.start_month : form.month,
          year: form.is_recurring ? form.start_year : form.year,
          start_month: form.is_recurring ? form.start_month : form.month,
          start_year: form.is_recurring ? form.start_year : form.year,
          end_month: form.is_recurring && form.end_month !== "" ? Number(form.end_month) : null,
          end_year: form.is_recurring && form.end_year !== "" ? Number(form.end_year) : null,
          notes: form.notes.trim(),
        };

        if (editingId) {
          const updated = await SalariesService.update(editingId, payload);
          setSalaries(prev => {
            const withoutOld = prev.filter(s => s.id !== editingId);
            return [updated, ...withoutOld];
          });
          showToast("تم تحديث السجل بنجاح");
        } else {
          const created = await SalariesService.add(payload);
          setSalaries(prev => [created, ...prev]);
          showToast("تم إضافة الراتب بنجاح");
        }
        SalariesService.getAll().then(setSalaries);
      } else {
        const payload = {
          title: form.title!.trim(),
          expense_type: form.expense_type!,
          category: form.category?.trim() || "",
          amount,
          is_recurring: form.is_recurring,
          month: form.is_recurring ? form.start_month : form.month,
          year: form.is_recurring ? form.start_year : form.year,
          start_month: form.is_recurring ? form.start_month : form.month,
          start_year: form.is_recurring ? form.start_year : form.year,
          end_month: form.is_recurring && form.end_month !== "" ? Number(form.end_month) : null,
          end_year: form.is_recurring && form.end_year !== "" ? Number(form.end_year) : null,
          payment_method: form.payment_method || "cash",
          payment_status: form.payment_status || "paid",
          paid_date: form.paid_date || null,
          notes: form.notes.trim(),
        };

        if (editingId) {
          const updated = await TeacherExpensesService.update(editingId, payload);
          setExpenses(prev => {
            const withoutOld = prev.filter(e => e.id !== editingId);
            return [updated, ...withoutOld];
          });
          showToast("تم تحديث المصروف بنجاح");
        } else {
          const created = await TeacherExpensesService.add(payload);
          setExpenses(prev => [created, ...prev]);
          showToast("تم إضافة المصروف بنجاح");
        }
        TeacherExpensesService.getAll().then(setExpenses);
      }
      
      setShowForm(false);
    } catch {
      showToast("حدث خطأ، حاول مرة أخرى", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(true);
    try {
      if (viewMode === "salaries") {
        await SalariesService.remove(id);
        setSalaries(prev => prev.filter(s => s.id !== id));
      } else {
        await TeacherExpensesService.remove(id);
        setExpenses(prev => prev.filter(e => e.id !== id));
      }
      showToast("تم الحذف بنجاح");
    } catch {
      showToast("حدث خطأ أثناء الحذف", "error");
    } finally {
      setActionLoading(false);
      setDeleteConfirm(null);
    }
  }

  async function handleConfirmPayment(id: string, month: number, year: number) {
    setActionLoading(true);
    try {
      if (viewMode === "salaries") {
        const updated = await SalariesService.confirmPayment(id, month, year);
        setSalaries(prev => prev.map(s => s.id === id && s.month === month && s.year === year ? updated : s));
      } else {
        const updated = await TeacherExpensesService.confirmPayment(id, month, year);
        setExpenses(prev => prev.map(e => e.id === id && e.month === month && e.year === year ? updated : e));
      }
      showToast("تم تأكيد الدفع بنجاح ✓");
    } catch {
      showToast("حدث خطأ أثناء تأكيد الدفع", "error");
    } finally {
      setActionLoading(false);
    }
  }

  return {
    salaries, expenses, viewMode, setViewMode,
    loading, actionLoading, error, toast,
    showForm, setShowForm, editingId, form, setForm, formError,
    filterMonth, setFilterMonth, filterYear, setFilterYear,
    deleteConfirm, setDeleteConfirm,
    filtered, totalMonth, totalYear, employeeCount, availableYears,
    openAdd, openEdit, handleSubmit, handleDelete, handleConfirmPayment, showToast,
  };
}
