"use client";

import { getStudentScanParams } from "@/lib/utils/qrParser";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  X, QrCode, Camera, CameraOff, BookOpen, User,
  AlertTriangle, RefreshCw, CheckCircle2, AlertCircle,
  ChevronDown, Search,
} from "lucide-react";
import { BooksService, SellByCodeResult, SellByCodeNeedsConfirm } from "@/lib/services/booksService";
import { Book } from "@/lib/types";
import type { Html5Qrcode } from "html5-qrcode";
import { getErrorMessage, getCameraErrorMessage } from "@/lib/errors";

const SCAN_COOLDOWN_MS = 3000;
const SCANNER_DIV_ID = "book-sale-qr-reader";

interface SoldEntry { studentName: string; bookName: string; time: string; amount: number; }

interface Props {
  books: Book[];
  grades?: { id: string; name: string }[];
  initialBookId?: string;
  onClose: () => void;
  onSold?: () => void;
}

function Spinner({ className = "" }: { className?: string }) {
  return <span className={`inline-block rounded-full border-2 border-white/25 border-t-white animate-spin ${className || "w-3.5 h-3.5"}`} />;
}

export default function BookScanModal({ books, grades = [], initialBookId, onClose, onSold }: Props) {
  const availableBooks = books.filter(b => b.status === "available");
  const [selectedBookId, setSelectedBookId] = useState(initialBookId ?? availableBooks[0]?.id ?? "");
  const [scanning, setScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [manualCode, setManualCode] = useState("");
  // confirmation holds the needs_confirmation:true response from sellByCode
  const [confirmation, setConfirmation] = useState<SellByCodeNeedsConfirm | null>(null);
  const [loading, setLoading] = useState(false);
  const [selling, setSelling] = useState(false);
  const [soldList, setSoldList] = useState<SoldEntry[]>([]);
  const [flashMsg, setFlashMsg] = useState<{ text: string; type: "success" | "error" | "warn" } | null>(null);

  const scannerRef    = useRef<Html5Qrcode | null>(null);
  const cooldownRef   = useRef<Map<string, number>>(new Map());
  const processingRef = useRef<Set<string>>(new Set());

  const flash = useCallback((text: string, type: "success" | "error" | "warn", ms = 4000) => {
    setFlashMsg({ text, type });
    setTimeout(() => setFlashMsg(null), ms);
  }, []);

  const selectedBook = books.find(b => b.id === selectedBookId);
  const isSelectedUnavailable = selectedBook?.status === "unavailable";



  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // ── Core sell function ──────────────────────────────────────────────────
  // Calls POST /books/sell-by-code (1 HTTP request).
  // When backend returns needs_confirmation:true, we show the confirmation UI.
  // When backend returns needs_confirmation:false, the sale is already created.
  const doSell = useCallback(async (code: string, forceResell = false) => {
    if (!selectedBookId) { flash("اختر كتاباً أولاً", "error"); return; }
    if (books.find(b => b.id === selectedBookId)?.status === "unavailable") {
      flash("الكتاب غير متاح للبيع", "error"); return;
    }
    setLoading(true);
    setConfirmation(null);
    try {

      console.log('🔍 [BookScanModal] Scanning code:', code.trim(), 'for book:', selectedBookId);
      const parsed = getStudentScanParams(code);
      
      const result: SellByCodeResult = await BooksService.sellByCode({
        ...parsed,
        book_id: selectedBookId,
        force_resell: forceResell,
      });

      console.log('✅ [BookScanModal] API Response:', result);

      if (result.needs_confirmation) {
        console.log('⚠️ [BookScanModal] Needs confirmation:', result.reason);
        // Stop scanner when showing confirmation popup
        if (result.reason === "already_purchased") {
          await stopScanner();
        }
        setConfirmation(result);
      } else {
        console.log('✓ [BookScanModal] Sale completed successfully');
        // Sale created by backend — record in local list and notify parent
        const bookName = books.find(b => b.id === selectedBookId)?.name ?? result.book?.name ?? "";
        const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
        setSoldList(prev => [{
          studentName: result.student.name,
          bookName,
          time,
          amount: result.pricing.final_price,
        }, ...prev]);
        flash(`✓ ${result.student.name} — ${result.pricing.final_price} جنيه`, "success");
        onSold?.();
      }
    } catch (e: unknown) {
      console.error('❌ [BookScanModal] Error during sell:', e);
      const err = e as { error_code?: string; message?: string };
      const isGradeMismatch = err.error_code === "GRADE_MISMATCH" || err.message?.includes("مخصص لـ");
      const msg = getErrorMessage(e, "حدث خطأ أثناء تسجيل البيع.");
      flash(msg, isGradeMismatch ? "warn" : "error", isGradeMismatch ? 6000 : 4000);
    } finally {
      setLoading(false);
    }
  }, [selectedBookId, books, flash, onSold, stopScanner]);

  // Confirm: teacher saw pricing/warning and wants to proceed
  const handleConfirm = async () => {
    if (!confirmation) return;
    setSelling(true);
    try {
      const result: SellByCodeResult = await BooksService.sellByCode({
        student_id: confirmation.student.id,
        book_id: selectedBookId,
        force_resell: true,
      });

      if (!result.needs_confirmation) {
        const bookName = books.find(b => b.id === selectedBookId)?.name ?? result.book?.name ?? "";
        const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
        setSoldList(prev => [{
          studentName: result.student.name,
          bookName,
          time,
          amount: result.pricing.final_price,
        }, ...prev]);
        flash(`✓ ${result.student.name} — ${result.pricing.final_price} جنيه`, "success");
        setConfirmation(null);
        onSold?.();
      } else {
        flash("حدث خطأ غير متوقع، حاول مرة أخرى", "error");
      }
    } catch (e: unknown) {
      flash(getErrorMessage(e, "حدث خطأ أثناء تأكيد البيع."), "error");
    } finally {
      setSelling(false);
    }
  };

  // ── QR scanner helpers ──────────────────────────────────────────────────
  const processQR = useCallback(async (rawCode: string) => {
    const nowMs = Date.now();
    if ((cooldownRef.current.get(rawCode) ?? 0) + SCAN_COOLDOWN_MS > nowMs) return;
    if (processingRef.current.has(rawCode)) return;
    processingRef.current.add(rawCode);
    cooldownRef.current.set(rawCode, nowMs);
    await doSell(rawCode);
    processingRef.current.delete(rawCode);
  }, [doSell]);

  const startScanner = useCallback(async () => {

    if (scannerRef.current) return;
    setIsStarting(true);
    try {
      const { Html5Qrcode: QrcodeClass } = await import("html5-qrcode");
      const qr = new QrcodeClass(SCANNER_DIV_ID);
      scannerRef.current = qr as unknown as Html5Qrcode;
      const config = { fps: 6, qrbox: { width: 200, height: 200 } };
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

  useEffect(() => () => {
    if (scannerRef.current) {
      try { scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
    }
  }, []);

  const handleClose = async () => { await stopScanner(); onClose(); };

  const flashStyles = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    error:   "bg-red-500/10 border-red-500/30 text-red-400",
    warn:    "bg-amber-500/10 border-amber-500/30 text-amber-400",
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[1000] flex items-start sm:items-center justify-center pt-4 sm:pt-0"
      onClick={handleClose}
    >
        <div
          className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-b-2xl sm:rounded-2xl w-full max-w-[480px] shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >

          {/* ── Header ── */}
          <div className="px-5 pt-4 pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <QrCode size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[1rem] font-bold text-[var(--text-primary)] leading-tight">سكان بيع الكتب</h2>
                <p className="text-xs text-[var(--text-muted)]">سكان QR أو أدخل الكود لتسجيل البيع</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Book selector row */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap shrink-0">الكتاب</span>
              <div className="relative flex-1">
                <select
                  className="w-full py-2 pr-3 pl-7 bg-slate-900/80 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm font-semibold cursor-pointer outline-none appearance-none focus:border-teal-500 transition-all"
                  value={selectedBookId}
                  onChange={e => { setSelectedBookId(e.target.value); setConfirmation(null); }}
                >
                  {books.map(b => {
                    const gradeName = grades.find(g => g.id === b.grade_id)?.name;
                    return (
                      <option key={b.id} value={b.id} className="bg-[var(--bg-secondary)]">
                        {b.name}{gradeName ? ` — ${gradeName}` : ""} — {b.price} ج{b.status === "unavailable" ? " (غير متاح)" : ""}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
              {soldList.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 whitespace-nowrap shrink-0">
                  <CheckCircle2 size={11} />
                  {soldList.length} مباع
                </span>
              )}
            </div>

            {/* Unavailable warning */}
            {isSelectedUnavailable && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                <AlertCircle size={13} />
                <span>هذا الكتاب غير متاح — لا يمكن تسجيل مبيعات</span>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="flex flex-col gap-3 px-5 pt-4 overflow-y-auto">

            {/* Manual input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                <input
                  className="w-full pr-9 pl-3 py-2.5 bg-slate-900/80 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-teal-500 transition-all disabled:opacity-50"
                  type="text"
                  placeholder="أدخل كود الطالب…"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && manualCode.trim()) { doSell(manualCode.trim()); setManualCode(""); } }}
                  disabled={loading || isSelectedUnavailable}
                />
              </div>
              <button
                className="px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold min-w-[64px] flex items-center justify-center gap-1.5 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_10px_rgba(20,184,166,0.25)]"
                onClick={() => { if (manualCode.trim()) { doSell(manualCode.trim()); setManualCode(""); } }}
                disabled={!manualCode.trim() || loading || isSelectedUnavailable}
              >
                {loading ? <Spinner /> : "بحث"}
              </button>
            </div>

            {/* Flash / Loading */}
            {loading && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-teal-500/8 border border-teal-500/20 text-[var(--text-muted)] text-sm">
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-teal-500/30 border-t-teal-400 animate-spin shrink-0" />
                <span>جاري تحميل بيانات الطالب…</span>
              </div>
            )}
            {flashMsg && !loading && (
              <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold ${flashStyles[flashMsg.type]}`}>
                <span className="shrink-0 mt-px">
                  {flashMsg.type === "success" ? <CheckCircle2 size={15} /> : flashMsg.type === "warn" ? <AlertTriangle size={15} /> : <AlertCircle size={15} />}
                </span>
                <span className="break-words leading-relaxed">{flashMsg.text}</span>
              </div>
            )}

            {/* Confirmation card (needs_confirmation: true) */}
            {confirmation && !loading && (
              <div className="rounded-2xl overflow-hidden border border-teal-500/20 bg-gradient-to-b from-teal-500/5 to-black/20 shadow-[0_0_20px_rgba(20,184,166,0.06)]">

                {/* Card header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-teal-500/10 bg-teal-500/5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/25 flex items-center justify-center shrink-0">
                    <User size={14} className="text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{confirmation.student.name}</p>
                    <p className="text-[0.7rem] text-[var(--text-muted)]">كود: {confirmation.student.code}</p>
                  </div>
                  <button
                    onClick={() => setConfirmation(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-500/15 hover:text-red-400 transition-all shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Already purchased warning */}
                {confirmation.reason === "already_purchased" && confirmation.already_purchased && (
                  <div className="px-4 py-3 bg-amber-500/6 border-b border-amber-500/15">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-300">اشترى هذا الكتاب مسبقاً</span>
                    </div>
                    <p className="text-[0.72rem] text-[var(--text-muted)] mb-2.5">
                      تاريخ: {new Date(confirmation.already_purchased.purchase_date).toLocaleDateString("ar-EG")} · المبلغ: {confirmation.already_purchased.amount} ج
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmation(null)}
                        className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[var(--text-muted)] text-xs font-[inherit] cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={selling}
                        className="flex-1 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold font-[inherit] cursor-pointer hover:bg-amber-500/25 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {selling ? <Spinner className="w-3 h-3" /> : <RefreshCw size={11} />} إعادة البيع
                      </button>
                    </div>
                  </div>
                )}

                {/* Discount / pricing confirmation */}
                {(confirmation.reason === "has_discount" || (confirmation.reason === "already_purchased" && !confirmation.already_purchased)) && (
                  <>
                    <div className="divide-y divide-white/4">
                      <div className="flex justify-between items-center px-4 py-2.5 text-sm">
                        <span className="text-[var(--text-muted)]">السعر الأساسي</span>
                        <span className="text-[var(--text-primary)]">{confirmation.pricing.price} ج</span>
                      </div>
                      {confirmation.pricing.is_exempt ? (
                        <div className="flex justify-between items-center px-4 py-2.5 text-sm">
                          <span className="text-indigo-400">إعفاء كامل</span>
                          <span className="text-indigo-400">100%</span>
                        </div>
                      ) : confirmation.pricing.discount > 0 ? (
                        <div className="flex justify-between items-center px-4 py-2.5 text-sm">
                          <span className="text-amber-400">
                            خصم {confirmation.pricing.discount_pct}%
                            {confirmation.pricing.discount_reason ? ` · ${confirmation.pricing.discount_reason}` : ""}
                          </span>
                          <span className="text-amber-400">- {confirmation.pricing.discount} ج</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-black/20 border-t border-[var(--border-color)]">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-[var(--text-muted)]" />
                        <span className="text-xs text-[var(--text-muted)]">السعر النهائي</span>
                        <span className={`text-sm font-bold font-mono ${confirmation.pricing.is_exempt ? "text-indigo-400" : "text-teal-400"}`}>
                          {confirmation.pricing.is_exempt ? "مجاناً 🎁" : `${confirmation.pricing.final_price} ج`}
                        </span>
                      </div>
                      <button
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-white text-xs font-bold whitespace-nowrap hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_10px_rgba(20,184,166,0.25)]"
                        onClick={handleConfirm}
                        disabled={selling}
                      >
                        {selling ? <><Spinner className="w-3 h-3" /> حفظ…</> : <><CheckCircle2 size={13} /> تأكيد البيع</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Sold list */}
            {soldList.length > 0 && (
              <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-black/20">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-color)] bg-emerald-500/5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-[var(--text-muted)] flex-1">تم تسجيل بيعهم</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/20 text-emerald-400">
                    {soldList.length}
                  </span>
                </div>
                <div className="max-h-44 overflow-y-auto divide-y divide-white/4">
                  {soldList.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/2 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-sm text-[var(--text-primary)] flex-1 truncate">{e.studentName}</span>
                      <span className="text-[0.72rem] text-[var(--text-muted)] truncate max-w-[80px]">{e.bookName}</span>
                      <span className="text-xs font-bold text-teal-400 font-mono shrink-0">{e.amount} ج</span>
                      <span className="text-xs text-[var(--text-muted)] font-mono shrink-0">{e.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-1" />
          </div>

          {/* ── Scanner ── */}
          <div className="px-5 pb-5 pt-3 border-t border-[var(--border-color)]">
            <div className="flex flex-col gap-2">
              {/* Viewfinder */}
              <div
                className="relative rounded-2xl overflow-hidden bg-black/40 border border-[var(--border-color)] flex items-center justify-center"
                style={{ minHeight: scanning ? 180 : 240, maxHeight: scanning ? 220 : undefined }}
              >
                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                    <div className="w-16 h-16 rounded-2xl bg-teal-500/8 border border-teal-500/15 flex items-center justify-center">
                      <QrCode size={30} className="text-teal-500/40" />
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {isStarting ? "جاري تشغيل الكاميرا…" : "اضغط «تشغيل» لبدء السكان"}
                    </p>
                  </div>
                )}
                <div
                  id={SCANNER_DIV_ID}
                  className="w-full"
                  style={{ minHeight: scanning ? 180 : 1, opacity: scanning ? 1 : 0 }}
                />
                {scanning && (
                  <>
                    <span className="absolute top-3 right-3 w-6 h-6 border-t-2 border-l-2 border-teal-400 rounded-tl-sm opacity-70 z-10" />
                    <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-r-2 border-teal-400 rounded-tr-sm opacity-70 z-10" />
                    <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-l-2 border-teal-400 rounded-bl-sm opacity-70 z-10" />
                    <span className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-r-2 border-teal-400 rounded-br-sm opacity-70 z-10" />
                    <span className="absolute inset-x-6 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-60 z-10 animate-[scanline_2s_ease-in-out_infinite]" style={{ top: "50%" }} />
                  </>
                )}
              </div>

              {/* Toggle button */}
              <button
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-55 disabled:cursor-not-allowed ${
                  scanning
                    ? "bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/18"
                    : "bg-teal-500 text-white shadow-[0_4px_14px_rgba(20,184,166,0.3)] hover:bg-teal-600 hover:-translate-y-px"
                }`}
                onClick={scanning ? stopScanner : startScanner}
                disabled={isStarting || isSelectedUnavailable}
              >
                {scanning
                  ? <><CameraOff size={16} /> إيقاف الكاميرا</>
                  : isStarting
                  ? <><Spinner /> جاري التشغيل…</>
                  : <><Camera size={16} /> تشغيل الكاميرا</>}
              </button>
            </div>
          </div>

        </div>
    </div>
  );
}
