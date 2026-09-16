// Boot probe: starts dist/server.cjs, waits, hits health endpoints, kills it.
const { spawn } = require('child_process');
const WAIT_MS = parseInt(process.env.BOOT_WAIT_MS || '35000', 10);
const PORT = process.env.PORT || '3000';

const child = spawn('node', ['dist/server.cjs'], { cwd: process.cwd() });
let out = '';
let err = '';
child.stdout.on('data', (d) => { out += d.toString(); });
child.stderr.on('data', (d) => { err += d.toString(); });

async function probe(path) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    const r = await fetch(`http://localhost:${PORT}${path}`, { signal: ctl.signal });
    clearTimeout(t);
    const body = await r.text();
    return { status: r.status, body: body.slice(0, 600) };
  } catch (e) {
    return { status: 'ERR', body: String(e.message || e).slice(0, 200) };
  }
}

(async () => {
  await new Promise((r) => setTimeout(r, WAIT_MS));
  const alive = child.exitCode === null && child.signalCode === null;
  console.log('ALIVE=' + alive, 'exitCode=' + child.exitCode);
  for (const p of ['/api/v2/health/liveness', '/api/v2/health/readiness', '/api/health/liveness', '/metrics']) {
    const res = await probe(p);
    console.log('PROBE', p, '->', res.status);
    console.log(res.body.slice(0, 300));
  }
  child.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 4000));
  try { child.kill('SIGKILL'); } catch {}
  console.log('---STDOUT-tail---');
  console.log(out.slice(-3000));
  console.log('---STDERR-tail---');
  console.log(err.slice(-1500));
  process.exit(0);
})();
