import re

with open('server.ts', 'r') as f:
    content = f.read()

old_pool = """function getPool(): pg.Pool {
  if (!pool) {
    if (process.env.SQL_HOST) {
      pool = new pg.Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 8,
        idleTimeoutMillis: 20000,
        connectionTimeoutMillis: 5000,
      });
    } else {
      const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
      pool = new pg.Pool({
        connectionString,
        max: 8,
        idleTimeoutMillis: 20000,
        connectionTimeoutMillis: 5000,
        ssl: {
          rejectUnauthorized: false, // Required for secure Neon connections
        },
      });
    }"""

new_pool = """function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
    pool = new pg.Pool({
      connectionString,
      max: 8,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 5000,
      ssl: {
        rejectUnauthorized: false, // Required for secure Neon connections
      },
    });"""

content = content.replace(old_pool, new_pool)

with open('server.ts', 'w') as f:
    f.write(content)
