import { deduplicationMiddleware } from '../src/server/middleware/dedup';

function fakeReq() {
  return { method: 'GET', originalUrl: '/api/v2/health/liveness', query: {}, headers: {}, path: '/api/v2/health/liveness', ip: '127.0.0.1' } as any;
}
function fakeRes(tag: string) {
  const state: any = { statusCode: 200, tag, jsonCalls: 0, endCalls: 0, finished: false };
  const res: any = {
    statusCode: 200,
    state,
    setHeader: () => {},
    getHeader: () => undefined,
    status(c: number) {
      state.statusCode = c;
      return res;
    },
    json(body: any) {
      state.jsonCalls++;
      state.body = body;
      // emulate express: json -> send -> end
      res.end(JSON.stringify(body));
      return res;
    },
    end(...args: any[]) {
      state.endCalls++;
      state.finished = true;
      return res;
    },
  };
  return res;
}

async function main() {
  console.log('DEDUP-PROBE-START');
  const mw = deduplicationMiddleware({ windowMs: 1000, maxAge: 5000 });
  const N = 7;
  const results: string[] = [];
  await Promise.all(
    Array.from({ length: N }, async (_, i) => {
      const req = fakeReq();
      const res = fakeRes(`r${i}`);
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          results.push(`${res.state.tag}:TIMEOUT json=${res.state.jsonCalls} end=${res.state.endCalls}`);
        }
      }, 5000);
      // completion watcher: resolves when res.json was invoked (any path)
      const watch = (async () => {
        for (let k = 0; k < 200 && res.state.jsonCalls === 0; k++) {
          await new Promise((r) => setTimeout(r, 50));
        }
      })();
      try {
        const mwDone = (async () => {
          await mw(req, res, () => {
            // simulate route handler: respond async after 20ms
            setTimeout(() => {
              res.status(200).json({ status: 'alive' });
            }, 20);
          });
        })();
        await Promise.race([watch, mwDone.then(() => watch)]);
        // small drain for res.end side effects
        await new Promise((r) => setTimeout(r, 100));
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          results.push(
            `${res.state.tag}:done json=${res.state.jsonCalls} end=${res.state.endCalls} body=${JSON.stringify(res.state.body)}`
          );
        }
      } catch (e: any) {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          results.push(`${res.state.tag}:ERROR ${e.message}`);
        }
      }
    })
  );
  // allow pending async work to settle
  await new Promise((r) => setTimeout(r, 6000));
  results.sort();
  results.forEach((r) => console.log(r));
  process.exit(0);
}

main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
