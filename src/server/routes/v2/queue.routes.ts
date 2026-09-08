import { Router, Request, Response } from 'express';
import { queue } from '../../queue';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.get('/metrics', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response) => {
  res.json(queue.getMetrics());
});

router.get('/jobs', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response) => {
  const metrics = queue.getMetrics();
  res.json({ metrics });
});

router.post('/jobs/:id/retry', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  const job = await queue.retry(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found or not retryable' });
  res.json({ job });
});

router.post('/jobs/:id/cancel', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response) => {
  const success = queue.cancel(req.params.id);
  if (!success) return res.status(404).json({ error: 'Job not found or not cancellable' });
  res.json({ success: true });
});

router.delete('/clean', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response) => {
  const cleaned = queue.clean(parseInt(req.query.maxAge as string) || 3600000);
  res.json({ cleaned });
});

export default router;
