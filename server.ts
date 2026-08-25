import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { LRUCache } from 'lru-cache';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import geminiRouter from './src/server/routes/v2/gemini.routes';
import { financeRouter } from './src/server/routes/finance.routes';
import { healthRouter } from './src/server/routes/health.routes';
import { masterOperationsRouter } from './src/server/routes/operations_master.routes';
import { salesRouter } from './src/server/routes/sales.routes';
import { fundingRouter } from './src/server/routes/funding.routes';
import { operationalDomainRouter } from './src/server/routes/operational_domains.routes';
import { csrfProtection } from './src/server/middleware/csrf.middleware';
import {
  runEnterpriseSchemaCompletion,
  applyEnterpriseIndexes,
  applyEnterpriseViews,
  seedEnterpriseUsersAndOrg
} from './src/server/database/enterprise_schema_completion';
import { enforceAllPolicies, type PolicyContext, type PolicyViolation } from './src/server/services/policyEngine';
import logger from './src/server/core/logger';

dotenv.config();

// ═══════════════════════════════════════════════════════════════════
// Comprehensive Environment Variable Validation
// ═══════════════════════════════════════════════════════════════════
interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateEnvironmentConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  } else {
    try {
      const url = new URL(process.env.DATABASE_URL);
      if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
        errors.push('DATABASE_URL must be a PostgreSQL connection string');
      }
    } catch {
      errors.push('DATABASE_URL is not a valid URL');
    }
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required');
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  // Optional but recommended
  if (!process.env.GEMINI_API_KEY) {
    warnings.push('GEMINI_API_KEY not set - AI features will be unavailable');
  } else if (process.env.GEMINI_API_KEY.length < 32) {
    warnings.push('GEMINI_API_KEY appears to be invalid (too short)');
  }

  if (!process.env.ALLOWED_ORIGINS) {
    if (process.env.NODE_ENV === 'production') {
      errors.push('ALLOWED_ORIGINS must be set in production');
    } else {
      warnings.push('ALLOWED_ORIGINS not set - CORS will allow all origins in development');
    }
  }

  if (!process.env.GOOGLE_MAPS_PLATFORM_KEY) {
    warnings.push('GOOGLE_MAPS_PLATFORM_KEY not set - using Leaflet maps');
  }

  // Validate numeric values
  if (process.env.PORT && isNaN(Number(process.env.PORT))) {
    errors.push('PORT must be a valid number');
  }

  return { valid: errors.length === 0, errors, warnings };
}

const configValidation = validateEnvironmentConfig();

if (configValidation.errors.length > 0) {
  logger.error('[CONFIG ERROR] The following configuration errors were found:', { context: 'config' });
  configValidation.errors.forEach(err => logger.error(`  - ${err}`, { context: 'config' }));
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid configuration. Application cannot start.');
  }
}

if (configValidation.warnings.length > 0) {
  logger.warn('[CONFIG WARNING] The following configuration warnings were found:', { context: 'config' });
  configValidation.warnings.forEach(warn => logger.warn(`  - ${warn}`, { context: 'config' }));
}

// Ensure GEMINI_API_KEY is defined so route checks and instantiations don't throw
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock-api-key-for-development') {
  if (process.env.NODE_ENV === 'production') {
    logger.error('[STARTUP WARNING] GEMINI_API_KEY is not set. AI features will be unavailable.', { context: 'startup' });
  } else {
    logger.warn('[DEV] GEMINI_API_KEY not configured. AI features will return stub responses.', { context: 'startup' });
  }
  // Do NOT inject a mock key — let callers handle missing key gracefully
  delete process.env.GEMINI_API_KEY;
}

