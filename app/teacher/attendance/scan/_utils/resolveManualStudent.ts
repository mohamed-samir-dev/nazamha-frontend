import type {Student,Group} from "@/lib/types";
import {codeText} from "@/lib/utils/studentSearch";
import {parseQRText} from "@/lib/utils/qrParser";

/** Never pick the first identity when a code is shared or normalizes to another code. */
export function resolveManualStudent(students:Student[],raw:string,group:Group):Student|undefined {
  const parsed=parseQRText(raw),value=codeText(parsed.value);
  const identities=students.filter(s=>codeText(s.id)===value || (!!s.center_student_code && codeText(s.center_student_code)===value));
  if(identities.length>1) throw new Error("الكود يطابق أكثر من طالب؛ استخدم QR الطالب أو كوده الكامل الفريد");
  if(identities.length===1) return identities[0];
  if(parsed.type==="center" || /\/report\//.test(raw)) return undefined;
  const full=group.code ? codeText(`${group.code}-${raw.trim()}`) : value;
  const exact=students.filter(s=>s.code && [value,full].includes(codeText(s.code)));
  if(exact.length>1) throw new Error("الكود مكرر؛ استخدم QR الطالب أو كوده الكامل الفريد");
  if(exact.length===1) return exact[0];
  if(!/^\d+$/.test(value)) return undefined;
  const short=students.filter(s=>s.group_id===group.id && s.code && Number(codeText(s.code).split("-").at(-1))===Number(value));
  if(short.length>1) throw new Error("الكود المختصر يطابق أكثر من طالب؛ اكتب الكود كاملًا");
  return short[0];
}
