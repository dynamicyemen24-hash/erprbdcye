// Client-identity isolation: same load, two different HTTP clients.
// Usage: node scripts/probe-client.cjs <baseUrl> [width] [rounds]
// Prints one histogram per client. Exits 1 only if the RAW http/1.1 client
// (agent keepAlive, unlimited sockets) also stalls — proving a server defect.
const http = require('http');
const BASE = process.argv[2] || 'http://127.0.0.1:3000';
const WIDTH = parseInt(process.argv[3] || '20', 10);
const ROUNDS = parseInt(process.argv[4] || '10', 10);
const PATH = process.env.PROBE_PATH || '/api/health/liveness';
const TIMEOUT_MS = 15000;

async function fetchBurst() {
  const hist = {};
  const t0 = Date.now();
  for (let r = 0; r < ROUNDS; r++) {
    const res = await Promise.all(
      Array.from({ length: WIDTH }, () =>
        fetch(BASE + PATH).then((x) => x.text().then(() => x.status)).catch((e) => 'T:' + String(e.name || e.message))
      )
    );
    for (const s of res) hist[s] = (hist[s] || 0) + 1;
  }
  return { client: 'undici-fetch', hist, ms: Date.now() - t0 };
}

function rawHit(agent) {
  return new Promise((resolve) => {
    const req = http.request(BASE + PATH, { agent }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error('client-timeout'));
    });
    req.on('error', (e) => resolve('T:' + (e.code || e.message)));
    req.end();
  });
}

async function rawBurst() {
  const agent = new http.Agent({ keepAlive: true, maxSockets: 128 });
  const hist = {};
  const t0 = Date.now();
  for (let r = 0; r < ROUNDS; r++) {
    const res = await Promise.all(Array.from({ length: WIDTH }, () => rawHit(agent)));
    for (const s of res) hist[s] = (hist[s] || 0) + 1;
  }
  agent.destroy();
  return { client: 'raw-http1-agent', hist, ms: Date.now() - t0 };
}

(async () => {
  // warmup both
  await fetch(BASE + PATH).then((r) => r.text()).catch(() => {});
  await rawHit(new http.Agent()).catch?.() ?? (await Promise.resolve());
  const a = await fetchBurst();
  console.log(a.client, JSON.stringify(a.hist), a.ms + 'ms');
  const b = await rawBurst();
  console.log(b.client, JSON.stringify(b.hist), b.ms + 'ms');
  const rawBad = Object.keys(b.hist).some((k) => k.startsWith('T:') || k === '500');
  console.log(rawBad ? 'SERVER-DEFECT-CONFIRMED' : 'CLIENT-ARTIFACT-ONLY');
  process.exit(rawBad ? 1 : 0);
})();
