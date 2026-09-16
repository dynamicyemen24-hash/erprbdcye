// One-shot: tenant-scope dashboard cache invalidation in tables.routes.ts.
const fs = require('fs');
const p = 'src/server/routes/v2/tables.routes.ts';
let t = fs.readFileSync(p, 'utf8');
const dash = "apiCache.delete('dashboard-stats');";
const kpi = "apiCache.delete('consolidated-kpis');";
console.log('dash-count:', t.split(dash).length - 1, 'kpi-count:', t.split(kpi).length - 1);
const replacement = [
  'const cacheOrg = req.user?.org_id || req.user?.orgId;',
  'if (cacheOrg) {',
  "  apiCache.delete(`dashboard-stats:${cacheOrg}`);",
  "  apiCache.delete(`consolidated-kpis:${cacheOrg}`);",
  '}',
].join('\n');
t = t.split(dash).join('// (tenant-scoped invalidation below)');
t = t.split(kpi).join('');
// collapse the leftover comment/blank pairs into the single block
t = t.replace(
  /\/\/ \(tenant-scoped invalidation below\)\s*\n\s*\n/g,
  replacement + '\n'
);
fs.writeFileSync(p, t, { encoding: 'utf8' });
console.log('patched');
