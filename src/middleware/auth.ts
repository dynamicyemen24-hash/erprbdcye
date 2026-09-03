import { Request, Response, NextFunction } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../server/middleware/auth.middleware';

/**
 * NexoraOS™ — Unified Auth Entry Point
 *
 * Deprecated shim. The system uses a single JWT-based authentication chain via
 * `authenticateToken` from `../server/middleware/auth.middleware`.
 *
 * This file previously hosted a redundant Firebase Admin `verifyIdToken` path,
 * which was removed to eliminate the dual-auth conflict:
 *   - JWT (jsonwebtoken) is THE single source of truth for API authentication.
 *   - Firebase SDK (src/lib/firebase.ts) is used client-side ONLY for Google
 *     social sign-in, NOT for server authorization.
 */

export interface AuthRequest extends Request {
  user?: AuthenticatedRequest['user'];
}

export const requireAuth = authenticateToken;

export { authenticateToken };
