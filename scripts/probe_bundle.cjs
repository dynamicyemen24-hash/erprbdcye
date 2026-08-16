// probe_bundle.cjs — for a set of corrupted token patterns (regExp, '?'->'.'), list bundle strings matching them
const { extractAllStrings } = require('./restore_match_core.cjs');
const fs = require('fs');
const paths = process.argv.slice(2);
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const all = extractAllStrings(chunkTxt).map(x => x.s);
console.log('total strings:', all.length);
for (const p of paths) {
  const re = new RegExp('^' + p.split('').map(c => c === '?' ? '.' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + '$');
  const hits = all.filter(s => re.test(s));
  console.log('\nPATTERN', JSON.stringify(p), '->', hits.length, 'hits');
  for (const h of hits.slice(0, 8)) console.log('  ', JSON.stringify(h), 'len', h.length);
}