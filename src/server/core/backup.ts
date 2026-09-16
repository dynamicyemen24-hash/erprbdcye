/**
 * NexoraOS™ — Database Backup System
 * Automated pg_dump with compression, rotation, and restoration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from './logger';

const execAsync = promisify(exec);

interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  compressionEnabled: boolean;
  pgDumpPath: string;
  connectionString?: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  s3Bucket?: string;
  s3Prefix: string;
}

interface BackupManifest {
  id: string;
  filename: string;
  size: number;
  checksum: string;
  compressed: boolean;
  createdAt: string;
  duration: number;
  type: 'full' | 'schema' | 'data';
}

class BackupService {
  private config: BackupConfig;
  private manifests: BackupManifest[] = [];

  constructor() {
    // Prefer DATABASE_URL (Neon / Render) over split DB_* vars. pg_dump/psql
    // both accept a connection string via --dbname, so pooled URLs work.
    const url = process.env.DATABASE_URL || '';
    let fromUrl = { host: '', port: 0, name: '', user: '', password: '' };
    if (url) {
      try {
        const parsed = new URL(url);
        fromUrl = {
          host: parsed.hostname,
          port: parseInt(parsed.port || '5432', 10),
          name: decodeURIComponent(parsed.pathname.replace('/', '')),
          user: decodeURIComponent(parsed.username),
          password: decodeURIComponent(parsed.password),
        };
      } catch { /* fall back to split vars */ }
    }
    this.config = {
      backupDir: process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'),
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      compressionEnabled: process.env.BACKUP_COMPRESSION !== 'false',
      pgDumpPath: process.env.PG_DUMP_PATH || 'pg_dump',
      connectionString: url || undefined,
      dbHost: fromUrl.host || process.env.DB_HOST || 'localhost',
      dbPort: fromUrl.port || parseInt(process.env.DB_PORT || '5432'),
      dbName: fromUrl.name || process.env.DB_NAME || 'nexora',
      dbUser: fromUrl.user || process.env.DB_USER || 'nexora',
      dbPassword: fromUrl.password || process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
      s3Bucket: process.env.BACKUP_S3_BUCKET || undefined,
      s3Prefix: process.env.BACKUP_S3_PREFIX || 'nexoraos/',
    };
    this.ensureBackupDir();
  }

  private connArgs(): string {
    if (this.config.connectionString) {
      // Single-quoted inside double quotes is unsafe; pass via env-safe quoting.
      return `--dbname="${this.config.connectionString.replace(/"/g, '\\"')}"`;
    }
    return `-h ${this.config.dbHost} -p ${this.config.dbPort} -U ${this.config.dbUser} -d ${this.config.dbName}`;
  }

  private psqlEnv(): NodeJS.ProcessEnv {
    return { ...process.env, PGPASSWORD: this.config.dbPassword || '' };
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }
  }

  async createBackup(type: 'full' | 'schema' | 'data' = 'full'): Promise<BackupManifest> {
    const id = `bak_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = this.config.compressionEnabled ? 'sql.gz' : 'sql';
    const filename = `nexora_${type}_${timestamp}.${ext}`;
    const filepath = path.join(this.config.backupDir, filename);

    logger.info(`Starting ${type} backup...`, { context: 'backup', meta: { id, filename } });
    const start = Date.now();

    try {
      const args = [
        this.connArgs(),
        `--format=plain`,
        type === 'schema' ? '--schema-only' : type === 'data' ? '--data-only' : '',
        `--no-owner`,
        `--no-privileges`,
      ].filter(Boolean).join(' ');

      let cmd: string;
      if (this.config.compressionEnabled) {
        cmd = `${this.config.pgDumpPath} ${args} | gzip > "${filepath}"`;
      } else {
        cmd = `${this.config.pgDumpPath} ${args} > "${filepath}"`;
      }

      const { stderr } = await execAsync(cmd, { env: this.psqlEnv() });
      if (stderr) logger.debug(`pg_dump stderr: ${stderr}`, { context: 'backup' });

      const stats = fs.statSync(filepath);
      const content = fs.readFileSync(filepath);
      const checksum = crypto.createHash('sha256').update(content).digest('hex');
      const duration = Date.now() - start;

      const manifest: BackupManifest = {
        id, filename, size: stats.size, checksum, compressed: this.config.compressionEnabled,
        createdAt: new Date().toISOString(), duration, type,
      };

      this.manifests.push(manifest);
      logger.info(`Backup completed: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)}MB, ${duration}ms)`, { context: 'backup' });

      // Off-box copy: local disk is ephemeral on Render/Docker. Best-effort
      // upload to S3 when BACKUP_S3_BUCKET is set (requires `aws` CLI).
      if (this.config.s3Bucket) {
        const dest = `s3://${this.config.s3Bucket}/${this.config.s3Prefix}${filename}`;
        execAsync(`aws s3 cp "${filepath}" "${dest}"`).then(
          () => logger.info(`Backup uploaded to ${dest}`, { context: 'backup' }),
          (s3Err: any) => logger.warn(`S3 backup upload failed (local copy retained): ${s3Err.message}`, { context: 'backup' })
        );
      }

      return manifest;
    } catch (error: any) {
      logger.error(`Backup failed: ${error.message}`, { context: 'backup' });
      throw error;
    }
  }

  async restoreBackup(filename: string): Promise<void> {
    const filepath = path.join(this.config.backupDir, filename);
    if (!fs.existsSync(filepath)) throw new Error(`Backup file not found: ${filename}`);

    logger.info(`Restoring backup: ${filename}`, { context: 'backup' });
    const start = Date.now();

    try {
      const conn = this.connArgs();
      const cmd = this.config.compressionEnabled && filename.endsWith('.gz')
        ? `gunzip -c "${filepath}" | psql ${conn}`
        : `psql ${conn} -f "${filepath}"`;

      const { stderr } = await execAsync(cmd, { env: this.psqlEnv() });
      if (stderr) logger.debug(`Restore stderr: ${stderr}`, { context: 'backup' });

      logger.info(`Backup restored in ${Date.now() - start}ms`, { context: 'backup' });
    } catch (error: any) {
      logger.error(`Restore failed: ${error.message}`, { context: 'backup' });
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<number> {
    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(this.config.backupDir).filter(f => f.startsWith('nexora_'));
    let removed = 0;

    for (const file of files) {
      const filepath = path.join(this.config.backupDir, file);
      const stats = fs.statSync(filepath);
      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(filepath);
        removed++;
        logger.info(`Removed old backup: ${file}`, { context: 'backup' });
      }
    }
    return removed;
  }

  listBackups(): BackupManifest[] {
    return [...this.manifests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async verifyBackup(filename: string): Promise<{ valid: boolean; size: number; checksum: string }> {
    const filepath = path.join(this.config.backupDir, filename);
    const content = fs.readFileSync(filepath);
    const checksum = crypto.createHash('sha256').update(content).digest('hex');
    const manifest = this.manifests.find(m => m.filename === filename);
    return { valid: manifest ? manifest.checksum === checksum : true, size: content.length, checksum };
  }
}

export const backupService = new BackupService();
export default backupService;
