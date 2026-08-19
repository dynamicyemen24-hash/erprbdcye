/**
 * NexoraOS™ — Database Optimization
 * Query builder, pagination, connection pooling, migrations, seed data
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import logger from './logger';

// ─── Query Builder ─────────────────────────────────────

export interface QueryOptions {
  select?: string[];
  where?: Record<string, any>;
  whereRaw?: string;
  whereParams?: any[];
  orderBy?: { column: string; direction: 'ASC' | 'DESC' }[];
  limit?: number;
  offset?: number;
  groupBy?: string[];
  having?: string;
  havingParams?: any[];
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class QueryBuilder {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findMany<T>(table: string, options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    const { select = ['*'], where, whereRaw, whereParams, orderBy, limit = 50, offset = 0, groupBy, having, havingParams } = options;

    let countQuery = `SELECT COUNT(*) as total FROM ${table}`;
    let dataQuery = `SELECT ${select.join(', ')} FROM ${table}`;
    const params: any[] = [];
    let paramIndex = 1;

    // WHERE clause
    if (where || whereRaw) {
      const conditions: string[] = [];
      if (where) {
        for (const [col, val] of Object.entries(where)) {
          if (val === null) { conditions.push(`${col} IS NULL`); }
          else if (Array.isArray(val)) { conditions.push(`${col} = ANY($${paramIndex})`); params.push(val); paramIndex++; }
          else if (typeof val === 'object' && val !== null && '$like' in val) { conditions.push(`${col} ILIKE $${paramIndex}`); params.push(`%${(val as any).$like}%`); paramIndex++; }
          else if (typeof val === 'object' && val !== null && '$gte' in val) { conditions.push(`${col} >= $${paramIndex}`); params.push((val as any).$gte); paramIndex++; }
          else if (typeof val === 'object' && val !== null && '$lte' in val) { conditions.push(`${col} <= $${paramIndex}`); params.push((val as any).$lte); paramIndex++; }
          else { conditions.push(`${col} = $${paramIndex}`); params.push(val); paramIndex++; }
        }
      }
      if (whereRaw && whereParams) {
        conditions.push(whereRaw);
        params.push(...whereParams);
      }
      if (conditions.length > 0) {
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;
        countQuery += whereClause;
        dataQuery += whereClause;
      }
    }

    // GROUP BY
    if (groupBy && groupBy.length > 0) {
      countQuery = `SELECT COUNT(*) as total FROM (SELECT ${select.join(', ')} FROM ${table} GROUP BY ${groupBy.join(', ')}) as sub`;
      dataQuery += ` GROUP BY ${groupBy.join(', ')}`;
    }

    // HAVING
    if (having) {
      dataQuery += ` HAVING ${having}`;
      if (havingParams) params.push(...havingParams);
    }

    // ORDER BY
    if (orderBy && orderBy.length > 0) {
      dataQuery += ` ORDER BY ${orderBy.map(o => `${o.column} ${o.direction}`).join(', ')}`;
    } else {
      dataQuery += ' ORDER BY created_at DESC';
    }

    // Execute count
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Execute data with pagination
    dataQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    const dataResult = await this.pool.query(dataQuery, params);

    return {
      data: dataResult.rows as T[],
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
      },
    };
  }

  async findOne<T>(table: string, where: Record<string, any>): Promise<T | null> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    for (const [col, val] of Object.entries(where)) {
      if (val === null) { conditions.push(`${col} IS NULL`); }
      else { conditions.push(`${col} = $${paramIndex}`); params.push(val); paramIndex++; }
    }
    const result = await this.pool.query(`SELECT * FROM ${table} WHERE ${conditions.join(' AND ')} LIMIT 1`, params);
    return result.rows[0] as T || null;
  }

  async create<T>(table: string, data: Record<string, any>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const result = await this.pool.query(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    return result.rows[0] as T;
  }

  async update<T>(table: string, where: Record<string, any>, data: Record<string, any>): Promise<T | null> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    for (const [col, val] of Object.entries(data)) {
      setClauses.push(`${col} = $${paramIndex}`);
      params.push(val);
      paramIndex++;
    }
    for (const [col, val] of Object.entries(where)) {
      if (val === null) { setClauses.push(`${col} IS NULL`); }
      else { setClauses.push(`${col} = $${paramIndex}`); params.push(val); paramIndex++; }
    }
    const result = await this.pool.query(
      `UPDATE ${table} SET ${setClauses.slice(0, Object.keys(data).length).join(', ')} WHERE ${Object.entries(where).map(([col], i) => `${col} = $${Object.keys(data).length + i + 1}`).join(' AND ')} RETURNING *`,
      [...Object.values(data), ...Object.values(where)]
    );
    return result.rows[0] as T || null;
  }

  async delete(table: string, where: Record<string, any>): Promise<boolean> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    for (const [col, val] of Object.entries(where)) {
      conditions.push(`${col} = $${paramIndex}`);
      params.push(val);
      paramIndex++;
    }
    const result = await this.pool.query(`DELETE FROM ${table} WHERE ${conditions.join(' AND ')}`, params);
    return (result.rowCount || 0) > 0;
  }

  async count(table: string, where?: Record<string, any>): Promise<number> {
    let query = `SELECT COUNT(*) as total FROM ${table}`;
    const params: any[] = [];
    if (where) {
      const conditions: string[] = [];
      let paramIndex = 1;
      for (const [col, val] of Object.entries(where)) {
        conditions.push(`${col} = $${paramIndex}`);
        params.push(val);
        paramIndex++;
      }
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0]?.total || '0');
  }

  async exists(table: string, where: Record<string, any>): Promise<boolean> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    for (const [col, val] of Object.entries(where)) {
      conditions.push(`${col} = $${paramIndex}`);
      params.push(val);
      paramIndex++;
    }
    const result = await this.pool.query(`SELECT EXISTS(SELECT 1 FROM ${table} WHERE ${conditions.join(' AND ')})`, params);
    return result.rows[0].exists;
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async bulkCreate<T>(table: string, records: Record<string, any>[]): Promise<number> {
    if (records.length === 0) return 0;
    const keys = Object.keys(records[0]);
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;
    records.forEach((record, rowIndex) => {
      const rowPlaceholders: string[] = [];
      keys.forEach(key => {
        rowPlaceholders.push(`$${paramIndex}`);
        values.push(record[key]);
        paramIndex++;
      });
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    });
    const result = await this.pool.query(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${placeholders.join(', ')}`,
      values
    );
    return result.rowCount || 0;
  }
}

// ─── Migration Runner ──────────────────────────────────

export interface Migration {
  name: string;
  up: (pool: Pool) => Promise<void>;
  down: (pool: Pool) => Promise<void>;
}

export class MigrationRunner {
  private pool: Pool;
  private migrations: Migration[] = [];

  constructor(pool: Pool) {
    this.pool = pool;
  }

  add(migration: Migration): void {
    this.migrations.push(migration);
  }

  async ensureTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS _nexora_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  async runPending(): Promise<string[]> {
    await this.ensureTable();
    const applied = await this.pool.query('SELECT name FROM _nexora_migrations ORDER BY id');
    const appliedNames = new Set(applied.rows.map((r: any) => r.name));
    const pending = this.migrations.filter(m => !appliedNames.has(m.name));
    const appliedNamesList: string[] = [];

    for (const migration of pending) {
      try {
        logger.info(`Running migration: ${migration.name}`, { context: 'migration' });
        await this.pool.query('BEGIN');
        await migration.up(this.pool);
        await this.pool.query('INSERT INTO _nexora_migrations (name) VALUES ($1)', [migration.name]);
        await this.pool.query('COMMIT');
        appliedNamesList.push(migration.name);
        logger.info(`Migration applied: ${migration.name}`, { context: 'migration' });
      } catch (error) {
        await this.pool.query('ROLLBACK');
        logger.error(`Migration failed: ${migration.name}`, { context: 'migration', error: error as any });
        throw error;
      }
    }
    return appliedNamesList;
  }

  async rollback(count: number = 1): Promise<string[]> {
    await this.ensureTable();
    const applied = await this.pool.query('SELECT name FROM _nexora_migrations ORDER BY id DESC LIMIT $1', [count]);
    const rolledBack: string[] = [];

    for (const row of applied.rows) {
      const migration = this.migrations.find(m => m.name === row.name);
      if (migration) {
        try {
          await this.pool.query('BEGIN');
          await migration.down(this.pool);
          await this.pool.query('DELETE FROM _nexora_migrations WHERE name = $1', [migration.name]);
          await this.pool.query('COMMIT');
          rolledBack.push(migration.name);
          logger.info(`Migration rolled back: ${migration.name}`, { context: 'migration' });
        } catch (error) {
          await this.pool.query('ROLLBACK');
          logger.error(`Rollback failed: ${migration.name}`, { context: 'migration', error: error as any });
          throw error;
        }
      }
    }
    return rolledBack;
  }

  async status(): Promise<{ name: string; applied: boolean }[]> {
    await this.ensureTable();
    const applied = await this.pool.query('SELECT name FROM _nexora_migrations');
    const appliedNames = new Set(applied.rows.map((r: any) => r.name));
    return this.migrations.map(m => ({ name: m.name, applied: appliedNames.has(m.name) }));
  }
}

// ─── Database Seeding ──────────────────────────────────

export async function seedDatabase(pool: Pool): Promise<void> {
  const qb = new QueryBuilder(pool);
  logger.info('Seeding database...', { context: 'seed' });

  // Seed default organization
  const orgExists = await qb.exists('organizations', { slug: 'rohamaa' });
  if (!orgExists) {
    await qb.create('organizations', {
      name_ar: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
      name_en: 'Rohamā\'a Baynahum Charity Foundation',
      slug: 'rohamaa',
      country: 'YE',
      currency: 'YER',
      settings: JSON.stringify({ timezone: 'Asia/Aden', language: 'ar', theme: 'emerald' }),
    });
    logger.info('Default organization seeded', { context: 'seed' });
  }

  // Seed default admin user
  const adminExists = await qb.exists('users', { email: 'admin@nexora.org' });
  if (!adminExists) {
    const bcrypt = await import('bcryptjs');
    const hashedPw = await bcrypt.hash('Nexora@2024!', 12);
    // Get the org we just created
    const org = await qb.findOne('organizations', { slug: 'rohamaa' });
    const orgId = org?.id || '00000000-0000-0000-0000-000000000001';
    await qb.create('users', {
      email: 'admin@nexora.org',
      password_hash: hashedPw,
      name: 'System Administrator',
      name_ar: 'مدير النظام',
      role: 'SUPER_ADMIN',
      org_id: orgId,
    });
    logger.info('Default admin seeded (admin@nexora.org / Nexora@2024!)', { context: 'seed' });
  }

  // Seed default currency rates
  const ratesExist = await qb.exists('exchange_rates', { from_currency: 'USD', to_currency: 'YER' });
  if (!ratesExist) {
    await qb.bulkCreate('exchange_rates', [
      { from_currency: 'USD', to_currency: 'YER', rate: '250.35', source: 'CBB', effective_date: new Date().toISOString().split('T')[0] },
      { from_currency: 'USD', to_currency: 'SAR', rate: '3.75', source: 'SAMA', effective_date: new Date().toISOString().split('T')[0] },
      { from_currency: 'YER', to_currency: 'SAR', rate: '0.015', source: 'CBB', effective_date: new Date().toISOString().split('T')[0] },
      { from_currency: 'EUR', to_currency: 'USD', rate: '1.08', source: 'ECB', effective_date: new Date().toISOString().split('T')[0] },
      { from_currency: 'EUR', to_currency: 'YER', rate: '270.38', source: 'ECB', effective_date: new Date().toISOString().split('T')[0] },
    ]);
    logger.info('Default exchange rates seeded', { context: 'seed' });
  }

  logger.info('Database seeding complete', { context: 'seed' });
}

export default QueryBuilder;
