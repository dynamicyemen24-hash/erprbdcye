/**
 * NexoraOS™ — Unified Search & Query Engine
 * NEB-12 (Integration & Digital Services) + NEB-13 (AI Intelligence) Converged Layer
 *
 * Centralized institutional search, query, and retrieval fabric across all 15 NEB domains.
 *  - Full-text Arabic + English fuzzy search with normalization
 *  - Cross-domain unified query (UnifiedSearchEngine)
 *  - Saved searches & personal query library
 *  - Smart facets & dynamic aggregations
 *  - Query analytics, audit & ranking telemetry
 *  - Sub-engines: Index, Facet, SavedSearch, Telemetry, Recommendation, NLQueryBridge
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult, AuthContext } from '../core/types';
import { paginatedQuery, auditLog } from '../core/helpers';
import logger from '../core/logger';
import { fuzzyMatchArabic, normalizeArabicText } from '../../core/utils/arabicSearch';
import { parseNaturalLanguageQuery, StructuredERPQuery } from '../../core/services/naturalLanguageQuery';

// ─── Constants & Types ─────────────────────────────────────

export type SearchableDomain =
  | 'project' | 'program' | 'activity' | 'task'
  | 'beneficiary' | 'sponsorship' | 'service_delivery'
  | 'volunteer' | 'donor' | 'grant' | 'proposal'
  | 'staff' | 'asset' | 'inventory' | 'warehouse'
  | 'account' | 'voucher' | 'invoice' | 'donation'
  | 'revenue' | 'expense' | 'tender' | 'po' | 'rfq'
  | 'document' | 'policy' | 'audit_log';

export const SEARCHABLE_DOMAINS: SearchableDomain[] = [
  'project', 'program', 'activity', 'task',
  'beneficiary', 'sponsorship', 'service_delivery',
  'volunteer', 'donor', 'grant', 'proposal',
  'staff', 'asset', 'inventory', 'warehouse',
  'account', 'voucher', 'invoice', 'donation',
  'revenue', 'expense', 'tender', 'po', 'rfq',
  'document', 'policy', 'audit_log'
];

export interface UnifiedSearchInput {
  query: string;
  domains?: SearchableDomain[]; // restrict to specific domains (empty = all)
  filters?: Record<string, any>;
  fuzzy?: boolean;        // default true
  threshold?: number;     // 0..100, default 40
  limit?: number;         // default 50
  includeHighlights?: boolean;
}

export interface UnifiedSearchHit {
  domain: SearchableDomain;
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;             // deep link inside the app
  score: number;            // 0..100
  highlights?: string[];
  meta?: Record<string, any>;
}

export interface UnifiedSearchResult {
  query: string;
  normalizedQuery: string;
  totalHits: number;
  executionMs: number;
  hits: UnifiedSearchHit[];
  facets: Record<string, Array<{ value: string; count: number }>>;
  nlIntent?: StructuredERPQuery;
}

export interface FacetRequest {
  domain: SearchableDomain;
  field: string;          // column to aggregate
  limit?: number;         // top N values
  filters?: Record<string, any>;
}

export interface SavedSearchInput {
  name: string;
  description?: string;
  query: string;
  domains?: SearchableDomain[];
  filters?: Record<string, any>;
  isPublic?: boolean;
  isPinned?: boolean;
  tags?: string[];
}

export interface SearchIndexRow {
  id: string;
  org_id: string;
  domain: SearchableDomain;
  record_id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  keywords: string | null;       // space-separated normalized tokens
  raw_search: string;            // concatenated searchable fields (lowercased, normalized)
  meta: any;
  indexed_at: Date;
  weight: number;                // 0..1, used to bias ranking
  is_active: boolean;
}

export interface SearchAnalyticsRow {
  id: string;
  org_id: string;
  user_id: string | null;
  query: string;
  normalized_query: string;
  domains_searched: string[];
  hit_count: number;
  clicked_domain: string | null;
  clicked_record_id: string | null;
  duration_ms: number;
  created_at: Date;
}

export interface RecommendationContext {
  userId?: string;
  orgId: string;
  recentQueries?: string[];
  recentDomains?: SearchableDomain[];
  currentRecord?: { domain: SearchableDomain; id: string };
}

// ─── SQL snippets (re-used across engines) ───────────────

const SEARCHABLE_TABLES: Record<SearchableDomain, {
  table: string;
  title: string[];
  subtitle?: string[];
  description?: string[];
  url: string;          // router URL prefix
  filterable?: string[]; // columns usable as facets
  has_org_id?: boolean;
}> = {
  project:            { table: 'projects',              title: ['name_ar', 'name_en', 'project_code'], url: '/projects',           has_org_id: true,  filterable: ['status_code', 'category_code'] },
  program:            { table: 'programs',              title: ['name_ar', 'name_en', 'code'],         url: '/portfolio/programs', has_org_id: true },
  activity:           { table: 'activities',            title: ['name_ar', 'name_en'],                  url: '/operations/activities', has_org_id: true, filterable: ['status_code'] },
  task:               { table: 'project_tasks',         title: ['title_ar', 'title_en'],                url: '/operations/tasks',  has_org_id: true, filterable: ['status', 'priority'] },
  beneficiary:        { table: 'beneficiaries',         title: ['full_name_ar', 'full_name_en', 'beneficiary_code'], url: '/beneficiaries', has_org_id: true, filterable: ['governorate', 'district'] },
  sponsorship:        { table: 'sponsorships',          title: ['sponsorship_code'],                     url: '/sponsorships',     has_org_id: true, filterable: ['status'] },
  service_delivery:   { table: 'service_deliveries',    title: ['delivery_code', 'service_type'],       url: '/service-delivery', has_org_id: true },
  volunteer:          { table: 'volunteers',            title: ['name', 'email'],                        url: '/community/volunteers', has_org_id: true, filterable: ['field', 'status'] },
  donor:              { table: 'donors',                title: ['name_ar', 'name_en', 'donor_code'],    url: '/funding/donors',  has_org_id: true, filterable: ['donor_type', 'country'] },
  grant:              { table: 'grants',               title: ['title_ar', 'title_en', 'grant_number'], url: '/funding/grants',  has_org_id: true, filterable: ['status'] },
  proposal:           { table: 'funding_proposals',     title: ['title_ar', 'title_en', 'proposal_number'], url: '/funding/proposals', has_org_id: true },
  staff:              { table: 'hr_staff',              title: ['full_name_ar', 'full_name_en', 'employee_number'], url: '/hr/staff', has_org_id: true, filterable: ['department', 'status'] },
  asset:              { table: 'assets',                title: ['name_ar', 'name_en', 'asset_code'],    url: '/assets',          has_org_id: true, filterable: ['status', 'category'] },
  inventory:          { table: 'inventory_items',       title: ['name_ar', 'name_en', 'sku'],            url: '/inventory/items', has_org_id: true },
  warehouse:          { table: 'warehouses',            title: ['name_ar', 'name_en', 'code'],           url: '/inventory/warehouses', has_org_id: true },
  account:            { table: 'chart_of_accounts',     title: ['name_ar', 'name_en', 'account_code'],   url: '/finance/coa',     has_org_id: true, filterable: ['account_type'] },
  voucher:            { table: 'journal_vouchers',      title: ['voucher_number', 'description'],        url: '/finance/vouchers', has_org_id: true, filterable: ['status', 'voucher_type'] },
  invoice:            { table: 'sales_invoices',        title: ['invoice_number', 'description'],        url: '/sales/invoices',  has_org_id: true, filterable: ['payment_status'] },
  donation:           { table: 'donations',             title: ['donation_number', 'donor_name'],        url: '/funding/donations', has_org_id: true, filterable: ['payment_method'] },
  revenue:            { table: 'revenue_records',       title: ['record_number', 'description'],         url: '/finance/revenue', has_org_id: true, filterable: ['status'] },
  expense:            { table: 'expense_records',       title: ['record_number', 'description'],         url: '/finance/expense', has_org_id: true, filterable: ['status', 'category_id'] },
  tender:             { table: 'procurement_tenders',   title: ['title_ar', 'title_en', 'tender_number'], url: '/procurement/tenders', has_org_id: true, filterable: ['status'] },
  po:                 { table: 'purchase_orders',       title: ['po_number', 'description'],             url: '/procurement/pos',  has_org_id: true, filterable: ['status'] },
  rfq:                { table: 'procurement_tenders',   title: ['title_ar', 'tender_number'],            url: '/procurement/rfqs', has_org_id: true },
  document:           { table: 'knowledge_articles',    title: ['title_ar', 'title_en'],                 url: '/knowledge',       has_org_id: true, filterable: ['category'] },
  policy:             { table: 'policies',              title: ['title_ar', 'title_en', 'policy_code'],  url: '/knowledge/policies', has_org_id: true },
  audit_log:          { table: 'audit_logs',            title: ['action', 'table_name'],                 url: '/audit',           has_org_id: true, filterable: ['action'] }
};

// ─── 1. Sub-Engine: SearchIndexEngine ─────────────────────

export class SearchIndexEngine {
  /**
   * Index a single record from a given domain into the search_index table.
   * Builds title, subtitle, description, keywords, and raw_search fields.
   */
  static async indexRecord(
    orgId: string,
    domain: SearchableDomain,
    recordId: string,
    weight: number = 0.5
  ): Promise<{ indexed: boolean; id?: string }> {
    const cfg = SEARCHABLE_TABLES[domain];
    if (!cfg) return { indexed: false };

    try {
      // Build dynamic select for the record
      const titleCols = cfg.title.map(c => `COALESCE(${c}, '') AS "${c}"`).join(', ');
      const subtitleCol = cfg.subtitle?.[0] ? `COALESCE(${cfg.subtitle[0]}, '') AS _subtitle` : `''::text AS _subtitle`;
      const descCol = cfg.description?.[0] ? `COALESCE(${cfg.description[0]}, '') AS _description` : `''::text AS _description`;

      // We try to pull a few common additional columns for meta
      const metaCols = `id AS _id,
                         COALESCE(status_code, status, '') AS _status,
                         COALESCE(governorate, '') AS _governorate,
                         COALESCE(category_code, account_type, donor_type, '') AS _category,
                         COALESCE(created_at, NOW()) AS _created_at`;

      const orgFilter = cfg.has_org_id ? 'AND organization_id = $2' : '';
      const rec = await queryOne<any>(
        `SELECT ${titleCols}, ${subtitleCol}, ${descCol}, ${metaCols}
         FROM ${cfg.table} WHERE id = $1 ${orgFilter} LIMIT 1`,
        cfg.has_org_id ? [recordId, orgId] : [recordId]
      );
      if (!rec) return { indexed: false };

      // Compose title & searchable text
      const title = cfg.title.map(c => rec[c]).filter(Boolean).join(' • ');
      const subtitle = rec._subtitle || null;
      const description = rec._description || null;
      const raw = [title, subtitle || '', description || ''].join(' ').toLowerCase();
      const normalized = normalizeArabicText(raw);
      const keywords = normalized.split(/\s+/).filter(t => t.length > 2).slice(0, 60).join(' ');

      const meta = {
        status: rec._status,
        governorate: rec._governorate,
        category: rec._category,
        created_at: rec._created_at,
        url: `${cfg.url}/${recordId}`
      };

      // Upsert into search_index
      const upsertRes = await queryOne<{ id: string }>(
        `INSERT INTO search_index
           (org_id, domain, record_id, title, subtitle, description, keywords, raw_search, meta, weight, is_active, indexed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true, NOW())
         ON CONFLICT (org_id, domain, record_id) DO UPDATE SET
           title = EXCLUDED.title,
           subtitle = EXCLUDED.subtitle,
           description = EXCLUDED.description,
           keywords = EXCLUDED.keywords,
           raw_search = EXCLUDED.raw_search,
           meta = EXCLUDED.meta,
           weight = EXCLUDED.weight,
           is_active = true,
           indexed_at = NOW()
         RETURNING id`,
        [orgId, domain, recordId, title, subtitle, description, keywords, raw, JSON.stringify(meta), weight]
      );

      return { indexed: true, id: upsertRes?.id };
    } catch (err: any) {
      logger.warn(`[SearchIndex] Failed to index ${domain}:${recordId}: ${err.message}`, { context: 'search' });
      return { indexed: false };
    }
  }

  /** Bulk re-index an entire org across the top N most critical domains. */
  static async reindexOrg(orgId: string, domains: SearchableDomain[] = ['project','beneficiary','donor','grant','staff','asset','voucher']): Promise<{ indexed: number; failed: number }> {
    let indexed = 0; let failed = 0;
    for (const d of domains) {
      try {
        const cfg = SEARCHABLE_TABLES[d];
        if (!cfg) continue;
        const orgFilter = cfg.has_org_id ? 'AND organization_id = $2' : '';
        const ids = await queryMany<{ id: string }>(`SELECT id FROM ${cfg.table} WHERE deleted_at IS NULL ${orgFilter} LIMIT 1000`, cfg.has_org_id ? [orgId] : []);
        for (const r of ids) {
          const ok = await this.indexRecord(orgId, d, r.id);
          if (ok.indexed) indexed++; else failed++;
        }
      } catch (err: any) {
        logger.warn(`[SearchIndex] reindex ${d} failed: ${err.message}`, { context: 'search' });
        failed++;
      }
    }
    return { indexed, failed };
  }

  /** Deactivate index entry without deleting (soft archive). */
  static async deactivate(orgId: string, domain: SearchableDomain, recordId: string): Promise<void> {
    await query(`UPDATE search_index SET is_active = false WHERE org_id = $1 AND domain = $2 AND record_id = $3`, [orgId, domain, recordId]);
  }
}

