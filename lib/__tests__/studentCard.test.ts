/** @jest-environment jsdom */
import {getStudentQRValue,parseQRText,findStudentByQR,getStudentScanParams} from "../utils/qrParser";
const student={id:"111111111111111111111111",code:"GROUP-0001",card_qr_token:"a".repeat(64)};
test("profile, printed QR and Excel use a stable browser-openable parent report link",()=>{
  const value=getStudentQRValue(student),url=new URL(value);
  expect(url.pathname).toBe(`/report/${student.id}`);expect(url.searchParams.get("card")).toBe(student.card_qr_token);
  expect(getStudentQRValue({...student,code:"NEW-009"})).toBe(value);
  expect(parseQRText(value)).toEqual({type:"legacy",value:student.id});
  expect(findStudentByQR([student],value)?.id).toBe(student.id);
  expect(getStudentScanParams(value)).toEqual({student_id:student.id});
});
test("center cards preserve shared identity for attendance, payment and books",()=>{
  const value=getStudentQRValue({...student,center_student_code:"CTR-0001"});
  expect(parseQRText(value)).toEqual({type:"center",value:"CTR-0001"});
  expect(findStudentByQR([{...student,id:"other-enrollment",center_student_code:"CTR-0001"}],value)?.id).toBe("other-enrollment");
  expect(getStudentScanParams(value)).toEqual({student_code:"/report/c/CTR-0001"});
});
test.each([student.id,`/report/${student.id}?token=old`,"GROUP-0001"])("old printed cards remain accepted: %s",value=>{
  expect(findStudentByQR([student],value)?.id).toBe(student.id);
});
