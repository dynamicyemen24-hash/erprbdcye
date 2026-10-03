/**
 * Global ERP standards — schema layer.
 *
 * WHY THIS IS A SEPARATE MODULE
 * The business tables (organizations, branches, warehouses, transactions …) live
 * in `schema.ts`. What lives here is the *accounting and measurement standard*
 * itself — the parts that cannot be hard-coded in a component, because a
 * multi-country, multi-tenant ERP has to satisfy all of them at once and change
 * them without a code release:
 *
 *   ISO 4217   currency minor units. JPY has 0 decimals, KWD has 3. Rounding
 *              every amount to 2 decimals corrupts both, so the exponent is data.
 *   ISO 3166   country identity for branches and for currency defaults.
 *   UN/CEFACT  unit conversion as (type, factor, offset). A single
 *              `conversion_factor` cannot express 100 kg → lb, let alone
 *              °C → °F, which needs an offset.
 *   IAS 21     functional currency per entity, transaction currency per
 *              document, and the rate actually used. With fewer than all three
 *              the FX difference cannot be computed and the audit trail is lost.
 *   IFRS       rate *type* and effectivity dating, so a newly published rate
 *              never re-rates a period that has already been reported.
 *   ZATCA      per-organization invoice counter, UUIDv5 identity, and a TLV
 *              hash that chains to the previous invoice so a gap or a reorder
 *              is detectable (Integration phase, beyond mere QR issuance).
 *   IPSAS 25   an explicit, recorded period lock. A period that is "closed" only
 *              by convention is not closed, and the closing entry is part of the
 *              evidence.
 *
 * Each table is scoped by `organization_id` so a shared deployment satisfies
 * two different tenants' tax regimes without either seeing the other's.
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';

import { organizations, users, branches, warehouses, inventoryItems, fiscalYears } from './schema';

/** ISO 4217 currency catalogue, with the exponent that rounding depends on. */
export const currenciesStd = pgTable('currencies_std', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),        // ISO 4217 alpha-3
  codeNumeric: text('code_numeric'),             // ISO 4217 numeric
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  symbol: text('symbol'),
  /**
   * -1 → 0 decimals (JPY) · 0 → 2 decimals (USD) · 1 → 3 decimals (KWD).
   * Rounding must divide by 10 ** minorUnits, never assume 100.
   */
  minorUnits: integer('minor_units').notNull().default(2),
  roundingIncrement: numeric('rounding_increment').default('0.01'),
  countryCode: text('country_code'),             // ISO 3166-1 alpha-2
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * FX rates with an explicit type and an effectivity window.
 *
 * The dates are what keep a historical trial balance stable: a rate published
 * today must never re-rate a period that was reported last quarter, so the
 * engine selects the rate whose window contains the document's own date.
 */
