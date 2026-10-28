/** @jest-environment jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { usePaymentScan } from "@/app/teacher/students/_components/payment-scan/usePaymentScan";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";

jest.mock("@/lib/services/subscriptionsService", () => ({
  SubscriptionsService: {
    lookupPaymentStudent: jest.fn(),
    pay: jest.fn(),
    recentPayments: jest.fn(),
  },
}));

const mockStart = jest.fn();
const mockStop = jest.fn();
const mockClear = jest.fn();

jest.mock("html5-qrcode", () => ({
  Html5Qrcode: jest.fn().mockImplementation(() => ({
    start: mockStart,
    stop: mockStop,
    clear: mockClear,
  })),
}));

let hook: ReturnType<typeof usePaymentScan>;
let root: Root;
let host: HTMLDivElement;

const student = { id: "student-1", code: "S-001", name: "أحمد علي", is_suspended: false } as any;
const createSub = (id: string, month: number, status = "due", year = 2026) => ({
  id,
  student_id: student.id,
  month,
  year,
  status,
  amount: 200,
  discount: 20,
});

const onStudentUpdated = jest.fn();
const onSubsPaid = jest.fn();
const onStudentChanged = jest.fn();

function Harness() {
  hook = usePaymentScan({
    ownerId: "teacher-1",
    autoCamera: true,
    students: [],
    groups: [],
    onStudentUpdated,
    onSubsPaid,
    onStudentChanged,
  });
  return null;
}

beforeEach(async () => {
  jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate", "queueMicrotask"] });
  jest.clearAllMocks();
  sessionStorage.clear();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (SubscriptionsService.recentPayments as jest.Mock).mockResolvedValue([]);
  mockStart.mockResolvedValue(undefined);
  mockStop.mockResolvedValue(undefined);

  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(React.createElement(Harness)));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  jest.useRealTimers();
});

async function triggerCameraQR(rawCode: string) {
  await act(async () => hook.startScanner());
  const decodeCallback = mockStart.mock.calls[0][2];
  await act(async () => decodeCallback(rawCode));
}

describe("Frontend Payment Scan - Grace Period & Arrears Automation", () => {
  // Case 1: طالب منتظم ولا توجد عليه متأخرات: يتم الدفع تلقائياً
  test("Case 1: Regular student paying current month auto-pays with clear success message", async () => {
    const octSub = createSub("sub-oct", 10, "due", 2026);
    (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({
      student,
      subscriptions: [octSub],
      evaluation: {
        status: "regular_auto",
        action: "auto_pay",
        eligibleForAuto: true,
        payPeriod: { month: 10, year: 2026 },
        targetPeriod: { month: 10, year: 2026 },
        message: "تم تسجيل دفع شهر أكتوبر بنجاح.",
      },
    });

    const receipt = {
      id: "op-1",
      name: student.name,
      code: student.code,
      amount: 180,
      months: [{ month: 10, year: 2026 }],
      created_at: new Date().toISOString(),
    };
    (SubscriptionsService.pay as jest.Mock).mockResolvedValue({
      receipt,
      student,
      subscriptions: [{ ...octSub, status: "paid" }],
      message: "تم تسجيل دفع شهر أكتوبر بنجاح.",
    });

    await triggerCameraQR("S-001");

    expect(SubscriptionsService.pay).toHaveBeenCalledTimes(1);
    expect(SubscriptionsService.pay).toHaveBeenCalledWith(
      student.id,
      [{ id: "sub-oct", amount: 200, discount: 20 }],
      expect.any(String),
      { month: 10, year: 2026 }
    );
    expect(hook.flashMsg?.type).toBe("success");
    expect(hook.flashMsg?.text).toBe("تم تسجيل دفع شهر أكتوبر بنجاح.");
    expect(hook.currentStudent).toBeNull(); // No manual card opened
  });

  // Case 2: طالب يسدد الشهر السابق خلال فترة السماح: يتم دفع الشهر السابق تلقائياً
  test("Case 2: Student paying previous month in grace period auto-pays September", async () => {
    const septSub = createSub("sub-sept", 9, "due", 2026);
    const octSub = createSub("sub-oct", 10, "due", 2026);

    (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({
      student,
      subscriptions: [septSub, octSub],
      evaluation: {
        status: "grace_period_auto",
        action: "auto_pay",
        eligibleForAuto: true,
        payPeriod: { month: 9, year: 2026 },
        targetPeriod: { month: 10, year: 2026 },
        isGracePeriod: true,
        message: "تم تسجيل دفع شهر سبتمبر بنجاح خلال فترة السماح.",
      },
    });

    const receipt = {
      id: "op-2",
      name: student.name,
      code: student.code,
      amount: 180,
      months: [{ month: 9, year: 2026 }],
      created_at: new Date().toISOString(),
    };
    (SubscriptionsService.pay as jest.Mock).mockResolvedValue({
      receipt,
      student,
      subscriptions: [{ ...septSub, status: "paid" }, octSub],
      message: "تم تسجيل دفع شهر سبتمبر بنجاح خلال فترة السماح.",
    });

    await triggerCameraQR("S-001");

    expect(SubscriptionsService.pay).toHaveBeenCalledTimes(1);
    expect(SubscriptionsService.pay).toHaveBeenCalledWith(
      student.id,
      [{ id: "sub-sept", amount: 200, discount: 20 }],
      expect.any(String),
      { month: 9, year: 2026 }
    );
    expect(hook.flashMsg?.type).toBe("success");
    expect(hook.flashMsg?.text).toBe("تم تسجيل دفع شهر سبتمبر بنجاح خلال فترة السماح.");
  });

  // Case 3: الطالب عليه متأخرات أقدم: تظهر رسالة المتأخرات وتطلب تأكيد المدرس
  test("Case 3: Student with older arrears does not auto-pay and asks confirmation", async () => {
    const septSub = createSub("sub-sept", 9, "due", 2026);
    const octSub = createSub("sub-oct", 10, "due", 2026);

    (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({
      student,
      subscriptions: [septSub, octSub],
      evaluation: {
        status: "arrears_require_confirmation",
        action: "require_confirmation",
        eligibleForAuto: false,
        payPeriod: { month: 10, year: 2026 },
        targetPeriod: { month: 10, year: 2026 },
        arrears: [{ month: 9, year: 2026 }],
        message: "الطالب عليه متأخرات عن شهر سبتمبر. هل تريد المتابعة وتسجيل الدفع عن شهر أكتوبر؟",
      },
    });

    await triggerCameraQR("S-001");

    expect(SubscriptionsService.pay).not.toHaveBeenCalled();
    expect(hook.currentStudent?.id).toBe(student.id);
    expect(hook.flashMsg?.type).toBe("warn");
    expect(hook.flashMsg?.text).toBe("الطالب عليه متأخرات عن شهر سبتمبر. هل تريد المتابعة وتسجيل الدفع عن شهر أكتوبر؟");
  });

  // Case 4: الطالب تجاوز فترة السماح: تظهر رسالة التأكيد المناسبة
  test("Case 4: Student exceeded grace period requires confirmation", async () => {
    const septSub = createSub("sub-sept", 9, "due", 2026);

    (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({
      student,
      subscriptions: [septSub],
      evaluation: {
        status: "grace_period_expired",
        action: "require_confirmation",
        eligibleForAuto: false,
        payPeriod: { month: 9, year: 2026 },
        targetPeriod: { month: 9, year: 2026 },
        message: "الطالب لم يسدد اشتراك شهر سبتمبر خلال فترة السماح. هل تريد تسجيل الدفع عن شهر سبتمبر الآن؟",
      },
    });

    await triggerCameraQR("S-001");

    expect(SubscriptionsService.pay).not.toHaveBeenCalled();
    expect(hook.currentStudent?.id).toBe(student.id);
    expect(hook.flashMsg?.type).toBe("warn");
    expect(hook.flashMsg?.text).toBe("الطالب لم يسدد اشتراك شهر سبتمبر خلال فترة السماح. هل تريد تسجيل الدفع عن شهر سبتمبر الآن؟");
  });

  // إلغاء المدرس لعملية الدفع: لا يتم تسجيل أي دفعة
  test("Dismissing review card records no payment", async () => {
    const septSub = createSub("sub-sept", 9, "due", 2026);
    (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({
      student,
      subscriptions: [septSub],
      evaluation: {
        status: "grace_period_expired",
        action: "require_confirmation",
        eligibleForAuto: false,
        payPeriod: { month: 9, year: 2026 },
        targetPeriod: { month: 9, year: 2026 },
        message: "الطالب لم يسدد اشتراك شهر سبتمبر خلال فترة السماح. هل تريد تسجيل الدفع عن شهر سبتمبر الآن؟",
      },
    });

    await triggerCameraQR("S-001");
    expect(hook.currentStudent).not.toBeNull();

    // Teacher dismisses the card
    await act(async () => hook.dismissCard());
    expect(hook.currentStudent).toBeNull();
    expect(SubscriptionsService.pay).not.toHaveBeenCalled();
  });

  // طالب دفع الشهر بالفعل: تظهر رسالة واضحة ولا يتم تسجيل أي دفعة
  test("Already paid student displays clear message without payment", async () => {
    const octSub = createSub("sub-oct", 10, "paid", 2026);
    (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({
      student,
      subscriptions: [octSub],
      evaluation: {
        status: "already_paid",
        action: "none",
        eligibleForAuto: false,
        payPeriod: { month: 10, year: 2026 },
        targetPeriod: { month: 10, year: 2026 },
        message: "اشتراك شهر أكتوبر مدفوع بالفعل، ولا يمكن تسجيل الدفع مرة أخرى.",
      },
    });

    await triggerCameraQR("S-001");

    expect(SubscriptionsService.pay).not.toHaveBeenCalled();
    expect(hook.flashMsg?.text).toContain("اشتراك شهر أكتوبر مدفوع بالفعل، ولا يمكن تسجيل الدفع مرة أخرى.");
  });

  test("Case 1 (manual code): Regular student paying current month auto-pays directly without confirmation prompt", async () => {
    const octSub = createSub("sub-oct", 10, "due", 2026);
    (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({
      student,
      subscriptions: [octSub],
      evaluation: {
        status: "regular_auto",
        action: "auto_pay",
        eligibleForAuto: true,
        payPeriod: { month: 10, year: 2026 },
        targetPeriod: { month: 10, year: 2026 },
        message: "تم تسجيل دفع شهر أكتوبر بنجاح.",
      },
    });

    const receipt = {
      id: "op-manual",
      name: student.name,
      code: student.code,
      amount: 180,
      months: [{ month: 10, year: 2026 }],
      created_at: new Date().toISOString(),
    };
    (SubscriptionsService.pay as jest.Mock).mockResolvedValue({
      receipt,
      student,
      subscriptions: [{ ...octSub, status: "paid" }],
      message: "تم تسجيل دفع شهر أكتوبر بنجاح.",
    });

    await act(async () => hook.setManualCode("S-001"));
    await act(async () => hook.handleManualSubmit());

    expect(SubscriptionsService.pay).toHaveBeenCalledTimes(1);
    expect(hook.currentStudent).toBeNull();
    expect(hook.flashMsg?.type).toBe("success");
    expect(hook.flashMsg?.text).toBe("تم تسجيل دفع شهر أكتوبر بنجاح.");
  });
});
