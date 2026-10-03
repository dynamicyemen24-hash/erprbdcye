/**
 * NexoraOS™ — API route fallthrough contract
 *
 * Guards a production-only failure mode: the SPA catch-all (`app.get('*')`) is
 * registered after every API router, so an unmatched `/api/*` path used to be
 * answered with the app shell (index.html, 200, text/html) instead of a JSON
 * 404. Clients parsing JSON then failed with a syntax error and the real cause —
 * a typo'd or retired endpoint — was invisible.
 *
 * These assertions are static (source-level) on purpose: booting the real
 * `server.ts` would require Postgres, Redis and a full bootstrap.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SERVER_SRC = readFileSync(join(process.cwd(), 'server.ts'), 'utf8');

/** Character offset of the first match, or -1. */
const indexOf = (needle: string) => SERVER_SRC.indexOf(needle);

describe('API fallthrough contract', () => {
  it('installs a JSON 404 terminator for unmatched /api routes', () => {
    expect(SERVER_SRC).toMatch(/app\.use\(\s*['"]\/api['"]\s*,[\s\S]{0,400}?res\.status\(404\)\.json\(/);
  });

  it('registers that terminator AFTER every API router', () => {
    const terminator = SERVER_SRC.indexOf("res.status(404).json(");
    expect(terminator).toBeGreaterThan(-1);

    // The last real API router must be mounted before the terminator.
    const lastRouter = SERVER_SRC.lastIndexOf("app.use('/api/docs'");
    expect(lastRouter).toBeGreaterThan(-1);
    expect(lastRouter).toBeLessThan(terminator);
  });

  it('registers the terminator BEFORE the SPA catch-all', () => {
    const terminator = SERVER_SRC.indexOf("res.status(404).json(");
    // Anchor on the real registration (`app.get('*',`) rather than the prose
    // that mentions the same string inside a comment.
    const spaCatchAll = SERVER_SRC.indexOf("app.get('*',");
    expect(spaCatchAll).toBeGreaterThan(-1);
    expect(terminator).toBeLessThan(spaCatchAll);
  });

  it('keeps observability routes reachable (they are mounted first, unauthenticated)', () => {
    const health = indexOf('healthRoutes(app)');
    const spa = SERVER_SRC.indexOf("app.get('*'");
    expect(health).toBeGreaterThan(-1);
    expect(health).toBeLessThan(spa);
  });
});

describe('process safety guards', () => {
  it('never exits the process on an unhandled rejection', () => {
    const block = SERVER_SRC.slice(
      SERVER_SRC.indexOf("process.on('unhandledRejection'"),
      SERVER_SRC.indexOf("process.on('uncaughtException'")
    );
    expect(block).toMatch(/process\.on\('unhandledRejection'/);
    expect(block).not.toMatch(/process\.exit\(/);
  });

  it('does not hand a negative timeout to setTimeout anywhere in the server', () => {
    // A negative delay is coerced to 1ms by Node (TimeoutNegativeWarning) and
    // turns any backoff into a hot loop.
    const offenders = SERVER_SRC.split('\n')
      .map((line, i) => ({ line: i + 1, text: line }))
      .filter(({ text }) => /setTimeout\([^)]*,\s*-\s*\d/.test(text));
    expect(offenders).toEqual([]);
  });
});

describe('Redis reconnect policy', () => {
  const clientSrc = readFileSync(join(process.cwd(), 'src/server/redis/client.ts'), 'utf8');

  it('stands the client down with null rather than a negative delay', () => {
    expect(clientSrc).toMatch(/retryStrategy\(times: number\): number \| null/);
    expect(clientSrc).not.toMatch(/return -1;/);
  });

  it('keeps a bounded, growing backoff for the attempts before giving up', () => {
    // Anchor on the implementation (the JSDoc above it also names the method),
    // then read a fixed window so sibling code cannot leak into the assertion.
    const start = clientSrc.indexOf('retryStrategy(times: number): number | null {');
    expect(start, 'client.ts must declare the retryStrategy implementation').toBeGreaterThan(-1);
    const strategy = clientSrc.slice(start, start + 600);
    expect(strategy).toMatch(/return null;/);
    expect(strategy).toMatch(/Math\.min\(times \* \d+, \d+\)/);
  });
});
