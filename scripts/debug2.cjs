// debug2: exact chain analysis for GlobalEnterpriseHeader
const fs = require('fs');
const { tokenize, extractChunkStrings } = require('./restore_match_core.cjs');

const src = fs.readFileSync('src/components/GlobalEnterpriseHeader.tsx', 'utf8');
const js = fs.readFileSync('dist/assets/index-CwBPT2vl.js', 'utf8');
const strings = extractChunkStrings(js);

const all = tokenize(src);
const tokens = all.filter(t => isDamagedQuick(t));
function isDamagedQuick(t) { return !!t.content.match(/\?{2,}/g); }
console.log('damaged tokens:', tokens.length);

const AR = /[\u0600-\u06FF\u0750-\u077F]/;
function matchesAt(tok, s) {
  if (s.length !== tok.len) return false;
  const content = tok.content;
  // fixed chars equal + every len>=2 run maps to Arabic
  let runStart = -1;
  for (let p = 0; p <= content.length; p++) {
    const isQ = content[p] === '?';
    if (isQ && runStart === -1) runStart = p;
    if ((!isQ || p === content.length) && runStart !== -1) {
      if (p - runStart >= 2) {
        for (let k = runStart; k < p; k++) {
          if (!AR.test(s[k])) return false;
        }
      }
      runStart = -1;
    }
    if (!isQ && p < content.length) {
      if (content[p] !== s[p]) return false;
    }
  }
  return true;
}

const cands = tokens.map(t => {
  const hits = [];
  for (let j = 0; j < strings.length; j++) if (matchesAt(t, strings[j])) hits.push(j);
  return hits;
});
console.log('candidate counts:', cands.map(c => c.length).join(','));

// find longest chain of consecutive indices (i+1)
let best = [];
const memo = new Map();
function solve(i) {
  if (i >= tokens.length) return 0;
  const key = i + ':' + (bestChainKey ? '' : '');
  return bestChain(i, -1);
}
let bestChainRes = [];
function bestChain(i, prev) {
  if (i >= tokens.length) return [];
  if (prev !== -1 && prev + 1 !== undefined) {
    // we only care about strict consecutive growth: candidate must equal prev+1
  }
  const list = cands[i];
  let bestLen = 0, bestRes = [];
  for (const v of list) {
    if (v === prev + 1) {
      const after = bestChain(i + 1, v);
      if (1 + after.length > bestLen) { bestLen = 1 + after.length; bestRes = [v, ...after]; }
    }
  }
  if (prev === -1) {
    // start anywhere
    for (const v of list) {
      const after = bestChain(i + 1, v);
      if (1 + after.length > bestLen) { bestLen = 1 + after.length; bestRes = [v, ...after]; }
    }
  }
  return bestRes;
}
const chain = bestChain(0, -1);
console.log('longest consecutive-chunk chain:', chain.length, '/', tokens.length);
console.log('chain indices:', JSON.stringify(chain.slice(0, 40)));
if (chain.length >= 3) {
  const start = chain[0];
  console.log('=== window mapping (first 10) ===');
  for (let k = 0; k < Math.min(10, tokens.length); k++) {
    console.log(k, JSON.stringify(tokens[k].content), '=>', JSON.stringify(strings[start + k]));
  }
}