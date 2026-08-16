// restore_match_core.cjs — shared tokenize/extract helpers for restore pipeline
'use strict';
const AR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const MAX_TOKEN_LEN = 4000;

// char allowed at a corrupted '?' position: Arabic, symbols, emoji, surrogates, NBSP
function allowAtQmark(ch) {
  const cp = ch.codePointAt(0);
  if (cp >= 0x0600 && cp <= 0x06FF) return true;    // Arabic
  if (cp >= 0x0750 && cp <= 0x077F) return true;    // Arabic Supplement
  if (cp >= 0x08A0 && cp <= 0x08FF) return true;    // Arabic Extended-A
  if (cp >= 0x2000 && cp <= 0x206F) return true;    // general punctuation
  if (cp >= 0x2190 && cp <= 0x2BFF) return true;    // arrows, math, symbols
  if (cp >= 0xD800 && cp <= 0xDFFF) return true;    // surrogate halves (emoji pairs)
  if (cp >= 0x1F000 && cp <= 0x1FAFF) return true;  // astral emoji / symbols
  if (cp === 0x00A0 || cp === 0x200D || cp === 0xFE0F || cp === 0x2066 || cp === 0x2067 || cp === 0x2069) return true;
  return false;
}

function tokenize(source) {
  const tokens = [];
  let i = 0;
  let n = source.length;
  let state = 'code';
  while (i < n) {
    const ch = source[i];
    if (state === 'line') { if (ch === '\n') state = 'code'; i++; continue; }
    if (state === 'block') { if (ch === '*' && source[i + 1] === '/') { state = 'code'; i += 2; continue; } i++; continue; }
    if (state === 'code') {
      if (ch === '/' && source[i + 1] === '/') { state = 'line'; i += 2; continue; }
      if (ch === '/' && source[i + 1] === '*') { state = 'block'; i += 2; continue; }
      if (ch === "'") { state = 'sq'; i++; continue; }
      if (ch === '"') { state = 'dq'; i++; continue; }
      if (ch === '`') { state = 'tpl'; i++; continue; }
      i++; continue;
    }
    const quote = state === 'sq' ? "'" : (state === 'dq' ? '"' : '`');
    let tStart = i;
    let segments = [];
    let segment = '';
    let segStart = i;
    let broken = false;
    for (; i < n; i++) {
      const c = source[i];
      if (c === '\\') {
        segment += source.slice(segStart, i) + c + (source[i + 1] || '');
        i++;
        segStart = i + 1;
        continue;
      }
      if (c === quote) {
        segment += source.slice(segStart, i);
        segments.push({ start: tStart, len: segment.length, type: state === 'tpl' ? 'tpl' : 'str', content: segment });
        broken = true;
        i++;
        break;
      }
      if (state !== 'tpl' && c === '\n') {
        segment += source.slice(segStart, i);
        segments.push({ start: tStart, len: segment.length, type: 'str', content: segment });
        broken = true;
        i++;
        break;
      }
      if (state === 'tpl' && c === '$' && source[i + 1] === '{') {
        segment += source.slice(segStart, i);
        segments.push({ start: tStart, len: segment.length, type: 'tpl', content: segment });
        let depth = 1;
        i += 2;
        while (i < n && depth > 0) {
          if (source[i] === '{') depth++;
          if (source[i] === '}') depth--;
          i++;
        }
        tStart = i;
        segment = '';
        segStart = i;
        i--;
        continue;
      }
    }
    if (!broken && (segment.length || i - segStart > 0)) {
      segment += source.slice(segStart, i);
      segments.push({ start: tStart, len: segment.length, type: state === 'tpl' ? 'tpl' : 'str', content: segment });
    }
    for (const s of segments) tokens.push(s);
    state = 'code';
  }
  return tokens.filter(t => t.len <= MAX_TOKEN_LEN);
}

function isDamaged(token) {
  return !!token.content.match(/\?{2,}/g);
}

function singleRuns(token) {
  const out = [];
  let run = 0;
  for (let p = 0; p < token.content.length; p++) {
    if (token.content[p] === '?') run++;
    else { if (run === 1) out.push(p - 1); run = 0; }
  }
  if (run === 1) out.push(token.content.length - 1);
  return out;
}

function unescapeJs(s) {
  return s.replace(/\\(u([0-9a-fA-F]{4})|u\{([0-9a-fA-F]+)\}|n|t|r|"|'|`|\\)/g, (m, u4, h4, hb) => {
    if (u4 === 'u') return String.fromCharCode(parseInt(h4 || hb, 16));
    switch (m) {
      case '\\n': return '\n';
      case '\\t': return '\t';
      case '\\r': return '\r';
      default: return m[1];
    }
  });
}

function extractChunkStrings(js) {
  const out = [];
  let i = 0;
  const n = js.length;
  while (i < n) {
    const ch = js[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      let lit = '';
      while (j < n) {
        const c = js[j];
        if (c === '\\') {
          if (js[j + 1] === 'u' && /^[0-9a-fA-F]{4}/.test(js.slice(j + 2, j + 6))) {
            lit += '\\u' + js.slice(j + 2, j + 6);
            j += 6;
            continue;
          }
          lit += js[j + 1] || '';
          j += 2;
          continue;
        }
        if (c === q) { j++; break; }
        if (c === '\n') break;
        lit += c;
        j++;
      }
      const dec = unescapeJs(lit);
      if (AR.test(dec)) out.push(dec);
      i = j;
      continue;
    }
    i++;
  }
  return out;
}

function extractAllStrings(js) {
  const out = [];
  let i = 0;
  const n = js.length;
  while (i < n) {
    const ch = js[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      let lit = '';
      while (j < n) {
        const c = js[j];
        if (c === '\\') {
          if (js[j + 1] === 'u' && /^[0-9a-fA-F]{4}/.test(js.slice(j + 2, j + 6))) {
            lit += '\\u' + js.slice(j + 2, j + 6);
            j += 6;
            continue;
          }
          lit += js[j + 1] || '';
          j += 2;
          continue;
        }
        if (c === q) { j++; break; }
        if (c === '\n') break;
        lit += c;
        j++;
      }
      const dec = unescapeJs(lit);
      out.push({ s: dec, isAr: AR.test(dec) });
      i = j;
      continue;
    }
    if (ch === '`') {
      let j = i + 1;
      let lit = '';
      while (j < n) {
        const c = js[j];
        if (c === '\\') {
          const next = js[j + 1];
          if (next === 'u' && /^[0-9a-fA-F]{4}/.test(js.slice(j + 2, j + 6))) { lit += '\\u' + js.slice(j + 2, j + 6); j += 6; continue; }
          lit += '\\' + (next || ''); j += 2; continue;
        }
        if (c === '`') break;
        lit += c;
        j++;
      }
      const dec = unescapeJs(lit);
      // also split at ${...} like the src tokenizer does
      const parts = dec.split(/\$\{[^}]*\}/);
      for (const p of parts) if (p) out.push({ s: p, isAr: AR.test(p) });
      out.push({ s: dec, isAr: AR.test(dec) });
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

module.exports = { AR, allowAtQmark, MAX_TOKEN_LEN, tokenize, isDamaged, singleRuns, unescapeJs, extractChunkStrings, extractAllStrings };