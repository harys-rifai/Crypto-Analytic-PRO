import session from "express-session";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";

let redisClient: ReturnType<typeof createClient> | null = null;
let redisSessionStore: InstanceType<typeof RedisStore> | null = null;

export async function initRedis() {
  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        connectTimeout: 3000,
      },
      disableOfflineQueue: true,
    });

    let redisErrorLogged = false;
    redisClient.on("error", (err) => {
      if (!redisErrorLogged) {
        console.error("Redis Client Error", err);
        redisErrorLogged = true;
      }
    });

    redisClient.on("connect", () => {
      console.log("Redis connected");
    });

    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Redis connection timeout")), 4000)),
    ]);

    redisSessionStore = new RedisStore({ client: redisClient as any });

    return redisSessionStore;
  } catch (error) {
    console.error("Redis initialization failed:", error);
    if (redisClient) {
      try { await redisClient.quit(); } catch {}
      redisClient = null;
    }
    return null;
  }
}

export function getRedisClient() {
  return redisClient;
}

export function getRedisSessionStore() {
  return redisSessionStore;
}
