/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { StudentTableRow } from '@/components/features/StudentTableRow';
import { SubscriptionsService } from '@/lib/services/subscriptionsService';
jest.mock('@/lib/services/subscriptionsService', () => ({ SubscriptionsService: { updateSubscription: jest.fn() } }));
jest.mock('@/components/features/SuspendModal', () => ({ SuspendModal: () => null }));

test.each([false, true])('rapid month edits preserve other months when earlier request fails=%s', async (failFirst) => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const requests: { resolve: (value: any) => void; reject: (error: Error) => void }[] = [];
  (SubscriptionsService.updateSubscription as jest.Mock).mockImplementation(() => new Promise((resolve, reject) => requests.push({ resolve, reject })));
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const onSubsChanged = jest.fn();
  await act(async () => root.render(React.createElement('table', null, React.createElement('tbody', null, React.createElement(StudentTableRow, {
    student: { id: 'student', name: 'Test' } as any,
    groups: [], grades: [], teacherBooks: [], isSelected: false,
    onToggleSelect: jest.fn(), onDelete: jest.fn(), onUpdateGroup: jest.fn(), onSubsChanged,
    subsOverride: [1, 2].map(month => ({ id: String(month), student_id: 'student', month, year: 2026, status: 'due' } as any)),
  })))));
  const month = (n: number) => host.querySelector<HTMLButtonElement>(`button[aria-label^="${n}/2026"]`)!;
  await act(async () => { month(1).click(); month(2).click(); });
  expect(month(1).disabled).toBe(true);
  expect(month(2).disabled).toBe(true);
  await act(async () => requests[1].resolve({ status: 'paid' }));
  await act(async () => failFirst ? requests[0].reject(new Error('offline')) : requests[0].resolve({ status: 'paid' }));
  const result = onSubsChanged.mock.calls.at(-1)![1];
  expect(result.map((sub: any) => sub.status)).toEqual([failFirst ? 'due' : 'paid', 'paid']);
  expect(month(1).disabled).toBe(false);
  expect(month(2).disabled).toBe(false);
  await act(async () => root.unmount());
  host.remove();
  errors.mockRestore();
});
