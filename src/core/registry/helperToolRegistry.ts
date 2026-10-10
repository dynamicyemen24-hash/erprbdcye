/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Helper Tool Registry (helpers ↔ operations linkage)
 *
 * Every helper tool declares:
 *   - permission: shared permission-map key gating its productive action
 *   - settingsKeys: system_settings / organization_settings keys it reads
 *   - dbTables: whitelisted tables it reads/writes (or [] when pure-local)
 *   - api: production endpoint(s) it calls (or [] when pure-local)
 *
 * The HelperToolsPanel renders this linkage per tool so a user reaching any
 * tool from anywhere (Alt+H / Ctrl+K / header / dock) sees WHAT it will touch.
 * Pure calculators keep dbTables/api empty BY CONTRACT — the moment a tool
 * gains a write it must declare it here first.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import type { PermissionKey } from '../../shared/permissions/permission-map';

export type HelperToolId =
  | 'sphere'
  | 'id_verifier'
  | 'risk'
  | 'checklists'
  | 'zakat_calculator'
  | 'fx_hedging'
  | 'ipsas'
  | 'icr'
  | 'hijri_converter'
  | 'qr_stamp_generator'
  | 'iati'
  | 'chs_audit';

export interface HelperToolLinkage {
  id: HelperToolId;
  permission: PermissionKey;
  settingsKeys: string[];
  dbTables: string[];
  api: string[];
  writes: boolean;
}

export const HELPER_TOOL_REGISTRY: Record<HelperToolId, HelperToolLinkage> = {
  sphere: {
    id: 'sphere',
    permission: 'activities:read',
    settingsKeys: ['sphere_standards_version'],
    dbTables: ['beneficiaries', 'activities'],
    api: ['GET /api/tables/beneficiaries'],
    writes: false,
  },
  id_verifier: {
    id: 'id_verifier',
    permission: 'beneficiaries:read',
    settingsKeys: ['id_validation_rules'],
    dbTables: ['beneficiaries'],
    api: ['GET /api/tables/beneficiaries'],
    writes: false,
  },
  risk: {
    id: 'risk',
    permission: 'projects:read',
    settingsKeys: ['risk_weights'],
    dbTables: ['projects', 'activities'],
    api: ['GET /api/tables/projects'],
    writes: false,
  },
  checklists: {
    id: 'checklists',
    permission: 'activities:read',
    settingsKeys: ['checklist_templates'],
    dbTables: ['activities', 'field_tasks'],
    api: ['GET /api/tables/field_tasks'],
    writes: false,
  },
  zakat_calculator: {
    id: 'zakat_calculator',
    permission: 'finance:read',
    settingsKeys: ['gold_price_yer', 'zakat_nisab_grams'],
    dbTables: ['transactions'],
    api: ['GET /api/tables/transactions'],
    writes: false,
  },
  fx_hedging: {
    id: 'fx_hedging',
    permission: 'finance:read',
    settingsKeys: ['fx_rates', 'exchange_usd_yer', 'exchange_sar_yer', 'exchange_eur_usd'],
    dbTables: ['currencies', 'exchange_rates'],
    api: ['GET /api/v2/finance/currencies', 'GET /api/v2/finance/exchange-rate'],
    writes: false,
  },
  ipsas: {
    id: 'ipsas',
    permission: 'finance:read',
    settingsKeys: ['chart_of_accounts_version'],
    dbTables: ['chart_of_accounts', 'transactions'],
    api: ['GET /api/v2/finance/chart-of-accounts'],
    writes: false,
  },
  icr: {
    id: 'icr',
    permission: 'finance:read',
    settingsKeys: ['icr_default_rate'],
    dbTables: ['budgets'],
    api: ['GET /api/v2/finance/budgets'],
    writes: false,
  },
  hijri_converter: {
    id: 'hijri_converter',
    permission: 'dashboard:read',
    settingsKeys: ['hijri_calendar_mode'],
    dbTables: [],
    api: [],
    writes: false,
  },
  qr_stamp_generator: {
    id: 'qr_stamp_generator',
    permission: 'approvals:act',
    settingsKeys: ['stamp_authority_name'],
    dbTables: ['audit_logs'],
    api: ['POST /api/tables/audit_logs'],
    writes: true,
  },
  iati: {
    id: 'iati',
    permission: 'reports:read',
    settingsKeys: ['iati_version'],
    dbTables: ['iati_activities'],
    api: ['GET /api/tables/iati_activities'],
    writes: false,
  },
  chs_audit: {
    id: 'chs_audit',
    permission: 'audit:read',
    settingsKeys: ['chs_benchmark_year'],
    dbTables: ['audit_logs'],
    api: ['GET /api/tables/audit_logs'],
    writes: false,
  },
};

export function getToolLinkage(id: HelperToolId): HelperToolLinkage {
  return HELPER_TOOL_REGISTRY[id];
}
