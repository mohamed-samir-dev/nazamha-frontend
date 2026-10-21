/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { usePaymentScan } from '@/app/teacher/students/_components/payment-scan/usePaymentScan';
import { SubscriptionsService } from '@/lib/services/subscriptionsService';
jest.mock('@/lib/services/subscriptionsService', () => ({ SubscriptionsService: { lookupPaymentStudent: jest.fn(), pay: jest.fn(), recentPayments: jest.fn() } }));
const mockStart = jest.fn(), mockStop = jest.fn(), mockClear = jest.fn();
jest.mock('html5-qrcode', () => ({ Html5Qrcode: jest.fn().mockImplementation(() => ({ start: mockStart, stop: mockStop, clear: mockClear })) }));
let hook: ReturnType<typeof usePaymentScan>, root: Root, host: HTMLDivElement;
let autoCamera = false;
const student = { id: 'A', code: 'A', name: 'Audit A', is_suspended: true } as any;
const sub = (id: string, month: number, status = 'due', year = 2026) => ({ id, student_id: 'A', month, year, status, amount: 200, discount: 0 });
const onStudentUpdated = jest.fn(), onSubsPaid = jest.fn(), onStudentChanged = jest.fn();
function Harness() { hook = usePaymentScan({ ownerId: 'teacher', autoCamera, students: [], groups: [], onStudentUpdated, onSubsPaid, onStudentChanged }); return null; }
const receipt = { id: 'receipt', name: student.name, code: 'A', amount: 200, months: [{ month: 9, year: 2026 }], created_at: '2026-10-19T12:00:00Z' };
const result = { receipt, student: { ...student, is_suspended: false }, subscriptions: [sub('sept', 9, 'paid')] };
beforeEach(async () => {
  autoCamera = false;
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }); jest.setSystemTime(new Date('2026-10-19T12:00:00Z')); jest.clearAllMocks(); sessionStorage.clear();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (SubscriptionsService.recentPayments as jest.Mock).mockResolvedValue([]);
  mockStart.mockResolvedValue(undefined); mockStop.mockResolvedValue(undefined);
  (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({ student, subscriptions: [sub('sept',9),sub('oct',10,'paid')] });
  (SubscriptionsService.pay as jest.Mock).mockResolvedValue(result);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(React.createElement(Harness)));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); jest.useRealTimers(); });
