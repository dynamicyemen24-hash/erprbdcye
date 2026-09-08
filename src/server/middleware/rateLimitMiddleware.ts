/**
 * NexoraOS™ — Rate Limit Middleware Adapter
 * Wraps distributed rate limiters into Express middleware
 */

import { Request, Response, NextFunction } from 'express';

type RateLimiterFn = (req: Request, res: Response, next: NextFunction) => void;

export function createRateLimitMiddleware(limiter: RateLimiterFn) {
  return (req: Request, res: Response, next: NextFunction) => {
    limiter(req, res, next);
  };
}
