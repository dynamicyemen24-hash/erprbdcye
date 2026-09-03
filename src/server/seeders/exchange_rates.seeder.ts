/**
 * NexoraOS™ — Exchange Rates Seeder
 * Seeds default exchange rates (USD→YER, SAR→YER, USD→SAR).
 */

import pg from 'pg';
import logger from '../core/logger';

export async function ensureExchangeRatesSchema(pool: pg.Pool): Promise<void> {
  await pool.query(`
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
}

export async function seedExchangeRatesIfEmpty(pool: pg.Pool): Promise<void> {
  try {
    await ensureExchangeRatesSchema(pool);
    const checkRes = await pool.query("SELECT COUNT(*) FROM exchange_rates");
    const count = parseInt(checkRes.rows[0].count);
    if (count > 0) return;

    const curRes = await pool.query("SELECT id, code FROM currencies");
    const currenciesMap: Record<string, string> = curRes.rows.reduce((map: any, row: any) => {
      map[row.code] = row.id;
      return map;
    }, {});

    const usdId = currenciesMap['USD'];
    const yerId = currenciesMap['YER'];
    const sarId = currenciesMap['SAR'];

    if (usdId && yerId) {
      await pool.query(
        `INSERT INTO exchange_rates (organization_id, from_currency_id, to_currency_id, rate, effective_date, security_level)
         VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, 530.00, '2026-01-01', 3)`,
        [usdId, yerId]
      );
    }
    if (sarId && yerId) {
      await pool.query(
        `INSERT INTO exchange_rates (organization_id, from_currency_id, to_currency_id, rate, effective_date, security_level)
         VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, 140.00, '2026-01-01', 3)`,
        [sarId, yerId]
      );
    }
    if (usdId && sarId) {
      await pool.query(
        `INSERT INTO exchange_rates (organization_id, from_currency_id, to_currency_id, rate, effective_date, security_level)
         VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, 3.75, '2026-01-01', 3)`,
        [usdId, sarId]
      );
    }
    logger.info('[SEEDER] exchange_rates seeded', { context: 'seeder' });
  } catch (err: any) {
    logger.error(`[SEEDER] exchange_rates: ${err.message}`, { context: 'seeder' });
  }
}
