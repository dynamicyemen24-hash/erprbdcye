const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Ensure branches table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        code VARCHAR(50) NOT NULL,
        name_ar VARCHAR(255) NOT NULL,
        name_en VARCHAR(255),
        type VARCHAR(50) DEFAULT 'FIELD',
        status VARCHAR(50) DEFAULT 'ACTIVE',
        is_active BOOLEAN DEFAULT true,
        security_level INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);

    // Ensure code column exists on subscribers if needed
    await client.query(`
      ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS code VARCHAR(50);
    `);

    await client.query("COMMIT");
    console.log("Schema check & alignment complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Schema adjustment error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

ensureSchema();
