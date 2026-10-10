-- 2026-09-09: Create financial_dimensions table (7-dimension Chart of Accounts)
CREATE TABLE IF NOT EXISTS financial_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  dimension_type VARCHAR(20) NOT NULL CHECK (dimension_type IN ('BRANCH', 'DONOR_GRANT', 'COST_CENTER', 'PROJECT_ACTIVITY', 'INTERCOMPANY', 'SECONDARY')),
  dimension_code VARCHAR(30) NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  parent_id UUID REFERENCES financial_dimensions(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, dimension_type, dimension_code)
);

CREATE INDEX IF NOT EXISTS idx_fin_dim_org ON financial_dimensions(organization_id);
CREATE INDEX IF NOT EXISTS idx_fin_dim_type ON financial_dimensions(dimension_type);
CREATE INDEX IF NOT EXISTS idx_fin_dim_active ON financial_dimensions(is_active);

COMMENT ON TABLE financial_dimensions IS '7-dimensional financial dimensions for segmented Chart of Accounts';