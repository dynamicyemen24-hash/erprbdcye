// One-shot: map ModelOutputError to 502 in Gemini route catches.
const fs = require('fs');
const p = 'src/server/routes/v2/gemini.routes.ts';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
// 1-indexed lines whose 500-response should gain a ModelOutputError branch
const targets = [132, 294, 330, 354, 396, 418, 440, 462, 484, 934, 1011];
for (const n of targets) {
  const line = lines[n - 1];
  if (!line.includes('res.status(500)')) throw new Error(`line ${n} mismatch: ${line.trim().slice(0, 60)}`);
  // find enclosing catch variable by scanning upward
  let varName = 'error';
  for (let i = n - 2; i >= Math.max(0, n - 12); i--) {
    const m = lines[i].match(/\}\s*catch\s*\(\s*(\w+)/);
    if (m) {
      varName = m[1];
      break;
    }
  }
  const indent = line.match(/^\s*/)[0];
  const msg = (line.match(/error:\s*'([^']+)'/) || [null, null])[1]
    || (line.match(/message:\s*"([^"]+)"/) || [null, null])[1]
    || 'Internal Server Error';
  lines[n - 1] =
    `${indent}if (${varName} instanceof ModelOutputError) return modelErrorResponse(res, ${varName}, '${msg}');${eol}` + line;
  console.log(`mapped line ${n} (catch var ${varName})`);
}
fs.writeFileSync(p, lines.join(eol), { encoding: 'utf8' });
console.log('done');
