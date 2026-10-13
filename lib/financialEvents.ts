export const FINANCIAL_CHANGED = "financial-data-changed";
/**
 * Force-refresh variant: signals that a mutation just occurred and
 * the financial reports hook MUST re-fetch regardless of throttle.
 */
export const FINANCIAL_MUTATED = "financial-data-mutated";

export function notifyFinancialChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FINANCIAL_CHANGED));
    // Also fire the mutation event so report hooks bypass their throttle
    window.dispatchEvent(new Event(FINANCIAL_MUTATED));
  }
}
