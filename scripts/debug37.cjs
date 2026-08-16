const fs = require('fs');
const t = fs.readFileSync('dist/assets/index-CwBPT2vl.js', 'utf8');
const i = t.indexOf('"Online"');
console.log(JSON.stringify(t.slice(i - 200, i + 40)));
const unescapeJs = s => s.replace(/\\(u([0-9a-fA-F]{4}))/g, (m, a, h) => String.fromCharCode(parseInt(h, 16)));
// extract the quoted literal directly before ":Online" pattern
const before = t.slice(0, i);
const lastQ = before.lastIndexOf('"');
const litStart = before.lastIndexOf('"', lastQ - 1);
const lit = before.slice(litStart + 1, lastQ);
console.log('literal:', JSON.stringify(unescapeJs(lit)));
// Offline
const j = t.indexOf('"Offline"');
const before2 = t.slice(0, j);
const l2 = before2.lastIndexOf('"');
const l1 = before2.lastIndexOf('"', l2 - 1);
console.log('offline literal:', JSON.stringify(unescapeJs(before2.slice(l1 + 1, l2))));