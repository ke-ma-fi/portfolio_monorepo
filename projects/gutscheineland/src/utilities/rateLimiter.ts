import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

// Cache limiters based on their configuration (maxRequests + windowMs)
// This ensures we reuse the same bucket for the same configuration
const limiters = new Map<string, RateLimiterMemory>()

/**
 * Check if a request should be rate limited using strict Token Bucket algorithm
 * @param identifier - Unique identifier (e.g., user ID, IP address)
 * @param options - Rate limit configuration
 * @returns Object with `limited` boolean and remaining count
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 10, windowMs: 60000 },
): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
  const key = `${options.maxRequests}-${options.windowMs}`
  let limiter = limiters.get(key)

  if (!limiter) {
    limiter = new RateLimiterMemory({
      points: options.maxRequests,
      duration: options.windowMs / 1000, // library uses seconds
    })
    limiters.set(key, limiter)
  }

  try {
    const rateLimiterRes = await limiter.consume(identifier)
    return {
      limited: false,
      remaining: rateLimiterRes.remainingPoints,
      resetTime: Date.now() + rateLimiterRes.msBeforeNext,
    }
  } catch (res) {
    // If rejected, it means rate limit user
    // The library throws the RateLimiterRes object
    const rateLimiterRes = res as RateLimiterRes
    return {
      limited: true,
      remaining: 0,
      resetTime: Date.now() + rateLimiterRes.msBeforeNext,
    }
  }
}
