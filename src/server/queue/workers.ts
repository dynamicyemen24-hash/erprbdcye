import { queue } from './queue';
import type { JobHandler } from './types';

export function registerWorkers(target: { registerHandler(type: string, handler: JobHandler): void } = queue) {
  target.registerHandler('email.send', async (job) => {
    const { sendEmail } = await import('../services/email');
    await sendEmail(job.data.to, job.data.template, job.data.data, job.data.lang);
  });

  target.registerHandler('email.bulk', async (job) => {
    const { sendBulkEmail } = await import('../services/email');
    await sendBulkEmail(job.data.recipients, job.data.template, job.data.data, job.data.lang);
  });

  target.registerHandler('report.generate', async (job) => {
    console.log(`[WORKER] Generating report: ${job.data.type}`);
    await new Promise(r => setTimeout(r, 1000));
    return { reportId: `report-${Date.now()}`, type: job.data.type };
  });

  target.registerHandler('data.export', async (job) => {
    console.log(`[WORKER] Exporting data: ${job.data.entityType}`);
    await new Promise(r => setTimeout(r, 1000));
    return { exportId: `export-${Date.now()}`, format: job.data.format };
  });

  target.registerHandler('cache.invalidate', async (job) => {
    console.log(`[WORKER] Invalidating cache: ${job.data.pattern || job.data.tags}`);
  });

  target.registerHandler('notification.send', async (job) => {
    console.log(`[WORKER] Sending notification to user ${job.data.userId}: ${job.data.title}`);
  });

  target.registerHandler('webhook.deliver', async (job) => {
    const { webhookDeliverer } = await import('../services/webhooks');
    await webhookDeliverer.deliverWithRetry(job.data.webhook, job.data.payload);
  });

  target.registerHandler('compliance.check', async (job) => {
    console.log(`[WORKER] Running compliance check: ${job.data.entityType}/${job.data.entityId}`);
  });

  console.log('[QUEUE] Workers registered');
}