// ─── 2. Sub-Engine: UnifiedSearchEngine ───────────────────

export class UnifiedSearchEngine {
  /**
   * Performs an institutional unified search across all (or a subset of) domains.
   * Strategy:
   *   1. Try the persisted search_index (fast, pre-normalized).
   *   2. Fallback to live SQL ILIKE for any domain that returns zero hits
   *      in the index (graceful degradation).
   *   3. Apply fuzzy ranking if hits < threshold.
   */
  static async search(orgId: string, input: UnifiedSearchInput): Promise<UnifiedSearchResult> {
    const start = Date.now();
    const q = (input.query || '').trim();
    const normalized = normalizeArabicText(q);
    const fuzzy = input.fuzzy !== false;
    const threshold = input.threshold ?? 40;
    const limit = Math.min(input.limit ?? 50, 200);
    const domains = (input.domains && input.domains.length > 0) ? input.domains : SEARCHABLE_DOMAINS;
    const filters = input.filters || {};
    const includeHighlights = input.includeHighlights !== false;

    if (!q || q.length < 2) {
      return { query: q, normalizedQuery: normalized, totalHits: 0, executionMs: 0, hits: [], facets: {} };
    }

    // Optional natural-language intent extraction
    let nlIntent: StructuredERPQuery | undefined;
    try {
      nlIntent = parseNaturalLanguageQuery(q);
      // If NL parser identified a target entity, restrict the search domain unless user already specified domains
      if (nlIntent.targetEntity && (!input.domains || input.domains.length === 0)) {
        const entityMap: Record<string, SearchableDomain> = {
          voucher: 'voucher', invoice: 'invoice', project: 'project', program: 'program',
          beneficiary: 'beneficiary', sponsorship: 'sponsorship', activity: 'activity',
          task: 'task', account: 'account'
        };
        const mapped = entityMap[nlIntent.targetEntity];
        if (mapped) {
          domains.length = 0;
          domains.push(mapped);
        }
      }
    } catch { /* ignore */ }

    // 1. Search the persisted search_index
    const hits: UnifiedSearchHit[] = [];
    const tokens = normalized.split(/\s+/).filter(t => t.length > 1);
    if (tokens.length === 0) {
      return { query: q, normalizedQuery: normalized, totalHits: 0, executionMs: Date.now() - start, hits: [], facets: {}, nlIntent };
    }

    const idxHits = await queryMany<SearchIndexRow & { score: number }>(
      `WITH q AS (SELECT $2::text AS normq)
       SELECT si.*,
              (
                CASE WHEN LOWER(si.title) LIKE '%' || LOWER($1) || '%' THEN 30 ELSE 0 END
              + CASE WHEN LOWER(si.subtitle) LIKE '%' || LOWER($1) || '%' THEN 15 ELSE 0 END
              + CASE WHEN si.keywords ILIKE '%' || $2 || '%' THEN 25 ELSE 0 END
              + (LENGTH(si.raw_search) - LENGTH(REPLACE(si.raw_search, LOWER($1), ''))) * 4
              + si.weight * 10
              )::int AS score
       FROM search_index si
       WHERE si.org_id = $3
         AND si.is_active = true
         AND ($4::text[] IS NULL OR si.domain = ANY($4))
         AND (
           si.title ILIKE '%' || $1 || '%'
           OR si.subtitle ILIKE '%' || $1 || '%'
           OR si.description ILIKE '%' || $1 || '%'
           OR si.raw_search ILIKE '%' || $1 || '%'
           OR si.keywords ILIKE '%' || $2 || '%'
         )
       ORDER BY score DESC
       LIMIT $5`,
      [q, normalized, orgId, domains, limit * 2]
    );

    for (const row of idxHits) {
      let score = row.score;
      // Fuzzy re-ranking on Arabic-normalized text
      if (fuzzy && score < threshold) {
        const f = fuzzyMatchArabic(normalized, normalizeArabicText(row.title + ' ' + (row.subtitle || '') + ' ' + (row.description || '')));
        if (f > score) score = f;
      }
      if (score < threshold) continue;
      hits.push({
        domain: row.domain,
        id: row.record_id,
        title: row.title,
        subtitle: row.subtitle || undefined,
        description: row.description || undefined,
        url: row.meta?.url,
        score: Math.min(100, score),
        highlights: includeHighlights ? extractHighlights(q, row.title + ' ' + (row.subtitle || '') + ' ' + (row.description || '')) : undefined,
        meta: row.meta || undefined
      });
    }

    // 2. Live fallback for missing index entries (best-effort, capped)
    if (hits.length < 5) {
      const liveHits = await this.liveSearch(orgId, q, normalized, domains, filters, limit);
      for (const h of liveHits) {
        if (!hits.find(x => x.domain === h.domain && x.id === h.id)) {
          hits.push(h);
        }
      }
    }

    // Apply additional filters in-memory (post-filtering for facet style filters)
    const filtered = applyInMemoryFilters(hits, filters);

    // 3. Compute facets from the meta of returned hits
    const facets = computeFacets(filtered);

    const result: UnifiedSearchResult = {
      query: q,
      normalizedQuery: normalized,
      totalHits: filtered.length,
      executionMs: Date.now() - start,
      hits: filtered.slice(0, limit),
      facets,
      nlIntent
    };

    // 4. Fire-and-forget analytics
    SearchTelemetryEngine.record(orgId, result, null).catch(() => { /* swallow */ });

    return result;
  }

