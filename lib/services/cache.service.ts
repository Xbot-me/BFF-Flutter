/**
 * Multi-Layer High-Performance Cache Service with Stale-While-Revalidate (SWR)
 * 
 * Features:
 * - Ultra-fast <1ms in-memory cache
 * - Stale-While-Revalidate: Serves stale data immediately, refreshes in the background
 * - Namespaced key generation per tenant
 * - Safe error handling with background task resilience
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;     // Epoch timestamp in ms
  ttlMs: number;        // Fresh TTL in ms
  staleTtlMs: number;   // Maximum allowed stale lifetime in ms
}

export class CacheService {
  private static store = new Map<string, CacheEntry<any>>();
  private static revalidatingKeys = new Set<string>();
  private static readonly MAX_ENTRIES = 2000;

  /**
   * TTL Presets in Milliseconds
   */
  static readonly TTL = {
    TENANT_CONFIG: { ttl: 10 * 60 * 1000, stale: 60 * 60 * 1000 },      // 10m fresh, 1h stale
    CATEGORIES: { ttl: 15 * 60 * 1000, stale: 120 * 60 * 1000 },       // 15m fresh, 2h stale
    FEATURED: { ttl: 3 * 60 * 1000, stale: 15 * 60 * 1000 },           // 3m fresh, 15m stale
    PRODUCT_DETAIL: { ttl: 5 * 60 * 1000, stale: 30 * 60 * 1000 },     // 5m fresh, 30m stale
    PRODUCTS_LIST: { ttl: 2 * 60 * 1000, stale: 10 * 60 * 1000 },       // 2m fresh, 10m stale
    SEARCH: { ttl: 60 * 1000, stale: 5 * 60 * 1000 },                   // 1m fresh, 5m stale
  };

  /**
   * Generates a safe, namespaced cache key
   */
  static key(namespace: string, tenantId?: string | null, ...params: (string | number | boolean | undefined | null)[]): string {
    const tenant = tenantId || "global";
    const cleanedParams = params.map((p) => (p === undefined || p === null ? "" : String(p))).join(":");
    return `bff:${tenant}:${namespace}:${cleanedParams}`;
  }

  /**
   * Executes fetcher with Stale-While-Revalidate (SWR) semantics.
   * If fresh: returns cached data.
   * If stale: returns stale data immediately and revalidates in the background.
   * If missing: awaits fetcher, populates cache, and returns fresh data.
   */
  static async swr<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; stale?: number } = {}
  ): Promise<T> {
    const ttlMs = options.ttl ?? CacheService.TTL.PRODUCTS_LIST.ttl;
    const staleTtlMs = options.stale ?? CacheService.TTL.PRODUCTS_LIST.stale;
    const now = Date.now();

    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (entry) {
      const age = now - entry.cachedAt;

      // 1. Fresh Hit (< TTL) -> Return immediately
      if (age < entry.ttlMs) {
        return entry.data;
      }

      // 2. Stale Hit (< Stale TTL) -> Return stale data instantly & trigger background revalidation
      if (age < entry.staleTtlMs) {
        this.triggerBackgroundRevalidate(key, fetcher, ttlMs, staleTtlMs);
        return entry.data;
      }
    }

    // 3. Cache Miss or Expired beyond Stale TTL -> Synchronous fetch
    const freshData = await fetcher();
    this.set(key, freshData, ttlMs, staleTtlMs);
    return freshData;
  }

  /**
   * Manually sets an item in the cache
   */
  static set<T>(key: string, data: T, ttlMs: number, staleTtlMs: number): void {
    if (this.store.size >= this.MAX_ENTRIES) {
      // LRU Eviction: Remove oldest inserted key
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      data,
      cachedAt: Date.now(),
      ttlMs,
      staleTtlMs,
    });
  }

  /**
   * Invalidate specific keys or keys matching a prefix
   */
  static invalidate(pattern: string): void {
    for (const k of this.store.keys()) {
      if (k.includes(pattern)) {
        this.store.delete(k);
      }
    }
  }

  /**
   * Background asynchronous revalidation
   */
  private static triggerBackgroundRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number,
    staleTtlMs: number
  ): void {
    if (this.revalidatingKeys.has(key)) return;

    this.revalidatingKeys.add(key);

    // Run detached background promise
    Promise.resolve().then(async () => {
      try {
        const fresh = await fetcher();
        this.set(key, fresh, ttlMs, staleTtlMs);
      } catch (err) {
        console.warn(`[CacheService] Background revalidation failed for ${key}:`, err);
      } finally {
        this.revalidatingKeys.delete(key);
      }
    });
  }
}
