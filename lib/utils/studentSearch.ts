export function codeText(value: string) {
  return value.normalize("NFKC").replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[٠-٩۰-۹]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit) >= 0 ? "٠١٢٣٤٥٦٧٨٩".indexOf(digit) : "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .trim().replace(/\s*-\s*/g, "-").toLowerCase();
}
export function matchesStudentSearch(student: {name: string; code?: string | null; center_student_code?: string | null}, search: string) {
  if (!search.trim()) return true;
  return student.name.toLowerCase().includes(search.trim().toLowerCase())
    || [student.code, student.center_student_code].some(value => !!value && codeText(value).includes(codeText(search)));
}
