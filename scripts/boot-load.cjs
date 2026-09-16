// Boot server (built bundle), wait for readiness, run load baseline, shut down.
const { spawn } = require('child_process');
const PORT = process.env.PORT || '3000';
const MAX_WAIT_MS = parseInt(process.env.BOOT_MAX_WAIT_MS || '480000', 10);

const fs = require('fs');
const logStream = fs.createWriteStream('server-load.log', { flags: 'w' });
const child = spawn('node', ['dist/server.cjs'], { cwd: process.cwd() });
child.stdout.on('data', (d) => logStream.write(d));
child.stderr.on('data', (d) => logStream.write(d));

async function ready() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 10000);
    const host = process.env.LOAD_HOST || '127.0.0.1';
    const r = await fetch(`http://${host}:${PORT}/api/v2/health/readiness`, { signal: ctl.signal });
    clearTimeout(t);
    return r.status === 200;
  } catch {
    return false;
  }
}

(async () => {
  const start = Date.now();
  let ok = false;
  while (Date.now() - start < MAX_WAIT_MS) {
    if (child.exitCode !== null) {
      console.log('SERVER-EXITED-EARLY code=' + child.exitCode);
      process.exit(2);
    }
    if (await ready()) {
      ok = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
  console.log('boot-to-ready ms=' + (Date.now() - start) + ' ready=' + ok);
  if (!ok) {
    child.kill('SIGKILL');
    process.exit(2);
  }
  try {
    // 127.0.0.1 explicit: bypasses undici Happy-Eyeballs ::1-first stalls when
    // the server binds IPv4-only ("0.0.0.0"). localhost would false-positive.
    // CRITICAL: the client MUST be spawned async (never execSync). execSync
    // freezes this parent's event loop -> the server child's stdout pipe stops
    // draining -> on Windows a full pipe synchronously blocks the server's
    // main thread on stdout writes -> every in-flight request hangs. That was
    // a harness artifact, not a server defect.
    const host = process.env.LOAD_HOST || '127.0.0.1';
    const run = (cmd) =>
      new Promise((resolve) => {
        const c = spawn('node', cmd, { stdio: 'inherit' });
        c.on('exit', (code) => resolve(code));
      });
    if (process.env.PROBE_CLIENT === '1') {
      await run(['scripts/probe-client.cjs', `http://${host}:${PORT}`, process.env.LOAD_CONCURRENCY || '20']);
    } else {
      await run(['scripts/load-baseline.cjs', `http://${host}:${PORT}`]);
    }
  } finally {
    child.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 4000));
    try {
      child.kill('SIGKILL');
    } catch {}
  }
  process.exit(0);
})();
