import { parseCsv } from "../parseCsv";
test("CSV supports commas, escaped quotes, BOM and CRLF", () => {
  expect(parseCsv('\uFEFFname,group\r\n"أحمد, علي","مجموعة ""أ"""\r\n')).toEqual([
    ['name', 'group'], ['أحمد, علي', 'مجموعة "أ"'],
  ]);
});
test("CSV supports embedded newlines and skips empty rows", () => {
  expect(parseCsv('"first\nlast",1\n\n')).toEqual([['first\nlast', '1']]);
});
test("CSV rejects incomplete quotes", () => expect(() => parseCsv('"missing,1')).toThrow());
