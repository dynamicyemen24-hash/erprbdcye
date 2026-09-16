/**
 * NexoraOS™ — Global Reference Data Seeder
 * Seeds the ISO 3166-1 countries taxonomy and default ISO 4217 currencies (global, org-shared),
 * plus a baseline unit-of-measure catalog for the default organization.
 * Idempotent.
 */

import pg from 'pg';
import logger from '../core/logger';

const CURRENCIES = [
  ['USD', 'دولار أمريكي', 'US Dollar', '$', true],
  ['YER', 'ريال يمني', 'Yemeni Rial', '﷼', false],
  ['SAR', 'ريال سعودي', 'Saudi Riyal', '﷼', false],
  ['AED', 'درهم إماراتي', 'UAE Dirham', 'د.إ', false],
  ['EUR', 'يورو', 'Euro', '€', false],
  ['GBP', 'جنيه إسترليني', 'British Pound', '£', false],
  ['QAR', 'ريال قطري', 'Qatari Riyal', 'ر.ق', false],
  ['KWD', 'دينار كويتي', 'Kuwaiti Dinar', 'د.ك', false],
  ['OMR', 'ريال عماني', 'Omani Rial', 'ر.ع', false],
  ['BHD', 'دينار بحريني', 'Bahraini Dinar', 'د.ب', false],
  ['JOD', 'دينار أردني', 'Jordanian Dinar', 'د.أ', false],
  ['EGP', 'جنيه مصري', 'Egyptian Pound', 'ج.م', false],
  ['TRY', 'ليرة تركية', 'Turkish Lira', '₺', false],
  ['CNY', 'يوان صيني', 'Chinese Yuan', '¥', false],
  ['INR', 'روبية هندية', 'Indian Rupee', '₹', false],
];

const UNITS = [
  ['PC', 'قطعة', 'Piece', 'COUNT', 'قطعة', 'pc', 'PC', '1'],
  ['BOX', 'كرتونة', 'Box', 'PACKAGING', 'كرتونة', 'box', 'PC', '12'],
  ['KG', 'كيلوغرام', 'Kilogram', 'WEIGHT', 'كجم', 'kg', 'KG', '1'],
  ['GM', 'غرام', 'Gram', 'WEIGHT', 'جم', 'g', 'KG', '0.001'],
  ['LT', 'لتر', 'Liter', 'VOLUME', 'لتر', 'L', 'LT', '1'],
  ['ML', 'مليلتر', 'Milliliter', 'VOLUME', 'مل', 'ml', 'LT', '0.001'],
  ['M', 'متر', 'Meter', 'LENGTH', 'م', 'm', 'M', '1'],
  ['CM', 'سنتيمتر', 'Centimeter', 'LENGTH', 'سم', 'cm', 'M', '0.01'],
  ['SQM', 'متر مربع', 'Square Meter', 'AREA', 'م²', 'm²', 'SQM', '1'],
  ['CBM', 'متر مكعب', 'Cubic Meter', 'VOLUME', 'م³', 'm³', 'CBM', '1'],
  ['BAG', 'كيس', 'Bag', 'PACKAGING', 'كيس', 'bag', 'PC', '25'],
  ['CARTON', 'كرتون كبير', 'Carton', 'PACKAGING', 'كرتونة', 'carton', 'PC', '50'],
  ['LTR-KIT', 'عدة غذائية', 'Food Kit', 'KIT', 'عدة', 'kit', 'PC', '1'],
  ['HYGIENE-KIT', 'عدة صحية', 'Hygiene Kit', 'KIT', 'عدة صحية', 'kit', 'PC', '1'],
];