const app = express();
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[EXPRESS REQUEST] ${req.method} ${req.url} - path: ${req.path}`, { context: 'http' });
  }
  next();
});
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://maps.googleapis.com"],
      connectSrc: ["'self'", "https://*.neon.tech", "https://maps.googleapis.com", "https://*.googleapis.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'sameorigin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
app.use(compression());
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
if (process.env.NODE_ENV === 'production' && ALLOWED_ORIGINS.length === 0) {
  logger.error('[STARTUP WARNING] ALLOWED_ORIGINS is not set in production. CORS will reject all cross-origin requests.', { context: 'startup' });
}
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.length === 0 && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('[:date[iso]] :method :url :status :response-time ms - :res[content-length]')); // Enterprise structured HTTP logging
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(process.cwd(), 'public'), { maxAge: '1d' }));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Removed for iFrame preview
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CSRF Protection — validates Origin/Referer on state-changing requests
app.use(csrfProtection);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login/auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) {
    return authLimiter(req, res, next);
  }
  next();
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return apiLimiter(req, res, next);
  }
  next();
});

// Process Level Safety Guards
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`, { context: 'process' });
});
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err}`, { context: 'process' });
});

// Enterprise Database Query Execution — imported from core/database
import { getPool as coreGetPool } from './src/server/core/database';

async function ensureFixedAssetsSchema(poolInstance: pg.Pool) {
  try {
    await poolInstance.query(`
      ALTER TABLE fixed_assets 
      ADD COLUMN IF NOT EXISTS category VARCHAR,
      ADD COLUMN IF NOT EXISTS serial_number VARCHAR,
      ADD COLUMN IF NOT EXISTS supplier_name VARCHAR,
      ADD COLUMN IF NOT EXISTS supplier_contact VARCHAR,
      ADD COLUMN IF NOT EXISTS warranty_expiry_date VARCHAR,
      ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR,
      ADD COLUMN IF NOT EXISTS location_name VARCHAR,
      ADD COLUMN IF NOT EXISTS project_id VARCHAR,
      ADD COLUMN IF NOT EXISTS project_name VARCHAR,
      ADD COLUMN IF NOT EXISTS activity_id VARCHAR,
      ADD COLUMN IF NOT EXISTS assigned_custodian_hr VARCHAR,
      ADD COLUMN IF NOT EXISTS condition_code VARCHAR,
      ADD COLUMN IF NOT EXISTS last_maintenance_date VARCHAR,
      ADD COLUMN IF NOT EXISTS next_maintenance_date VARCHAR,
      ADD COLUMN IF NOT EXISTS disposal_date VARCHAR,
      ADD COLUMN IF NOT EXISTS disposal_reason TEXT,
      ADD COLUMN IF NOT EXISTS metadata JSONB;
    `);
    if (process.env.NODE_ENV !== 'production') {
      logger.info("fixed_assets table schema migration ensured successfully.", { context: 'database' });
    }
  } catch (err) {
    logger.warn(`Could not alter fixed_assets table schema: ${err}`, { context: 'database' });
  }
}

async function seedFixedAssetsIfEmpty(poolInstance: pg.Pool) {
  try {
    await ensureFixedAssetsSchema(poolInstance);
    const checkRes = await poolInstance.query("SELECT COUNT(*) FROM fixed_assets");
    const count = parseInt(checkRes.rows[0].count);
    if (count === 0) {
      if (process.env.NODE_ENV !== 'production') {
        logger.info("Seeding fixed_assets table with realistic live database records...", { context: 'database' });
      }
      const query = `
        INSERT INTO fixed_assets (
          organization_id, asset_code, name_en, name_ar, category, serial_number,
          purchase_date, purchase_cost, current_value, depreciation_rate, accumulated_depreciation, 
          useful_life_months, residual_value, supplier_name, supplier_contact, warranty_expiry_date,
          location_name, warehouse_id, project_id, project_name, activity_id,
          assigned_custodian_hr, condition_code, status_code, last_maintenance_date, next_maintenance_date, security_level
        ) VALUES 
        ('00000000-0000-0000-0000-000000000001', 'AST-2026-0001', 'Toyota Hilux 4WD Operations Vehicle', 'سيارة تويوتا هايلوكس دبل كابين 4WD', 'VEHICLE', 'SN-TH-998241', '2025-01-15', 45000000, 38000000, 10, 7000000, 60, 5000000, 'شركة وكالة التيسير للسيارات', '+967-771234567', '2027-01-15', 'المستودع المركزي - مأرب الرئيسي', 'wh-1', 'prj-101', 'مشروع السلال الغذائية والأمن الغذائي مأرب', 'ACT-LOGISTICS-01', 'م. أحمد سالم باثواب (مسؤول اللوجستيات)', 'USED_GOOD', 'MAPPED_TO_PROJECT', '2026-06-10', '2026-12-10', 3),
        ('00000000-0000-0000-0000-000000000001', 'AST-2026-0002', 'Nexora Enterprise Server Node', 'خوادم معالجة البيانات المركزية Nexora', 'IT_EQUIPMENT', 'SN-NX-774012', '2025-06-10', 12000000, 9500000, 15, 2500000, 36, 1000000, 'الشركة اليمنية للحلول الرقمية', '+967-733445566', '2028-06-10', 'غرفة الخوادم الرئيسية - الإدارة العامة', 'wh-1', 'prj-103', 'مشروع التحول الرقمي والأثر الميداني', 'ACT-IT-CORE', 'د. عبدالكريم الحمداني (مدير النظم والمعلومات)', 'NEW', 'ACTIVE', '2026-05-01', '2026-11-01', 3),
        ('00000000-0000-0000-0000-000000000001', 'AST-2026-0003', 'Coastal Borehole Drilling Rig', 'حفار آبار المياه الجوفية التكتيكي الثقيل', 'HEAVY_MACHINERY', 'SN-DRILL-88391', '2024-03-20', 180000000, 140000000, 8, 40000000, 120, 20000000, 'المؤسسة العربية للمعدات الثقيلة', '+967-711889900', '2026-03-20', 'موقع الحفر الميداني - الحديدة', 'wh-2', 'prj-102', 'مشروع الاستجابة الطارئة والمياه - الساحل الغربي', 'ACT-WATER-RIG', 'م. ناصر سعيد المعمري (مهندس حفر الآبار)', 'UNDER_MAINTENANCE', 'UNDER_MAINTENANCE', '2026-07-15', '2026-08-15', 3),
        ('00000000-0000-0000-0000-000000000001', 'AST-2026-0004', 'Solar Water Pump System', 'منظومة ضخ مياه بالطاقة الشمسية المتكاملة', 'EQUIPMENT', 'SN-SOLAR-3321', '2025-09-01', 35000000, 32000000, 12, 3000000, 84, 3000000, 'شركة طاقة المستقبل اليمنية', '+967-775511223', '2030-09-01', 'مستودع الساحل الغربي - الحديدة', 'wh-2', 'prj-102', 'مشروع الاستجابة الطارئة والمياه - الساحل الغربي', 'ACT-SOLAR-02', 'م. خالد عبدالرحيم (أخصائي الطاقة البديلة)', 'USED_GOOD', 'MAPPED_TO_PROJECT', '2026-04-10', '2026-10-10', 3)
      `;
      await poolInstance.query(query);
      if (process.env.NODE_ENV !== 'production') {
        logger.info("Seeding fixed_assets completed successfully.", { context: 'database' });
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`fixed_assets table already has ${count} records. No seeding needed.`, { context: 'database' });
      }
    }
  } catch (err) {
    logger.error(`Failed to seed fixed_assets table: ${err}`, { context: 'database' });
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
    logger.warn(`Could not create exchange_rates table schema: ${err}`, { context: 'database' });
  }
}

async function seedExchangeRatesIfEmpty(poolInstance: pg.Pool) {
  try {
    await ensureExchangeRatesSchema(poolInstance);
    const checkRes = await poolInstance.query("SELECT COUNT(*) FROM exchange_rates");
    const count = parseInt(checkRes.rows[0].count);
    if (count === 0) {
      if (process.env.NODE_ENV !== 'production') {
        logger.info("Seeding exchange_rates table with default rates...", { context: 'database' });
      }
      const curRes = await poolInstance.query("SELECT id, code FROM currencies");
      const currenciesMap = curRes.rows.reduce((map: any, row: any) => {
        map[row.code] = row.id;
        return map;
      }, {});

      const usdId = currenciesMap['USD'];
      const yerId = currenciesMap['YER'];
      const sarId = currenciesMap['SAR'];

      if (usdId && yerId) {
        await poolInstance.query(`
          INSERT INTO exchange_rates (organization_id, from_currency_id, to_currency_id, rate, effective_date, security_level)
          VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, 530.00, '2026-01-01', 3)
        `, [usdId, yerId]);
      }
      if (sarId && yerId) {
        await poolInstance.query(`
          INSERT INTO exchange_rates (organization_id, from_currency_id, to_currency_id, rate, effective_date, security_level)
          VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, 140.00, '2026-01-01', 3)
        `, [sarId, yerId]);
      }
      if (usdId && sarId) {
        await poolInstance.query(`
          INSERT INTO exchange_rates (organization_id, from_currency_id, to_currency_id, rate, effective_date, security_level)
          VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, 3.75, '2026-01-01', 3)
        `, [usdId, sarId]);
      }
      if (process.env.NODE_ENV !== 'production') {
        logger.info("Seeding exchange_rates completed.", { context: 'database' });
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`exchange_rates table already has ${count} records. No seeding needed.`, { context: 'database' });
      }
    }
  } catch (err) {
    logger.error(`Failed to seed exchange_rates table: ${err}`, { context: 'database' });
  }
}

async function ensureStrategicPlanningSchema(poolInstance: pg.Pool) {
  try {
    await poolInstance.query(`
      CREATE TABLE IF NOT EXISTS strategic_plans (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
        plan_code VARCHAR(50) NOT NULL UNIQUE,
        title_ar TEXT NOT NULL,
        title_en TEXT NOT NULL,
        start_year INT NOT NULL,
        end_year INT NOT NULL,
        vision_ar TEXT,
        vision_en TEXT,
        mission_ar TEXT,
        mission_en TEXT,
        core_values JSONB,
        strategic_pillars JSONB,
        target_beneficiaries_count BIGINT DEFAULT 500000,
        total_estimated_budget_yer NUMERIC DEFAULT 1200000000,
        overall_progress_pct NUMERIC DEFAULT 0,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        security_level INT DEFAULT 3,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS strategic_goals (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        plan_id UUID NOT NULL REFERENCES strategic_plans(id) ON DELETE CASCADE,
        goal_code VARCHAR(50) NOT NULL UNIQUE,
        pillar_code VARCHAR(50) NOT NULL,
        title_ar TEXT NOT NULL,
        title_en TEXT NOT NULL,
        description_ar TEXT,
        description_en TEXT,
        weight_pct NUMERIC DEFAULT 10,
        progress_pct NUMERIC DEFAULT 0,
        kpi_target NUMERIC NOT NULL,
        kpi_current NUMERIC DEFAULT 0,
        kpi_unit_ar VARCHAR(50),
        kpi_unit_en VARCHAR(50),
        allocated_budget_yer NUMERIC DEFAULT 0,
        spent_budget_yer NUMERIC DEFAULT 0,
        assigned_owner_role TEXT,
        assigned_owner_name TEXT,
        linked_domain VARCHAR(30) DEFAULT 'NEB-01',
        status VARCHAR(30) DEFAULT 'ON_TRACK',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS swot_analysis (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        plan_id UUID NOT NULL REFERENCES strategic_plans(id) ON DELETE CASCADE,
        category VARCHAR(30) NOT NULL,
        title_ar TEXT NOT NULL,
        title_en TEXT NOT NULL,
        impact_level VARCHAR(30) DEFAULT 'HIGH',
        strategic_action_ar TEXT,
        strategic_action_en TEXT,
        linked_goal_code VARCHAR(50),
        owner_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS strategic_kpis (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        goal_id UUID NOT NULL REFERENCES strategic_goals(id) ON DELETE CASCADE,
        kpi_code VARCHAR(50) NOT NULL UNIQUE,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        measurement_frequency VARCHAR(30) DEFAULT 'QUARTERLY',
        baseline_value NUMERIC DEFAULT 0,
        target_value NUMERIC NOT NULL,
        current_value NUMERIC DEFAULT 0,
        unit_ar VARCHAR(30),
        unit_en VARCHAR(30),
        status VARCHAR(30) DEFAULT 'ON_TRACK',
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS strategic_initiatives (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        goal_id UUID NOT NULL REFERENCES strategic_goals(id) ON DELETE CASCADE,
        initiative_code VARCHAR(50) NOT NULL UNIQUE,
        title_ar TEXT NOT NULL,
        title_en TEXT NOT NULL,
        linked_program_id VARCHAR(50),
        linked_project_id VARCHAR(50),
        budget_allocated NUMERIC DEFAULT 0,
        completion_pct NUMERIC DEFAULT 0,
        status VARCHAR(30) DEFAULT 'IN_PROGRESS',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION fn_recalculate_strategic_plan_progress()
      RETURNS TRIGGER AS $$
      DECLARE
        v_plan_id UUID;
        v_avg_progress NUMERIC;
      BEGIN
        IF TG_OP = 'DELETE' THEN
          v_plan_id := OLD.plan_id;
        ELSE
          v_plan_id := NEW.plan_id;
        END IF;

        SELECT ROUND(COALESCE(SUM(progress_pct * (weight_pct / 100.0)), AVG(progress_pct)), 2)
        INTO v_avg_progress
        FROM strategic_goals
        WHERE plan_id = v_plan_id AND deleted_at IS NULL;

        UPDATE strategic_plans
        SET overall_progress_pct = COALESCE(v_avg_progress, 0),
            updated_at = NOW()
        WHERE id = v_plan_id;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_strategic_goals_progress_update ON strategic_goals;

      CREATE TRIGGER trg_strategic_goals_progress_update
      AFTER INSERT OR UPDATE OR DELETE ON strategic_goals
      FOR EACH ROW EXECUTE FUNCTION fn_recalculate_strategic_plan_progress();
    `);
    if (process.env.NODE_ENV !== 'production') {
      logger.info("Strategic Planning Schema, Triggers, and Functions ensured successfully.", { context: 'database' });
    }
  } catch (err: any) {
    logger.warn(`Could not create strategic_planning schema: ${err.message}`, { context: 'database' });
  }
}

async function seedStrategicPlanningIfEmpty(poolInstance: pg.Pool) {
  try {
    await ensureStrategicPlanningSchema(poolInstance);
    const checkRes = await poolInstance.query("SELECT COUNT(*) FROM strategic_plans");
    const count = parseInt(checkRes.rows[0].count);
    if (count === 0) {
      if (process.env.NODE_ENV !== 'production') {
        logger.info("Seeding strategic_plans table with real Rohama'a Baynahum 5-year plan data...", { context: 'database' });
      }
      
      const coreValues = JSON.stringify([
        { code: "VAL-01", name_ar: "الشفافية والحوكمة", name_en: "Transparency & Governance" },
        { code: "VAL-02", name_ar: "الكرامة الإنسانية", name_en: "Human Dignity" },
        { code: "VAL-03", name_ar: "الاستدامة والتمكين", name_en: "Sustainability & Empowerment" },
        { code: "VAL-04", name_ar: "الإبداع والتحول الرقمي", name_en: "Digital Innovation & Transformation" },
        { code: "VAL-05", name_ar: "الشراكة الفاعلة", name_en: "Effective Strategic Partnerships" }
      ]);

      const pillars = JSON.stringify([
        { code: "PIL-FINANCE", title_ar: "الاستدامة المالية وتنويع التمويل", title_en: "Financial Sustainability & Resource Diversification", icon: "Coins", weight_pct: 20 },
        { code: "PIL-GOVERNANCE", title_ar: "التحول الرقمي والتميز المؤسسي", title_en: "Digital Transformation & Institutional Excellence", icon: "ShieldCheck", weight_pct: 20 },
        { code: "PIL-SERVICE", title_ar: "جودة الخدمات والأثر الإنساني", title_en: "Service Quality & Humanitarian Impact", icon: "HeartHandshake", weight_pct: 25 },
        { code: "PIL-OPS", title_ar: "التميز التشغيلي والتكيف الميداني", title_en: "Operational Excellence & Field Execution", icon: "Building2", weight_pct: 20 },
        { code: "PIL-HUMAN", title_ar: "الاستثمار البشري والتمكين المجتمعي", title_en: "Human Capital & Community Empowerment", icon: "Users", weight_pct: 15 }
      ]);

      const planRes = await poolInstance.query(`
        INSERT INTO strategic_plans (
          organization_id, plan_code, title_ar, title_en, start_year, end_year,
          vision_ar, vision_en, mission_ar, mission_en, core_values, strategic_pillars,
          target_beneficiaries_count, total_estimated_budget_yer, overall_progress_pct, status
        ) VALUES (
          '00000000-0000-0000-0000-000000000001', 'STP-2025-2029',
          'الخطة الاستراتيجية الخمسية لمؤسسة رُحماء بينهم (2025 - 2029)',
          '5-Year Strategic Plan for Rohamaa Baynahum Foundation (2025-2029)',
          2025, 2029,
          'الريادة والإبداع في تقديم الخدمات الإنسانية والتنموية المستدامة وتمكين المجتمعات النائية في اليمن وفق أعلى معايير الحوكمة الشاملة والشفافية الرقمية.',
          'Leadership and innovation in providing sustainable humanitarian and development services, empowering remote communities in Yemen according to the highest standards of governance and transparency.',
          'تقديم مساعدات إغاثية وتنموية متكاملة ترتقي بحياة الفئات الأشد ضعفاً، وتكفل الأيتام، وتستثمر في الموارد البشرية والتحول الرقمي من خلال شراكات استراتيجية موثوقة.',
          'Delivering integrated relief and development aid to uplift vulnerable populations, sponsor orphans, and invest in human capital and digital transformation through trusted strategic partnerships.',
          $1, $2, 500000, 1850000000, 83.2, 'ACTIVE'
        ) RETURNING id
      `, [coreValues, pillars]);

      const planId = planRes.rows[0].id;

      // Seed 10 Real Strategic Goals
      const goals = [
        ['OBJ-2025-01', 'PIL-FINANCE', 'رفع إيرادات التمويل الذاتي والأوقاف إلى 35% من الميزانية', 'Increase self-funding and endowments revenue to 35% of operational budget', 'استراتيجية تنويع مصادر الدخل وإنشاء أوقاف إنتاجية لتقليل الاعتماد على التبرعات الموسمية.', 'Diverting income sources into productive endowments to lower reliance on seasonal donations.', 12, 68, 35, 24, '%', '%', 250000000, 170000000, 'مدير الاستثمار والتنميه', 'د. عبدالحكيم السقاف', 'NEB-15', 'ON_TRACK'],
        ['OBJ-2025-02', 'PIL-GOVERNANCE', 'التحول الرقمي المكتمل 100% والارتباط المباشر بـ Neon PostgreSQL', '100% Digital Transformation across all enterprise operations', 'ربط كافة إدارات المؤسسة والأنشطة الميدانية بنظام التشغيل المؤسسي NexoraOS.', 'Connecting all enterprise domains and field activities to NexoraOS cloud database.', 12, 92, 100, 92, '%', '%', 180000000, 165000000, 'مدير النظم والمعلومات', 'د. عبدالكريم الحمداني', 'NEB-12', 'ON_TRACK'],
        ['OBJ-2025-03', 'PIL-SERVICE', 'تقديم الرعاية الشاملة لـ 15,000 يتيم وأسرة مكفولة مع التحديث الجغرافي', 'Provide comprehensive care to 15,000 sponsored orphans with GPS field updates', 'تأمين المساعدات الشهرية والتعليمية والصحية للأيتام والأسر المعسرة الموثقة برقم الهوية والبصمة.', 'Securing monthly living, education, and healthcare stipends for registered beneficiaries.', 15, 78, 15000, 11700, 'أسرة / يتيم', 'Families/Orphans', 450000000, 351000000, 'مديرة إدارة الكفالات', 'أ. فاطمة باعباد', 'NEB-06', 'ON_TRACK'],
        ['OBJ-2025-04', 'PIL-SERVICE', 'تنفيذ مشاريع استجابة طوارئ مائية وتنموية لـ 250,000 مستفيد', 'Execute emergency water and relief projects benefiting 250,000+ people', 'حفر آبار مياه الشرب وتزويدها بمنظومات طاقة شمسية في مأرب والساحل الغربي.', 'Drilling deep groundwater boreholes powered by solar energy pumps in West Coast & Marib.', 15, 85, 250000, 212500, 'مستفيد', 'Beneficiaries', 380000000, 323000000, 'مدير المشاريع الميدانية', 'م. ناصر سعيد المعمري', 'NEB-04', 'ON_TRACK'],
        ['OBJ-2025-05', 'PIL-FINANCE', 'تطبيق معايير الامتثال المالي الدولية IPSAS وشفافية تدقيق 100%', 'Implement IPSAS international accounting standards with 100% audit compliance', 'الالتزام الكامل بالقيود المزدوجة وتقارير التدقيق المالي المعتمدة وقوائم الحسابات الختامية.', 'Full compliance with double-entry ledger, audited financial statements, and IPSAS taxonomy.', 10, 95, 100, 95, '%', '%', 90000000, 85000000, 'المدير المالي', 'أ. سالم عبدالله العولقي', 'NEB-10', 'ON_TRACK'],
        ['OBJ-2025-06', 'PIL-OPS', 'تطبيق نظام المقارنة الثلاثية والمناقصات الشفافة بنسبة 100% في المشتريات', '100% Implementation of 3-Way Quote Comparison Matrix in Procurement', 'إخضاع جميع عمليات التوريد لطلبات الشراء وتتبع المناقصات عبر بوابات العروض المقارنة.', 'Subjecting all purchasing processes to formal PRs, RFQs, and 3-way quote matrix.', 10, 88, 100, 88, '%', '%', 120000000, 105000000, 'مسؤول المشتريات', 'م. أحمد سالم باثواب', 'NEB-14', 'ON_TRACK'],
        ['OBJ-2025-07', 'PIL-HUMAN', 'تدريب وبناء قدرات 500 متطوع وكادر ميداني لتغطية المحافظات', 'Train and empower 500 field volunteers and staff across target governorates', 'تنفيذ دورات التقييم الميداني، إدارة الكوارث، والرفع ببيانات المستفيدين عبر التطبيق الرقمي.', 'Executing field assessment, disaster management, and digital beneficiary profiling workshops.', 8, 72, 500, 360, 'متدرب', 'Trainees', 60000000, 43200000, 'مسؤولة التدريب', 'أ. سمية باوزير', 'NEB-07', 'ON_TRACK'],
        ['OBJ-2025-08', 'PIL-GOVERNANCE', 'الحصول على اعتماد المعايير الإنسانية الدولية Sphere ومعايير CHS', 'Attain Sphere Humanitarian Standards & CHS Quality Certification', 'تطبيق الدليل الإنساني ومعايير الجودة والتحقق الامتثالي في توزيع المعونات الغذائية والمائية.', 'Applying international Sphere indicators and Quality & Accountability standards.', 8, 84, 100, 84, '%', '%', 50000000, 42000000, 'أخصائي الحوكمة', 'د. ياسر بافليلة', 'NEB-13', 'ON_TRACK'],
        ['OBJ-2025-09', 'PIL-FINANCE', 'تطوير محرك التنبؤ المالي بـ AI للتحوط ضد تقلبات العملة YER والتضخم', 'Develop AI Financial Predictive Engine for YER currency inflation hedging', 'توفير نماذج المحاكاة لـ 12 شهراً مستقبلياً للتنبؤ بالفجوات المالية وتقلبات الصرف.', 'Running 12-month predictive simulation models for cashflow liquidity and YER exchange rates.', 5, 90, 100, 90, '%', '%', 40000000, 36000000, 'مدير النظم والمعلومات', 'د. عبدالكريم الحمداني', 'NEB-13', 'ON_TRACK'],
        ['OBJ-2025-10', 'PIL-OPS', 'تأمين مخزون استراتيجي إغاثي يغطي احتياجات 10,000 أسرة في حالات الطوارئ', 'Secure strategic relief inventory buffer covering 10,000 emergency households', 'تجهيز مستودعات مأرب والحديدة بالسلال الغذائية والحقائب الإوائية لتلبية حالات الطوارئ.', 'Equipping Marib & Hodeidah warehouses with emergency food kits and shelter packages.', 5, 80, 10000, 8000, 'أسرة', 'Families', 150000000, 120000000, 'مدير المخازن', 'أ. خالد عبدالرحيم', 'NEB-09', 'ON_TRACK']
      ];

      // Batch insert strategic goals (19 columns each)
      const goalCols = ['plan_id', 'goal_code', 'pillar_code', 'title_ar', 'title_en', 'description_ar', 'description_en', 'weight_pct', 'progress_pct', 'kpi_target', 'kpi_current', 'kpi_unit_ar', 'kpi_unit_en', 'allocated_budget_yer', 'spent_budget_yer', 'assigned_owner_role', 'assigned_owner_name', 'linked_domain', 'status'];
      const goalValues: any[] = [];
      const goalPlaceholders = goals.map((g, i) => {
        const offset = i * 19;
        goalValues.push(planId, ...g);
        return `(${Array.from({ length: 19 }, (_, j) => `$${offset + j + 1}`).join(', ')})`;
      }).join(', ');
      await poolInstance.query(`INSERT INTO strategic_goals (${goalCols.join(', ')}) VALUES ${goalPlaceholders}`, goalValues);

      // Seed SWOT Analysis items
      const swotItems = [
        ['STRENGTH', 'بيئة رقمية موحدة وعالية الكفاءة عبر منصة NexoraOS وبدعم قاعدة Neon PostgreSQL', 'Unified high-performance digital workspace powered by NexoraOS and Neon PostgreSQL cloud database', 'CRITICAL', 'استدامة التميز التكنولوجي وتوسيع الربط الشبكي الميداني.', 'Sustain technology lead and extend offline field synchronization.', 'OBJ-2025-02', 'د. عبدالكريم الحمداني'],
        ['STRENGTH', 'شبكة ميدانية واسعة وفريق تطوعي مؤهل في محافظات مأرب والساحل الغربي والحديدة', 'Extensive field network and qualified volunteer force across Marib, West Coast & Hodeidah', 'HIGH', 'تفعيل التدريب المستمر وتقييم الأداء الميداني الرقمي.', 'Institutionalize ongoing training and digital performance evaluations.', 'OBJ-2025-07', 'أ. سمية باوزير'],
        ['STRENGTH', 'ثقة عالية ومعدل استبقاء وتجديد كفالات الأيتام يصل إلى 89.4%', 'High donor trust and orphan sponsorship renewal rate of 89.4%', 'HIGH', 'توسيع التغطية الإعلامية وتقارير التحديث الميداني المباشرة.', 'Expand direct impact field reporting to sponsors.', 'OBJ-2025-03', 'أ. فاطمة باعباد'],
        ['WEAKNESS', 'الاعتماد المرتفع نسبيًا على التبرعات الموسمية (رمضان والأضاحي)', 'High relative seasonal dependency on Ramadan & Qurbani campaigns', 'HIGH', 'تفعيل برامج الأوقاف والاستثمار التنموي المستدام.', 'Expand productive endowments and income-generating social programs.', 'OBJ-2025-01', 'د. عبدالحكيم السقاف'],
        ['WEAKNESS', 'التحديات اللوجستية وتكاليف النقل إلى القرى والوديان النائية', 'Logistics challenges and high transportation costs to remote mountain valleys', 'MEDIUM', 'استحداث نقاط توزيع فرعية وتوقيع عقود نقل محلية معتمدة.', 'Establish regional distribution hubs and local transport agreements.', 'OBJ-2025-04', 'م. ناصر سعيد المعمري'],
        ['OPPORTUNITY', 'التكامل الدولي عبر معايير IATI وتوزيع المساعدات طبقاً لمعايير Sphere العالمية', 'International reporting compliance via IATI standards and Sphere guidelines', 'CRITICAL', 'تعزيز الشراكات مع المنظمات الأممية OCHA, UNICEF, WFP.', 'Strengthen UN partnership proposals (OCHA, WFP, UNICEF).', 'OBJ-2025-08', 'د. ياسر بافليلة'],
        ['OPPORTUNITY', 'التوسع في مشاريع الطاقة البديلة المبتكرة لضخ المياه الجوفية وتوليد الكهرباء', 'Expanding innovative solar-powered groundwater pumping and community energy', 'HIGH', 'طرح مناقصات توريد منظومات الطاقة الشمسية ذات الكفاءة.', 'Issue RFQs for solar energy equipment and water well rigs.', 'OBJ-2025-04', 'م. ناصر سعيد المعمري'],
        ['OPPORTUNITY', 'استخدام تقنيات الذكاء الاصطناعي Gemini لضبط الإنفاق والتنقيح الآلي للفواتير', 'Leveraging Gemini AI for automated OCR invoice parsing and budget controls', 'HIGH', 'تأكيد التشغيل الكامل للماسح الضوئي الذكي ومصفوفة المطابقة.', 'Deploy automated 3-way quote matrix and OCR invoice verification.', 'OBJ-2025-02', 'د. عبدالكريم الحمداني'],
        ['THREAT', 'تذبذب أسعار صرف العملة المحلية (YER) وارتفاع معدلات التضخم المستورد', 'Volatile local currency exchange rates (YER) and import inflation risks', 'CRITICAL', 'تطبيق التحوط بالعملات الصعبة (USD/SAR) وتحديث أسعار الصرف الحية.', 'Implement hard currency reserves (USD/SAR) with live rate API.', 'OBJ-2025-09', 'أ. سالم عبدالله العولقي'],
        ['THREAT', 'الظروف الجوية القاسية والكوارث الطبيعية والأمطار السيول', 'Severe weather, seasonal flash floods, and access route disruptions', 'HIGH', 'تكوين مخزون استراتيجي طارئ وخطة طوارئ استجابة لمخاطر السيول.', 'Maintain strategic emergency warehouse buffers and rapid flood response.', 'OBJ-2025-10', 'أ. خالد عبدالرحيم']
      ];

      // Batch insert SWOT analysis items (9 columns each)
      const swotCols = ['plan_id', 'category', 'title_ar', 'title_en', 'impact_level', 'strategic_action_ar', 'strategic_action_en', 'linked_goal_code', 'owner_name'];
      const swotValues: any[] = [];
      const swotPlaceholders = swotItems.map((sw, i) => {
        const offset = i * 9;
        swotValues.push(planId, ...sw);
        return `(${Array.from({ length: 9 }, (_, j) => `$${offset + j + 1}`).join(', ')})`;
      }).join(', ');
      await poolInstance.query(`INSERT INTO swot_analysis (${swotCols.join(', ')}) VALUES ${swotPlaceholders}`, swotValues);

      if (process.env.NODE_ENV !== 'production') {
        logger.info("Seeding strategic_plans and sub-tables completed successfully.", { context: 'database' });
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`strategic_plans table already has ${count} records. No seeding needed.`, { context: 'database' });
      }
    }
  } catch (err: any) {
    logger.error(`Failed to seed strategic_plans table: ${err.message}`, { context: 'database' });
  }
}

async function ensureInvestmentProjectsSchema(poolInstance: pg.Pool) {
  try {
    await poolInstance.query(`
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
    if (process.env.NODE_ENV !== 'production') {
      logger.info("Investment Projects & Contracts & Activities Schema ensured successfully.", { context: 'database' });
    }
  } catch (err: any) {
    logger.warn(`Could not create investment_projects schema: ${err.message}`, { context: 'database' });
  }
}

async function seedInvestmentProjectsIfEmpty(poolInstance: pg.Pool) {
  try {
    await ensureInvestmentProjectsSchema(poolInstance);
    const checkRes = await poolInstance.query("SELECT COUNT(*) FROM investment_projects");
    const count = parseInt(checkRes.rows[0].count);
    if (count === 0) {
      if (process.env.NODE_ENV !== 'production') {
        logger.info("Seeding investment_projects table with real Rohama'a Baynahum endowment data...", { context: 'database' });
      }

      const projects = [
        ['INV-2025-001', 'وقف البر والعطاء العقاري الموحد - مأرب', 'Al-Birr Real Estate Endowment Complex - Marib', 'REAL_ESTATE_ENDOWMENT', 450000000, 112500000, 58500000, 14.0, 13.0, 14.8, 96.5, 'LOW', 'PRESERVED', 75, 'د. عبدالحكيم السقاف', 'APPROVED', 3, 'مأرب'],
        ['INV-2025-002', 'مشروع الخلايا الشمسية ومعاصر الزيتون التنموية', 'Solar Powered Olive Press & Productive Agriculture', 'AGRICULTURAL_PRODUCTIVE', 280000000, 64400000, 39200000, 15.5, 14.0, 15.2, 88.0, 'MEDIUM', 'PRESERVED', 70, 'م. ناصر سعيد المعمري', 'APPROVED', 2, 'الساحل الغربي'],
        ['INV-2025-003', 'محطة مياه النقاء الاستثمارية - وحدة تحلية تجارية', 'Al-Naqa Commercial Water Purification Plant', 'SOCIAL_ENTERPRISE', 190000000, 41800000, 24700000, 13.5, 13.0, 13.9, 92.0, 'LOW', 'PRESERVED', 80, 'م. أحمد سالم باثواب', 'APPROVED', 2, 'الحديدة'],
        ['INV-2025-004', 'محفظة الصكوك الأوقافية السيادية المستدامة', 'Sovereign Endowment Sukuk Portfolio', 'EQUITY_PORTFOLIO', 350000000, 77000000, 42000000, 12.0, 12.0, 12.5, 100.0, 'LOW', 'PRESERVED', 65, 'أ. سالم عبدالله العولقي', 'APPROVED', 3, 'المركز الرئيسي'],
        ['INV-2025-005', 'وقف الوفاء السكني والتجاري للأيتام - عدن', 'Al-Wafa Residential & Commercial Orphan Endowment - Aden', 'REAL_ESTATE_ENDOWMENT', 520000000, 93600000, 62400000, 13.0, 12.0, 13.4, 94.0, 'LOW', 'PRESERVED', 85, 'أ. فاطمة باعباد', 'APPROVED', 3, 'عدن']
      ];

      // Batch insert investment projects (18 columns each)
      const invCols = ['project_code', 'title_ar', 'title_en', 'category', 'capital_allocated_yer', 'accumulated_returns_yer', 'net_annual_profit_yer', 'expected_roi_pct', 'actual_roi_pct', 'irr_pct', 'occupancy_or_yield_pct', 'risk_level', 'endowment_preservation_status', 'humanitarian_distribution_pct', 'assigned_investment_manager', 'approval_status', 'security_clearance_level', 'location_governorate'];
      const invValues: any[] = [];
      const invPlaceholders = projects.map((p, i) => {
        const offset = i * 18;
        invValues.push(...p);
        return `(${Array.from({ length: 18 }, (_, j) => `$${offset + j + 1}`).join(', ')})`;
      }).join(', ');
      const invRes = await poolInstance.query(`INSERT INTO investment_projects (${invCols.join(', ')}) VALUES ${invPlaceholders} RETURNING id, net_annual_profit_yer, humanitarian_distribution_pct`, invValues);

      // Batch insert returns history for all projects
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
        const retPlaceholders = invRes.rows.map((_, i) => {
          const bOffset = i * 14; // 2 rows × 7 params each
          return `($${bOffset + 1}, $${bOffset + 2}, $${bOffset + 3}, $${bOffset + 4}, $${bOffset + 5}, $${bOffset + 6}, $${bOffset + 7}, 'د. عبدالحكيم السقاف', 'أ. سالم عبدالله العولقي'), ($${bOffset + 8}, $${bOffset + 9}, $${bOffset + 10}, $${bOffset + 11}, $${bOffset + 12}, $${bOffset + 13}, $${bOffset + 14}, 'د. عبدالحكيم السقاف', 'أ. سالم عبدالله العولقي')`;
        }).join(', ');
        await poolInstance.query(`INSERT INTO investment_returns_history (project_id, fiscal_period, gross_revenue_yer, operational_expenses_yer, net_profit_yer, transferred_to_charity_yer, reinvested_amount_yer, recorded_by_user, audited_by_cfo) VALUES ${retPlaceholders}`, returnRows);
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.info("Seeding investment_projects and returns history completed.", { context: 'database' });
      }
    }
  } catch (err: any) {
    logger.error(`Error seeding investment projects: ${err.message}`, { context: 'database' });
  }
}

async function ensureDatabasePerformanceIndexes(poolInstance: pg.Pool) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      logger.info("Applying high-performance DB indexes...", { context: 'database' });
    }
    const queries = [
      `CREATE INDEX IF NOT EXISTS idx_programs_deleted_at ON programs(deleted_at)`,
      `CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at)`,
      `CREATE INDEX IF NOT EXISTS idx_beneficiaries_deleted_at ON beneficiaries(deleted_at)`,
      `CREATE INDEX IF NOT EXISTS idx_sponsorships_deleted_at ON sponsorships(deleted_at)`,
      `CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at)`,
      `CREATE INDEX IF NOT EXISTS idx_programs_org_id ON programs(organization_id)`,
      `CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(organization_id)`,
      `CREATE INDEX IF NOT EXISTS idx_projects_program_id ON projects(program_id)`,
      `CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`,
      `CREATE INDEX IF NOT EXISTS idx_beneficiaries_status ON beneficiaries(status)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_beneficiaries_org_gov ON beneficiaries(organization_id, governorate)`,
      `CREATE INDEX IF NOT EXISTS idx_sponsorships_ben_curr ON sponsorships(beneficiary_id, currency_code)`,
      `CREATE INDEX IF NOT EXISTS idx_chart_accounts_org_type ON chart_of_accounts(organization_id, account_type)`,
      `CREATE INDEX IF NOT EXISTS idx_activities_project_status ON activities(project_id, status_code)`
    ];
    for (const q of queries) {
      await poolInstance.query(q).catch(e => { /* Ignore errors for non-existent tables */ });
    }
  } catch(e) {
    logger.warn(`Index creation warning: ${e}`, { context: 'database' });
  }
}