  /**
   * Live SQL search against a domain's table. Used as a fallback when the
   * persistent search_index is empty or stale.
   */
  private static async liveSearch(
    orgId: string,
    q: string,
    normalized: string,
    domains: SearchableDomain[],
    filters: Record<string, any>,
    limit: number
  ): Promise<UnifiedSearchHit[]> {
    const hits: UnifiedSearchHit[] = [];
    for (const d of domains) {
      const cfg = SEARCHABLE_TABLES[d];
      if (!cfg) continue;
      try {
        const orgFilter = cfg.has_org_id ? 'AND organization_id = $3' : '';
        const titleExpr = cfg.title.map(c => `COALESCE(${c}, '')`).join(" || ' ' || ");
        const subExpr = cfg.subtitle?.[0] ? `COALESCE(${cfg.subtitle[0]}, '')` : `''`;

        const sql = `
          SELECT id, ${titleExpr} AS _title, ${subExpr} AS _subtitle
          FROM ${cfg.table}
          WHERE deleted_at IS NULL
            AND (${titleExpr} ILIKE $1 OR ${subExpr} ILIKE $1)
            ${orgFilter}
          LIMIT 5
        `;
        const params: any[] = [`%${q}%`];
        if (cfg.has_org_id) params.push(orgId);
        const rows = await queryMany<any>(sql, params);
        for (const r of rows) {
          const f = fuzzyMatchArabic(normalized, normalizeArabicText(r._title + ' ' + (r._subtitle || '')));
          hits.push({
            domain: d,
            id: r.id,
            title: r._title,
            subtitle: r._subtitle || undefined,
            url: `${cfg.url}/${r.id}`,
            score: Math.max(50, f),
            highlights: extractHighlights(q, r._title + ' ' + (r._subtitle || ''))
          });
        }
        if (hits.length >= limit) break;
      } catch (err: any) {
        // Table might not exist for some domains — silently skip
        logger.debug(`[UnifiedSearch] liveSearch skip ${d}: ${err.message}`, { context: 'search' });
      }
    }
    return hits;
  }

