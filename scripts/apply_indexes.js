import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=verify-full';

const client = new Client({ connectionString });

async function applyPerformanceIndexes() {
  console.log('⚡ Connecting to Neon PostgreSQL to apply performance composite indexes...');
  await client.connect();

  const indexQueries = [
    {
      name: 'idx_transactions_org_date',
      sql: 'CREATE INDEX IF NOT EXISTS idx_transactions_org_date ON transactions (organization_id, transaction_date DESC);'
    },
    {
      name: 'idx_transactions_type_status',
      sql: 'CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions (transaction_type, status);'
    },
    {
      name: 'idx_beneficiaries_org_status',
      sql: 'CREATE INDEX IF NOT EXISTS idx_beneficiaries_org_status ON beneficiaries (organization_id, status);'
    },
    {
      name: 'idx_field_tasks_project_status',
      sql: 'CREATE INDEX IF NOT EXISTS idx_field_tasks_project_status ON field_tasks (project_id, status);'
    },
    {
      name: 'idx_audit_logs_actor_created',
      sql: 'CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs (actor_id, created_at DESC);'
    }
  ];

  for (const idx of indexQueries) {
    try {
      console.log(`Applying index: ${idx.name}...`);
      await client.query(idx.sql);
      console.log(`✅ Index ${idx.name} applied successfully.`);
    } catch (err) {
      console.warn(`⚠️ Warning applying index ${idx.name}:`, err.message);
    }
  }

  await client.end();
  console.log('🚀 Database performance indexing completed cleanly.');
}

applyPerformanceIndexes().catch(console.error);