async function ensureAdvancedDatabaseViewsAndProcedures(poolInstance: pg.Pool) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      logger.info("Creating and updating advanced NexoraOS™ database views, procedures, and helper functions...", { context: 'database' });
    }
    
    // 1. Create a View for real-time domain statistics aggregated from live tables
    await poolInstance.query(`
      CREATE OR REPLACE VIEW v_nexora_realtime_domain_stats AS
      SELECT 
        (SELECT COUNT(*) FROM "programs" WHERE "deleted_at" IS NULL) as active_programs_count,
        COALESCE((SELECT SUM("budget") FROM "programs" WHERE "deleted_at" IS NULL), 0) as total_programs_budget,
        (SELECT COUNT(*) FROM "projects" WHERE "deleted_at" IS NULL) as active_projects_count,
        COALESCE((SELECT SUM("budget") FROM "projects" WHERE "deleted_at" IS NULL), 0) as total_projects_budget,
        (SELECT COUNT(*) FROM "beneficiaries" WHERE "deleted_at" IS NULL) as total_beneficiaries_count,
        (SELECT COUNT(*) FROM "sponsorships" WHERE "deleted_at" IS NULL) as active_sponsorships_count,
        (SELECT COUNT(*) FROM "users" WHERE "deleted_at" IS NULL) as active_personnel_count,
        (SELECT COUNT(*) FROM "fixed_assets") as total_fixed_assets_count,
        COALESCE((SELECT SUM("current_value") FROM "fixed_assets"), 0) as total_assets_value
    `);

    // 2. Create a stored procedure / function for consolidated C-Level KPIs
    await poolInstance.query(`
      CREATE OR REPLACE FUNCTION fn_nexora_get_consolidated_kpis()
      RETURNS TABLE(
        total_programs BIGINT,
        programs_budget NUMERIC,
        total_projects BIGINT,
        projects_budget NUMERIC,
        utilization_ratio NUMERIC,
        beneficiaries_count BIGINT,
        sponsorships_count BIGINT,
        personnel_count BIGINT,
        assets_count BIGINT,
        assets_valuation NUMERIC,
        liquidity_factor NUMERIC
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          active_programs_count::BIGINT,
          total_programs_budget::NUMERIC,
          active_projects_count::BIGINT,
          total_projects_budget::NUMERIC,
          CASE 
            WHEN total_programs_budget > 0 
            THEN ROUND((total_projects_budget / total_programs_budget) * 100, 2)
            ELSE 0 
          END::NUMERIC as utilization_ratio,
          total_beneficiaries_count::BIGINT,
          active_sponsorships_count::BIGINT,
          active_personnel_count::BIGINT,
          total_fixed_assets_count::BIGINT,
          total_assets_value::NUMERIC,
          1.45::NUMERIC as liquidity_factor
        FROM v_nexora_realtime_domain_stats;
      END;
      $$ LANGUAGE plpgsql;
    `);

    if (process.env.NODE_ENV !== 'production') {
      logger.info("NexoraOS™ Database Views and Stored Procedures successfully deployed.", { context: 'database' });
    }
  } catch (err: any) {
    logger.warn(`Could not create/migrate advanced database views and stored procedures: ${err.message}`, { context: 'database' });
  }
}

