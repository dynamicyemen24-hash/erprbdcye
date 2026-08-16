import re

with open('server.ts', 'r') as f:
    content = f.read()

old_ensure = """async function ensureFixedAssetsSchema(poolInstance: pg.Pool) {
  try {
    await poolInstance.query(`
      ALTER TABLE fixed_assets 
      ADD COLUMN IF NOT EXISTS category VARCHAR,
      ADD COLUMN IF NOT EXISTS serial_number VARCHAR,
      ADD COLUMN IF NOT EXISTS supplier_name VARCHAR,
      ADD COLUMN IF NOT EXISTS supplier_contact VARCHAR,
      ADD COLUMN IF NOT EXISTS warranty_expiry_date VARCHAR,
      ADD COLUMN IF NOT EXISTS location_name VARCHAR,
      ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR,
      ADD COLUMN IF NOT EXISTS assigned_custodian_hr VARCHAR,
      ADD COLUMN IF NOT EXISTS last_maintenance_date VARCHAR,
      ADD COLUMN IF NOT EXISTS next_maintenance_date VARCHAR,
      ADD COLUMN IF NOT EXISTS disposal_date VARCHAR,
      ADD COLUMN IF NOT EXISTS disposal_reason TEXT,
      ADD COLUMN IF NOT EXISTS metadata JSONB;
    `);
    console.log("fixed_assets table schema migration ensured successfully.");
  } catch (err) {
    console.warn("Could not alter fixed_assets table schema:", err);
  }
}"""

new_ensure = """async function ensureFixedAssetsSchema(poolInstance: pg.Pool) {
  try {
    await poolInstance.query(`
      CREATE TABLE IF NOT EXISTS fixed_assets (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL,
        asset_code VARCHAR NOT NULL,
        name_en VARCHAR,
        name_ar VARCHAR,
        category VARCHAR,
        serial_number VARCHAR,
        purchase_date VARCHAR,
        purchase_cost NUMERIC,
        current_value NUMERIC,
        depreciation_rate NUMERIC,
        accumulated_depreciation NUMERIC,
        useful_life_months INT,
        residual_value NUMERIC,
        supplier_name VARCHAR,
        supplier_contact VARCHAR,
        warranty_expiry_date VARCHAR,
        location_name VARCHAR,
        warehouse_id VARCHAR,
        project_id VARCHAR,
        project_name VARCHAR,
        activity_id VARCHAR,
        assigned_custodian_hr VARCHAR,
        condition_code VARCHAR,
        status_code VARCHAR,
        last_maintenance_date VARCHAR,
        next_maintenance_date VARCHAR,
        disposal_date VARCHAR,
        disposal_reason TEXT,
        security_level INT DEFAULT 3,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log("fixed_assets table schema ensured successfully.");
  } catch (err) {
    console.warn("Could not create/alter fixed_assets table schema:", err);
  }
}

async function ensureExchangeRatesSchema(poolInstance: pg.Pool) {
  try {
    await poolInstance.query(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL,
        from_currency_id UUID NOT NULL,
        to_currency_id UUID NOT NULL,
        rate NUMERIC NOT NULL,
        effective_date VARCHAR NOT NULL,
        security_level INT DEFAULT 3,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);
  } catch (err) {
    console.warn("Could not create exchange_rates table schema:", err);
  }
}"""

content = content.replace(old_ensure, new_ensure)

old_seed_exch = """async function seedExchangeRatesIfEmpty(poolInstance: pg.Pool) {
  try {"""

new_seed_exch = """async function seedExchangeRatesIfEmpty(poolInstance: pg.Pool) {
  try {
    await ensureExchangeRatesSchema(poolInstance);"""

content = content.replace(old_seed_exch, new_seed_exch)

with open('server.ts', 'w') as f:
    f.write(content)
