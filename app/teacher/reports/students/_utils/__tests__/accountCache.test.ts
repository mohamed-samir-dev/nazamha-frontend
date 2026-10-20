/** @jest-environment jsdom */
import { appCache } from "@/lib/appCache";
import { api } from "@/lib/apiClient";
import { AuthService } from "@/lib/services/authService";
jest.mock("swr", () => ({ mutate: jest.fn().mockResolvedValue(undefined) }));

afterEach(() => { jest.restoreAllMocks(); appCache.clear(); });
test("changing accounts clears every data namespace and offline attendance", () => {
  const keys = ["students:all", "subscriptions:all", "grades:all", "teacher:me"];
  for (const key of keys) appCache.set(key, { name: "previous account" });
  localStorage.setItem("ot_attendance_queue", "old data");
  const generation = appCache.generation();
  AuthService.clearAllUserData();
  expect(appCache.generation()).toBeGreaterThan(generation);
  for (const key of keys) expect(appCache.get(key)).toBeNull();
  expect(localStorage.getItem("ot_attendance_queue")).toBeNull();
});
test("a late response from the previous account is rejected", async () => {
  let complete!: (value: unknown) => void;
  global.fetch = jest.fn(() => new Promise(resolve => { complete = resolve; })) as any;
  const pending = api.get("/students");
  appCache.clear();
  complete({ ok: true, status: 200, json: async () => [{ name: "previous account" }] });
  await expect(pending).rejects.toThrow("تغيير الحساب");
});