export const exchangeRatesStd = pgTable('exchange_rates_std', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  fromCurrency: text('from_currency').notNull(),
  toCurrency: text('to_currency').notNull(),
  /** SPOT | BUDGET | AVERAGE | REPORTING | HISTORICAL */
  rateType: text('rate_type').notNull().default('SPOT'),
  rate: numeric('rate').notNull(),
  source: text('source'),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  lockedBy: uuid('locked_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * IAS 21 — functional currency per reporting entity.
 *
 * `branchId` is null for the organization and set when a branch reports in its
 * own currency, which is what makes a consolidated group statement possible.
 */
export const entityCurrencies = pgTable('entity_currencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  functionalCurrency: text('functional_currency').notNull(),
  presentationCurrency: text('presentation_currency'),
  /** IFRS | IPSAS | SOCPA — Saudi and Yemeni reporting differ. */
  accountingStandard: text('accounting_standard').default('IFRS'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/** UN/CEFACT — a unit conversion expressed as a method, not a bare factor. */
export const unitConversions = pgTable('unit_conversions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromUnitCode: text('from_unit_code').notNull(),
  toUnitCode: text('to_unit_code').notNull(),
  /** MULTIPLY | DIVIDE | OFFSET — offset is what °C → °F requires. */
  conversionType: text('conversion_type').notNull().default('MULTIPLY'),
  factor: numeric('factor').notNull().default('1'),
  offset: numeric('offset').notNull().default('0'),
  roundingIncrement: numeric('rounding_increment'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Tax / VAT rates as reference data.
 *
 * KSA applies 15% standard VAT, Yemeni regimes differ and have changed more than
 * once, and a non-profit may hold a zero-rated or exempt registration. All three
 * are *data* here, scoped per organization, so one deployment serves tenants in
 * different jurisdictions without a code change. The effectivity window keeps a
 * historical invoice pointing at the rate that applied when it was issued.
 */
export const taxRates = pgTable('tax_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  code: text('code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  /** Percentage, e.g. 15.000 for KSA standard VAT. */
  rate: numeric('rate').notNull(),
  /** KSA | YE | SA | AE | OTHER */
  jurisdiction: text('jurisdiction'),
  isZeroRated: boolean('is_zero_rated').default(false),
  isExempt: boolean('is_exempt').default(false),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * ZATCA — the per-organization invoice counter.
 *
 * This table is what makes the Integration phase possible. The QR issued in the
 * Generation phase only proves a hash was computed; the Integration phase
 * additionally requires that
 *
 *   1. each invoice identity is a UUIDv5 derived from
 *      (organisation, issue timestamp, counter) rather than a random UUID, so
 *      the same logical invoice always has the same identity, and
 *   2. each invoice carries a TLV hash that chains to the previous one, so a
 *      deleted, reordered or skipped invoice is detectable by any auditor.
 *
 * Both need a durable, gap-free counter per (org, branch, FY, invoice type),
 * which is what this table provides.
 */
export const invoiceSequences = pgTable('invoice_sequences', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  fiscalYear: integer('fiscal_year').notNull(),
  /** STANDARD | SIMPLIFIED | CREDIT_NOTE | DEBIT_NOTE */
  invoiceType: text('invoice_type').notNull(),
  currentCounter: integer('current_counter').notNull().default(0),
  /** TLV hash of the most recently issued invoice in this sequence. */
  lastInvoiceHash: text('last_invoice_hash'),
  lastInvoiceNumber: text('last_invoice_number'),
  lastIssuedAt: timestamp('last_issued_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Accounting periods with a recorded lock — IPSAS 25.
 *
 * A period is not "closed" because a boolean says so; it is closed because a
 * closing entry exists, the closure is timestamped, and the person who did it
 * is identifiable. Re-opening is a separate, recorded act.
 */
export const accountingPeriods = pgTable('accounting_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  fiscalYearId: uuid('fiscal_year_id').references(() => fiscalYears.id).notNull(),
  periodCode: text('period_code').notNull(),    // 01 … 13
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: text('status').notNull().default('OPEN'),   // OPEN | CLOSING | CLOSED | LOCKED
  closingEntryId: uuid('closing_entry_id'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedBy: uuid('closed_by').references(() => users.id),
  reopenedAt: timestamp('reopened_at', { withTimezone: true }),
  reopenedBy: uuid('reopened_by').references(() => users.id),
  closeReason: text('close_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/** Cost centres — the unit a budget line and a P&L line must be attributable to. */
export const costCenters = pgTable('cost_centers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  code: text('code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  parentId: uuid('parent_id'),                  // hierarchical roll-up
  /** DEPARTMENT | PROGRAM | PROJECT | ACTIVITY | FUND */
  category: text('category').notNull().default('DEPARTMENT'),
  isActive: boolean('is_active').default(true),
  validFrom: timestamp('valid_from', { withTimezone: true }).defaultNow(),
  validTo: timestamp('valid_to', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Branch hierarchy — which branch is the reporting entity.
 *
 * Consolidation needs to know the head office and how far each branch rolls up,
 * otherwise a group statement double-counts inter-branch transactions.
 */
export const branchHierarchy = pgTable('branch_hierarchy', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  parentBranchId: uuid('parent_branch_id').references(() => branches.id),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  isHeadOffice: boolean('is_head_office').default(false),
  consolidationLevel: integer('consolidation_level').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Warehouse stock with lot and serial traceability.
 *
 * A stock row recording only a quantity cannot answer "which consignment batch
 * is in this pallet" — an audit question, and for medical or food aid shipments
 * a safety one. Quantities are keyed on the UN/EDIFACT Rec 20 / GS1 unit code.
 */
export const inventoryLots = pgTable('inventory_lots', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id),
  itemId: uuid('item_id').references(() => inventoryItems.id).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  batchNumber: text('batch_number'),
  serialNumber: text('serial_number'),
  manufactureDate: timestamp('manufacture_date', { withTimezone: true }),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  supplierLotRef: text('supplier_lot_ref'),
  quantityOnHand: numeric('quantity_on_hand').notNull().default('0'),
  unitCode: text('unit_code').notNull(),
  costCenterId: uuid('cost_center_id').references(() => costCenters.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
