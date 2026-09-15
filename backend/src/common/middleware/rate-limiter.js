import { getRedisClient, isRedisReady } from "../../config/redis.js";

const memoryStore = new Map();

// Periodic cleanup of expired in-memory rate limiter keys
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 60000).unref();

export function rateLimiter({
  windowMs = 60 * 1000,
  max = 100,
  message = "Too many requests, please try again later.",
  keyPrefix = "rl",
} = {}) {
  return async (req, res, next) => {
    try {
      const ip =
        req.ip ||
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown_ip";

      const key = `${keyPrefix}:${ip}`;

      if (isRedisReady()) {
        const client = getRedisClient();
        if (client) {
          const count = await client.incr(key);
          if (count === 1) {
            await client.pexpire(key, windowMs);
          }

          res.setHeader("X-RateLimit-Limit", max);
          res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));

          if (count > max) {
            const ttl = await client.pttl(key);
            res.setHeader("Retry-After", Math.ceil(Math.max(0, ttl) / 1000));
            return res.status(429).json({
              success: false,
              message,
              errorCode: "RATE_LIMIT_EXCEEDED",
            });
          }

          return next();
        }
      }

      // In-memory fallback
      const now = Date.now();
      let record = memoryStore.get(key);

      if (!record || record.resetAt <= now) {
        record = { count: 1, resetAt: now + windowMs };
        memoryStore.set(key, record);
      } else {
        record.count += 1;
      }

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count));

      if (record.count > max) {
        res.setHeader("Retry-After", Math.ceil((record.resetAt - now) / 1000));
        return res.status(429).json({
          success: false,
          message,
          errorCode: "RATE_LIMIT_EXCEEDED",
        });
      }

      next();
    } catch (err) {
      // Fail open on error
      next();
    }
  };
}

export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login/auth attempts per 15 min per IP
  message: "Too many authentication attempts. Please try again in a few minutes.",
  keyPrefix: "rl:auth",
});

export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 600, // 600 requests per min per IP (10 req/sec)
  message: "Rate limit exceeded. Please slow down your requests.",
  keyPrefix: "rl:api",
});

export default rateLimiter;
