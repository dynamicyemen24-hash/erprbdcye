import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { deduplicationMiddleware } from '../dedup';

type Body = Record<string, unknown>;

/** Minimal express-like req/res pair driven by the middleware under test. */
function makeReq(url = '/api/v2/health/liveness', auth = ''): Request {
  return {
    method: 'GET',
    originalUrl: url,
    url,
    path: url,
    query: {},
    headers: auth ? { authorization: auth } : {},
    ip: '127.0.0.1',
  } as unknown as Request;
}

function makeRes() {
  const state = { jsonCalls: 0, ended: false, body: null as Body | null, statusCode: 200 };
  const res: any = {
    statusCode: 200,
    state,
    status(code: number) {
      res.statusCode = code;
      state.statusCode = code;
      return res;
    },
    json(body: Body) {
      state.jsonCalls++;
      state.body = body;
      state.statusCode = res.statusCode;
      res.end();
      return res;
    },
    end() {
      state.ended = true;
      return res;
    },
    on: () => res,
  };
  return res;
}

const flush = (ms = 0) => new Promise((r) => setTimeout(r, ms));

describe('deduplicationMiddleware', () => {
  afterEach(() => vi.clearAllMocks());

  it('replays a concurrent identical JSON request with its original status', async () => {
    const mw = deduplicationMiddleware();
    const first = makeRes();
    const second = makeRes();

    // First request resolves after a tick so a duplicate can arrive while pending.
    const route = async (res: any) => {
      await flush(30);
      res.status(207).json({ status: 'alive', n: 1 });
    };

    await mw(makeReq(), first, () => void route(first));
    await flush(5);
    await mw(makeReq(), second, () => void route(second));
    await flush(80);

    expect(first.state.jsonCalls).toBe(1);
    expect(second.state.jsonCalls).toBe(1);
    expect(second.state.body).toEqual({ status: 'alive', n: 1 });
    // Status code must survive the replay — not silently become 200.
    expect(second.state.statusCode).toBe(207);
  });

  it('serves an identical request from the recent-response cache', async () => {
    const mw = deduplicationMiddleware({ windowMs: 1000, maxAge: 5000 });
    const res1 = makeRes();
    const res2 = makeRes();

    await mw(makeReq('/api/audit'), res1, () => res1.status(200).json({ rows: 3 }));
    await mw(makeReq('/api/audit'), res2, () => {
      // Must never run: the cache already answered.
      throw new Error('route should not be reached');
    });
    await flush(10);

    expect(res2.state.jsonCalls).toBe(1);
    expect(res2.state.body).toEqual({ rows: 3 });
  });

  it('passes through to the route when there is no replayable JSON body', async () => {
    const mw = deduplicationMiddleware();
    const res = makeRes();
    const next = vi.fn();
    let routeReached = 0;

    // A static asset / string response never touches res.json().
    await mw(makeReq('/src/App.tsx'), res, () => {
      routeReached++;
      res.end();
    });
    await flush(20);

    expect(next).not.toHaveBeenCalled();
    expect(routeReached).toBe(1);
    expect(res.state.jsonCalls).toBe(0);
  });

  it('does not reject when a duplicate arrives for a non-JSON response', async () => {
    const mw = deduplicationMiddleware();
    const unhandled = vi.fn();
    process.once('unhandledRejection', unhandled);

    const first = makeRes();
    const second = makeRes();
    let secondRoute = 0;

    await mw(makeReq('/logo.png'), first, () => first.end());
    // Duplicate lands while the first is still in flight only if it is pending;
    // replaying a settled non-JSON request must fall back to the route.
    await mw(makeReq('/logo.png'), second, () => {
      secondRoute++;
      second.end();
    });
    await flush(30);
    await flush(10);

    process.off('unhandledRejection', unhandled as any);
    expect(unhandled).not.toHaveBeenCalled();
    expect(secondRoute).toBe(1);
    expect(first.state.ended).toBe(true);
    expect(second.state.ended).toBe(true);
  });

  it('keys the fingerprint by auth header so tenants never share a replay', async () => {
    const mw = deduplicationMiddleware();
    const tenantA = makeRes();
    const tenantB = makeRes();

    await mw(makeReq('/api/me', 'Bearer a'), tenantA, () =>
      tenantA.status(200).json({ org: 'A' })
    );
    await mw(makeReq('/api/me', 'Bearer b'), tenantB, () =>
      tenantB.status(200).json({ org: 'B' })
    );
    await flush(10);

    expect(tenantA.state.body).toEqual({ org: 'A' });
    expect(tenantB.state.body).toEqual({ org: 'B' });
  });

  it('never deduplicates non-GET methods', async () => {
    const mw = deduplicationMiddleware();
    const res = makeRes();
    const next = vi.fn();
    const postReq = { ...makeReq(), method: 'POST' } as Request;

    await mw(postReq, res, next as NextFunction);
    expect(next).toHaveBeenCalled();
    expect(res.state.jsonCalls).toBe(0);
  });
});