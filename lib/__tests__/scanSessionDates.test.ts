import {
  getCurrentWeekRange,
  getMonthSessionDates,
  getValidSessionDates,
  getNearestValidDate,
} from "@/app/teacher/attendance/scan/_hooks/useScanSession";
import { Group } from "@/lib/types";

describe("Scan Session Dates & Week Restriction Tests", () => {
  const satMonWedGroup: Group = {
    id: "grp-sat-mon-wed",
    name: "مجموعة السبت والإثنين والأربعاء",
    day_of_week: "السبت, الإثنين, الأربعاء",
    time: "16:00",
    grade_id: "grd-1",
    created_at: "2026-10-01T00:00:00.000Z",
    start_date: "2026-10-01",
    attendance_sessions: [
      {
        id: "extra-1",
        group_id: "grp-sat-mon-wed",
        session_date: "2026-10-15", // Thursday
        time: "18:00",
        cancelled: false,
        is_extra: true,
        title: "حصة مراجعة إضافية",
      },
      {
        id: "extra-future",
        group_id: "grp-sat-mon-wed",
        session_date: "2026-10-31", // Saturday (future week or end of month)
        time: "18:00",
        cancelled: false,
        is_extra: true,
        title: "حصة إضافية نهاية الشهر",
      },
    ],
  };

  test("getCurrentWeekRange calculates week from Saturday to Friday", () => {
    // 2026-10-24 is Saturday
    const satRange = getCurrentWeekRange("2026-10-24");
    expect(satRange.start).toBe("2026-10-24");
    expect(satRange.end).toBe("2026-10-30");

    // 2026-10-26 is Monday
    const monRange = getCurrentWeekRange("2026-10-26");
    expect(monRange.start).toBe("2026-10-24");
    expect(monRange.end).toBe("2026-10-30");

    // 2026-10-28 is Wednesday
    const wedRange = getCurrentWeekRange("2026-10-28");
    expect(wedRange.start).toBe("2026-10-24");
    expect(wedRange.end).toBe("2026-10-30");

    // 2026-10-30 is Friday
    const friRange = getCurrentWeekRange("2026-10-30");
    expect(friRange.start).toBe("2026-10-24");
    expect(friRange.end).toBe("2026-10-30");
  });

  test("getMonthSessionDates returns all sessions in the month including regular and extra sessions", () => {
    const monthDates = getMonthSessionDates(satMonWedGroup, 10, 2026);

    // Regular sessions in October 2026:
    // Saturdays: Oct 3, 10, 17, 24, 31
    expect(monthDates).toContain("2026-10-03");
    expect(monthDates).toContain("2026-10-10");
    expect(monthDates).toContain("2026-10-17");
    expect(monthDates).toContain("2026-10-24");
    expect(monthDates).toContain("2026-10-31");

    // Mondays: Oct 5, 12, 19, 26
    expect(monthDates).toContain("2026-10-05");
    expect(monthDates).toContain("2026-10-12");
    expect(monthDates).toContain("2026-10-19");
    expect(monthDates).toContain("2026-10-26");

    // Wednesdays: Oct 7, 14, 21, 28
    expect(monthDates).toContain("2026-10-07");
    expect(monthDates).toContain("2026-10-14");
    expect(monthDates).toContain("2026-10-21");
    expect(monthDates).toContain("2026-10-28");

    // Extra sessions
    expect(monthDates).toContain("2026-10-15");
  });

  test("getValidSessionDates only returns sessions of the current week", () => {
    // Current week range
    const { start, end } = getCurrentWeekRange();
    const validDates = getValidSessionDates(satMonWedGroup);

    // All valid dates must be within [start, end]
    for (const d of validDates) {
      expect(d >= start && d <= end).toBe(true);
    }
  });
});
