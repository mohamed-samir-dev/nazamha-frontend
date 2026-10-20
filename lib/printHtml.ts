import { sanitizeHtml } from "./sanitizeHtml";
import { printInPlace } from "./printInPlace";
/**
 * printHtml — يفتح HTML في تاب جديد بدون popup blocking على الموبايل
 * بيستخدم Blob URL بدل window.open("", "_blank")
 */
export function printHtml(html: string, options?: { inPlace?: boolean }): void {
  if (options?.inPlace) {
    void printInPlace({ html }).catch(error => window.alert(error instanceof Error ? error.message : "تعذر تجهيز الطباعة."));
    return;
  }
  const blob = new Blob([sanitizeHtml(html), '<script>document.addEventListener("click",function(e){if(e.target.closest(".print-btn,.mobile-print-btn"))window.print()});window.addEventListener("load",function(){setTimeout(function(){window.print()},300)})<\/script>'], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
