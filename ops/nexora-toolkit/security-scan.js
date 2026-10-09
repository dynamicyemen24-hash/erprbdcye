// Regression guard: fail if any hardcoded secret appears in the ops toolkit.
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));

const patterns = [
  /npg_[A-Za-z0-9]+/,
  /postgres(?:ql)?:\/\/[^'"\s]*:[^'"\s]*@/i,
  /AKIA[0-9A-Z]{16}/,
  /xox[bap]-[A-Za-z0-9-]+/,
];

let hits = 0;
files.forEach((file) => {
  if (file === 'security-scan.js') return;
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  patterns.forEach((re) => {
    const m = content.match(re);
    if (m) {
      hits++;
      console.log(`❌ HIT ${file}: matched ${re} -> "${String(m[0]).slice(0, 24)}..."`);
    }
  });
});

if (hits > 0) {
  console.log(`\n❌ security:scan FAILED with ${hits} hardcoded-secret hit(s). Move them to .env.`);
  process.exit(1);
} else {
  console.log('✅ security:scan passed - no hardcoded secrets in ops toolkit');
}
