-- =========================================================================================
-- NexoraOS™ Intelligent Enterprise Database Optimization & High-Performance Schema
-- Organization: جمعية رُحماء بينهم للعمل الإنساني والتنمية (Rohamā'a Baynahum Foundation)
-- Support: NEB-01 to NEB-15 Domains, High Throughput, Automated Capping, Audit Triggers, & Views
-- Engine: Neon PostgreSQL / PostgreSQL 15+
-- =========================================================================================

-- -----------------------------------------------------------------------------------------
-- 1. PERFORMANCE INDEXES (تحسين الاستعلامات والبحث السريع للأداء العالي)
-- -----------------------------------------------------------------------------------------

-- Fast search on Field Activities by Project, Sector, Status & Start Date
CREATE INDEX IF NOT EXISTS idx_activities_project_sector_status 
ON activities (project_id, sector_id, status_code, start_datetime DESC);

-- Fast search on Inventory Disbursements by Beneficiary, Depot, & SKU
CREATE INDEX IF NOT EXISTS idx_inventory_disbursements_beneficiary_depot 
ON inventory_disbursements (beneficiary_id, depot_id, created_at DESC);

-- Fast lookup for Ledger Transactions by Project, Ledger Code & Currency
CREATE INDEX IF NOT EXISTS idx_transactions_project_ledger_currency 
ON transactions (project_id, ledger_code, currency_code, created_at DESC);

-- Fast lookup for Beneficiaries by ID Card, Family Members, & Status
CREATE INDEX IF NOT EXISTS idx_beneficiaries_national_id_status 
ON beneficiaries (national_id, category_code, status_code);

-- Fast lookup for Field Dispatches Queue
CREATE INDEX IF NOT EXISTS idx_field_disbursements_activity_status 
ON field_disbursements (activity_id, status, created_at DESC);


-- -----------------------------------------------------------------------------------------
-- 2. HIGH-PERFORMANCE DATABASE VIEWS (رؤى استعلامية سريعة ومجمعة)
-- -----------------------------------------------------------------------------------------

-- View 1: Real-time Field Operations & Financial-Material Integration Summary
CREATE OR REPLACE VIEW v_activity_financial_material_summary AS
SELECT 
    a.id AS activity_id,
    a.name_ar AS activity_name_ar,
    a.project_id,
    a.sector_id,
    a.activity_type_code,
    a.status_code AS activity_status,
    COALESCE(CAST(a.budget AS NUMERIC), 0) AS total_budget_yer,
    COALESCE(SUM(fd.amount), 0) AS total_disbursed_financial_yer,
    COUNT(DISTINCT fd.id) AS total_financial_vouchers_count,
    COUNT(DISTINCT mr.id) AS total_material_requests_count,
    COALESCE(a.target_beneficiaries, 0) AS target_beneficiaries_count,
    CASE 
        WHEN COALESCE(CAST(a.budget AS NUMERIC), 0) > 0 
        THEN ROUND((COALESCE(SUM(fd.amount), 0) / CAST(a.budget AS NUMERIC)) * 100, 2)
        ELSE 0 
    END AS financial_disbursement_percentage
FROM activities a
LEFT JOIN field_disbursements fd ON fd.activity_id = a.id AND fd.status = 'APPROVED'
LEFT JOIN field_material_requests mr ON mr.activity_id = a.id
GROUP BY a.id, a.name_ar, a.project_id, a.sector_id, a.activity_type_code, a.status_code, a.budget, a.target_beneficiaries;


-- View 2: Multi-Beneficiary Distribution Roster & EVoucher Validation View
CREATE OR REPLACE VIEW v_beneficiary_disbursement_manifest AS
SELECT 
    b.id AS beneficiary_id,
    b.full_name_ar,
    b.national_id,
    b.family_members_count,
    b.phone_number,
    b.governorate,
    id.id AS disbursement_id,
    id.depot_id,
    id.sku_code,
    id.disbursed_qty,
    id.allocation_strategy,
    id.created_at AS disbursement_date
FROM beneficiaries b
JOIN inventory_disbursements id ON id.beneficiary_id = b.id;


-- -----------------------------------------------------------------------------------------
-- 3. AUTOMATED DATABASE TRIGGERS & FUNCTIONS (المعالجة والتأمين التلقائي)
-- -----------------------------------------------------------------------------------------

-- Function 1: Automated Inventory Stock Decrement Audit Check
CREATE OR REPLACE FUNCTION fn_audit_inventory_stock_decrement()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if requested quantity exceeds current available stock
    IF (SELECT available_qty FROM depot_items WHERE depot_id = NEW.depot_id AND item_id = NEW.item_id) < NEW.disbursed_qty THEN
        RAISE EXCEPTION 'خطأ مخزني: الكمية المطلوبة (%s) تتجاوز الرصيد المتاح بالمستودع!', NEW.disbursed_qty;
    END IF;

    -- Decrement stock level
    UPDATE depot_items 
    SET available_qty = available_qty - NEW.disbursed_qty,
        updated_at = NOW()
    WHERE depot_id = NEW.depot_id AND item_id = NEW.item_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 1: Bind stock decrement to inventory disbursement inserts
DROP TRIGGER IF EXISTS trg_audit_inventory_stock_decrement ON inventory_disbursements;
CREATE TRIGGER trg_audit_inventory_stock_decrement
AFTER INSERT ON inventory_disbursements
FOR EACH ROW
EXECUTE FUNCTION fn_audit_inventory_stock_decrement();


-- Function 2: Automated Security Audit Trail Logger
CREATE OR REPLACE FUNCTION fn_log_security_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        action_name,
        entity_name,
        entity_id,
        performed_by,
        metadata,
        created_at
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        CURRENT_USER,
        json_build_object('timestamp', NOW(), 'operation', TG_OP),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 2: Log field disbursements to security audit
DROP TRIGGER IF EXISTS trg_log_field_disbursement_audit ON field_disbursements;
CREATE TRIGGER trg_log_field_disbursement_audit
AFTER INSERT OR UPDATE ON field_disbursements
FOR EACH ROW
EXECUTE FUNCTION fn_log_security_audit_event();
