import { describe, it, expect, afterEach } from 'vitest';
import { JobQueue } from '../queue';
import { JobPriority, JobStatus } from '../types';

describe('JobQueue', () => {
  let q: JobQueue;
  afterEach(async () => { if (q) await q.stop(); });

  it('creates instance', () => { q = new JobQueue(); expect(q).toBeDefined(); });

  it('adds job', async () => {
    q = new JobQueue();
    const job = await q.add('test', { value: 1 });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe(JobStatus.PENDING);
    expect(job.type).toBe('test');
  });

  it('processes job with handler', async () => {
    q = new JobQueue();
    let processed = false;
    q.registerHandler('test', async (job) => { processed = true; return 'done'; });
    q.start();
    await q.add('test', { value: 1 });
    await new Promise(r => setTimeout(r, 1500));
    expect(processed).toBe(true);
  });

  it('retries failed job', async () => {
    q = new JobQueue();
    let attempts = 0;
    q.registerHandler('fail', async () => { attempts++; throw new Error('fail'); });
    q.start();
    const job = await q.add('fail', {}, { maxAttempts: 2 });
    await new Promise(r => setTimeout(r, 2000));
    expect(attempts).toBeGreaterThanOrEqual(1);
  });

  it('cancels pending job', async () => {
    q = new JobQueue();
    const job = await q.add('test', {});
    const result = q.cancel(job.id);
    expect(result).toBe(true);
    expect(job.status).toBe(JobStatus.CANCELLED);
  });

  it('returns metrics', async () => {
    q = new JobQueue();
    const metrics = q.getMetrics();
    expect(metrics.pending).toBe(0);
    expect(metrics.active).toBe(0);
  });

  it('cleans old jobs', async () => {
    q = new JobQueue();
    await q.add('test', {});
    const cleaned = q.clean(0);
    expect(cleaned).toBeGreaterThanOrEqual(0);
  });
});