  /**
   * Suggest (autocomplete) — short, fast version of search.
   */
  static async suggest(orgId: string, q: string, limit: number = 8): Promise<UnifiedSearchHit[]> {
    if (!q || q.length < 2) return [];
    const res = await this.search(orgId, { query: q, limit, threshold: 30, includeHighlights: false });
    return res.hits.slice(0, limit);
  }
}

// ─── 3. Sub-Engine: FacetEngine ───────────────────────────

export class FacetEngine {
  /** Compute dynamic facets (top values for a field within a domain) */
  static async getFacets(orgId: string, requests: FacetRequest[]): Promise<Record<string, Array<{ value: string; count: number }>>> {
    const out: Record<string, Array<{ value: string; count: number }>> = {};
    for (const req of requests) {
      const cfg = SEARCHABLE_TABLES[req.domain];
      if (!cfg) { out[`${req.domain}.${req.field}`] = []; continue; }
      try {
        const orgFilter = cfg.has_org_id ? `AND organization_id = $2` : '';
        const params: any[] = [req.limit ?? 10];
        if (cfg.has_org_id) params.push(orgId);
        const sql = `
          SELECT COALESCE(${req.field}, '(blank)')::text AS value, COUNT(*)::int AS count
          FROM ${cfg.table}
          WHERE deleted_at IS NULL ${orgFilter}
          GROUP BY ${req.field}
          ORDER BY count DESC
          LIMIT $1
        `;
        const rows = await queryMany<{ value: string; count: number }>(sql, params);
        out[`${req.domain}.${req.field}`] = rows;
      } catch (err: any) {
        logger.warn(`[Facets] ${req.domain}.${req.field} failed: ${err.message}`, { context: 'search' });
        out[`${req.domain}.${req.field}`] = [];
      }
    }
    return out;
  }

