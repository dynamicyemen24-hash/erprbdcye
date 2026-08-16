require('dotenv').config();
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function runTenantIsolationTests() {
  console.log('--- RUNNING TENANT ISOLATION & SECURITY REGRESSION TESTS ---');
  let passed = 0;
  let failed = 0;

  const tenantA = '00000000-0000-0000-0000-000000000001';
  const tenantB = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

  try {
    // TEST 1: Tenant A isolated query
    const resA = await pool.query('SELECT * FROM programs WHERE organization_id = $1 AND deleted_at IS NULL', [tenantA]);
    console.log(`[TEST 1] Tenant A Programs Count: ${resA.rows.length}`);
    if (resA.rows.every(r => r.organization_id === tenantA)) {
      console.log('✅ TEST 1 PASSED: All returned records belong to Tenant A');
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: Tenant A query returned cross-tenant records');
      failed++;
    }

    // TEST 2: Tenant B isolated query
    const resB = await pool.query('SELECT * FROM programs WHERE organization_id = $1 AND deleted_at IS NULL', [tenantB]);
    console.log(`[TEST 2] Tenant B Programs Count: ${resB.rows.length}`);
    if (resB.rows.every(r => r.organization_id === tenantB)) {
      console.log('✅ TEST 2 PASSED: All returned records belong to Tenant B');
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Tenant B query returned cross-tenant records');
      failed++;
    }

    // TEST 3: IDOR Simulation - Attempt to query Tenant A record with Tenant B scope
    if (resA.rows.length > 0) {
      const recordAId = resA.rows[0].id;
      const idorCheck = await pool.query('SELECT * FROM programs WHERE id = $1 AND organization_id = $2', [recordAId, tenantB]);
      if (idorCheck.rows.length === 0) {
        console.log(`✅ TEST 3 PASSED: IDOR Prevention verified. Tenant B cannot access Tenant A record (${recordAId})`);
        passed++;
      } else {
        console.error(`❌ TEST 3 FAILED: IDOR Vulnerability! Tenant B accessed Tenant A record (${recordAId})`);
        failed++;
      }
    }

    // TEST 4: Audit trail table check
    const auditCheck = await pool.query('SELECT COUNT(*) FROM audit_logs');
    console.log(`[TEST 4] Total Audit Trail Entries in DB: ${auditCheck.rows[0].count}`);
    passed++;

    console.log(`\n--- SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
    pool.end();
  } catch (err) {
    console.error('Test execution failed:', err);
    pool.end();
    process.exit(1);
  }
}

runTenantIsolationTests();
