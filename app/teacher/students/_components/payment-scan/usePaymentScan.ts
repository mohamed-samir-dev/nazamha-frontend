"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Student, MonthlySubscription, Group } from "@/lib/types";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";
import type { Html5Qrcode } from "html5-qrcode";
import { ARABIC_MONTHS, SCAN_COOLDOWN_MS, SCANNER_DIV_ID, DueMonth, PaidEntry } from "./types";
import { getErrorMessage, getCameraErrorMessage } from "@/lib/errors";

interface Props {
  ownerId?: string;
  autoCamera?: boolean;
  students: Student[]; groups: Group[]; subsMap?: Map<string, MonthlySubscription[]> | null;
  onStudentUpdated: (id: string, months: boolean[]) => void;
  onSubsPaid?: (id: string, subs: MonthlySubscription[]) => void;
  onStudentChanged?: (student: Student) => void;
}
export function usePaymentScan({ ownerId, autoCamera = false, onStudentUpdated, onSubsPaid, onStudentChanged }: Props) {
  const now = new Date();
  const [selectedMonth, setMonth] = useState(now.getMonth());
  const [selectedYear, setYear] = useState(now.getFullYear());
  const [scanning, setScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [paidList, setPaidList] = useState<PaidEntry[]>([]);
  const [historyError, setHistoryError] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [dueMonths, setDueMonths] = useState<DueMonth[] | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [selectedSubs, setSelection] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [flashMsg, setFlashMsg] = useState<{ text: string; type: "success" | "error" | "warn" } | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startPromise = useRef<Promise<void> | null>(null);
  const cameraEpoch = useRef(0);
  const mounted = useRef(true);
  const epoch = useRef(0);
  const busy = useRef(false);
  const saving = useRef(false);
  const cardOpen = useRef(false);
  const period = useRef({ month: selectedMonth + 1, year: selectedYear });
  const lastCode = useRef("");
  const cooldown = useRef({ code: "", until: 0 });
  const cameraCode = useRef("");
  const audio = useRef<AudioContext | null>(null);
  const autoPay = useRef<(student: Student, due: DueMonth[], target: {month: number; year: number}) => Promise<void>>(async () => {});
  const attempt = useRef<{ key: string; studentId: string; items: { id: string; amount: number; discount: number }[]; autoPeriod?: {month: number; year: number} } | null>(null);

  const storageKey = ownerId ? `payment-scan:pending:${ownerId}` : null;
  const clearAttempt = () => { attempt.current = null; if (storageKey) { try { sessionStorage.removeItem(storageKey); } catch {} } };
  const resolveAmount = (sub: MonthlySubscription, _student?: Student) => sub.amount - sub.discount;
  const stopScanner = useCallback(async () => {
    cameraEpoch.current++;
    const starting = startPromise.current;
    if (starting) await starting.catch(() => {});
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try { await scanner.stop(); } catch { /* already stopped */ }
      try { scanner.clear(); } catch { /* no mounted reader */ }
    }
    if (mounted.current) { setScanning(false); setIsStarting(false); }
  }, []);
  const dismissCard = useCallback(() => {
    if (saving.current || attempt.current) return;
    epoch.current++; busy.current = false; cardOpen.current = false;
    setLoadingCode(false); setCurrentStudent(null); setDueMonths(null); setSelection(new Set());
  }, []);
  const setSelectedMonth = (value: number) => {
    if (saving.current || attempt.current) return;
    period.current.month = value + 1; setMonth(value); dismissCard(); void stopScanner();
  };
  const setSelectedYear = (value: number) => {
    if (saving.current || attempt.current || !Number.isInteger(value) || value < 2000 || value > 2100) return;
    period.current.year = value; setYear(value); dismissCard(); void stopScanner();
  };
  const setSelectedSubs = (update: Set<string> | ((old: Set<string>) => Set<string>)) => {
    if (!saving.current && !attempt.current) setSelection(update);
  };
  const refreshHistory = useCallback(async () => {
    try {
      const entries = await SubscriptionsService.recentPayments();
      if (mounted.current) {
        setPaidList(old => [...new Map([...entries, ...old].map(e => [e.id, e])).values()].sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0,30));
        setHistoryError(false);
      }
    } catch { if (mounted.current) setHistoryError(true); }
  }, []);

  const handleCode = useCallback(async (raw: string, camera = false) => {
    const code = raw.trim();
    if (!code || busy.current || saving.current || attempt.current) return;
    busy.current = true;
    const request = ++epoch.current;
    const target = { ...period.current };
    lastCode.current = code;
    cardOpen.current = false;
    setLoadingCode(true); setFlashMsg(null); setCurrentStudent(null); setDueMonths(null);
    if (!camera) void stopScanner();
    try {
      const { student, subscriptions: subs } = await SubscriptionsService.lookupPaymentStudent(code);
      if (!mounted.current || request !== epoch.current) return;
      setManualCode(student.center_student_code || student.code || "");
      const due = subs.filter(s => s.status === "due" && (s.year < target.year || (s.year === target.year && s.month <= target.month)))
        .sort((a,b) => a.year - b.year || a.month - b.month)
        .map(sub => ({ sub, label: `${ARABIC_MONTHS[sub.month - 1]} ${sub.year}`, isOld: sub.year < target.year || sub.month < target.month }));
      onSubsPaid?.(student.id, subs);
      if (!due.length) {
        const settled = subs.some(s => s.month === target.month && s.year === target.year && (s.status === "paid" || s.status === "exempt"));
        setFlashMsg({ text: `${student.name} — ${settled ? "مسدد بالفعل أو معفي" : "الشهر المختار غير مستحق أو غير موجود"}. لم يتم تسجيل أي دفع.`, type: "warn" });
        return;
      }
      cardOpen.current = true;
      setCurrentStudent(student); setDueMonths(due); setSelection(new Set(due.map(d => d.sub.id)));
      const only = due[0].sub;
      if (camera && autoCamera && due.length === 1 && only.month === target.month && only.year === target.year &&
          !student.is_suspended && Number.isFinite(only.amount) && Number.isFinite(only.discount) &&
          only.amount > only.discount && only.discount >= 0) {
        busy.current = false; setLoadingCode(false);
        await autoPay.current(student, due, target);
        return;
      }
      setFlashMsg({ text: "راجع الطالب والشهور والمبلغ، ثم أكد استلام الدفع.", type: "warn" });
    } catch (error) {
      if (mounted.current && request === epoch.current) setFlashMsg({ text: getErrorMessage(error, "تعذر تحميل الطالب. أعد المحاولة بنفس الكود."), type: "error" });
    } finally {
      if (mounted.current && request === epoch.current) { busy.current = false; setLoadingCode(false); }
    }
  }, [onSubsPaid, stopScanner, autoCamera]);
  const processQR = useCallback(async (raw: string) => {
    if (cardOpen.current || busy.current || saving.current || attempt.current) return;
    const code = raw.trim();
    if (!code || (autoCamera && cameraCode.current === code)) return;
    if (cooldown.current.code === code && cooldown.current.until > Date.now()) return;
    cooldown.current = { code, until: Date.now() + SCAN_COOLDOWN_MS };
    cameraCode.current = code;
    await handleCode(code, true);
  }, [handleCode, autoCamera]);
  const handleManualSubmit = async () => { await handleCode(manualCode); };
  const reloadStudent = async () => { if (!attempt.current) await handleCode(lastCode.current); };

  const submitPayment = async (automatic?: { student: Student; due: DueMonth[]; target: {month: number; year: number} }) => {
    if (saving.current || busy.current || (!attempt.current && !automatic && (!currentStudent || !dueMonths || !selectedSubs.size))) return;
    const chosen = automatic?.due ?? (dueMonths ?? []).filter(d => selectedSubs.has(d.sub.id));
    if (chosen.some(({sub}) => !Number.isFinite(sub.amount) || !Number.isFinite(sub.discount) || sub.amount < 0 || sub.discount < 0 || sub.discount > sub.amount)) {
      setFlashMsg({ text: "مبالغ الاشتراك غير صحيحة. صحح بيانات الاشتراك قبل الدفع.", type: "error" }); return;
    }
    saving.current = true; setIsConfirming(true); setFlashMsg(null);
    const operation = attempt.current ?? { key: crypto.randomUUID(), studentId: (automatic?.student ?? currentStudent)!.id, items: chosen.map(({sub}) => ({ id: sub.id, amount: sub.amount, discount: sub.discount })), ...(automatic ? {autoPeriod: automatic.target} : {}) };
    attempt.current = operation;
    if (storageKey) { try { sessionStorage.setItem(storageKey, JSON.stringify(operation)); } catch {} }
    try {
      const result = await SubscriptionsService.pay(operation.studentId, operation.items, operation.key, operation.autoPeriod);
      clearAttempt();
      if (!mounted.current) return;
      setUncertain(false);
      onSubsPaid?.(operation.studentId, result.subscriptions);
      onStudentChanged?.(result.student);
      const year = new Date().getFullYear();
      const months = Array.from({ length: 12 }, (_, i) => result.subscriptions.some(sub => sub.year === year && sub.month === i + 1 && (sub.status === "paid" || sub.status === "exempt")));
      onStudentUpdated(operation.studentId, months);
      setPaidList(old => [result.receipt, ...old.filter(e => e.id !== result.receipt.id)].slice(0,30));
      if (audio.current?.state === "running") {
        try {
          const oscillator = audio.current.createOscillator(), gain = audio.current.createGain();
          oscillator.connect(gain); gain.connect(audio.current.destination);
          oscillator.frequency.value = 880; gain.gain.setValueAtTime(.06, audio.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(.001, audio.current.currentTime + .15);
          oscillator.start(); oscillator.stop(audio.current.currentTime + .16);
        } catch { /* Audio is optional; a saved payment remains successful. */ }
      }
      setFlashMsg({ text: `تم تسجيل دفع ${result.receipt.name}: ${result.receipt.amount.toLocaleString("ar-EG")} ج. رقم العملية ${result.receipt.id}`, type: "success" });
      cardOpen.current = false; setCurrentStudent(null); setDueMonths(null); setSelection(new Set()); setManualCode(result.receipt.code || "");
    } catch (error) {
      if (!mounted.current) return;
      const status = (error as {status?: number})?.status;
      if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
        clearAttempt(); setUncertain(false);
        setFlashMsg({ text: getErrorMessage(error, "لم يتم حفظ الدفع. أعد تحميل بيانات الطالب."), type: "error" });
      } else {
        setUncertain(true);
        setFlashMsg({ text: "تعذر التأكد من نتيجة الحفظ. أعد محاولة التأكيد بنفس العملية؛ لن نسجلها مرتين. لا تسجل دفعًا جديدًا لهذا الطالب قبل التحقق.", type: "error" });
      }
    } finally { saving.current = false; if (mounted.current) setIsConfirming(false); }
  };
  autoPay.current = (student, due, target) => submitPayment({student, due, target});
  const handleConfirmPayment = () => submitPayment();

  const startScanner = useCallback(async () => {
    if (startPromise.current || scannerRef.current || saving.current || busy.current || cardOpen.current || attempt.current) return;
    const generation = ++cameraEpoch.current;
    try {
      if (typeof AudioContext !== "undefined") {
        audio.current ??= new AudioContext();
        void audio.current.resume().catch(() => {});
      }
    } catch { /* Camera and payment still work without audio. */ }
    cameraCode.current = "";
    setIsStarting(true); setFlashMsg(null);
    const task = (async () => {
      let qr: Html5Qrcode | null = null;
      try {
        const { Html5Qrcode: Scanner } = await import("html5-qrcode");
        if (!mounted.current || generation !== cameraEpoch.current) return;
        qr = new Scanner(SCANNER_DIV_ID);
        scannerRef.current = qr;
        await qr.start({ facingMode: "environment" }, { fps: 10, qrbox: (w,h) => ({ width: Math.min(220, Math.floor(Math.min(w,h)*0.7)), height: Math.min(220, Math.floor(Math.min(w,h)*0.7)) }) }, processQR, () => {});
        if (!mounted.current || generation !== cameraEpoch.current) {
          try { await qr.stop(); } catch {} try { qr.clear(); } catch {}
          if (scannerRef.current === qr) scannerRef.current = null;
          return;
        }
        setScanning(true);
      } catch (error) {
        if (qr) { try { await qr.stop(); } catch {} try { qr.clear(); } catch {} }
        if (scannerRef.current === qr) scannerRef.current = null;
        if (mounted.current && generation === cameraEpoch.current) setFlashMsg({ text: getCameraErrorMessage(error) + " يمكنك استخدام كود الطالب بدلًا من الكاميرا.", type: "error" });
      } finally { if (mounted.current) setIsStarting(false); }
    })();
    startPromise.current = task;
    try { await task; } finally { if (startPromise.current === task) startPromise.current = null; }
  }, [processQR]);
  useEffect(() => {
    mounted.current = true;
    if (storageKey) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
        if (saved && typeof saved.key === "string" && typeof saved.studentId === "string" && Array.isArray(saved.items) && saved.items.length) {
          attempt.current = saved;
          setUncertain(true);
          setFlashMsg({ text: "توجد عملية سابقة لم تتأكد نتيجتها. اضغط التحقق وإعادة نفس العملية قبل تسجيل دفع جديد.", type: "warn" });
        }
      } catch { /* invalid local checkpoint does not initiate a payment */ }
    }
    const unload = (event: BeforeUnloadEvent) => { if (saving.current || attempt.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", unload);
    return () => { mounted.current = false; epoch.current++; window.removeEventListener("beforeunload", unload); void stopScanner(); if (audio.current) {void audio.current.close().catch(() => {}); audio.current = null;} };
  }, [refreshHistory, stopScanner, storageKey]);
  const totalSelected = dueMonths?.filter(d => selectedSubs.has(d.sub.id)).reduce((sum,d) => sum + resolveAmount(d.sub),0) ?? 0;
  return { now, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, scanning, isStarting, paidList, historyError, refreshHistory,
    manualCode, setManualCode, dueMonths, currentStudent, selectedSubs, setSelectedSubs, isConfirming, loadingCode, flashMsg,
    totalSelected, resolveAmount, dismissCard, handleManualSubmit, handleConfirmPayment, startScanner, stopScanner, reloadStudent,
    uncertain, canClose: () => !saving.current && !attempt.current, locked: isConfirming || uncertain };
}
