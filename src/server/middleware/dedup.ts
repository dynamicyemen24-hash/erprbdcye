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

/**
 * What an in-flight request resolves to.
 *
 * `null` means "produced no replayable JSON body" (static asset, 304, redirect),
 * so a duplicate must run the route itself.
 *
 * The status code travels with the body because a replay that loses the status
 * is a *different* response: replaying a 207 as a 200 misreports the outcome to
 * the client, and replaying a 404 as a 200 is worse still.
 */
interface ReplayableResponse {
  body: any;
  statusCode: number;
}

const pendingRequests: Map<string, Promise<ReplayableResponse | null>> = new Map();
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

      // The in-flight promise always resolves. `null` specifically means the
      // original request produced no replayable JSON body (a static asset, a
      // 304, a redirect) — there is nothing to replay, so the duplicate must
      // execute the route itself rather than be answered with a literal `null`.
      const result = await pendingRequests.get(fingerprint);
      if (result === null) {
        return next();
      }
      // Replay the original status as well as the original body: a deduplicated
      // response that silently became 200 would misreport the outcome.
      return res.status(result.statusCode).json(result.body);
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
    //
    // This promise MUST always resolve, never reject. It rejects exactly one
    // thing — a failed `res.end` — and `res.end` is called for *every* response
    // the route produces, including the static-asset responses Vite serves for
    // `/src/...` modules. Those never touch `res.json`, so `responseData` stays
    // null, the `reject` below fired, and the rejection had no handler: 158
    // unhandledRejection events cascaded and killed the Node process mid-session.
    //
    // Resolving with `null` means "this request produced no replayable JSON
    // body", which is exactly what it means. A concurrent duplicate for such a
    // request simply falls through to the normal response path instead of
    // trying to replay a body that does not exist.
    const requestPromise = new Promise<ReplayableResponse | null>((resolve) => {
      const originalEnd = res.end.bind(res);
      res.end = function (...args: any[]) {
        // Resolve (never reject) so a duplicate can distinguish "no body to
        // replay" from "the original request blew up". `res.json` has already
        // run by the time `res.end` is called, so `res.statusCode` is final.
        resolve(
          responseData !== null ? { body: responseData, statusCode: res.statusCode } : null
        );
        return originalEnd(...args);
      } as any;
    });

    pendingRequests.set(fingerprint, requestPromise);
    // `finally` returns a *new* promise; an unhandled rejection on the original
    // would be reported even though this handler swallows it, so the original is
    // consumed explicitly with a no-op catch.
    requestPromise
      .catch(() => undefined)
      .finally(() => {
        pendingRequests.delete(fingerprint);
      });

    next();
  };
}
