"use client";
import type { Grade, Group } from "@/lib/types";
import { getTodayCairo } from "@/lib/utils/dateUtils";
import styles from "../scan.module.css";
interface Props {
  grades: Grade[];
  groups: Group[];
  selectedGradeId: string;
  selectedGroupId: string;
  sessionDate: string;
  validSessionDates: string[];
  monthSessionDates?: string[];
  scanning: boolean;
  isStarting: boolean;
  manualCode: string;
  manualPlaceholder: string;
  groupCode?: string | null;
  manualMsg?: { text: string; type: string } | null;
  sessionDateError?: string | null;
  autoDetected?: boolean;
  busy?: boolean;
  sessionReady?: boolean;
  onGradeChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  onSessionDateChange: (value: string) => void;
  onStartScanner: () => void;
  onStopScanner: () => void;
  onManualCodeChange: (value: string) => void;
  onManualSubmit: (event: React.FormEvent) => void;
}
export function SessionConfig(p: Props) {
  const group = p.groups.find((g) => g.id === p.selectedGroupId),
    today = getTodayCairo();
  const start = group?.start_date || group?.created_at?.slice(0, 10);

  const datesToDisplay =
    p.monthSessionDates && p.monthSessionDates.length > 0
      ? p.monthSessionDates
      : p.validSessionDates;

  // حساب حدود الأسبوع الحالي لتوضيح حالة الحصص في القائمة
  const todayDate = new Date(today + "T00:00:00");
  const day = todayDate.getDay();
  const diffToSat = day === 6 ? 0 : day + 1;
  const weekStart = new Date(todayDate);
  weekStart.setDate(weekStart.getDate() - diffToSat);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekEnd);

  return (
    <section className={styles.card} aria-label="إعداد الجلسة والإدخال اليدوي">
      <div className={styles.settings}>
        <div className={styles.settingsHeading}>
          إعدادات الجلسة{" "}
          <span>
            {p.autoDetected ? "تم اختيار حصة اليوم" : "تعديل المجموعة والتاريخ"}
          </span>
        </div>
        <div className={styles.fields}>
          <label htmlFor="scan-grade">السنة الدراسية</label>
          <select
            id="scan-grade"
            value={p.selectedGradeId}
            onChange={(e) => p.onGradeChange(e.target.value)}
            disabled={p.busy}
          >
            <option value="">اختر السنة الدراسية</option>
            {p.grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <label htmlFor="scan-group">المجموعة</label>
          <select
            id="scan-group"
            value={p.selectedGroupId}
            onChange={(e) => p.onGroupChange(e.target.value)}
            disabled={!p.selectedGradeId || p.busy}
          >
            <option value="">اختر المجموعة</option>
            {p.groups
              .filter((g) => g.grade_id === p.selectedGradeId)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} · {g.day_of_week} · {g.time}
                </option>
              ))}
          </select>
          <label htmlFor="scan-date">تاريخ الجلسة بتوقيت القاهرة</label>
          <select
            id="scan-date"
            value={p.sessionDate}
            onChange={(e) => p.onSessionDateChange(e.target.value)}
            disabled={!datesToDisplay.length || p.busy}
          >
            {!datesToDisplay.length && (
              <option value="">لا توجد جلسة متاحة في هذا الشهر</option>
            )}
            {datesToDisplay.map((date) => {
              const extraSession = group?.attendance_sessions?.find(
                (s) => s.session_date === date && s.is_extra
              );
              const formattedDate = new Date(date + "T12:00:00Z").toLocaleDateString("ar-EG", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Africa/Cairo",
              });

              const isToday = date === today;
              const isFuture = date > today;

              let labelPrefix = "";
              if (extraSession) {
                const titleStr = extraSession.title ? ` (${extraSession.title})` : "";
                if (isToday) labelPrefix = `حصة إضافية${titleStr} · اليوم · `;
                else labelPrefix = `حصة إضافية قادمة${titleStr} (لم يحن موعدها) · `;
              } else {
                if (isToday) labelPrefix = "اليوم · ";
                else labelPrefix = "حصة قادمة (لم يحن موعدها) · ";
              }

              return (
                <option
                  key={date}
                  value={date}
                  style={isFuture ? { color: "#94a3b8" } : undefined}
                >
                  {labelPrefix}{formattedDate}
                </option>
              );
            })}
          </select>
          {p.sessionDateError && (
            <p role="alert" className={styles.warning} style={{ marginTop: "6px", padding: "8px 12px" }}>
              {p.sessionDateError}
            </p>
          )}
          {p.selectedGroupId && !p.validSessionDates.length && (
            <p className={styles.warning} style={{ marginTop: "6px", padding: "8px 12px" }}>
              {datesToDisplay.length > 0
                ? `لا توجد حصة اليوم لهذه المجموعة. أقرب حصة قادمة: ${datesToDisplay[0]} (لا يمكن بدء السكان قبل موعد الحصة).`
                : start && start > today
                ? `المجموعة لم تبدأ بعد؛ موعد البداية ${start}`
                : "لا توجد حصص مجدولة لهذه المجموعة حالياً؛ راجع مواعيد المجموعة."}
            </p>
          )}
        </div>
      </div>
      <details className={styles.manual}>
        <summary>
          تسجيل بكود الطالب <span>بدون كاميرا</span>
        </summary>
        <form onSubmit={p.onManualSubmit} className={styles.fields}>
          <label htmlFor="attendance-manual-code">
            كود الطالب الكامل أو QR
          </label>
          <p id="manual-help" className={styles.muted}>
            اكتب الكود كاملًا
            {p.groupCode ? `، أو رقمه المختصر داخل مجموعة ${p.groupCode}` : ""}.
            لن يُختار طالب إذا كان الكود مكررًا.
          </p>
          <div className={styles.manualRow}>
            <input
              id="attendance-manual-code"
              aria-describedby="manual-help"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              placeholder={p.manualPlaceholder}
              value={p.manualCode}
              onChange={(e) => p.onManualCodeChange(e.target.value)}
              disabled={!p.sessionReady || p.busy}
            />
            <button
              className={styles.primary}
              type="submit"
              disabled={!p.sessionReady || p.busy || !p.manualCode.trim()}
            >
              {p.busy ? "انتظر…" : "تسجيل"}
            </button>
          </div>
        </form>
      </details>
    </section>
  );
}
