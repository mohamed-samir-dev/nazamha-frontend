/** Current policy price; historical paid/exempt subscriptions must not determine it. */
export function studentPrice(student: { custom_monthly_price?: number | null; family_discount_percent?: number | null; discount_value?: number | null }, groupPrice?: number | null, teacherPrice = 0) {
  const amount = Number(student.custom_monthly_price) > 0 ? Number(student.custom_monthly_price) : Number(groupPrice) > 0 ? Number(groupPrice) : teacherPrice;
  const percent = Number(student.family_discount_percent) > 0 ? Number(student.family_discount_percent) : Number(student.discount_value) || 0;
  const net = Math.round(amount * (1 - percent / 100));
  return { amount, discount: amount - net, net };
}
