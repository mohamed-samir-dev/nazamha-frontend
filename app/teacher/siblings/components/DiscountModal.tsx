import { Check, X, Tag, Percent } from "lucide-react";
import { DiscountModalState } from "../types";

interface Props {
  discountModal: DiscountModalState;
  discountPercent: string;
  discountReason: string;
  bookDiscountPercent: string;
  bookDiscountReason: string;
  discountLoading: boolean;
  setDiscountModal: (v: null) => void;
  setDiscountPercent: (v: string) => void;
  setDiscountReason: (v: string) => void;
  setBookDiscountPercent: (v: string) => void;
  setBookDiscountReason: (v: string) => void;
  handleSaveDiscount: () => void;
  handleRemoveDiscount: () => void;
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-500/50 transition-all";
const presetCls = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
    active
      ? "bg-teal-500/20 border-teal-500/40 text-teal-400"
      : "bg-white/5 border-white/10 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)]"
  }`;

export function DiscountModal({
  discountModal, discountPercent, discountReason,
  bookDiscountPercent, bookDiscountReason, discountLoading,
  setDiscountModal, setDiscountPercent, setDiscountReason,
  setBookDiscountPercent, setBookDiscountReason, handleSaveDiscount, handleRemoveDiscount,
}: Props) {
  const pct = Number(discountPercent);
  const bpct = Number(bookDiscountPercent);
  const hasValidDiscount = (discountPercent !== "" && pct > 0 && pct <= 100) || (bookDiscountPercent !== "" && bpct > 0 && bpct <= 100);
  const hasExistingDiscount = (discountModal.currentPercent != null && discountModal.currentPercent > 0) || (discountModal.currentBookPercent != null && discountModal.currentBookPercent > 0);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setDiscountModal(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--bg-card,#1a1a2e)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center">
              <Tag size={16} className="text-teal-400" />
            </div>
            <div>
              <p className="font-bold text-[var(--text-primary)] text-sm">خصم عائلي</p>
              <p className="text-xs text-[var(--text-muted)]">{discountModal.familyName}</p>
            </div>
          </div>
          <button
            onClick={() => setDiscountModal(null)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-white/8 hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Subscription discount */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">خصم الاشتراك %</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {[5, 10, 15, 20, 25, 50].map((p) => (
                <button key={p} className={presetCls(discountPercent === String(p))} onClick={() => setDiscountPercent(String(p))}>
                  {p}%
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number" min={0} max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="أو أدخل نسبة مخصصة..."
                className={inputCls}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">%</span>
            </div>
            <input
              type="text" value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="سبب الخصم (اختياري)..."
              className={`${inputCls} mt-2`}
            />
            {discountPercent && Number(discountPercent) > 0 && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-teal-500/8 border border-teal-500/20 text-xs text-teal-400">
                <Percent size={12} />
                <span>سيتم تطبيق خصم <strong>{discountPercent}%</strong> على جميع أفراد العائلة</span>
              </div>
            )}
          </div>

          <div className="h-px bg-white/8" />

          {/* Book discount */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
              خصم الكتب % <span className="normal-case font-normal">(اختياري)</span>
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {[10, 20, 25, 50, 75, 100].map((p) => (
                <button key={p} className={presetCls(bookDiscountPercent === String(p))} onClick={() => setBookDiscountPercent(String(p))}>
                  {p}%
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number" min={0} max={100}
                value={bookDiscountPercent}
                onChange={(e) => setBookDiscountPercent(e.target.value)}
                placeholder="نسبة خصم الكتب..."
                className={inputCls}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">%</span>
            </div>
            <input
              type="text" value={bookDiscountReason}
              onChange={(e) => setBookDiscountReason(e.target.value)}
              placeholder="سبب خصم الكتب (اختياري)..."
              className={`${inputCls} mt-2`}
            />
            {bookDiscountPercent && Number(bookDiscountPercent) > 0 && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-indigo-500/8 border border-indigo-500/20 text-xs text-indigo-400">
                <Percent size={12} />
                <span>خصم كتب <strong>{bookDiscountPercent}%</strong> على جميع أفراد العائلة</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/8 bg-white/2">
          {hasExistingDiscount ? (
            <button
              onClick={handleRemoveDiscount}
              disabled={discountLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/8 border border-red-500/18 hover:bg-red-500/18 disabled:opacity-50 transition-all"
            >
              إزالة الخصم
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleSaveDiscount}
            disabled={discountLoading || !hasValidDiscount}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_2px_10px_rgba(20,184,166,0.25)]"
          >
            {discountLoading
              ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Check size={13} /> حفظ</>}
          </button>
        </div>
      </div>
    </div>
  );
}
