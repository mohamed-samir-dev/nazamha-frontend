/** @jest-environment node */
import { Workbook } from "exceljs";
import { buildStudentQRWorkbook, resolveStudentQRLabels } from "../exportStudentQRWorkbook";

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
  expect(sheet.getCell("C2").value).toBe("الأولى");
  expect(sheet.getCell("D2").value).toBe("أ");
  expect(sheet.getImages()).toHaveLength(2);
  for (const image of sheet.getImages()) {
    const media = restored.getImage(Number(image.imageId));
    expect(media.extension).toBe("png");
    expect(media.buffer?.byteLength).toBeGreaterThan(100);
  }
  expect(sheet.views[0].rightToLeft).toBe(true);
});
test("labels resolve both API id variants and a populated relation", () => {
  expect(resolveStudentQRLabels({grade_id:"year",group_id:"group"}, [{_id:"year",name:"الأولى"}], [{id:"group",name:"مجموعة أ"}])).toEqual({grade:"الأولى",group:"مجموعة أ"});
  expect(resolveStudentQRLabels({group_id:"group"}, [{id:"year",name:"الثانية"}], [{_id:"group",name:"ب",grade_id:"year"}])).toEqual({grade:"الثانية",group:"ب"});
  expect(resolveStudentQRLabels({grade_id:{_id:"year",name:"الأولى"},group_id:null},[],[])).toEqual({grade:"الأولى",group:"بدون مجموعة"});
  expect(() => resolveStudentQRLabels({grade_id:"missing"},[],[])).toThrow("تعذر تحديد");
});
