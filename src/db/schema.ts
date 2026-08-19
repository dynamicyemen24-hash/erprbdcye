import { pgTable, serial, text, timestamp, numeric, integer, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';

// ==========================================
// 1. NEB-01: STRATEGY & PERFORMANCE OS
// ==========================================
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  website: text('website'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  country: text('country'),
  registrationNumber: text('registration_number'),
  taxNumber: text('tax_number'),
  licenseNumber: text('license_number'),
  typeCode: text('type_code').default('charity'),
  subscriptionPlan: text('subscription_plan').default('basic'),
  status: text('status').default('active'),
  settings: jsonb('settings').default({}),
  securityPolicy: jsonb('security_policy').default({}),
  securityLevel: integer('security_level').default(5),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const strategicPlans = pgTable('strategic_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  planCode: text('plan_code').notNull(),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  startYear: integer('start_year').notNull(),
  endYear: integer('end_year').notNull(),
  visionAr: text('vision_ar'),
  visionEn: text('vision_en'),
  missionAr: text('mission_ar'),
  missionEn: text('mission_en'),
  coreValues: jsonb('core_values').default([]),
  strategicPillars: jsonb('strategic_pillars').default([]),
  targetBeneficiariesCount: integer('target_beneficiaries_count').default(0),
  totalEstimatedBudgetYer: numeric('total_estimated_budget_yer').default('0'),
  overallProgressPct: numeric('overall_progress_pct').default('0'),
  status: text('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const strategicGoals = pgTable('strategic_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').references(() => strategicPlans.id),
  goalCode: text('goal_code').notNull(),
  pillarCode: text('pillar_code'),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  descriptionAr: text('description_ar'),
  targetValue: numeric('target_value'),
  currentValue: numeric('current_value').default('0'),
  weightPct: numeric('weight_pct').default('0'),
  progressPct: numeric('progress_pct').default('0'),
  status: text('status').default('ON_TRACK'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const kpiIndicators = pgTable('kpi_indicators', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  programId: uuid('program_id'),
  projectId: uuid('project_id'),
  kpiCode: text('kpi_code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  category: text('category'),
  targetValue: numeric('target_value').default('0'),
  currentValue: numeric('current_value').default('0'),
  unit: text('unit'),
  status: text('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 2. SECURITY & IDENTITY
// ==========================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  passwordHash: text('password_hash'),
  name: text('name'),
  nameAr: text('name_ar'),
  phone: text('phone'),
  imageUrl: text('image_url'),
  defaultLanguage: text('default_language').default('ar'),
  status: text('status').default('active'),
  securityLevel: integer('security_level').default(5),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const userOrgMemberships = pgTable('user_org_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  branchId: uuid('branch_id'),
  roleCode: text('role_code').default('MEMBER'),
  status: text('status').default('active'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  code: text('code').notNull(),
  nameEn: text('name_en'),
  nameAr: text('name_ar'),
  description: text('description'),
  isSystem: boolean('is_system').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 3. BRANCHES & FISCAL YEARS
// ==========================================
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  code: text('code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const fiscalYears = pgTable('fiscal_years', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  yearNumber: integer('year_number').notNull(),
  nameAr: text('name_ar').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: text('status').default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 4. NEB-03 & NEB-04: PROGRAMS & PROJECTS
// ==========================================
export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  code: text('code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  categoryCode: text('category_code'),
  budget: numeric('budget').default('0'),
  progressPercent: numeric('progress_percent').default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const programObjectives = pgTable('program_objectives', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id').references(() => programs.id),
  objectiveType: text('objective_type'),
  descriptionAr: text('description_ar').notNull(),
  descriptionEn: text('description_en'),
  targetValue: numeric('target_value'),
  currentValue: numeric('current_value'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  programId: uuid('program_id').references(() => programs.id),
  projectCode: text('project_code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  statusCode: text('status_code').default('PLANNING'),
  budget: numeric('budget').default('0'),
  progressPercent: numeric('progress_percent').default('0'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  programId: uuid('program_id'),
  projectId: uuid('project_id').references(() => projects.id),
  activityId: uuid('activity_id'),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en'),
  targetDate: timestamp('target_date'),
  completedDate: timestamp('completed_date'),
  status: text('status').default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const projectSchedules = pgTable('project_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  projectId: uuid('project_id').references(() => projects.id),
  activityId: uuid('activity_id'),
  taskNameAr: text('task_name_ar'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  progressPct: numeric('progress_pct').default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 5. NEB-05: OPERATIONS & FIELD EXECUTION (WBS)
// ==========================================
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  projectId: uuid('project_id').references(() => projects.id),
  code: text('code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  budgetAllocated: numeric('budget_allocated').default('0'),
  spentAmount: numeric('spent_amount').default('0'),
  progressPct: numeric('progress_pct').default('0'),
  statusCode: text('status_code').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const geographicAreas = pgTable('geographic_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  parentAreaId: uuid('parent_area_id'),
  areaType: text('area_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 6. NEB-06 & NEB-07: BENEFICIARIES, PARTIES & SPONSORSHIPS
// ==========================================
export const parties = pgTable('parties', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  partyType: text('party_type').notNull(), // 'BENEFICIARY' | 'DONOR' | 'VENDOR' | 'PARTNER'
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  phone: text('phone'),
  email: text('email'),
  nationalId: text('national_id'),
  address: text('address'),
  status: text('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const beneficiaries = pgTable('beneficiaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  partyId: uuid('party_id').references(() => parties.id),
  beneficiaryCode: text('beneficiary_code'),
  fullNameAr: text('full_name_ar').notNull(),
  fullNameEn: text('full_name_en'),
  gender: text('gender'),
  birthDate: timestamp('birth_date'),
  familyMembersCount: integer('family_members_count').default(1),
  vulnerabilityStatus: text('vulnerability_status'),
  governorate: text('governorate'),
  district: text('district'),
  status: text('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const sponsorships = pgTable('sponsorships', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  beneficiaryId: uuid('beneficiary_id').references(() => beneficiaries.id),
  sponsorPartyId: uuid('sponsor_party_id').references(() => parties.id),
  sponsorshipCode: text('sponsorship_code'),
  sponsorshipType: text('sponsorship_type').default('ORPHAN'),
  monthlyAmount: numeric('monthly_amount').default('0'),
  currencyCode: text('currency_code').default('YER'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: text('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const sponsorshipPayments = pgTable('sponsorship_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  sponsorshipId: uuid('sponsorship_id').references(() => sponsorships.id),
  paymentDate: timestamp('payment_date').notNull(),
  paymentAmount: numeric('payment_amount').notNull(),
  currencyCode: text('currency_code').default('YER'),
  disbursementVoucherNo: text('disbursement_voucher_no'),
  receiptConfirmedBy: text('receipt_confirmed_by'),
  status: text('status').default('COMPLETED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const volunteers = pgTable('volunteers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  partyId: uuid('party_id').references(() => parties.id),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  field: text('field'),
  hoursContributed: integer('hours_contributed').default(0),
  status: text('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 7. NEB-08: PARTNERSHIP & FUNDING OS (DONORS & GRANTS)
// ==========================================
export const donors = pgTable('donors', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  partyId: uuid('party_id').references(() => parties.id),
  donorCode: text('donor_code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  donorType: text('donor_type'), // 'INSTITUTIONAL' | 'INDIVIDUAL' | 'UN_AGENCY'
  country: text('country'),
  status: text('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const grants = pgTable('grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  donorId: uuid('donor_id').references(() => donors.id),
  projectId: uuid('project_id').references(() => projects.id),
  grantNumber: text('grant_number').notNull(),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en'),
  totalAmount: numeric('total_amount').notNull(),
  currencyCode: text('currency_code').default('USD'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: text('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 8. NEB-09: RESOURCE & ASSET OS (FIXED ASSETS & HR)
// ==========================================
export const assets = pgTable('fixed_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  assetCode: text('asset_code').notNull(),
  nameAr: text('name_ar'),
  nameEn: text('name_en'),
  category: text('category'),
  purchaseCost: numeric('purchase_cost'),
  currentValue: numeric('current_value'),
  accumulatedDepreciation: numeric('accumulated_depreciation'),
  residualValue: numeric('residual_value'),
  usefulLifeMonths: integer('useful_life_months'),
  status: text('status_code'),
  locationName: text('location_name'),
  warehouseId: text('warehouse_id'),
  projectId: text('project_id'),
  projectName: text('project_name'),
  activityId: text('activity_id'),
  assignedCustodianHr: text('assigned_custodian_hr'),
  conditionCode: text('condition_code'),
  purchaseDate: timestamp('purchase_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const assetLifecycleEvents = pgTable('asset_lifecycle_events', {
  id: serial('id').primaryKey(),
  assetId: uuid('asset_id').references(() => assets.id),
  eventType: text('event_type'),
  description: text('description'),
  cost: numeric('cost').default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  code: text('code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  location: text('location'),
  managerName: text('manager_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  itemCode: text('item_code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  category: text('category'),
  unitCode: text('unit_code'),
  unitCost: numeric('unit_cost').default('0'),
  totalQuantityOnHand: numeric('total_quantity_on_hand').default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const hrStaff = pgTable('hr_staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  employeeNumber: text('employee_number').notNull(),
  fullNameAr: text('full_name_ar').notNull(),
  fullNameEn: text('full_name_en'),
  jobTitle: text('job_title'),
  department: text('department'),
  email: text('email'),
  phone: text('phone'),
  status: text('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 9. NEB-10: FINANCE & IPSAS GENERAL LEDGER
// ==========================================
export const chartOfAccounts = pgTable('chart_of_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  accountCode: text('account_code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  accountType: text('account_type').notNull(), // 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  parentAccountId: uuid('parent_account_id'),
  level: integer('level').default(1),
  isHeader: boolean('is_header').default(false),
  isActive: boolean('is_active').default(true),
  currentBalance: numeric('current_balance').default('0'),
  currencyCode: text('currency_code').default('YER'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const currencies = pgTable('currencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  symbol: text('symbol'),
  exchangeRate: numeric('exchange_rate').default('1'),
  isBaseCurrency: boolean('is_base_currency').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  fromCurrency: text('from_currency').notNull(),
  toCurrency: text('to_currency').notNull(),
  rate: numeric('rate').notNull(),
  effectiveDate: timestamp('effective_date').defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  transactionNumber: text('transaction_number').notNull(),
  transactionDate: timestamp('transaction_date').notNull(),
  postingDate: timestamp('posting_date').defaultNow(),
  transactionType: text('transaction_type').notNull(), // 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT' | 'TRANSFER'
  description: text('description'),
  referenceNo: text('reference_no'),
  fiscalYearId: uuid('fiscal_year_id').references(() => fiscalYears.id),
  totalDebit: numeric('total_debit').default('0'),
  totalCredit: numeric('total_credit').default('0'),
  status: text('status').default('POSTED'),
  createdById: uuid('created_by_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const transactionLines = pgTable('transaction_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').references(() => transactions.id).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  lineNumber: integer('line_number').notNull(),
  accountId: uuid('account_id').references(() => chartOfAccounts.id).notNull(),
  debit: numeric('debit').default('0'),
  credit: numeric('credit').default('0'),
  currencyCode: text('currency_code').default('YER'),
  exchangeRate: numeric('exchange_rate').default('1'),
  description: text('description'),
  projectId: uuid('project_id').references(() => projects.id),
  activityId: uuid('activity_id'),
  partyId: uuid('party_id').references(() => parties.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const budgetLines = pgTable('budget_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  fiscalYearId: uuid('fiscal_year_id').references(() => fiscalYears.id),
  accountId: uuid('account_id').references(() => chartOfAccounts.id),
  projectId: uuid('project_id'),
  allocatedBudget: numeric('allocated_budget').default('0'),
  spentAmount: numeric('spent_amount').default('0'),
  currencyCode: text('currency_code').default('YER'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 10. NEB-11: KNOWLEDGE & DOCUMENT OS
// ==========================================
export const knowledgeArticles = pgTable('knowledge_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en'),
  category: text('category'),
  contentAr: text('content_ar'),
  contentEn: text('content_en'),
  authorName: text('author_name'),
  tags: jsonb('tags').default([]),
  status: text('status').default('PUBLISHED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 11. NEB-14: PROCUREMENT & TENDERS OS
// ==========================================
export const procurementTenders = pgTable('procurement_tenders', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  tenderNumber: text('tender_number').notNull(),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en'),
  projectId: uuid('project_id').references(() => projects.id),
  estimatedValue: numeric('estimated_value').default('0'),
  currencyCode: text('currency_code').default('USD'),
  submissionDeadline: timestamp('submission_deadline'),
  status: text('status').default('OPEN'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  contractNumber: text('contract_number').notNull(),
  vendorPartyId: uuid('vendor_party_id').references(() => parties.id),
  tenderId: uuid('tender_id').references(() => procurementTenders.id),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en'),
  totalValue: numeric('total_value').notNull(),
  currencyCode: text('currency_code').default('YER'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: text('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 12. NEB-15: SALES, REVENUE & FUNDRAISING OS
// ==========================================
export const donations = pgTable('donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  donorPartyId: uuid('donor_party_id').references(() => parties.id),
  campaignId: uuid('campaign_id'),
  donationNumber: text('donation_number').notNull(),
  amount: numeric('amount').notNull(),
  currencyCode: text('currency_code').default('YER'),
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  donationDate: timestamp('donation_date').defaultNow(),
  status: text('status').default('COMPLETED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 13. AUDIT & SYSTEM GOVERNANCE
// ==========================================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  userId: uuid('user_id'),
  action: text('action').notNull(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id'),
  ipAddress: text('ip_address'),
  details: jsonb('details').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

