// fix_bilingual.cjs — fix wrong DP-restored Arabics in the given files using bundle pairings
const fs = require('fs');
const path = require('path');
const { tokenize } = require('./restore_match_core.cjs');

const FILES = process.argv.slice(2);
if (!FILES.length) { console.error('usage: node scripts/fix_bilingual.cjs file...'); process.exit(1); }

const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const unescapeJs = s => s.replace(/\\(u([0-9a-fA-F]{4})|u\{([0-9a-fA-F]+)\}|n|t|r)/g, (m, u4, h4, hb) => u4 ? String.fromCharCode(parseInt(h4 || hb, 16)) : m[1]);

const pair = new Map();
const re = /(\?|:)(\s*)"((?:\\.|[^"])*)":\s*"((?:\\.|[^"])*)"/g;
let mm;
while ((mm = re.exec(chunkTxt))) {
  if (mm[1] !== '?') continue;
  const p = unescapeJs(mm[3]);
  const n = unescapeJs(mm[4]);
  if (!pair.has(n)) pair.set(n, []);
  pair.get(n).push(p);
}

let fixed = 0;
for (const file of FILES) {
  const src = fs.readFileSync(file, 'utf8');
  let out = src;
  let changes = 0;
  const pats = [
    /\{\s*isRtl\s*\?\s*'([^']*)'\s*:\s*'([^']*)'\s*\}/g,
    /\(\s*isRtl\s*\?\s*'([^']*)'\s*:\s*'([^']*)'\s*\)/g,
    /\{\s*isRtl\s*\?\s*`([^`]*)`\s*:\s*`([^`]*)`\s*\}/g
  ];
  const escapeSingle = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  for (const pat of pats) {
    pat.lastIndex = 0;
    let m;
    while ((m = pat.exec(out))) {
      const ar = m[1], en = m[2];
      const set = pair.get(en);
      if (!set || set.includes(ar)) continue;
      const best = set[0];
      const rebuilt = m[0].replace(ar, escapeSingle(best));
      if (rebuilt === m[0]) continue;
      out = out.slice(0, m.index) + rebuilt + out.slice(m.index + m[0].length);
      pat.lastIndex = m.index + rebuilt.length;
      console.log('FIX', path.relative('', file).replace(/\\/g, '/'), JSON.stringify(ar) + ' -> ' + JSON.stringify(best), '(EN=' + JSON.stringify(en) + ')');
      changes++;
    }
  }
  if (changes) fs.writeFileSync(file, out);
  fixed += changes;
}
console.log('total fixes:', fixed);