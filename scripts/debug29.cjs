// debug29: trace tpl pass on AboutSystemModal
const fs = require('fs');
const { tokenize, extractAllStrings, allowAtQmark } = require('./restore_match_core.cjs');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const allStrings = extractAllStrings(chunkTxt);
const strings = allStrings.map(x => x.s);
const bset = new Set(strings);
const bundledIdx = new Map();
allStrings.forEach((s, c) => { if (!bundledIdx.has(s)) bundledIdx.set(s, c); });
const idxOfBundled = (content) => bundledIdx.get(content) === undefined ? -1 : bundledIdx.get(content);
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');

const allTokens = tokenize(src);
const tplToks = allTokens.filter(t => t.type === 'tpl');
console.log('tpl tokens:', tplToks.length);
tplToks.forEach((t, k) => {
  const region = src.slice(t.start, t.start + t.len);
  const innerAll = tokenize(region);
  if (!innerAll.length) { console.log('TPL#' + k, 'len=' + t.len, 'no strings'); return; }
  const ownIdxs = innerAll.map(inn => idxOfBundled(inn.content));
  const damaged = innerAll.filter(x => /\?{2,}/.test(x.content));
  console.log('TPL#' + k, 'len=' + t.len, 'inner=' + innerAll.length, 'damaged=' + damaged.length,
    'ownIdxs=' + JSON.stringify(ownIdxs.slice(0, 14)));
});

function matchOk(tok, s) {
  if (s.length !== tok.len) return false;
  const content = tok.content;
  let runStart = -1;
  for (let p = 0; p <= content.length; p++) {
    const isQ = content[p] === '?';
    if (isQ && runStart === -1) runStart = p;
    if ((!isQ || p === content.length) && runStart !== -1) {
      if (p - runStart >= 2) {
        for (let k = runStart; k < p; k++) if (!allowAtQmark(s[k])) return false;
      }
      runStart = -1;
    }
    if (!isQ && p < content.length && content[p] !== s[p]) return false;
  }
  return true;
}

// examine the giant(s) containing line 356 and 501
const l = src.split('\n');
let line356pos = -1, acc = 0;
for (let i = 0; i < l.length; i++) { const w = l[i].length; if (i === 355) line356pos = acc + l[i].indexOf('????? '); acc += w + 1; }
console.log('line356 pos', line356pos);
tplToks.forEach((t, k) => {
  if (line356pos > t.start && line356pos < t.start + t.len) {
    console.log('line356 in TPL#' + k);
    const region = src.slice(t.start, t.start + t.len);
    const innerAll = tokenize(region);
    const ownIdxs = innerAll.map(inn => idxOfBundled(inn.content));
    const runStart = ownIdxs[0];
    let runIntact = ownIdxs.every(x => x >= 0);
    for (let k2 = 1; runIntact && k2 < ownIdxs.length; k2++) if (ownIdxs[k2] !== runStart + k2) runIntact = false;
    console.log('  runIntact:', runIntact, 'damaged:', innerAll.filter(x => /\?{2,}/.test(x.content)).length);
    innerAll.forEach((inn, k3) => {
      console.log('   slot' + k3, inn.start, 'own=' + ownIdxs[k3], 'len=' + inn.len,
        JSON.stringify(inn.content.slice(0, 40)), ownIdxs[k3] >= 0 ? JSON.stringify(strings[ownIdxs[k3]].slice(0, 40)) : '');
    });
  }
});