import Redis from 'ioredis';
import { env } from './env';

// Fail fast when Redis is down instead of queueing commands forever,
// so request handlers can decide how to degrade.
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  commandTimeout: 500,
  retryStrategy: (times) => Math.min(times * 200, 5000),
});

let lastLoggedAt = 0;

redis.on('error', (err) => {
  // ioredis emits this on every failed reconnect; don't spam the logs
  const now = Date.now();
  if (now - lastLoggedAt > 10_000) {
    console.error('[redis] error:', err.message);
    lastLoggedAt = now;
  }
});

redis.on('ready', () => console.log('[redis] connected'));
