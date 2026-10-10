// Live health check for the production site (no DB credentials needed).
const { liveBaseUrl } = require('./config');

const targets = ['', '/api/v2/health/liveness', '/api/v2/health/readiness'];

(async () => {
  console.log(`[LIVE] Probe: ${liveBaseUrl}`);
  let failed = 0;
  for (const t of targets) {
    const url = liveBaseUrl + (t || '/');
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
      const body = (await res.text()).slice(0, 200).replace(/\s+/g, ' ');
      const ok = (res.status >= 200 && res.status < 300) ? 'OK  ' : 'FAIL';
      if (!(res.status >= 200 && res.status < 300)) failed++;
      console.log(`  ${ok} ${res.status} ${url} :: ${body.slice(0, 120)}`);
    } catch (err) {
      failed++;
      const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
      const msg = timedOut ? 'timeout after 8s' : (err && err.message) || String(err);
      console.log(`  FAIL ${url} :: ${msg}`);
    }
  }
  if (failed > 0) {
    console.log(`\n[FAIL] ${failed}/${targets.length} live endpoints degraded/unreachable`);
    process.exitCode = 1;
  } else {
    console.log('\n[PASS] Live site reachable');
  }
})();
