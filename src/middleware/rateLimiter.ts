import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service';
import { config } from '../config';
import { logger } from '../utils/logger';

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = `rate_limit:${req.ip}`;
    const count = await redisService.increment(key, Math.ceil(config.rateLimit.windowMs / 1000));

    res.setHeader('X-RateLimit-Limit', config.rateLimit.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.rateLimit.maxRequests - count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + config.rateLimit.windowMs).toISOString());

    if (count > config.rateLimit.maxRequests) {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000} seconds.`,
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Rate limiter error:', error);
    // On error, allow the request to proceed
    next();
  }
};