  /** Compute global facets from the persisted search_index (much faster). */
  static async getIndexFacets(orgId: string): Promise<{
    byDomain: Array<{ value: string; count: number }>;
    byStatus: Array<{ value: string; count: number }>;
    byGovernorate: Array<{ value: string; count: number }>;
  }> {
    const byDomain = await queryMany<{ value: string; count: number }>(
      `SELECT domain::text AS value, COUNT(*)::int AS count FROM search_index
       WHERE org_id = $1 AND is_active = true GROUP BY domain ORDER BY count DESC LIMIT 30`, [orgId]
    );
    const byStatus = await queryMany<{ value: string; count: number }>(
      `SELECT COALESCE(meta->>'status', '(none)') AS value, COUNT(*)::int AS count FROM search_index
       WHERE org_id = $1 AND is_active = true GROUP BY meta->>'status' ORDER BY count DESC LIMIT 20`, [orgId]
    );
    const byGovernorate = await queryMany<{ value: string; count: number }>(
      `SELECT COALESCE(meta->>'governorate', '(none)') AS value, COUNT(*)::int AS count FROM search_index
       WHERE org_id = $1 AND is_active = true AND meta->>'governorate' IS NOT NULL
       GROUP BY meta->>'governorate' ORDER BY count DESC LIMIT 25`, [orgId]
    );
    return { byDomain, byStatus, byGovernorate };
  }
}

