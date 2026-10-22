/** All student cards use the same permanent, read-only parent-report URL. */
export function getStudentQRValue(student: { id: string; code?: string | null; center_student_code?: string | null; card_qr_token?: string }): string {
  if (student.card_qr_token) {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const identity = student.center_student_code ? `&identity=${encodeURIComponent(student.center_student_code)}` : "";
    return `${origin}/report/${encodeURIComponent(student.id)}?card=${encodeURIComponent(student.card_qr_token)}${identity}`;
  }
  // Compatibility with old API responses and already printed identity cards.
  return student.center_student_code || student.id;
}

export function parseQRText(text: string): { type: "center" | "legacy"; value: string } {
  const trimmed = text.trim();
  const centerMatch = trimmed.match(/\/report\/c\/([^/?#]+)/);
  if (centerMatch) return { type: "center", value: decodeValue(centerMatch[1]) };
  const legacyMatch = trimmed.match(/\/report\/([^/?#]+)/);
  const sharedIdentity = legacyMatch && trimmed.match(/[?&]identity=([^&#]+)/);
  if (sharedIdentity) return { type: "center", value: decodeValue(sharedIdentity[1]) };
  if (legacyMatch) return { type: "legacy", value: decodeValue(legacyMatch[1]) };
  return { type: "legacy", value: trimmed };
}

function decodeValue(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

/** Keep accepting already printed raw IDs, center codes and old report URLs. */
export function findStudentByQR<T extends { id: string; code?: string | null; center_student_code?: string | null }>(students: T[], raw: string): T | undefined {
  const parsed = parseQRText(raw);
  const value = parsed.value.toUpperCase();
  if (!value) return undefined;
  const center = students.find(s => s.center_student_code?.toUpperCase() === value);
  if (parsed.type === "center") return center;
  const identity = students.find(s => s.id.toUpperCase() === value);
  if (identity) return identity;
  const matches = students.filter(s => s.center_student_code?.toUpperCase() === value || s.code?.toUpperCase() === value);
  return new Set(matches.map(s => s.id)).size === 1 ? matches[0] : undefined;
}

/** Both book scanners send the same identity to the server. */
export function getStudentScanParams(raw: string): { student_id?: string; student_code?: string } {
  const parsed = parseQRText(raw);
  return parsed.type !== "center" && /^[a-f0-9]{24}$/i.test(parsed.value)
    ? { student_id: parsed.value }
    : { student_code: parsed.type === "center" ? `/report/c/${encodeURIComponent(parsed.value)}` : parsed.value };
}
