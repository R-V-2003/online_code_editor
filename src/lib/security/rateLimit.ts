import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * Rate Limiting Middleware
 * Implements sliding window rate limiting using database storage
 */

interface RateLimitConfig {
  windowMs: number;    // Window size in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Default rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  ai: {
    windowMs: 60000, // 1 minute
    maxRequests: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '20'),
  },
  auth: {
    windowMs: 300000, // 5 minutes
    maxRequests: 10,  // 10 auth attempts per 5 minutes
  },
};

/**
 * Get client identifier (IP or user ID)
 */
function getClientKey(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Get IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown';
  return `ip:${ip}`;
}

/**
 * Check rate limit
 */
export async function checkRateLimit(
  request: NextRequest,
  endpoint: string,
  userId?: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const key = getClientKey(request, userId);
  const windowStart = new Date(Math.floor(Date.now() / config.windowMs) * config.windowMs);

  try {
    // Use upsert to atomically increment or create
    const rateLimitLog = await prisma.rateLimitLog.upsert({
      where: {
        key_endpoint_windowStart: {
          key,
          endpoint,
          windowStart,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        key,
        endpoint,
        windowStart,
        count: 1,
      },
    });

    const remaining = Math.max(0, config.maxRequests - rateLimitLog.count);
    const resetAt = new Date(windowStart.getTime() + config.windowMs);

    return {
      allowed: rateLimitLog.count <= config.maxRequests,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  endpoint: string,
  userId?: string
): Promise<NextResponse | null> {
  const { allowed, remaining, resetAt } = await checkRateLimit(request, endpoint, userId);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((resetAt.getTime() - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetAt.toISOString(),
          'Retry-After': Math.ceil((resetAt.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetAt: Date
): NextResponse {
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetAt.toISOString());
  return response;
}

/**
 * Clean up old rate limit logs (run periodically)
 */
export async function cleanupRateLimitLogs(): Promise<void> {
  const cutoff = new Date(Date.now() - 3600000); // 1 hour ago
  
  await prisma.rateLimitLog.deleteMany({
    where: {
      windowStart: { lt: cutoff },
    },
  });
}
