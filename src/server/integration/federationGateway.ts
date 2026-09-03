// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Hyper-Scale Integration Mesh™ (NEB-12)
// GraphQL Federation Gateway — Unified Query Interface
// Provides single GraphQL endpoint across all NEB domains
// ═══════════════════════════════════════════════════════════════════

import { getPool } from '../core/database';
import logger from '../core/logger';

/** Federation configuration */
export interface FederationConfig {
  gatewayId: string;
  enableQueryPlan: boolean;
  enablePersistedQueries: boolean;
  rateLimits: {
    complexity: number;
    depth: number;
    requestsPerMinute: number;
  };
  securityPolicy: {
    requireAuthentication: boolean;
    allowedIntrospectionRoles: string[];
  };
}

/** Query args */
export interface QueryArgs {
  limit?: number;
  offset?: number;
  id?: string;
  input?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Query context */
export interface QueryContext {
  tenantId: string;
  userId: string;
  organizationId: string;
  roles: string[];
  requestId: string;
}

/** Domain resolvers */
export interface DomainResolvers {
  Query: Record<string, (args: QueryArgs, context: QueryContext) => Promise<unknown>>;
  Mutation?: Record<string, (args: QueryArgs, context: QueryContext) => Promise<unknown>>;
}

/** Unified query structure */
export interface UnifiedQuery {
  operation: 'query' | 'mutation';
  entity: string;
  fields?: string[];
  filters?: Record<string, unknown>;
  pagination?: { limit: number; offset: number };
  sort?: { field: string; direction: 'asc' | 'desc' };
}

/** Query result */
export interface QueryResult<T = unknown> {
  data: T | null;
  meta: {
    total: number;
    limit: number;
    offset: number;
    executionMs: number;
  };
  errors?: QueryError[];
}

export interface QueryError {
  code: string;
  message: string;
  path?: string;
}

/**
 * GraphQL Federation Gateway — Single entry point for all NEB domains
 */
export class GraphQLFederationGateway {
  private config: FederationConfig;
  private registeredDomains: Map<string, DomainResolvers> = new Map();
  private pool: ReturnType<typeof getPool>;

  constructor(config: FederationConfig) {
    this.config = config;
    this.pool = getPool();
    this.registerCoreDomains();
  }

