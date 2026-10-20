import { sanitizeHtml } from "./sanitizeHtml";

let currentCleanup: (() => void) | undefined;
let preparing = false;

/** Print an isolated document while keeping the teacher on the current page. */
export function preparePrintInPlace(source: { html: string } | { url: string; readySelector: string }) {
  const frame = document.createElement("iframe");
  frame.title = "مستند الطباعة";
  frame.dataset.printFrame = "true";
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  // Keep it rendered: display:none can produce blank output in some browsers.
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;pointer-events:none";
  let timer: ReturnType<typeof setTimeout> | undefined;
  let observer: MutationObserver | undefined;
  let cancelReady: ((error: Error) => void) | undefined;
  let removePrintListener: (() => void) | undefined;
  const cleanup = () => {
    if (timer) clearTimeout(timer);
    observer?.disconnect();
    frame.remove();
    cancelReady?.(new Error("تم إلغاء تجهيز الطباعة."));
    cancelReady = undefined;
    removePrintListener?.();
    if (currentCleanup === cleanup) currentCleanup = undefined;
  };
  const ready = (async () => {
  try {
    await new Promise<void>((resolve, reject) => {
      cancelReady = reject;
      timer = setTimeout(() => reject(new Error("تعذر تجهيز مستند الطباعة. حاول مرة أخرى.")), 45000);
      frame.onerror = () => reject(new Error("تعذر تحميل مستند الطباعة."));
      frame.onload = () => {
        const doc = frame.contentDocument;
        if (!doc) { reject(new Error("تعذر الوصول إلى مستند الطباعة.")); return; }
        const checkReady = () => {
          if ("url" in source && doc.querySelector('.report-state[role="alert"]')?.textContent?.trim()) {
            reject(new Error("تعذر تحميل بيانات التقرير للطباعة.")); return;
          }
          if ("html" in source || doc.querySelector(source.readySelector)) {
            if (timer) clearTimeout(timer);
            observer?.disconnect();
            cancelReady = undefined;
            resolve();
          }
        };
        observer = new MutationObserver(checkReady);
        observer.observe(doc, { childList: true, subtree: true });
        checkReady();
      };
      if ("html" in source) frame.srcdoc = sanitizeHtml(source.html);
      else {
        const url = new URL(source.url, window.location.href);
        if (url.origin !== window.location.origin) { reject(new Error("رابط الطباعة غير متاح.")); return; }
        // The parent controls printing after the report has loaded.
        url.searchParams.delete("print");
        frame.src = url.toString();
      }
      document.body.appendChild(frame);
    });
    const printWindow = frame.contentWindow;
    if (!printWindow) throw new Error("تعذر فتح نافذة الطباعة.");
    if ("html" in source) {
      // مستند HTML محلي بنصوص قياسية — لا يحتاج انتظار خطوط خارجية
      await new Promise(resolve => setTimeout(resolve, 50));
    } else {
      await Promise.race([
        frame.contentDocument?.fonts?.ready ?? Promise.resolve(),
        new Promise(resolve => setTimeout(resolve, 500)),
      ]);
    }
  } catch (error) {
    cleanup();
    throw error;
  }
  })();
  // Preloading may fail before the user clicks. The awaited print still reports it.
  void ready.catch(() => {});
  return {
    dispose: cleanup,
    async print() {
      if (preparing) return;
      preparing = true;
      currentCleanup?.();
      currentCleanup = cleanup;
      try {
        await ready;
        const printWindow = frame.contentWindow;
        if (!printWindow) throw new Error("تعذر فتح نافذة الطباعة.");
        printWindow.addEventListener("afterprint", cleanup, { once: true });
        removePrintListener = () => printWindow.removeEventListener("afterprint", cleanup);
        printWindow.focus();
        printWindow.print();
        // Some embedded browsers never emit afterprint. Do not leave the UI or
        // every later print locked waiting for that event. Keep the document
        // alive for asynchronous print dialogs; afterprint or the next print
        // disposes it, rather than removing it on an arbitrary timer.
      } catch (error) {
        cleanup();
        throw error;
      } finally {
        preparing = false;
      }
    },
  };
}

export async function printInPlace(source: { html: string } | { url: string; readySelector: string }): Promise<void> {
  if (preparing) return;
  await preparePrintInPlace(source).print();
}
