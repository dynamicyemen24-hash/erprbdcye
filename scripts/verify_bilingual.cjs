// verify_bilingual.cjs — for every {isRtl ? 'AR' : 'EN'} in src, compare with the bundle's preceding literal
const fs = require('fs');
const path = require('path');
const { tokenize } = require('./restore_match_core.cjs');

const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const unescapeJs = s => s.replace(/\\(u([0-9a-fA-F]{4})|u\{([0-9a-fA-F]+)\}|n|t|r)/g, (m, u4, h4, hb) => u4 ? String.fromCharCode(parseInt(h4 || hb, 16)) : m[1]);

const pair = new Map(); // EN -> Set of paired Arabics
const re = /(\?|:)(\s*)"((?:\\.|[^"])*)":\s*"((?:\\.|[^"])*)"/g;
let mm;
while ((mm = re.exec(chunkTxt))) {
  if (mm[1] !== '?') continue;
  const p = unescapeJs(mm[3]);
  const n = unescapeJs(mm[4]);
  if (!pair.has(n)) pair.set(n, new Set());
  pair.get(n).add(p);
}

// now scan src files
function glob(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!/^(node_modules|dist|\.git|scripts|app|assets|%LOCALAPPDATA%)$/.test(e.name)) glob(full, out);
    } else if (/\.(tsx|ts|jsx)$/.test(e.name)) out.push(full);
  }
  return out;
}
const files = glob('src');
let issues = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /\{\s*isRtl\s*\?\s*'([^']*)'\s*:\s*'([^']*)'\s*\}/g;
  const re2 = /\(\s*isRtl\s*\?\s*'([^']*)'\s*:\s*'([^']*)'\s*\)/g;
  const re3 = /\{\s*isRtl\s*\?\s*`([^`]*)`\s*:\s*`([^`]*)`\s*\}/g;
  let mm;
  const check = (ar, en, pos) => {
    const set = pair.get(en);
    if (set && !set.has(ar)) {
      issues++;
      console.log('MISMATCH', path.relative('', file).replace(/\\/g, '/') + ':' + lineOf(src, pos),
        'EN=' + JSON.stringify(en) + ' srcAR=' + JSON.stringify(ar) + ' bundleARs=' + JSON.stringify([...set]));
    }
  };
  for (const rg of [re, re2, re3]) {
    while ((mm = rg.exec(src))) check(mm[1], mm[2], mm.index);
  }
}
console.log('total issues:', issues);

function lineOf(src, pos) { return src.slice(0, pos).split('\n').length; }