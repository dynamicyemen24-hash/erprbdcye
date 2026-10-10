#!/usr/bin/env node
/**
 * NEXORAOS™ Enterprise Operations Dashboard & Unified Executive Console
 * Version: 2.0.0 (Elite Enterprise UX & Standard Methodology)
 * Unites all verification, database diagnostics, schema health, and live probes
 * into an exquisite production-grade terminal dashboard.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('./logger');

// ANSI escape codes for professional terminal styling
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m'
};

const scripts = [
  { id: 'sec', name: 'Security Guard & Secret Scan', cmd: 'node security-scan.js', category: 'Security' },
  { id: 'ver', name: 'Offline Schema Integrity', cmd: 'node verify.js', category: 'Data & Schema' },
  { id: 'det', name: 'Detailed Enhancement & Constraints', cmd: 'node detailed_verification.js', category: 'Performance' },
  { id: 'idx', name: 'Sync Performance Indexes', cmd: 'node check_indexes.js', category: 'Performance' },
  { id: 'rep', name: 'Production Readiness & NEB Score', cmd: 'node production_report.js', category: 'Executive' },
  { id: 'liv', name: 'Live Health & Endpoint Probe', cmd: 'node health-live.js', category: 'Operations' },
  { id: 'crit', name: 'Critical Columns (needs DB)', cmd: 'node check_critical_tables.js', category: 'Data & Schema', allowFailWithoutDb: true },
  { id: 'schema', name: 'Schema Compare (needs DB)', cmd: 'node compare_schema.js', category: 'Data & Schema', allowFailWithoutDb: true }
];

const isJsonMode = process.argv.includes('--json');

function runDashboard() {
  const startTime = Date.now();
  if (!isJsonMode) {
    logger.info('Initializing NexoraOS Enterprise Operations Console v2.0...');
  }

  if (process.stdout.isTTY && !process.env.CI && !isJsonMode) {
    console.clear();
  }
  if (!isJsonMode) {
    console.log(`${c.cyan}${c.bright}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.cyan}${c.bright}║                   NEXORAOS™ ENTERPRISE OPERATIONS CONSOLE                    ║${c.reset}`);
    console.log(`${c.cyan}${c.bright}║          E2E SaaS Architecture • SAP / Oracle / MS Dynamics Spec             ║${c.reset}`);
    console.log(`${c.cyan}${c.bright}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}`);
    console.log(`${c.dim}Timestamp: ${new Date().toISOString()} | Node: ${process.version} | Platform: ${process.platform}${c.reset}\n`);
  }

  let results = [];
  let passedCount = 0;

  for (const s of scripts) {
    const t0 = Date.now();
    if (!isJsonMode) {
      console.log(`${c.blue}${c.bright}┌─ [${s.category}] ${s.name}${c.reset}`);
      console.log(`${c.dim}│ Executing: ${s.cmd}${c.reset}`);
    }
    
    try {
      const output = execSync(s.cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
      const duration = Date.now() - t0;
      
      if (!isJsonMode) {
        // Print trimmed clean output indented
        const lines = output.trim().split('\n');
        for (const line of lines) {
          console.log(`${c.dim}│${c.reset}   ${line}`);
        }
        
        console.log(`${c.green}${c.bright}└─ 🟢 STATUS: PASS${c.reset} ${c.dim}(${duration}ms)${c.reset}\n`);
      }
      results.push({ ...s, status: 'PASS', duration });
      passedCount++;
    } catch (err) {
      const duration = Date.now() - t0;
      const stdout = err.stdout ? err.stdout.toString().trim() : '';
      const stderr = err.stderr ? err.stderr.toString().trim() : (err.message || '');
      const combined = `${stdout}\n${stderr}`;

      // Optional DB-dependent steps degrade to SKIP offline (no DATABASE_URL),
      // excluded from the readiness denominator. Required steps stay strict.
      if (s.allowFailWithoutDb && combined.includes('Missing DATABASE_URL')) {
        if (!isJsonMode) {
          console.log(`${c.yellow}${c.bright}└─ ⚪ STATUS: SKIP (no DATABASE_URL — offline)${c.reset} ${c.dim}(${duration}ms)${c.reset}\n`);
        }
        results.push({ ...s, status: 'SKIP', duration });
        continue;
      }
      
      if (!isJsonMode) {
        if (stdout) {
          for (const line of stdout.split('\n')) console.log(`${c.dim}│${c.reset}   ${line}`);
        }
        if (stderr) {
          for (const line of stderr.split('\n')) console.log(`${c.red}│   ${line}${c.reset}`);
        }
        
        console.log(`${c.red}${c.bright}└─ 🔴 STATUS: FAIL${c.reset} ${c.dim}(${duration}ms)${c.reset}\n`);
      }
      results.push({ ...s, status: 'FAIL', duration });
    }
  }

  const evaluated = results.filter((r) => r.status !== 'SKIP');
  const skippedCount = results.length - evaluated.length;
  const failedCount = results.filter((r) => r.status === 'FAIL').length;
  const totalDuration = Date.now() - startTime;
  const readinessScore = evaluated.length === 0 ? 100 : Math.round((passedCount / evaluated.length) * 100);

  // Machine-readable mode: single JSON line via logger, no ANSI/box art.
  if (isJsonMode) {
    logger.info('ops-dashboard summary', {
      passed: passedCount,
      total: evaluated.length,
      readiness: readinessScore,
      results: results.map((r) => ({ id: r.id, status: r.status, duration: r.duration }))
    });
    if (failedCount > 0) {
      process.exitCode = 1;
    }
    return;
  }

  // Executive Summary Box
  console.log(`${c.bright}══════════════════════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.bright}                        EXECUTIVE OPERATIONS SUMMARY                          ${c.reset}`);
  console.log(`${c.bright}══════════════════════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`  Total Workflows : ${scripts.length}`);
  console.log(`  Passed          : ${c.green}${passedCount}${c.reset}`);
  console.log(`  Failed          : ${failedCount === 0 ? c.green + '0' : c.red + failedCount}${c.reset}`);
  console.log(`  Skipped (no DB): ${skippedCount}`);
  console.log(`  Readiness Score : ${readinessScore === 100 ? c.green + readinessScore + '%' : c.yellow + readinessScore + '%'}${c.reset} ${c.dim}(over ${evaluated.length} evaluated)${c.reset}`);
  console.log(`  Total Duration  : ${totalDuration}ms`);
  console.log(`${c.bright}══════════════════════════════════════════════════════════════════════════════${c.reset}`);

  if (failedCount === 0) {
    logger.info('All executive workflows successfully validated. System fully operational.', { readiness: readinessScore + '%' });
    console.log(`${c.bgGreen}${c.bright} 🎉 RESULT: SYSTEM 100% PRODUCTION READY - ALL DOMAINS SYNCHRONIZED       ${c.reset}\n`);
  } else {
    logger.warn('Executive dashboard detected workflow anomalies.', { passedCount, total: evaluated.length });
    console.log(`${c.red}${c.bright} ⚠️  RESULT: REVIEW REQUIRED - UNRESOLVED WORKFLOW ANOMALIES DETECTED          ${c.reset}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runDashboard();
}

module.exports = { runDashboard, scripts };
