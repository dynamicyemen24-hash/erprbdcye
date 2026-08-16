const fs = require('fs');
const path = require('path');
const { glob } = require('./restore_arabic.cjs');
// glob isn't exported; inline a copy with logging
function globDebug(dir, pattern, out = []) {
  const toRegex = (pat) => {
    const braceParts = pat.split(/(\{[^}]*\})/g);
    let body = '';
    for (const part of braceParts) {
      if (/^\{[^}]*\}$/.test(part)) {
        body += '(' + part.slice(1, -1).split(',').map(alt =>
          alt.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]')
        ).join('|') + ')';
      } else {
        body += part.split('/').map(p => {
          if (p === '**') return '(?:.*/)?';
          return p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');
        }).join('/');
      }
    }
    return new RegExp('^' + body + '$');
  };
  const re = toRegex(pattern);
  console.log('regex:', re.source);
  (function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); }
    catch (e) { console.log('readdir ERR', d, e.message); return; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        if (!/node_modules|dist|\.git|scripts/.test(e.name)) walk(full);
      } else {
        const rel = path.relative(process.cwd(), full).replace(/\\/g, '/');
        console.log('file:' + rel + ' match=' + re.test(rel));
        if (re.test(rel)) out.push(full);
      }
    }
  })(dir);
  return out;
}
const files = globDebug(process.cwd(), 'src/**/*.{ts,tsx,js,jsx}');
console.log('total matched:', files.length);
console.log(files.slice(0, 5).join('\n'));