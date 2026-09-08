export enum JobPriority { LOW = 0, NORMAL = 1, HIGH = 2, URGENT = 3 }
export enum JobStatus { PENDING = 'pending', ACTIVE = 'active', COMPLETED = 'completed', FAILED = 'failed', RETRYING = 'retrying', CANCELLED = 'cancelled' }

export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  delay: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: any;
  timeout: number;
}

export type JobHandler<T = any> = (job: Job<T>) => Promise<any>;

export interface JobOptions {
  priority?: JobPriority;
  delay?: number;
  maxAttempts?: number;
  timeout?: number;
}

export interface QueueMetrics {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  avgProcessingTime: number;
}
