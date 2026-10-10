# Offline Coverage (DEBT-10)

Evidence (`node verify-coverage.js`, offline, both schemas via config):
79 initial tables, ~52 completion tables (114 merged),
**7 tables carry `sync_status`**, 69 initial tables have none of
(`offline_enabled` / `sync_status` / `version` / `deleted_at`).
Real per-table sync coverage ≈ 7/79 ≈ **9%** of initial tables
(7/114 ≈ 6% merged) — not 100%.
Run: `npm run verify:coverage` (exit 0 iff sync tables ≥ 7 and `sync_queue` exists).

## Decision table

| Group | Tables | Strategy |
|---|---|---|
| MUST-offline | `activities`, `beneficiaries`, `projects`, `donations`, `field_disbursements`, `transactions`, `journal_entries` | Per-table offline columns (`sync_status` + indexes) — field ops collect data with no connectivity |
| CENTRAL-via-queue | `grants`, `rfqs`, `revenue_*`, `iati_*`, `ai_*` + rest | Back-office entities sync through the central `sync_queue` + scattered `ALTER TABLE` guards, not per-table columns |

Rationale: field-facing tables (activities/beneficiaries/disbursements) must
capture and queue offline; grants/RFQs/revenue/IATI/AI are back-office flows
created online and reconciled centrally, so queue-based sync is sufficient.

## Next steps

1. `sync_queue` indexes: `idx_sync_queue_status (status)` and
   `idx_sync_queue_entity (entity_type)` added (plus existing
   `idx_sync_queue_org_status`) — verify with `node verify-coverage.js`.
2. Retention policy: define PENDING/FAILED vs SYNCED row lifetime so the
   queue cannot grow unbounded (add a queue-depth health check).
3. Per-table rollout: promote CENTRAL tables to MUST-offline only when a
   field flow needs them; each promotion adds columns + index + a line here.
