/**
 * NexoraOS™ — Initial Schema Migration
 * Creates ALL base tables required by the 15 NEB domains
 * Run once on a fresh database
 */

import pg from 'pg';

export async function runInitialSchema(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('[NexoraOS™ Schema] Running initial schema migration...');
    await client.query('BEGIN');

    await client.query(`
      -- ═══════════════════════════════════════════════════════════════
      -- CORE TABLES
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS organizations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        slug VARCHAR(100) UNIQUE,
        country VARCHAR(100),
        currency VARCHAR(10) DEFAULT 'YER',
        status VARCHAR(30) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(254) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name TEXT,
        name_ar TEXT,
        role VARCHAR(50) DEFAULT 'MEMBER',
        org_id UUID REFERENCES organizations(id),
        security_level INTEGER DEFAULT 5,
        default_language VARCHAR(5) DEFAULT 'ar',
        status VARCHAR(30) DEFAULT 'active',
        deleted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_org_memberships (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        role_code VARCHAR(50) DEFAULT 'MEMBER',
        status VARCHAR(30) DEFAULT 'active',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS roles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(50) NOT NULL,
        name_en VARCHAR(100),
        name_ar VARCHAR(100),
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, code)
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID REFERENCES organizations(id),
        user_id UUID REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        table_name VARCHAR(100),
        record_id UUID,
        details JSONB DEFAULT '{}',
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(20) DEFAULT 'success',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- NEB-10: FINANCE & IPSAS
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        account_code VARCHAR(50) NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        account_type VARCHAR(30) NOT NULL,
        parent_account_id UUID REFERENCES chart_of_accounts(id),
        level INTEGER DEFAULT 1,
        is_header BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        currency_code VARCHAR(10) DEFAULT 'YER',
        current_balance NUMERIC(18,2) DEFAULT 0,
        deleted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, account_code)
      );

      CREATE TABLE IF NOT EXISTS fiscal_years (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        year_number INTEGER NOT NULL,
        name_ar TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, year_number)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        transaction_number VARCHAR(50) NOT NULL,
        transaction_date DATE DEFAULT CURRENT_DATE,
        posting_date DATE,
        transaction_type VARCHAR(30) NOT NULL,
        description TEXT,
        reference_no VARCHAR(100),
        fiscal_year_id UUID REFERENCES fiscal_years(id),
        total_debit NUMERIC(18,2) DEFAULT 0,
        total_credit NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'DRAFT',
        sync_status VARCHAR(30) DEFAULT 'PENDING',
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS transaction_lines (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        line_number INTEGER NOT NULL,
        account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
        debit NUMERIC(18,2) DEFAULT 0,
        credit NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'YER',
        exchange_rate NUMERIC(18,6) DEFAULT 1,
        description TEXT,
        project_id UUID,
        activity_id UUID,
        party_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entry_number VARCHAR(50) NOT NULL,
        entry_date DATE DEFAULT CURRENT_DATE,
        description TEXT,
        reference_no VARCHAR(100),
        fiscal_year_id UUID REFERENCES fiscal_years(id),
        status VARCHAR(30) DEFAULT 'DRAFT',
        sync_status VARCHAR(30) DEFAULT 'PENDING',
        version INTEGER DEFAULT 1,
        created_by_id UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        line_number INTEGER NOT NULL,
        account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
        debit NUMERIC(18,2) DEFAULT 0,
        credit NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'YER',
        exchange_rate NUMERIC(18,6) DEFAULT 1,
        description TEXT,
        project_id UUID,
        activity_id UUID,
        party_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS budget_lines (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id),
        account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
        project_id UUID,
        allocated_budget NUMERIC(18,2) DEFAULT 0,
        spent_amount NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'YER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS currencies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        name_ar TEXT,
        name_en TEXT,
        symbol VARCHAR(10),
        is_active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS exchange_rates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID REFERENCES organizations(id),
        from_currency VARCHAR(10) NOT NULL,
        to_currency VARCHAR(10) NOT NULL,
        rate NUMERIC(18,6) NOT NULL,
        source VARCHAR(50),
        effective_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- NEB-03/04: PROGRAMS & PROJECTS
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS programs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        description TEXT,
        status_code VARCHAR(30) DEFAULT 'PLANNING',
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS projects (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        program_id UUID REFERENCES programs(id),
        project_code VARCHAR(50),
        name_ar TEXT NOT NULL,
        name_en TEXT,
        status_code VARCHAR(30) DEFAULT 'PLANNING',
budget NUMERIC(18,2) DEFAULT 0 CHECK (budget >= 0),
        progress_percent NUMERIC(5,2) DEFAULT 0,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE,
        sync_status VARCHAR(30) DEFAULT 'PENDING',
        version INTEGER DEFAULT 1
      );

      -- ══════════════════════════════════════════════════════════════
      -- Indexes for Project Sync Performance
      -- ═══════════════════════════════════════════════════════════════
      CREATE INDEX IF NOT EXISTS idx_projects_sync_status
        ON projects(organization_id, sync_status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_projects_version_sync
        ON projects(organization_id, version DESC, sync_status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_projects_deleted_at
        ON projects(deleted_at) WHERE deleted_at IS NOT NULL;

      CREATE TABLE IF NOT EXISTS milestones (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID REFERENCES organizations(id),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        target_date DATE,
        completed_date DATE,
        status VARCHAR(30) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activities (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID REFERENCES organizations(id),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        budget_allocated NUMERIC(18,2) DEFAULT 0,
        spent_amount NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'PLANNING',
        offline_enabled BOOLEAN DEFAULT false,
        sync_status VARCHAR(30) DEFAULT 'PENDING',
        version INTEGER DEFAULT 1 CHECK (version > 0),
        deleted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        -- HR Integration Fields
        staff_id UUID REFERENCES hr_staff(id),
        volunteer_id UUID REFERENCES volunteers(id)
      );

      -- ═══════════════════════════════════════════════════════════════
      -- Indexes for Offline-First Sync Performance
      -- ═══════════════════════════════════════════════════════════════
      CREATE INDEX IF NOT EXISTS idx_activities_sync_status
        ON activities(organization_id, sync_status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_activities_version_sync
        ON activities(organization_id, version DESC, sync_status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_activities_deleted_at
        ON activities(deleted_at) WHERE deleted_at IS NOT NULL;

      CREATE TABLE IF NOT EXISTS project_schedules (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        task_name_ar TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        progress_pct NUMERIC(5,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- NEB-06: SERVICE DELIVERY & BENEFICIARIES
      -- ═══════════════════════════════════════════════════════════════

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

      CREATE TABLE IF NOT EXISTS beneficiaries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        party_id UUID REFERENCES parties(id),
        beneficiary_code VARCHAR(50),
        full_name_ar TEXT NOT NULL,
        full_name_en TEXT,
        gender VARCHAR(10),
        birth_date DATE,
        national_id VARCHAR(20),
        phone VARCHAR(50),
        family_members_count INTEGER DEFAULT 1 CHECK (family_members_count >= 1),
        vulnerability_status VARCHAR(20) DEFAULT 'NORMAL',
        governorate VARCHAR(100),
        district VARCHAR(100),
        status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
        sync_status VARCHAR(30) DEFAULT 'PENDING',
        version INTEGER DEFAULT 1,
        deleted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ══════════════════════════════════════════════════════════════
      -- Indexes for Beneficiary Sync Performance
      -- ═══════════════════════════════════════════════════════════════
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_sync_status
        ON beneficiaries(organization_id, sync_status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_version_sync
        ON beneficiaries(organization_id, version DESC, sync_status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_deleted_at
        ON beneficiaries(deleted_at) WHERE deleted_at IS NOT NULL;

      CREATE TABLE IF NOT EXISTS field_disbursements (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        beneficiary_id UUID REFERENCES beneficiaries(id),
        project_id UUID REFERENCES projects(id),
        disbursement_number VARCHAR(50) NOT NULL,
        amount NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'YER',
        disbursement_date DATE DEFAULT CURRENT_DATE,
        purpose TEXT,
        payment_method VARCHAR(50),
        status VARCHAR(30) DEFAULT 'PENDING',
        sync_status VARCHAR(30) DEFAULT 'PENDING',
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS service_deliveries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        beneficiary_id UUID REFERENCES beneficiaries(id),
        project_id UUID REFERENCES projects(id),
        service_type VARCHAR(50) NOT NULL,
        beneficiary_count INTEGER DEFAULT 1,
        delivery_date DATE DEFAULT CURRENT_DATE,
        location VARCHAR(200),
        officer_name VARCHAR(100),
        notes TEXT,
        status VARCHAR(30) DEFAULT 'DELIVERED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS aid_distributions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        beneficiary_id UUID REFERENCES beneficiaries(id),
        project_id UUID REFERENCES projects(id),
        aid_type VARCHAR(50) NOT NULL,
        amount NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'YER',
        distribution_date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sponsorships (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        beneficiary_id UUID REFERENCES beneficiaries(id),
        sponsor_party_id UUID REFERENCES parties(id),
        monthly_amount NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- NEB-14: PROCUREMENT
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS vendors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        party_id UUID REFERENCES parties(id),
        vendor_code VARCHAR(50),
        name_ar TEXT NOT NULL,
        name_en TEXT,
        vendor_type VARCHAR(50),
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS procurement_tenders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        tender_number VARCHAR(50) NOT NULL,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        project_id UUID REFERENCES projects(id),
        estimated_value NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'USD',
        submission_deadline TIMESTAMP WITH TIME ZONE,
        status VARCHAR(30) DEFAULT 'DRAFT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vendor_bids (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        rfq_id UUID NOT NULL REFERENCES procurement_tenders(id),
        vendor_id UUID NOT NULL REFERENCES vendors(id),
        bid_amount NUMERIC(18,2),
        currency_code VARCHAR(10) DEFAULT 'USD',
        delivery_days INTEGER,
        technical_score NUMERIC(5,2),
        financial_score NUMERIC(5,2),
        computed_score NUMERIC(5,2),
        status VARCHAR(30) DEFAULT 'SUBMITTED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS purchase_orders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        po_number VARCHAR(50) NOT NULL,
        vendor_id UUID REFERENCES vendors(id),
        project_id UUID REFERENCES projects(id),
        rfq_id UUID REFERENCES procurement_tenders(id),
        total_amount NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(30) DEFAULT 'DRAFT',
        order_date DATE DEFAULT CURRENT_DATE,
        expected_delivery DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tender_auctions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        tender_id UUID REFERENCES procurement_tenders(id) ON DELETE SET NULL,
        auction_number VARCHAR(50) NOT NULL,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        auction_type VARCHAR(30) DEFAULT 'FORWARD',
        start_price NUMERIC(18,2) DEFAULT 0,
        reserve_price NUMERIC(18,2),
        current_best_bid NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(30) DEFAULT 'SCHEDULED',
        starts_at TIMESTAMP WITH TIME ZONE,
        ends_at TIMESTAMP WITH TIME ZONE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS auction_bids (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        auction_id UUID NOT NULL REFERENCES tender_auctions(id) ON DELETE CASCADE,
        vendor_id UUID NOT NULL REFERENCES vendors(id),
        bid_amount NUMERIC(18,2) NOT NULL,
        currency_code VARCHAR(10) DEFAULT 'USD',
        is_winning BOOLEAN DEFAULT FALSE,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS goods_receipts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
        receipt_number VARCHAR(50),
        quantity_received NUMERIC(18,2),
        unit_cost NUMERIC(18,2),
        receipt_date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vendor_invoices (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        purchase_order_id UUID REFERENCES purchase_orders(id),
        vendor_id UUID REFERENCES vendors(id),
        invoice_number VARCHAR(100),
        total_amount NUMERIC(18,2),
        currency_code VARCHAR(10) DEFAULT 'USD',
        invoice_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(30) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- NEB-08: FUNDING & DONORS
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS donors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        party_id UUID REFERENCES parties(id),
        donor_code VARCHAR(100),
        name_ar TEXT NOT NULL,
        name_en TEXT,
        donor_type VARCHAR(50) DEFAULT 'INSTITUTIONAL',
        country VARCHAR(100),
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS grants (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        donor_id UUID REFERENCES donors(id),
        grant_number VARCHAR(100) NOT NULL,
        title_ar TEXT,
        title_en TEXT,
        total_amount NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'USD',
        start_date DATE,
        end_date DATE,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS grant_installments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        grant_id UUID NOT NULL REFERENCES grants(id),
        installment_number INTEGER,
        amount NUMERIC(18,2),
        currency_code VARCHAR(10) DEFAULT 'USD',
        expected_date DATE,
        received_date DATE,
        status VARCHAR(30) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS donations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        campaign_id UUID,
        donor_party_id UUID REFERENCES parties(id),
        amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
        currency_code VARCHAR(10) DEFAULT 'YER',
        payment_method VARCHAR(50),
        payment_reference VARCHAR(100),
        donation_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(30) DEFAULT 'RECEIVED',
        sync_status VARCHAR(30) DEFAULT 'PENDING',
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS donation_campaigns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        target_amount NUMERIC(18,2) DEFAULT 0,
        raised_amount NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'YER',
        start_date DATE,
        end_date DATE,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- NEB-09: ASSETS, HR, INVENTORY
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS assets (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        asset_code VARCHAR(50),
        name_ar TEXT NOT NULL,
        name_en TEXT,
        category VARCHAR(50),
        purchase_date DATE,
        purchase_price NUMERIC(18,2) DEFAULT 0,
        current_value NUMERIC(18,2) DEFAULT 0,
        depreciation_rate NUMERIC(5,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        location VARCHAR(200),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS staff (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        employee_code VARCHAR(50),
        full_name_ar TEXT NOT NULL,
        full_name_en TEXT,
        department VARCHAR(100),
        position VARCHAR(100),
        hire_date DATE,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        staff_id UUID NOT NULL REFERENCES staff(id),
        clock_in TIMESTAMP WITH TIME ZONE,
        clock_out TIMESTAMP WITH TIME ZONE,
        date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(30) DEFAULT 'PRESENT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        staff_id UUID NOT NULL REFERENCES staff(id),
        leave_type VARCHAR(50),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status VARCHAR(30) DEFAULT 'PENDING',
        approved_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS warehouses (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        location VARCHAR(200),
        manager_name VARCHAR(100),
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        warehouse_id UUID REFERENCES warehouses(id),
        item_name_ar TEXT NOT NULL,
        item_name_en TEXT,
        item_code VARCHAR(50),
        quantity NUMERIC(18,2) DEFAULT 0,
        unit VARCHAR(20),
        unit_cost NUMERIC(18,2) DEFAULT 0,
        reorder_level NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'IN_STOCK',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- NEB-02: PORTFOLIO MANAGEMENT OS
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS investment_portfolios (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        portfolio_code VARCHAR(50) NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        description TEXT,
        total_allocated NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS portfolio_projects (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        portfolio_id UUID NOT NULL REFERENCES investment_portfolios(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        allocated_amount NUMERIC(18,2) DEFAULT 0,
        spent_amount NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'PLANNING',
        role VARCHAR(50) DEFAULT 'CONTRIBUTOR',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS portfolio_risks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        portfolio_id UUID NOT NULL REFERENCES investment_portfolios(id) ON DELETE CASCADE,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        risk_level VARCHAR(20) DEFAULT 'MEDIUM',
        mitigation TEXT,
        probability VARCHAR(20) DEFAULT 'POSSIBLE',
        impact VARCHAR(20) DEFAULT 'MODERATE',
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS portfolio_milestones (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        portfolio_id UUID NOT NULL REFERENCES investment_portfolios(id) ON DELETE CASCADE,
        milestone_title_ar TEXT NOT NULL,
        milestone_title_en TEXT,
        target_date DATE,
        completed_date DATE,
        status VARCHAR(30) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS portfolio_benchmarks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        portfolio_id UUID NOT NULL REFERENCES investment_portfolios(id) ON DELETE CASCADE,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        benchmark_type VARCHAR(50),
        target_value NUMERIC(18,2),
        actual_value NUMERIC(18,2) DEFAULT 0,
        unit VARCHAR(50),
        measurement_date DATE,
        status VARCHAR(30) DEFAULT 'ON_TRACK',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS portfolio_allocations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        portfolio_id UUID NOT NULL REFERENCES investment_portfolios(id) ON DELETE CASCADE,
        account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
        allocated_amount NUMERIC(18,2) DEFAULT 0,
        currency_code VARCHAR(10) DEFAULT 'USD',
        allocation_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- NEB-12: INTEGRATION & DIGITAL SERVICES OS
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS api_endpoints (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        endpoint_name VARCHAR(100) NOT NULL,
        path VARCHAR(200) NOT NULL,
        method VARCHAR(10) NOT NULL,
        description TEXT,
        is_authenticated BOOLEAN DEFAULT true,
        is_public BOOLEAN DEFAULT false,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS api_credentials (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        api_endpoint_id UUID NOT NULL REFERENCES api_endpoints(id) ON DELETE CASCADE,
        credential_name VARCHAR(100) NOT NULL,
        credential_type VARCHAR(50) NOT NULL,
        encrypted_credentials JSONB,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS iati_registrations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        registration_id VARCHAR(100) NOT NULL,
        status VARCHAR(30) DEFAULT 'PENDING',
        last_sync TIMESTAMP WITH TIME ZONE,
        next_sync TIMESTAMP WITH TIME ZONE,
        xml_payload_url TEXT,
        validation_errors TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS neon_connections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        connection_name VARCHAR(100) NOT NULL,
        connection_string VARCHAR(500) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_connected TIMESTAMP WITH TIME ZONE,
        connection_type VARCHAR(50) DEFAULT 'POSTGRESQL',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- NEB-13: AI INTELLIGENCE & IMPACT OS
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS ai_model_configs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        model_name VARCHAR(100) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        config_parameters JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_prompt_templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        template_name VARCHAR(100) NOT NULL,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        prompt_text_ar TEXT,
        prompt_text_en TEXT,
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_interaction_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        model_name VARCHAR(100) NOT NULL,
        prompt_text TEXT,
        response_text TEXT,
        token_count INTEGER DEFAULT 0,
        cost NUMERIC(18,4) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'SUCCESS',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- Organization Settings
      -- ═══════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS organization_settings (
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string',
        PRIMARY KEY (organization_id, setting_key)
      );

      CREATE TABLE IF NOT EXISTS impact_metrics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        metric_name VARCHAR(100) NOT NULL,
        metric_ar TEXT,
        metric_en TEXT,
        measurement_formula TEXT,
        target_value NUMERIC(18,2),
        current_value NUMERIC(18,2) DEFAULT 0,
        unit VARCHAR(50),
        reporting_period VARCHAR(30) DEFAULT 'ANNUAL',
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- NEB-01: STRATEGY & PERFORMANCE
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS strategic_plans (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        start_year INTEGER,
        end_year INTEGER,
        vision_ar TEXT,
        mission_ar TEXT,
        target_beneficiaries_count INTEGER DEFAULT 0,
        total_estimated_budget_yer NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'DRAFT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS strategic_goals (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES strategic_plans(id),
        title_ar TEXT NOT NULL,
        title_en TEXT,
        description TEXT,
        target_value NUMERIC(18,2),
        current_value NUMERIC(18,2) DEFAULT 0,
        unit VARCHAR(50),
        status VARCHAR(30) DEFAULT 'ON_TRACK',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS kpi_indicators (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        goal_id UUID REFERENCES strategic_goals(id),
        name_ar TEXT NOT NULL,
        name_en TEXT,
        description TEXT,
        formula TEXT,
        target_value NUMERIC(18,2),
        current_value NUMERIC(18,2) DEFAULT 0,
        unit VARCHAR(50),
        frequency VARCHAR(30) DEFAULT 'MONTHLY',
        status VARCHAR(30) DEFAULT 'ACTIVE',
      -- ═══════════════════════════════════════════════════════════════
      -- NEB-05/NEB-09: INVENTORY & WAREHOUSE OS (Production-Grade E2E)
      -- وحدة المخازن: مدخلات أساسية، عمليات، مستندات، تقارير، سياسات
      -- ═══════════════════════════════════════════════════════════════

      -- شجرة فئات الأصناف
      CREATE TABLE IF NOT EXISTS inventory_categories (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES inventory_categories(id),
        code VARCHAR(50) NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        description TEXT,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- وحدات القياس
      CREATE TABLE IF NOT EXISTS inventory_uoms (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(20) NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        base_uom_code VARCHAR(20),
        conversion_factor NUMERIC(18,6) DEFAULT 1,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- دليل الأصناف الرئيسي (Master Data)
      CREATE TABLE IF NOT EXISTS inventory_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        category_id UUID REFERENCES inventory_categories(id),
        uom_id UUID REFERENCES inventory_uoms(id),
        item_code VARCHAR(50) NOT NULL,
        barcode VARCHAR(60),
        name_ar TEXT NOT NULL,
        name_en TEXT,
        description TEXT,
        item_type VARCHAR(30) DEFAULT 'STOCK',
        valuation_method VARCHAR(30) DEFAULT 'WEIGHTED_AVERAGE',
        min_level NUMERIC(18,2) DEFAULT 0,
        max_level NUMERIC(18,2) DEFAULT 0,
        reorder_level NUMERIC(18,2) DEFAULT 0,
        reorder_qty NUMERIC(18,2) DEFAULT 0,
        shelf_life_days INT,
        storage_conditions TEXT,
        is_serialized BOOLEAN DEFAULT FALSE,
        is_batch_tracked BOOLEAN DEFAULT TRUE,
        standard_cost NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- أرصدة المخزون (item × warehouse × batch)
      CREATE TABLE IF NOT EXISTS inventory_stock_balances (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        batch_number VARCHAR(60),
        expiry_date DATE,
        quantity_on_hand NUMERIC(18,2) NOT NULL DEFAULT 0,
        quantity_reserved NUMERIC(18,2) NOT NULL DEFAULT 0,
        unit_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
        last_movement_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_stock_balance UNIQUE (warehouse_id, item_id, batch_number)
      );

      -- دفتر حركات المخزون الموحد (Immutable Ledger)
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        movement_number VARCHAR(40) NOT NULL,
        movement_type VARCHAR(30) NOT NULL,
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        item_id UUID NOT NULL REFERENCES inventory_items(id),
        batch_number VARCHAR(60),
        expiry_date DATE,
        quantity NUMERIC(18,2) NOT NULL,
        unit_cost NUMERIC(18,2) NOT NULL DEFAULT 0,

      -- أوامر التحويل بين المخازن
      CREATE TABLE IF NOT EXISTS inventory_transfers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        transfer_number VARCHAR(40) NOT NULL,
        from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
        reason TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        requested_by UUID REFERENCES users(id),
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        shipped_at TIMESTAMP WITH TIME ZONE,
        received_by UUID REFERENCES users(id),
        received_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_transfer_lines (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        transfer_id UUID NOT NULL REFERENCES inventory_transfers(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES inventory_items(id),
        batch_number VARCHAR(60),
        quantity NUMERIC(18,2) NOT NULL,
        quantity_shipped NUMERIC(18,2) DEFAULT 0,
        quantity_received NUMERIC(18,2) DEFAULT 0,
        unit_cost NUMERIC(18,2) DEFAULT 0,
        notes TEXT
      );

      -- تسويات المخزون
      CREATE TABLE IF NOT EXISTS inventory_adjustments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        adjustment_number VARCHAR(40) NOT NULL,
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        direction VARCHAR(10) NOT NULL,
        reason_code VARCHAR(50) NOT NULL,
        reason_text TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        total_value NUMERIC(18,2) DEFAULT 0,
        created_by UUID REFERENCES users(id),
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        posted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_adjustment_lines (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        adjustment_id UUID NOT NULL REFERENCES inventory_adjustments(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES inventory_items(id),
        batch_number VARCHAR(60),
        quantity NUMERIC(18,2) NOT NULL,
        unit_cost NUMERIC(18,2) DEFAULT 0,
        total_value NUMERIC(18,2) DEFAULT 0,
        notes TEXT
      );

      -- الجرد الفعلي (Stocktake)
      CREATE TABLE IF NOT EXISTS inventory_stocktakes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        stocktake_number VARCHAR(40) NOT NULL,
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        stocktake_date DATE NOT NULL DEFAULT CURRENT_DATE,
        count_type VARCHAR(30) DEFAULT 'FULL',
        status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
        total_variance_value NUMERIC(18,2) DEFAULT 0,
        counted_by UUID REFERENCES users(id),
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        posted_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_stocktake_lines (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        stocktake_id UUID NOT NULL REFERENCES inventory_stocktakes(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES inventory_items(id),
        batch_number VARCHAR(60),
        system_quantity NUMERIC(18,2) NOT NULL DEFAULT 0,
        counted_quantity NUMERIC(18,2),
        variance_quantity NUMERIC(18,2),
        unit_cost NUMERIC(18,2) DEFAULT 0,
        variance_value NUMERIC(18,2) DEFAULT 0,
        notes TEXT
      );

      -- سياسات وإعدادات وحدة المخازن (لكل منظمة)
      CREATE TABLE IF NOT EXISTS inventory_policies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
        costing_method VARCHAR(30) DEFAULT 'WEIGHTED_AVERAGE',
        allow_negative_stock BOOLEAN DEFAULT FALSE,
        require_approval_issue BOOLEAN DEFAULT TRUE,
        require_approval_transfer BOOLEAN DEFAULT TRUE,
        require_approval_adjustment BOOLEAN DEFAULT TRUE,
        issue_approval_threshold NUMERIC(18,2) DEFAULT 0,
        adjustment_approval_threshold NUMERIC(18,2) DEFAULT 0,
        default_stocktake_frequency VARCHAR(30) DEFAULT 'MONTHLY',
        expiry_alert_days INT DEFAULT 60,
        reorder_alert_enabled BOOLEAN DEFAULT TRUE,
        auto_reserve_on_transfer BOOLEAN DEFAULT TRUE,
        fifo_enabled BOOLEAN DEFAULT FALSE,
        updated_by UUID REFERENCES users(id),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );


        total_value NUMERIC(18,2) NOT NULL DEFAULT 0,
        balance_after NUMERIC(18,2),
        reference_type VARCHAR(40),
        reference_id UUID,
        reference_number VARCHAR(40),
        project_id UUID REFERENCES projects(id),
        activity_id UUID REFERENCES activities(id),
        beneficiary_id UUID REFERENCES beneficiaries(id),
        donor_id UUID REFERENCES donors(id),
        doc_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'POSTED',
        posted_by UUID REFERENCES users(id),
        posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );


        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS meta (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      INSERT INTO meta (key, value) VALUES ('first_run', 'true') ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW();

      CREATE TABLE IF NOT EXISTS swot_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        category VARCHAR(20) NOT NULL,
        title_ar TEXT NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- NEB-07: COMMUNITY & VOLUNTEERS
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS volunteers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        party_id UUID REFERENCES parties(id),
        full_name_ar TEXT NOT NULL,
        full_name_en TEXT,
        skills TEXT,
        availability VARCHAR(50),
        total_hours NUMERIC(10,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS committees (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        description TEXT,
        chairperson_name VARCHAR(100),
        member_count INTEGER DEFAULT 0,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS membership_applications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        applicant_name TEXT NOT NULL,
        applicant_email VARCHAR(254),
        applicant_phone VARCHAR(50),
        application_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(30) DEFAULT 'PENDING',
        reviewed_by UUID REFERENCES users(id),
        review_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- NEB-11: KNOWLEDGE & DOCUMENTS
      -- ═══════════════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS knowledge_articles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        category VARCHAR(100),
        content_ar TEXT,
        content_en TEXT,
        tags TEXT[],
        author_id UUID REFERENCES users(id),
        view_count INTEGER DEFAULT 0,
        status VARCHAR(30) DEFAULT 'PUBLISHED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ═══════════════════════════════════════════════════════════════
      -- INDEXES
      -- ═══════════════════════════════════════════════════════════════

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
      CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_transactions_org ON transactions(organization_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transaction_lines_account ON transaction_lines(account_id);
      CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status_code);
      CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
      CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
      CREATE INDEX IF NOT EXISTS idx_activities_staff ON activities(staff_id) WHERE staff_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_activities_volunteer ON activities(volunteer_id) WHERE volunteer_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_activities_project_staff ON activities(project_id, staff_id) WHERE staff_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_activities_project_volunteer ON activities(project_id, volunteer_id) WHERE volunteer_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_org ON beneficiaries(organization_id);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_national_id ON beneficiaries(national_id);
      CREATE INDEX IF NOT EXISTS idx_service_deliveries_beneficiary ON service_deliveries(beneficiary_id);
      CREATE INDEX IF NOT EXISTS idx_donations_org ON donations(organization_id);
      CREATE INDEX IF NOT EXISTS idx_grants_org ON grants(organization_id);
      CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(organization_id);
      CREATE INDEX IF NOT EXISTS idx_staff_org ON staff(organization_id);
      CREATE INDEX IF NOT EXISTS idx_volunteers_org ON volunteers(organization_id);
      CREATE INDEX IF NOT EXISTS idx_knowledge_org ON knowledge_articles(organization_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_items_org ON inventory_items(organization_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON inventory_items(item_code);
      CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
      CREATE INDEX IF NOT EXISTS idx_stock_balance_wh_item ON inventory_stock_balances(warehouse_id, item_id);
      CREATE INDEX IF NOT EXISTS idx_stock_balance_expiry ON inventory_stock_balances(expiry_date) WHERE expiry_date IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_inventory_mov_org ON inventory_movements(organization_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_mov_wh ON inventory_movements(warehouse_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_mov_item ON inventory_movements(item_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_mov_type ON inventory_movements(movement_type);
      CREATE INDEX IF NOT EXISTS idx_inventory_mov_date ON inventory_movements(doc_date);
      CREATE INDEX IF NOT EXISTS idx_inventory_transfers_org ON inventory_transfers(organization_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_transfers_status ON inventory_transfers(status);
      CREATE INDEX IF NOT EXISTS idx_inventory_adjust_org ON inventory_adjustments(organization_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_stocktakes_org ON inventory_stocktakes(organization_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_stocktakes_wh ON inventory_stocktakes(warehouse_id);
    `);

    await client.query('COMMIT');
    console.log('[NexoraOS™ Schema] ✅ Initial schema migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[NexoraOS™ Schema] ❌ Initial schema migration FAILED:', error);
    throw error;
  } finally {
    client.release();
  }
}
