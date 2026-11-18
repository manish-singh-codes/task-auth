import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { redis } from '../config/redis';

const MAX_ATTEMPTS = env.LOGIN_RATE_LIMIT_MAX;
const WINDOW_SEC = env.LOGIN_RATE_LIMIT_WINDOW_SEC;
const BLOCK_SEC = env.LOGIN_BLOCK_DURATION_SEC;

type Decision =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfter: number };

async function evaluate(ip: string): Promise<Decision> {
  const attemptsKey = `rl:login:attempts:${ip}`;
  const blockKey = `rl:login:block:${ip}`;

  // already blocked? the key's TTL tells us how long is left
  const blockTtl = await redis.ttl(blockKey);
  if (blockTtl > 0) {
    return { allowed: false, retryAfter: blockTtl };
  }

  const results = await redis.multi().incr(attemptsKey).ttl(attemptsKey).exec();
  if (!results) throw new Error('Redis transaction returned no result');

  const [[incrErr, count], [ttlErr, ttl]] = results as [[Error | null, number], [Error | null, number]];
  if (incrErr || ttlErr) throw incrErr ?? ttlErr;

  // first hit starts the window; ttl < 0 also covers a key that lost its expiry
  if (count === 1 || ttl < 0) {
    await redis.expire(attemptsKey, WINDOW_SEC);
  }

  if (count > MAX_ATTEMPTS) {
    await redis.multi().set(blockKey, '1', 'EX', BLOCK_SEC).del(attemptsKey).exec();
    return { allowed: false, retryAfter: BLOCK_SEC };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - count };
}

export const loginRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  let decision: Decision;
  try {
    decision = await evaluate(ip);
  } catch (err) {
    // Redis is unavailable: fail open so users can still log in.
    // bcrypt cost + the DB are still in front of the endpoint.
    console.warn('[rate-limiter] redis unavailable, skipping check:', (err as Error).message);
    return next();
  }

  res.setHeader('X-RateLimit-Limit', MAX_ATTEMPTS);

  if (!decision.allowed) {
    res.setHeader('Retry-After', decision.retryAfter);
    res.setHeader('X-RateLimit-Remaining', 0);
    return res.status(429).json({
      status: 'error',
      message: `Too many login attempts. Try again in ${decision.retryAfter} seconds.`,
    });
  }

  res.setHeader('X-RateLimit-Remaining', decision.remaining);
  next();
};
