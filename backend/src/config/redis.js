import IORedis from "ioredis";
import { env } from "./env.js";

let redisClient = null;
let isConnected = false;

function getRedisOptions() {
  const url = env.redisUrl;
  if (!url) return null;

  return {
    maxRetriesPerRequest: 3,
    connectTimeout: 8000,
    retryStrategy(times) {
      if (times > 10) {
        console.warn("[Redis] Maximum reconnect attempts reached. Continuing with in-memory mode.");
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  };
}

export async function initRedis() {
  if (redisClient && isConnected) return redisClient;
  const url = env.redisUrl;
  if (!url) {
    console.log("[Redis] No REDIS_URL configured. Running without Redis caching/adapter.");
    return null;
  }

  try {
    const options = getRedisOptions();
    redisClient = new IORedis(url, options);

    redisClient.on("connect", () => {
      isConnected = true;
      console.log("[Redis] Connected successfully to Redis server.");
    });

    redisClient.on("error", (err) => {
      isConnected = false;
      console.warn(`[Redis] Connection warning: ${err.message}`);
    });

    redisClient.on("close", () => {
      isConnected = false;
    });

    await redisClient.connect();
    isConnected = true;
    return redisClient;
  } catch (err) {
    isConnected = false;
    console.warn(`[Redis] Failed to connect: ${err.message}. Operating with in-memory fallback.`);
    return null;
  }
}

export function getRedisClient() {
  return redisClient;
}

export function isRedisReady() {
  return isConnected && redisClient?.status === "ready";
}

export function createRedisPubSubClients() {
  const url = env.redisUrl;
  if (!url) return null;

  const options = getRedisOptions();
  const pubClient = new IORedis(url, options);
  const subClient = pubClient.duplicate();

  pubClient.on("error", (err) => console.warn(`[Redis Pub] ${err.message}`));
  subClient.on("error", (err) => console.warn(`[Redis Sub] ${err.message}`));

  return { pubClient, subClient };
}

export async function getCache(key) {
  if (!isRedisReady()) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

export async function setCache(key, value, ttlSeconds = 300) {
  if (!isRedisReady()) return false;
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redisClient.set(key, serialized, "EX", ttlSeconds);
    } else {
      await redisClient.set(key, serialized);
    }
    return true;
  } catch (err) {
    return false;
  }
}

export async function delCache(key) {
  if (!isRedisReady()) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    return false;
  }
}

export async function delCachePattern(pattern) {
  if (!isRedisReady()) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (err) {
    return false;
  }
}

export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (err) {
      redisClient.disconnect();
    }
    redisClient = null;
    isConnected = false;
  }
}
