import { Redis } from "@upstash/redis";

// fromEnv() checks UPSTASH_REDIS_REST_URL first, then falls back to KV_REST_API_URL.
// Both naming conventions are present in .env.local, so this works as-is.
export const redis = Redis.fromEnv();
