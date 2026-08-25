import { Request, Response, NextFunction } from 'express';
import { apiCache } from '../core/cache';

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  conditions?: (req: Request, res: Response) => boolean;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 60, keyGenerator, conditions } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    if (conditions && !conditions(req, res)) return next();

    const key = keyGenerator ? keyGenerator(req) : `${(req as any).user?.orgId || 'global'}:${req.originalUrl}`;
    const cached = apiCache.get(key);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        apiCache.set(key, body, { ttl: ttl * 1000 });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}
