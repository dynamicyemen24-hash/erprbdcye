import re

with open('src/db/index.ts', 'r') as f:
    content = f.read()

old_pool = """    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });"""

new_pool = """    const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=require&channel_binding=require";
    global._postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 15000,
      ssl: {
        rejectUnauthorized: false, // Required for secure Neon connections
      },
    });"""

content = content.replace(old_pool, new_pool)

with open('src/db/index.ts', 'w') as f:
    f.write(content)
