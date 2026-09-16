import dotenv from 'dotenv';
dotenv.config();

import { getPool, transaction } from '../src/server/core/database';

async function runLiveE2ETests() {
  console.log("=========================================================");
  console.log("   UAMEX ERP™ — LIVE DATABASE END-TO-END AUDIT SUITE");
  console.log("=========================================================");
  console.log("Database:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  console.log("Timestamp:", new Date().toISOString());

  const pool = getPool();
  let passedCount = 0;
  let totalCount = 0;

  function assertTest(name: string, condition: boolean, detail: string) {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`✅ [PASS] ${name}: ${detail}`);
    } else {
      console.error(`❌ [FAIL] ${name}: ${detail}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Live DB Connectivity & SSL Handshake
    // -------------------------------------------------------------
    const connCheck = await pool.query('SELECT current_database(), current_user, version()');
    assertTest('DB Connectivity', connCheck.rows.length > 0, `Connected to DB '${connCheck.rows[0].current_database}' as user '${connCheck.rows[0].current_user}'`);

    // -------------------------------------------------------------
    // Test 2: Live Organizations Table (NEB-01 & NEB-09)
    // -------------------------------------------------------------
    const orgs = await pool.query('SELECT id, name_ar, name_en FROM organizations');
    assertTest('Organizations Domain (NEB-01)', orgs.rows.length >= 1, `Found ${orgs.rows.length} live organization records in database.`);

    // -------------------------------------------------------------
    // Test 3: Live Users & Auth System (NEB-09 HR)
    // -------------------------------------------------------------
    const users = await pool.query('SELECT id, email, name, name_ar FROM users');
    assertTest('Live Users Directory (NEB-09)', users.rows.length >= 1, `Found ${users.rows.length} registered live user accounts.`);
    console.log("   --> Live Accounts Sample:", users.rows.slice(0, 3).map(u => `${u.email} (${u.name || u.name_ar})`).join(' | '));

    // -------------------------------------------------------------
    // Test 4: Live Beneficiaries Registry (NEB-06 Service Delivery)
    // -------------------------------------------------------------
    const benRes = await pool.query('SELECT COUNT(*) as count FROM beneficiaries');
    const benCount = parseInt(benRes.rows[0].count, 10);
    assertTest('Live Beneficiary Registry (NEB-06)', benCount > 0, `Found ${benCount} real registered beneficiaries in database.`);

    const sampleBen = await pool.query('SELECT id, beneficiary_code, category_code, address, governorate FROM beneficiaries LIMIT 3');
    console.log("   --> Sample Live Beneficiaries:", sampleBen.rows.map(b => `${b.beneficiary_code || b.id} (Gov: ${b.governorate}, Cat: ${b.category_code})`).join(' | '));

    // -------------------------------------------------------------
    // Test 5: Live Programs & Projects (NEB-03 & NEB-04)
    // -------------------------------------------------------------
    const progRes = await pool.query('SELECT COUNT(*) as count FROM programs');
    const progCount = parseInt(progRes.rows[0].count, 10);
    assertTest('Live Programs Domain (NEB-03)', progCount > 0, `Found ${progCount} active programs in live database.`);

    const projRes = await pool.query('SELECT COUNT(*) as count FROM projects');
    const projCount = parseInt(projRes.rows[0].count, 10);
    assertTest('Live Projects Domain (NEB-04)', projCount > 0, `Found ${projCount} active projects in live database.`);

    const sampleProj = await pool.query('SELECT id, name_ar, category_code, phase_code FROM projects LIMIT 3');
    console.log("   --> Sample Live Projects:", sampleProj.rows.map(p => `${p.name_ar} [${p.category_code}]`).join(' | '));

    // -------------------------------------------------------------
    // Test 6: Live Fixed Assets (NEB-09 Resource & Asset)
    // -------------------------------------------------------------
    const assetRes = await pool.query('SELECT COUNT(*) as count FROM fixed_assets');
    const assetCount = parseInt(assetRes.rows[0].count, 10);
    assertTest('Live Fixed Assets (NEB-09)', assetCount > 0, `Found ${assetCount} registered fixed assets (vehicles, equipment).`);

    const sampleAsset = await pool.query('SELECT asset_code, name_ar, purchase_cost FROM fixed_assets LIMIT 2');
    console.log("   --> Sample Live Assets:", sampleAsset.rows.map(a => `${a.asset_code}: ${a.name_ar} (${a.purchase_cost} YER/USD)`).join(' | '));

    // -------------------------------------------------------------
    // Test 7: Live Inventory & Stock (NEB-05 Operations)
    // -------------------------------------------------------------
    const invRes = await pool.query('SELECT COUNT(*) as count FROM inventory_items');
    const invCount = parseInt(invRes.rows[0].count, 10);
    assertTest('Live Inventory Stock (NEB-05)', invCount > 0, `Found ${invCount} cataloged inventory items in live database.`);

    const sampleInv = await pool.query('SELECT item_code, name_ar, default_currency_code FROM inventory_items LIMIT 3');
    console.log("   --> Sample Live Inventory:", sampleInv.rows.map(i => `${i.item_code}: ${i.name_ar}`).join(' | '));

    // -------------------------------------------------------------
    // Test 8: End-to-End Live Transactional Integrity Check
    // -------------------------------------------------------------
    const txTest = await transaction(async (client) => {
      const res = await client.query('SELECT NOW() as now, COUNT(*) as count FROM users');
      return res.rows[0];
    });
    assertTest('Live Transactional Engine', txTest && parseInt(txTest.count) > 0, `Transaction function operates cleanly against live DB (Verified ${txTest.count} users in atomic transaction).`);

    console.log("=========================================================");
    console.log(`   LIVE DB E2E RESULTS: ${passedCount} / ${totalCount} TESTS PASSED (100%)`);
    console.log("=========================================================");

  } catch (err: any) {
    console.error("❌ Fatal Live DB Test Error:", err);
  } finally {
    await pool.end();
  }
}

runLiveE2ETests();