let _serverPoolInitialized = false;

function getPool(): pg.Pool {
   const pool = coreGetPool();

   if (!_serverPoolInitialized) {
     _serverPoolInitialized = true;

     if (process.env.NODE_ENV !== 'production') {
        logger.info("PostgreSQL connection pool initialized via core/database singleton.", { context: 'database' });
     }

     // Initialize seed data and schema updates asynchronously to avoid blocking startup
     // These are fire-and-forget operations that shouldn't prevent server startup
     Promise.all([
      seedFixedAssetsIfEmpty(pool).catch(err => logger.warn(`Error seeding fixed_assets: ${err.message}`, { context: 'database' })),
        seedExchangeRatesIfEmpty(pool).catch(err => logger.warn(`Error seeding exchange_rates: ${err.message}`, { context: 'database' })),
        seedStrategicPlanningIfEmpty(pool).catch(err => logger.warn(`Error seeding strategic_planning: ${err.message}`, { context: 'database' })),
        seedInvestmentProjectsIfEmpty(pool).catch(err => logger.warn(`Error seeding investment_projects: ${err.message}`, { context: 'database' })),
        ensureAdvancedDatabaseViewsAndProcedures(pool).catch(err => logger.warn(`Error ensuring advanced DB views & procs: ${err.message}`, { context: 'database' }))
     ]).then(() => {
       if (process.env.NODE_ENV !== 'production') {
          logger.info("[DB INIT] Seed data and schema updates completed", { context: 'database' });
       }
     }).catch(err => {
        logger.warn(`[DB INIT] Some initialization tasks failed: ${err.message}`, { context: 'database' });
     });

     // Ensure performance indexes (synchronous for startup)
     ensureDatabasePerformanceIndexes(pool);
   }

   return pool;
 }

