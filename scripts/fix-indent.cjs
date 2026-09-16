const fs = require('fs');
const p = 'src/server/routes/v2/tables.routes.ts';
let t = fs.readFileSync(p, 'utf8');
const before = [
  '    const cacheOrg = req.user?.org_id || req.user?.orgId;',
  'if (cacheOrg) {',
  '  apiCache.delete(`dashboard-stats:${cacheOrg}`);',
  '  apiCache.delete(`consolidated-kpis:${cacheOrg}`);',
  '}',
].join('\n');
const after = [
  '    const cacheOrg = req.user?.org_id || req.user?.orgId;',
  '    if (cacheOrg) {',
  '      apiCache.delete(`dashboard-stats:${cacheOrg}`);',
  '      apiCache.delete(`consolidated-kpis:${cacheOrg}`);',
  '    }',
].join('\n');
const n = t.split(before).length - 1;
t = t.split(before).join(after);
fs.writeFileSync(p, t, { encoding: 'utf8' });
console.log('fixed blocks:', n);
