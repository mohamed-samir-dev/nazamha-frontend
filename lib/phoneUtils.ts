/**
 * Normalizes an Egyptian phone number to international format for WhatsApp.
 * Returns null if the number is invalid or missing.
 *
 * Handles: 01xxxxxxxxx | 201xxxxxxxxx | +201xxxxxxxxx
 */
export function normalizeEgyptianPhoneForWhatsApp(phone?: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-().+]/g, "");
  if (!cleaned) return null;

  let local: string;
  if (cleaned.startsWith("20") && cleaned.length === 12) {
    local = "0" + cleaned.slice(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    local = cleaned;
  } else {
    return null;
  }

  // Validate Egyptian mobile: 010, 011, 012, 015
  if (!/^01[0125]\d{8}$/.test(local)) return null;

  return "20" + local.slice(1);
}

export function whatsappLink(phone?: string | null): string | null {
  const normalized = normalizeEgyptianPhoneForWhatsApp(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}`;
}