async function search() { await act(async () => hook.setManualCode('A')); await act(async () => hook.handleManualSubmit()); }
test('search never pays and paid target month does not hide older debt', async () => {
  await search(); expect(SubscriptionsService.pay).not.toHaveBeenCalled(); expect(hook.dueMonths?.map(d => d.sub.id)).toEqual(['sept']);
});
test('changing period invalidates an in-flight lookup', async () => {
  let finish!: (value: any) => void;
  (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  await act(async () => hook.setManualCode('A'));
  let pending!: Promise<void>; await act(async () => { pending = hook.handleManualSubmit(); });
  await act(async () => hook.setSelectedMonth(10));
  await act(async () => { finish({ student, subscriptions: [sub('oct',10)] }); await pending; });
  expect(hook.currentStudent).toBeNull(); expect(hook.loadingCode).toBe(false); expect(SubscriptionsService.pay).not.toHaveBeenCalled();
});
test('same-tick confirmations send one payment and update suspension and subscriptions', async () => {
  await search(); const confirm = hook.handleConfirmPayment;
  await act(async () => { await Promise.all([confirm(),confirm()]); });
  expect(SubscriptionsService.pay).toHaveBeenCalledTimes(1); expect(hook.paidList).toHaveLength(1);
  expect(onSubsPaid).toHaveBeenLastCalledWith('A',result.subscriptions); expect(onStudentChanged).toHaveBeenCalledWith(result.student);
});
test('unknown network result locks context and retries the identical operation key', async () => {
  (SubscriptionsService.pay as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(result);
  await search(); await act(async () => hook.handleConfirmPayment());
  expect(hook.uncertain).toBe(true); expect(hook.canClose()).toBe(false);
  const original = hook.selectedMonth;
  await act(async () => { hook.setSelectedMonth(0); hook.dismissCard(); hook.setSelectedSubs(new Set()); });
  expect(hook.selectedMonth).toBe(original); expect(hook.selectedSubs.size).toBe(1);
  await act(async () => hook.handleConfirmPayment());
  expect((SubscriptionsService.pay as jest.Mock).mock.calls[0]).toEqual((SubscriptionsService.pay as jest.Mock).mock.calls[1]);
  expect(hook.canClose()).toBe(true); expect(sessionStorage.length).toBe(0);
});
test('pending operation survives modal remount without creating another key', async () => {
  (SubscriptionsService.pay as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(result);
  await search(); await act(async () => hook.handleConfirmPayment());
  await act(async () => root.unmount()); root = createRoot(host);
  await act(async () => root.render(React.createElement(Harness)));
  expect(hook.uncertain).toBe(true);
  await act(async () => hook.handleConfirmPayment());
  expect((SubscriptionsService.pay as jest.Mock).mock.calls[0]).toEqual((SubscriptionsService.pay as jest.Mock).mock.calls[1]);
});
test('past-year payment does not set current-year month flags', async () => {
  (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({ student, subscriptions: [sub('old',10,'due',2025)] });
  (SubscriptionsService.pay as jest.Mock).mockResolvedValue({ ...result, subscriptions: [sub('old',10,'paid',2025)] });
  await search(); await act(async () => hook.handleConfirmPayment());
  expect(onStudentUpdated.mock.calls.at(-1)![1]).toEqual(Array(12).fill(false));
});
test('zero amount is preserved and invalid amounts cannot be paid', async () => {
  expect(hook.resolveAmount({ ...sub('x',10),amount:0 } as any,student)).toBe(0);
  (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({ student, subscriptions: [{ ...sub('bad',10),discount:300 }] });
  await search(); await act(async () => hook.handleConfirmPayment());
  expect(SubscriptionsService.pay).not.toHaveBeenCalled(); expect(hook.flashMsg?.type).toBe('error');
});
test('conflict unlocks refresh and keeps the entered code', async () => {
  (SubscriptionsService.pay as jest.Mock).mockRejectedValue(Object.assign(new Error('تغيرت المستحقات'),{status:409}));
  await search(); await act(async () => hook.handleConfirmPayment());
  expect(hook.canClose()).toBe(true); expect(hook.manualCode).toBe('A'); expect(hook.flashMsg?.text).toContain('تغيرت');
});
test('closing while camera starts stops and clears it after start resolves', async () => {
  let finish!: () => void;
  mockStart.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  let starting!: Promise<void>, stopping!: Promise<void>;
  await act(async () => { starting = hook.startScanner(); });
  await act(async () => { stopping = hook.stopScanner(); });
  await act(async () => { finish(); await starting; await stopping; });
  expect(mockStop).toHaveBeenCalledTimes(1); expect(mockClear).toHaveBeenCalledTimes(1); expect(hook.scanning).toBe(false);
});
test('a second camera code cannot replace the student while review is open', async () => {
  await act(async () => hook.startScanner());
  const decoded = mockStart.mock.calls[0][2];
  await act(async () => decoded('A'));
  await act(async () => decoded('B'));
  expect(SubscriptionsService.lookupPaymentStudent).toHaveBeenCalledTimes(1);
  expect(hook.currentStudent?.id).toBe('A'); expect(SubscriptionsService.pay).not.toHaveBeenCalled();
});
async function automaticCamera(subscriptions: any[], suspended = false) {
  autoCamera = true;
  (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({student: {...student, is_suspended: suspended}, subscriptions});
  await act(async () => root.render(React.createElement(Harness)));
  await act(async () => hook.startScanner());
  return mockStart.mock.calls[0][2];
}
test('camera pays only the selected month automatically and ignores a held card', async () => {
  const decode = await automaticCamera([sub('oct',10)]);
  await act(async () => decode('A'));
  expect(SubscriptionsService.pay).toHaveBeenCalledWith('A',[{id:'oct',amount:200,discount:0}],expect.any(String),{month:10,year:2026});
  await act(async () => decode('A'));
  expect(SubscriptionsService.pay).toHaveBeenCalledTimes(1);
  expect(mockStop).not.toHaveBeenCalled();
});
test.each(['arrears','suspended','zero','paid'])('camera requires review or skips payment for %s', async reason => {
  const subscriptions = reason==='arrears' ? [sub('sept',9),sub('oct',10)] : [{...sub('oct',10,reason==='paid'?'paid':'due'),amount:reason==='zero'?0:200}];
  const decode=await automaticCamera(subscriptions,reason==='suspended');
  await act(async () => decode('A'));
  expect(SubscriptionsService.pay).not.toHaveBeenCalled();
});
test('manual input still requires confirmation when camera auto mode is enabled', async () => {
  await automaticCamera([sub('oct',10)]);
  await search();
  expect(SubscriptionsService.pay).not.toHaveBeenCalled();
});
test('a scanned QR displays the resolved student code rather than the QR payload', async () => {
  (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({student:{...student,code:'GROUP-012',center_student_code:'CENTER-009'},subscriptions:[sub('oct',10)]});
  await act(async () => hook.startScanner());
  await act(async () => mockStart.mock.calls[0][2]('https://example.invalid/student/permanent-id'));
  expect(hook.manualCode).toBe('CENTER-009');
  expect(SubscriptionsService.pay).not.toHaveBeenCalled();
});
test('success feedback expires in two seconds and can be dismissed immediately', async () => {
  await search(); await act(async () => hook.handleConfirmPayment());
  expect(hook.flashMsg?.type).toBe('success');
  await act(async () => jest.advanceTimersByTime(1999));
  expect(hook.flashMsg?.type).toBe('success');
  await act(async () => jest.advanceTimersByTime(1));
  expect(hook.flashMsg).toBeNull();
  await search(); await act(async () => hook.handleConfirmPayment());
  expect(hook.canDismissFeedback).toBe(true);
  await act(async () => hook.dismissFeedback());
  expect(hook.flashMsg).toBeNull(); expect(SubscriptionsService.pay).toHaveBeenCalledTimes(2);
});
test('next camera scan does not wait for success feedback and old timers cannot hide review', async () => {
  const decode=await automaticCamera([sub('oct',10)]);
  await act(async()=>decode('A'));
  expect(hook.flashMsg?.type).toBe('success');
  (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({student:{...student,id:'B',code:'B'},subscriptions:[sub('sept',9),sub('oct',10)]});
  await act(async()=>decode('B'));
  expect(SubscriptionsService.lookupPaymentStudent).toHaveBeenCalledTimes(2);
  expect(hook.currentStudent?.id).toBe('B');
  await act(async()=>jest.advanceTimersByTime(10000));
  expect(hook.flashMsg?.type).toBe('warn'); expect(hook.currentStudent?.id).toBe('B');
  expect(hook.canDismissFeedback).toBe(false);
  await act(async()=>hook.dismissFeedback());
  expect(hook.flashMsg?.type).toBe('warn');
});
test('uncertain payment feedback cannot expire or be dismissed', async () => {
  (SubscriptionsService.pay as jest.Mock).mockRejectedValue(new Error('offline'));
  await search(); await act(async()=>hook.handleConfirmPayment());
  await act(async()=>{jest.advanceTimersByTime(10000); hook.dismissFeedback();});
  expect(hook.uncertain).toBe(true); expect(hook.flashMsg?.type).toBe('error');
  expect(hook.canClose()).toBe(false); expect(hook.canDismissFeedback).toBe(false);
});
test('already settled information disappears without sending a payment', async()=>{
  (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockResolvedValue({student,subscriptions:[sub('oct',10,'paid')]});
  await search(); expect(hook.flashMsg?.type).toBe('warn');
  await act(async()=>jest.advanceTimersByTime(2000));
  expect(hook.flashMsg).toBeNull(); expect(SubscriptionsService.pay).not.toHaveBeenCalled();
});

test.each(['NotAllowedError','NotFoundError','NotReadableError','SecurityError'])('camera %s cleans up and allows another attempt without recording payment',async name=>{
  mockStart.mockRejectedValueOnce(new DOMException('camera startup failed',name));
  await act(async()=>hook.startScanner());
  expect(hook.scanning).toBe(false);expect(hook.isStarting).toBe(false);expect(hook.flashMsg?.type).toBe('error');
  expect(mockClear).toHaveBeenCalledTimes(1);expect(SubscriptionsService.pay).not.toHaveBeenCalled();
  await act(async()=>hook.startScanner());
  expect(mockStart).toHaveBeenCalledTimes(2);expect(hook.scanning).toBe(true);
});
test('double camera start creates only one stream and stop releases it',async()=>{
  await act(async()=>{await Promise.all([hook.startScanner(),hook.startScanner()]);});
  expect(mockStart).toHaveBeenCalledTimes(1);
  await act(async()=>hook.stopScanner());
  expect(mockStop).toHaveBeenCalledTimes(1);expect(mockClear).toHaveBeenCalledTimes(1);expect(hook.scanning).toBe(false);
});
test('an unknown scanned code never pays and does not block the next valid student',async()=>{
  const decode=await automaticCamera([sub('oct',10)]);
  (SubscriptionsService.lookupPaymentStudent as jest.Mock).mockRejectedValueOnce(Object.assign(new Error('الطالب غير موجود'),{status:404}));
  await act(async()=>decode('unknown-qa-code'));
  expect(SubscriptionsService.pay).not.toHaveBeenCalled();expect(hook.flashMsg?.type).toBe('error');
  await act(async()=>decode('A'));
  expect(SubscriptionsService.pay).toHaveBeenCalledTimes(1);
});
