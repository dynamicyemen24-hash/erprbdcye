/**
 * NexoraOS™ — Request Deduplication Middleware
 * Prevents duplicate concurrent GET requests and caches recent responses
 */

import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import logger from '../core/logger';

interface DedupEntry {
  timestamp: number;
  response: any;
  statusCode: number;
}

const pendingRequests: Map<string, Promise<any>> = new Map();
const recentRequests: Map<string, DedupEntry> = new Map();

export function deduplicationMiddleware(options: { windowMs?: number; maxAge?: number } = {}) {
  const { windowMs = 1000, maxAge = 5000 } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only dedup GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate request fingerprint from method, URL, query params, and auth header
    const authHeader = (req.headers.authorization as string) || '';
    const fingerprint = createHash('md5')
      .update(`${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}:${authHeader}`)
      .digest('hex');

    // Check if identical request is in progress
    if (pendingRequests.has(fingerprint)) {
      logger.debug('Request deduplication hit', {
        context: 'dedup',
        meta: { fingerprint, path: req.path },
      });

      try {
        const result = await pendingRequests.get(fingerprint);
        return res.json(result);
      } catch (error) {
        return next(error);
      }
    }

    // Check recent completed requests
    const recent = recentRequests.get(fingerprint);
    if (recent && Date.now() - recent.timestamp < maxAge) {
      logger.debug('Cache hit for recent request', {
        context: 'dedup',
        meta: { fingerprint, path: req.path },
      });
      return res.status(recent.statusCode).json(recent.response);
    }

    // Track this request
    const originalJson = res.json.bind(res);
    let responseData: any = null;

    res.json = (body: any) => {
      responseData = body;

      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        recentRequests.set(fingerprint, {
          timestamp: Date.now(),
          response: body,
          statusCode: res.statusCode,
        });

        // Cleanup old entries when map grows too large
        if (recentRequests.size > 1000) {
          const oldestKey = recentRequests.keys().next().value;
          if (oldestKey) recentRequests.delete(oldestKey);
        }
      }

      return originalJson(body);
    };

    // Store promise for concurrent requests
    const requestPromise = new Promise((resolve, reject) => {
      const originalEnd = res.end.bind(res);
      res.end = function (...args: any[]) {
        if (responseData) {
          resolve(responseData);
        } else {
          reject(new Error('Request failed'));
        }
        return originalEnd(...args);
      } as any;
    });

    pendingRequests.set(fingerprint, requestPromise);
    requestPromise.finally(() => {
      pendingRequests.delete(fingerprint);
    });

    next();
  };
}
