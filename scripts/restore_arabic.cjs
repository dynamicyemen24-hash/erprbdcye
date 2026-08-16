// restore_arabic.cjs — restore corrupted Arabic/emoji ('?'-damaged) strings in source files
// using the pre-corruption dist bundle as ground truth.
// Usage:
//   node scripts/restore_arabic.cjs --dry-run [files...]
//   node scripts/restore_arabic.cjs [--verbose] [files...]
'use strict';
const fs = require('fs');
const path = require('path');
const { tokenize, extractAllStrings, allowAtQmark, unescapeJs } = require('./restore_match_core.cjs');

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const PARTIAL = args.includes('--partial');
const FILES = args.filter(a => !a.startsWith('--'));
const DEFAULT_GLOB = 'src/**/*.{ts,tsx,js,jsx}';
const MIN_COVERAGE = 0.85;

function glob(dir, pattern, out = []) {
  const toRegex = (pat) => {
    const braceParts = pat.split(/(\{[^}]*\})/g);
    let body = '';
    for (const part of braceParts) {
      if (/^\{[^}]*\}$/.test(part)) {
        body += '(' + part.slice(1, -1).split(',').map(alt =>
          alt.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\//g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '(?:.*/)?')
        ).join('|') + ')';
      } else {
        body += part.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\//g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '(?:.*/)?');
      }
    }
    return new RegExp('^' + body + '$');
  };
  const re = toRegex(pattern);
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        if (!/^(node_modules|dist|\.git|scripts|app|assets|%LOCALAPPDATA%)$/.test(e.name)) walk(full);
      } else if (re.test(path.relative(dir, full).replace(/\\/g, '/'))) out.push(full);
    }
  })(dir);
  return out;
}

function findChunkAssets() {
  const dist = path.join('dist', 'assets');
  if (!fs.existsSync(dist)) return [];
  return fs.readdirSync(dist).filter(f => /\.js$/.test(f)).map(f => path.join(dist, f));
}

