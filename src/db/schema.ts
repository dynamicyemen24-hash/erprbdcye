import { pgTable, serial, text, timestamp, numeric, integer, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';

// 1. ORGANIZATIONS (NEB-01 / Core Multi-Tenancy)
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

// 2. USERS & MEMBERSHIPS (Security & Identity)
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

// 3. BRANCHES & FISCAL YEARS
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
  status: text('status').default('open'), // 'open' | 'closing' | 'closed'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 4. ASSETS & LIFECYCLE (NEB-09)
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
  status: text('status_code'),
  locationName: text('location_name'),
  purchaseDate: timestamp('purchase_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const assetLifecycleEvents = pgTable('asset_lifecycle_events', {
  id: serial('id').primaryKey(),
  assetId: uuid('asset_id').references(() => assets.id),
  eventType: text('event_type'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 5. PROGRAMS & PROJECTS (NEB-03 & NEB-04)
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// 6. AUDIT LOGS (Compliance & Security)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  userId: uuid('user_id'),
  action: text('action').notNull(), // 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'
  tableName: text('table_name').notNull(),
  recordId: text('record_id'),
  ipAddress: text('ip_address'),
  details: jsonb('details').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