// Whitelisted tables that are safe to expose and manage
// Moved to src/server/core/constants.ts
import { TABLE_POLICY_DOMAIN } from './src/server/core/constants';

async function enforceTablePolicy(
  pool: pg.Pool,
  req: any,
  table: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE'
): Promise<{ allowed: boolean; violations: PolicyViolation[] }> {
  const domain = TABLE_POLICY_DOMAIN[table];
  if (!domain) return { allowed: true, violations: [] };

  const ctx: PolicyContext = {
    organizationId: req.user?.org_id || '00000000-0000-0000-0000-000000000001',
    userId: req.user?.id || '',
    securityLevel: req.user?.security_level ?? 0,
    role: req.user?.role ?? '',
  };

  return enforceAllPolicies(pool, ctx, domain, action, req.body);
}

async function logTablePolicyViolation(
  pool: pg.Pool,
  req: any,
  table: string,
  action: string,
  violations: PolicyViolation[],
  envMode: string
): Promise<void> {
  try {
    const blockViolations = violations.filter(v => v.severity === 'BLOCK');
    const warnViolations = violations.filter(v => v.severity === 'WARN' || v.severity === 'INFO');
    await pool.query(`
      INSERT INTO audit_logs (id, action, table_name, record_id, user_id, details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      crypto.randomUUID(),
      `POLICY_VIOLATION:generic:${table}:${action}`,
      'policy_enforcement',
      null,
      req.user?.id || null,
      JSON.stringify({
        domain: TABLE_POLICY_DOMAIN[table],
        table,
        action,
        environmentMode: envMode,
        blockCount: blockViolations.length,
        warnCount: warnViolations.length,
        violations: violations.map(v => ({
          code: v.code,
          severity: v.severity,
          messageEn: v.messageEn,
          policyKey: v.policyKey,
          limit: v.limit,
          currentValue: v.currentValue,
        })),
      }),
    ]);
  } catch (err) {
    logger.error(`[PolicyEnforcement] Failed to log violation: ${err}`, { context: 'policy' });
  }
}

// LRU Cache for schema caching
const schemaCache = new LRUCache<string, any>({
  max: 200,
  ttl: 1000 * 60 * 60 * 24, // 24 hours (schema rarely changes)
});


// -------------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------------
import { serverConfig } from './src/server/config/index';

const JWT_SECRET = serverConfig.jwtSecret;
const JWT_REFRESH_SECRET = serverConfig.jwtRefreshSecret;

// ─── LEGACY: Inline authenticateToken ────────────────────────
// This duplicates src/server/middleware/auth.middleware.ts:authenticateToken.
// Retained for backward-compatibility with inline routes defined below.
// NEW routes (e.g. V2) MUST use the canonical import from auth.middleware.ts.
const authenticateToken = (req: any, res: any, next: any) => {
  // Only apply to /api paths
  if (!req.path.startsWith('/api')) {
    return next();
  }

  // Exclude public paths (req.path starts with '/api')
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/health') || req.path.startsWith('/api/exchange-rates')) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: Missing Authentication Token' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      if (process.env.NODE_ENV !== 'production') {
        logger.error(`JWT Verify Error: ${err.message}`, { context: 'auth' });
      }
      return res.status(403).json({ error: 'Access Denied: Invalid or Expired Token' });
    }
    req.user = user;
    next();
  });
};

// Apply globally to the express app before routes
app.use(authenticateToken);

// Rate Limiters for write operations and sensitive endpoints
const apiWriteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Write rate limit exceeded. Max 50 writes per 15 minutes.' },
  skip: (req: any) => req.path.startsWith('/api/health') || req.path.startsWith('/api/auth'),
});

const sensitiveOpsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Sensitive operation rate limit exceeded. Max 5 per 15 minutes.' },
});

// Apply write rate limiter to all write operations on dynamic tables
app.use('/api/tables', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return apiWriteRateLimiter(req, res, next);
  }
  next();
});

// Apply sensitive ops rate limiter to backup/restore/bulk operations
app.use('/api/backup', sensitiveOpsRateLimiter);
app.use('/api/restore', sensitiveOpsRateLimiter);
app.use('/api/bulk', sensitiveOpsRateLimiter);

// Centralized Audit Logging Middleware — fire-and-forget for write operations
const auditLogMiddleware = (req: any, res: any, next: any) => {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }
  if (req.path.startsWith('/api/health') || req.path.startsWith('/api/auth')) {
    return next();
  }

  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    res.end = originalEnd;
    res.end(...args);

    (async () => {
      try {
        const dbPool = getPool();
        const auditId = crypto.randomUUID();
        const action = `${req.method} ${req.path}`;
        const pathParts = req.path.split('/').filter(Boolean);
        const tablesIdx = pathParts.indexOf('tables');
        const tableName = tablesIdx !== -1 && pathParts.length > tablesIdx + 1
          ? pathParts[tablesIdx + 1]
          : pathParts[pathParts.length - 1] || 'unknown';
        const recordId = tablesIdx !== -1 && pathParts.length > tablesIdx + 2
          ? pathParts[tablesIdx + 2]
          : null;

        await dbPool.query(`
          INSERT INTO audit_logs (id, action, table_name, record_id, user_id, details, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          auditId,
          action,
          tableName,
          recordId,
          req.user?.id || null,
          JSON.stringify({
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            ip: req.ip || req.connection?.remoteAddress
          })
        ]);
      } catch (error) {
        logger.error(`Audit log write failed: ${error}`, { context: 'audit' });
      }
    })();
  };

  next();
};
app.use(auditLogMiddleware);

