import { api } from "../apiClient";
import { appCache } from "../appCache";
const originalFetch = global.fetch;
test("bulk import retries can supply the same operation key", async () => {
  const fetchMock = jest.fn(async (url: string) => url.endsWith('/csrf-token')
    ? { ok: true, json: async () => ({ csrfToken: 'csrf' }) }
    : { ok: true, status: 200, json: async () => ({ students: [] }) });
  global.fetch = fetchMock as any;
  await api.post('/students/bulk', { students: [] }, 'stable-batch-key');
  await api.post('/students/bulk', { students: [] }, 'stable-batch-key');
  const calls = (fetchMock.mock.calls as any[]).filter(([url]) => url.endsWith('/students/bulk'));
  expect(calls).toHaveLength(2);
  for (const call of calls) expect(call[1].headers['Idempotency-Key']).toBe('stable-batch-key');
});
Object.defineProperty(global.crypto, "randomUUID", { configurable: true, value: () => "test-operation-key" });
afterEach(() => { global.fetch = originalFetch; appCache.clear(); });
test("concurrent reads share one request, later reads fetch fresh data", async () => {
  let resolve!: (value: any) => void;
  const fetchMock = jest.fn(() => new Promise<any>(done => { resolve = done; }));
  global.fetch = fetchMock as any;
  const first = api.get("/students?test=single-flight");
  const second = api.get("/students?test=single-flight");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  resolve({ ok: true, status: 200, json: async () => ({ total: 2 }) });
  expect(await first).toEqual(await second);
  const third = api.get("/students?test=single-flight");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  resolve({ ok: true, status: 200, json: async () => ({ total: 3 }) });
  expect(await third).toEqual({ total: 3 });
});
test("network failures return an actionable Arabic message and allow retry", async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(api.get("/students?test=offline")).rejects.toThrow("تعذر الاتصال بالخادم");
  await expect(api.get("/students?test=offline")).rejects.toThrow("تعذر الاتصال بالخادم");
  expect(global.fetch).toHaveBeenCalledTimes(2);
});
test("account changes prevent sharing an old in-flight response", async () => {
  const pending: ((value: any) => void)[] = [];
  global.fetch = jest.fn(() => new Promise<any>(resolve => pending.push(resolve))) as any;
  const first = api.get("/students?test=account");
  const rejected = expect(first).rejects.toThrow("تم تغيير الحساب");
  appCache.clear();
  const second = api.get("/students?test=account");
  expect(global.fetch).toHaveBeenCalledTimes(2);
  pending[0]({ ok: true, status: 200, json: async () => ({ owner: "old" }) });
  pending[1]({ ok: true, status: 200, json: async () => ({ owner: "new" }) });
  await rejected; expect(await second).toEqual({ owner: "new" });
});

test("a lost student creation response retries with the same idempotency key", async () => {
  let writes = 0;
  const fetchMock = jest.fn(async (url: string) => {
    if (url.endsWith('/csrf-token')) return { ok: true, json: async () => ({ csrfToken: 'csrf' }) };
    if (++writes === 1) throw new TypeError('Failed to fetch');
    return { ok: true, status: 201, json: async () => ({ id: 'saved-once' }) };
  });
  global.fetch = fetchMock as any;
  expect(await api.post('/students', { name: 'Test Student' })).toEqual({ id: 'saved-once' });
  const calls = (fetchMock.mock.calls as any[]).filter(([url]) => url.endsWith('/students'));
  expect(calls).toHaveLength(2);
  expect(calls[0][1].headers['Idempotency-Key']).toBe(calls[1][1].headers['Idempotency-Key']);
});

test("a rejected group transfer is not retried", async () => {
  const fetchMock = jest.fn(async (url: string) => url.endsWith('/csrf-token')
    ? { ok: true, json: async () => ({ csrfToken: 'csrf' }) }
    : { ok: false, status: 400, text: async () => JSON.stringify({ message: 'المجموعة غير متاحة' }) });
  global.fetch = fetchMock as any;
  await expect(api.patch('/students/111111111111111111111111', { group_id: 'invalid' })).rejects.toThrow('المجموعة غير متاحة');
  expect(fetchMock.mock.calls.filter(([url]) => url.includes('/students/'))).toHaveLength(1);
});
