import express from 'express';
import { IPSASFinanceService } from '../services/finance.service';
import { recordAuditLog } from '../services/audit.service';
import { requireFinancePolicy } from '../middleware/policy.middleware';

export const financeRouter = express.Router();

// GET /api/finance/trial-balance
financeRouter.get('/trial-balance', async (req: any, res) => {
  try {
    const orgId = req.user?.org_id || '00000000-0000-0000-0000-000000000001';
    const report = await IPSASFinanceService.getTrialBalance(orgId);
    res.json(report);
  } catch (err: any) {
    console.error('[Finance]', err);
    res.status(500).json({ error: 'Failed to generate trial balance' });
  }
});

// GET /api/finance/balance-sheet
financeRouter.get('/balance-sheet', async (req: any, res) => {
  try {
    const orgId = req.user?.org_id || '00000000-0000-0000-0000-000000000001';
    const report = await IPSASFinanceService.getBalanceSheet(orgId);
    res.json(report);
  } catch (err: any) {
    console.error('[Finance]', err);
    res.status(500).json({ error: 'Failed to generate balance sheet' });
  }
});

// GET /api/finance/income-statement
financeRouter.get('/income-statement', async (req: any, res) => {
  try {
    const orgId = req.user?.org_id || '00000000-0000-0000-0000-000000000001';
    const report = await IPSASFinanceService.getIncomeStatement(orgId);
    res.json(report);
  } catch (err: any) {
    console.error('[Finance]', err);
    res.status(500).json({ error: 'Failed to generate income statement' });
  }
});

// POST /api/finance/vouchers (Atomic Double-Entry Posting)
financeRouter.post('/vouchers', requireFinancePolicy('CREATE'), async (req: any, res) => {
  try {
    const { transaction_type, date, lines } = req.body;

    if (!transaction_type || typeof transaction_type !== 'string') {
      return res.status(400).json({ error: 'transaction_type is required and must be a string' });
    }
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date is required and must be a string' });
    }
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'lines must be a non-empty array' });
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.suggested_account_name && !line.account_name) {
        return res.status(400).json({ error: `lines[${i}] must have a suggested_account_name or account_name` });
      }
      if (typeof line.debit !== 'number' || typeof line.credit !== 'number') {
        return res.status(400).json({ error: `lines[${i}] debit and credit must be numbers` });
      }
    }

    const orgId = req.user?.org_id || '00000000-0000-0000-0000-000000000001';
    const payload = {
      ...req.body,
      organizationId: orgId
    };

    const posted = await IPSASFinanceService.postDoubleEntryVoucher(payload);

    await recordAuditLog({
      organizationId: orgId,
      userId: req.user?.id,
      action: 'CREATE',
      tableName: 'transactions',
      recordId: posted.transactionId,
      details: { transactionNumber: posted.transactionNumber, amount: posted.totalAmount }
    });

    res.status(201).json({ status: 'success', data: posted });
  } catch (err: any) {
    console.error('[Finance]', err);
    res.status(400).json({ error: 'Failed to post voucher' });
  }
});
