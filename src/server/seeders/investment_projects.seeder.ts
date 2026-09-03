/**
 * NexoraOS™ — Investment Projects Seeder
 * Seeds endowment investment projects and returns history.
 */

import pg from 'pg';
import logger from '../core/logger';

export async function ensureInvestmentProjectsSchema(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS investment_projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
      project_code VARCHAR(50) NOT NULL UNIQUE,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      capital_allocated_yer NUMERIC NOT NULL DEFAULT 0,
      accumulated_returns_yer NUMERIC DEFAULT 0,
      net_annual_profit_yer NUMERIC DEFAULT 0,
      expected_roi_pct NUMERIC DEFAULT 0,
      actual_roi_pct NUMERIC DEFAULT 0,
      irr_pct NUMERIC DEFAULT 0,
      occupancy_or_yield_pct NUMERIC DEFAULT 0,
      risk_level VARCHAR(20) DEFAULT 'LOW',
      endowment_preservation_status VARCHAR(30) DEFAULT 'PRESERVED',
      humanitarian_distribution_pct NUMERIC DEFAULT 70,
      assigned_investment_manager TEXT,
      approval_status VARCHAR(30) DEFAULT 'APPROVED',
      security_clearance_level INT DEFAULT 3,
      location_governorate TEXT DEFAULT 'مأرب',
      shariah_cert_number TEXT DEFAULT 'SH-2025-001',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE IF NOT EXISTS investment_returns_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES investment_projects(id) ON DELETE CASCADE,
      fiscal_period VARCHAR(20) NOT NULL,
      gross_revenue_yer NUMERIC NOT NULL,
      operational_expenses_yer NUMERIC DEFAULT 0,
      net_profit_yer NUMERIC NOT NULL,
      transferred_to_charity_yer NUMERIC NOT NULL,
      reinvested_amount_yer NUMERIC NOT NULL,
      recorded_by_user TEXT NOT NULL,
      audited_by_cfo TEXT,
      approval_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS investment_contracts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES investment_projects(id) ON DELETE CASCADE,
      contract_code VARCHAR(50) NOT NULL UNIQUE,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      contract_type VARCHAR(50) NOT NULL,
      second_party_name TEXT NOT NULL,
      second_party_type VARCHAR(50) NOT NULL,
      value_yer NUMERIC DEFAULT 0,
      payment_frequency VARCHAR(30) DEFAULT 'ANNUAL',
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(30) DEFAULT 'ACTIVE',
      security_clearance_level INT DEFAULT 2,
      notes_ar TEXT,
      notes_en TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS investment_activities (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES investment_projects(id) ON DELETE CASCADE,
      activity_code VARCHAR(50) NOT NULL,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      activity_type VARCHAR(50) NOT NULL,
      planned_date DATE NOT NULL,
      execution_date DATE,
      budget_allocated_yer NUMERIC DEFAULT 0,
      actual_cost_yer NUMERIC DEFAULT 0,
      status VARCHAR(30) DEFAULT 'SCHEDULED',
      assigned_lead TEXT,
      execution_notes_ar TEXT,
      execution_notes_en TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

export async function seedInvestmentProjectsIfEmpty(pool: pg.Pool): Promise<void> {
  try {
    await ensureInvestmentProjectsSchema(pool);
    const checkRes = await pool.query("SELECT COUNT(*) FROM investment_projects");
    const count = parseInt(checkRes.rows[0].count);
    if (count > 0) return;

    const projects = [
      ['INV-2025-001', 'وقف البر والعطاء العقاري الموحد - مأرب', 'Al-Birr Real Estate Endowment Complex - Marib', 'REAL_ESTATE_ENDOWMENT', 450000000, 112500000, 58500000, 14.0, 13.0, 14.8, 96.5, 'LOW', 'PRESERVED', 75, 'د. عبدالحكيم السقاف', 'APPROVED', 3, 'مأرب'],
      ['INV-2025-002', 'مشروع الخلايا الشمسية ومعاصر الزيتون التنموية', 'Solar Powered Olive Press & Productive Agriculture', 'AGRICULTURAL_PRODUCTIVE', 280000000, 64400000, 39200000, 15.5, 14.0, 15.2, 88.0, 'MEDIUM', 'PRESERVED', 70, 'م. ناصر سعيد المعمري', 'APPROVED', 2, 'الساحل الغربي'],
      ['INV-2025-003', 'محطة مياه النقاء الاستثمارية - وحدة تحلية تجارية', 'Al-Naqa Commercial Water Purification Plant', 'SOCIAL_ENTERPRISE', 190000000, 41800000, 24700000, 13.5, 13.0, 13.9, 92.0, 'LOW', 'PRESERVED', 80, 'م. أحمد سالم باثواب', 'APPROVED', 2, 'الحديدة'],
      ['INV-2025-004', 'محفظة الصكوك الأوقافية السيادية المستدامة', 'Sovereign Endowment Sukuk Portfolio', 'EQUITY_PORTFOLIO', 350000000, 77000000, 42000000, 12.0, 12.0, 12.5, 100.0, 'LOW', 'PRESERVED', 65, 'أ. سالم عبدالله العولقي', 'APPROVED', 3, 'المركز الرئيسي'],
      ['INV-2025-005', 'وقف الوفاء السكني والتجاري للأيتام - عدن', 'Al-Wafa Residential & Commercial Orphan Endowment - Aden', 'REAL_ESTATE_ENDOWMENT', 520000000, 93600000, 62400000, 13.0, 12.0, 13.4, 94.0, 'LOW', 'PRESERVED', 85, 'أ. فاطمة باعباد', 'APPROVED', 3, 'عدن']
    ];

    const invCols = ['project_code', 'title_ar', 'title_en', 'category', 'capital_allocated_yer', 'accumulated_returns_yer', 'net_annual_profit_yer', 'expected_roi_pct', 'actual_roi_pct', 'irr_pct', 'occupancy_or_yield_pct', 'risk_level', 'endowment_preservation_status', 'humanitarian_distribution_pct', 'assigned_investment_manager', 'approval_status', 'security_clearance_level', 'location_governorate'];
    const invValues: any[] = [];
    const invPlaceholders = projects.map((p, i) => {
      const offset = i * 18;
      invValues.push(...p);
      return `(${Array.from({ length: 18 }, (_, j) => `$${offset + j + 1}`).join(', ')})`;
    }).join(', ');
    const invRes = await pool.query(`INSERT INTO investment_projects (${invCols.join(', ')}) VALUES ${invPlaceholders} RETURNING id, net_annual_profit_yer, humanitarian_distribution_pct`, invValues);

    const returnRows: any[] = [];
    for (const row of invRes.rows) {
      const netProfit = Number(row.net_annual_profit_yer);
      const distPct = Number(row.humanitarian_distribution_pct);
      const charityShare = netProfit * 0.23 * (distPct / 100.0);
      const reinvestShare = netProfit * 0.23 * (1 - distPct / 100.0);
      const charityShareQ1 = netProfit * 0.24 * (distPct / 100.0);
      const reinvestShareQ1 = netProfit * 0.24 * (1 - distPct / 100.0);
      returnRows.push(row.id, '2024-Q4', netProfit * 0.28, netProfit * 0.05, netProfit * 0.23, charityShare, reinvestShare);
      returnRows.push(row.id, '2025-Q1', netProfit * 0.30, netProfit * 0.06, netProfit * 0.24, charityShareQ1, reinvestShareQ1);
    }
    if (returnRows.length > 0) {
      const retPlaceholders = invRes.rows.map((_: any, i: number) => {
        const bOffset = i * 14;
        return `($${bOffset + 1}, $${bOffset + 2}, $${bOffset + 3}, $${bOffset + 4}, $${bOffset + 5}, $${bOffset + 6}, $${bOffset + 7}, 'د. عبدالحكيم السقاف', 'أ. سالم عبدالله العولقي'), ($${bOffset + 8}, $${bOffset + 9}, $${bOffset + 10}, $${bOffset + 11}, $${bOffset + 12}, $${bOffset + 13}, $${bOffset + 14}, 'د. عبدالحكيم السقاف', 'أ. سالم عبدالله العولقي')`;
      }).join(', ');
      await pool.query(`INSERT INTO investment_returns_history (project_id, fiscal_period, gross_revenue_yer, operational_expenses_yer, net_profit_yer, transferred_to_charity_yer, reinvested_amount_yer, recorded_by_user, audited_by_cfo) VALUES ${retPlaceholders}`, returnRows);
    }

    logger.info('[SEEDER] investment_projects seeded', { context: 'seeder' });
  } catch (err: any) {
    logger.error(`[SEEDER] investment_projects: ${err.message}`, { context: 'seeder' });
  }
}
