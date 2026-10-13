"use client";

import { HiOutlineLightBulb, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown } from "react-icons/hi2";

interface Props {
  total: number;
  paid: number;
  unpaid: number;
  monthName: string;
}

export default function InsightsStrip({ total, paid, unpaid, monthName }: Props) {
  if (total === 0) return null;

  const pct = Math.round((paid / total) * 100);
  const isGood = pct >= 75;
  const isMid = pct >= 50 && pct < 75;

  const message = pct === 100
    ? `🎉 رائع! جميع الطلاب دفعوا في ${monthName}`
    : isGood
    ? `${pct}٪ من الطلاب دفعوا في ${monthName} — أداء ممتاز`
    : isMid
    ? `${pct}٪ من الطلاب دفعوا — تبقّى ${unpaid} طالب لم يدفعوا بعد`
    : `${unpaid} طالب من أصل ${total} لم يدفعوا في ${monthName} بعد`;

  return (
    <div className="sr-insights-strip">
      <span className="sr-insights-icon">
        {isGood ? <HiOutlineArrowTrendingUp size={16} /> : <HiOutlineLightBulb size={16} />}
      </span>
      <span>{message}</span>
      {!isGood && unpaid > 0 && (
        <>
          <span className="sr-insights-sep" />
          <span>يمكنك إرسال تذكير واتساب للطلاب غير المدفوعين</span>
        </>
      )}
    </div>
  );
}