// Modular Routes — single registration, no duplicates
app.use('/api/finance', financeRouter);
app.use('/api/health', healthRouter);
app.use('/api/operations', masterOperationsRouter);
app.use('/api/sales', salesRouter);
// New Enterprise Domain Routes (NEB-08, NEB-06, NEB-07, NEB-13, NEB-14)
app.use('/api/funding', fundingRouter);
app.use('/api/operational', operationalDomainRouter);

// Gemini AI Routes — extracted to modular router
app.use('/api/gemini', geminiRouter);

// V2 API Routes — modular engine-based routes for all NEB domains
import v2Router from './src/server/routes/v2';
app.use('/api/v2', v2Router);

// V2 Health & Monitoring Routes
import v2HealthRouter from './src/server/routes/v2/health.routes';
import v2DocsRouter from './src/server/routes/v2/docs.routes';
app.use('/api/v2/health', v2HealthRouter);
app.use('/api/v2/docs', v2DocsRouter);

// Extracted inline routes — modular route files
import authInlineRouter from './src/server/routes/v2/auth-inline.routes';
import rbacRouter from './src/server/routes/v2/rbac.routes';
import dashboardRouter from './src/server/routes/v2/dashboard.routes';
import strategicRouter from './src/server/routes/v2/strategic.routes';
import integrationRouter from './src/server/routes/v2/integration.routes';

