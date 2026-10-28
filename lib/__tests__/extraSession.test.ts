import { getGroupSessionDates, getGroupSessionDatesForWeek, isExtraSession, getExtraSessionInfo } from "@/app/teacher/attendance/_utils/sessionDates";
import { getValidSessionDates } from "@/app/teacher/attendance/scan/_hooks/useScanSession";
import { Group } from "@/lib/types";
import { getTodayCairo } from "@/lib/utils/dateUtils";

describe("Extra Sessions Integration Tests", () => {
  const baseGroup: Group = {
    id: "grp-1",
    name: "مجموعة الأحد والأربعاء",
    day_of_week: "الأحد, الأربعاء",
    time: "15:00",
    grade_id: "grd-1",
    created_at: "2026-01-01T00:00:00.000Z",
    start_date: "2026-01-01",
    attendance_sessions: [
      {
        id: "sess-extra-1",
        group_id: "grp-1",
        session_date: "2026-10-19", // Monday (not in regular schedule)
        time: "17:00",
        cancelled: false,
        is_extra: true,
        title: "مراجعة شهرية",
      },
      {
        id: "sess-extra-2",
        group_id: "grp-1",
        session_date: "2026-10-23", // Friday (not in regular schedule)
        time: "18:00",
        cancelled: false,
        is_extra: true,
        title: "حل امتحانات",
      },
    ],
  };

  test("getGroupSessionDates includes both regular and extra sessions for the month", () => {
    const dates = getGroupSessionDates(baseGroup, 10, 2026);
    expect(dates).toContain("2026-10-19");
    expect(dates).toContain("2026-10-23");
    // Also contains regular Sunday (e.g. 2026-10-18 or 2026-10-25)
    expect(dates).toContain("2026-10-18");
    expect(dates).toContain("2026-10-21"); // Wednesday
  });

  test("isExtraSession and getExtraSessionInfo identify extra sessions correctly", () => {
    expect(isExtraSession(baseGroup, "2026-10-19")).toBe(true);
    expect(isExtraSession(baseGroup, "2026-10-23")).toBe(true);
    expect(isExtraSession(baseGroup, "2026-10-18")).toBe(false);

    const info = getExtraSessionInfo(baseGroup, "2026-10-19");
    expect(info?.title).toBe("مراجعة شهرية");
    expect(info?.time).toBe("17:00");
  });

  test("getValidSessionDates in QR scan includes extra sessions up to today", () => {
    const today = getTodayCairo();
    const groupWithPastAndFutureExtra: Group = {
      ...baseGroup,
      attendance_sessions: [
        {
          id: "extra-today",
          group_id: "grp-1",
          session_date: today,
          time: "16:00",
          cancelled: false,
          is_extra: true,
          title: "حصة اليوم الإضافية",
        },
        {
          id: "extra-future",
          group_id: "grp-1",
          session_date: "2099-12-31",
          time: "16:00",
          cancelled: false,
          is_extra: true,
          title: "حصة مستقبلية",
        },
      ],
    };

    const validDates = getValidSessionDates(groupWithPastAndFutureExtra);
    expect(validDates).toContain(today);
    expect(validDates).not.toContain("2099-12-31"); // Future dates must never be in scan dates
  });
});
