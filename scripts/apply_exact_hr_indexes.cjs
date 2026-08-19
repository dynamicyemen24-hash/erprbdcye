require('dotenv').config();

const pg = require('pg');
const { Client } = pg;

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function applyExactIndexes() {
  console.log('⚡ Applying Exact HR Composite Indexes...');
  await client.connect();

  const exactIndexes = [
    { name: 'idx_hr_staff_org_dept', sql: 'CREATE INDEX IF NOT EXISTS idx_hr_staff_org_dept ON hr_staff (organization_id, department);' },
    { name: 'idx_hr_staff_emptype', sql: 'CREATE INDEX IF NOT EXISTS idx_hr_staff_emptype ON hr_staff (employment_type, employment_status);' },
    { name: 'idx_attendance_emp_date', sql: 'CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance_records (employee_id, attendance_date DESC);' },
    { name: 'idx_hr_leaves_staff_status', sql: 'CREATE INDEX IF NOT EXISTS idx_hr_leaves_staff_status ON hr_leaves (staff_id, approval_status);' },
    { name: 'idx_payroll_records_period_emp', sql: 'CREATE INDEX IF NOT EXISTS idx_payroll_records_period_emp ON payroll_records (payroll_period_id, employee_id);' }
  ];

  for (const idx of exactIndexes) {
    try {
      await client.query(idx.sql);
      console.log(`✅ Composite index ${idx.name} successfully applied!`);
    } catch (err) {
      console.warn(`⚠️ Warning on ${idx.name}:`, err.message);
    }
  }

  await client.end();
  console.log('🚀 Exact HR Database Indexing Completed 100%!');
}

applyExactIndexes().catch(console.error);
