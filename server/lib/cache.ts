import "./env.js";
import Redis from "ioredis";

// In-memory fallback for local development or if Redis fails
const memoryCache = new Map<string, { value: any; expires: number }>();

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });
    redis.on("error", (err) => {
      console.warn("[Cache] Redis connection error, falling back to memory:", err.message);
    });
  } catch (err) {
    console.warn("[Cache] Failed to initialize Redis, using memory cache.");
  }
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    // 1. Try Redis
    if (redis) {
      try {
        const val = await redis.get(key);
        if (val) return JSON.parse(val) as T;
      } catch (err) {
        console.error("[Cache] Redis get error:", err);
      }
    }

    // 2. Fallback to Memory
    const cached = memoryCache.get(key);
    if (cached) {
      if (Date.now() < cached.expires) {
        return cached.value as T;
      }
      memoryCache.delete(key);
    }

    return null;
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    // 1. Try Redis
    if (redis) {
      try {
        await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      } catch (err) {
        console.error("[Cache] Redis set error:", err);
      }
    }

    // 2. Set in Memory
    memoryCache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
  },

  async del(key: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(key);
      } catch (err) {
        console.error("[Cache] Redis del error:", err);
      }
    }
    memoryCache.delete(key);
  },

  async clear(): Promise<void> {
    if (redis) {
      try {
        await redis.flushall();
      } catch (err) {
        console.error("[Cache] Redis flush error:", err);
      }
    }
    memoryCache.clear();
  }
};
