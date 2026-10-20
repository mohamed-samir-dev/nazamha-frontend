export function validateStudentName(value: string): string {
  const name = value.trim().replace(/\s+/g, " ");
  return name.length <= 120 && /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)+$/u.test(name)
    ? "" : "اسم الطالب يجب أن يكون حروفًا فقط واسمين على الأقل (بحد أقصى 120 حرفًا).";
}
