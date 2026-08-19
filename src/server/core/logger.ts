/**
 * NexoraOS™ — Structured Logging System
 * Production-grade logging with context, levels, and rotation
 */

import fs from 'fs';
import path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  requestId?: string;
  userId?: string;
  tenantId?: string;
  duration?: number;
  error?: { name: string; message: string; stack?: string; code?: string };
  meta?: Record<string, any>;
}

interface LoggerConfig {
  level: LogLevel;
  dir: string;
  maxSizeMb: number;
  maxFiles: number;
  console: boolean;
  json: boolean;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3, fatal: 4,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', info: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m', fatal: '\x1b[35m',
};

const RESET = '\x1b[0m';

class Logger {
  private config: LoggerConfig;
  private stream: fs.WriteStream | null = null;
  private currentDate: string = '';

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      dir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
      maxSizeMb: parseInt(process.env.LOG_MAX_SIZE_MB || '50'),
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '30'),
      console: process.env.NODE_ENV !== 'production',
      json: process.env.NODE_ENV === 'production',
      ...config,
    };
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.config.dir)) {
      fs.mkdirSync(this.config.dir, { recursive: true });
    }
  }

  private rotateIfNeeded(): void {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    if (dateStr !== this.currentDate) {
      if (this.stream) this.stream.end();
      const logFile = path.join(this.config.dir, `nexora-${dateStr}.log`);
      this.stream = fs.createWriteStream(logFile, { flags: 'a' });
      this.currentDate = dateStr;
      this.cleanupOldFiles();
    }
  }

  private cleanupOldFiles(): void {
    try {
      const files = fs.readdirSync(this.config.dir).filter(f => f.startsWith('nexora-') && f.endsWith('.log')).sort();
      while (files.length > this.config.maxFiles) {
        const old = files.shift()!;
        fs.unlinkSync(path.join(this.config.dir, old));
      }
    } catch { /* silent */ }
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.config.level];
  }

  private formatEntry(entry: LogEntry): string {
    if (this.config.json) return JSON.stringify(entry);
    const color = LEVEL_COLORS[entry.level];
    const level = entry.level.toUpperCase().padEnd(5);
    const ctx = entry.context ? `[${entry.context}]` : '';
    const rid = entry.requestId ? `{${entry.requestId.substring(0, 8)}}` : '';
    const uid = entry.userId ? `<u:${entry.userId}>` : '';
    const dur = entry.duration !== undefined ? `(${entry.duration}ms)` : '';
    const err = entry.error ? ` ERROR: ${entry.error.message}` : '';
    const meta = entry.meta ? ` ${JSON.stringify(entry.meta)}` : '';
    return `${color}${entry.timestamp}${RESET} ${color}${level}${RESET} ${ctx}${rid}${uid} ${entry.message}${dur}${err}${meta}`;
  }

  private write(level: LogLevel, message: string, extra?: Partial<LogEntry>): void {
    if (!this.shouldLog(level)) return;
    this.rotateIfNeeded();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...extra,
    };
    if (this.config.console) console.log(this.formatEntry(entry));
    if (this.stream) this.stream.write(this.formatEntry(entry) + '\n');
  }

  debug(message: string, extra?: Partial<LogEntry>): void { this.write('debug', message, extra); }
  info(message: string, extra?: Partial<LogEntry>): void { this.write('info', message, extra); }
  warn(message: string, extra?: Partial<LogEntry>): void { this.write('warn', message, extra); }
  error(message: string, extra?: Partial<LogEntry>): void { this.write('error', message, extra); }
  fatal(message: string, extra?: Partial<LogEntry>): void { this.write('fatal', message, extra); }

  child(context: string): ChildLogger { return new ChildLogger(this, context); }
}

class ChildLogger {
  constructor(private parent: Logger, private context: string) {}
  debug(message: string, extra?: Partial<LogEntry>): void { this.parent.debug(message, { ...extra, context: this.context }); }
  info(message: string, extra?: Partial<LogEntry>): void { this.parent.info(message, { ...extra, context: this.context }); }
  warn(message: string, extra?: Partial<LogEntry>): void { this.parent.warn(message, { ...extra, context: this.context }); }
  error(message: string, extra?: Partial<LogEntry>): void { this.parent.error(message, { ...extra, context: this.context }); }
  fatal(message: string, extra?: Partial<LogEntry>): void { this.parent.fatal(message, { ...extra, context: this.context }); }
}

// ─── Express Request Logger Middleware ──────────────────

import { Request, Response, NextFunction } from 'express';

export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = (req as any).requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    (req as any).requestId = requestId;
    (req as any).log = logger.child('http');
    const child = (req as any).log as ChildLogger;

    child.info(`${req.method} ${req.url}`, {
      requestId,
      meta: { ip: req.ip, userAgent: req.get('user-agent')?.substring(0, 80) },
    });

    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      child[level](`${req.method} ${req.url} → ${res.statusCode}`, {
        requestId,
        duration,
        meta: { statusCode: res.statusCode },
      });
    });
    next();
  };
}

// ─── Singleton ─────────────────────────────────────────

export const logger = new Logger();
export default logger;
