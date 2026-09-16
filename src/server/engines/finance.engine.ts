/**
 * NexoraOS™ — IPSAS Finance & Ledger Engine
 * Complete double-entry accounting with period closing, budget tracking, reconciliation
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import {
  VoucherEntry, LedgerLine, TrialBalanceEntry, AccountType,
  TransactionType, TransactionStatus, FiscalYearStatus,
  PaginationParams, PaginatedResult
} from '../core/types';
import {
  paginatedQuery, requireField, optionalString, optionalNumber,
  generateTxNumber, auditLog, AuthContext
} from '../core/helpers';
import logger from '../core/logger';
import crypto from 'crypto';

// ─── Chart of Accounts ─────────────────────────────────

export class ChartOfAccountsService {
  static async list(orgId: string, pagination: PaginationParams = {}): Promise<PaginatedResult<any>> {
    return paginatedQuery(
      `SELECT * FROM chart_of_accounts WHERE organization_id = $1 AND deleted_at IS NULL`,
      `SELECT COUNT(*) FROM chart_of_accounts WHERE organization_id = $1 AND deleted_at IS NULL`,
      [orgId],
      pagination
    );
  }

  static async getById(orgId: string, id: string) {
    return queryOne(
      'SELECT * FROM chart_of_accounts WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, orgId]
    );
  }

  static async getByCode(orgId: string, accountCode: string) {
    return queryOne(
      'SELECT * FROM chart_of_accounts WHERE organization_id = $1 AND account_code = $2',
      [orgId, accountCode]
    );
  }

  static async create(orgId: string, data: {
    accountCode: string;
    nameAr: string;
    nameEn?: string;
    accountType: AccountType;
    parentAccountId?: string;
    level?: number;
    isHeader?: boolean;
    currencyCode?: string;
  }) {
    return await transaction(async (client) => {
      // Check uniqueness
      const existing = await client.query(
        'SELECT id FROM chart_of_accounts WHERE organization_id = $1 AND account_code = $2',
        [orgId, data.accountCode]
      );
      if (existing.rows.length > 0) {
        throw new Error(`Account code '${data.accountCode}' already exists`);
      }

      const result = await client.query(
        `INSERT INTO chart_of_accounts
         (organization_id, account_code, name_ar, name_en, account_type, parent_account_id, level, is_header, currency_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          orgId,
          requireField(data.accountCode, 'accountCode'),
          requireField(data.nameAr, 'nameAr'),
          optionalString(data.nameEn),
          requireField(data.accountType, 'accountType'),
          optionalString(data.parentAccountId),
          data.level || 1,
          data.isHeader || false,
          data.currencyCode || 'YER',
        ]
      );
      return result.rows[0];
    });
  }

  static async update(orgId: string, id: string, data: {
    nameAr?: string;
    nameEn?: string;
    isActive?: boolean;
  }) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nameAr !== undefined) { sets.push(`name_ar = $${idx++}`); values.push(data.nameAr); }
    if (data.nameEn !== undefined) { sets.push(`name_en = $${idx++}`); values.push(data.nameEn); }
    if (data.isActive !== undefined) { sets.push(`is_active = $${idx++}`); values.push(data.isActive); }

    if (sets.length === 0) return null;
    values.push(id, orgId);

    // Tenant-scoped: a caller can only mutate accounts of its own organization.
    const result = await queryOne(
      `UPDATE chart_of_accounts SET ${sets.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *`,
      values
    );
    return result;
  }

  static async delete(orgId: string, id: string) {
    // Tenant-scoped soft delete - check for transactions first
    const txCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM transaction_lines WHERE account_id = $1`,
      [id]
    );
    if (parseInt(txCount?.count || '0') > 0) {
      throw new Error('Cannot delete account with existing transactions. Deactivate instead.');
    }
    await query('UPDATE chart_of_accounts SET deleted_at = NOW() WHERE id = $1 AND organization_id = $2', [id, orgId]);
  }

  static async getTree(orgId: string) {
    const accounts = await queryMany(
      `SELECT * FROM chart_of_accounts WHERE organization_id = $1 AND deleted_at IS NULL ORDER BY account_code`,
      [orgId]
    );
    return buildAccountTree(accounts);
  }
}

function buildAccountTree(accounts: any[]): any[] {
  const map = new Map<string, any>();
  const roots: any[] = [];

  accounts.forEach(a => {
    map.set(a.id, { ...a, children: [] });
  });

  accounts.forEach(a => {
    const node = map.get(a.id)!;
    if (a.parent_account_id && map.has(a.parent_account_id)) {
      map.get(a.parent_account_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ─── Transaction Ledger ────────────────────────────────

export class LedgerEngine {
  /**
   * Post a double-entry voucher (IPSAS compliant)
   */
