import { appCache } from "@/lib/appCache";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ENABLE_LOGS = process.env.NEXT_PUBLIC_ENABLE_API_LOGS === 'true';

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let csrfToken: string | null = null;
let pendingCsrf: Promise<string> | null = null;
async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  try { return await fetch(url, options); }
  catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.");
  }
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (pendingCsrf) return pendingCsrf;
  pendingCsrf = (async () => {
    const res = await apiFetch(`${BASE_URL.replace(/\/api$/, "")}/api/csrf-token`, { credentials: "include" });
    if (!res.ok) throw new Error("تعذر تجهيز الاتصال الآمن بالخادم.");
    const data = await res.json();
    csrfToken = data.csrfToken;
    return csrfToken!;
  })().finally(() => { pendingCsrf = null; });
  return pendingCsrf;
}

/**
 * Single-flight guard for auth failure recovery.
 * Prevents a storm of simultaneous 401 responses from each
 * triggering a separate redirect/logout flow.
 *
 * When the first 401 is received, isHandlingAuthFailure is set to true.
 * Every subsequent 401 before the redirect completes is a no-op.
 */
let isHandlingAuthFailure = false;

function handleAuthFailure(currentPath: string): void {
  if (isHandlingAuthFailure) return;
  isHandlingAuthFailure = true;

  const isAdminPage = currentPath.startsWith("/admin");
  const isCenterPage = currentPath.startsWith("/center");

  // Small delay so in-flight state updates finish before navigation
  setTimeout(() => {
    if (isAdminPage) {
      window.location.href = "/admin/login";
    } else if (isCenterPage) {
      window.location.href = "/center/login";
    } else {
      window.location.href = "/teacher/login";
    }
    // Reset after navigation (relevant for SPA back-navigation scenarios)
    isHandlingAuthFailure = false;
  }, 50);
}

