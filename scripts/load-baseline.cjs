// Load baseline: latency distribution + burst correctness vs local server.
// Usage: node scripts/load-baseline.cjs [baseUrl]
// Exit non-zero if any response is 500 or a connection drops.
require('dotenv').config();
const BASE = process.argv[2] || 'http://localhost:3000';

async function hit(path, timeoutMs = 15000) {
  const t0 = process.hrtime.bigint();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    // LOAD_CONN=close disables keep-alive reuse (diagnoses stale-socket hangs)
    const headers = process.env.LOAD_CONN === 'close' ? { connection: 'close' } : {};
    const r = await fetch(BASE + path, { signal: ctl.signal, headers });
    await r.text();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    return { status: r.status, ms };
  } catch (e) {
    return { status: e.name === 'AbortError' ? 'TIMEOUT' : 'ERR', ms: -1, error: String(e.message || e).slice(0, 80) };
  } finally {
    clearTimeout(timer);
  }
}

function pct(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

(async () => {
  // Warmup
  for (let i = 0; i < 5; i++) await hit('/api/v2/health/liveness');

  // Sequential latency sample
  const lat = [];
  let bad = 0;
  for (let i = 0; i < 200; i++) {
    const r = await hit('/api/v2/health/liveness');
    if (r.status === 500 || r.status === 'ERR') bad++;
    else lat.push(r.ms);
  }
  lat.sort((a, b) => a - b);
  console.log(`liveness n=${lat.length} bad=${bad}`);
  console.log(`  min=${lat[0].toFixed(1)}ms p50=${pct(lat, 50).toFixed(1)}ms p95=${pct(lat, 95).toFixed(1)}ms p99=${pct(lat, 99).toFixed(1)}ms max=${lat[lat.length - 1].toFixed(1)}ms`);

  // Concurrent burst: 20 parallel x 10 rounds over mixed endpoints.
  // LOAD_PATHS env overrides the set (comma-separated) for fault isolation.
  const paths = (process.env.LOAD_PATHS || '/api/v2/health/liveness,/api/health/liveness,/api/does-not-exist-xyz')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  let burstBad = 0;
  let burstTotal = 0;
  const histogram = {};
  const t0 = Date.now();
  // LOAD_CONCURRENCY env tunes parallel width for threshold hunting.
  const width = Math.max(1, parseInt(process.env.LOAD_CONCURRENCY || '20', 10));
  for (let round = 0; round < 10; round++) {
    const jobs = [];
    const per = Math.max(1, Math.floor(width / paths.length));
    for (const p of paths) for (let k = 0; k < per; k++) jobs.push([p, hit(p)]);
    const results = await Promise.all(jobs.slice(0, width).map(([, pr]) => pr));
    for (const r of results) {
      burstTotal++;
      const key = String(r.status) + (r.error ? ':' + r.error.slice(0, 60) : '');
      histogram[key] = (histogram[key] || 0) + 1;
      if (r.status === 500 || r.status === 'ERR') burstBad++;
    }
  }
  const secs = (Date.now() - t0) / 1000;
  console.log(`burst n=${burstTotal} bad=${burstBad} elapsed=${secs.toFixed(1)}s rps=${(burstTotal / secs).toFixed(1)}`);
  console.log('histogram:', JSON.stringify(histogram));

  // Readiness (DB-backed) latency
  const r = await hit('/api/v2/health/readiness');
  console.log(`readiness status=${r.status} ms=${r.ms >= 0 ? r.ms.toFixed(1) : 'ERR'}`);

  const badStatuses = Object.keys(histogram).filter(
    (k) => k.startsWith('500') || k === 'ERR' || k === 'TIMEOUT'
  );
  if (bad > 0 || burstBad > 0 || badStatuses.length > 0) {
    console.log('LOAD-FAIL: uncontrolled errors under load');
    process.exit(1);
  }
  console.log('LOAD-OK');
})();
