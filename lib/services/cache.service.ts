import { getRedisClient } from "./redis.client";

/**
 * Multi-Layer High-Performance Cache Service with Stale-While-Revalidate (SWR)
 * 
 * Hierarchy:
 * - L1: In-Memory Map (<1ms instant access)
 * - L2: Redis Persistence (Shared across container replicas / survives reboots)
 * - SWR: Stale-While-Revalidate pattern for zero client waiting
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
   * Checks L1 (Memory) -> L2 (Redis) -> Origin (Fetcher).
   */
  static async swr<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; stale?: number } = {}
  ): Promise<T> {
    const ttlMs = options.ttl ?? CacheService.TTL.PRODUCTS_LIST.ttl;
    const staleTtlMs = options.stale ?? CacheService.TTL.PRODUCTS_LIST.stale;
    const now = Date.now();

    // 1. Check L1 Memory Cache (<1ms)
    let entry = this.store.get(key) as CacheEntry<T> | undefined;

    // 2. Check L2 Redis Cache if missing in L1
    if (!entry) {
      entry = await this.getFromRedis<T>(key);
      if (entry) {
        this.store.set(key, entry); // Hydrate L1
      }
    }

    if (entry) {
      const age = now - entry.cachedAt;

      // Fresh Hit (< TTL) -> Return immediately
      if (age < entry.ttlMs) {
        return entry.data;
      }

      // Stale Hit (< Stale TTL) -> Return stale data instantly & trigger background revalidation
      if (age < entry.staleTtlMs) {
        this.triggerBackgroundRevalidate(key, fetcher, ttlMs, staleTtlMs);
        return entry.data;
      }
    }

    // 3. Cache Miss or Expired beyond Stale TTL -> Synchronous fetch
    const freshData = await fetcher();
    await this.set(key, freshData, ttlMs, staleTtlMs);
    return freshData;
  }

  /**
   * Sets item in both L1 (Memory) and L2 (Redis)
   */
  static async set<T>(key: string, data: T, ttlMs: number, staleTtlMs: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      ttlMs,
      staleTtlMs,
    };

    // Set L1
    if (this.store.size >= this.MAX_ENTRIES) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, entry);

    // Set L2 Redis asynchronously
    const redis = getRedisClient();
    if (redis) {
      try {
        const expireSeconds = Math.ceil(staleTtlMs / 1000);
        await redis.set(key, JSON.stringify(entry), "EX", expireSeconds);
      } catch (err) {
        console.warn("[CacheService] Redis set error:", err);
      }
    }
  }

  /**
   * Get entry from Redis
   */
  private static async getFromRedis<T>(key: string): Promise<CacheEntry<T> | undefined> {
    const redis = getRedisClient();
    if (!redis) return undefined;

    try {
      const raw = await redis.get(key);
      if (raw) {
        return JSON.parse(raw) as CacheEntry<T>;
      }
    } catch (err) {
      console.warn("[CacheService] Redis get error:", err);
    }
    return undefined;
  }

  /**
   * Invalidate specific keys or keys matching a pattern in L1 and L2
   */
  static async invalidate(pattern: string): Promise<void> {
    // Clear L1
    for (const k of this.store.keys()) {
      if (k.includes(pattern)) {
        this.store.delete(k);
      }
    }

    // Clear L2 Redis
    const redis = getRedisClient();
    if (redis) {
      try {
        const keys = await redis.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (err) {
        console.warn("[CacheService] Redis invalidate error:", err);
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

    Promise.resolve().then(async () => {
      try {
        const fresh = await fetcher();
        await this.set(key, fresh, ttlMs, staleTtlMs);
      } catch (err) {
        console.warn(`[CacheService] Background revalidation failed for ${key}:`, err);
      } finally {
        this.revalidatingKeys.delete(key);
      }
    });
  }
}
