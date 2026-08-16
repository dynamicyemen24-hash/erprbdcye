// debug19: neighbors of the 🚀-anchor and the AboutSystemModal title array region
const fs = require('fs');
const { AR } = require('./restore_match_core.cjs');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
function extractAll(js) {
  const out = [];
  let i = 0, n = js.length;
  while (i < n) {
    const ch = js[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1, lit = '';
      while (j < n) {
        const c = js[j];
        if (c === '\\') { lit += js[j + 1] || ''; j += 2; continue; }
        if (c === q) { j++; break; }
        if (c === '\n') break;
        lit += c; j++;
      }
      out.push({ s: lit, isAr: AR.test(lit) });
      i = j; continue;
    }
    i++;
  }
  return out;
}
const all = extractAll(chunkTxt);
const idx = all.findIndex(x => x.s.includes('وضع الخطة'));
console.log('🚀 anchor at:', idx);
for (let k = idx - 4; k <= idx + 10; k++) {
  if (k >= 0 && k < all.length) console.log('   ' + k, all[k].isAr ? 'AR' : 'EN', JSON.stringify(all[k].s.slice(0, 50)));
}
// also search for any string containing 'الأهداف'
all.forEach((x, i) => { if (x.s.includes('الأهداف') && x.isAr) console.log('AR goals:', i, JSON.stringify(x.s)); });