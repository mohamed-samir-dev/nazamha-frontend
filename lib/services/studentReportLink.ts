import { api } from "@/lib/apiClient";
const pending = new Map<string, Promise<string>>();
export function getStudentReportLink(studentId: string): Promise<string> {
  const key = `student-report-link:${studentId}`;
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || "null");
    if (cached && Date.parse(cached.expires_at) > Date.now() + 60000) return Promise.resolve(cached.share_url);
  } catch { /* Optional session cache. */ }
  if (pending.has(key)) return pending.get(key)!;
  const request = api.post<{ share_url: string; expires_at: string }>(`/students/${studentId}/share-token`, { ttl_hours: 168 })
    .then(result => {
      const link = new URL(result.share_url);
      // Use the same reachable frontend origin that the teacher is visiting.
      const share_url = `${window.location.origin}${link.pathname}${link.search}`;
      try { sessionStorage.setItem(key, JSON.stringify({ ...result, share_url })); } catch { /* Optional cache. */ }
      return share_url;
    }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}
