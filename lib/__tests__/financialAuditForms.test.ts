/** @jest-environment jsdom */
import React, { act, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { DiscountModal } from "@/app/teacher/siblings/components/DiscountModal";
import { parseCSV } from "@/app/teacher/students/_components/BulkImportModal";
import { canSaveFamilyDiscount, validateFamilyDiscount } from "@/lib/utils/familyDiscount";

test.each([['50','101'], ['-1','20'], ['Infinity','20'], ['NaN','20'], ['',''], ['0','0']])('cannot save invalid/empty discount pair %s / %s', (sub, books) => {
  expect(canSaveFamilyDiscount(sub, books)).toBe(false);
});
test.each([['50',''], ['0','20'], ['','100'], ['0.5','0']])('accepts valid discount pair %s / %s', (sub, books) => {
  expect(canSaveFamilyDiscount(sub, books)).toBe(true);
});
test('zero is valid but a pair needs at least one positive discount', () => { expect(validateFamilyDiscount('0')).toBe(''); expect(validateFamilyDiscount('101')).not.toBe(''); });

test('CSV validates the same name rules before upload and identifies source row numbers', () => {
  const rows = parseCSV('name,grade,group,phone,month,year\n123,,,,10,2026\nAudit Import Valid,,,,10,2026\nSingle,,,,10,2026\nأحمد محمد,,,,10,2026', [], [], 10, 2026);
  expect(rows.filter(r => !r._error).map(r => r.name)).toEqual(['Audit Import Valid', 'أحمد محمد']);
  expect(rows[0]._error).toContain('الصف 2:'); expect(rows[2]._error).toContain('الصف 4:');
});
test('CSV quoted names and validation of later rows survive the first-five preview boundary', () => {
  const rows = parseCSV(['name,grade,group,phone,month,year', ...Array(6).fill('Valid Name,,,,10,2026'), 'Wrong,,,,13,2026'].join('\n'), [], [], 10, 2026);
  expect(rows[6]._error).toContain('الصف 8:'); expect(rows.filter(r => !r._error)).toHaveLength(6);
});

let root: Root, host: HTMLDivElement, opener: HTMLButtonElement;
const base = { discountModal: {familyId:'qa', familyName:'عائلة اختبار', currentPercent:10, currentReason:'', currentBookPercent:null, currentBookReason:''}, discountPercent:'10', discountReason:'', bookDiscountPercent:'', bookDiscountReason:'', discountLoading:false, setDiscountModal:jest.fn(), setDiscountPercent:jest.fn(), setDiscountReason:jest.fn(), setBookDiscountPercent:jest.fn(), setBookDiscountReason:jest.fn(), handleSaveDiscount:jest.fn(), handleRemoveDiscount:jest.fn() };
beforeEach(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; host=document.createElement('div'); opener=document.createElement('button'); document.body.append(opener,host); opener.focus(); root=createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); opener.remove(); });

test('family discount dialog names its inputs, traps keyboard focus, closes on Escape and restores focus', async () => {
  function Harness() { const [open,setOpen]=useState(true); return open ? React.createElement(DiscountModal,{...base,setDiscountModal:()=>setOpen(false)}) : null; }
  await act(async () => root.render(React.createElement(Harness)));
  const dialog=host.querySelector('[role="dialog"]')!;
  expect(dialog.getAttribute('aria-modal')).toBe('true');
  for(const input of Array.from(host.querySelectorAll('input'))) expect(host.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
  const close=host.querySelector('button[aria-label="إغلاق"]')!; expect(document.activeElement).toBe(close);
  await act(async () => close.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true})));
  expect(document.activeElement?.textContent).toContain('حفظ');
  await act(async () => document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  expect(host.querySelector('[role="dialog"]')).toBeNull(); expect(document.activeElement).toBe(opener);
});
test('a valid subscription percentage cannot enable save while the book percentage is invalid', async () => {
  await act(async () => root.render(React.createElement(DiscountModal,{...base,bookDiscountPercent:'120'})));
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('0 و100');
  expect(Array.from(host.querySelectorAll('button')).find(button=>button.textContent?.includes('حفظ'))?.disabled).toBe(true);
  expect(host.querySelector('input[aria-invalid="true"]')).not.toBeNull();
});
test('discount controls and closing remain locked while saving', async () => {
  await act(async () => root.render(React.createElement(DiscountModal,{...base,discountLoading:true})));
  expect(host.querySelector('fieldset')?.disabled).toBe(true); expect((host.querySelector('button[aria-label="إغلاق"]') as HTMLButtonElement).disabled).toBe(true);
});
