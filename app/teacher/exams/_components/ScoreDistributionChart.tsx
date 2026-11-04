"use client";

import { useMemo, memo } from "react";
import { BarChart2 } from "lucide-react";

interface ScoreDistributionChartProps {
  grades: Record<string, number>;
  maxScore: number;
  totalStudents: number;
}

const BUCKET_DEFS = [
  {
    key: "excellent",
    label: "ممتاز (85%+)",
    check: (pct: number) => pct >= 85,
    color: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500/25 dark:bg-emerald-500/20 border-emerald-500/40 dark:border-emerald-500/30",
  },
  {
    key: "veryGood",
    label: "جيد جداً (70-84%)",
    check: (pct: number) => pct >= 70 && pct < 85,
    color: "text-teal-600 dark:text-teal-400",
    bar: "bg-teal-500/25 dark:bg-teal-500/20 border-teal-500/40 dark:border-teal-500/30",
  },
  {
    key: "good",
    label: "جيد (50-69%)",
    check: (pct: number) => pct >= 50 && pct < 70,
    color: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500/25 dark:bg-amber-500/20 border-amber-500/40 dark:border-amber-500/30",
  },
  {
    key: "weak",
    label: "ضعيف (<50%)",
    check: (pct: number) => pct < 50,
    color: "text-red-600 dark:text-red-400",
    bar: "bg-red-500/25 dark:bg-red-500/20 border-red-500/40 dark:border-red-500/30",
  },
];

export const ScoreDistributionChart = memo(function ScoreDistributionChart({
  grades,
  maxScore,
  totalStudents,
}: ScoreDistributionChartProps) {
  const { bucketCounts, maxCount, passRate, recordedCount } = useMemo(() => {
    const scores = Object.values(grades).filter(
      (s): s is number => typeof s === "number" && !isNaN(s)
    );
    const recorded = scores.length;
    if (recorded === 0 || maxScore <= 0) {
      return {
        bucketCounts: BUCKET_DEFS.map((b) => ({ ...b, count: 0 })),
        maxCount: 1,
        passRate: 0,
        recordedCount: 0,
      };
    }

    const counts = BUCKET_DEFS.map((b) => {
      const count = scores.filter((score) => {
        const pct = (score / maxScore) * 100;
        return b.check(pct);
      }).length;
      return { ...b, count };
    });

    const max = Math.max(...counts.map((b) => b.count), 1);
    const passed = scores.filter((score) => (score / maxScore) * 100 >= 50).length;
    const rate = Math.round((passed / recorded) * 100);

    return {
      bucketCounts: counts,
      maxCount: max,
      passRate: rate,
      recordedCount: recorded,
    };
  }, [grades, maxScore]);

  return (
    <div className="glass-panel p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-bold m-0 text-[var(--text-secondary)] flex items-center gap-2">
          <BarChart2 size={16} className="text-teal-400" />
          توزيع مستويات الطلاب
        </h3>
        {recordedCount > 0 && (
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            تم رصد {recordedCount} من {totalStudents} طالب
          </span>
        )}
      </div>

      {recordedCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-[var(--text-muted)] gap-1.5 border border-dashed border-[var(--border-color)] rounded-xl">
          <p className="text-xs font-semibold m-0">لم يتم رصد درجات لهذا الامتحان بعد</p>
          <span className="text-[11px] opacity-75">سيظهر التوزيع ومؤشرات المستويات تلقائياً عند كتابة الدرجات</span>
        </div>
      ) : (
        <>
          <div className="flex gap-2 sm:gap-4 items-end h-24 pt-2">
            {bucketCounts.map((b) => (
              <div key={b.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className={`text-xs font-bold ${b.color}`}>
                  {b.count}
                </span>
                <div
                  className={`w-full rounded-t-lg border transition-all duration-300 ${b.bar}`}
                  style={{
                    height: `${Math.max((b.count / maxCount) * 56, b.count > 0 ? 8 : 2)}px`,
                  }}
                />
                <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] text-center leading-tight whitespace-nowrap">
                  {b.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex justify-between items-center flex-wrap gap-2">
            <span className="text-xs text-[var(--text-muted)]">
              نسبة النجاح: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{passRate}%</strong>
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              لم يُرصد: <strong className="text-amber-600 dark:text-amber-400 font-bold">{Math.max(0, totalStudents - recordedCount)}</strong>
            </span>
          </div>
        </>
      )}
    </div>
  );
});