// ─── 4. Sub-Engine: SavedSearchEngine ─────────────────────

export class SavedSearchEngine {
  static async list(orgId: string, userId: string, opts: { includePublic?: boolean } = {}): Promise<any[]> {
    const where = opts.includePublic
      ? 'WHERE org_id = $1 AND (user_id = $2 OR is_public = true)'
      : 'WHERE org_id = $1 AND user_id = $2';
    return await queryMany(
      `SELECT * FROM saved_searches ${where} ORDER BY is_pinned DESC, last_used_at DESC NULLS LAST, created_at DESC`,
      opts.includePublic ? [orgId, userId] : [orgId, userId]
    );
  }

  static async create(orgId: string, userId: string, input: SavedSearchInput): Promise<any> {
    const res = await queryOne(
      `INSERT INTO saved_searches
         (org_id, user_id, name, description, query, domains, filters, is_public, is_pinned, tags, use_count, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0, NOW())
       RETURNING *`,
      [
        orgId, userId, input.name, input.description || null, input.query,
        input.domains || [], JSON.stringify(input.filters || {}),
        input.isPublic ?? false, input.isPinned ?? false, input.tags || []
      ]
    );
    if (res) {
      try {
        await auditLog({
          organizationId: orgId,
          userId,
          action: 'CREATE' as any,
          tableName: 'saved_searches',
          recordId: res.id,
          details: input
        });
      } catch { /* ignore */ }
    }
    return res;
  }

  static async update(orgId: string, userId: string, id: string, input: Partial<SavedSearchInput>): Promise<any> {
    const sets: string[] = []; const vals: any[] = []; let idx = 1;
    if (input.name !== undefined) { sets.push(`name = $${idx++}`); vals.push(input.name); }
    if (input.description !== undefined) { sets.push(`description = $${idx++}`); vals.push(input.description); }
    if (input.query !== undefined) { sets.push(`query = $${idx++}`); vals.push(input.query); }
    if (input.domains !== undefined) { sets.push(`domains = $${idx++}`); vals.push(input.domains); }
    if (input.filters !== undefined) { sets.push(`filters = $${idx++}`); vals.push(JSON.stringify(input.filters)); }
    if (input.isPublic !== undefined) { sets.push(`is_public = $${idx++}`); vals.push(input.isPublic); }
    if (input.isPinned !== undefined) { sets.push(`is_pinned = $${idx++}`); vals.push(input.isPinned); }
    if (input.tags !== undefined) { sets.push(`tags = $${idx++}`); vals.push(input.tags); }
    sets.push(`updated_at = NOW()`);
    vals.push(id, orgId, userId);
    return await queryOne(
      `UPDATE saved_searches SET ${sets.join(', ')} WHERE id = $${idx++} AND org_id = $${idx++} AND user_id = $${idx++} RETURNING *`,
      vals
    );
  }

