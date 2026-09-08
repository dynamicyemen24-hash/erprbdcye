import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const authAttempts = new Counter({
  name: 'auth_login_attempts_total',
  help: 'Total login attempts',
  labelNames: ['result'],
  registers: [register],
});

export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  registers: [register],
});

export const rateLimitExceeded = new Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total rate limit exceeded events',
  registers: [register],
});

export const businessEvents = new Counter({
  name: 'business_events_total',
  help: 'Total business events',
  labelNames: ['event_type', 'entity'],
  registers: [register],
});
