import { createClient } from "redis";
import { env } from "./env";

const redisUrl = `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;

export const redis = createClient({
  url: redisUrl,
});

redis.on("error", (error) => {
  console.error("Redis connection error", error);
});

export const ensureRedisConnection = async (): Promise<void> => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};

ensureRedisConnection().catch((error) => {
  console.error("Failed to connect to Redis", error);
});