static async postVoucher(entry: VoucherEntry, auth: AuthContext) {
     if (!entry.organizationId || entry.organizationId !== auth.orgId) {
       throw new Error('لا يمكن ترحيل قيد خارج نطاق المنظمة الحالية');
     }
     if (!entry.description?.trim()) {
       throw new Error('وصف القيد إلزامي لأغراض التدقيق والتتبع');
     }
     // Validate balance
     const totalDebit = entry.lines.reduce((s, l) => s + Number(l.debit), 0);
     const totalCredit = entry.lines.reduce((s, l) => s + Number(l.credit), 0);

     if (Math.abs(totalDebit - totalCredit) > 0.01) {
       throw new Error(`IPSAS Validation: Debit (${totalDebit}) ≠ Credit (${totalCredit})`);
     }

     if (totalDebit === 0) {
       throw new Error('Transaction amount cannot be zero');
     }

     if (entry.lines.length < 2) {
       throw new Error('Double-entry requires at least 2 lines');
     }
     const invalidLine = entry.lines.find(line => {
       const debit = Number(line.debit);
       const credit = Number(line.credit);
       return !Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit === 0 && credit === 0);
     });
     if (invalidLine) {
       throw new Error('كل سطر محاسبي يجب أن يحتوي على مدين أو دائن موجب واحد فقط');
     }

     // IPSAS 23: Enforce Fund/Donor dimension as mandatory
     const lineWithMissingFund = entry.lines.find(l => !l.fundId);
     if (lineWithMissingFund) {
       throw new Error('Fund/Donor segment (بُعد المانح والمنحة) is mandatory for all journal entries per IPSAS 23');
     }

     // Check period lock status
     const fiscalPeriodId = entry.fiscalPeriodId;
     if (fiscalPeriodId) {
       const periodLocked = await PeriodLockService.isPeriodLocked(entry.organizationId, fiscalPeriodId);
       if (periodLocked) {
         const periodInfo = await queryOne(
           `SELECT is_hard_closed FROM fiscal_periods WHERE id = $1 AND organization_id = $2`,
           [fiscalPeriodId, entry.organizationId]
         );
         if (periodInfo?.is_hard_closed) {
           throw new Error('Period is permanently closed (Hard Lock). No modifications allowed.');
         }
         throw new Error('Period is soft-locked. CFO approval required for posting.');
       }
     }

     return await transaction(async (client) => {
      // Mandatory Budget Availability Check (NEB-10 / NEB-14 Compliance).
      // FOR UPDATE locks the project row for the duration of this transaction:
      // without it, two concurrent postings can both pass the check and jointly
      // overspend the budget (TOCTOU). The lock serializes competing postings.
      const targetProjectId = entry.lines.find(l => l.projectId)?.projectId;
      if (targetProjectId) {
        const projRes = await client.query(
          'SELECT budget, COALESCE(spent_amount, 0) as spent, name_ar FROM projects WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL) FOR UPDATE',
          [targetProjectId, entry.organizationId]
        );
        if (projRes.rows && projRes.rows.length > 0) {
          const budget = Number(projRes.rows[0].budget || 0);
          const spent = Number(projRes.rows[0].spent || 0);
          if (budget > 0) {
            const available = budget - spent;
            if (totalDebit > available) {
              throw new Error(
                `IPSAS Budget Hard-Lock Violation: Requested amount (${totalDebit}) exceeds available project budget (${available}) for '${projRes.rows[0].name_ar || targetProjectId}'`
              );
            }
          }
        }
      }

      // Get or verify fiscal year
      const fy = await client.query(
        `SELECT id, status FROM fiscal_years
         WHERE organization_id = $1 AND status = 'open'
         AND ((
           start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
         ) OR id = $2)
         LIMIT 1`,
        [entry.organizationId, entry.fiscalYearId || null]
      );
      const fiscalYearId = fy.rows[0]?.id || entry.fiscalYearId || null;
      if (!fiscalYearId || !fy.rows[0] || fy.rows[0].status !== 'open') {
        throw new Error('لا يمكن ترحيل القيد دون سنة مالية مفتوحة');
      }

      const accountIds = [...new Set(entry.lines.map(line => line.accountId))];
      const accounts = await client.query(
        `SELECT id FROM chart_of_accounts
         WHERE organization_id = $1 AND deleted_at IS NULL AND is_active = TRUE
           AND is_header = FALSE AND id = ANY($2::uuid[])`,
        [entry.organizationId, accountIds]
      );
      if (accounts.rows.length !== accountIds.length) {
        throw new Error('يوجد حساب غير نشط أو غير تابع للمنظمة الحالية');
      }

      // 1. Insert transaction header (column names match the real schema:
      // reference_number / created_by — NOT reference_no / created_by_id)
      const txResult = await client.query(
        `INSERT INTO transactions
         (organization_id, transaction_number, transaction_date, posting_date,
          transaction_type, description, reference_number, fiscal_year_id,
          total_debit, total_credit, status, created_by)
         VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE, $3, $4, $5, $6, $7, $8, 'POSTED', $9)
         RETURNING id, transaction_number`,
        [
          entry.organizationId,
          entry.transactionNumber || generateTxNumber(entry.transactionType.substring(0, 3)),
          entry.transactionType,
          entry.description,
          entry.referenceNumber || null,
          fiscalYearId,
          totalDebit,
          totalCredit,
          auth.userId,
        ]
      );

      const txId = txResult.rows[0].id;
      const txNumber = txResult.rows[0].transaction_number;

// 2. Insert transaction lines with full 7-dimensional support
      for (let i = 0; i < entry.lines.length; i++) {
        const line = entry.lines[i];
        await client.query(
          `INSERT INTO transaction_lines
           (transaction_id, organization_id, line_number, account_id,
            debit_amount, credit_amount, currency_code, description,
            project_id, activity_id, fund_id, donor_id, cost_center_id,
            intercompany_id, secondary_dimension_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            txId,
            entry.organizationId,
            i + 1,
            line.accountId,
            line.debit || 0,
            line.credit || 0,
            line.currencyCode || 'YER',
            line.description || entry.description,
            line.projectId || null,
            line.activityId || null,
            line.fundId || null,
            line.donorId || null,
            line.costCenterId || null,
            line.intercompanyId || null,
            line.secondaryDimensionId || null,
          ]
        );

        // 3. Update account balance (Debit normal for Asset/Expense, Credit normal for Liability/Equity/Revenue)
        await client.query(
          `UPDATE chart_of_accounts
           SET current_balance = current_balance + (
             CASE 
               WHEN UPPER(account_type) IN ('ASSET', 'EXPENSE') THEN ($1 - $2)
               ELSE ($2 - $1)
             END
           )
           WHERE id = $3 AND organization_id = $4 AND deleted_at IS NULL`,
          [line.debit, line.credit, line.accountId, entry.organizationId]
        );
      }

// 4. Audit log
       await client.query(
         `INSERT INTO audit_logs (organization_id, user_id, action, table_name, record_id, details)
          VALUES ($1, $2, 'CREATE', 'transactions', $3, $4)`,
         [
           entry.organizationId,
           auth.userId,
           txId,
           JSON.stringify({
             transactionNumber: txNumber,
             type: entry.transactionType,
             totalDebit,
             totalCredit,
             linesCount: entry.lines.length,
           }),
         ]
       ).catch((err) => { logger.warn(`[Finance] Failed to log voucher audit: ${err.message}`, { context: 'finance' }); });

       // 5. Immutable Audit Ledger Entry (SHA-256 Chain)
       const ledgerCount = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM immutable_audit_ledger WHERE organization_id = $1`,
        [entry.organizationId]
      );
      const ledgerNumber = parseInt(ledgerCount?.count || '0') + 1;

       return {
        transactionId: txId,
        transactionNumber: txNumber,
        totalAmount: totalDebit,
        linesCount: entry.lines.length,
        status: 'POSTED',
        postedBy: auth.email,
        postedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Reverse a posted transaction
   */
  static async reverseVoucher(transactionId: string, reason: string, auth: AuthContext) {
    return await transaction(async (client) => {
      // 1. Get original transaction
      const tx = await client.query(
        `SELECT * FROM transactions WHERE id = $1 AND status = 'POSTED'`,
        [transactionId]
      );
      if (tx.rows.length === 0) {
        throw new Error('Transaction not found or already reversed');
      }
      const original = tx.rows[0];

      // 2. Get original lines
      const lines = await client.query(
        `SELECT * FROM transaction_lines WHERE transaction_id = $1 ORDER BY line_number`,
        [transactionId]
      );

      // 3. Create reversal (swap debit/credit)
      const reversalNumber = generateTxNumber('REV');
      const revResult = await client.query(
        `INSERT INTO transactions
         (organization_id, transaction_number, transaction_date, posting_date,
          transaction_type, description, reference_number, total_debit, total_credit,
          status, created_by)
         VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE, 'ADJUSTMENT', $3, $4, $5, $6, 'POSTED', $7)
         RETURNING id`,
        [
          original.organization_id,
          reversalNumber,
          `Reversal of ${original.transaction_number}: ${reason}`,
          original.transaction_number,
          original.total_debit,
          original.total_credit,
          auth.userId,
        ]
      );

      const revId = revResult.rows[0].id;

      // 4. Insert reversal lines (swap debit/credit)
      for (const line of lines.rows) {
        await client.query(
          `INSERT INTO transaction_lines
           (transaction_id, organization_id, line_number, account_id,
            debit_amount, credit_amount, currency_code, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            revId,
            original.organization_id,
            line.line_number,
            line.account_id,
            line.credit_amount,  // swapped
            line.debit_amount,   // swapped
            line.currency_code,
            `Reversal: ${line.description || ''}`,
          ]
        );

        // Update account balance (reverse: swap debit and credit effects)
        await client.query(
          `UPDATE chart_of_accounts
           SET current_balance = current_balance + (
             CASE
               WHEN UPPER(account_type) IN ('ASSET', 'EXPENSE') THEN ($1 - $2)
               ELSE ($2 - $1)
             END
           )
           WHERE id = $3`,
          [line.credit_amount || 0, line.debit_amount || 0, line.account_id]
        );
      }

      // 5. Mark original as reversed
      await client.query(
        `UPDATE transactions SET status = 'REVERSED' WHERE id = $1`,
        [transactionId]
      );

      return {
        originalTransactionId: transactionId,
        reversalTransactionId: revId,
        reversalNumber,
        status: 'REVERSED',
      };
    });
  }

  /**
   * Get trial balance (IPSAS compliant)
   */
  static async getTrialBalance(orgId: string, fiscalYearId?: string) {
    let fyFilter = '';
    const params: any[] = [orgId];

    if (fiscalYearId) {
      fyFilter = `AND t.fiscal_year_id = $${params.length + 1}`;
      params.push(fiscalYearId);
    }

    const accounts = await queryMany(
      `SELECT
        coa.id as account_id,
        coa.account_code,
        coa.name_ar,
        coa.name_en,
        coa.account_type,
        COALESCE(SUM(tl.debit), 0) as total_debit,
        COALESCE(SUM(tl.credit), 0) as total_credit,
        (COALESCE(SUM(tl.debit), 0) - COALESCE(SUM(tl.credit), 0)) as net_balance
       FROM chart_of_accounts coa
       LEFT JOIN transaction_lines tl ON tl.account_id = coa.id
       LEFT JOIN transactions t ON t.id = tl.transaction_id AND t.status = 'POSTED'
       WHERE (coa.organization_id = $1 OR coa.organization_id IS NULL)
       ${fyFilter}
       GROUP BY coa.id, coa.account_code, coa.name_ar, coa.name_en, coa.account_type
       ORDER BY coa.account_code`,
      params
    );

    let sumDebit = 0;
    let sumCredit = 0;
    accounts.forEach((a: any) => {
      sumDebit += Number(a.total_debit);
      sumCredit += Number(a.total_credit);
    });

    return {
      standard: 'IPSAS',
      organizationId: orgId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalDebit: sumDebit,
        totalCredit: sumCredit,
        variance: Math.abs(sumDebit - sumCredit),
        isBalanced: Math.abs(sumDebit - sumCredit) < 0.01,
      },
      accounts,
    };
  }

  /**
   * Generate IPSAS Balance Sheet (Statement of Financial Position)
   */
  static async getBalanceSheet(orgId: string, asOfDate?: string) {
    const trialBalance = await this.getTrialBalance(orgId);
    const accounts = trialBalance.accounts;

    const assets = accounts
      .filter((a: any) => a.account_type === 'ASSET')
      .map((a: any) => ({ ...a, netBalance: Number(a.total_debit) - Number(a.total_credit) }));

    const liabilities = accounts
      .filter((a: any) => a.account_type === 'LIABILITY')
      .map((a: any) => ({ ...a, netBalance: Number(a.total_credit) - Number(a.total_debit) }));

    const equity = accounts
      .filter((a: any) => a.account_type === 'EQUITY')
      .map((a: any) => ({ ...a, netBalance: Number(a.total_credit) - Number(a.total_debit) }));

    const totalAssets = assets.reduce((s: number, a: any) => s + Math.abs(a.netBalance), 0);
    const totalLiabilities = liabilities.reduce((s: number, a: any) => s + Math.abs(a.netBalance), 0);
    const totalEquity = equity.reduce((s: number, a: any) => s + Math.abs(a.netBalance), 0);

    return {
      standard: 'IPSAS 1 - Statement of Financial Position',
      organizationId: orgId,
      asOfDate: asOfDate || new Date().toISOString(),
      balance: { totalAssets, totalLiabilities, totalEquity, isBalanced: Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01 },
      assets,
      liabilities,
      equity,
    };
  }

  /**
   * Generate IPSAS Income Statement (Statement of Financial Performance)
   */
  static async getIncomeStatement(orgId: string, period?: { start: string; end: string }) {
    const trialBalance = await this.getTrialBalance(orgId);
    const accounts = trialBalance.accounts;

    const revenues = accounts
      .filter((a: any) => a.account_type === 'REVENUE')
      .map((a: any) => ({ ...a, netBalance: Number(a.total_credit) - Number(a.total_debit) }));

    const expenses = accounts
      .filter((a: any) => a.account_type === 'EXPENSE')
      .map((a: any) => ({ ...a, netBalance: Number(a.total_debit) - Number(a.total_credit) }));

    const totalRevenues = revenues.reduce((s: number, a: any) => s + Math.abs(a.netBalance), 0);
    const totalExpenses = expenses.reduce((s: number, a: any) => s + Math.abs(a.netBalance), 0);

    return {
      standard: 'IPSAS 2 - Statement of Financial Performance',
      organizationId: orgId,
      period: period || { start: 'YTD', end: new Date().toISOString() },
      summary: {
        totalRevenues,
        totalExpenses,
        netSurplusDeficit: totalRevenues - totalExpenses,
      },
      revenues,
      expenses,
    };
  }

  /**
   * List transactions with pagination
   */
  static async listTransactions(orgId: string, pagination: PaginationParams = {}, filters?: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const conditions = ['t.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.type) { conditions.push(`t.transaction_type = $${idx++}`); params.push(filters.type); }
    if (filters?.status) { conditions.push(`t.status = $${idx++}`); params.push(filters.status); }
    if (filters?.startDate) { conditions.push(`t.transaction_date >= $${idx++}`); params.push(filters.startDate); }
    if (filters?.endDate) { conditions.push(`t.transaction_date <= $${idx++}`); params.push(filters.endDate); }

    const where = conditions.join(' AND ');

    return paginatedQuery(
      `SELECT t.*, u.name as created_by_name
       FROM transactions t
       LEFT JOIN users u ON u.id = t.created_by_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM transactions t WHERE ${where}`,
      params,
      pagination
    );
  }

  /**
   * Get transaction detail with lines
   */
  static async getTransactionDetail(transactionId: string) {
    const tx = await queryOne('SELECT * FROM transactions WHERE id = $1', [transactionId]);
    if (!tx) return null;

    const lines = await queryMany(
      `SELECT tl.*, coa.account_code, coa.name_ar as account_name_ar, coa.name_en as account_name_en
       FROM transaction_lines tl
       JOIN chart_of_accounts coa ON coa.id = tl.account_id
       WHERE tl.transaction_id = $1
       ORDER BY tl.line_number`,
      [transactionId]
    );

    return { ...tx, lines };
  }
}

// ─── Fiscal Year Management ────────────────────────────

export class FiscalYearService {
  static async list(orgId: string) {
    return queryMany(
      'SELECT * FROM fiscal_years WHERE organization_id = $1 ORDER BY year_number DESC',
      [orgId]
    );
  }

  static async create(orgId: string, data: {
    yearNumber: number;
    nameAr: string;
    startDate: string;
    endDate: string;
  }) {
    return await transaction(async (client) => {
      // Check no overlapping fiscal years
      const overlap = await client.query(
        `SELECT id FROM fiscal_years
         WHERE organization_id = $1
         AND ((start_date <= $3 AND end_date >= $2) OR (start_date <= $4 AND end_date >= $3))`,
        [orgId, data.startDate, data.endDate, data.endDate]
      );
      if (overlap.rows.length > 0) {
        throw new Error('Fiscal year overlaps with existing period');
      }

      const result = await client.query(
        `INSERT INTO fiscal_years (organization_id, year_number, name_ar, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, $5, 'open') RETURNING *`,
        [orgId, data.yearNumber, data.nameAr, data.startDate, data.endDate]
      );
      return result.rows[0];
    });
  }

  /**
   * Close fiscal year - carry forward balances
   */
  static async close(fiscalYearId: string, auth: AuthContext) {
    return await transaction(async (client) => {
      const fy = await client.query(
        `SELECT * FROM fiscal_years WHERE id = $1 AND status = 'open'`,
        [fiscalYearId]
      );
      if (fy.rows.length === 0) {
        throw new Error('Fiscal year not found or already closed');
      }

      const year = fy.rows[0];

      // Mark as closing
      await client.query(
        `UPDATE fiscal_years SET status = 'closing' WHERE id = $1`,
        [fiscalYearId]
      );

      // Get all accounts with balances
      const accounts = await client.query(
        `SELECT coa.id, coa.account_type, coa.current_balance
         FROM chart_of_accounts coa
         WHERE coa.organization_id = $1 AND coa.is_header = false AND coa.current_balance != 0`,
        [year.organization_id]
      );

      // Create closing entries
      const closingLines: any[] = [];
      let totalRevenue = 0;
      let totalExpense = 0;

      for (const account of accounts.rows) {
        if (account.account_type === 'REVENUE') {
          totalRevenue += Number(account.current_balance);
          closingLines.push({
            accountId: account.id,
            debit: Number(account.current_balance),
            credit: 0,
            description: 'Year-end revenue closing',
          });
        } else if (account.account_type === 'EXPENSE') {
          totalExpense += Math.abs(Number(account.current_balance));
          closingLines.push({
            accountId: account.id,
            debit: 0,
            credit: Math.abs(Number(account.current_balance)),
            description: 'Year-end expense closing',
          });
        }
      }

      // Post surplus/deficit to equity
      const surplus = totalRevenue - totalExpense;
      if (Math.abs(surplus) > 0.01) {
        // Find or use a retained earnings account
        const retainedEarnings = await client.query(
          `SELECT id FROM chart_of_accounts
           WHERE organization_id = $1 AND account_code = '3200' AND account_type = 'EQUITY'`,
          [year.organization_id]
        );

        if (retainedEarnings.rows.length > 0) {
          closingLines.push({
            accountId: retainedEarnings.rows[0].id,
            debit: surplus < 0 ? Math.abs(surplus) : 0,
            credit: surplus > 0 ? surplus : 0,
            description: `Year ${year.year_number} net surplus/deficit`,
          });
        }
      }

      // Post closing voucher
      if (closingLines.length > 0) {
        const closingNumber = `CLS-${year.year_number}`;
        await client.query(
          `INSERT INTO transactions
           (organization_id, transaction_number, transaction_date, posting_date,
            transaction_type, description, total_debit, total_credit, status, created_by_id)
           VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE, 'ADJUSTMENT', $3, $4, $5, 'POSTED', $6)`,
          [
            year.organization_id,
            closingNumber,
            `Fiscal Year ${year.year_number} Closing`,
            totalRevenue + totalExpense,
            totalRevenue + totalExpense,
            auth.userId,
          ]
        );
      }

      // Close the year
      await client.query(
        `UPDATE fiscal_years SET status = 'closed' WHERE id = $1`,
        [fiscalYearId]
      );

      return {
        fiscalYearId,
        yearNumber: year.year_number,
        totalRevenue,
        totalExpenses: totalExpense,
        netSurplusDeficit: surplus,
        closingEntriesCount: closingLines.length,
        status: 'CLOSED',
      };
    });
  }
}

// ─── Budget Management ─────────────────────────────────

export class BudgetService {
  static async list(orgId: string, fiscalYearId?: string) {
    let where = 'bl.organization_id = $1';
    const params: any[] = [orgId];

    if (fiscalYearId) {
      where += ' AND bl.fiscal_year_id = $2';
      params.push(fiscalYearId);
    }

    return queryMany(
      `SELECT bl.*, coa.account_code, coa.name_ar as account_name_ar,
              p.name_ar as project_name_ar
       FROM budget_lines bl
       JOIN chart_of_accounts coa ON coa.id = bl.account_id
       LEFT JOIN projects p ON p.id = bl.project_id
       WHERE ${where}
       ORDER BY coa.account_code`,
      params
    );
  }

  static async create(orgId: string, data: {
    fiscalYearId: string;
    accountId: string;
    projectId?: string;
    allocatedBudget: number;
    currencyCode?: string;
  }) {
    const result = await queryOne(
      `INSERT INTO budget_lines
       (organization_id, fiscal_year_id, account_id, project_id, allocated_budget, spent_amount, currency_code)
       VALUES ($1, $2, $3, $4, $5, 0, $6) RETURNING *`,
      [
        orgId,
        data.fiscalYearId,
        data.accountId,
        data.projectId || null,
        data.allocatedBudget,
        data.currencyCode || 'YER',
      ]
    );
    return result;
  }

  static async getVariance(orgId: string, fiscalYearId: string) {
    return queryMany(
      `SELECT
        bl.id,
        coa.account_code,
        coa.name_ar as account_name,
        p.name_ar as project_name,
        bl.allocated_budget,
        bl.spent_amount,
        (bl.allocated_budget - bl.spent_amount) as remaining,
        CASE WHEN bl.allocated_budget > 0
          THEN ROUND((bl.spent_amount / bl.allocated_budget * 100)::numeric, 2)
          ELSE 0 END as utilization_pct
       FROM budget_lines bl
       JOIN chart_of_accounts coa ON coa.id = bl.account_id
       LEFT JOIN projects p ON p.id = bl.project_id
       WHERE bl.organization_id = $1 AND bl.fiscal_year_id = $2
       ORDER BY coa.account_code`,
      [orgId, fiscalYearId]
    );
  }
}

// ─── Multi-Currency Support ────────────────────────────

export class CurrencyService {
  static async list(orgId: string) {
    return queryMany(
      'SELECT * FROM currencies ORDER BY code',
      []
    );
  }

  static async getExchangeRate(orgId: string, fromCurrency: string, toCurrency: string) {
    if (fromCurrency === toCurrency) return { rate: 1, fromCurrency, toCurrency };

    const rate = await queryOne(
      `SELECT rate FROM exchange_rates
       WHERE organization_id = $1 AND from_currency = $2 AND to_currency = $3
       ORDER BY effective_date DESC LIMIT 1`,
      [orgId, fromCurrency, toCurrency]
    );

    return {
      rate: rate?.rate || 1,
      fromCurrency,
      toCurrency,
      effectiveDate: rate ? new Date().toISOString() : null,
    };
  }

  static async updateRate(orgId: string, fromCurrency: string, toCurrency: string, rate: number) {
    return queryOne(
      `INSERT INTO exchange_rates (organization_id, from_currency, to_currency, rate, effective_date)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [orgId, fromCurrency, toCurrency, rate]
    );
  }

  static async convert(amount: number, fromCurrency: string, toCurrency: string, orgId: string) {
    const rateData = await this.getExchangeRate(orgId, fromCurrency, toCurrency);
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(amount * Number(rateData.rate) * 100) / 100,
      targetCurrency: toCurrency,
      rate: rateData.rate,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// Immutable Audit Ledger Service (SHA-256 Chain)
// ═══════════════════════════════════════════════════════════════

export class ImmutableLedgerService {
  private static readonly GENESIS_HASH = '0'.repeat(64);

  static async createLedgerEntry(orgId: string, journalHeaderId: string, ledgerNumber: number) {
    return await transaction(async (client) => {
      const previousHash = await queryOne<{ ledger_hash?: string }>(
        `SELECT ledger_hash FROM immutable_audit_ledger
         WHERE organization_id = $1 ORDER BY ledger_number DESC LIMIT 1`,
        [orgId]
      );

      const prevHash = previousHash?.ledger_hash || this.GENESIS_HASH;
      const ledgerHash = this.generateHash(orgId, journalHeaderId, prevHash, ledgerNumber);

      await client.query(
        `INSERT INTO immutable_audit_ledger
         (organization_id, journal_header_id, ledger_hash, previous_ledger_hash, ledger_number, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orgId, journalHeaderId, ledgerHash, prevHash, ledgerNumber, 'system']
      );

      return { ledgerHash, previousHash: prevHash, ledgerNumber };
    });
  }

  static async verifyChain(orgId: string): Promise<boolean> {
    const result = await queryMany(
      `SELECT ledger_hash, previous_ledger_hash, ledger_number
       FROM immutable_audit_ledger WHERE organization_id = $1 ORDER BY ledger_number ASC`,
      [orgId]
    );

    let prevHash = this.GENESIS_HASH;
    for (const row of result) {
      const expected = this.generateHash(orgId, row.ledger_hash, prevHash, row.ledger_number);
      if (row.ledger_hash !== expected || row.previous_ledger_hash !== prevHash) {
        return false;
      }
      prevHash = row.ledger_hash;
    }
    return true;
  }

  private static generateHash(orgId: string, journalHeaderId: string, previousHash: string, ledgerNumber: number): string {
    const data = `${orgId}:${journalHeaderId}:${previousHash}:${ledgerNumber}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// ═══════════════════════════════════════════════════════════════
// Period Lock Service (Soft/Hard Lock)
// ═══════════════════════════════════════════════════════════════

export class PeriodLockService {
  static async softLockPeriod(orgId: string, fiscalPeriodId: string, lockedBy: string) {
    return await transaction(async (client) => {
      await client.query(
        `UPDATE fiscal_periods SET is_soft_locked = TRUE, soft_locked_at = NOW(), locked_by = $1
         WHERE id = $2 AND organization_id = $3`,
        [lockedBy, fiscalPeriodId, orgId]
      );
      await client.query(
        `INSERT INTO period_lock_log (organization_id, fiscal_period_id, lock_type, action, performed_by, performed_by_role)
         VALUES ($1, $2, 'SOFT', 'LOCK', $3, 'FINANCIAL_MANAGER')`,
        [orgId, fiscalPeriodId, lockedBy]
      );
    });
  }

  static async hardLockPeriod(orgId: string, fiscalPeriodId: string, lockedBy: string) {
    return await transaction(async (client) => {
      await client.query(
        `UPDATE fiscal_periods SET is_soft_locked = TRUE, is_hard_closed = TRUE, soft_locked_at = NOW(), locked_by = $1
         WHERE id = $2 AND organization_id = $3`,
        [lockedBy, fiscalPeriodId, orgId]
      );
      await client.query(
        `INSERT INTO period_lock_log (organization_id, fiscal_period_id, lock_type, action, performed_by, performed_by_role)
         VALUES ($1, $2, 'HARD', 'LOCK', $3, 'CFO')`,
        [orgId, fiscalPeriodId, lockedBy]
      );
    });
  }

  static async isPeriodLocked(orgId: string, fiscalPeriodId: string): Promise<boolean> {
    const result = await queryOne<{ is_soft_locked: boolean; is_hard_closed: boolean }>(
      `SELECT is_soft_locked, is_hard_closed FROM fiscal_periods WHERE id = $1 AND organization_id = $2`,
      [fiscalPeriodId, orgId]
    );
    return !!(result && (result.is_soft_locked || result.is_hard_closed));
  }

  static async validatePeriodForPosting(orgId: string, fiscalPeriodId: string) {
    const locked = await this.isPeriodLocked(orgId, fiscalPeriodId);
    if (locked) {
      const result = await queryOne<{ is_hard_closed: boolean }>(
        `SELECT is_hard_closed FROM fiscal_periods WHERE id = $1 AND organization_id = $2`,
        [fiscalPeriodId, orgId]
      );
      if (result?.is_hard_closed) {
        throw new Error('Period is permanently closed (Hard Lock). No modifications allowed.');
      }
      throw new Error('Period is soft-locked. CFO approval required for posting.');
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Fund Accounting Service (IPSAS 23)
// ═══════════════════════════════════════════════════════════════

export class FundAccountingService {
  static async getFundBalance(orgId: string, fundId: string, donorId?: string): Promise<any> {
    return queryOne(
      `SELECT * FROM fund_balances WHERE organization_id = $1 AND fund_id = $2 AND donor_id = $3`,
      [orgId, fundId, donorId || null]
    );
  }

  static async updateFundBalance(orgId: string, fundId: string, amount: number, type: 'DEBIT' | 'CREDIT') {
    return await transaction(async (client) => {
      const balance = await client.query(
        `SELECT * FROM fund_balances WHERE organization_id = $1 AND fund_id = $2`,
        [orgId, fundId]
      );
      if (balance.rows.length === 0) {
        throw new Error(`Fund balance not found for fund ${fundId}`);
      }
      const current = Number(balance.rows[0].current_balance);
      const newBalance = type === 'DEBIT' ? current + amount : current - amount;
      await client.query(
        `UPDATE fund_balances SET current_balance = $1, total_disbursements = total_disbursements + $2 WHERE organization_id = $3 AND fund_id = $4`,
        [newBalance, amount, orgId, fundId]
      );
    });
  }

  static async validateRestrictedFund(fundType: string, purpose: string): Promise<void> {
    if (fundType === 'PERMANENTLY_RESTRICTED' && purpose !== 'INVESTMENT_INCOME') {
      throw new Error('Permanently restricted funds cannot be used for this purpose (IPSAS 23)');
    }
    if (fundType === 'TEMPORARILY_RESTRICTED' && purpose !== 'RESTRICTED_PURPOSE') {
      throw new Error('Temporarily restricted funds can only be used for their designated purpose');
    }
  }

  static async enforceFundDimension(fundId: string | null): Promise<void> {
    if (!fundId) {
      throw new Error('Fund/Donor segment is mandatory for all journal entries (IPSAS 23 Compliance)');
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Document Splitting Engine
// ═══════════════════════════════════════════════════════════════

export class DocumentSplittingEngine {
  static splitVoucher(entry: VoucherEntry): VoucherEntry[] {
    const grouped = new Map<string, VoucherEntry>();
    for (const line of entry.lines) {
      const key = `${line.projectId || 'DEFAULT'}-${line.donorId || 'GENERAL'}-${line.costCenterId || 'MAIN'}`;
      if (!grouped.has(key)) {
        grouped.set(key, { ...entry, lines: [] });
      }
      const group = grouped.get(key)!;
      group.lines.push(line);
    }
    const result: VoucherEntry[] = [];
    grouped.forEach((voucher) => {
      const totalDebit = voucher.lines.reduce((s, l) => s + Number(l.debit), 0);
      const totalCredit = voucher.lines.reduce((s, l) => s + Number(l.credit), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error('Split voucher is not balanced');
      }
      result.push(voucher);
    });
    return result;
  }
}

// ═══════════════════════════════════════════════════════════════
// Fixed Asset Service (IPSAS 17)
// ═══════════════════════════════════════════════════════════════

export class FixedAssetService {
  static async createAsset(orgId: string, data: any) {
    return await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO fixed_assets
         (organization_id, asset_code, name_ar, name_en, asset_group, acquisition_date, acquisition_cost,
          useful_life_months, depreciation_method, salvage_value, location, serial_number, fund_id, donor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          orgId, data.assetCode, data.nameAr, data.nameEn, data.assetGroup,
          data.acquisitionDate, data.acquisitionCost, data.usefulLifeMonths,
          data.depreciationMethod, data.salvageValue, data.location, data.serialNumber,
          data.fundId, data.donorId
        ]
      );
      const asset = result.rows[0];
      await client.query(
        `INSERT INTO journal_headers (organization_id, voucher_number, transaction_date, fiscal_period_id,
         currency_code, total_debit, total_credit, status, voucher_type, description, created_by)
         VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $5, 'POSTED', 'ASSET_ACQUISITION', $6, $7)`,
        [orgId, `AST-${asset.id}`, data.fiscalPeriodId, 'USD', data.acquisitionCost, data.acquisitionCost, 'Asset Acquisition Entry']
      );
      return asset;
    });
  }

  static async runDepreciation(orgId: string, fiscalPeriodId: string) {
    return await transaction(async (client) => {
      const assets = await client.query(
        `SELECT * FROM fixed_assets WHERE organization_id = $1 AND asset_status = 'IN_USE' AND is_active = TRUE`,
        [orgId]
      );
      for (const asset of assets.rows) {
        const monthlyDepreciation = this.calculateDepreciation(asset);
        await client.query(
          `INSERT INTO depreciation_schedule
           (organization_id, asset_id, fiscal_period_id, period_number, depreciation_amount,
            accumulated_to_date, remaining_depreciable, depreciation_method, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'POSTED')`,
          [orgId, asset.id, fiscalPeriodId, new Date().getMonth() + 1, monthlyDepreciation,
           asset.accumulated_depreciation + monthlyDepreciation,
           asset.acquisition_cost - asset.accumulated_depreciation - monthlyDepreciation,
           asset.depreciation_method]
        );
        await client.query(
          `UPDATE fixed_assets SET accumulated_depreciation = accumulated_depreciation + $1 WHERE id = $2`,
          [monthlyDepreciation, asset.id]
        );
        await client.query(
          `INSERT INTO journal_headers (organization_id, voucher_number, transaction_date, fiscal_period_id,
           currency_code, total_debit, total_credit, status, voucher_type, description, created_by)
           VALUES ($1, $2, CURRENT_DATE, $3, 'USD', $4, $4, 'POSTED', 'DEPRECIATION', $5, 'system')`,
          [orgId, `DEP-${asset.id}-${fiscalPeriodId}`, fiscalPeriodId, monthlyDepreciation, `Depreciation for ${asset.asset_code}`]
        );
      }
    });
  }

  private static calculateDepreciation(asset: any): number {
    const depreciableBase = asset.acquisition_cost - asset.salvage_value;
    switch (asset.depreciation_method) {
      case 'STRAIGHT_LINE':
        return Math.round((depreciableBase / asset.useful_life_months) * 100) / 100;
      case 'SUM_OF_YEARS': {
        const totalMonths = asset.useful_life_months;
        const remainingMonths = totalMonths - (Math.floor(asset.accumulated_depreciation / (depreciableBase / totalMonths)) * 12);
        const sumOfYears = (totalMonths * (totalMonths + 1)) / 2;
        return Math.round((depreciableBase * remainingMonths / sumOfYears / 12) * 100) / 100;
      }
      case 'UNITS_OF_PRODUCTION':
        return Math.round((depreciableBase * 0.01) * 100) / 100;
      default:
        return Math.round((depreciableBase / asset.useful_life_months) * 100) / 100;
    }
  }
}
