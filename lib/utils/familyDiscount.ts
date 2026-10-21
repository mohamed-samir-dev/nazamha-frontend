export function validateFamilyDiscount(value: string): string {
  if (!value.trim()) return "";
  const percent = Number(value);
  return Number.isFinite(percent) && percent >= 0 && percent <= 100
    ? "" : "النسبة يجب أن تكون رقمًا بين 0 و100";
}

export function canSaveFamilyDiscount(subscription: string, books: string): boolean {
  return !validateFamilyDiscount(subscription) && !validateFamilyDiscount(books)
    && (Number(subscription) > 0 || Number(books) > 0);
}
