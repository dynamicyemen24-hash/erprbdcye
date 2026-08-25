import { Request, Response, NextFunction } from 'express';

interface Metrics {
  requests: { total: number; byMethod: Record<string, number>; byStatus: Record<string, number> };
  latency: { total: number; count: number; min: number; max: number };
  activeConnections: number;
}

const metrics: Metrics = {
  requests: { total: 0, byMethod: {}, byStatus: {} },
  latency: { total: 0, count: 0, min: Infinity, max: 0 },
  activeConnections: 0,
};

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  metrics.requests.total++;
  metrics.requests.byMethod[req.method] = (metrics.requests.byMethod[req.method] || 0) + 1;
  metrics.activeConnections++;

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.activeConnections--;
    metrics.latency.total += duration;
    metrics.latency.count++;
    metrics.latency.min = Math.min(metrics.latency.min, duration);
    metrics.latency.max = Math.max(metrics.latency.max, duration);

    const statusKey = `${res.statusCode}`;
    metrics.requests.byStatus[statusKey] = (metrics.requests.byStatus[statusKey] || 0) + 1;

    res.setHeader('X-Response-Time', `${duration}ms`);
  });

  next();
}

export function getMetrics() {
  return {
    ...metrics,
    latency: {
      avg: metrics.latency.count > 0 ? metrics.latency.total / metrics.latency.count : 0,
      min: metrics.latency.min === Infinity ? 0 : metrics.latency.min,
      max: metrics.latency.max,
    },
  };
}
