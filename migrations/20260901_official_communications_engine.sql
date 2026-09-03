-- ═══════════════════════════════════════════════════════════════════
-- NexoraOS™ — NEB-11: Intelligent Administrative Communications OS
-- Migration: 20260901_official_communications_engine.sql
-- Purpose: Real enterprise-grade internal communication & directive channel
--          (memoranda, circulars, directives, announcements) with an
--          approval workflow, distribution registry, and cross-unit linking
--          to Projects / Programs / Activities / Beneficiaries / Vendors.
-- Standard: Institutional governance, accountability, and archival (NEB-11).
-- NOTE: Fully idempotent (IF NOT EXISTS) — no destructive operations.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Official Communications Registry ──────────────────────────
CREATE TABLE IF NOT EXISTS official_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  doc_number VARCHAR(60) NOT NULL,            -- م/2026/0001 ، ع/2026/0001 ...
  doc_type VARCHAR(30) NOT NULL DEFAULT 'MEMO'
    CHECK (doc_type IN ('MEMO','CIRCULAR','DIRECTIVE','ANNOUNCEMENT','REPLY')),
  subject_ar VARCHAR(300) NOT NULL,
  subject_en VARCHAR(300),
  body_ar TEXT,
  body_en TEXT,
  -- Lifecycle: DRAFT → SUBMITTED → APPROVED → ISSUED → DISTRIBUTED → CLOSED
  --                         → REJECTED / VOIDED
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','ISSUED','DISTRIBUTED',
                      'CLOSED','REJECTED','VOIDED')),
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
    CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  classification VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL'
    CHECK (classification IN ('OFFICIAL','CONFIDENTIAL','RESTRICTED','PUBLIC')),
  -- Author / workflow
  author_user_id UUID,
  author_name_ar VARCHAR(255),
  from_entity VARCHAR(255) NOT NULL,          -- جهة الإصدار
  to_entity VARCHAR(255),                     -- جهة الإحالة / التوجيه
  cc_entities TEXT,                           -- صورة إلى (jsonb or comma list)
  -- Cross-unit linking (single primary target; related links in references)
  linked_entity_type VARCHAR(30),             -- project/program/activity/...
  linked_entity_id UUID,
  linked_entity_name VARCHAR(255),
  references_ar TEXT,                          -- المراجع والمرفقات
  attachments_ar TEXT,
  -- Approval workflow
  submitted_by_user UUID,
  submitted_at TIMESTAMPTZ,
  approved_by_user UUID,
  approved_at TIMESTAMPTZ,
  approval_note TEXT,
  issue_date DATE,
  effective_date DATE,
  expiry_date DATE,
  signed_by VARCHAR(255),
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (organization_id, doc_number)
);

-- ─── 2. Distribution Registry ────────────────────────────────────
-- Tracks who each communication was distributed to and acknowledgement status.
CREATE TABLE IF NOT EXISTS official_communication_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  communication_id UUID NOT NULL
    REFERENCES official_communications(id) ON DELETE CASCADE,
  recipient_type VARCHAR(30) NOT NULL DEFAULT 'DEPARTMENT'
    CHECK (recipient_type IN ('DEPARTMENT','ROLE','USER','ENTITY','ALL')),
  recipient_entity VARCHAR(255) NOT NULL,     -- department / role / user / entity name
  recipient_user_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','DELIVERED','READ','ACKNOWLEDGED','DECLINED')),
  read_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  ack_note TEXT,
  distribution_channel VARCHAR(20) NOT NULL DEFAULT 'IN_APP'
    CHECK (distribution_channel IN ('IN_APP','EMAIL','PUSH','PRINT','LEGACY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (communication_id, recipient_type, recipient_entity)
);

-- ─── 3. Supporting Indexes ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_official_comm_org_status
  ON official_communications (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_official_comm_org_type
  ON official_communications (organization_id, doc_type);
CREATE INDEX IF NOT EXISTS idx_official_comm_linked
  ON official_communications (organization_id, linked_entity_type, linked_entity_id);
CREATE INDEX IF NOT EXISTS idx_official_comm_recipients_comm
  ON official_communication_recipients (communication_id);
CREATE INDEX IF NOT EXISTS idx_official_comm_recipients_org
  ON official_communication_recipients (organization_id, status);
