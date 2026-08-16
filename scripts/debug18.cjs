// debug18: full list — pair positions and order for the English probes
const fs = require('fs');
const { extractChunkStrings, AR } = require('./restore_match_core.cjs');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const all = extractAll(chunkTxt);
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
console.log('total strings:', all.length, 'arabic:', all.filter(x => x.isAr).length);
const probes = ['Planning & Setting Goals', 'التخطيط وتحديد الأهداف', 'Introductory Video', 'System Overview', 'Universal Enterprise OS'];
for (const p of probes) {
  const idxs = [];
  all.forEach((x, i) => { if (x.s === p) idxs.push(i); });
  console.log(JSON.stringify(p), '=>', idxs.slice(0, 6).join(','), 'count=' + idxs.length);
  if (idxs.length) {
    const i = idxs[0];
    for (let k = i - 2; k <= i + 2; k++) {
      if (k >= 0 && k < all.length) console.log('   ' + k, all[k].isAr ? 'AR' : 'EN', JSON.stringify(all[k].s.slice(0, 40)));
    }
  }
}