app.use('/api/auth', authInlineRouter);
app.use('/api', rbacRouter);
app.use('/api', dashboardRouter);
app.use('/api', strategicRouter);
app.use('/api', integrationRouter);

// API ENDPOINTS
// -------------------------------------------------------------

// Kubernetes Liveness Probe (Is the Node process running?)
app.get('/api/health/liveness', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date().toISOString(), 
    version: '3.8.0-Enterprise'
  });
});

// Kubernetes Readiness Probe (Is the DB connected and cache ready?)
app.get('/api/health/readiness', async (req, res) => {
  try {
    const dbPool = getPool();
    const startTime = Date.now();
    await dbPool.query('SELECT 1');
    const dbLatencyMs = Date.now() - startTime;

    const memUsage = process.memoryUsage();
    const response: any = { 
      status: 'READY', 
      database: 'connected', 
      dbLatencyMs,
      timestamp: new Date().toISOString(),
      poolMetrics: {
        totalCount: dbPool.totalCount,
        idleCount: dbPool.idleCount,
        waitingCount: dbPool.waitingCount
      },
      memoryMB: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024)
      }
    };

    res.status(200).json(response);
  } catch (error: any) {
    res.status(503).json({ status: 'NOT_READY', database: 'disconnected' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbPool = getPool();
    const dbRes = await dbPool.query("SELECT NOW()");
    const memUsage = process.memoryUsage();
    
    res.json({
      status: 'ok',
      time: dbRes.rows[0].now,
      database: 'connected',
      uptime: Math.round(process.uptime()),
      memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      poolMetrics: {
        total: dbPool.totalCount,
        idle: dbPool.idleCount,
        waiting: dbPool.waitingCount
      }
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      ...(process.env.NODE_ENV !== 'production' && { message: err.message })
    });
  }
});

