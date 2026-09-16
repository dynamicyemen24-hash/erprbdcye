import dotenv from 'dotenv';
dotenv.config();

import { getPool } from '../src/server/core/database';

async function main() {
  console.log("=== FIXING BENEFICIARIES SCHEMA & SEARCH INDEX TRIGGER ===");
  const pool = getPool();

  try {
    // 1. Add full_name_en column if not exists
    await pool.query(`
      ALTER TABLE beneficiaries 
      ADD COLUMN IF NOT EXISTS full_name_en TEXT,
      ADD COLUMN IF NOT EXISTS full_name_ar TEXT,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);
    console.log("✅ Added full_name_en, full_name_ar, deleted_at columns to beneficiaries table.");

    // 2. Replace upsert_search_index_beneficiary function safely
    await pool.query(`
      CREATE OR REPLACE FUNCTION upsert_search_index_beneficiary()
      RETURNS TRIGGER AS $$
      DECLARE
          v_org_id UUID;
          v_name_ar TEXT;
          v_name_en TEXT;
          v_code TEXT;
      BEGIN
          v_org_id := COALESCE(NEW.organization_id, '00000000-0000-0000-0000-000000000000'::uuid);
          v_name_ar := COALESCE(NEW.full_name_ar, '');
          v_name_en := COALESCE(NEW.full_name_en, '');
          v_code := COALESCE(NEW.beneficiary_code, '');

          IF NEW.deleted_at IS NOT NULL THEN
              UPDATE search_index SET is_active = false, updated_at = NOW()
                  WHERE org_id = v_org_id AND record_id = NEW.id AND domain = 'beneficiary';
              RETURN NEW;
          END IF;

          INSERT INTO search_index (org_id, domain, record_id, title, subtitle, raw_search, keywords, meta, weight, is_active)
          VALUES (
              v_org_id, 'beneficiary', NEW.id,
              COALESCE(NULLIF(v_name_ar, ''), NULLIF(v_name_en, ''), v_code, 'Beneficiary'),
              v_code,
              LOWER(v_name_ar || ' ' || v_name_en || ' ' || v_code),
              LOWER(v_name_ar || ' ' || v_name_en),
              jsonb_build_object(
                  'url', '/beneficiaries/' || NEW.id,
                  'governorate', COALESCE(NEW.governorate, ''),
                  'district', COALESCE(NEW.district, ''),
                  'created_at', NEW.created_at
              ),
              0.7,
              true
          )
          ON CONFLICT (org_id, domain, record_id) DO UPDATE SET
              title = EXCLUDED.title,
              subtitle = EXCLUDED.subtitle,
              raw_search = EXCLUDED.raw_search,
              keywords = EXCLUDED.keywords,
              meta = EXCLUDED.meta,
              weight = EXCLUDED.weight,
              is_active = true,
              indexed_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("✅ Replaced upsert_search_index_beneficiary PL/pgSQL function safely.");

  } catch (err: any) {
    console.error("❌ Schema Fix Error:", err);
  } finally {
    await pool.end();
  }
}

main();
