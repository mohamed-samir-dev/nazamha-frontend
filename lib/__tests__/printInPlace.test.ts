/** @jest-environment jsdom */
import { preparePrintInPlace } from '../printInPlace';

test('prepares without printing and keeps the document until afterprint', async () => {
  const prepared = preparePrintInPlace({ html: '<html><body><table><tr><td>Test</td></tr></table></body></html>' });
  const frame = document.querySelector('iframe')!;
  const child = frame.contentWindow!;
  child.focus = jest.fn();
  let printedCall!: () => void;
  const printCalled = new Promise<void>(resolve => { printedCall = resolve; });
  child.print = jest.fn(printedCall);
  frame.dispatchEvent(new Event('load'));
  expect(child.print).not.toHaveBeenCalled();
  const printed = prepared.print();
  await printCalled;
  expect(child.print).toHaveBeenCalledTimes(1);
  expect(frame.isConnected).toBe(true);
  child.dispatchEvent(new Event('afterprint'));
  await printed;
  expect(frame.isConnected).toBe(false);
});

test('disposing an unfinished preload does not leave printing blocked', async () => {
  const prepared = preparePrintInPlace({ url: '/report/test', readySelector: '.report-sheet' });
  prepared.dispose();
  await expect(prepared.print()).rejects.toThrow();
  expect(document.querySelector('iframe')).toBeNull();
});

test('missing afterprint does not block this or subsequent printing', async () => {
  const first = preparePrintInPlace({ html: '<p>First</p>' });
  const frame = document.querySelector('iframe')!;
  frame.contentWindow!.focus = jest.fn();
  frame.contentWindow!.print = jest.fn();
  frame.dispatchEvent(new Event('load'));
  await first.print();
  expect(frame.isConnected).toBe(true);
  const second = preparePrintInPlace({ html: '<p>Second</p>' });
  const next = document.querySelectorAll('iframe')[1];
  next.contentWindow!.focus = jest.fn();
  next.contentWindow!.print = jest.fn();
  next.dispatchEvent(new Event('load'));
  await second.print();
  expect(frame.isConnected).toBe(false);
  expect(next.contentWindow!.print).toHaveBeenCalledTimes(1);
  second.dispose();
});

test('a Next route announcer is not a report error', async () => {
  const prepared = preparePrintInPlace({ url: '/report/test', readySelector: '.report-sheet' });
  const frame = document.querySelector('iframe')!;
  const html = frame.contentDocument!.createElement('html');
  html.appendChild(frame.contentDocument!.createElement('body'));
  frame.contentDocument!.appendChild(html);
  frame.contentDocument!.body.innerHTML = '<div role="alert">صفحة التقرير</div><main class="report-sheet">Ready</main>';
  frame.contentWindow!.focus = jest.fn();
  frame.contentWindow!.print = jest.fn();
  frame.dispatchEvent(new Event('load'));
  await prepared.print();
  expect(frame.contentWindow!.print).toHaveBeenCalledTimes(1);
  prepared.dispose();
});
