import DOMPurify from "dompurify";
/** Sanitize at the final sink, after interpolating all user-controlled text. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { WHOLE_DOCUMENT: true, FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "base"], FORBID_ATTR: ["srcdoc"], ADD_TAGS: ["style"] });
}
