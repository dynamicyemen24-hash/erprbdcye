import { randomUUID } from 'crypto';
import { Job, JobHandler, JobOptions, JobPriority, JobStatus, QueueMetrics } from './types';

export class JobQueue {
  private handlers = new Map<string, JobHandler>();
  private jobs: Job[] = [];
  private processing = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private concurrency = 5;
  private activeCount = 0;
  private metrics = { totalProcessed: 0, totalProcessingTime: 0 };

  registerHandler(type: string, handler: JobHandler) { this.handlers.set(type, handler); }

  async add<T>(type: string, data: T, options: JobOptions = {}): Promise<Job<T>> {
    const job: Job<T> = {
      id: randomUUID(), type, data,
      priority: options.priority ?? JobPriority.NORMAL,
      status: JobStatus.PENDING,
      attempts: 0, maxAttempts: options.maxAttempts ?? 3,
      delay: options.delay ?? 0,
      createdAt: new Date(),
      timeout: options.timeout ?? 30000,
    };
    this.jobs.push(job);
    console.log(`[QUEUE] Job added: ${type} (${job.id})`);
    return job;
  }

  start() {
    if (this.processing) return;
    this.processing = true;
    this.poll();
    console.log('[QUEUE] Processing started');
  }

  private async poll() {
    if (!this.processing) return;
    while (this.processing && this.activeCount < this.concurrency) {
      const job = this.jobs.find(j => j.status === JobStatus.PENDING && j.delay <= 0);
      if (!job) break;
      this.processJob(job);
    }
    this.pollTimer = setTimeout(() => this.poll(), 1000);
  }

  private async processJob(job: Job) {
    const handler = this.handlers.get(job.type);
    if (!handler) { job.status = JobStatus.FAILED; job.error = `No handler for ${job.type}`; return; }

    job.status = JobStatus.ACTIVE;
    job.startedAt = new Date();
    job.attempts++;
    this.activeCount++;

    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Job timeout')), job.timeout));
      job.result = await Promise.race([handler(job), timeoutPromise]);
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      const duration = job.completedAt.getTime() - job.startedAt.getTime();
      this.metrics.totalProcessed++;
      this.metrics.totalProcessingTime += duration;
      console.log(`[QUEUE] Job completed: ${job.type} (${job.id}) in ${duration}ms`);
    } catch (error: any) {
      job.error = error.message;
      if (job.attempts < job.maxAttempts) {
        job.status = JobStatus.RETRYING;
        job.delay = Math.pow(2, job.attempts) * 1000;
        console.log(`[QUEUE] Job retrying: ${job.type} (${job.id}) attempt ${job.attempts}/${job.maxAttempts}`);
      } else {
        job.status = JobStatus.FAILED;
        job.failedAt = new Date();
        console.error(`[QUEUE] Job failed: ${job.type} (${job.id}): ${error.message}`);
      }
    } finally { this.activeCount--; }
  }

  async retry(jobId: string): Promise<Job | null> {
    const job = this.jobs.find(j => j.id === jobId);
    if (job && (job.status === JobStatus.FAILED || job.status === JobStatus.CANCELLED)) {
      job.status = JobStatus.PENDING; job.attempts = 0; job.error = undefined; job.delay = 0;
      return job;
    }
    return null;
  }

  cancel(jobId: string): boolean {
    const job = this.jobs.find(j => j.id === jobId);
    if (job && job.status === JobStatus.PENDING) { job.status = JobStatus.CANCELLED; return true; }
    return false;
  }

  getJob(jobId: string): Job | undefined { return this.jobs.find(j => j.id === jobId); }

  getMetrics(): QueueMetrics {
    return {
      pending: this.jobs.filter(j => j.status === JobStatus.PENDING).length,
      active: this.jobs.filter(j => j.status === JobStatus.ACTIVE).length,
      completed: this.jobs.filter(j => j.status === JobStatus.COMPLETED).length,
      failed: this.jobs.filter(j => j.status === JobStatus.FAILED).length,
      totalProcessed: this.metrics.totalProcessed,
      avgProcessingTime: this.metrics.totalProcessed > 0 ? this.metrics.totalProcessingTime / this.metrics.totalProcessed : 0,
    };
  }

  async stop() {
    this.processing = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    console.log('[QUEUE] Processing stopped');
  }

  clean(maxAgeMs: number = 3600000): number {
    const cutoff = new Date(Date.now() - maxAgeMs);
    const before = this.jobs.length;
    this.jobs = this.jobs.filter(j => {
      if (j.status === JobStatus.COMPLETED || j.status === JobStatus.FAILED || j.status === JobStatus.CANCELLED) {
        return (j.completedAt || j.failedAt || j.createdAt) > cutoff;
      }
      return true;
    });
    return before - this.jobs.length;
  }
}

export const queue = new JobQueue();
