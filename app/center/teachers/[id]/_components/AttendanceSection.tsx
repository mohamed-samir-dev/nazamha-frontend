"use client";
import { CalendarCheck } from "lucide-react";

interface Props {
  attendanceRate: number | null;
  presentCount: number;
  absentCount: number;
}

export default function AttendanceSection({ attendanceRate, presentCount, absentCount }: Props) {
  const total = presentCount + absentCount;
  const rateColor = attendanceRate === null ? "#94a3b8" : attendanceRate >= 80 ? "#4ade80" : attendanceRate >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div className="glass-panel overflow-hidden">
      <div className="px-4 py-3.5 border-b border-white/[0.07]">
        <h2 className="text-[0.92rem] font-semibold flex items-center gap-2">
          <CalendarCheck size={15} className="text-blue-400" />
          حضور الطلاب — هذا الشهر
        </h2>
      </div>

      {total === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <CalendarCheck size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-[0.83rem]">لا توجد بيانات حضور لهذا الشهر</p>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4">
          {/* Rate + stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center shrink-0">
              <p className="text-[2rem] sm:text-[2.2rem] font-bold font-mono leading-none" style={{ color: rateColor }}>
                {attendanceRate !== null ? `${attendanceRate}%` : "—"}
              </p>
              <p className="text-[0.7rem] text-slate-500 mt-1">نسبة الحضور</p>
            </div>
            <div className="flex gap-4 flex-wrap flex-1 justify-around sm:justify-start">
              <div className="text-center">
                <p className="text-[1.1rem] font-bold font-mono text-teal-400">{presentCount.toLocaleString("ar-EG")}</p>
                <p className="text-[0.68rem] text-slate-500">حضور</p>
              </div>
              <div className="text-center">
                <p className="text-[1.1rem] font-bold font-mono text-red-400">{absentCount.toLocaleString("ar-EG")}</p>
                <p className="text-[0.68rem] text-slate-500">غياب</p>
              </div>
              <div className="text-center">
                <p className="text-[1.1rem] font-bold font-mono text-slate-300">{total.toLocaleString("ar-EG")}</p>
                <p className="text-[0.68rem] text-slate-500">إجمالي</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {attendanceRate !== null && (
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${attendanceRate}%`, background: rateColor }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
