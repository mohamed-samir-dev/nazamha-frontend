import type { MonthlySubscription } from "@/lib/types";

export const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export const SCAN_COOLDOWN_MS = 3000;
export const SCANNER_DIV_ID  = "payment-qr-reader";

export interface DueMonth  { sub: MonthlySubscription; label: string; isOld: boolean; isExempt?: boolean; }
export interface PaidEntry { name: string; time: string; amount: number; }
