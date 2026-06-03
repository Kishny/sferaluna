import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextRequest } from 'next/server';

const rateLimiter = new RateLimiterMemory({
  points: 10, // Nombre de requêtes
  duration: 60, // Par 60 secondes
});

export async function rateLimit(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    await rateLimiter.consume(ip);
    return { limited: false };
  } catch (error) {
    return {
      limited: true,
      retryAfter: Math.ceil(error.msBeforeNext / 1000),
      resetTime: Date.now() + error.msBeforeNext,
    };
  }
}