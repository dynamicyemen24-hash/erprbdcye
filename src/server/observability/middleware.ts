import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal, activeConnections } from './metrics';
import crypto from 'crypto';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
    activeConnections.dec();
  });

  next();
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
}
