import { useId } from "react";
import { Check, Percent } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { canSaveFamilyDiscount, validateFamilyDiscount } from "@/lib/utils/familyDiscount";
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

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-500/50 aria-invalid:border-red-400";

export function DiscountModal(props: Props) {
  const id = useId();
  const { discountModal, discountPercent, bookDiscountPercent, discountLoading } = props;
  const existing = (discountModal.currentPercent ?? 0) > 0 || (discountModal.currentBookPercent ?? 0) > 0;
  const fields = [
    { key: "subscription", label: "خصم الاشتراك %", value: discountPercent, set: props.setDiscountPercent, reason: props.discountReason, setReason: props.setDiscountReason, presets: [5, 10, 15, 20, 25, 50] },
    { key: "books", label: "خصم الكتب %", value: bookDiscountPercent, set: props.setBookDiscountPercent, reason: props.bookDiscountReason, setReason: props.setBookDiscountReason, presets: [10, 20, 25, 50, 75, 100] },
  ];
  return <Modal isOpen onClose={() => props.setDiscountModal(null)} closeDisabled={discountLoading} title="خصم عائلي" maxWidth="480px" footer={<>
    {existing && <button type="button" disabled={discountLoading} onClick={props.handleRemoveDiscount} className="px-4 py-2 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20 disabled:opacity-40">إزالة الخصم</button>}
    <button type="button" disabled={discountLoading || !canSaveFamilyDiscount(discountPercent, bookDiscountPercent)} onClick={props.handleSaveDiscount} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed">
      <Check size={16} />{discountLoading ? "جاري الحفظ..." : "حفظ"}
    </button>
  </>}>
    <p className="mb-4 text-sm text-[var(--text-secondary)]">{discountModal.familyName}</p>
    <fieldset disabled={discountLoading} className="space-y-5 disabled:opacity-60">
      <legend className="sr-only">نسب خصم العائلة</legend>
      {fields.map(field => {
        const fieldId = `${id}-${field.key}`, error = validateFamilyDiscount(field.value);
        return <div key={field.key} className="space-y-2">
          <label htmlFor={fieldId} className="block text-sm font-semibold text-[var(--text-primary)]">{field.label}</label>
          <div className="flex flex-wrap gap-2">{field.presets.map(percent => <button key={percent} type="button" aria-label={`${field.label}: ${percent}%`} aria-pressed={field.value === String(percent)} onClick={() => field.set(String(percent))} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${field.value === String(percent) ? "bg-teal-500/20 border-teal-500/40 text-teal-400" : "bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10"}`}>{percent}%</button>)}</div>
          <input id={fieldId} type="number" min={0} max={100} step="any" value={field.value} onChange={event => field.set(event.target.value)} aria-invalid={!!error} aria-describedby={error ? `${fieldId}-error` : `${fieldId}-hint`} className={inputCls} />
          {error ? <p id={`${fieldId}-error`} role="alert" className="text-xs text-red-400">{error}</p> : <p id={`${fieldId}-hint`} className="text-xs text-[var(--text-muted)]">من 0 إلى 100%. اتركه فارغًا لعدم تطبيق هذا الخصم.</p>}
          <label htmlFor={`${fieldId}-reason`} className="block text-xs text-[var(--text-secondary)]">سبب {field.label.replace(" %", "")} (اختياري)</label>
          <input id={`${fieldId}-reason`} value={field.reason} onChange={event => field.setReason(event.target.value)} className={inputCls} />
          {!error && Number(field.value) > 0 && <p className="flex items-center gap-2 rounded-xl px-3 py-2 bg-teal-500/10 text-teal-400 text-xs"><Percent size={13} />سيتم تطبيق خصم {field.value}% على جميع أفراد العائلة.</p>}
        </div>;
      })}
    </fieldset>
  </Modal>;
}
