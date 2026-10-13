"use client";

interface ScoreDistributionChartProps {
  grades: Record<string, number>;
  maxScore: number;
  totalStudents: number;
}

const buckets = [
  { label: "ممتاز", min: 85, max: 100, color: "text-emerald-400", bar: "bg-emerald-500/20 border-emerald-500/30" },
  { label: "جيد جداً", min: 70, max: 84, color: "text-teal-400", bar: "bg-teal-500/20 border-teal-500/30" },
  { label: "جيد", min: 50, max: 69, color: "text-amber-400", bar: "bg-amber-500/20 border-amber-500/30" },
  { label: "ضعيف", min: 0, max: 49, color: "text-red-400", bar: "bg-red-500/20 border-red-500/30" },
];

export function ScoreDistributionChart({ grades, maxScore, totalStudents }: ScoreDistributionChartProps) {
  const scores = Object.values(grades).filter((s) => typeof s === "number" && !isNaN(s));
  if (scores.length === 0) return null;

  const bucketCounts = buckets.map((b) => ({
    ...b,
    count: scores.filter((s) => { const pct = (s / maxScore) * 100; return pct >= b.min && pct <= b.max; }).length,
  }));

  const maxCount = Math.max(...bucketCounts.map((b) => b.count), 1);
  const passRate = Math.round((scores.filter((s) => (s / maxScore) * 100 >= 50).length / scores.length) * 100);

  return (
    <div className="glass-panel p-5">
      <h3 className="text-sm font-bold mb-4 text-[var(--text-secondary)]">توزيع الدرجات</h3>
      <div className="flex gap-3 items-end h-24">
        {bucketCounts.map((b) => (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5">
            <span className={`text-xs font-bold ${b.color}`}>{b.count}</span>
            <div
              className={`w-full rounded-t-md border transition-all duration-500 ${b.bar}`}
              style={{ height: `${Math.max((b.count / maxCount) * 56, b.count > 0 ? 8 : 0)}px`, minHeight: b.count > 0 ? "8px" : "0" }}
            />
            <span className="text-[10px] text-[var(--text-muted)] text-center leading-tight">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex justify-between">
        <span className="text-xs text-[var(--text-muted)]">
          نسبة النجاح: <strong className="text-emerald-400">{passRate}%</strong>
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          لم يُرصد: <strong className="text-amber-400">{totalStudents - scores.length}</strong>
        </span>
      </div>
    </div>
  );
}
