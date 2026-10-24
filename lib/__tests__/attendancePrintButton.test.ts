/** @jest-environment jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { AttendancePrintButton } from "@/app/teacher/attendance/_components/AttendancePrintButton";

beforeAll(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); });

async function mount(onPrint: () => Promise<void>, onError = jest.fn()) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(React.createElement(AttendancePrintButton, { onPrint, onError })));
  return { button: host.querySelector("button")!, onError, close: async () => { await act(async () => root.unmount()); host.remove(); } };
}

test("print action has a visible Arabic label on small screens", async () => {
  const h = await mount(jest.fn().mockResolvedValue(undefined));
  expect(h.button.textContent).toBe("طباعة التقرير");
  expect(h.button.querySelector("span")!.className).not.toContain("hidden");
  expect(h.button.type).toBe("button");
  await h.close();
});

test("rapid taps start only one report and restore the button after completion", async () => {
  let finish!: () => void;
  const onPrint = jest.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  const h = await mount(onPrint);
  await act(async () => { h.button.click(); h.button.click(); });
  expect(onPrint).toHaveBeenCalledTimes(1);
  expect(h.button.disabled).toBe(true);
  expect(h.button.getAttribute("aria-busy")).toBe("true");
  await act(async () => finish());
  expect(h.button.disabled).toBe(false);
  expect(h.button.textContent).toBe("طباعة التقرير");
  await h.close();
});

test("print failures are visible and a subsequent attempt can succeed", async () => {
  const onPrint = jest.fn().mockRejectedValueOnce(new Error("تعذر تحميل المستند")).mockResolvedValue(undefined);
  const h = await mount(onPrint);
  await act(async () => h.button.click());
  expect(h.onError).toHaveBeenCalledWith("تعذر تحميل المستند");
  expect(h.button.disabled).toBe(false);
  await act(async () => h.button.click());
  expect(onPrint).toHaveBeenCalledTimes(2);
  await h.close();
});
