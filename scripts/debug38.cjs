const fs = require('fs');
const t = fs.readFileSync('dist/assets/index-CwBPT2vl.js', 'utf8');
const unescapeJs = s => s.replace(/\\(u([0-9a-fA-F]{4}))/g, (m, a, h) => String.fromCharCode(parseInt(h, 16)));
const i = t.indexOf('all in one place');
console.log('reporting:', i >= 0 ? JSON.stringify(t.slice(i - 140, i + 60)) : 'NF');
const j = t.indexOf('text-amber-400');
console.log('amber:', j >= 0 ? JSON.stringify(t.slice(j - 120, j + 140)) : 'NF');
const k = t.indexOf('"Enterprise"');
console.log('enterprise:', k >= 0 ? JSON.stringify(t.slice(k - 140, k + 40)) : 'NF');