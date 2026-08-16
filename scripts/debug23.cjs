// debug23: tpl pass for ChartContainer
const fs = require('fs');
const { tokenize, extractAllStrings, allowAtQmark } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/enterprise/charts/ChartContainer.tsx', 'utf8');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const strings = extractAllStrings(chunkTxt).map(x => x.s);
const tokens = tokenize(src).filter(t => /\?{2,}/.test(t.content));
const t = tokens[0];
const region = src.slice(t.start, t.start + t.len);
const inner = tokenize(region);
const damaged = inner.filter(x => /\?{2,}/.test(x.content));
console.log('inner total:', inner.length, 'damaged:', damaged.length);
damaged.forEach((d, i) => console.log('  d' + i, d.type, 'len=' + d.len, JSON.stringify(d.content.slice(0, 60))));
// show where the '?'s are in the region
const qi = [];
for (let p = 0; p < region.length; p++) if (region[p] === '?') qi.push(p);
console.log('? positions:', qi.length);
// cluster the ? positions
let prev = -2;
const clusters = [];
for (const p of qi) {
  if (p > prev + 1) clusters.push([p]);
  else clusters[clusters.length - 1].push(p);
  prev = p;
}
console.log('clusters:', JSON.stringify(clusters.slice(0, 20).map(c => [c[0], c.length])));
clusters.forEach((c, idx) => {
  if (c.length >= 2) {
    const s = region.slice(c[0] - 3, c[0] + 40);
    console.log('cluster', idx, 'size=' + c.length, JSON.stringify(s));
  }
});