// ─── V2 Modular Routes — backup & tables routes ──────────
import backupRoutes from './src/server/routes/v2/backup.routes';
import tablesRoutes, { schemaRouter } from './src/server/routes/v2/tables.routes';
app.use('/api/backups', backupRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/schema', schemaRouter);


async function startServer() {
  // ─────────────────────────────────────────────────────────────────────
  // ENTERPRISE SCHEMA COMPLETION: Run on every startup (CREATE IF NOT EXISTS)
  // ─────────────────────────────────────────────────────────────────────
  try {
    const dbPool = getPool();
    await runEnterpriseSchemaCompletion(dbPool);
    await applyEnterpriseIndexes(dbPool);
    await applyEnterpriseViews(dbPool);
    await seedEnterpriseUsersAndOrg(dbPool);
  } catch (schemaErr: any) {
    logger.error(`[STARTUP] Schema completion warning (non-fatal): ${schemaErr.message}`, { context: 'startup' });
  }

  // Enterprise Global Error Handler (Prevents server crash on unhandled route errors)
  app.use((err: any, req: any, res: any, next: any) => {
    const errorId = crypto.randomBytes(4).toString('hex');
    logger.error(`[CRITICAL ERROR - ID: ${errorId}] ${new Date().toISOString()} - ${req.method} ${req.url}`, { context: 'error-handler' });
    logger.error(err.stack, { context: 'error-handler' });
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected enterprise error occurred.',
      referenceId: errorId
    });
  });

  if (process.env.NODE_ENV !== "production") {
    // Development mode: Integrate Vite into Express middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    logger.info("Vite development middleware integrated.", { context: 'server' });
  } else {
    // Production mode: Serve compiled assets
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { maxAge: '1y', immutable: true }));
    }
    app.use(express.static(path.join(process.cwd(), 'public'), { maxAge: '1d' }));

    app.get('*', (req, res) => {
      const distIndex = path.join(distPath, 'index.html');
      const rootIndex = path.join(process.cwd(), 'index.html');
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else if (fs.existsSync(rootIndex)) {
        res.sendFile(rootIndex);
      } else {
        res.status(404).send('Index HTML not found');
      }
    });
    logger.info("Serving static files from dist/ in production.", { context: 'server' });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`NexoraOS™ Intelligent Enterprise Operating System server listening on http://localhost:${PORT}`, { context: 'server' });
  });

  // Enterprise Graceful Shutdown handling for Kubernetes / Auto-scaling environments
  const gracefulShutdown = async (signal: string) => {
    logger.info(`\n[${signal}] Received. Initiating NexoraOS™ graceful shutdown...`, { context: 'shutdown' });
    server.close(async () => {
      logger.info('HTTP Server closed. No longer accepting new connections.', { context: 'shutdown' });
      try {
        const dbPool = getPool();
        if (dbPool) {
          await dbPool.end();
          logger.info('PostgreSQL Database connections closed gracefully.', { context: 'shutdown' });
        }
      } catch (e) {
        logger.error(`Error closing database connections: ${e}`, { context: 'shutdown' });
      }
      // Also close the db.service.ts pool used by route files
      try {
        const { closeDatabasePool } = await import('./src/server/services/db.service');
        await closeDatabasePool();
        logger.info('db.service pool connections closed gracefully.', { context: 'shutdown' });
      } catch (e) {
        // Pool may not have been initialized
      }
      logger.info('NexoraOS™ shutdown complete. Exiting process.', { context: 'shutdown' });
      process.exit(0);
    });

    // Force shutdown if taking too long (10 seconds)
    setTimeout(() => {
      logger.error('[ERROR] Could not close connections in time, forcefully shutting down', { context: 'shutdown' });
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default app;

startServer().catch((err) => {
  logger.error(`Failed to start the server: ${err}`, { context: 'startup' });
});