/** Call this after a successful login to reset the guard */
export function resetAuthFailureGuard(): void {
  isHandlingAuthFailure = false;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const logEnabled=ENABLE_LOGS&&!/^\/(?:attendance|students)(?:[/?]|$)/.test(path);
  const generation = appCache.generation();
  const method = (options.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(MUTATING.has(method) ? { "Idempotency-Key": crypto.randomUUID() } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (MUTATING.has(method)) {
    try {
      headers["x-csrf-token"] = await getCsrfToken();
    } catch {
      // non-fatal: server will reject if CSRF is required
    }
  }

  const isAuthMe = path === "/auth/me";
  const cachePolicy: RequestCache = (MUTATING.has(method) || isAuthMe) ? "no-store" : "default";

  if (logEnabled) {
    console.log(`📡 API ${method} ${path}`, options.body ? JSON.parse(options.body as string) : '');
  }

  const ensureCurrentAccount = () => { if (generation !== appCache.generation()) throw new Error("تم تغيير الحساب؛ تجاهل الاستجابة القديمة"); };
  const invalidateMutation = () => {
    ensureCurrentAccount();
    if (MUTATING.has(method)) { readRevision++; pendingReads.clear(); }
    if (MUTATING.has(method) && !path.startsWith("/auth/")) {
      const resource = path.split("/")[1]?.split("?")[0];
      if (typeof window !== "undefined" && ["students", "groups", "teachers"].includes(resource)) {
        try { localStorage.setItem("students-data-revision", `${Date.now()}:${Math.random()}`); } catch { /* Storage may be unavailable. */ }
      }
      const namespaces: Record<string, string[]> = {
        students: ["students:", "subscriptions:"], groups: ["groups:", "students:", "subscriptions:"],
        grades: ["grades:"], subscriptions: ["subscriptions:", "students:"], bills: ["bills:"],
        exams: ["examGrades:"], teachers: ["teacher:", "subscriptions:"],
        attendance: ["allTimeAttendanceMap:"],
      };
      for (const prefix of namespaces[resource] || []) appCache.invalidatePrefix(prefix);
      if (typeof window !== "undefined" && ["students", "groups", "grades", "subscriptions", "bills", "books", "salaries", "teacher-expenses", "attendance", "teachers"].includes(resource)) {
        window.dispatchEvent(new Event("financial-data-changed"));
      }
    }
  };
  const send = () => apiFetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: cachePolicy,
  });
  // These endpoints persist an idempotency receipt in the same transaction.
  // Reuse its key if a response is lost; never create a second student on retry.
  const retrySafeStudentWrite = (method === "POST" && path === "/students") ||
    (method === "PATCH" && /^\/students\/[a-f\d]{24}$/i.test(path));
  let res: Response;
  let retried = false;
  try {
    res = await send();
  } catch (error) {
    if (!retrySafeStudentWrite) throw error;
    ensureCurrentAccount();
    await new Promise(resolve => setTimeout(resolve, 300));
    retried = true;
    res = await send();
  }
  if (retrySafeStudentWrite && !retried && [502, 503, 504].includes(res.status)) {
    ensureCurrentAccount();
    res = await send();
  }

  if (logEnabled) {
    console.log(`📥 API Response ${method} ${path}:`, res.status, res.statusText);
  }

  ensureCurrentAccount();
  if (!res.ok) {
    // CSRF token expired or invalid — clear cache and retry once
    const forbiddenBody = res.status === 403 ? await res.clone().json().catch(() => ({})) : null;
    if (res.status === 403 && forbiddenBody?.error_code === "EBADCSRFTOKEN" && MUTATING.has(method)) {
      csrfToken = null;
      const retryHeaders = { ...headers, "x-csrf-token": await getCsrfToken().catch(() => "") };
      const retry = await apiFetch(`${BASE_URL}${path}`, { ...options, headers: retryHeaders, credentials: "include", cache: "no-store" });
      ensureCurrentAccount();
      if (retry.ok) {
        invalidateMutation();
        if (retry.status === 204 || retry.status === 304) return undefined as T;
        const data = await retry.json();
        ensureCurrentAccount();
        if (logEnabled) {
          console.log(`📦 API Data (retry):`, data);
        }
        return data;
      }
      // retry also failed — fall through using the retry response for error extraction
      const retryRawText = await retry.text().catch(() => "");
      let retryErr: Record<string, unknown> = {};
      try { retryErr = retryRawText ? JSON.parse(retryRawText) : {}; } catch {
        if (logEnabled) {
          console.error(`❌ API Error ${method} ${path} (retry): non-JSON response (${retry.status}):`, retryRawText.slice(0, 500));
        }
      }
      const retryMsg = (retryErr.message as string | undefined);
      const retryIsArabic = retryMsg ? /[\u0600-\u06FF]/.test(retryMsg) : false;
      const retryError:Error & {status?:number;error_code?:unknown} = new Error(retryIsArabic ? retryMsg! : "حدث خطأ أثناء تنفيذ العملية. يرجى المحاولة مرة أخرى.");
      retryError.status = retry.status;
      if (retryErr.error_code) retryError.error_code = retryErr.error_code;
      throw retryError;
    }
    if (res.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isLoginPage =
        currentPath === "/admin/login" ||
        currentPath === "/teacher/login" ||
        currentPath === "/center/login";

      if (!isLoginPage) {
        const isTeacherPage = currentPath.startsWith("/teacher");

        if (isTeacherPage) {
          // Teacher pages: throw so the layout's catch block handles cleanup
          // (clears caches, then redirects) — avoids double redirect
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const error = new Error("no-auth") as any;
          error.status = 401;
          throw error;
        }

        // Admin/Center pages: use dedup guard then hard-redirect
        handleAuthFailure(currentPath);
        return undefined as T;
      }
    }

    const rawText = await res.text().catch(() => "");
    let err: Record<string, unknown> = {};
    try { err = rawText ? JSON.parse(rawText) : {}; } catch {
      if (logEnabled) {
        console.error(`❌ API Error ${method} ${path}: non-JSON response (${res.status}):`, rawText.slice(0, 500));
      }
    }
    if (Object.keys(err).length > 0 && logEnabled) {
      console.error(`❌ API Error ${method} ${path}:`, err);
    }
    const rawMsg: string | undefined = (err as Record<string, unknown>).message as string | undefined;
    // Only forward Arabic / app-defined messages to callers.
    // English HTTP status text (e.g. "Not Found", "Internal Server Error",
    // "Bad Request") and the native "Request failed" fallback must never
    // reach the UI as-is — map them to a generic Arabic string.
    const isArabic = rawMsg ? /[\u0600-\u06FF]/.test(rawMsg) : false;
    const message = isArabic ? rawMsg! : "حدث خطأ أثناء تنفيذ العملية. يرجى المحاولة مرة أخرى.";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = new Error(message) as any;
    error.status = res.status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any).error_code) (error as any).error_code = (err as any).error_code;
    throw error;
  }

  invalidateMutation();
  if (res.status === 204 || res.status === 304) return undefined as T;
  const data = await res.json();
  if (generation !== appCache.generation()) throw new Error("تم تغيير الحساب؛ تجاهل الاستجابة القديمة");
  if (logEnabled) {
    console.log(`📦 API Data:`, data);
  }
  return data;
}

// Deduplicate concurrent reads only. Writes and account changes isolate new reads.
const pendingReads = new Map<string, Promise<unknown>>();
let readRevision = 0;
function getOnce<T>(path: string): Promise<T> {
  const key = `${appCache.generation()}:${readRevision}:${path}`;
  const existing = pendingReads.get(key);
  if (existing) return existing as Promise<T>;
  const pending = request<T>(path).finally(() => {
    if (pendingReads.get(key) === pending) pendingReads.delete(key);
  });
  pendingReads.set(key, pending);
  return pending;
}

export const api = {
  get: <T>(path: string, options?: { signal?: AbortSignal }) => options?.signal ? request<T>(path, { signal: options.signal }) : getOnce<T>(path),
  post: <T>(path: string, body: unknown, idempotencyKey?: string) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), ...(idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : {}) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
};
