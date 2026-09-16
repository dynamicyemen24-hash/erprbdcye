const fs = require('fs');
const path = require('path');
const pats = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /AIza[A-Za-z0-9_-]{30,}/,
  /npg_[A-Za-z0-9]+/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /postgresql:\/\/[^:]+:[^@]+@/,
];
const skipDirs = new Set(['node_modules', '.git', 'dist', 'logs', 'playwright-report', '.vercel']);
let hits = 0;
function walk(p) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p)) {
      if (skipDirs.has(e)) continue;
      walk(path.join(p, e));
    }
    return;
  }
  if (!/\.(ts|tsx|js|json|md|yml|yaml|sql)$/.test(p)) return;
  if (path.basename(p) === 'package-lock.json') return;
  let t = '';
  try {
    t = fs.readFileSync(p, 'utf8');
  } catch {
    return;
  }
  pats.forEach((re, i) => {
    const m = t.match(re);
    if (m) {
      hits++;
      console.log('HIT', i, p, JSON.stringify(m[0]).slice(0, 70));
    }
  });
}
['src', 'api', 'server.ts', 'migrations', 'scripts', 'render.yaml', 'docker-compose.yml', '.env.example'].forEach(walk);
console.log('done hits=' + hits);
process.exit(hits > 0 ? 1 : 0);
