export function validateName(v: string): string {
  const t = v.trim();
  if (!t) return "الاسم مطلوب";
  if (t.length < 2) return "الاسم يجب أن يكون حرفين على الأقل";
  if (t.length > 100) return "الاسم طويل جداً";
  return "";
}

export function validateEmail(v: string): string {
  const t = v.trim().toLowerCase();
  if (!t) return "البريد الإلكتروني مطلوب";
  if (t.length > 254) return "البريد الإلكتروني طويل جداً";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "البريد الإلكتروني غير صحيح";
  return "";
}

export function validatePassword(v: string): string {
  if (!v) return "كلمة المرور مطلوبة";
  if (v.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  if (v.length > 128) return "كلمة المرور طويلة جداً";
  return "";
}

export function validatePhone(v: string): string {
  const t = v.trim();
  if (!t) return "";
  if (!/^[\d\s\+\-\(\)]{7,20}$/.test(t)) return "رقم الهاتف غير صحيح";
  return "";
}

export function validateSubject(v: string): string {
  const t = v.trim();
  if (t.length > 100) return "اسم المادة طويل جداً";
  return "";
}
