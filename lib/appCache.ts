/**
 * appCache — in-memory shared cache للبيانات التي تُطلب من صفحات متعددة.
 * يحل مشكلة كل صفحة تجلب /grades و /auth/me و /teachers/:id بشكل مستقل.
 *
 * TTL افتراضي: 10 دقائق (قابل للتغيير لكل entry).
 * عند أي mutation يمس البيانات، استدعِ appCache.invalidate(key).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 10 * 60 * 1000; // 10 دقائق

let generation = 0;
export const appCache = {
  generation: () => generation,
  clear() { generation++; store.clear(); },
  get<T>(key: string): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.data;
  },

  set<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
    store.set(key, { data, expiresAt: Date.now() + ttl });
  },

  invalidate(key: string): void {
    store.delete(key);
  },

  invalidatePrefix(prefix: string): void {
    for (const k of store.keys()) {
      if (k.startsWith(prefix)) store.delete(k);
    }
  },
};
