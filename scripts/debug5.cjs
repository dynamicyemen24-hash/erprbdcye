// debug5: precise numeric comparison, no console eyeballing
const fs = require('fs');
const { tokenize, extractChunkStrings, AR } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/GlobalEnterpriseHeader.tsx', 'utf8');
const js = fs.readFileSync('dist/assets/index-CwBPT2vl.js', 'utf8');
const strings = extractChunkStrings(js);
const tokens = tokenize(src).filter(t => /\?{2,}/.test(t.content));

const map = [908,909,910,911,912,913,914,915,916,917,918,919,920,921];
tokens.forEach((t, i) => {
  const trueS = strings[map[i]];
  const runs = (t.content.match(/\?+/g) || []).map(r => r.length);
  console.log('t' + i, 'tokLen=' + t.content.length,
    'trueLen=' + (trueS ? trueS.length : '?'),
    'runs=' + JSON.stringify(runs),
    'qCount=' + (t.content.match(/\?/g) || []).length,
    'true=' + (trueS ? JSON.stringify(trueS.slice(0, 30)) : '?'));
});
// sanity: what does the damaged file actually contain at token0 region?
const t0 = tokens[0];
const region = src.slice(t0.start - 10, t0.start + t0.len + 5);
console.log('region bytes:', JSON.stringify(region));
console.log('region charcode sample:', Array.from(region, c => c.charCodeAt(0)).join(','));