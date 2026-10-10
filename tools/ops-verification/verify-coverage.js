// verify-coverage.js — offline-first coverage audit (offline only, no DB).
// Loads BOTH schemas via config, audits per-table offline columns,
// reports sync_queue health. Exit 0 iff syncTables>=7 && queue exists.
const fs = require('fs');
const { resolveSchemaPath, defaultSchemaPath, defaultCompletionPath } = require('./config');

const local = fs.readFileSync(resolveSchemaPath('LOCAL_SCHEMA_PATH', defaultSchemaPath), 'utf8');
const completion = fs.readFileSync(resolveSchemaPath('COMPLETION_SCHEMA_PATH', defaultCompletionPath), 'utf8');

const COLS = ['offline_enabled', 'sync_status', 'version', 'deleted_at'];

// Per-table audit on the CREATE TABLE body only (paren-matched, so nested
// types like NUMERIC(18,2) and later index names can't leak across tables).
function audit(sql) {
  const re = /CREATE TABLE IF NOT EXISTS (\w+)\s*\(/g;
  const tables = {};
  let m;
  while ((m = re.exec(sql))) {
    let depth = 1;
    let i = m.index + m[0].length;
    while (i < sql.length && depth > 0) {
      if (sql[i] === '(') depth++;
      else if (sql[i] === ')') depth--;
      i++;
    }
    tables[m[1]] = sql.slice(m.index, i);
  }
  const names = Object.keys(tables);
  const sync = names.filter((t) => tables[t].includes('sync_status'));
  const zero = names.filter((t) => !COLS.some((c) => tables[t].includes(c)));
  return { total: names.length, sync, zero: zero.length, tables };
}

const a = audit(local);
const b = audit(completion);
const mergedTables = { ...a.tables, ...b.tables };
Object.keys(b.tables).forEach((t) => {
  if (a.tables[t]) mergedTables[t] = a.tables[t] + '\n' + b.tables[t];
});
const mergedNames = Object.keys(mergedTables);
const mergedSync = mergedNames.filter((t) => mergedTables[t].includes('sync_status'));
const mergedZero = mergedNames.filter((t) => !COLS.some((c) => mergedTables[t].includes(c)));

console.log('OFFLINE COVERAGE AUDIT');
console.log('  initial: ' + a.total + ' tables, sync=' + a.sync.length + ', zero-coverage=' + a.zero);
console.log('  completion: ' + b.total + ' tables, sync=' + b.sync.length + ', zero-coverage=' + b.zero);
console.log('  merged: ' + mergedNames.length + ' tables, sync=' + mergedSync.length + ', zero-coverage=' + mergedZero.length);
console.log('  sync tables (' + mergedSync.length + '): ' + mergedSync.join(', '));

const all = local + '\n' + completion;
const hasQueue = all.includes('CREATE TABLE IF NOT EXISTS sync_queue');
const queueIdx = all.match(/CREATE INDEX[^\n]*sync_queue[^\n]*/gi) || [];
console.log('  sync_queue: ' + (hasQueue ? 'present' : 'MISSING'));
console.log('  sync_queue indexes (' + queueIdx.length + '): ' + (queueIdx.length ? 'OK' : 'WARN (no index — unbounded growth risk)'));

const ok = mergedSync.length >= 7 && hasQueue;
console.log(ok ? 'STATUS: OK' : 'STATUS: FAIL');
process.exitCode = ok ? 0 : 1;
