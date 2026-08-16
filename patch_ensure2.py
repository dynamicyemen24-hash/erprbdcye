import re

with open('server.ts', 'r') as f:
    content = f.read()

ensure_exc = """async function ensureExchangeRatesSchema(poolInstance: pg.Pool) {
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

if "async function ensureExchangeRatesSchema" not in content:
    # Let's insert it before seedExchangeRatesIfEmpty
    target = "async function seedExchangeRatesIfEmpty(poolInstance: pg.Pool) {"
    replacement = ensure_exc + "\\n\\n" + target
    content = content.replace(target, replacement)

    with open('server.ts', 'w') as f:
        f.write(content)
