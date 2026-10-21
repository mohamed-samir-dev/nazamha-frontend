import QRCode from "qrcode";

export interface StudentQRExportRow { name: string; code: string; grade: string; group: string; qrValue: string }

type Relation = string | {id?: string; _id?: string; name?: string} | null | undefined;
type NamedRecord = {id?: string; _id?: string; name: string; grade_id?: Relation};
const relationId = (value: Relation) => typeof value === "string" ? value : value?.id || value?._id || "";
export function resolveStudentQRLabels(student: {grade_id?: Relation; group_id?: Relation}, grades: NamedRecord[], groups: NamedRecord[]) {
  const groupId = relationId(student.group_id);
  const group = groups.find(item => relationId(item) === groupId);
  const gradeId = relationId(student.grade_id) || relationId(group?.grade_id);
  const grade = grades.find(item => relationId(item) === gradeId);
  const gradeName = grade?.name || (typeof student.grade_id === "object" ? student.grade_id?.name : "");
  const groupName = group?.name || (typeof student.group_id === "object" ? student.group_id?.name : "");
  if ((gradeId && !gradeName) || (groupId && !groupName)) throw new Error("تعذر تحديد اسم السنة أو المجموعة لبعض الطلاب. أعد تحميل البيانات وحاول التصدير مرة أخرى.");
  return {grade: gradeName || "غير محددة", group: groupName || "بدون مجموعة"};
}

/** Real embedded PNG images: the workbook does not depend on external URLs. */
export async function buildStudentQRWorkbook(rows: StudentQRExportRow[]) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("الطلاب", { views: [{rightToLeft: true, state: "frozen", ySplit: 1}], pageSetup: {orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0} });
  sheet.columns = [
    {header: "الاسم", key: "name", width: 30}, {header: "الكود", key: "code", width: 18},
    {header: "السنة الدراسية", key: "grade", width: 24}, {header: "المجموعة", key: "group", width: 25},
    {header: "QR الطالب", key: "qr", width: 22},
  ];
  sheet.getRow(1).height = 30;
  sheet.getRow(1).eachCell(cell => {cell.font = {bold: true, color: {argb: "FFFFFFFF"}, name: "Arial", size: 12}; cell.fill = {type: "pattern", pattern: "solid", fgColor: {argb: "FF0F766E"}};});
  for (let i = 0; i < rows.length; i++) {
    const item = rows[i];
    const row = sheet.addRow({name: item.name, code: item.code, grade: item.grade, group: item.group});
    row.height = 108;
    row.eachCell(cell => {cell.numFmt = "@"; cell.alignment = {vertical: "middle", horizontal: "center", wrapText: true}; cell.font = {name: "Arial", size: 12};});
    const base64 = await QRCode.toDataURL(item.qrValue, {width: 256, margin: 4, errorCorrectionLevel: "M"});
    const imageId = workbook.addImage({base64, extension: "png"});
    sheet.addImage(imageId, {tl: {col: 4.15, row: i + 1.08}, ext: {width: 128, height: 128}, editAs: "oneCell"});
    if (i % 25 === 24) await new Promise(resolve => setTimeout(resolve, 0));
  }
  sheet.autoFilter = "A1:E1";
  sheet.pageSetup.printTitlesRow = "1:1";
  return workbook.xlsx.writeBuffer();
}
