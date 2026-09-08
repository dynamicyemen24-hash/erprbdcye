import { Router, Request, Response } from 'express';
import { webhookManager } from '../../services/webhooks';
import { WebhookEvent } from '../../services/webhooks';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.get('/events', authenticateToken, (req: Request, res: Response) => {
  res.json({ events: Object.values(WebhookEvent) });
});

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organization_id;
    const webhooks = await webhookManager.listWebhooks(orgId);
    res.json({ webhooks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organization_id;
    const webhook = await webhookManager.createWebhook(orgId, req.body);
    res.status(201).json({ webhook });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const webhook = await webhookManager.getWebhookById(req.params.id);
    if (!webhook) return res.status(404).json({ error: 'Webhook not found' });
    res.json({ webhook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const webhook = await webhookManager.updateWebhook(req.params.id, req.body);
    if (!webhook) return res.status(404).json({ error: 'Webhook not found' });
    res.json({ webhook });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    await webhookManager.deleteWebhook(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/test', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const result = await webhookManager.testWebhook(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/pause', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    await webhookManager.pauseWebhook(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/resume', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    await webhookManager.resumeWebhook(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/deliveries', authenticateToken, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const deliveries = await webhookManager.getDeliveries(req.params.id, limit);
    res.json({ deliveries });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
