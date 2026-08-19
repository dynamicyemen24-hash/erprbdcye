/**
 * NexoraOS™ — Enterprise Database Schema Completion Migration
 * 
 * هذا الملف يستكمل جميع الجداول المفقودة عبر 15 نطاقاً مؤسسياً (NEB-01 to NEB-15)
 * يُشغَّل مرة واحدة عند بدء تشغيل الخادم (CREATE TABLE IF NOT EXISTS)
 * لا تكرار — كل جدول مُعرَّف هنا ومرجعه في TABLE_WHITELIST بـ server.ts
 * 
 * تاريخ الإنشاء: 2026-08-17
 * المعيار: IPSAS, Sphere, CHS, IATI
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function runEnterpriseSchemaCompletion(poolInstance: pg.Pool): Promise<void> {
  const client = await poolInstance.connect();
  try {
    console.log('[NexoraOS™ Schema] Starting enterprise schema completion for all 15 NEB domains...');
    await client.query('BEGIN');

    // ═══════════════════════════════════════════════════════════════
    // BASE PREREQUISITES: Ensure base tables exist before patching
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      CREATE TABLE IF NOT EXISTS parties (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        party_type VARCHAR(50) DEFAULT 'VENDOR',
        country VARCHAR(100),
        phone VARCHAR(50),
        email VARCHAR(254),
        tax_number VARCHAR(50),
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS donors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        party_id UUID REFERENCES parties(id),
        donor_code VARCHAR(100) NOT NULL UNIQUE,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        donor_type VARCHAR(50) DEFAULT 'INSTITUTIONAL',
        country VARCHAR(100),
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hr_staff (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID,
        full_name_ar TEXT NOT NULL,
        full_name_en TEXT,
        position_ar TEXT,
        position_en TEXT,
        department_ar TEXT,
        department_en TEXT,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS programs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        budget NUMERIC DEFAULT 0,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        program_id UUID REFERENCES programs(id),
        project_code VARCHAR(100),
        name_ar TEXT NOT NULL,
        name_en TEXT,
        budget NUMERIC DEFAULT 0,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activities (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id),
        title_ar TEXT NOT NULL,
        title_en TEXT,
        status_code VARCHAR(30) DEFAULT 'IN_PROGRESS',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS beneficiaries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        full_name_ar TEXT NOT NULL,
        gender VARCHAR(10),
        governorate VARCHAR(100),
        district VARCHAR(100),
        vulnerability_status VARCHAR(50) DEFAULT 'NORMAL',
        family_members_count INT DEFAULT 1,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS sponsorships (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        beneficiary_id UUID REFERENCES beneficiaries(id),
        sponsor_party_id UUID REFERENCES parties(id),
        monthly_amount NUMERIC DEFAULT 0,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS volunteers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email VARCHAR(254),
        phone VARCHAR(50),
        field VARCHAR(100),
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS procurement_tenders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        tender_number VARCHAR(100) NOT NULL UNIQUE,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        project_id UUID REFERENCES projects(id),
        estimated_value NUMERIC DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(30) DEFAULT 'OPEN',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS grants (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        donor_id UUID REFERENCES donors(id),
        grant_number VARCHAR(100) NOT NULL UNIQUE,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        total_amount NUMERIC NOT NULL,
        spent_amount NUMERIC DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'USD',
        start_date DATE,
        end_date DATE,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        project_id UUID REFERENCES projects(id),
        program_id UUID REFERENCES programs(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // ═══════════════════════════════════════════════════════════════
    // PATCH 1: users table — إضافة الحقول المفقودة
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
        ADD COLUMN IF NOT EXISTS department_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS position_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS can_approve BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS max_approval_amount NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS preferred_theme VARCHAR(20) DEFAULT 'dark';
    `);

    // ═══════════════════════════════════════════════════════════════
    // PATCH 2: organizations table — إضافة الحقول المفقودة
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS default_currency_code VARCHAR(10) DEFAULT 'YER',
        ADD COLUMN IF NOT EXISTS fiscal_year_type VARCHAR(20) DEFAULT 'GREGORIAN',
        ADD COLUMN IF NOT EXISTS time_zone VARCHAR(50) DEFAULT 'Asia/Aden',
        ADD COLUMN IF NOT EXISTS language_codes JSONB DEFAULT '["ar","en"]',
        ADD COLUMN IF NOT EXISTS iati_org_identifier VARCHAR(100),
        ADD COLUMN IF NOT EXISTS chs_certification_status VARCHAR(30) DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS sphere_compliance_level VARCHAR(30) DEFAULT 'BASIC';
    `);

    // ═══════════════════════════════════════════════════════════════
    // PATCH 3: hr_staff table — إضافة الحقول المفقودة (HR Grade)
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      ALTER TABLE hr_staff
        ADD COLUMN IF NOT EXISTS hire_date DATE,
        ADD COLUMN IF NOT EXISTS termination_date DATE,
        ADD COLUMN IF NOT EXISTS contract_type VARCHAR(30) DEFAULT 'PERMANENT',
        ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'YER',
        ADD COLUMN IF NOT EXISTS basic_salary NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES hr_staff(id),
        ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'يمني',
        ADD COLUMN IF NOT EXISTS national_id VARCHAR(30),
        ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS work_location VARCHAR(100),
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `);

    // ═══════════════════════════════════════════════════════════════
    // PATCH 4: grants table — إضافة الحقول المفقودة (IATI/IPSAS)
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      ALTER TABLE grants
        ADD COLUMN IF NOT EXISTS iati_identifier VARCHAR(100),
        ADD COLUMN IF NOT EXISTS reporting_frequency VARCHAR(30) DEFAULT 'QUARTERLY',
        ADD COLUMN IF NOT EXISTS reporting_requirements TEXT,
        ADD COLUMN IF NOT EXISTS geographic_restrictions TEXT,
        ADD COLUMN IF NOT EXISTS sector_codes JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id),
        ADD COLUMN IF NOT EXISTS spent_amount NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS reporting_deadline DATE,
        ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(30) DEFAULT 'COMPLIANT',
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `);

    // ═══════════════════════════════════════════════════════════════
    // NEB-08: PARTNERSHIP & FUNDING OS — جداول مفقودة كلياً
    // ═══════════════════════════════════════════════════════════════

    await client.query(`
      -- Grant Installments (أقساط المنح) — مطلوب للامتثال IPSAS
      CREATE TABLE IF NOT EXISTS grant_installments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
        installment_number INT NOT NULL,
        planned_amount NUMERIC NOT NULL,
        planned_date DATE NOT NULL,
        received_amount NUMERIC DEFAULT 0,
        received_date DATE,
        currency_code VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC DEFAULT 1,
        amount_yer NUMERIC GENERATED ALWAYS AS (received_amount * exchange_rate) STORED,
        status VARCHAR(30) DEFAULT 'PENDING',  -- PENDING | RECEIVED | OVERDUE | PARTIAL
        receipt_reference VARCHAR(100),
        bank_transaction_ref VARCHAR(100),
        notes TEXT,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Funding Proposals (مقترحات التمويل)
      CREATE TABLE IF NOT EXISTS funding_proposals (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        donor_id UUID REFERENCES donors(id),
        proposal_code VARCHAR(100) NOT NULL UNIQUE,
        title_ar TEXT NOT NULL,
        title_en TEXT NOT NULL,
        sector VARCHAR(50),
        target_governorates JSONB DEFAULT '[]',
        requested_amount NUMERIC NOT NULL,
        currency_code VARCHAR(10) DEFAULT 'USD',
        project_period_months INT DEFAULT 12,
        target_beneficiaries INT DEFAULT 0,
        submission_date DATE,
        deadline_date DATE,
        approved_amount NUMERIC DEFAULT 0,
        status VARCHAR(30) DEFAULT 'DRAFT',  -- DRAFT | SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | WITHDRAWN
        rejection_reason TEXT,
        document_url TEXT,
        linked_grant_id UUID REFERENCES grants(id),
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      -- Donor Reports (تقارير المانحين) — ضروري للامتثال الدولي
      CREATE TABLE IF NOT EXISTS donor_reports (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
        donor_id UUID REFERENCES donors(id),
        report_code VARCHAR(100) NOT NULL UNIQUE,
        report_type VARCHAR(30) DEFAULT 'NARRATIVE',  -- NARRATIVE | FINANCIAL | COMBINED | FINAL
        reporting_period_start DATE NOT NULL,
        reporting_period_end DATE NOT NULL,
        submission_deadline DATE,
        submitted_date DATE,
        status VARCHAR(30) DEFAULT 'PENDING',  -- PENDING | SUBMITTED | APPROVED | REVISION_REQUESTED
        beneficiaries_reached INT DEFAULT 0,
        budget_utilized_pct NUMERIC DEFAULT 0,
        key_achievements TEXT,
        challenges_faced TEXT,
        next_steps TEXT,
        document_url TEXT,
        reviewer_notes TEXT,
        approved_by VARCHAR(100),
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Partner Agreements (اتفاقيات الشراكة)
      CREATE TABLE IF NOT EXISTS partner_agreements (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        partner_party_id UUID REFERENCES parties(id),
        agreement_code VARCHAR(100) NOT NULL UNIQUE,
        agreement_type VARCHAR(30) DEFAULT 'MOU',  -- MOU | PARTNERSHIP | SUB-GRANT | FRAMEWORK
        title_ar TEXT NOT NULL,
        title_en TEXT NOT NULL,
        partner_organization_name TEXT NOT NULL,
        partner_country VARCHAR(100),
        signed_date DATE,
        start_date DATE,
        end_date DATE,
        value_usd NUMERIC DEFAULT 0,
        geographic_coverage JSONB DEFAULT '[]',
        sector_coverage JSONB DEFAULT '[]',
        status VARCHAR(30) DEFAULT 'ACTIVE',
        renewal_status VARCHAR(30) DEFAULT 'NOT_DUE',
        document_url TEXT,
        focal_point_name TEXT,
        focal_point_email TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      -- Donor Compliance Requirements (متطلبات الامتثال للمانح)
      CREATE TABLE IF NOT EXISTS donor_compliance_requirements (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id),
        grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
        requirement_type VARCHAR(50) NOT NULL,  -- FINANCIAL_REPORT | NARRATIVE_REPORT | AUDIT | VISIT | OTHER
        description_ar TEXT NOT NULL,
        description_en TEXT,
        due_date DATE NOT NULL,
        frequency VARCHAR(30) DEFAULT 'ONE_TIME',
        status VARCHAR(30) DEFAULT 'PENDING',
        completed_date DATE,
        evidence_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════
    // NEB-06: SERVICE DELIVERY OS — جداول مفقودة
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      -- Service Deliveries (تسليمات الخدمة)
      CREATE TABLE IF NOT EXISTS service_deliveries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        activity_id UUID REFERENCES activities(id),
        project_id UUID REFERENCES projects(id),
        service_type VARCHAR(50) NOT NULL,  -- FOOD | WATER | HEALTH | SHELTER | EDUCATION | CASH | NFI | PSYCHOSOCIAL
        delivery_date DATE NOT NULL,
        delivery_location TEXT,
        governorate VARCHAR(100),
        district VARCHAR(100),
        beneficiaries_targeted INT DEFAULT 0,
        beneficiaries_reached INT DEFAULT 0,
        families_reached INT DEFAULT 0,
        males_reached INT DEFAULT 0,
        females_reached INT DEFAULT 0,
        children_reached INT DEFAULT 0,
        elderly_reached INT DEFAULT 0,
        pwds_reached INT DEFAULT 0,  -- Persons with disabilities
        unit_cost_yer NUMERIC DEFAULT 0,
        total_cost_yer NUMERIC DEFAULT 0,
        quality_score INT DEFAULT 0,  -- 1-5 Sphere compliance score
        sphere_standard_met BOOLEAN DEFAULT false,
        chs_criteria_met JSONB DEFAULT '{}',
        field_officer_id UUID REFERENCES hr_staff(id),
        supervisor_id UUID REFERENCES hr_staff(id),
        photos_urls JSONB DEFAULT '[]',
        gps_coordinates JSONB,  -- {lat, lng}
        status VARCHAR(30) DEFAULT 'COMPLETED',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Aid Distributions (توزيعات المساعدات) — للتتبع التفصيلي لكل مستفيد
      CREATE TABLE IF NOT EXISTS aid_distributions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        service_delivery_id UUID REFERENCES service_deliveries(id) ON DELETE CASCADE,
        beneficiary_id UUID REFERENCES beneficiaries(id),
        distribution_date DATE NOT NULL,
        aid_type VARCHAR(50) NOT NULL,
        aid_items JSONB DEFAULT '[]',  -- [{item_name, quantity, unit, unit_cost}]
        total_value_yer NUMERIC DEFAULT 0,
        voucher_number VARCHAR(50),
        digital_signature TEXT,
        signature_type VARCHAR(20) DEFAULT 'MANUAL',  -- MANUAL | DIGITAL | BIOMETRIC
        confirmed_by VARCHAR(100),
        status VARCHAR(30) DEFAULT 'DISTRIBUTED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Distribution Beneficiaries (مستفيدو التوزيع — ربط جماعي)
      CREATE TABLE IF NOT EXISTS distribution_beneficiaries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        distribution_id UUID NOT NULL REFERENCES aid_distributions(id) ON DELETE CASCADE,
        beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
        received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        quantity_received NUMERIC DEFAULT 1,
        confirmed BOOLEAN DEFAULT false
      );
    `);

    // ═══════════════════════════════════════════════════════════════
    // NEB-07: COMMUNITY & MEMBERSHIP OS — جداول مفقودة
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      -- Volunteer Tasks (مهام المتطوعين)
      CREATE TABLE IF NOT EXISTS volunteer_tasks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
        activity_id UUID REFERENCES activities(id),
        project_id UUID REFERENCES projects(id),
        task_code VARCHAR(50),
        title_ar TEXT NOT NULL,
        title_en TEXT,
        task_type VARCHAR(50) DEFAULT 'FIELD',  -- FIELD | ADMIN | TRAINING | LOGISTICS | COMMUNITY
        planned_date DATE NOT NULL,
        planned_hours NUMERIC DEFAULT 4,
        actual_date DATE,
        actual_hours NUMERIC DEFAULT 0,
        location TEXT,
        governorate VARCHAR(100),
        status VARCHAR(30) DEFAULT 'ASSIGNED',  -- ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED
        performance_score INT,  -- 1-5
        supervisor_notes TEXT,
        supervisor_id UUID REFERENCES hr_staff(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Community Committees (اللجان المجتمعية)
      CREATE TABLE IF NOT EXISTS community_committees (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        committee_code VARCHAR(50) NOT NULL UNIQUE,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        committee_type VARCHAR(50) DEFAULT 'PROTECTION',  -- PROTECTION | WATER | HEALTH | EDUCATION | WOMENS | YOUTH
        governorate VARCHAR(100),
        district VARCHAR(100),
        village TEXT,
        established_date DATE,
        chairperson_name TEXT,
        chairperson_phone VARCHAR(30),
        secretary_name TEXT,
        members_count INT DEFAULT 0,
        women_representation_pct NUMERIC DEFAULT 0,
        meeting_frequency VARCHAR(30) DEFAULT 'MONTHLY',
        linked_project_id UUID REFERENCES projects(id),
        status VARCHAR(30) DEFAULT 'ACTIVE',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      -- Membership Applications (طلبات العضوية)
      CREATE TABLE IF NOT EXISTS membership_applications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        applicant_name_ar TEXT NOT NULL,
        applicant_name_en TEXT,
        national_id VARCHAR(30),
        phone VARCHAR(30),
        email VARCHAR(254),
        age INT,
        gender VARCHAR(10),
        governorate VARCHAR(100),
        district VARCHAR(100),
        skills JSONB DEFAULT '[]',
        motivation_statement TEXT,
        membership_type VARCHAR(30) DEFAULT 'VOLUNTEER',  -- VOLUNTEER | MEMBER | PARTNER | OBSERVER
        application_date DATE DEFAULT CURRENT_DATE,
        interview_date DATE,
        status VARCHAR(30) DEFAULT 'PENDING',  -- PENDING | UNDER_REVIEW | APPROVED | REJECTED
        reviewed_by UUID REFERENCES hr_staff(id),
        decision_date DATE,
        rejection_reason TEXT,
        linked_volunteer_id UUID REFERENCES volunteers(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════
    // NEB-12: INTEGRATION & DIGITAL SERVICES OS — جداول مفقودة
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      -- Webhook Subscriptions (اشتراكات Webhook)
      CREATE TABLE IF NOT EXISTS webhook_subscriptions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,  -- beneficiary.created | project.updated | grant.received | etc
        endpoint_url TEXT NOT NULL,
        secret_hash TEXT,  -- HMAC-SHA256 secret for signature verification
        is_active BOOLEAN DEFAULT true,
        retry_count INT DEFAULT 0,
        last_triggered_at TIMESTAMP WITH TIME ZONE,
        last_status_code INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- IATI Activities (سجلات IATI للشفافية الدولية)
      CREATE TABLE IF NOT EXISTS iati_activities (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id),
        grant_id UUID REFERENCES grants(id),
        iati_identifier VARCHAR(100) NOT NULL UNIQUE,
        reporting_org_ref VARCHAR(50),
        activity_status VARCHAR(30) DEFAULT 'IMPLEMENTATION',  -- PIPELINE | IMPLEMENTATION | FINALISATION | CLOSED | CANCELLED
        title_ar TEXT NOT NULL,
        title_en TEXT NOT NULL,
        description_ar TEXT,
        description_en TEXT,
        start_planned DATE,
        start_actual DATE,
        end_planned DATE,
        end_actual DATE,
        sector_codes JSONB DEFAULT '[]',
        recipient_countries JSONB DEFAULT '[]',
        total_budget_usd NUMERIC DEFAULT 0,
        total_expenditure_usd NUMERIC DEFAULT 0,
        published_to_iati BOOLEAN DEFAULT false,
        last_published_at TIMESTAMP WITH TIME ZONE,
        iati_xml_snapshot TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Sync Queue (قائمة انتظار المزامنة للعمل دون اتصال)
      CREATE TABLE IF NOT EXISTS sync_queue (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        device_id VARCHAR(100),
        operation VARCHAR(20) NOT NULL,  -- INSERT | UPDATE | DELETE
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING | PROCESSING | SYNCED | FAILED
        attempt_count INT DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        synced_at TIMESTAMP WITH TIME ZONE
      );

      -- API Keys (مفاتيح API للمؤسسات)
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        key_name VARCHAR(100) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(10) NOT NULL,
        scopes TEXT[] DEFAULT '{}',
        rate_limit INT DEFAULT 1000,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP WITH TIME ZONE,
        last_used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- API Rate Limits (حدود معدل الـ API لكل مستأجر)
      CREATE TABLE IF NOT EXISTS api_rate_limits (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        api_key_id UUID REFERENCES api_keys(id),
        endpoint_pattern VARCHAR(200),
        max_requests_per_minute INT DEFAULT 100,
        max_requests_per_hour INT DEFAULT 1000,
        max_requests_per_day INT DEFAULT 10000,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════
    // NEB-13: AI INTELLIGENCE & IMPACT OS — جداول مفقودة كلياً
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      -- AI Insights (رؤى الذكاء الاصطناعي — تخزين استجابات Gemini)
      CREATE TABLE IF NOT EXISTS ai_insights (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        insight_type VARCHAR(50) NOT NULL,  -- ANOMALY | FORECAST | RECOMMENDATION | EXECUTIVE_SUMMARY | PORTFOLIO | IMPACT
        model_used VARCHAR(50) DEFAULT 'gemini-2.5-flash',
        context_data JSONB DEFAULT '{}',
        insight_ar TEXT,
        insight_en TEXT,
        structured_data JSONB DEFAULT '{}',
        risk_level VARCHAR(20),  -- LOW | MEDIUM | HIGH | CRITICAL
        confidence_score NUMERIC DEFAULT 0,  -- 0-100
        is_acted_upon BOOLEAN DEFAULT false,
        action_taken TEXT,
        generated_by_user_id UUID,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- CHS Evaluations (تقييمات Core Humanitarian Standards)
      CREATE TABLE IF NOT EXISTS chs_evaluations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id),
        program_id UUID REFERENCES programs(id),
        evaluation_period_start DATE NOT NULL,
        evaluation_period_end DATE NOT NULL,
        -- 9 CHS Commitments scores (1-5)
        chs_1_appropriate_response NUMERIC DEFAULT 0,
        chs_2_coordination NUMERIC DEFAULT 0,
        chs_3_cash_programming NUMERIC DEFAULT 0,
        chs_4_complaint_mechanisms NUMERIC DEFAULT 0,
        chs_5_community_support NUMERIC DEFAULT 0,
        chs_6_staff_competence NUMERIC DEFAULT 0,
        chs_7_financial_management NUMERIC DEFAULT 0,
        chs_8_coordination_stakeholders NUMERIC DEFAULT 0,
        chs_9_continuous_learning NUMERIC DEFAULT 0,
        overall_score NUMERIC GENERATED ALWAYS AS (
          (chs_1_appropriate_response + chs_2_coordination + chs_3_cash_programming +
           chs_4_complaint_mechanisms + chs_5_community_support + chs_6_staff_competence +
           chs_7_financial_management + chs_8_coordination_stakeholders + chs_9_continuous_learning) / 9
        ) STORED,
        evaluator_name TEXT,
        evaluation_method VARCHAR(50) DEFAULT 'SELF_ASSESSMENT',  -- SELF_ASSESSMENT | EXTERNAL | PEER
        strengths TEXT,
        gaps TEXT,
        action_plan JSONB DEFAULT '[]',
        status VARCHAR(30) DEFAULT 'DRAFT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Sphere Benchmarks (معايير Sphere للكميات والمعدلات)
      CREATE TABLE IF NOT EXISTS sphere_benchmarks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id),
        activity_id UUID REFERENCES activities(id),
        sector VARCHAR(50) NOT NULL,  -- WATER | FOOD | SHELTER | HEALTH | NUTRITION
        benchmark_name_ar TEXT NOT NULL,
        benchmark_name_en TEXT,
        sphere_minimum_standard NUMERIC NOT NULL,
        sphere_unit VARCHAR(50),  -- litres/person/day | kcal/day | m2/person | etc
        actual_value NUMERIC DEFAULT 0,
        compliance_pct NUMERIC GENERATED ALWAYS AS (
          CASE WHEN sphere_minimum_standard > 0 
               THEN LEAST(ROUND((actual_value / sphere_minimum_standard) * 100, 2), 200)
               ELSE 0 END
        ) STORED,
        assessment_date DATE NOT NULL,
        location TEXT,
        is_compliant BOOLEAN GENERATED ALWAYS AS (actual_value >= sphere_minimum_standard) STORED,
        gap_value NUMERIC GENERATED ALWAYS AS (
          GREATEST(sphere_minimum_standard - actual_value, 0)
        ) STORED,
        remediation_plan TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Anomaly Logs (سجلات الشذوذات — تتبع منبهات الذكاء الاصطناعي)
      CREATE TABLE IF NOT EXISTS anomaly_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        anomaly_type VARCHAR(50) NOT NULL,  -- FINANCIAL | OPERATIONAL | DATA_QUALITY | SECURITY | COMPLIANCE
        entity_type VARCHAR(50),  -- project | transaction | beneficiary | procurement
        entity_id UUID,
        severity VARCHAR(20) DEFAULT 'MEDIUM',  -- LOW | MEDIUM | HIGH | CRITICAL
        title_ar TEXT NOT NULL,
        title_en TEXT,
        description_ar TEXT,
        description_en TEXT,
        detected_value NUMERIC,
        expected_value NUMERIC,
        deviation_pct NUMERIC,
        ai_model_used VARCHAR(50),
        is_false_positive BOOLEAN DEFAULT false,
        is_resolved BOOLEAN DEFAULT false,
        resolved_by UUID,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolution_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- AI Model Runs (تتبع تشغيلات الذكاء الاصطناعي للتدقيق)
      CREATE TABLE IF NOT EXISTS ai_model_runs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID,
        model_name VARCHAR(100) NOT NULL,
        endpoint VARCHAR(100) NOT NULL,
        input_tokens INT DEFAULT 0,
        output_tokens INT DEFAULT 0,
        latency_ms INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'SUCCESS',  -- SUCCESS | FAILED | TIMEOUT
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════
    // NEB-14: PROCUREMENT OS — جداول RFQ وVendors المفقودة
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      -- RFQs (طلبات عروض الأسعار)
      CREATE TABLE IF NOT EXISTS rfqs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        tender_id UUID REFERENCES procurement_tenders(id),
        project_id UUID REFERENCES projects(id),
        rfq_number VARCHAR(100) NOT NULL UNIQUE,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        scope_of_work TEXT,
        specifications JSONB DEFAULT '[]',
        delivery_location TEXT,
        delivery_date DATE,
        submission_deadline TIMESTAMP WITH TIME ZONE,
        evaluation_criteria JSONB DEFAULT '{}',
        estimated_value NUMERIC DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(30) DEFAULT 'OPEN',  -- OPEN | CLOSED | AWARDED | CANCELLED
        awarded_vendor_id UUID REFERENCES parties(id),
        awarded_amount NUMERIC DEFAULT 0,
        award_date DATE,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      -- Vendor Bids (عروض الموردين على RFQs)
      CREATE TABLE IF NOT EXISTS vendor_bids (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
        vendor_party_id UUID NOT NULL REFERENCES parties(id),
        bid_amount NUMERIC NOT NULL,
        currency_code VARCHAR(10) DEFAULT 'USD',
        delivery_days INT,
        warranty_months INT DEFAULT 0,
        technical_score NUMERIC DEFAULT 0,  -- 0-100
        financial_score NUMERIC DEFAULT 0,  -- 0-100
        combined_score NUMERIC DEFAULT 0,   -- weighted combined
        bid_details JSONB DEFAULT '{}',
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(30) DEFAULT 'SUBMITTED',  -- SUBMITTED | EVALUATED | SHORTLISTED | AWARDED | REJECTED
        rejection_reason TEXT,
        is_lowest_bid BOOLEAN DEFAULT false,
        evaluator_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Purchase Orders (أوامر الشراء)
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        rfq_id UUID REFERENCES rfqs(id),
        vendor_bid_id UUID REFERENCES vendor_bids(id),
        vendor_party_id UUID NOT NULL REFERENCES parties(id),
        project_id UUID REFERENCES projects(id),
        activity_id UUID REFERENCES activities(id),
        po_number VARCHAR(100) NOT NULL UNIQUE,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        line_items JSONB DEFAULT '[]',  -- [{description, qty, unit, unit_price, total}]
        subtotal NUMERIC DEFAULT 0,
        tax_amount NUMERIC DEFAULT 0,
        discount_amount NUMERIC DEFAULT 0,
        total_amount NUMERIC DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC DEFAULT 1,
        total_yer NUMERIC DEFAULT 0,
        delivery_address TEXT,
        expected_delivery_date DATE,
        actual_delivery_date DATE,
        payment_terms VARCHAR(100),
        approved_by UUID REFERENCES hr_staff(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(30) DEFAULT 'DRAFT',  -- DRAFT | APPROVED | ISSUED | PARTIALLY_RECEIVED | RECEIVED | CANCELLED
        goods_receipt_status VARCHAR(30) DEFAULT 'PENDING',
        invoice_ref VARCHAR(100),
        invoice_matched BOOLEAN DEFAULT false,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      -- Vendors (سجل الموردين المستقل) — يكمل parties
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        party_id UUID REFERENCES parties(id),
        vendor_code VARCHAR(50) NOT NULL,
        vendor_type VARCHAR(30) DEFAULT 'GOODS',  -- GOODS | SERVICES | CONSTRUCTION | CONSULTING
        registration_number VARCHAR(100),
        tax_number VARCHAR(50),
        country VARCHAR(100) DEFAULT 'اليمن',
        governorate VARCHAR(100),
        bank_name VARCHAR(100),
        bank_account VARCHAR(50),
        iban VARCHAR(50),
        contact_name TEXT,
        contact_phone VARCHAR(30),
        contact_email VARCHAR(254),
        performance_score NUMERIC DEFAULT 0,  -- 0-100 based on history
        total_orders_count INT DEFAULT 0,
        total_orders_value NUMERIC DEFAULT 0,
        on_time_delivery_pct NUMERIC DEFAULT 0,
        quality_rating NUMERIC DEFAULT 0,  -- 1-5
        blacklisted BOOLEAN DEFAULT false,
        blacklist_reason TEXT,
        prequalified BOOLEAN DEFAULT false,
        prequalification_expiry DATE,
        categories JSONB DEFAULT '[]',
        certifications JSONB DEFAULT '[]',
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      -- 3-Way Match Records (مطابقة الطلب والفاتورة والاستلام)
      CREATE TABLE IF NOT EXISTS three_way_match_records (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        invoice_number VARCHAR(100),
        invoice_amount NUMERIC DEFAULT 0,
        goods_receipt_amount NUMERIC DEFAULT 0,
        po_amount NUMERIC DEFAULT 0,
        match_status VARCHAR(30) DEFAULT 'UNMATCHED',  -- MATCHED | PARTIAL | UNMATCHED | DISPUTED
        variance_amount NUMERIC DEFAULT 0,
        variance_pct NUMERIC DEFAULT 0,
        approved_for_payment BOOLEAN DEFAULT false,
        approval_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════
    // NEB-15: إضافة Donation Campaigns المفقودة
    // ═══════════════════════════════════════════════════════════════
    await client.query(`
      -- Donation Campaigns (حملات التبرع)
      CREATE TABLE IF NOT EXISTS donation_campaigns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        campaign_code VARCHAR(100) NOT NULL UNIQUE,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        campaign_type VARCHAR(30) DEFAULT 'GENERAL',  -- GENERAL | RAMADAN | QURBANI | EMERGENCY | ORPHAN | WATER | ZAKAT
        target_amount NUMERIC DEFAULT 0,
        raised_amount NUMERIC DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'YER',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        description_ar TEXT,
        description_en TEXT,
        image_url TEXT,
        is_featured BOOLEAN DEFAULT false,
        status VARCHAR(30) DEFAULT 'ACTIVE',  -- ACTIVE | COMPLETED | PAUSED | CANCELLED
        linked_project_id UUID REFERENCES projects(id),
        linked_program_id UUID REFERENCES programs(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await client.query('COMMIT');
    console.log('[NexoraOS™ Schema] ✅ Enterprise schema completion SUCCESSFUL — all 15 NEB domains covered.');

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[NexoraOS™ Schema] ❌ Schema completion FAILED:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// ═══════════════════════════════════════════════════════════════════
// INDEXES: 30+ High-Performance Indexes
// ═══════════════════════════════════════════════════════════════════
export async function applyEnterpriseIndexes(poolInstance: pg.Pool): Promise<void> {
  // 1. Column Safety Guards for legacy tables
  const columnGuards = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS parent_account_id UUID`,
    `ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'POSTED'`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fiscal_year_id UUID`,
    `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS vulnerability_status VARCHAR(50) DEFAULT 'NORMAL'`,
    `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE'`,
    `ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE'`,
    `ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS table_name VARCHAR(100)`,
    `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100)`,
    `ALTER TABLE budget_lines ADD COLUMN IF NOT EXISTS fiscal_year_id UUID`,
    `ALTER TABLE budget_lines ADD COLUMN IF NOT EXISTS project_id UUID`
  ];

  for (const cg of columnGuards) {
    try {
      await poolInstance.query(cg);
    } catch (e: any) {
      console.warn(`[COLUMN GUARD WARNING] ${cg.substring(0, 60)}...: ${e.message.substring(0, 100)}`);
    }
  }

  const indexes = [
    // Core entity indexes
    `CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email)) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_users_failed_logins ON users(failed_login_attempts) WHERE failed_login_attempts > 0`,

    // Transactions — critical for financial performance
    `CREATE INDEX IF NOT EXISTS idx_transactions_org_date ON transactions(organization_id, transaction_date DESC) WHERE status = 'POSTED'`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_fiscal_year ON transactions(fiscal_year_id, organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transaction_lines_tx_id ON transaction_lines(transaction_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transaction_lines_account ON transaction_lines(account_id, organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transaction_lines_project ON transaction_lines(project_id) WHERE project_id IS NOT NULL`,

    // Chart of accounts
    `CREATE INDEX IF NOT EXISTS idx_coa_org_type ON chart_of_accounts(organization_id, account_type) WHERE is_active = true`,
    `CREATE INDEX IF NOT EXISTS idx_coa_account_code ON chart_of_accounts(organization_id, account_code)`,
    `CREATE INDEX IF NOT EXISTS idx_coa_parent ON chart_of_accounts(parent_account_id) WHERE parent_account_id IS NOT NULL`,

    // Budget
    `CREATE INDEX IF NOT EXISTS idx_budget_lines_fiscal ON budget_lines(fiscal_year_id, organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_budget_lines_project ON budget_lines(project_id) WHERE project_id IS NOT NULL`,

    // Beneficiaries — high-volume table
    `CREATE INDEX IF NOT EXISTS idx_beneficiaries_org_gov_status ON beneficiaries(organization_id, governorate, status) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_beneficiaries_vulnerability ON beneficiaries(vulnerability_status) WHERE deleted_at IS NULL`,

    // Sponsorships
    `CREATE INDEX IF NOT EXISTS idx_sponsorships_beneficiary ON sponsorships(beneficiary_id) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor ON sponsorships(sponsor_party_id) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_sponsorships_status_org ON sponsorships(organization_id, status) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_sponsorship_payments_sp ON sponsorship_payments(sponsorship_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sponsorship_payments_date ON sponsorship_payments(payment_date DESC)`,

    // Grants & Donors
    `CREATE INDEX IF NOT EXISTS idx_grants_donor ON grants(donor_id, status) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_grants_org_status ON grants(organization_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_grant_installments_grant ON grant_installments(grant_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_donors_org_status ON donors(organization_id, status)`,

    // Activities
    `CREATE INDEX IF NOT EXISTS idx_activities_project_status ON activities(project_id, status_code)`,
    `CREATE INDEX IF NOT EXISTS idx_activities_org ON activities(organization_id)`,

    // Service Deliveries
    `CREATE INDEX IF NOT EXISTS idx_service_deliveries_org_date ON service_deliveries(organization_id, delivery_date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_service_deliveries_project ON service_deliveries(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_aid_distributions_service ON aid_distributions(service_delivery_id)`,
    `CREATE INDEX IF NOT EXISTS idx_aid_distributions_beneficiary ON aid_distributions(beneficiary_id)`,

    // Procurement
    `CREATE INDEX IF NOT EXISTS idx_rfqs_org_status ON rfqs(organization_id, status) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_vendor_bids_rfq ON vendor_bids(rfq_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_status ON purchase_orders(organization_id, status) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_party_id)`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_org_status ON vendors(organization_id, status) WHERE deleted_at IS NULL`,

    // AI & Anomalies
    `CREATE INDEX IF NOT EXISTS idx_ai_insights_org_type ON ai_insights(organization_id, insight_type, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_anomaly_logs_org_severity ON anomaly_logs(organization_id, severity, is_resolved) WHERE is_resolved = false`,
    `CREATE INDEX IF NOT EXISTS idx_anomaly_logs_entity ON anomaly_logs(entity_type, entity_id) WHERE entity_id IS NOT NULL`,

    // Audit Logs
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_org_date ON audit_logs(organization_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name, created_at DESC)`,

    // Sync Queue
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_org_status ON sync_queue(organization_id, status) WHERE status = 'PENDING'`,

    // Volunteer Tasks
    `CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_volunteer ON volunteer_tasks(volunteer_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_project ON volunteer_tasks(project_id) WHERE project_id IS NOT NULL`,

    // Donation Campaigns
    `CREATE INDEX IF NOT EXISTS idx_donation_campaigns_org_status ON donation_campaigns(organization_id, status) WHERE deleted_at IS NULL`,

    // Parties
    `CREATE INDEX IF NOT EXISTS idx_parties_org_type ON parties(organization_id, party_type) WHERE status = 'ACTIVE'`,

    // Vendor Bids - duplicate check performance
    `CREATE INDEX IF NOT EXISTS idx_vendor_bids_rfq_vendor ON vendor_bids(rfq_id, vendor_party_id) WHERE deleted_at IS NULL`,

    // Membership Applications - duplicate check performance
    `CREATE INDEX IF NOT EXISTS idx_membership_apps_org_national ON membership_applications(organization_id, national_id) WHERE national_id IS NOT NULL AND deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_membership_apps_org_email ON membership_applications(organization_id, LOWER(email)) WHERE email IS NOT NULL AND deleted_at IS NULL`,

    // Sales Invoices - invoice number uniqueness
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_invoices_number_unique ON sales_invoices(invoice_number)`,

    // Sales Invoices - organization_id for tenant isolation
    `CREATE INDEX IF NOT EXISTS idx_sales_invoices_org ON sales_invoices(organization_id)`,

    // Service Points - organization_id for tenant isolation
    `CREATE INDEX IF NOT EXISTS idx_service_points_org ON service_points(organization_id)`,

    // Missing Foreign Key Indexes
    `CREATE INDEX IF NOT EXISTS idx_donors_party_id ON donors(party_id) WHERE party_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_funding_proposals_donor_id ON funding_proposals(donor_id) WHERE donor_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_funding_proposals_project_id ON funding_proposals(project_id) WHERE project_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_donor_reports_grant_id ON donor_reports(grant_id) WHERE grant_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_donor_reports_donor_id ON donor_reports(donor_id) WHERE donor_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_partner_agreements_partner ON partner_agreements(partner_party_id) WHERE partner_party_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_service_deliveries_officer ON service_deliveries(field_officer_id) WHERE field_officer_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_chs_evaluations_project ON chs_evaluations(project_id) WHERE project_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_sphere_benchmarks_project ON sphere_benchmarks(project_id) WHERE project_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_investment_returns_project ON investment_returns_history(project_id) WHERE project_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_investment_contracts_project ON investment_contracts(project_id) WHERE project_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_investment_activities_project ON investment_activities(project_id) WHERE project_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_iati_activities_project ON iati_activities(project_id) WHERE project_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_purchase_orders_rfq ON purchase_orders(rfq_id) WHERE rfq_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_community_committees_project ON community_committees(linked_project_id) WHERE linked_project_id IS NOT NULL`,
  ];

  let successCount = 0;
  for (const idx of indexes) {
    try {
      await poolInstance.query(idx);
      successCount++;
    } catch (e: any) {
      console.warn(`[INDEX WARNING] ${e.message.substring(0, 100)}`);
    }
  }
  console.log(`[NexoraOS™ Indexes] ✅ Applied ${successCount}/${indexes.length} enterprise performance indexes.`);
}

// ═══════════════════════════════════════════════════════════════════
// VIEWS: 10 Critical Missing Views for Reports
// ═══════════════════════════════════════════════════════════════════
export async function applyEnterpriseViews(poolInstance: pg.Pool): Promise<void> {
  const views: Record<string, string> = {

    // 1. Grant Utilization Report (تقرير استخدام المنح)
    v_grant_utilization_report: `
      CREATE OR REPLACE VIEW v_grant_utilization_report AS
      SELECT
        g.id as grant_id,
        g.grant_number,
        g.title_ar,
        g.title_en,
        g.total_amount,
        g.spent_amount,
        g.currency_code,
        g.status,
        g.start_date,
        g.end_date,
        CASE WHEN g.total_amount > 0
             THEN ROUND((g.spent_amount / g.total_amount) * 100, 2)
             ELSE 0 END AS utilization_pct,
        g.total_amount - g.spent_amount AS remaining_amount,
        d.name_ar AS donor_name_ar,
        d.name_en AS donor_name_en,
        d.donor_type,
        COUNT(gi.id) AS installments_count,
        COALESCE(SUM(gi.received_amount), 0) AS total_received,
        COUNT(dr.id) AS reports_count,
        COALESCE((
          SELECT COUNT(*) FROM grant_installments gi2
          WHERE gi2.grant_id = g.id AND gi2.status = 'OVERDUE'
        ), 0) AS overdue_installments
      FROM grants g
      LEFT JOIN donors d ON g.donor_id = d.id
      LEFT JOIN grant_installments gi ON gi.grant_id = g.id
      LEFT JOIN donor_reports dr ON dr.grant_id = g.id
      WHERE g.deleted_at IS NULL
      GROUP BY g.id, g.grant_number, g.title_ar, g.title_en, g.total_amount, g.spent_amount,
               g.currency_code, g.status, g.start_date, g.end_date, d.name_ar, d.name_en, d.donor_type`,

    // 2. Donor Portfolio Analysis (تحليل محفظة المانحين)
    v_donor_portfolio_analysis: `
      CREATE OR REPLACE VIEW v_donor_portfolio_analysis AS
      SELECT
        d.id AS donor_id,
        d.donor_code,
        d.name_ar,
        d.name_en,
        d.donor_type,
        d.country,
        d.status,
        COUNT(g.id) AS total_grants,
        COUNT(g.id) FILTER (WHERE g.status = 'ACTIVE') AS active_grants,
        COALESCE(SUM(g.total_amount), 0) AS total_committed_usd,
        COALESCE(SUM(g.spent_amount), 0) AS total_spent_usd,
        COALESCE(AVG(
          CASE WHEN g.total_amount > 0
               THEN (g.spent_amount / g.total_amount) * 100 END
        ), 0) AS avg_utilization_pct,
        COUNT(fp.id) AS pending_proposals,
        COUNT(dr.id) AS pending_reports,
        MAX(g.created_at) AS last_grant_date
      FROM donors d
      LEFT JOIN grants g ON g.donor_id = d.id AND g.deleted_at IS NULL
      LEFT JOIN funding_proposals fp ON fp.donor_id = d.id AND fp.status IN ('SUBMITTED', 'UNDER_REVIEW')
      LEFT JOIN donor_reports dr ON dr.donor_id = d.id AND dr.status = 'PENDING'
      WHERE d.status = 'ACTIVE'
      GROUP BY d.id, d.donor_code, d.name_ar, d.name_en, d.donor_type, d.country, d.status`,

    // 3. Procurement 3-Way Match (مطابقة المشتريات الثلاثية)
    v_procurement_3way_match: `
      CREATE OR REPLACE VIEW v_procurement_3way_match AS
      SELECT
        po.id AS po_id,
        po.po_number,
        po.title_ar,
        po.title_en,
        po.total_amount AS po_amount,
        po.currency_code,
        po.status AS po_status,
        po.invoice_ref,
        po.invoice_matched,
        p.name_ar AS vendor_name_ar,
        twm.invoice_number,
        twm.invoice_amount,
        twm.goods_receipt_amount,
        twm.match_status,
        twm.variance_amount,
        twm.variance_pct,
        twm.approved_for_payment,
        pr.name_ar AS project_name_ar,
        pr.project_code
      FROM purchase_orders po
      LEFT JOIN parties p ON po.vendor_party_id = p.id
      LEFT JOIN three_way_match_records twm ON twm.purchase_order_id = po.id
      LEFT JOIN projects pr ON po.project_id = pr.id
      WHERE po.deleted_at IS NULL`,

    // 4. Volunteer Hours Report (تقرير ساعات المتطوعين)
    v_volunteer_hours_report: `
      CREATE OR REPLACE VIEW v_volunteer_hours_report AS
      SELECT
        v.id AS volunteer_id,
        v.name,
        v.email,
        v.phone,
        v.field,
        v.status,
        COUNT(vt.id) AS total_tasks,
        COUNT(vt.id) FILTER (WHERE vt.status = 'COMPLETED') AS completed_tasks,
        COALESCE(SUM(vt.actual_hours) FILTER (WHERE vt.status = 'COMPLETED'), 0) AS total_hours,
        COALESCE(SUM(vt.planned_hours), 0) AS planned_hours,
        COALESCE(AVG(vt.performance_score) FILTER (WHERE vt.performance_score IS NOT NULL), 0) AS avg_performance,
        COUNT(DISTINCT vt.project_id) AS projects_contributed,
        MAX(vt.actual_date) AS last_task_date
      FROM volunteers v
      LEFT JOIN volunteer_tasks vt ON vt.volunteer_id = v.id
      WHERE v.status = 'ACTIVE'
      GROUP BY v.id, v.name, v.email, v.phone, v.field, v.status`,

    // 5. Service Delivery Metrics (مقاييس تسليم الخدمة)
    v_service_delivery_metrics: `
      CREATE OR REPLACE VIEW v_service_delivery_metrics AS
      SELECT
        sd.organization_id,
        sd.service_type,
        sd.governorate,
        DATE_TRUNC('month', sd.delivery_date::timestamp) AS delivery_month,
        COUNT(sd.id) AS delivery_sessions,
        SUM(sd.beneficiaries_reached) AS total_beneficiaries_reached,
        SUM(sd.families_reached) AS total_families_reached,
        SUM(sd.males_reached) AS total_males,
        SUM(sd.females_reached) AS total_females,
        SUM(sd.children_reached) AS total_children,
        SUM(sd.pwds_reached) AS total_pwds,
        SUM(sd.total_cost_yer) AS total_cost_yer,
        CASE WHEN SUM(sd.beneficiaries_reached) > 0
             THEN ROUND(SUM(sd.total_cost_yer) / SUM(sd.beneficiaries_reached), 2)
             ELSE 0 END AS cost_per_beneficiary_yer,
        AVG(sd.quality_score) AS avg_quality_score,
        COUNT(sd.id) FILTER (WHERE sd.sphere_standard_met = true) AS sphere_compliant_sessions,
        ROUND(
          COUNT(sd.id) FILTER (WHERE sd.sphere_standard_met = true)::NUMERIC /
          NULLIF(COUNT(sd.id), 0) * 100, 2
        ) AS sphere_compliance_pct
      FROM service_deliveries sd
      GROUP BY sd.organization_id, sd.service_type, sd.governorate, DATE_TRUNC('month', sd.delivery_date::timestamp)`,

    // 6. CHS Compliance Dashboard (لوحة امتثال CHS)
    v_chs_compliance_dashboard: `
      CREATE OR REPLACE VIEW v_chs_compliance_dashboard AS
      SELECT
        ce.organization_id,
        ce.project_id,
        p.name_ar AS project_name_ar,
        p.project_code,
        ce.evaluation_period_start,
        ce.evaluation_period_end,
        ce.chs_1_appropriate_response,
        ce.chs_2_coordination,
        ce.chs_3_cash_programming,
        ce.chs_4_complaint_mechanisms,
        ce.chs_5_community_support,
        ce.chs_6_staff_competence,
        ce.chs_7_financial_management,
        ce.chs_8_coordination_stakeholders,
        ce.chs_9_continuous_learning,
        ce.overall_score,
        CASE
          WHEN ce.overall_score >= 4 THEN 'EXCELLENT'
          WHEN ce.overall_score >= 3 THEN 'GOOD'
          WHEN ce.overall_score >= 2 THEN 'NEEDS_IMPROVEMENT'
          ELSE 'CRITICAL'
        END AS compliance_grade,
        ce.evaluation_method,
        ce.status,
        ce.evaluator_name
      FROM chs_evaluations ce
      LEFT JOIN projects p ON ce.project_id = p.id`,

    // 7. Beneficiary Vulnerability Index (مؤشر هشاشة المستفيدين)
    v_beneficiary_vulnerability_index: `
      CREATE OR REPLACE VIEW v_beneficiary_vulnerability_index AS
      SELECT
        b.organization_id,
        b.governorate,
        b.district,
        COALESCE(b.vulnerability_status, 'NORMAL') AS vulnerability_status,
        COUNT(b.id) AS beneficiary_count,
        SUM(COALESCE(b.family_members_count, 1)) AS total_individuals,
        COUNT(b.id) FILTER (WHERE b.gender = 'FEMALE') AS female_count,
        COUNT(b.id) FILTER (WHERE b.vulnerability_status IN ('HIGH', 'CRITICAL')) AS high_vulnerability_count,
        COUNT(s.id) AS sponsored_count,
        COUNT(b.id) - COUNT(s.id) AS unsponsored_count,
        ROUND(
          COUNT(b.id) FILTER (WHERE b.vulnerability_status IN ('HIGH', 'CRITICAL'))::NUMERIC /
          NULLIF(COUNT(b.id), 0) * 100, 2
        ) AS high_vulnerability_pct,
        ROUND(
          COUNT(s.id)::NUMERIC / NULLIF(COUNT(b.id), 0) * 100, 2
        ) AS sponsorship_coverage_pct
      FROM beneficiaries b
      LEFT JOIN sponsorships s ON s.beneficiary_id = b.id
      WHERE b.deleted_at IS NULL
      GROUP BY b.organization_id, b.governorate, b.district, b.vulnerability_status`,

    // 8. KPI vs Target Dashboard (مؤشرات الأداء مقابل الأهداف)
    v_kpi_vs_target_dashboard: `
      CREATE OR REPLACE VIEW v_kpi_vs_target_dashboard AS
      SELECT
        k.id AS kpi_id,
        k.kpi_code,
        k.name_ar,
        k.name_en,
        k.target_value,
        k.current_value,
        COALESCE(k.unit_ar, '%') AS unit,
        k.status,
        k.goal_id,
        CASE WHEN k.target_value > 0
             THEN ROUND((k.current_value / k.target_value) * 100, 2)
             ELSE 0 END AS achievement_pct,
        k.target_value - k.current_value AS gap_to_target,
        CASE
          WHEN k.target_value = 0 THEN 'NO_TARGET'
          WHEN (k.current_value / NULLIF(k.target_value, 0)) >= 1.0 THEN 'ACHIEVED'
          WHEN (k.current_value / NULLIF(k.target_value, 0)) >= 0.75 THEN 'ON_TRACK'
          WHEN (k.current_value / NULLIF(k.target_value, 0)) >= 0.50 THEN 'AT_RISK'
          ELSE 'CRITICAL'
        END AS performance_status
      FROM strategic_kpis k`,

    // 9. AI Anomaly Detection Feed (تغذية كشف الشذوذات)
    v_ai_anomaly_detection_feed: `
      CREATE OR REPLACE VIEW v_ai_anomaly_detection_feed AS
      SELECT
        al.id AS anomaly_id,
        al.organization_id,
        al.anomaly_type,
        al.entity_type,
        al.entity_id,
        al.severity,
        al.title_ar,
        al.title_en,
        al.description_ar,
        al.detected_value,
        al.expected_value,
        al.deviation_pct,
        al.ai_model_used,
        al.is_false_positive,
        al.is_resolved,
        al.created_at,
        al.resolved_at,
        -- Enrich with entity context
        CASE al.entity_type
          WHEN 'project' THEN (SELECT name_ar FROM projects WHERE id = al.entity_id)
          WHEN 'transaction' THEN (SELECT description FROM transactions WHERE id = al.entity_id)
          WHEN 'beneficiary' THEN (SELECT full_name_ar FROM beneficiaries WHERE id = al.entity_id)
          ELSE NULL
        END AS entity_context
      FROM anomaly_logs al
      WHERE al.is_false_positive = false
      ORDER BY
        CASE al.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
        al.created_at DESC`,

    // 10. Procurement Performance (أداء المشتريات الشامل)
    v_procurement_performance: `
      CREATE OR REPLACE VIEW v_procurement_performance AS
      SELECT
        v.id AS vendor_id,
        v.vendor_code,
        COALESCE(v.vendor_code, 'Vendor') AS vendor_name_ar,
        v.vendor_type,
        v.governorate,
        v.performance_score,
        v.on_time_delivery_pct,
        v.quality_rating,
        v.total_orders_count,
        v.total_orders_value,
        v.prequalified,
        v.blacklisted,
        v.status,
        COUNT(po.id) AS active_pos,
        SUM(po.total_amount) FILTER (WHERE po.status NOT IN ('CANCELLED', 'DRAFT')) AS active_pos_value,
        COUNT(vb.id) AS total_bids_submitted,
        COUNT(vb.id) FILTER (WHERE vb.status = 'AWARDED') AS bids_won,
        ROUND(
          COUNT(vb.id) FILTER (WHERE vb.status = 'AWARDED')::NUMERIC /
          NULLIF(COUNT(vb.id), 0) * 100, 2
        ) AS bid_win_rate_pct
      FROM vendors v
      LEFT JOIN purchase_orders po ON po.vendor_party_id = v.id AND po.deleted_at IS NULL
      LEFT JOIN vendor_bids vb ON vb.vendor_party_id = v.id
      WHERE v.deleted_at IS NULL AND v.blacklisted = false
      GROUP BY v.id, v.vendor_code, v.vendor_type, v.governorate,
               v.performance_score, v.on_time_delivery_pct, v.quality_rating,
               v.total_orders_count, v.total_orders_value, v.prequalified, v.blacklisted, v.status`,
  };

  // Ensure column presence before creating views
  const viewColumnGuards = [
    `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS family_members_count INT DEFAULT 1`,
    `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS vulnerability_status VARCHAR(50) DEFAULT 'NORMAL'`,
    `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'MALE'`,
    `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_type VARCHAR(50) DEFAULT 'SUPPLIER'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS performance_score NUMERIC DEFAULT 100`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS on_time_delivery_pct NUMERIC DEFAULT 100`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS quality_rating NUMERIC DEFAULT 5`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_orders_count INT DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_orders_value NUMERIC DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS prequalified BOOLEAN DEFAULT true`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS governorate VARCHAR(100)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklisted BOOLEAN DEFAULT false`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE'`
  ];

  for (const vcg of viewColumnGuards) {
    try {
      await poolInstance.query(vcg);
    } catch (e: any) {
      console.warn(`[VIEW COLUMN GUARD WARNING] ${vcg.substring(0, 60)}...: ${e.message.substring(0, 100)}`);
    }
  }

  let viewsCreated = 0;
  for (const [viewName, sql] of Object.entries(views)) {
    try {
      await poolInstance.query(sql);
      viewsCreated++;
    } catch (e: any) {
      console.warn(`[VIEW WARNING] ${viewName}: ${e.message.substring(0, 120)}`);
    }
  }
  console.log(`[NexoraOS™ Views] ✅ Created ${viewsCreated}/${Object.keys(views).length} enterprise views.`);
}

// ═══════════════════════════════════════════════════════════════════
// SEEDING: Real Production-Ready Enterprise Users & Primary Org
// ═══════════════════════════════════════════════════════════════════
export async function seedEnterpriseUsersAndOrg(poolInstance: pg.Pool): Promise<void> {
  const orgId = '00000000-0000-0000-0000-000000000001';
  const defaultPasswordHash = await bcrypt.hash(crypto.randomBytes(16).toString('base64url').slice(0, 20), 12);

  try {
    // 1. Ensure Primary Organization
    await poolInstance.query(`
      INSERT INTO organizations (
        id, name_ar, name_en, type_code, subscription_plan, status, security_level, default_currency_code, created_at, updated_at
      ) VALUES (
        $1,
        'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
        'Rohamā''a Baynahum Charity Foundation',
        'NGO',
        'ENTERPRISE_UNLIMITED',
        'active',
        5,
        'YER',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name_ar = EXCLUDED.name_ar,
        name_en = EXCLUDED.name_en,
        status = 'active',
        updated_at = NOW();
    `, [orgId]);

    // 2. Ensure Real Enterprise Users in Database with Bcrypt Hashes
    const users = [
      {
        email: 'executive@rohamaab.org',
        name_ar: 'د. عبدالكريم الحمداني',
        name_en: 'Dr. Abdulkarim Al-Hamdani',
        role: 'Administrator',
        department_code: 'EXEC_DIR',
        position_code: 'CHIEF_EXECUTIVE',
        security_level: 5,
        can_approve: true,
        max_approval_amount: 100000000,
        phone: '+967-777000001',
        password_hash: defaultPasswordHash
      },
      {
        email: 'admin@erprbdcye.org',
        name_ar: 'د. عبدالكريم الحمداني (المدير التنفيذي)',
        name_en: 'Dr. Abdulkarim Al-Hamdani',
        role: 'Administrator',
        department_code: 'IT_DIR',
        position_code: 'SYS_ADMIN',
        security_level: 5,
        can_approve: true,
        max_approval_amount: 50000000,
        phone: '+967-777000002',
        password_hash: defaultPasswordHash
      },
      {
        email: 'manager@rohamaab.org',
        name_ar: 'م. طارق الوصابي',
        name_en: 'Eng. Tariq Al-Wassabi',
        role: 'Operations Manager',
        department_code: 'OPERATIONS_DIR',
        position_code: 'FIELD_MANAGER',
        security_level: 4,
        can_approve: true,
        max_approval_amount: 25000000,
        phone: '+967-777000003',
        password_hash: defaultPasswordHash
      },
      {
        email: 'finance@rohamaab.org',
        name_ar: 'أ. سالم عبدالله العولقي',
        name_en: 'Mr. Salem Al-Awlaqi',
        role: 'Financial Director',
        department_code: 'FINANCE_DIR',
        position_code: 'CHIEF_FINANCIAL_OFFICER',
        security_level: 4,
        can_approve: true,
        max_approval_amount: 50000000,
        phone: '+967-777000004',
        password_hash: defaultPasswordHash
      },
      {
        email: 'field@rohamaab.org',
        name_ar: 'م. أحمد سالم باثواب',
        name_en: 'Eng. Ahmed Bathawab',
        role: 'Field Logistics Specialist',
        department_code: 'FIELD_OPS',
        position_code: 'LOGISTICS_LEAD',
        security_level: 3,
        can_approve: false,
        max_approval_amount: 0,
        phone: '+967-777000005',
        password_hash: defaultPasswordHash
      },
      {
        email: 'finance@erprbdcye.org',
        name_ar: 'أ. رضوان الشميري (المدير المالي)',
        name_en: 'Radwan Al-Shumairi',
        role: 'Financial Director',
        department_code: 'FINANCE_DIR',
        position_code: 'CFO',
        security_level: 4,
        can_approve: true,
        max_approval_amount: 30000000,
        phone: '+967-777000006',
        password_hash: defaultPasswordHash
      },
      {
        email: 'pmo@erprbdcye.org',
        name_ar: 'م. مروان القدسي (إدارة المشاريع PMO)',
        name_en: 'Marwan Al-Qudsi',
        role: 'PMO Director',
        department_code: 'PMO_DIR',
        position_code: 'PMO_LEAD',
        security_level: 4,
        can_approve: true,
        max_approval_amount: 20000000,
        phone: '+967-777000007',
        password_hash: defaultPasswordHash
      },
      {
        email: 'pm@erprbdcye.org',
        name_ar: 'أ. حمزة العديني (الرعاية وكفالة الأيتام)',
        name_en: 'Hamza Al-Udaini',
        role: 'Orphan Care Lead',
        department_code: 'WELFARE_DIR',
        position_code: 'SPONSORSHIP_LEAD',
        security_level: 3,
        can_approve: true,
        max_approval_amount: 10000000,
        phone: '+967-777000008',
        password_hash: defaultPasswordHash
      },
      {
        email: 'field1@erprbdcye.org',
        name_ar: 'م. فؤاد الصبري (المشرف الميداني - تعز)',
        name_en: 'Fouad Al-Sabri',
        role: 'Field Coordinator',
        department_code: 'FIELD_OPS',
        position_code: 'FIELD_COORD',
        security_level: 3,
        can_approve: false,
        max_approval_amount: 0,
        phone: '+967-777000009',
        password_hash: defaultPasswordHash
      }
    ];

    for (const u of users) {
      await poolInstance.query(`
        INSERT INTO users (
          organization_id, email, password_hash, name, name_ar, phone, default_language,
          status, security_level, department_code, position_code, can_approve, max_approval_amount, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'ar',
          'active', $7, $8, $9, $10, $11, NOW(), NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          name_ar = EXCLUDED.name_ar,
          security_level = EXCLUDED.security_level,
          department_code = EXCLUDED.department_code,
          position_code = EXCLUDED.position_code,
          can_approve = EXCLUDED.can_approve,
          max_approval_amount = EXCLUDED.max_approval_amount,
          status = 'active',
          updated_at = NOW();
      `, [
        orgId, u.email, u.password_hash, u.name_en, u.name_ar, u.phone,
        u.security_level, u.department_code, u.position_code, u.can_approve, u.max_approval_amount
      ]);
    }
    console.log(`[NexoraOS™ Seeder] ✅ Ensured ${users.length} production enterprise users in PostgreSQL database.`);

    // 3. Ensure Standardized Enterprise Settings across 15 Operational Domains
    await seedEnterpriseSettings(poolInstance, orgId);
  } catch (err: any) {
    console.warn('[NexoraOS™ Seeder] User/Settings seeding warning:', err.message);
  }
}

export async function seedEnterpriseSettings(poolInstance: pg.Pool, orgId: string = '00000000-0000-0000-0000-000000000001'): Promise<void> {
  const systemSettings = [
    { key: 'system_name', val: 'NexoraOS™ Intelligent Enterprise OS', type: 'string', desc: 'اسم النظام المؤسسي الموحد' },
    { key: 'organization_name', val: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية', type: 'string', desc: 'الاسم الرسمي للمنظمة' },
    { key: 'system_version', val: '2.5.0-ENTERPRISE', type: 'string', desc: 'إصدار النظام المؤسسي' },
    { key: 'system_environment', val: 'production', type: 'string', desc: 'بيئة تشغيل النظام' },
    { key: 'default_language', val: 'ar', type: 'string', desc: 'اللغة الافتراضية للنظام' },
    { key: 'default_currency', val: 'YER', type: 'string', desc: 'العملة المحاسبية الأساسية' },
    { key: 'timezone', val: 'Asia/Aden', type: 'string', desc: 'المنطقة الزمنية المعتمدة' },
    { key: 'date_format', val: 'YYYY-MM-DD', type: 'string', desc: 'تنسيق التاريخ القياسي' },
    { key: 'strat_kpi_review_cycle', val: 'QUARTERLY', type: 'string', desc: 'دورية مراجعة وتقييم مؤشرات الأداء الاستراتيجية' },
    { key: 'strat_warning_threshold_pct', val: 85, type: 'number', desc: 'نسبة التنبيه لانحراف مؤشرات الأداء الاستراتيجية (%)' },
    { key: 'strat_plan_span_years', val: 5, type: 'number', desc: 'المدى الزمني للخطة الاستراتيجية المؤسسية (سنوات)' },
    { key: 'proj_overbudget_warning_pct', val: 90, type: 'number', desc: 'نسبة تنبيه الاقتراب من تجاوز موازنة المشروع (%)' },
    { key: 'proj_wbs_auto_code_enabled', val: true, type: 'boolean', desc: 'التوليد الآلي لأكواد هيكل تفكيك العمل (WBS)' },
    { key: 'proj_daily_field_log_mandatory', val: true, type: 'boolean', desc: 'إلزامية تسجيل تقرير الإنجاز الميداني اليومي' },
    { key: 'proj_gps_geofence_radius_meters', val: 500, type: 'number', desc: 'نطاق التحقق الجغرافي (GPS) لنقاط التوزيع الميداني (متر)' },
    { key: 'serv_sphere_standards_enforced', val: true, type: 'boolean', desc: 'تطبيق والتحقق من المعايير الإنسانية الدولية (Sphere Standards)' },
    { key: 'serv_national_id_dedup_check', val: true, type: 'boolean', desc: 'التحقق الصارم من عدم تكرار الرقم الوطني للمستفيد' },
    { key: 'serv_vulnerability_reassess_days', val: 180, type: 'number', desc: 'دورية إعادة تقييم مؤشر الهشاشة والاحتياج (يوم)' },
    { key: 'serv_aid_receipt_biometric_enabled', val: true, type: 'boolean', desc: 'إتاحة التوثيق بالبصمة لتسليم المعونات الإنسانية' },
    { key: 'vol_minimum_age_years', val: 18, type: 'number', desc: 'الحد الأدنى لسن قبول المتطوعين' },
    { key: 'vol_hourly_credit_value_yer', val: 2500, type: 'number', desc: 'القيمة التقديرية لساعة العمل التطوعي المعياري (ريال)' },
    { key: 'comm_committee_min_members', val: 5, type: 'number', desc: 'الحد الأدنى لأعضاء اللجان المجتمعية المحلية' },
    { key: 'grant_closeout_notice_days', val: 45, type: 'number', desc: 'مهلة التنبيه المبكر لإغلاق المنح والمشاريع (يوم)' },
    { key: 'grant_donor_report_lead_days', val: 14, type: 'number', desc: 'مهلة التذكير التلقائي برفع التقارير الدورية للمانحين (يوم)' },
    { key: 'grant_iati_standard_export', val: true, type: 'boolean', desc: 'التوافق والتصدير الآلي وفق معيار الشفافية الدولية IATI' },
    { key: 'hr_probation_period_months', val: 3, type: 'number', desc: 'فترة التجربة والتقييم للموظفين الجدد (أشهر)' },
    { key: 'hr_appraisal_interval_months', val: 6, type: 'number', desc: 'دورية تقييم الأداء الوظيفي (أشهر)' },
    { key: 'asset_depreciation_method', val: 'STRAIGHT_LINE', type: 'string', desc: 'طريقة إهلاك الأصول الثابتة المعتمدة (القسط الثابت)' },
    { key: 'asset_capitalization_threshold_yer', val: 250000, type: 'number', desc: 'الحد المالي الأدنى لرسملة الأصول الثابتة (ريال يمني)' },
    { key: 'fin_accounting_standard', val: 'IPSAS_ACCRUAL', type: 'string', desc: 'المعيار المحاسبي المعتمد (معايير المحاسبة الدولية للقطاع العام)' },
    { key: 'fin_unbalanced_journals_allowed', val: false, type: 'boolean', desc: 'الحظر الصارم لتمرير أي قيد محاسبي غير متوازن' },
    { key: 'fin_petty_cash_max_limit_yer', val: 5000000, type: 'number', desc: 'الحد الأقصى لسقف العهدة النقدية المؤقتة (ريال يمني)' },
    { key: 'fin_journal_code_prefix', val: 'JV-', type: 'string', desc: 'البادئة القياسية لسندات وقيود اليومية العامة' },
    { key: 'fin_fx_rate_daily_refresh', val: true, type: 'boolean', desc: 'التحديث اليومي التلقائي لأسعار صرف العملات الأجنبية' },
    { key: 'doc_retention_policy_years', val: 10, type: 'number', desc: 'مدة الأرشفة الإلزامية للوثائق والملفات المالية والقانونية (سنوات)' },
    { key: 'doc_watermark_sensitive_enabled', val: true, type: 'boolean', desc: 'إضافة علامة مائية ذكية للوثائق المصنفة سرية' },
    { key: 'sec_password_min_length', val: 10, type: 'number', desc: 'الحد الأدنى لعدد خانات كلمة المرور' },
    { key: 'sec_session_timeout_minutes', val: 60, type: 'number', desc: 'مهلة انتهاء الجلسة التلقائي في حال عدم النشاط (دقيقة)' },
    { key: 'sec_max_failed_attempts', val: 5, type: 'number', desc: 'الحد الأقصى لمحاولات تسجيل الدخول الفاشلة قبل القفل المؤقت' },
    { key: 'sec_audit_trail_immutable', val: true, type: 'boolean', desc: 'حماية سجل التدقيق والرقابة من التعديل أو الحذف' },
    { key: 'ai_anomaly_detection_level', val: 'STRICT', type: 'string', desc: 'مستوى حساسية خوارزمية الذكاء الاصطناعي لكشف الانحرافات المالية' },
    { key: 'ai_chs_compliance_tracking', val: true, type: 'boolean', desc: 'التتبع الذكي للالتزام بالمعايير الإنسانية التسعة (CHS 1-9)' },
    { key: 'proc_three_way_match_tolerance_pct', val: 1.5, type: 'number', desc: 'نسبة التسامح المسموح بها في المطابقة الثلاثية لأوامر الشراء (%)' },
    { key: 'proc_min_rfq_vendor_bids', val: 3, type: 'number', desc: 'الحد الأدنى الإلزامي لعروض الأسعار في طلبات الشراء' },
    { key: 'proc_tender_opening_quorum', val: 3, type: 'number', desc: 'الحد الأدنى للنصاب القانوني للجنة فتح المظاريف' },
    { key: 'fund_campaign_deduction_rate_pct', val: 0.0, type: 'number', desc: 'نسبة الاستقطاع الإداري من حملات التبرعات المباشرة (%)' },
    { key: 'fund_donor_auto_acknowledgment', val: true, type: 'boolean', desc: 'الإرسال الفوري لرسائل الشكر وسندات القبض الرقمية للمتبرعين' },
    { key: 'fund_zakat_nisab_standard', val: 'SILVER_595G', type: 'string', desc: 'معيار نصاب الزكاة المعتمد شرعاً (الفضة 595 جرام)' }
  ];

  await poolInstance.query(`
    INSERT INTO system_settings (
      organization_id, setting_key, setting_value, setting_type, description, is_encrypted, is_public, created_at, updated_at
    )
    VALUES ${systemSettings.map((_, i) => `($1, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5}, false, false, NOW(), NOW())`).join(', ')}
    ON CONFLICT (setting_key) DO UPDATE SET
      setting_value = EXCLUDED.setting_value,
      setting_type = EXCLUDED.setting_type,
      description = EXCLUDED.description,
      updated_at = NOW()
  `, [orgId, ...systemSettings.flatMap(s => [s.key, JSON.stringify(s.val), s.type, s.desc])]);

  const orgSettings = [
    { key: 'ORG_OFFICIAL_NAME_AR', val: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية', desc: 'الاسم الرسمي المعتمد للمنظمة بالعربية', sec: 5 },
    { key: 'ORG_OFFICIAL_NAME_EN', val: 'Rohamā\'a Baynahum Charity Foundation', desc: 'الاسم الرسمي المعتمد للمنظمة بالإنجليزية', sec: 5 },
    { key: 'ORG_TAX_REGISTRATION_NO', val: 'YE-NGO-2024-8891', desc: 'رقم الترخيص والتسجيل الرسمي لدى وزارة الشؤون الاجتماعية', sec: 5 },
    { key: 'ORG_HEADQUARTERS_CITY', val: 'تعز - الجمهورية اليمنية', desc: 'المقر الرئيسي للمنظمة', sec: 4 },
    { key: 'ORG_OPERATIONAL_GOVERNORATES', val: ['تعز', 'عدن', 'لحج', 'إب', 'مأرب', 'حضرموت', 'الحديدة'], desc: 'المحافظات والنطاقات الجغرافية المعتمدة للتدخلات', sec: 4 },
    { key: 'FIN_BASE_CURRENCY', val: 'YER', desc: 'العملة الأساسية لإعداد القوائم المالية والميزانية العمومية', sec: 5 },
    { key: 'FIN_REPORTING_CURRENCIES', val: ['USD', 'SAR', 'EUR'], desc: 'العملات الأجنبية المعتمدة لتقارير المانحين والاتفاقيات', sec: 4 },
    { key: 'FIN_EXCHANGE_RATE_SOURCE', val: 'CENTRAL_BANK_OF_YEMEN', desc: 'المصدر الرسمي لتقييم ونشرات أسعار الصرف', sec: 4 },
    { key: 'FIN_FISCAL_YEAR_START_MONTH', val: 1, desc: 'شهر بداية السنة المالية (1 = يناير)', sec: 5 },
    { key: 'FIN_FISCAL_YEAR_END_MONTH', val: 12, desc: 'شهر نهاية السنة المالية (12 = ديسمبر)', sec: 5 },
    { key: 'OPS_EMERGENCY_RESPONSE_PROTOCOL', val: 'LEVEL_3_STANDARD', desc: 'بروتوكول الاستجابة الطارئة والإغاثة العاجلة', sec: 4 },
    { key: 'OPS_BENEFICIARY_DATA_PROTECTION', val: 'GDPR_HUMANITARIAN_COMPLIANT', desc: 'سياسة حماية وسرية بيانات المستفيدين والفئات الضعيفة', sec: 5 },
    { key: 'HR_STANDARD_WEEKLY_HOURS', val: 40, desc: 'ساعات العمل الأسبوعية المعيارية للكوادر والموظفين', sec: 4 },
    { key: 'HR_ANNUAL_PAID_LEAVE_DAYS', val: 30, desc: 'رصيد الإجازة السنوية المدفوعة للموظفين (أيام)', sec: 4 },
    { key: 'PROC_APPROVAL_TIER_1_LIMIT_YER', val: 1000000, desc: 'سقف صلاحية الشراء المباشر لمدير المشروع (ريال)', sec: 4 },
    { key: 'PROC_APPROVAL_TIER_2_LIMIT_YER', val: 10000000, desc: 'سقف صلاحية لجنة المشتريات والمناقصات المحدودة (ريال)', sec: 5 },
    { key: 'PROC_APPROVAL_TIER_3_LIMIT_YER', val: 50000000, desc: 'سقف صلاحية المدير التنفيذي ومجلس الإدارة (ريال)', sec: 5 }
  ];

  await poolInstance.query(`
    INSERT INTO organization_settings (
      organization_id, setting_key, setting_value, description, security_level, updated_at
    )
    VALUES ${orgSettings.map((_, i) => `($1, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5}, NOW())`).join(', ')}
    ON CONFLICT (setting_key) DO UPDATE SET
      setting_value = EXCLUDED.setting_value,
      description = EXCLUDED.description,
      security_level = EXCLUDED.security_level,
      updated_at = NOW()
  `, [orgId, ...orgSettings.flatMap(o => [o.key, JSON.stringify(o.val), o.desc, o.sec])]);
  console.log(`[NexoraOS™ Settings] ✅ Synced ${systemSettings.length} system settings & ${orgSettings.length} organization policies.`);
}

