import { Router, Request, Response } from 'express';
import { sendEmail, sendBulkEmail } from '../../services/email';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.post('/send', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { to, template, data, lang } = req.body;
    if (!to || !template) return res.status(400).json({ error: 'to and template are required' });
    const result = await sendEmail(to, template, data || {}, lang || 'en');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { recipients, template, data, lang } = req.body;
    if (!recipients?.length || !template) return res.status(400).json({ error: 'recipients and template are required' });
    const results = await sendBulkEmail(recipients, template, data || {}, lang || 'en');
    res.json({ results, sent: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
