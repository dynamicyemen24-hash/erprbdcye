const pg = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_Dq90uUgVxdre@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/erprbdcyedb?sslmode=verify-full";

async function optimizeExecutiveViewsAndIndexes() {
  console.log("⚡ Executing Ultra-Deep SQL View & Index Performance Optimization...\n");

  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // 1. Create Performance Composite Indexes for Ultra-Fast Queries (< 5ms)
    console.log("📌 Creating Performance Composite Indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_programs_status_org ON programs (organization_id, status_code);
      CREATE INDEX IF NOT EXISTS idx_projects_program_status ON projects (program_id, status_code);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_gov_district ON beneficiaries (governorate, district);
      CREATE INDEX IF NOT EXISTS idx_hr_staff_dept_status ON hr_staff (department, employment_status);
      CREATE INDEX IF NOT EXISTS idx_chart_accounts_type_active ON chart_of_accounts (account_type, is_active);
    `);
    console.log("✅ Composite Indexes created successfully!");

    // 2. Re-create Optimized SQL View v_executive_summary
    console.log("\n📌 Re-building Optimized SQL View 'v_executive_summary'...");
    await client.query(`DROP VIEW IF EXISTS v_executive_summary CASCADE;`);
    await client.query(`
      CREATE VIEW v_executive_summary AS
      SELECT
        (SELECT COUNT(*) FROM programs) AS total_programs_count,
        (SELECT COUNT(*) FROM projects) AS total_projects_count,
        (SELECT COALESCE(SUM(budget::numeric), 0) FROM projects) AS total_projects_budget_sum,
        (SELECT COUNT(*) FROM beneficiaries) AS total_beneficiaries_count,
        (SELECT COUNT(*) FROM hr_staff WHERE employment_status = 'ACTIVE') AS active_hr_staff_count,
        (SELECT COUNT(*) FROM chart_of_accounts WHERE is_active = true) AS active_chart_accounts_count,
        (SELECT COALESCE(SUM(current_balance::numeric), 0) FROM chart_of_accounts WHERE account_type = 'ASSET') AS total_asset_balance,
        (SELECT COALESCE(SUM(current_balance::numeric), 0) FROM chart_of_accounts WHERE account_type = 'LIABILITY') AS total_liability_balance,
        (SELECT COUNT(*) FROM vendors WHERE status = 'ACTIVE') AS active_vendors_count,
        (SELECT COUNT(*) FROM sales_invoices) AS total_sales_invoices_count,
        NOW() AS generated_at;
    `);
    console.log("✅ SQL View 'v_executive_summary' re-built with high-performance metrics!");

    // 3. Inspect Live Output
    const startTime = Date.now();
    const res = await client.query("SELECT * FROM v_executive_summary");
    const executionTime = Date.now() - startTime;

    console.log(`\n⚡ Query Execution Time: ${executionTime} ms`);
    console.table(res.rows);

    client.release();
  } catch (err) {
    console.error("❌ Optimization Error:", err);
  } finally {
    await pool.end();
  }
}

optimizeExecutiveViewsAndIndexes();
