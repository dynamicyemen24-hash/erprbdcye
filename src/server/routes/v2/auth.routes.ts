/**
 * NexoraOS™ — Authentication API Routes
 * Login, Register, Refresh Token, Change Password
 */

import { Router, Response } from 'express';
import { AuthEngine } from '../../engines/auth.engine';
import { AuthenticatedRequest, authRateLimiter, validateBody } from '../../middleware/auth.middleware';
import { successResponse, errorResponse } from '../../core/helpers';

const router = Router();

// ─── POST /api/auth/login ──────────────────────────────
router.post('/login', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const result = await AuthEngine.login(email, password, req.ip);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 401);
  }
});

// ─── POST /api/auth/register ───────────────────────────
router.post('/register', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, nameAr, orgNameAr, orgNameEn } = req.body;

    if (!email || !password || !name || !orgNameAr || !orgNameEn) {
      return errorResponse(res, 'Missing required fields: email, password, name, orgNameAr, orgNameEn', 400);
    }

    if (password.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters', 400);
    }

    const result = await AuthEngine.register({ email, password, name, nameAr, orgNameAr, orgNameEn });
    successResponse(res, result, 201);
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

// ─── POST /api/auth/refresh ────────────────────────────
router.post('/refresh', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    const result = await AuthEngine.refresh(refreshToken);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, 401);
  }
});

// ─── POST /api/auth/change-password ────────────────────
router.post('/change-password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    await AuthEngine.changePassword(userId, currentPassword, newPassword);
    successResponse(res, { message: 'Password changed successfully' });
  } catch (err: any) {
    errorResponse(res, err.message, 400);
  }
});

// ─── POST /api/auth/logout ─────────────────────────────
router.post('/logout', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await AuthEngine.logout(userId);
    }
    successResponse(res, { message: 'Logged out successfully' });
  } catch (err: any) {
    errorResponse(res, err.message, 500);
  }
});

// ─── GET /api/auth/me ──────────────────────────────────
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return errorResponse(res, 'Not authenticated', 401);
    }
    successResponse(res, {
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.org_id,
      securityLevel: user.security_level,
    });
  } catch (err: any) {
    errorResponse(res, err.message, 500);
  }
});

export default router;
