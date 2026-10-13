 /**
 * Centralized error message handling.
 *
 * All user-visible error strings must be Arabic.
 * This utility ensures raw English HTTP noise (status text, browser
 * messages, stack traces, etc.) never reaches the UI.
 */

/** Default fallback shown when no specific message is available. */
export const DEFAULT_ERROR = "حدث خطأ أثناء تنفيذ العملية. يرجى المحاولة مرة أخرى.";

/** Message shown when the network is unreachable. */
export const NETWORK_ERROR = "تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.";

/** Message shown on 403 Forbidden. */
export const FORBIDDEN_ERROR = "ليس لديك الصلاحية اللازمة لتنفيذ هذا الإجراء.";

/** Message shown on 404 Not Found. */
export const NOT_FOUND_ERROR = "البيانات المطلوبة غير موجودة.";

/** Message shown on 429 Too Many Requests. */
export const RATE_LIMIT_ERROR = "تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.";

/** Message shown on 409 Conflict (generic). */
export const CONFLICT_ERROR = "تعارض في البيانات. يرجى التحقق والمحاولة مرة أخرى.";

/** Message shown on login failure. */
export const LOGIN_ERROR = "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات والمحاولة مرة أخرى.";

/** Message shown when the camera cannot be started. */
export const CAMERA_ERROR = "تعذّر تشغيل الكاميرا. تأكد من منح الإذن وحاول مرة أخرى.";

/**
 * Returns a safe Arabic message for a caught error.
 *
 * - If the error already carries an Arabic message (from apiClient.ts or
 *   backend validation), it is returned as-is.
 * - If the error is a network failure (fetch failed / no internet), returns
 *   NETWORK_ERROR.
 * - All other cases return `fallback` (defaults to DEFAULT_ERROR).
 *
 * Never pass `err.message` directly to the UI — always go through here.
 */
export function getErrorMessage(
  err: unknown,
  fallback = DEFAULT_ERROR
): string {
  if (!(err instanceof Error)) return fallback;

  const msg = err.message ?? "";

  // Network failures from the browser fetch API — these are always English
  if (
    msg === "Failed to fetch" ||
    msg === "Network Error" ||
    msg === "Load failed" ||
    msg.toLowerCase().includes("failed to fetch") ||
    msg.toLowerCase().includes("networkerror") ||
    msg.toLowerCase().includes("network request failed") ||
    msg.toLowerCase().includes("connection refused")
  ) {
    return NETWORK_ERROR;
  }

  // If the message contains Arabic text it came from the backend or from
  // apiClient.ts after sanitization — safe to show.
  if (/[\u0600-\u06FF]/.test(msg)) return msg;

  // Everything else (English HTTP noise, stack fragments, etc.) → fallback
  return fallback;
}

/**
 * Specialized version for login screens.
 * Maps all auth failures to a single safe Arabic message to prevent
 * user enumeration (do not reveal whether email or password is wrong).
 */
export function getLoginErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return LOGIN_ERROR;

  const msg = err.message ?? "";

  // Network issue
  if (
    msg === "Failed to fetch" ||
    msg.toLowerCase().includes("failed to fetch") ||
    msg.toLowerCase().includes("network")
  ) {
    return NETWORK_ERROR;
  }

  // Any Arabic message from the backend that is login-specific and safe to show
  if (/[\u0600-\u06FF]/.test(msg)) return msg;

  // Default: do not reveal which field is wrong
  return LOGIN_ERROR;
}

/**
 * Specialized version for camera (QR scanner) errors.
 * Browser camera API errors are always English — map them to Arabic.
 */
export function getCameraErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // "لا توجد كاميرا" is already Arabic — from our own throw inside scan hooks
    if (/[\u0600-\u06FF]/.test(err.message)) return err.message;
  }
  return CAMERA_ERROR;
}
