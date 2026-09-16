    await client.query(`
      CREATE TABLE IF NOT EXISTS revenue_batches (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        batch_number VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        total_amount NUMERIC NOT NULL DEFAULT 0,
        currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
        exchange_rate NUMERIC NOT NULL DEFAULT 1,
        batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
        description TEXT,
        applied_cap_id UUID,
        cap_remaining_before NUMERIC,
        created_by UUID NOT NULL REFERENCES users(id),
        approved_by UUID REFERENCES users(id),
        posted_by UUID REFERENCES users(id),
        rejection_reason TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS revenue_batch_entries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        batch_id UUID NOT NULL REFERENCES revenue_batches(id) ON DELETE CASCADE,
        sequence_number INT NOT NULL,
        account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
        account_code VARCHAR(50) NOT NULL,
        account_name_ar TEXT,
        debit_amount NUMERIC NOT NULL DEFAULT 0,
        credit_amount NUMERIC NOT NULL DEFAULT 0,
        currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
        exchange_rate NUMERIC NOT NULL DEFAULT 1,
        amount_base NUMERIC NOT NULL DEFAULT 0,
        project_id UUID REFERENCES projects(id),
        activity_id UUID REFERENCES activities(id),
        cost_center_id UUID,
        counterparty_id UUID,
        counterparty_name TEXT,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_revenue_batches_org_status ON revenue_batches(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_revenue_batches_org_date ON revenue_batches(organization_id, batch_date DESC);
      CREATE INDEX IF NOT EXISTS idx_revenue_batch_entries_batch ON revenue_batch_entries(batch_id);

      CREATE SEQUENCE IF NOT EXISTS revenue_batch_seq START 1;

      // ═══════════════════════════════════════════════════════════════════════
      // NEB-15 Revenue Schedules — Future-Dated & Recurring Revenue
      // ═══════════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS revenue_schedules (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        schedule_number VARCHAR(100) NOT NULL UNIQUE,
        revenue_type VARCHAR(50) NOT NULL,
        counterparty_name TEXT NOT NULL,
        counterparty_party_id UUID REFERENCES parties(id),
        project_id UUID REFERENCES projects(id),
        activity_id UUID REFERENCES activities(id),
        stream_id UUID REFERENCES revenue_streams(id),
        total_amount NUMERIC NOT NULL,
        currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
        schedule_type VARCHAR(30) NOT NULL DEFAULT 'INSTALLMENT',
        frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
        installments_count INT NOT NULL DEFAULT 1,
        installment_amount NUMERIC,
        start_date DATE NOT NULL,
        end_date DATE,
        next_due_date DATE,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS revenue_schedule_installments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        schedule_id UUID NOT NULL REFERENCES revenue_schedules(id) ON DELETE CASCADE,
        installment_number INT NOT NULL,
        due_date DATE NOT NULL,
        amount NUMERIC NOT NULL,
        currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
        amount_base NUMERIC NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        linked_record_id UUID REFERENCES revenue_records(id),
        collected_date DATE,
        collected_amount NUMERIC DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_revenue_schedules_org_status ON revenue_schedules(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_revenue_schedules_next_due ON revenue_schedules(next_due_date) WHERE status = 'ACTIVE';
      CREATE INDEX IF NOT EXISTS idx_schedule_installments_schedule ON revenue_schedule_installments(schedule_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_installments_status ON revenue_schedule_installments(status);

      CREATE SEQUENCE IF NOT EXISTS revenue_schedule_seq START 1;

      // ═══════════════════════════════════════════════════════════════════════
      // NEB-15 Funding Caps — Ceiling Enforcement & Monitoring
      // ═══════════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS funding_caps (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        cap_code VARCHAR(100) NOT NULL UNIQUE,
        cap_name_ar TEXT NOT NULL,
        cap_name_en TEXT,
        cap_type VARCHAR(30) NOT NULL DEFAULT 'HARD',
        applicable_types TEXT[] NOT NULL,
        project_id UUID REFERENCES projects(id),
        donor_id UUID REFERENCES donors(id),
        grant_id UUID REFERENCES grants(id),
        total_cap_amount NUMERIC NOT NULL,
        currency_code VARCHAR(10) NOT NULL DEFAULT 'YER',
        start_date DATE NOT NULL,
        end_date DATE,
        alert_threshold_pct INT DEFAULT 80,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS funding_cap_utilizations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cap_id UUID NOT NULL REFERENCES funding_caps(id) ON DELETE CASCADE,
        revenue_record_id UUID REFERENCES revenue_records(id),
        revenue_batch_id UUID REFERENCES revenue_batches(id),
        utilization_amount NUMERIC NOT NULL,
        utilization_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_funding_caps_org_status ON funding_caps(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_funding_caps_project ON funding_caps(project_id) WHERE project_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_funding_cap_utilizations_cap ON funding_cap_utilizations(cap_id);
    `);