  static async touch(orgId: string, id: string): Promise<void> {
    await query(`UPDATE saved_searches SET use_count = use_count + 1, last_used_at = NOW() WHERE id = $1 AND org_id = $2`, [id, orgId]);
  }

  static async delete(orgId: string, userId: string, id: string): Promise<boolean> {
    const r = await query(`DELETE FROM saved_searches WHERE id = $1 AND org_id = $2 AND user_id = $3`, [id, orgId, userId]);
    return (r.rowCount || 0) > 0;
  }
}

// ─── 5. Sub-Engine: SearchTelemetryEngine ─────────────────

export class SearchTelemetryEngine {
  static async record(orgId: string, result: UnifiedSearchResult, clickedRecordId: string | null, userId: string | null = null): Promise<void> {
    try {
      await query(
        `INSERT INTO search_analytics
           (org_id, user_id, query, normalized_query, domains_searched, hit_count, clicked_record_id, duration_ms, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())`,
        [orgId, userId, result.query, result.normalizedQuery, result.hits.map(h => h.domain), result.totalHits, clickedRecordId, result.executionMs]
      );
    } catch { /* never break search on telemetry failure */ }
  }

  static async recordClick(orgId: string, userId: string, rawQuery: string, domain: SearchableDomain, recordId: string): Promise<void> {
    try {
      const norm = normalizeArabicText(rawQuery);
      await query(
        `UPDATE search_analytics
            SET clicked_domain = $4, clicked_record_id = $5
          WHERE id = (
            SELECT id FROM search_analytics
            WHERE org_id = $1 AND user_id = $2 AND normalized_query = $3
            ORDER BY created_at DESC LIMIT 1
          )`,
        [orgId, userId, norm, domain, recordId]
      );
    } catch { /* ignore */ }
  }

  static async topQueries(orgId: string, days: number = 30, limit: number = 20): Promise<Array<{ query: string; count: number }>> {
    return await queryMany(
      `SELECT query, COUNT(*)::int AS count
       FROM search_analytics
       WHERE org_id = $1 AND created_at > NOW() - ($2 || ' days')::interval
       GROUP BY query ORDER BY count DESC LIMIT $3`,
      [orgId, days, limit]
    );
  }

  static async slowQueries(orgId: string, thresholdMs: number = 500, limit: number = 20): Promise<any[]> {
    return await queryMany(
      `SELECT query, AVG(duration_ms)::int AS avg_ms, COUNT(*)::int AS cnt
       FROM search_analytics
       WHERE org_id = $1 AND duration_ms > $2
       GROUP BY query ORDER BY avg_ms DESC LIMIT $3`,
      [orgId, thresholdMs, limit]
    );
  }

  static async zeroHitQueries(orgId: string, days: number = 30, limit: number = 20): Promise<Array<{ query: string; count: number }>> {
    return await queryMany(
      `SELECT query, COUNT(*)::int AS count FROM search_analytics
       WHERE org_id = $1 AND created_at > NOW() - ($2 || ' days')::interval AND hit_count = 0
       GROUP BY query ORDER BY count DESC LIMIT $3`,
      [orgId, days, limit]
    );
  }