function matchOk(tok, s) {
  if (s.length !== tok.dLen) return false;
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

// decode escapes in token content so it can be compared against the
// (already decoded) bundle strings; keep raw len for span substitution
function decodeToks(tokens) {
  for (const t of tokens) {
    t.content = unescapeJs(t.content);
    t.dLen = t.content.length;
  }
  return tokens;
}

function isDamagedInSrc(tok, src, bundleSet) {
  if (!/\?{2,}/.test(tok.content)) return false;
  if (bundleSet && bundleSet.has(tok.content)) return false;
  return true;
}

// monotone alignment: tokens in order map to strictly increasing chunk indices,
// skipping tokens with no plausible candidate (gaps allowed).
function align(tokens, strings, lo = -1, hi = Infinity) {
  const byLen = new Map();
  strings.forEach((s, c) => {
    if (c <= lo || c >= hi) return;
    const b = byLen.get(s.length) || [];
    b.push(c);
    byLen.set(s.length, b);
  });

  const n = tokens.length;
  if (n === 0) return [];

  const cands = tokens.map(t => {
    const b = byLen.get(t.dLen) || [];
    return b.filter(c => matchOk(t, strings[c])).sort((a, b) => a - b);
  });

  let carry = new Map();
  const created = [];
  for (let i = 0; i < n; i++) {
    const list = cands[i];
    const recs = [];
    if (list.length) {
      const newCarry = new Map(carry);
      for (const c of list) {
        let bestS = 0, prevC = -1, prevTok = -1;
        for (const [pc, pv] of carry) {
          if (pc < c && pv.s > bestS) { bestS = pv.s; prevC = pc; prevTok = pv.fromTok; }
        }
        const rec = { c, s: bestS + 1, prevC, prevTok };
        recs.push(rec);
        const old = newCarry.get(c);
        if (!old || rec.s > old.s) newCarry.set(c, { s: rec.s, fromTok: i });
      }
      carry = newCarry;
    }
    created.push(recs);
  }
  if (!carry.size) return [];

  let bestC = -1, bestS = 0;
  for (const [c, v] of carry) {
    if (v.s > bestS || (v.s === bestS && c > bestC)) { bestS = v.s; bestC = c; }
  }
  let bestTok = -1;
  for (let i = n - 1; i >= 0; i--) {
    for (const r of created[i]) {
      if (r.c === bestC && r.s === bestS) { bestTok = i; }
    }
    if (bestTok >= 0) break;
  }
  if (bestTok < 0) return [];

  const mapping = [];
  let tok = bestTok, c = bestC;
  while (tok >= 0) {
    const rec = created[tok].find(r => r.c === c);
    if (!rec) break;
    mapping.push({ tokIdx: tok, chunkIdx: c });
    if (rec.prevTok < 0) break;
    tok = rec.prevTok;
    c = rec.prevC;
  }
  mapping.reverse();
  return mapping;
}

// refine possible wrong picks for fully-corrupted (no discriminating chars)
// tokens: re-place them at the candidate closest to the chunk position implied
// by the surrounding strong anchors, while keeping strict monotonicity.
function refineProximity(tokens, mapping, strings) {
  const isStrong = (t) => /[^?]/.test(t.content);
  const strong = mapping.filter(m => isStrong(tokens[m.tokIdx]));
  if (!strong.length) return;

  const byTok = new Map(mapping.map(m => [m.tokIdx, m.chunkIdx]));
  const byLen = new Map();
  strings.forEach((s, c) => {
    const b = byLen.get(s.length) || [];
    b.push(c);
    byLen.set(s.length, b);
  });
  const spacing = (() => {
    if (strong.length >= 2) {
      const ds = strong[strong.length - 1].chunkIdx - strong[0].chunkIdx;
      const di = strong[strong.length - 1].tokIdx - strong[0].tokIdx;
      return di > 0 ? Math.max(1, ds / di) : 1;
    }
    return 1;
  })();

  mapping.forEach(m => {
    const t = tokens[m.tokIdx];
    if (isStrong(t) || !/\?{2,}/.test(t.content)) return;
    let ok, i = 0;
    for (; i < strong.length; i++) if (strong[i].tokIdx > m.tokIdx) break;
    const nextS = i < strong.length ? strong[i] : null;
    const prevS = i > 0 ? strong[i - 1] : null;
    let expected;
    if (prevS && nextS) {
      const span = nextS.tokIdx - prevS.tokIdx;
      expected = prevS.chunkIdx + (span > 0 ? (m.tokIdx - prevS.tokIdx) / span * (nextS.chunkIdx - prevS.chunkIdx) : 0);
    } else if (nextS) {
      expected = nextS.chunkIdx - (nextS.tokIdx - m.tokIdx) * spacing;
    } else {
      expected = prevS.chunkIdx + (m.tokIdx - prevS.tokIdx) * spacing;
    }
    const lo = prevS ? prevS.chunkIdx : -1;
    const hi = nextS ? nextS.chunkIdx : Infinity;
    const b = byLen.get(t.dLen) || [];
    let bestC = -1, bestD = Infinity;
    for (const c of b) {
      if (c <= lo || c >= hi) continue;
      if (!matchOk(t, strings[c])) continue;
      const d = Math.abs(c - expected);
      if (d < bestD) { bestD = d; bestC = c; }
    }
    if (bestC > 0 && bestC !== m.chunkIdx) m.chunkIdx = bestC;
  });
}

function escapeSingle(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// substitute (tokenIdx -> chunkIdx) pairs; returns {out, used}
function substitute(src, tokens, mapping, strings) {
  let out = src;
  const used = new Set();
  const pairs = mapping.slice().sort((a, b) => b.tokIdx - a.tokIdx);
  for (const m of pairs) {
    const t = tokens[m.tokIdx];
    if (used.has(t.start)) continue;
    used.add(t.start);
    out = out.slice(0, t.start) + escapeSingle(strings[m.chunkIdx]) + out.slice(t.start + t.len);
  }
  return { out, used };
}

function main() {
  const chunks = findChunkAssets();
  if (!chunks.length) { console.error('No dist/assets/*.js found. Build first.'); process.exit(1); }
  const chunkTxt = chunks.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const allStrings = extractAllStrings(chunkTxt);
  const strings = allStrings.map(x => x.s);
  const bundleSet = new Set(strings);
  console.log('bundle strings:', strings.length, '(arabic:', allStrings.filter(x => x.isAr).length + ')');

  let files = FILES;
  if (!files.length) {
    const cwd = process.cwd();
    files = glob(cwd, DEFAULT_GLOB);
  }

  let restored = 0, low = 0, skipped = 0;
  const bundledIdx = new Map();
  allStrings.forEach((s, c) => { if (!bundledIdx.has(s)) bundledIdx.set(s, c); });
  const idxOfBundled = (content) => bundledIdx.get(content) === undefined ? -1 : bundledIdx.get(content);

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const allTokens = decodeToks(tokenize(src));
    const tokens = allTokens.filter(t => isDamagedInSrc(t, src, bundleSet));
    const mapping = tokens.length ? align(tokens, strings) : [];
    if (tokens.length) refineProximity(tokens, mapping, strings);
    const matched = new Set(mapping.map(m => m.tokIdx));
    const matchedStarts = new Set(mapping.map(m => tokens[m.tokIdx].start));

    // pass 2: template-literal tokens containing inner damaged or misplaced
    // strings. Intact giants have strictly increasing own bundle indices
    // (bundle preserves source order); anything else needs the anchored DP +
    // contiguity-gap interpolation. Only slots whose current text differs from
    // the correct text are written.
    const tplExtra = [];
    let tplRecovered = 0;
    const tplToks = allTokens.filter(t => t.type === 'tpl');
    tplToks.forEach((t) => {
      if (matchedStarts.has(t.start)) return;
      const region = src.slice(t.start, t.start + t.len);
      const innerAll = decodeToks(tokenize(region));
      if (!innerAll.length) return;
      const ownIdxs = innerAll.map(inn => idxOfBundled(inn.content));
      const allInBundle = ownIdxs.every(x => x >= 0);
      let runStart = allInBundle ? ownIdxs[0] : -1;
      let runIntact = allInBundle;
      for (let k = 1; runIntact && k < ownIdxs.length; k++) {
        if (ownIdxs[k] !== runStart + k) runIntact = false;
      }
      const damagedPresent = innerAll.some(x => /\?{2,}/.test(x.content));
      if (runIntact && !damagedPresent) return;

      const lo = mapping.filter(m => tokens[m.tokIdx].start < t.start).reduce((a, m) => Math.max(a, m.chunkIdx), -1);
      const hi = mapping.filter(m => tokens[m.tokIdx].start > t.start).reduce((a, m) => Math.min(a, m.chunkIdx), Infinity);
      const sub = align(innerAll, strings, lo, hi);
      const subMap = new Map(sub.map(mm => [innerAll[mm.tokIdx].start, mm.chunkIdx]));

      let slotChunk = new Array(innerAll.length).fill(-1);
      innerAll.forEach((inn, k) => {
        if (subMap.has(inn.start)) slotChunk[k] = subMap.get(inn.start);
      });
      let prevK = -1, prevC = -1, badLayout = false;
      for (let k = 0; k < slotChunk.length; k++) {
        if (slotChunk[k] < 0) continue;
        if (prevK >= 0 && slotChunk[k] - prevC !== k - prevK) { badLayout = true; break; }
        prevK = k; prevC = slotChunk[k];
      }
      if (badLayout) {
        // fallback: direct DP mapping for damaged slots only (layout broken,
        // no run reconstruction possible)
        slotChunk = new Array(innerAll.length).fill(-1);
        innerAll.forEach((inn, k) => {
          if (subMap.has(inn.start) && /\?{2,}/.test(inn.content)) slotChunk[k] = subMap.get(inn.start);
        });
      } else {
        let firstAK = -1, firstAC = -1;
        for (let k = 0; k < slotChunk.length; k++) {
          if (slotChunk[k] >= 0) { firstAK = k; firstAC = slotChunk[k]; break; }
        }
        if (firstAK >= 0) {
          for (let k = 0; k < slotChunk.length; k++) slotChunk[k] = firstAC - firstAK + k;
        } else if (allInBundle) {
          slotChunk = ownIdxs.slice();
        }
      }

      const innerMap = new Map();
      let fixed = 0, needFix = 0;
      innerAll.forEach((inn, k) => {
        const c = slotChunk[k];
        const own = ownIdxs[k];
        const isDamaged = /\?{2,}/.test(inn.content);
        const correct = c >= 0 && c < strings.length ? strings[c] : null;
        const inBundleOwn = own >= 0;
        let change = false;
        if (isDamaged && correct !== null) change = true;
        else if (inBundleOwn && c >= 0 && own !== c) change = true;
        if (change) { needFix++; if (correct !== null) { innerMap.set(inn.start, correct); fixed++; } }
        else if (inBundleOwn && c >= 0 && own === c) { /* intact */ }
      });
      if (!needFix || fixed < needFix * MIN_COVERAGE) return;
      tplExtra.push({ region, innerMap, start: t.start, len: t.len });
      tplRecovered++;
    });

    if (!tokens.length && !tplExtra.length) { skipped++; continue; }

    const out1 = substitute(src, tokens, mapping, strings);
    let out = out1.out;
    // apply tpl inner substitutions on top (positions are region-relative)
    tplExtra.forEach(te => {
      let ro = te.region;
      const innerToks = tokenize(te.region);
      const innerPairs = [];
      te.innerMap.forEach((text, start) => {
        const t = innerToks.find(x => x.start === start);
        if (t) innerPairs.push({ t, text });
      });
      innerPairs.sort((a, b) => b.t.start - a.t.start);
      for (const p of innerPairs) {
        ro = ro.slice(0, p.t.start) + escapeSingle(p.text) + ro.slice(p.t.start + p.t.len);
      }
      out = out.slice(0, te.start) + ro + out.slice(te.start + te.len);
    });

    const cov = tokens.length ? matched.size / tokens.length : (tplExtra.length ? 1 : 0);
    const doneOk = tokens.length
      ? (cov >= MIN_COVERAGE || (matched.size + tplRecovered) / tokens.length >= MIN_COVERAGE)
      : tplExtra.length > 0;
    const doneCover = tokens.length
      ? Math.round(((matched.size + tplRecovered) / tokens.length) * 100) + '%'
      : (tplExtra.length ? '100%' : '0%');

    if (VERBOSE) {
      mapping.forEach(mm => {
        console.log('  ' + JSON.stringify(tokens[mm.tokIdx].content.slice(0, 50)) + '  =>  ' + JSON.stringify(strings[mm.chunkIdx].slice(0, 50)));
      });
      tokens.forEach((t, i) => {
        if (!matched.has(i)) console.log('  UNMATCHED ' + JSON.stringify(t.content.slice(0, 60)));
      });
    }

    if (DRY) {
      console.log((doneOk ? 'OK-DRY   ' : 'LOW-CONF ') + '(' + doneCover + ') ' + file);
      doneOk ? restored++ : low++;
      continue;
    }

    if (!doneOk) {
      if (PARTIAL) {
        // apply only high-trust pairs (few candidate alternatives)
        const trusted = mapping.filter(mm => {
          const byLen2 = new Map();
          strings.forEach((s, c) => {
            const b = byLen2.get(s.length) || [];
            b.push(c);
            byLen2.set(s.length, b);
          });
          const b2 = byLen2.get(tokens[mm.tokIdx].dLen) || [];
          return b2.filter(c => matchOk(tokens[mm.tokIdx], strings[c])).length <= 3;
        });
        const o2 = substitute(src, tokens, trusted, strings);
        fs.writeFileSync(file, o2.out);
        console.log('PARTIAL  (' + trusted.length + '/' + tokens.length + ') ' + file);
        restored++;
        continue;
      }
      console.log('LOW-CONF (' + doneCover + ') ' + file + ' — skipped, manual review');
      low++;
      continue;
    }
    fs.writeFileSync(file, out);
    console.log('RESTORED (' + doneCover + ') ' + file);
    restored++;
  }
  console.log('\nSummary: restored=' + restored + ' skipped=' + skipped + ' lowConf=' + low);
}

main();