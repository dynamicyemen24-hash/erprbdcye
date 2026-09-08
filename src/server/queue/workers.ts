import { queue } from './queue';

export function registerWorkers() {
  queue.registerHandler('email.send', async (job) => {
    const { sendEmail } = await import('../services/email');
    await sendEmail(job.data.to, job.data.template, job.data.data, job.data.lang);
  });

  queue.registerHandler('email.bulk', async (job) => {
    const { sendBulkEmail } = await import('../services/email');
    await sendBulkEmail(job.data.recipients, job.data.template, job.data.data, job.data.lang);
  });

  queue.registerHandler('report.generate', async (job) => {
    console.log(`[WORKER] Generating report: ${job.data.type}`);
    await new Promise(r => setTimeout(r, 1000));
    return { reportId: `report-${Date.now()}`, type: job.data.type };
  });

  queue.registerHandler('data.export', async (job) => {
    console.log(`[WORKER] Exporting data: ${job.data.entityType}`);
    await new Promise(r => setTimeout(r, 1000));
    return { exportId: `export-${Date.now()}`, format: job.data.format };
  });

  queue.registerHandler('cache.invalidate', async (job) => {
    console.log(`[WORKER] Invalidating cache: ${job.data.pattern || job.data.tags}`);
  });

  queue.registerHandler('notification.send', async (job) => {
    console.log(`[WORKER] Sending notification to user ${job.data.userId}: ${job.data.title}`);
  });

  queue.registerHandler('webhook.deliver', async (job) => {
    const { webhookDeliverer } = await import('../services/webhooks');
    await webhookDeliverer.deliverWithRetry(job.data.webhook, job.data.payload);
  });

  queue.registerHandler('compliance.check', async (job) => {
    console.log(`[WORKER] Running compliance check: ${job.data.entityType}/${job.data.entityId}`);
  });

  console.log('[QUEUE] Workers registered');
}
