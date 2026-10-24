/** @jest-environment jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useSearchParams } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { useScanSession } from "@/app/teacher/attendance/scan/_hooks/useScanSession";
import { SessionConfig } from "@/app/teacher/attendance/scan/_components/SessionConfig";
import { AuthService } from "@/lib/services/authService";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { api } from "@/lib/apiClient";
jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));
jest.mock("html5-qrcode", () => ({ Html5Qrcode: jest.fn() }));
jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));
jest.mock("@/lib/services/authService", () => ({
  AuthService: { getUser: jest.fn() },
}));
jest.mock("@/lib/services/groupsService", () => ({
  GroupsService: { getGroupsByTeacherId: jest.fn() },
}));
jest.mock("@/lib/services/studentsService", () => ({
  StudentsService: {
    getStudentsByTeacherId: jest.fn(),
    getStudentByQR: jest.fn(),
  },
}));
jest.mock("@/lib/services/gradesService", () => ({
  GradesService: { getGradesByTeacherId: jest.fn() },
}));
const group: any = {
  id: "g",
  grade_id: "grade",
  name: "G",
  day_of_week: "الجمعة",
  time: "10:00",
  start_date: "2026-01-01",
};
const A: any = { id: "a", name: "A", code: "0001", group_id: "originalA" },
  B: any = { id: "b", name: "B", code: "0002", group_id: "originalB" };
let callback: any, camera: any;
function deferred() {
  let resolve: any, reject: any;
  const promise = new Promise<any>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.useFakeTimers().setSystemTime(new Date("2026-10-23T12:00:00Z"));
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  (AuthService.getUser as jest.Mock).mockResolvedValue({ id: "teacher" });
  (GroupsService.getGroupsByTeacherId as jest.Mock).mockResolvedValue([group]);
  (StudentsService.getStudentsByTeacherId as jest.Mock).mockResolvedValue([
    A,
    B,
  ]);
  (StudentsService.getStudentByQR as jest.Mock).mockImplementation(
    async (qr) => (qr === "A" ? A : B),
  );
  (GradesService.getGradesByTeacherId as jest.Mock).mockResolvedValue([
    { id: "grade", name: "Grade" },
  ]);
  (api.get as jest.Mock).mockResolvedValue([]);
  jest
    .spyOn(AttendanceService, "getContext")
    .mockResolvedValue({ memberships: [], groups: [], sessions: [] });
  jest
    .spyOn(AttendanceService, "upsertAttendanceRecord")
    .mockResolvedValue({ state: "saved", record: { id: "saved" } as any });
  jest.spyOn(window, "confirm").mockReturnValue(true);
  camera = {
    start: jest.fn().mockImplementation(async (_camera, _config, cb) => {
      callback = cb;
    }),
    stop: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn(),
  };
  (Html5Qrcode as unknown as jest.Mock).mockImplementation(() => camera);
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
async function mount() {
  const root = createRoot(document.createElement("div"));
  let value: any;
  function C() {
    value = useScanSession();
    return null;
  }
  await act(async () => root.render(React.createElement(C)));
  return {
    get value() {
      return value;
    },
    close: () => act(async () => root.unmount()),
  };
}
async function start(h: any) {
  await act(async () => h.value.handleGroupChange("g"));
  await act(async () => h.value.startScanner());
}

test("different cards wait behind lookup and both save in order", async () => {
  const h = await mount();
  await start(h);
  const lookup = deferred();
  (StudentsService.getStudentByQR as jest.Mock).mockImplementation((qr) =>
    qr === "A" ? lookup.promise : Promise.resolve({ ...B, group_id: "g" }),
  );
  await act(async () => callback("A"));
  await act(async () => callback("B"));
  expect(h.value.queuedScans).toBe(1);
  expect(StudentsService.getStudentByQR).toHaveBeenCalledTimes(1);
  await act(async () => lookup.resolve({ ...A, group_id: "g" }));
  await flush();
  expect(StudentsService.getStudentByQR).toHaveBeenCalledTimes(2);
  expect(h.value.scannedToday.map((s: any) => s.studentId)).toEqual(["b", "a"]);
  await h.close();
});
test("one confirmation owns the pipeline until resolved", async () => {
  const h = await mount();
  await start(h);
  const validation = deferred();
  (api.post as jest.Mock).mockReturnValue(validation.promise);
  await act(async () => callback("A"));
  await act(async () => callback("B"));
  expect(api.post).toHaveBeenCalledTimes(1);
  await act(async () =>
    validation.resolve({ decision: "confirm", studentGroupName: "GA" }),
  );
  expect(h.value.crossGroupConfirm.student.id).toBe("a");
  await act(async () => callback("another"));
  expect(StudentsService.getStudentByQR).toHaveBeenCalledTimes(1);
  (api.post as jest.Mock).mockResolvedValue({
    decision: "confirm",
    studentGroupName: "GB",
  });
  await act(async () => h.value.handleCancelCrossGroup());
  await flush();
  expect(h.value.crossGroupConfirm.student.id).toBe("b");
  await h.close();
});
test("confirmation stays visible during save and double confirmation saves once", async () => {
  const h = await mount();
  await start(h);
  (api.post as jest.Mock).mockResolvedValue({ decision: "confirm" });
  await act(async () => callback("A"));
  const save = deferred();
  (AttendanceService.upsertAttendanceRecord as jest.Mock).mockReturnValue(
    save.promise,
  );
  let pending: any;
  await act(async () => {
    pending = h.value.handleConfirmCrossGroup({action:"guest"});
  });
  expect(h.value.crossGroupConfirm.student.id).toBe("a");
  expect(h.value.busy).toContain("A");
  await act(async () => h.value.handleConfirmCrossGroup({action:"guest"}));
  expect(AttendanceService.upsertAttendanceRecord).toHaveBeenCalledTimes(1);
  await act(async () => {
    save.resolve({ state: "saved", record: { id: "confirmed" } });
    await pending;
  });
  expect(h.value.crossGroupConfirm).toBeNull();
  expect(h.value.scannedToday[0].recordId).toBe("confirmed");
  await h.close();
});
test("failed confirmation retains the same student for retry", async () => {
  const h = await mount();
  await start(h);
  (api.post as jest.Mock).mockResolvedValue({ decision: "confirm" });
  await act(async () => callback("A"));
  (AttendanceService.upsertAttendanceRecord as jest.Mock).mockRejectedValueOnce(
    new Error("رفض الحضور"),
  );
  await act(async () => h.value.handleConfirmCrossGroup({action:"guest"}));
  expect(h.value.crossGroupConfirm.student.id).toBe("a");
  expect(h.value.lastScan.success).toBe(false);
  await act(async () => h.value.handleConfirmCrossGroup({action:"guest"}));
  expect(h.value.crossGroupConfirm).toBeNull();
  await h.close();
});
test("future URL group never opens camera", async () => {
  (useSearchParams as jest.Mock).mockReturnValue(
    new URLSearchParams("group=g"),
  );
  (GroupsService.getGroupsByTeacherId as jest.Mock).mockResolvedValue([
    { ...group, start_date: "2026-11-01" },
  ]);
  const h = await mount();
  expect(h.value.validSessionDates).toEqual([]);
  expect(camera.start).not.toHaveBeenCalled();
  await act(async () => h.value.startScanner());
  expect(camera.start).not.toHaveBeenCalled();
  expect(h.value.sessionDateError).toBeTruthy();
  await h.close();
});
test("cancelled today is not auto-detected as an old class", async () => {
  jest.setSystemTime(new Date("2026-10-23T07:05:00Z"));
  (GroupsService.getGroupsByTeacherId as jest.Mock).mockResolvedValue([
    { ...group, cancelled_sessions: ["2026-10-23"] },
  ]);
  const h = await mount();
  expect(h.value.autoDetected).toBe(false);
  expect(h.value.selectedGroupId).toBe("");
  await h.close();
});
test("allowed Monday spelling auto-detects correctly", async () => {
  jest.setSystemTime(new Date("2026-10-19T07:05:00Z"));
  (GroupsService.getGroupsByTeacherId as jest.Mock).mockResolvedValue([
    { ...group, day_of_week: "الاثنين" },
  ]);
  const h = await mount();
  expect(h.value.selectedGroupId).toBe("g");
  expect(h.value.sessionDate).toBe("2026-10-19");
  await h.close();
});
test("overlapping groups require explicit selection", async () => {
  jest.setSystemTime(new Date("2026-10-23T07:05:00Z"));
  (GroupsService.getGroupsByTeacherId as jest.Mock).mockResolvedValue([
    group,
    { ...group, id: "g2" },
  ]);
  const h = await mount();
  expect(h.value.selectedGroupId).toBe("");
  await h.close();
});
test("partial load failure preserves available groups and exposes retry", async () => {
  (StudentsService.getStudentsByTeacherId as jest.Mock).mockRejectedValue(
    new Error("Server unavailable"),
  );
  const h = await mount();
  expect(h.value.loading).toBe(false);
  expect(h.value.groups).toHaveLength(1);
  expect(h.value.loadError).toBeTruthy();
  (StudentsService.getStudentsByTeacherId as jest.Mock).mockResolvedValue([A]);
  await act(async () => h.value.retryLoad());
  expect(h.value.loadError).toBeNull();
  await h.close();
});
test("no valid dates does not falsely say old group has not started", async () => {
  const host = document.createElement("div"),
    root = createRoot(host),
    noop = jest.fn();
  await act(async () =>
    root.render(
      React.createElement(SessionConfig, {
        groups: [group],
        grades: [{ id: "grade", name: "G" }],
        selectedGradeId: "grade",
        selectedGroupId: "g",
        sessionDate: "2026-10-23",
        validSessionDates: [],
        manualCode: "",
        manualPlaceholder: "",
        onGradeChange: noop,
        onGroupChange: noop,
        onSessionDateChange: noop,
        onManualCodeChange: noop,
        onManualSubmit: noop,
      } as any),
    ),
  );
  expect(host.textContent).not.toContain("المجموعة لم تبدأ بعد");
  expect(host.textContent).toContain("لا توجد حصص متاحة");
  await act(async () => root.unmount());
});
test("ambiguous manual code never picks the first student", async () => {
  (StudentsService.getStudentsByTeacherId as jest.Mock).mockResolvedValue([
    { ...A, group_id: "g", code: "0001" },
    { ...B, group_id: "g", code: "0001" },
  ]);
  const h = await mount();
  await act(async () => h.value.handleGroupChange("g"));
  await act(async () => h.value.setManualCode("0001"));
  await act(async () => h.value.handleManualSubmit({ preventDefault() {} }));
  expect(AttendanceService.upsertAttendanceRecord).not.toHaveBeenCalled();
  expect(h.value.lastScan.name).toContain("مكرر");
  await h.close();
});
test("past session requires acknowledgement before opening or saving", async () => {
  const h = await mount();
  await act(async () => h.value.handleGroupChange("g"));
  await act(async () => h.value.handleSessionDateChange("2026-10-16"));
  await act(async () => h.value.startScanner());
  expect(camera.start).not.toHaveBeenCalled();
  await act(async () => h.value.setManualCode("0001"));
  await act(async () => h.value.handleManualSubmit({ preventDefault() {} }));
  expect(AttendanceService.upsertAttendanceRecord).not.toHaveBeenCalled();
  await act(async () => h.value.acknowledgePastDate());
  await act(async () => h.value.startScanner());
  expect(camera.start).toHaveBeenCalled();
  await act(async () => h.value.handleSessionDateChange("2026-10-23"));
  expect(h.value.pastDateAcknowledged).toBe(false);
  expect(h.value.scanning).toBe(false);
  await h.close();
});
test("changing date invalidates in-flight lookup and queued cards", async () => {
  const h = await mount();
  await start(h);
  const lookup = deferred();
  (StudentsService.getStudentByQR as jest.Mock).mockReturnValue(lookup.promise);
  await act(async () => callback("A"));
  await act(async () => callback("B"));
  await act(async () => h.value.handleSessionDateChange("2026-10-16"));
  await act(async () => lookup.resolve({ ...A, group_id: "g" }));
  expect(AttendanceService.upsertAttendanceRecord).not.toHaveBeenCalled();
  expect(h.value.scannedToday).toHaveLength(0);
  expect(h.value.queuedScans).toBe(0);
  await h.close();
});
test("duplicate while saving cannot double save, later duplicate is informational", async () => {
  const h = await mount();
  await start(h);
  (StudentsService.getStudentByQR as jest.Mock).mockResolvedValue({
    ...A,
    group_id: "g",
  });
  const saving = deferred();
  (AttendanceService.upsertAttendanceRecord as jest.Mock).mockReturnValue(
    saving.promise,
  );
  await act(async () => callback("A"));
  await act(async () => callback("A"));
  expect(AttendanceService.upsertAttendanceRecord).toHaveBeenCalledTimes(1);
  await act(async () =>
    saving.resolve({ state: "saved", record: { id: "a" } }),
  );
  await act(async () => jest.advanceTimersByTime(3100));
  await act(async () => callback("A"));
  expect(h.value.lastScan.info).toBe(true);
  expect(AttendanceService.upsertAttendanceRecord).toHaveBeenCalledTimes(1);
  await h.close();
});
test("queued attendance is not confirmed success", async () => {
  const h = await mount();
  await start(h);
  (StudentsService.getStudentByQR as jest.Mock).mockResolvedValue({
    ...A,
    group_id: "g",
  });
  (AttendanceService.upsertAttendanceRecord as jest.Mock).mockResolvedValue({
    state: "queued",
  });
  await act(async () => callback("A"));
  expect(h.value.lastScan.pending).toBe(true);
  expect(h.value.lastScan.success).toBe(false);
  expect(h.value.scannedToday[0].queued).toBe(true);
  await h.close();
});
test("online reload includes pending for this session only", async () => {
  const { AttendanceQueue } = await import("@/lib/offlineQueue");
  AttendanceQueue.add({
    teacher_id: "teacher",
    student_id: "a",
    group_id: "g",
    session_date: "2026-10-23",
    status: "present",
    month: 10,
    year: 2026,
  });
  AttendanceQueue.add({
    teacher_id: "teacher",
    student_id: "b",
    group_id: "g",
    session_date: "2026-10-16",
    status: "present",
    month: 10,
    year: 2026,
  });
  const h = await mount();
  await act(async () => h.value.handleGroupChange("g"));
  expect(h.value.scannedToday).toHaveLength(1);
  expect(h.value.scannedToday[0]).toMatchObject({
    studentId: "a",
    queued: true,
  });
  await h.close();
});
test("deletion needs confirmation and cannot send overlapping requests", async () => {
  const h = await mount();
  await start(h);
  (StudentsService.getStudentByQR as jest.Mock).mockResolvedValue({
    ...A,
    group_id: "g",
  });
  await act(async () => callback("A"));
  const remove = jest.spyOn(AttendanceService, "deleteAttendanceRecord");
  (window.confirm as jest.Mock).mockReturnValue(false);
  await act(async () => h.value.handleRemoveScanned("a"));
  expect(remove).not.toHaveBeenCalled();
  expect(h.value.scannedToday).toHaveLength(1);
  (window.confirm as jest.Mock).mockReturnValue(true);
  const deleting = deferred();
  remove.mockReturnValue(deleting.promise);
  let request: any;
  await act(async () => {
    request = h.value.handleRemoveScanned("a");
  });
  await act(async () => h.value.handleRemoveScanned("a"));
  expect(remove).toHaveBeenCalledTimes(1);
  expect(h.value.deletingIds).toContain("a");
  await act(async () => {
    deleting.resolve();
    await request;
  });
  expect(h.value.scannedToday).toHaveLength(0);
  await h.close();
});
test("pagehide stops camera and ignores stale frames", async () => {
  const h = await mount();
  await start(h);
  const oldCallback = callback;
  await act(async () => window.dispatchEvent(new Event("pagehide")));
  expect(camera.stop).toHaveBeenCalled();
  expect(h.value.scanning).toBe(false);
  await act(async () => oldCallback("A"));
  expect(AttendanceService.upsertAttendanceRecord).not.toHaveBeenCalled();
  await h.close();
});
import * as soundModule from "@/app/teacher/attendance/scan/_hooks/useScanSound";
import { resolveManualStudent } from "@/app/teacher/attendance/scan/_utils/resolveManualStudent";
import { ScannerPanel } from "@/app/teacher/attendance/scan/_components/ScannerPanel";

test("success sound waits for confirmed server response, never lookup or queued save", async () => {
  const play = jest.fn();
  jest.spyOn(soundModule, "useScanSound").mockReturnValue({
    soundEnabled: true,
    soundReady: true,
    toggleSound: jest.fn(),
    unlockSound: jest.fn(),
    playSuccess: play,
  });
  const h = await mount();
  await start(h);
  (StudentsService.getStudentByQR as jest.Mock).mockResolvedValue({
    ...A,
    group_id: "g",
  });
  const saving = deferred();
  (AttendanceService.upsertAttendanceRecord as jest.Mock).mockReturnValueOnce(
    saving.promise,
  );
  await act(async () => callback("A"));
  expect(play).not.toHaveBeenCalled();
  await act(async () =>
    saving.resolve({ state: "saved", record: { id: "confirmed" } }),
  );
  expect(play).toHaveBeenCalledTimes(1);
  (StudentsService.getStudentByQR as jest.Mock).mockResolvedValue({
    ...B,
    group_id: "g",
  });
  (AttendanceService.upsertAttendanceRecord as jest.Mock).mockResolvedValueOnce(
    { state: "queued" },
  );
  await act(async () => callback("B"));
  expect(play).toHaveBeenCalledTimes(1);
  await h.close();
});
test("refusal never plays the success sound", async () => {
  const play = jest.fn();
  jest.spyOn(soundModule, "useScanSound").mockReturnValue({
    soundEnabled: true,
    soundReady: true,
    toggleSound: jest.fn(),
    unlockSound: jest.fn(),
    playSuccess: play,
  });
  const h = await mount();
  await start(h);
  (api.post as jest.Mock).mockResolvedValue({
    decision: "deny",
    reason: "غير مسموح",
  });
  await act(async () => callback("A"));
  expect(play).not.toHaveBeenCalled();
  expect(AttendanceService.upsertAttendanceRecord).not.toHaveBeenCalled();
  await h.close();
});
test("manual identity resolution supports Arabic numbers, full codes and ambiguous short codes", () => {
  expect(
    resolveManualStudent(
      [{ ...A, group_id: "g", code: "TPC-0001" }],
      "TPC–٠٠٠١",
      group,
    )?.id,
  ).toBe("a");
  expect(
    resolveManualStudent(
      [{ ...A, group_id: "g", code: "TPC-0001" }],
      "١",
      group,
    )?.id,
  ).toBe("a");
  expect(() =>
    resolveManualStudent(
      [
        { ...A, group_id: "g", code: "TPC-0001" },
        { ...B, group_id: "g", code: "ALT-0001" },
      ],
      "١",
      group,
    ),
  ).toThrow("أكثر من طالب");
});
test("confirmation has focus handling and result remains inside the camera container", async () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host),
    cancel = jest.fn();
  const props: any = {
    scanning: true,
    selectedGroupId: "g",
    scannerDivId: "test-reader",
    lastScan: null,
    crossGroupConfirm: {
      student: A,
      originalGroupName: "G",
      context: {},
      reason: "راجع المجموعة",
    },
    onConfirmCrossGroup: jest.fn(),
    onCancelCrossGroup: cancel,
    soundEnabled: true,
    soundReady: true,
  };
  await act(async () => root.render(React.createElement(ScannerPanel, props)));
  const dialog = host.querySelector("[role=dialog]")!;
  expect(dialog.getAttribute("aria-labelledby")).toBe("cross-group-title");
  expect(dialog.contains(document.activeElement)).toBe(true);
  await act(async () =>
    dialog.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    ),
  );
  expect(cancel).toHaveBeenCalledTimes(1);
  await act(async () =>
    root.render(
      React.createElement(ScannerPanel, {
        ...props,
        crossGroupConfirm: null,
        lastScan: { name: "تم تسجيل A", success: true },
      }),
    ),
  );
  const reader = host.querySelector("#test-reader")!;
  expect(reader.parentElement?.textContent).toContain("تم تسجيل A");
  expect(host.querySelector("[aria-live=polite]")).not.toBeNull();
  await act(async () => root.unmount());
  host.remove();
});
test("online camera is ready before a slow complete student roster arrives", async () => {
  const roster = deferred();
  (StudentsService.getStudentsByTeacherId as jest.Mock).mockReturnValue(
    roster.promise,
  );
  const h = await mount();
  expect(h.value.loading).toBe(false);
  expect(h.value.studentsReady).toBe(false);
  await start(h);
  expect(camera.start).toHaveBeenCalled();
  await act(async () => roster.resolve([A, B]));
  expect(h.value.studentsReady).toBe(true);
  await h.close();
});
test("camera permission failure stays visible and camera can be retried", async () => {
  camera.start.mockRejectedValueOnce(
    new DOMException("Denied", "NotAllowedError"),
  );
  const h = await mount();
  await start(h);
  expect(h.value.scanning).toBe(false);
  expect(h.value.lastScan.success).toBe(false);
  await act(async () => jest.advanceTimersByTime(5000));
  expect(h.value.lastScan).not.toBeNull();
  await act(async () => h.value.startScanner());
  expect(h.value.scanning).toBe(true);
  await h.close();
});
test("camera exposes only supported tools and can switch lens explicitly", async () => {
  camera.getRunningTrackCapabilities = jest.fn(() => ({
    torch: true,
    zoom: { min: 1, max: 3 },
  }));
  camera.getRunningTrackSettings = jest.fn(() => ({ zoom: 1 }));
  camera.applyVideoConstraints = jest.fn().mockResolvedValue(undefined);
  const h = await mount();
  await start(h);
  expect(h.value.cameraTools).toMatchObject({
    torch: true,
    zoom: { min: 1, max: 3 },
  });
  await act(async () => h.value.toggleTorch());
  expect(camera.applyVideoConstraints).toHaveBeenCalledWith({
    advanced: [{ torch: true }],
  });
  expect(h.value.torchOn).toBe(true);
  await act(async () => h.value.switchCamera("lens2"));
  expect(camera.start).toHaveBeenLastCalledWith(
    "lens2",
    expect.anything(),
    expect.any(Function),
    expect.any(Function),
  );
  await h.close();
});
