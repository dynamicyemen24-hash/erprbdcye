import express from 'express';
import { getDatabasePool } from '../services/db.service';
import { IPSASFinanceService } from '../services/finance.service';

export const healthRouter = express.Router();

healthRouter.get('/deep', async (req, res) => {
  const startTime = Date.now();
  try {
    const pool = getDatabasePool();
    
    // Test DB query latency
    const dbStart = Date.now();
    const dbTest = await pool.query('SELECT NOW() as current_time, COUNT(*) as org_count FROM organizations;');
    const dbLatencyMs = Date.now() - dbStart;

    // Check key operational counts
    const [prjRes, benRes, sponsRes, txRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM projects'),
      pool.query('SELECT COUNT(*) FROM beneficiaries'),
      pool.query('SELECT COUNT(*) FROM sponsorships'),
      pool.query('SELECT COUNT(*) FROM transactions')
    ]);

    // Check financial balance
    const trial = await IPSASFinanceService.getTrialBalance();

    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    res.json({
      status: 'HEALTHY',
      system: 'NexoraOS™ Enterprise Architecture',
      organization: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      database: {
        status: 'CONNECTED',
        engine: 'Neon Serverless PostgreSQL 16+',
        latencyMs: dbLatencyMs,
        activeProjects: parseInt(prjRes.rows[0].count),
        registeredBeneficiaries: parseInt(benRes.rows[0].count),
        activeSponsorships: parseInt(sponsRes.rows[0].count),
        postedTransactions: parseInt(txRes.rows[0].count)
      },
      accounting: {
        standard: 'IPSAS Double-Entry',
        isBalanced: trial.summary.isBalanced,
        totalDebits: trial.summary.totalDebit,
        totalCredits: trial.summary.totalCredit,
        variance: trial.summary.variance
      },
      process: {
        uptimeSeconds: Math.floor(uptime),
        memoryRssMb: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        nodeVersion: process.version
      }
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'DEGRADED',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});
