// Enterprise structured logger - ISO timestamps, log levels, JSON formatting (AWS WA Observability)
function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    service: 'nexoraops',
    message,
    ...meta
  };
  console.log(JSON.stringify(entry));
}

module.exports = {
  info: (msg, meta) => log('INFO', msg, meta),
  warn: (msg, meta) => log('WARN', msg, meta),
  error: (msg, meta) => log('ERROR', msg, meta),
  debug: (msg, meta) => log('DEBUG', msg, meta)
};