  static async orgStats(orgId: string, days: number = 30): Promise<{
    totalSearches: number;
    uniqueUsers: number;
    avgDurationMs: number;
    avgHits: number;
    zeroHitRate: number;
    clickThroughRate: number;
  }> {
    const row = await queryOne<any>(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(DISTINCT user_id)::int AS users,
         COALESCE(AVG(duration_ms), 0)::int AS avg_dur,
         COALESCE(AVG(hit_count), 0)::int AS avg_hits,
         COUNT(*) FILTER (WHERE hit_count = 0)::int AS zero_hits,
         COUNT(*) FILTER (WHERE clicked_record_id IS NOT NULL)::int AS clicks
       FROM search_analytics
       WHERE org_id = $1 AND created_at > NOW() - ($2 || ' days')::interval`,
      [orgId, days]
    );
    const total = row?.total || 0;
    return {
      totalSearches: total,
      uniqueUsers: row?.users || 0,
      avgDurationMs: row?.avg_dur || 0,
      avgHits: row?.avg_hits || 0,
      zeroHitRate: total > 0 ? (row.zero_hits || 0) / total : 0,
      clickThroughRate: total > 0 ? (row.clicks || 0) / total : 0
    };
  }
}

// ─── 6. Sub-Engine: RecommendationEngine ─────────────────

export class RecommendationEngine {
  /** Recommend top related records across domains based on a given record. */
  static async related(orgId: string, domain: SearchableDomain, recordId: string, limit: number = 10): Promise<UnifiedSearchHit[]> {
    const seed = await queryOne<SearchIndexRow>(
      `SELECT * FROM search_index WHERE org_id = $1 AND domain = $2 AND record_id = $3 AND is_active = true`,
      [orgId, domain, recordId]
    );
    if (!seed) return [];

    // Use seed keywords as a query
    const tokens = (seed.keywords || '').split(/\s+/).filter(t => t.length > 2).slice(0, 6).join(' ');
    if (!tokens) return [];

    const result = await UnifiedSearchEngine.search(orgId, {
      query: tokens,
      limit,
      threshold: 35,
      includeHighlights: false
    });

    // Filter out the seed itself
    return result.hits.filter(h => !(h.domain === domain && h.id === recordId));
  }

  /** Recommend based on the user's most-clicked domains and queries. */
  static async forYou(orgId: string, userId: string, limit: number = 10): Promise<UnifiedSearchHit[]> {
    const top = await queryMany<{ query: string; cnt: number }>(
      `SELECT query, COUNT(*)::int AS cnt FROM search_analytics
       WHERE org_id = $1 AND user_id = $2 AND clicked_record_id IS NOT NULL
         AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY query ORDER BY cnt DESC LIMIT 5`,
      [orgId, userId]
    );
    const aggregated: UnifiedSearchHit[] = [];
    const seen = new Set<string>();
    for (const t of top) {
      const r = await UnifiedSearchEngine.search(orgId, { query: t.query, limit: 5, threshold: 40, includeHighlights: false });
      for (const h of r.hits) {
        const key = `${h.domain}:${h.id}`;
        if (!seen.has(key)) { seen.add(key); aggregated.push(h); }
      }
    }
    return aggregated.slice(0, limit);
  }

  /** Trending searches across the org in the last N days. */
  static async trending(orgId: string, days: number = 7, limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    return await queryMany(
      `SELECT query, COUNT(*)::int AS count
       FROM search_analytics
       WHERE org_id = $1 AND created_at > NOW() - ($2 || ' days')::interval
         AND hit_count > 0
       GROUP BY query HAVING COUNT(*) > 1
       ORDER BY count DESC LIMIT $3`,
      [orgId, days, limit]
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────

function extractHighlights(query: string, text: string): string[] {
  if (!text) return [];
  const tokens = query.split(/\s+/).filter(t => t.length > 1);
  const out: string[] = [];
  for (const t of tokens.slice(0, 5)) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(t.toLowerCase());
    if (idx >= 0) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + t.length + 20);
      out.push((start > 0 ? '…' : '') + text.substring(start, end) + (end < text.length ? '…' : ''));
    }
  }
  return out;
}

function applyInMemoryFilters(hits: UnifiedSearchHit[], filters: Record<string, any>): UnifiedSearchHit[] {
  if (!filters || Object.keys(filters).length === 0) return hits;
  return hits.filter(h => {
    for (const [k, v] of Object.entries(filters)) {
      if (k === 'domain' && h.domain !== v) return false;
      if (k === 'minScore' && h.score < Number(v)) return false;
      if (k === 'status' && h.meta?.status !== v) return false;
      if (k === 'governorate' && h.meta?.governorate !== v) return false;
    }
    return true;
  });
}

function computeFacets(hits: UnifiedSearchHit[]): Record<string, Array<{ value: string; count: number }>> {
  const domains: Record<string, number> = {};
  const statuses: Record<string, number> = {};
  for (const h of hits) {
    domains[h.domain] = (domains[h.domain] || 0) + 1;
    const st = h.meta?.status;
    if (st) statuses[st] = (statuses[st] || 0) + 1;
  }
  const toArr = (m: Record<string, number>) => Object.entries(m).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
  return { domain: toArr(domains), status: toArr(statuses) };
}

// ─── Public façade used by routes ─────────────────────────

export const SearchEngine = {
  index: SearchIndexEngine,
  unified: UnifiedSearchEngine,
  facets: FacetEngine,
  saved: SavedSearchEngine,
  telemetry: SearchTelemetryEngine,
  recommend: RecommendationEngine
};

export default SearchEngine;
