/**
 * NexoraOS™ — Database Migration Runner
 * SQL-file based migrations with up/down tracking and rollback support
 */

import { query, transaction } from '../core/database';
import logger from '../core/logger';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
}

export class Migrator {
  private migrationsPath: string;

  constructor(migrationsPath: string = join(__dirname, 'migrations')) {
    this.migrationsPath = migrationsPath;
  }

  async ensureMigrationsTable(): Promise<void> {
    await query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  async getAppliedMigrations(): Promise<string[]> {
    const result = await query<{ name: string }>('SELECT name FROM _migrations ORDER BY id');
    return result.rows.map(r => r.name);
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations();
    const files = readdirSync(this.migrationsPath)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const migrations: Migration[] = [];
    for (const file of files) {
      const name = file.replace('.sql', '');
      if (!applied.includes(name)) {
        const content = readFileSync(join(this.migrationsPath, file), 'utf-8');
        const [up, down] = content.split('-- DOWN');
        migrations.push({
          id: name,
          name,
          up: up.trim(),
          down: (down || '').trim(),
        });
      }
    }

    return migrations;
  }

  async migrate(): Promise<{ applied: string[]; errors: string[] }> {
    await this.ensureMigrationsTable();
    const pending = await this.getPendingMigrations();
    const applied: string[] = [];
    const errors: string[] = [];

    for (const migration of pending) {
      try {
        logger.info(`Applying migration: ${migration.name}`, { context: 'migrator' });
        await transaction(async (client) => {
          await client.query(migration.up);
          await client.query(
            'INSERT INTO _migrations (name) VALUES ($1)',
            [migration.name]
          );
        });
        applied.push(migration.name);
        logger.info(`Migration applied: ${migration.name}`, { context: 'migrator' });
      } catch (error) {
        const errMsg = `Migration ${migration.name} failed: ${(error as Error).message}`;
        logger.error(errMsg, { context: 'migrator' });
        errors.push(errMsg);
        break; // Stop on first error
      }
    }

    return { applied, errors };
  }

  async rollback(steps: number = 1): Promise<{ rolledBack: string[]; errors: string[] }> {
    const applied = await this.getAppliedMigrations();
    const toRollback = applied.slice(-steps).reverse();
    const rolledBack: string[] = [];
    const errors: string[] = [];

    for (const name of toRollback) {
      try {
        const files = readdirSync(this.migrationsPath).filter(f => f.startsWith(name));
        if (files.length === 0) continue;

        const content = readFileSync(join(this.migrationsPath, files[0]), 'utf-8');
        const parts = content.split('-- DOWN');
        const down = (parts[1] || '').trim();

        if (!down) {
          logger.warn(`No rollback for migration: ${name}`, { context: 'migrator' });
          continue;
        }

        logger.info(`Rolling back migration: ${name}`, { context: 'migrator' });
        await transaction(async (client) => {
          await client.query(down);
          await client.query('DELETE FROM _migrations WHERE name = $1', [name]);
        });
        rolledBack.push(name);
        logger.info(`Migration rolled back: ${name}`, { context: 'migrator' });
      } catch (error) {
        const errMsg = `Rollback ${name} failed: ${(error as Error).message}`;
        logger.error(errMsg, { context: 'migrator' });
        errors.push(errMsg);
        break;
      }
    }

    return { rolledBack, errors };
  }

  async status(): Promise<{ applied: string[]; pending: string[]; total: number }> {
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();
    return {
      applied,
      pending: pending.map(m => m.name),
      total: applied.length + pending.length,
    };
  }
}

export const migrator = new Migrator();
