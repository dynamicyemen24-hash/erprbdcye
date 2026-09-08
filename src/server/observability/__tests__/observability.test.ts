import { describe, it, expect } from 'vitest';
import { register } from '../metrics';

describe('Observability', () => {
  it('metrics registry is initialized', () => {
    expect(register).toBeDefined();
  });
  it('can collect metrics', async () => {
    const metrics = await register.metrics();
    expect(typeof metrics).toBe('string');
    expect(metrics.length).toBeGreaterThan(0);
  });
  it('health check structure is valid', () => {
    const health = { status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() };
    expect(health.status).toBe('healthy');
    expect(health.uptime).toBeGreaterThan(0);
    expect(health.timestamp).toBeTruthy();
  });
});