const COUNTRIES = [
  ['YE', 'YEM', '887', 'اليمن', 'Yemen', 'Western Asia', 'Southern Asia', 'YER', '+967'],
  ['SA', 'SAU', '682', 'السعودية', 'Saudi Arabia', 'Western Asia', 'Western Asia', 'SAR', '+966'],
  ['AE', 'ARE', '784', 'الإمارات', 'United Arab Emirates', 'Western Asia', 'Western Asia', 'AED', '+971'],
  ['QA', 'QAT', '634', 'قطر', 'Qatar', 'Western Asia', 'Western Asia', 'QAR', '+974'],
  ['KW', 'KWT', '414', 'الكويت', 'Kuwait', 'Western Asia', 'Western Asia', 'KWD', '+965'],
  ['OM', 'OMN', '512', 'عُمان', 'Oman', 'Western Asia', 'Western Asia', 'OMR', '+968'],
  ['BH', 'BHR', '048', 'البحرين', 'Bahrain', 'Western Asia', 'Western Asia', 'BHD', '+973'],
  ['JO', 'JOR', '400', 'الأردن', 'Jordan', 'Western Asia', 'Western Asia', 'JOD', '+962'],
  ['EG', 'EGY', '818', 'مصر', 'Egypt', 'Africa', 'Northern Africa', 'EGP', '+20'],
  ['TR', 'TUR', '792', 'تركيا', 'Turkey', 'Western Asia', 'Western Asia', 'TRY', '+90'],
  ['US', 'USA', '840', 'الولايات المتحدة', 'United States', 'Americas', 'Northern America', 'USD', '+1'],
  ['GB', 'GBR', '826', 'المملكة المتحدة', 'United Kingdom', 'Europe', 'Northern Europe', 'GBP', '+44'],
  ['DE', 'DEU', '276', 'ألمانيا', 'Germany', 'Europe', 'Western Europe', 'EUR', '+49'],
  ['FR', 'FRA', '250', 'فرنسا', 'France', 'Europe', 'Western Europe', 'EUR', '+33'],
  ['CN', 'CHN', '156', 'الصين', 'China', 'Asia', 'Eastern Asia', 'CNY', '+86'],
  ['IN', 'IND', '356', 'الهند', 'India', 'Asia', 'Southern Asia', 'INR', '+91'],
  ['NL', 'NLD', '528', 'هولندا', 'Netherlands', 'Europe', 'Western Europe', 'EUR', '+31'],
  ['SE', 'SWE', '752', 'السويد', 'Sweden', 'Europe', 'Northern Europe', 'SEK', '+46'],
  ['NO', 'NOR', '578', 'النرويج', 'Norway', 'Europe', 'Northern Europe', 'NOK', '+47'],
  ['CH', 'CHE', '756', 'سويسرا', 'Switzerland', 'Europe', 'Western Europe', 'CHF', '+41'],
];

export async function seedGlobalReferenceData(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Ensure tables exist (idempotent, mirrors Drizzle schema) ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS countries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        code2 VARCHAR(2) NOT NULL UNIQUE,
        code3 VARCHAR(3) NOT NULL UNIQUE,
        numeric_code VARCHAR(3),
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        region VARCHAR(100),
        sub_region VARCHAR(100),
        currency_code VARCHAR(3),
        phone_code VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS item_units (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(50) NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'COUNT',
        symbol_ar VARCHAR(20),
        symbol_en VARCHAR(20),
        base_unit_code VARCHAR(50),
        conversion_factor NUMERIC DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ── Currencies (global ISO 4217, org-nullable = shared catalog) ──
    // NOTE: matches the real currencies schema (is_base, no exchange_rate).
    for (const [code, ar, en, symbol, isBase] of CURRENCIES) {
      await client.query(
        `INSERT INTO currencies (code, name_ar, name_en, symbol, is_base, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (code) DO NOTHING`,
        [code, ar, en, symbol, isBase]
      );
    }

    // ── Countries (ISO 3166-1) ──
    for (const [c2, c3, num, ar, en, region, sub, cur, phone] of COUNTRIES) {
      await client.query(
        `INSERT INTO countries (code2, code3, numeric_code, name_ar, name_en, region, sub_region, currency_code, phone_code, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         ON CONFLICT (code2) DO NOTHING`,
        [c2, c3, num, ar, en, region, sub, cur, phone]
      );
    }

    // ── Units of Measure (baseline, default org) ──
    const DEFAULT_ORG = '00000000-0000-0000-0000-000000000001';
    for (const [code, ar, en, cat, symAr, symEn, base, factor] of UNITS) {
      const exists = await client.query(
        `SELECT 1 FROM item_units WHERE organization_id = $1 AND code = $2 LIMIT 1`,
        [DEFAULT_ORG, code]
      );
      if (exists.rowCount === 0) {
        await client.query(
          `INSERT INTO item_units (organization_id, code, name_ar, name_en, category, symbol_ar, symbol_en, base_unit_code, conversion_factor, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
          [DEFAULT_ORG, code, ar, en, cat, symAr, symEn, base, factor]
        );
      }
    }

    await client.query('COMMIT');
    logger.info('[SEEDER] global reference data (countries/currencies/uom) seeded', { context: 'seeder' });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error(`[SEEDER] global reference data: ${err.message}`, { context: 'seeder' });
  } finally {
    client.release();
  }
}
