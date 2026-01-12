import rateLimit from 'express-rate-limit';
import { AppError, ErrorCode } from '../../types/api';

/**
 * Rate limiting middleware configuration.
 *
 * Limits the number of requests per IP address within a specified time window.
 * When the limit is exceeded, returns a 429 Too Many Requests error.
 *
 * Configuration (can be overridden via environment variables):
 * - Window: 15 minutes (or RATE_LIMIT_WINDOW_MS)
 * - Max requests: 100 per window per IP (or RATE_LIMIT_MAX)
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests default
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const error = new AppError(429, 'Too many requests, please try again later.', ErrorCode.TOO_MANY_REQUESTS);

    res.status(429).json({
      success: false,
      error: {
        code: ErrorCode.TOO_MANY_REQUESTS,
        message: error.message,
      },
    });
  },
});
