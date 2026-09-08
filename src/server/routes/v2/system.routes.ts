import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import os from 'os';

const router = Router();

router.get('/info', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    node: process.version,
    platform: os.platform(),
    arch: os.arch(),
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
      used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || 'unknown',
      load: os.loadavg(),
    },
    pid: process.pid,
    cwd: process.cwd(),
  });
});

router.get('/features', authenticateToken, (req: Request, res: Response) => {
  res.json({
    features: {
      email: process.env.EMAIL_PROVIDER || 'console',
      redis: process.env.REDIS_URL ? 'configured' : 'in-memory',
      ai: process.env.GEMINI_API_KEY ? 'configured' : 'mock',
      webhooks: true,
      queue: true,
      observability: true,
      mfa: false,
      sso: false,
    },
  });
});

export default router;