  /** Register built-in domain resolvers */
  private registerCoreDomains(): void {
    // NEB-01: Strategy & Performance
    this.registerDomain('NEB-01', {
      Query: {
        strategicPlans: async (args, ctx) => {
          const limit = args.limit || 50;
          const offset = args.offset || 0;
          const result = await this.pool.query(
            `SELECT * FROM strategic_plans WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [ctx.organizationId, limit, offset]
          );
          return result.rows;
        },
        okrs: async (args, ctx) => {
          const result = await this.pool.query(
            `SELECT * FROM okrs WHERE organization_id = $1 AND status = 'active'`,
            [ctx.organizationId]
          );
          return result.rows;
        },
        kpis: async (args, ctx) => {
          const result = await this.pool.query(
            `SELECT * FROM kpis WHERE organization_id = $1`,
            [ctx.organizationId]
          );
          return result.rows;
        },
      },
    });

    // NEB-03: Programs
    this.registerDomain('NEB-03', {
      Query: {
        programs: async (args, ctx) => {
          const limit = args.limit || 50;
          const offset = args.offset || 0;
          let query = `SELECT * FROM programs WHERE organization_id = $1`;
          const params: unknown[] = [ctx.organizationId];
          
          if (args.status) {
            query += ` AND status = $2`;
            params.push(args.status);
          }
          
          query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
          params.push(limit, offset);
          
          const result = await this.pool.query(query, params);
          return result.rows;
        },
        programById: async (args, ctx) => {
          const result = await this.pool.query(
            `SELECT * FROM programs WHERE id = $1 AND organization_id = $2`,
            [args.id, ctx.organizationId]
          );
          return result.rows[0] || null;
        },
      },
    });

    // NEB-04: Projects
    this.registerDomain('NEB-04', {
      Query: {
        projects: async (args, ctx) => {
          const limit = args.limit || 50;
          const offset = args.offset || 0;
          let query = `SELECT * FROM projects WHERE organization_id = $1`;
          const params: unknown[] = [ctx.organizationId];
          
          if (args.programId) {
            query += ` AND program_id = $${params.length + 1}`;
            params.push(args.programId);
          }
          if (args.status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(args.status);
          }
          
          query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
          params.push(limit, offset);
          
          const result = await this.pool.query(query, params);
          return result.rows;
        },
        projectById: async (args, ctx) => {
          const result = await this.pool.query(
            `SELECT * FROM projects WHERE id = $1 AND organization_id = $2`,
            [args.id, ctx.organizationId]
          );
          return result.rows[0] || null;
        },
      },
      Mutation: {
        createProject: async (args, ctx) => {
          const input = (args.input || {}) as Record<string, unknown>;
          const result = await this.pool.query(
            `INSERT INTO projects (organization_id, name_ar, name_en, code, status, budget, program_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [ctx.organizationId, input.name_ar, input.name_en, input.code, input.status || 'active', input.budget, input.program_id]
          );
          return result.rows[0];
        },
        updateProject: async (args, ctx) => {
          const { id, input } = args as { id: string; input: Record<string, unknown> };
          const fields: string[] = [];
          const values: unknown[] = [];
          let idx = 1;
          
          for (const [key, value] of Object.entries(input)) {
            if (value !== undefined) {
              fields.push(`${key} = $${idx}`);
              values.push(value);
              idx++;
            }
          }
          
          if (fields.length === 0) return null;
          
          values.push(id, ctx.organizationId);
          const result = await this.pool.query(
            `UPDATE projects SET ${fields.join(', ')} WHERE id = $${idx} AND organization_id = $${idx + 1} RETURNING *`,
            values
          );
          return result.rows[0];
        },
      },
    });

    // NEB-06: Service Delivery
    this.registerDomain('NEB-06', {
      Query: {
        beneficiaries: async (args, ctx) => {
          const limit = args.limit || 50;
          const offset = args.offset || 0;
          let query = `SELECT * FROM beneficiaries WHERE organization_id = $1`;
          const params: unknown[] = [ctx.organizationId];
          
          if (args.projectId) {
            query += ` AND project_id = $${params.length + 1}`;
            params.push(args.projectId);
          }
          if (args.status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(args.status);
          }
          
          query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
          params.push(limit, offset);
          
          const result = await this.pool.query(query, params);
          return result.rows;
        },
        beneficiaryById: async (args, ctx) => {
          const result = await this.pool.query(
            `SELECT * FROM beneficiaries WHERE id = $1 AND organization_id = $2`,
            [args.id, ctx.organizationId]
          );
          return result.rows[0] || null;
        },
      },
      Mutation: {
        registerBeneficiary: async (args, ctx) => {
          const input = (args.input || {}) as Record<string, unknown>;
          const result = await this.pool.query(
            `INSERT INTO beneficiaries (organization_id, name_ar, national_id, gender, birth_date, phone, address, project_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [ctx.organizationId, input.name_ar, input.national_id, input.gender, input.birth_date, input.phone, input.address, input.project_id]
          );
          return result.rows[0];
        },
        updateBeneficiary: async (args, ctx) => {
          const { id, input } = args as { id: string; input: Record<string, unknown> };
          const fields: string[] = [];
          const values: unknown[] = [];
          let idx = 1;
          
          for (const [key, value] of Object.entries(input)) {
            if (value !== undefined) {
              fields.push(`${key} = $${idx}`);
              values.push(value);
              idx++;
            }
          }
          
          if (fields.length === 0) return null;
          
          values.push(id, ctx.organizationId);
          const result = await this.pool.query(
            `UPDATE beneficiaries SET ${fields.join(', ')} WHERE id = $${idx} AND organization_id = $${idx + 1} RETURNING *`,
            values
          );
          return result.rows[0];
        },
      },
    });

    // NEB-10: Finance
    this.registerDomain('NEB-10', {
      Query: {
        transactions: async (args, ctx) => {
          const limit = args.limit || 50;
          const offset = args.offset || 0;
          let query = `SELECT * FROM transactions WHERE organization_id = $1`;
          const params: unknown[] = [ctx.organizationId];
          
          if (args.fromDate) {
            query += ` AND transaction_date >= $${params.length + 1}`;
            params.push(args.fromDate);
          }
          if (args.toDate) {
            query += ` AND transaction_date <= $${params.length + 1}`;
            params.push(args.toDate);
          }
          if (args.accountId) {
            query += ` AND account_id = $${params.length + 1}`;
            params.push(args.accountId);
          }
          
          query += ` ORDER BY transaction_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
          params.push(limit, offset);
          
          const result = await this.pool.query(query, params);
          return result.rows;
        },
        journalEntries: async (args, ctx) => {
          const result = await this.pool.query(
            `SELECT * FROM journal_entries WHERE organization_id = $1 ORDER BY entry_date DESC LIMIT 50`,
            [ctx.organizationId]
          );
          return result.rows;
        },
        accounts: async (args, ctx) => {
          let query = `SELECT * FROM chart_of_accounts WHERE organization_id = $1`;
          const params: unknown[] = [ctx.organizationId];
          
          if (args.type) {
            query += ` AND account_type = $2`;
            params.push(args.type);
          }
          
          const result = await this.pool.query(query, params);
          return result.rows;
        },
      },
      Mutation: {
        postJournalEntry: async (args, ctx) => {
          const input = (args.input || {}) as Record<string, unknown>;
          const lines = (input.lines || []) as Array<Record<string, unknown>>;
          const client = await this.pool.connect();
          
          try {
            await client.query('BEGIN');
            
            const entryResult = await client.query(
              `INSERT INTO journal_entries (organization_id, entry_number, entry_date, description, total_debit, total_credit, status)
               VALUES ($1, $2, $3, $4, $5, $6, 'posted') RETURNING *`,
              [ctx.organizationId, input.entry_number, input.entry_date, input.description, input.total_debit, input.total_credit]
            );
            
            const entry = entryResult.rows[0];
            
            // Insert journal lines
            for (const line of lines) {
              await client.query(
                `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
                 VALUES ($1, $2, $3, $4, $5)`,
                [entry.id, line.account_id, line.debit || 0, line.credit || 0, line.description]
              );
            }
            
            await client.query('COMMIT');
            return entry;
          } catch (err) {
            await client.query('ROLLBACK');
            throw err;
          } finally {
            client.release();
          }
        },
      },
    });

    // NEB-15: Revenue
    this.registerDomain('NEB-15', {
      Query: {
        revenueRecords: async (args, ctx) => {
          const limit = args.limit || 50;
          const offset = args.offset || 0;
          let query = `SELECT * FROM revenue_records WHERE organization_id = $1`;
          const params: unknown[] = [ctx.organizationId];
          
          if (args.status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(args.status);
          }
          if (args.type) {
            query += ` AND revenue_type = $${params.length + 1}`;
            params.push(args.type);
          }
          
          query += ` ORDER BY revenue_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
          params.push(limit, offset);
          
          const result = await this.pool.query(query, params);
          return result.rows;
        },
        revenueStreams: async (args, ctx) => {
          const result = await this.pool.query(
            `SELECT * FROM revenue_streams WHERE organization_id = $1`,
            [ctx.organizationId]
          );
          return result.rows;
        },
      },
      Mutation: {
        createRevenueRecord: async (args, ctx) => {
          const input = (args.input || {}) as Record<string, unknown>;
          const result = await this.pool.query(
            `INSERT INTO revenue_records (organization_id, revenue_number, revenue_type, counterparty_name, project_id, amount, currency_code, revenue_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft') RETURNING *`,
            [ctx.organizationId, input.revenue_number, input.revenue_type, input.counterparty_name, input.project_id, input.amount, input.currency_code || 'YER', input.revenue_date]
          );
          return result.rows[0];
        },
        collectRevenue: async (args, ctx) => {
          const { id, amount } = args as { id: string; amount: number; method?: string };
          const result = await this.pool.query(
            `UPDATE revenue_records 
             SET collected_amount = COALESCE(collected_amount, 0) + $1,
                 status = CASE WHEN collected_amount + $1 >= amount THEN 'collected' ELSE 'partially_collected' END
             WHERE id = $2 AND organization_id = $3
             RETURNING *`,
            [amount, id, ctx.organizationId]
          );
          return result.rows[0];
        },
      },
    });

    // CROSS: Cross-domain queries
    this.registerDomain('CROSS', {
      Query: {
        dashboard: async (args, ctx) => {
          const [projectCount, beneficiaryCount, revenueSum, expenseSum] = await Promise.all([
            this.pool.query(`SELECT COUNT(*) as count FROM projects WHERE organization_id = $1`, [ctx.organizationId]),
            this.pool.query(`SELECT COUNT(*) as count FROM beneficiaries WHERE organization_id = $1`, [ctx.organizationId]),
            this.pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM revenue_records WHERE organization_id = $1`, [ctx.organizationId]),
            this.pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE organization_id = $1`, [ctx.organizationId]),
          ]);
          
          return {
            totalProjects: parseInt(projectCount.rows[0].count),
            activeProjects: parseInt(projectCount.rows[0].count),
            totalBeneficiaries: parseInt(beneficiaryCount.rows[0].count),
            totalRevenue: parseFloat(revenueSum.rows[0].total),
            totalExpenses: parseFloat(expenseSum.rows[0].total),
            netBalance: parseFloat(revenueSum.rows[0].total) - parseFloat(expenseSum.rows[0].total),
            alerts: [],
          };
        },
        search: async (args, ctx) => {
          const { query, domain } = args as { query: string; domain?: string };
          const results = [];
          
          if (!domain || domain === 'NEB-04') {
            const projects = await this.pool.query(
              `SELECT 'project' as type, id, name_ar as title, name_en as subtitle FROM projects 
               WHERE organization_id = $1 AND (name_ar ILIKE $2 OR name_en ILIKE $2 OR code ILIKE $2) LIMIT 10`,
              [ctx.organizationId, `%${query}%`]
            );
            results.push(...projects.rows.map(r => ({ ...r, domain: 'NEB-04' })));
          }
          
          if (!domain || domain === 'NEB-06') {
            const beneficiaries = await this.pool.query(
              `SELECT 'beneficiary' as type, id, name_ar as title, national_id as subtitle FROM beneficiaries 
               WHERE organization_id = $1 AND (name_ar ILIKE $2 OR national_id ILIKE $2) LIMIT 10`,
              [ctx.organizationId, `%${query}%`]
            );
            results.push(...beneficiaries.rows.map(r => ({ ...r, domain: 'NEB-06' })));
          }
          
          return results;
        },
      },
    });

    logger.info('[GraphQL Gateway] Core domains registered');
  }

  /** Register additional domain resolvers */
  registerDomain(domainCode: string, resolvers: DomainResolvers): void {
    this.registeredDomains.set(domainCode, resolvers);
    logger.info(`[GraphQL Gateway] Registered domain: ${domainCode}`);
  }

  /** Execute a unified query */
  async executeQuery(query: UnifiedQuery, context: QueryContext): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      const domainCode = this.resolveDomain(query.entity);
      const resolvers = this.registeredDomains.get(domainCode);
      
      if (!resolvers) {
        return {
          data: null,
          meta: { total: 0, limit: 0, offset: 0, executionMs: Date.now() - startTime },
          errors: [{ code: 'DOMAIN_NOT_FOUND', message: `Domain not found for entity: ${query.entity}` }],
        };
      }
      
      const resolverMap = query.operation === 'mutation' ? resolvers.Mutation : resolvers.Query;
      const resolver = resolverMap?.[query.entity];
      
      if (!resolver) {
        return {
          data: null,
          meta: { total: 0, limit: 0, offset: 0, executionMs: Date.now() - startTime },
          errors: [{ code: 'RESOLVER_NOT_FOUND', message: `Resolver not found: ${query.entity}` }],
        };
      }
      
      const args: QueryArgs = {
        ...query.filters,
        limit: query.pagination?.limit,
        offset: query.pagination?.offset,
      };
      
      const data = await resolver(args, context);
      const resultArray = Array.isArray(data) ? data : [data];
      
      return {
        data: data as unknown,
        meta: {
          total: resultArray.length,
          limit: query.pagination?.limit || 50,
          offset: query.pagination?.offset || 0,
          executionMs: Date.now() - startTime,
        },
      };
    } catch (err) {
      return {
        data: null,
        meta: { total: 0, limit: 0, offset: 0, executionMs: Date.now() - startTime },
        errors: [{
          code: 'EXECUTION_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        }],
      };
    }
  }

  /** Resolve which domain an entity belongs to */
  private resolveDomain(entity: string): string {
    const entityDomainMap: Record<string, string> = {
      strategicPlan: 'NEB-01', strategicPlans: 'NEB-01',
      okr: 'NEB-01', okrs: 'NEB-01',
      kpi: 'NEB-01', kpis: 'NEB-01',
      program: 'NEB-03', programs: 'NEB-03',
      project: 'NEB-04', projects: 'NEB-04',
      beneficiary: 'NEB-06', beneficiaries: 'NEB-06',
      transaction: 'NEB-10', transactions: 'NEB-10',
      journalEntry: 'NEB-10', journalEntries: 'NEB-10',
      account: 'NEB-10', accounts: 'NEB-10',
      revenueRecord: 'NEB-15', revenueRecords: 'NEB-15',
      revenueStream: 'NEB-15', revenueStreams: 'NEB-15',
      dashboard: 'CROSS',
      search: 'CROSS',
      searchResult: 'CROSS',
    };
    
    return entityDomainMap[entity] || 'CROSS';
  }

  /** Validate query complexity */
  validateQueryComplexity(query: UnifiedQuery): { valid: boolean; cost: number; maxCost: number } {
    let cost = query.fields?.length || 1;
    if (query.filters) cost += Object.keys(query.filters).length;
    const maxCost = this.config.rateLimits.complexity;
    return { valid: cost <= maxCost, cost, maxCost };
  }

  /** Get registered domains */
  getRegisteredDomains(): string[] {
    return Array.from(this.registeredDomains.keys());
  }
}

/** Factory */
export function createFederationGateway(config: Partial<FederationConfig> = {}): GraphQLFederationGateway {
  const defaultConfig: FederationConfig = {
    gatewayId: 'nexora-federation-gateway-v1',
    enableQueryPlan: true,
    enablePersistedQueries: true,
    rateLimits: {
      complexity: 100,
      depth: 10,
      requestsPerMinute: 1000,
    },
    securityPolicy: {
      requireAuthentication: true,
      allowedIntrospectionRoles: ['admin', 'analyst'],
    },
    ...config,
  };
  
  return new GraphQLFederationGateway(defaultConfig);
}
