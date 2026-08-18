import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) return null; // stop reconnecting after 3 tries, fallback to in-memory
          return Math.min(times * 50, 2000);
        },
        lazyConnect: true,
        connectTimeout: 2000,
      });

      redisClient.on("error", (err) => {
        console.warn("[RedisClient] Connection error (falling back to in-memory cache):", err.message);
      });

      redisClient.connect().catch(() => {
        // Handled via error event
      });
    } catch (e) {
      console.warn("[RedisClient] Failed to initialize Redis:", e);
      return null;
    }
  }

  return redisClient;
}
