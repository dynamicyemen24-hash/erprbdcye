require('dotenv').config();
const { Pool } = require('pg');
const BASE = 'http://localhost:3000';
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 30000, max: 2 });
  try {
    // 1. FK definition
    const fk = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint WHERE conrelid = 'transactions'::regclass AND contype = 'f'`);
    console.log('=== transactions FKs ===');
    fk.rows.forEach(r => console.log(` ${r.conname}: ${r.def}`));

    // 2. Login and decode token to see user id
    const login = await fetch(BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE, Referer: BASE + '/' },
      body: JSON.stringify({ email: 'admin@rohamaab.org', password: 'change-me' })
    });
    const lj = await login.json();
    const token = lj?.token || lj?.data?.token || lj?.data?.accessToken;
    if (!token) { console.log('LOGIN FAILED:', JSON.stringify(lj).slice(0, 300)); return; }
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    console.log('=== JWT payload keys ===');
    console.log(JSON.stringify(payload, null, 1).slice(0, 500));

    const uid = payload.id || payload.userId || payload.sub;
    console.log('token user id:', uid);
    const u = await pool.query(`SELECT id, email FROM users WHERE id = $1::uuid`, [uid]).catch(e => ({ rows: [], err: e.message }));
    console.log('user match:', u.rows.length ? u.rows[0] : (u.err || 'NO MATCH'));
  } finally { await pool.end(); }
})();
