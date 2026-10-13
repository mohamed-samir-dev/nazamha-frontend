"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Student, MonthlySubscription, Group } from "@/lib/types";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";
import type { Html5Qrcode } from "html5-qrcode";
import { ARABIC_MONTHS, SCAN_COOLDOWN_MS, SCANNER_DIV_ID, DueMonth, PaidEntry } from "./types";
import { getErrorMessage, getCameraErrorMessage } from "@/lib/errors";
import { StudentsService } from "@/lib/services/studentsService";

interface UsePaymentScanProps {
  students: Student[];
  groups: Group[];
  /** Parent cache remains accepted for callers; scans fetch current amounts
   *  so a group transfer cannot charge or display a stale subscription. */
  subsMap?: Map<string, MonthlySubscription[]> | null;
  onStudentUpdated: (studentId: string, months: boolean[]) => void;
  onSubsPaid?: (studentId: string, updatedSubs: MonthlySubscription[]) => void;
}

export function usePaymentScan({ students, groups, subsMap, onStudentUpdated, onSubsPaid }: UsePaymentScanProps) {
  const now = new Date();
  const currentYear = now.getFullYear();

  function resolveAmount(sub: MonthlySubscription, student: Student): number {
    if (sub.amount > 0) return sub.amount - sub.discount;
    let base = 0;
    if (student.custom_monthly_price && student.custom_monthly_price > 0) {
      base = student.custom_monthly_price;
    } else if (student.group_id) {
      const grp = stateRef.current.groups.find(g => g.id === student.group_id);
      if (grp?.monthly_price && grp.monthly_price > 0) base = grp.monthly_price;
    }
    if (base === 0) return 0;
    const discountPct = (student.family_discount_percent ?? 0) > 0
      ? student.family_discount_percent!
      : (Number(student.discount_value) || 0);
    return discountPct > 0 ? Math.round(base * (1 - discountPct / 100)) : base;
  }

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [scanning, setScanning]     = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [paidList, setPaidList]     = useState<PaidEntry[]>([]);
  const [manualCode, setManualCode] = useState("");

  const [dueMonths, setDueMonths]           = useState<DueMonth[] | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [selectedSubs, setSelectedSubs]     = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming]     = useState(false);
  const [loadingCode, setLoadingCode]       = useState(false);
  const [flashMsg, setFlashMsg]             = useState<{ text: string; type: "success" | "error" | "warn" } | null>(null);
  const [overduePopup, setOverduePopup]     = useState(false);

  const scannerRef    = useRef<Html5Qrcode | null>(null);
  const cooldownRef   = useRef<Map<string, number>>(new Map());
  const processingRef = useRef<Set<string>>(new Set());
  const stateRef      = useRef({ students, selectedMonth, groups, subsMap });
  // كاش محلي لكل سجلات الطالب الحالي — يُمرَّر من handleCode لـ handleConfirmPayment
  // لتجنب إعادة جلبها بعد bulkUpdate
  const currentStudentSubsRef = useRef<MonthlySubscription[]>([]);

  useEffect(() => { stateRef.current = { students, selectedMonth, groups, subsMap }; }, [students, selectedMonth, groups, subsMap]);

  const flash = useCallback((text: string, type: "success" | "error" | "warn", ms = 3000) => {
    setFlashMsg({ text, type });
    setTimeout(() => setFlashMsg(null), ms);
  }, []);

  const dismissCard = useCallback(() => {
    setCurrentStudent(null);
    setDueMonths(null);
    setSelectedSubs(new Set());
    setOverduePopup(false);
    currentStudentSubsRef.current = [];
  }, []);

  const recordPaid = useCallback((student: Student, amount: number, updatedMonthIndex: number) => {
    const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    setPaidList(prev => [{ name: student.name, time, amount }, ...prev]);
    const newMonths = (student.months ?? Array(12).fill(false)).map((v, i) =>
      i === updatedMonthIndex ? true : (v as boolean)
    );
    onStudentUpdated(student.id, newMonths);
  }, [onStudentUpdated]);

  const handleCode = useCallback(async (rawCode: string) => {
    const { selectedMonth } = stateRef.current;
    const targetMonth = selectedMonth + 1;

    setLoadingCode(true);
    dismissCard();
    try {
      // Resolve the permanent card against current data, including off-page students.
      const student = await StudentsService.getStudentByQR(rawCode);
      const subs = await SubscriptionsService.getStudentSubscriptions(student.id);
      // احتفظ بالقائمة الكاملة حتى يستخدمها handleConfirmPayment بدون GET إضافي
      currentStudentSubsRef.current = subs;
      const targetSub = subs.find(s => s.month === targetMonth && s.year === currentYear);

      if (targetSub?.status === "paid") {
        flash(`${student.name} — دفع هذا الشهر مسبقاً ✓`, "warn");
        return;
      }

      if (targetSub?.status === "exempt") {
        const hasOldDue = subs.some(s =>
          s.status === "due" &&
          (s.year < currentYear || (s.year === currentYear && s.month < targetMonth))
        );
        if (!hasOldDue) {
          flash(`${student.name} — معفي من دفع هذا الشهر 🎁`, "warn");
          return;
        }
      }

      const due: DueMonth[] = subs
        .filter(s =>
          s.status === "due" &&
          (s.year < currentYear || (s.year === currentYear && s.month <= targetMonth))
        )
        .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
        .map(s => ({
          sub: s,
          label: `${ARABIC_MONTHS[s.month - 1]}${s.year !== currentYear ? ` ${s.year}` : ""}`,
          isOld: s.year < currentYear || (s.year === currentYear && s.month < targetMonth),
          isExempt: false,
        }));

      if (due.length === 0) {
        flash(`${student.name} — لا توجد مستحقات 🎉`, "success");
        return;
      }

      const oldCount = due.filter(d => d.isOld).length;
      if (oldCount > 0) {
        setCurrentStudent(student);
        setDueMonths(due);
        setSelectedSubs(new Set(due.map(d => d.sub.id)));
        if (oldCount >= 2) {
          // أكتر من شهرين متأخرين — وقف السكانر وافتح popup
          setOverduePopup(true);
          // stopScanner غير متاح هنا مباشرة — نستخدم ref
          if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch {}
            try { scannerRef.current.clear(); } catch {}
            scannerRef.current = null;
            setScanning(false);
          }
        }
        return;
      }

      const sub = due[0].sub;
      const updatedSub = await SubscriptionsService.updateSubscription(sub.id, { status: "paid", paid_at: new Date().toISOString() });
      const amount = resolveAmount(sub, student);
      // استخدم الـ subs الحالية وحدّث فقط الـ record المتغيّر — بدون GET ثاني
      // إنشاء array جديد (immutable) لضمان أن React يكتشف التغيير
      const freshSubs = subs.map(s => s.id === updatedSub.id ? { ...updatedSub } : { ...s });
      
      // تحديث subsMap أولاً قبل recordPaid لضمان التزامن
      onSubsPaid?.(student.id, freshSubs);
      
      // ثم تحديث months array
      recordPaid(student, amount, targetMonth - 1);
      
      flash(`✓ ${student.name}${amount > 0 ? ` · ${amount.toLocaleString("ar-EG")} ج` : ""}`, "success", 4000);
    } catch (error) {
      flash(getErrorMessage(error, "حدث خطأ، حاول مرة أخرى"), "error");
    } finally {
      setLoadingCode(false);
    }
  }, [flash, currentYear, dismissCard, recordPaid, onSubsPaid]);

  const processQR = useCallback(async (rawCode: string) => {
    const nowMs = Date.now();
    if ((cooldownRef.current.get(rawCode) ?? 0) + SCAN_COOLDOWN_MS > nowMs) return;
    if (processingRef.current.has(rawCode)) return;
    processingRef.current.add(rawCode);
    cooldownRef.current.set(rawCode, nowMs);
    await handleCode(rawCode);
    processingRef.current.delete(rawCode);
  }, [handleCode]);

  const handleManualSubmit = async () => {
    const code = manualCode.trim();
    if (!code || loadingCode) return;
    setManualCode("");
    await handleCode(code);
  };

  const handleConfirmPayment = async () => {
    if (!currentStudent || !dueMonths || selectedSubs.size === 0) return;
    setIsConfirming(true);
    try {
      const toUpdate = dueMonths
        .filter(d => selectedSubs.has(d.sub.id))
        .map(d => ({ id: d.sub.id, status: "paid" as const }));

      const updatedDocs = await SubscriptionsService.bulkUpdateSubscriptions(currentStudent.id, toUpdate);

      const amount = dueMonths
        .filter(d => selectedSubs.has(d.sub.id))
        .reduce((s, d) => s + resolveAmount(d.sub, currentStudent), 0);

      const paidMonthIndexes = new Set(
        dueMonths.filter(d => selectedSubs.has(d.sub.id)).map(d => d.sub.month - 1)
      );
      const newMonths = (currentStudent.months ?? Array(12).fill(false)).map((v, i) =>
        paidMonthIndexes.has(i) ? true : (v as boolean)
      );

      // بناء freshSubs من الـ cache المحلي + الـ updated docs من الـ API
      // بدون GET إضافي — نمسح الـ ref بعدها لمنع استخدام بيانات قديمة
      const updatedMap = new Map(updatedDocs.map(d => [d.id, d]));
      const cachedSubs = currentStudentSubsRef.current;
      // إنشاء array جديد دائمًا (immutable) حتى لو كانت البيانات نفسها
      const freshSubs: MonthlySubscription[] = cachedSubs.length > 0
        ? cachedSubs.map(s => updatedMap.get(s.id) ?? s).map(s => ({ ...s }))
        : updatedDocs.map(s => ({ ...s }));
      currentStudentSubsRef.current = [];

      // استخدم Promise.all للتأكد من تنفيذ التحديثات معًا
      // حتى يتم re-render واحد بدلاً من اثنين منفصلين
      await Promise.all([
        // تحديث subsMap أولاً
        Promise.resolve(onSubsPaid?.(currentStudent.id, freshSubs)),
        // ثم تحديث الـ months في الـ student
        Promise.resolve(onStudentUpdated(currentStudent.id, newMonths))
      ]);
      
      // إضافة للقائمة المدفوعة
      const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
      setPaidList(prev => [{ name: currentStudent.name, time, amount }, ...prev]);
      
      flash(`✓ ${currentStudent.name}${amount > 0 ? ` · ${amount.toLocaleString("ar-EG")} ج` : ""}`, "success", 4000);
      setTimeout(() => dismissCard(), 50);
    } catch {
      flash("فشل الحفظ، حاول مرة أخرى", "error");
    } finally {
      setIsConfirming(false);
    }
  };

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return;
    setIsStarting(true);
    try {
      const { Html5Qrcode: QrcodeClass } = await import("html5-qrcode");
      const qr = new QrcodeClass(SCANNER_DIV_ID);
      scannerRef.current = qr as unknown as Html5Qrcode;
      const el = document.getElementById(SCANNER_DIV_ID);
      const elWidth = el?.offsetWidth || 300;
      const boxSize = Math.min(Math.floor(elWidth * 0.7), 250);
      const config = { fps: 10, qrbox: { width: boxSize, height: boxSize } };
      try {
        await qr.start({ facingMode: "environment" }, config, processQR, () => {});
      } catch {
        const cameras = await QrcodeClass.getCameras();
        if (!cameras?.length) throw new Error("لا توجد كاميرا");
        const back = cameras.find(c => /back|rear|environment/i.test(c.label));
        await qr.start(back ? back.id : cameras[cameras.length - 1].id, config, processQR, () => {});
      }
      setScanning(true);
    } catch (err: unknown) {
      flash(getCameraErrorMessage(err), "error");
      scannerRef.current = null;
    } finally {
      setIsStarting(false);
    }
  }, [processQR, flash]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => { if (scanning) stopScanner(); }, [selectedMonth]); // eslint-disable-line
  useEffect(() => () => {
    if (scannerRef.current) {
      try { scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
    }
  }, []);

  const totalSelected = currentStudent && dueMonths
    ? dueMonths.filter(d => selectedSubs.has(d.sub.id)).reduce((s, d) => s + resolveAmount(d.sub, currentStudent), 0)
    : 0;

  return {
    now,
    selectedMonth, setSelectedMonth,
    scanning, isStarting,
    paidList,
    manualCode, setManualCode,
    dueMonths, currentStudent,
    selectedSubs, setSelectedSubs,
    isConfirming, loadingCode,
    flashMsg,
    totalSelected,
    resolveAmount,
    overduePopup,
    dismissCard,
    handleManualSubmit,
    handleConfirmPayment,
    startScanner, stopScanner,
  };
}
