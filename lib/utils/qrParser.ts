/** The card identifies a student, never a group or an expiring report token. */
export function getStudentQRValue(student: { id: string; center_student_code?: string | null }): string {
  return student.center_student_code || student.id;
}

export function parseQRText(text: string): { type: "center" | "legacy"; value: string } {
  const trimmed = text.trim();
  const centerMatch = trimmed.match(/\/report\/c\/([^/?#]+)/);
  if (centerMatch) return { type: "center", value: decodeValue(centerMatch[1]) };
  const legacyMatch = trimmed.match(/\/report\/([^/?#]+)/);
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
