import { describe, it, expect } from 'vitest';
import { GracefulShutdown } from '../gracefulShutdown';

describe('GracefulShutdown', () => {
  it('creates instance', () => { const s = new GracefulShutdown(); expect(s.getIsShuttingDown()).toBe(false); });
  it('tracks responses', () => { const s = new GracefulShutdown(); const mockRes = { on: () => {} } as any; s.trackResponse(mockRes); expect(s.getIsShuttingDown()).toBe(false); });
});
