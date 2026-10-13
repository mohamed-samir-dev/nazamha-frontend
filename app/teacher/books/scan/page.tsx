"use client";

import { getStudentScanParams } from "@/lib/utils/qrParser";

import { useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, QrCode, CheckCircle, AlertTriangle, User, BookOpen, RefreshCw } from "lucide-react";
import {
  BooksService,
  SellByCodeResult,
  SellByCodeNeedsConfirm,
  SellByCodeSaleCreated,
  SellByCodeBookSummary,
} from "@/lib/services/booksService";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/errors";

/**
 * /teacher/books/scan?book_id=<id>
 *
 * Uses POST /books/sell-by-code — single HTTP request per sale.
 * Book name/price are taken from the sellByCode response (no separate GET /books/:id).
 */
function BookScanInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = searchParams.get("book_id") ?? "";

  // Book info populated from the first sellByCode response — no separate GET
  const [bookInfo, setBookInfo] = useState<SellByCodeBookSummary | null>(null);
  const [scanning, setScanning] = useState(false);
  // confirmation holds a needs_confirmation:true response
  const [confirmation, setConfirmation] = useState<SellByCodeNeedsConfirm | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [selling, setSelling] = useState(false);
  const [lastSale, setLastSale] = useState<SellByCodeSaleCreated | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const divId = "book-qr-scanner";

  // استخراج الكود أو الـ ID من الرابط لو كان QR يحتوي على URL


  // ── Core sell function ──────────────────────────────────────────────────
  // useCallback must be called unconditionally (before any early return)
  const doSell = useCallback(async (code: string, forceResell = false) => {
    try {
      console.log('🔍 Scanning code:', code.trim(), 'for book:', bookId);
      const parsed = getStudentScanParams(code);
      console.log('📌 Parsed:', parsed);
      
      const result: SellByCodeResult = await BooksService.sellByCode({
        ...parsed,
        book_id: bookId,
        force_resell: forceResell,
      });

      console.log('✅ API Response:', result);

      // Always capture book info for display (comes free in the response)
      if (result.book && !bookInfo) {
        console.log('📚 Setting book info:', result.book);
        setBookInfo(result.book);
      }

      if (result.needs_confirmation) {
        console.log('⚠️ Needs confirmation:', result.reason);
        setConfirmation(result);
      } else {
        console.log('✓ Sale completed:', result);
        setLastSale(result);
        setConfirmation(null);
      }
    } catch (e: unknown) {
      console.error('❌ Error during sell:', e);
      const err = e as { error_code?: string; message?: string };
      
      let errorMessage = "حدث خطأ غير متوقع";
      
      if (err.error_code === "GRADE_MISMATCH") {
        errorMessage = err.message || "هذا الكتاب غير مخصص لصف هذا الطالب";
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = getErrorMessage(e, "الطالب غير موجود أو غير مسجل في هذا الصف");
      }
      
      setToast({ message: errorMessage, type: "error" });
      void err; // suppress unused var warning
    }
  }, [bookId, bookInfo]);

  // Redirect if no bookId — must happen after hooks
  if (!bookId) {
    router.replace("/teacher/books");
    return null;
  }

  // ── Scanner ─────────────────────────────────────────────────────────────
  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(divId);
      scannerRef.current = scanner;
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      try {
        // Try with environment facing mode first
        await scanner.start(
          { facingMode: "environment" },
          config,
          async (code: string) => {
            await scanner.stop();
            setScanning(false);
            await doSell(code.trim());
          },
          () => {}
        );
        setScanning(true);
      } catch (err) {
        console.error("Failed to start with environment camera, trying fallback:", err);
        
        // Fallback: try to get available cameras and use the last one (usually back camera)
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const backCamera = cameras.find(cam => /back|rear|environment/i.test(cam.label)) || cameras[cameras.length - 1];
            await scanner.start(
              backCamera.id,
              config,
              async (code: string) => {
                await scanner.stop();
                setScanning(false);
                await doSell(code.trim());
              },
              () => {}
            );
            setScanning(true);
          } else {
            throw new Error("لا توجد كاميرات متاحة");
          }
        } catch (fallbackErr) {
          console.error("Camera fallback also failed:", fallbackErr);
          setToast({ 
            message: "تعذر تشغيل الكاميرا. تأكد من إعطاء الأذونات للمتصفح.", 
            type: "error" 
          });
          scannerRef.current = null;
        }
      }
    } catch (err) {
      console.error("Failed to initialize scanner:", err);
      setToast({ 
        message: "حدث خطأ أثناء تحميل الماسح الضوئي", 
        type: "error" 
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await doSell(manualCode.trim());
    setManualCode("");
  };

  // Confirm: teacher saw pricing/warning and wants to proceed
  const handleConfirm = async () => {
    if (!confirmation) return;
    setSelling(true);
    try {
      const result: SellByCodeResult = await BooksService.sellByCode({
        student_id: confirmation.student.id,
        book_id: bookId,
        force_resell: true,
      });
      if (result.book && !bookInfo) setBookInfo(result.book);
      if (!result.needs_confirmation) {
        setLastSale(result);
        setConfirmation(null);
      }
    } catch (e: unknown) {
      setToast({ message: getErrorMessage(e, "حدث خطأ أثناء تأكيد البيع."), type: "error" });
    } finally {
      setSelling(false);
    }
  };

  const reset = () => { setConfirmation(null); setLastSale(null); };

  const sold = !!lastSale;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "520px", margin: "0 auto", padding: "0 0.75rem" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <Link href="/teacher/books" style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", textDecoration: "none" }}>
          <ArrowRight size={14} /> الكتب
        </Link>
        <span>/</span>
        <span style={{ color: "#fff" }}>بيع بالـ QR</span>
      </div>

      {/* Book Info — populated after first scan */}
      {bookInfo && (
        <div className="glass-panel" style={{ padding: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <BookOpen size={20} style={{ color: "var(--color-teal)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>الكتاب المحدد</div>
            <div style={{ fontWeight: 700, color: "#fff" }}>{bookInfo.name}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-teal)", fontWeight: 600 }}>{bookInfo.price} جنيه</div>
          </div>
        </div>
      )}

      {/* Scanner panel */}
      {!confirmation && !sold && (
        <div className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <QrCode size={16} style={{ color: "var(--color-teal)" }} /> امسح QR الطالب
          </h3>

          <div id={divId} style={{ width: "100%", borderRadius: "10px", overflow: "hidden", background: "rgba(0,0,0,0.3)", minHeight: scanning ? "280px" : "0" }} />

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            {!scanning ? (
              <button onClick={startScanner} className="btn btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <QrCode size={15} /> تشغيل الكاميرا
              </button>
            ) : (
              <button onClick={stopScanner} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", cursor: "pointer", fontFamily: "inherit" }}>
                إيقاف
              </button>
            )}
          </div>

          <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1rem" }}>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>أو أدخل الكود يدوياً</p>
            <form onSubmit={handleManual} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="كود الطالب..."
                style={{ flex: 1, padding: "0.6rem 0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.85rem", fontFamily: "inherit" }}
              />
              <button type="submit" style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "var(--color-teal)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                بحث
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation card */}
      {confirmation && !sold && (
        <div className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
          {/* Student Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", padding: "0.75rem", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(20,184,166,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={20} style={{ color: "var(--color-teal)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{confirmation.student.name}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>كود: {confirmation.student.code}</div>
            </div>
          </div>

          {/* Already Purchased Warning */}
          {confirmation.reason === "already_purchased" && confirmation.already_purchased && (
            <div style={{ padding: "1rem", borderRadius: "10px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: "#fcd34d", fontSize: "0.9rem" }}>هذا الطالب اشترى الكتاب بالفعل</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span>تاريخ الشراء: {new Date(confirmation.already_purchased.purchase_date).toLocaleDateString("ar-EG")}</span>
                <span>المبلغ: {confirmation.already_purchased.amount} جنيه</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                <button onClick={handleConfirm} disabled={selling} style={{ width: "100%", padding: "0.6rem", borderRadius: "7px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  {selling
                    ? <span style={{ width: 12, height: 12, border: "2px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    : <RefreshCw size={12} />}
                  إعادة البيع
                </button>
                <button onClick={reset} style={{ width: "100%", padding: "0.5rem", borderRadius: "7px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem" }}>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Pricing — shown for discount */}
          {confirmation.reason === "has_discount" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <PricingRow label="السعر الأساسي" value={`${confirmation.pricing.price} جنيه`} />
                {confirmation.pricing.is_exempt ? (
                  <PricingRow label="إعفاء كامل" value="100%" color="#818cf8" />
                ) : confirmation.pricing.discount > 0 ? (
                  <PricingRow
                    label={`خصم ${confirmation.pricing.discount_pct}%${confirmation.pricing.discount_reason ? ` · ${confirmation.pricing.discount_reason}` : ""}`}
                    value={`- ${confirmation.pricing.discount} جنيه`}
                    color="#f59e0b"
                  />
                ) : null}
                <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
                <PricingRow
                  label="السعر النهائي"
                  value={confirmation.pricing.is_exempt ? "مجاناً 🎁" : `${confirmation.pricing.final_price} جنيه`}
                  bold
                  color={confirmation.pricing.is_exempt ? "#818cf8" : "var(--color-teal)"}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column-reverse", gap: "0.5rem", width: "100%" }}>
                <button onClick={reset} style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
                  إلغاء
                </button>
                <button onClick={handleConfirm} disabled={selling} style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", background: "var(--color-teal)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  {selling
                    ? <span style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    : <CheckCircle size={16} />}
                  {selling ? "جاري التسجيل..." : "تأكيد البيع"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Success */}
      {sold && lastSale && (
        <div className="glass-panel" style={{ padding: "2rem", textAlign: "center" }}>
          <CheckCircle size={48} style={{ color: "#10b981", marginBottom: "1rem" }} />
          <h3 style={{ color: "#fff", margin: "0 0 0.5rem" }}>تم البيع بنجاح!</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 1.5rem" }}>
            تم تسجيل شراء {lastSale.student?.name} لكتاب {lastSale.book?.name ?? bookInfo?.name}
          </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", justifyContent: "center" }}>
                <button onClick={reset} style={{ width: "100%", padding: "0.65rem 1.5rem", borderRadius: "8px", background: "var(--color-teal)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <RefreshCw size={15} /> بيع لطالب آخر
                </button>
                <Link href={`/teacher/books/${bookId}`} style={{ width: "100%", padding: "0.65rem 1.5rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", textAlign: "center", display: "block" }}>
                  تفاصيل الكتاب
                </Link>
              </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function PricingRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0" }}>
      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: bold ? "1.1rem" : "0.9rem", fontWeight: bold ? 700 : 500, color: color ?? "#fff" }}>{value}</span>
    </div>
  );
}

export default function BookScanPage() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <BookScanInner />
    </Suspense>
  );
}
