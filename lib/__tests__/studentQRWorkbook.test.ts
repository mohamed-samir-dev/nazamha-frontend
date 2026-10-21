/** @jest-environment node */
import { Workbook } from "exceljs";
import { buildStudentQRWorkbook } from "../exportStudentQRWorkbook";

test("Excel export embeds a PNG for every student and preserves text data", async () => {
  const rows = [
    {name: "طالب اختبار", code: "0012", grade: "الأولى", group: "أ", qrValue: "student-permanent-id-1"},
    {name: "=1+1", code: "0023", grade: "الثانية", group: "ب", qrValue: "student-permanent-id-2"},
  ];
  const buffer = await buildStudentQRWorkbook(rows);
  const restored = new Workbook();
  await restored.xlsx.load(buffer);
  const sheet = restored.getWorksheet("الطلاب")!;
  expect(sheet.rowCount).toBe(3);
  expect(sheet.getCell("B2").value).toBe("0012");
  expect(sheet.getCell("A3").value).toBe("=1+1");
  expect(sheet.getImages()).toHaveLength(2);
  for (const image of sheet.getImages()) {
    const media = restored.getImage(Number(image.imageId));
    expect(media.extension).toBe("png");
    expect(media.buffer?.byteLength).toBeGreaterThan(100);
  }
  expect(sheet.views[0].rightToLeft).toBe(true);
});
