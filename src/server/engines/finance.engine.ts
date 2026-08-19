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

  static async getById(id: string) {
    return queryOne('SELECT * FROM chart_of_accounts WHERE id = $1', [id]);
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

  static async update(id: string, data: {
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
    values.push(id);

    const result = await queryOne(
      `UPDATE chart_of_accounts SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result;
  }

  static async delete(id: string) {
    // Soft delete - check for transactions first
    const txCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM transaction_lines WHERE account_id = $1`,
      [id]
    );
    if (parseInt(txCount?.count || '0') > 0) {
      throw new Error('Cannot delete account with existing transactions. Deactivate instead.');
    }
    await query('UPDATE chart_of_accounts SET deleted_at = NOW() WHERE id = $1', [id]);
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
    // Validate balance
    const totalDebit = entry.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = entry.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`IPSAS Validation: Debit (${totalDebit}) ≠ Credit (${totalCredit})`);
    }

    if (totalDebit === 0) {
      throw new Error('Transaction amount cannot be zero');
    }

    if (entry.lines.length < 2) {
      throw new Error('Double-entry requires at least 2 lines');
    }

    return await transaction(async (client) => {
      // Get or verify fiscal year
      const fy = await client.query(
        `SELECT id, status FROM fiscal_years
         WHERE organization_id = $1 AND status = 'open'
         AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
         LIMIT 1`,
        [entry.organizationId]
      );
      const fiscalYearId = fy.rows[0]?.id || entry.fiscalYearId || null;

      // 1. Insert transaction header
      const txResult = await client.query(
        `INSERT INTO transactions
         (organization_id, transaction_number, transaction_date, posting_date,
          transaction_type, description, reference_no, fiscal_year_id,
          total_debit, total_credit, status, created_by_id)
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

      // 2. Insert transaction lines
      for (let i = 0; i < entry.lines.length; i++) {
        const line = entry.lines[i];
        await client.query(
          `INSERT INTO transaction_lines
           (transaction_id, organization_id, line_number, account_id,
            debit, credit, currency_code, exchange_rate, description,
            project_id, activity_id, party_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            txId,
            entry.organizationId,
            i + 1,
            line.accountId,
            line.debit || 0,
            line.credit || 0,
            line.currencyCode || 'YER',
            line.exchangeRate || 1,
            line.description || entry.description,
            line.projectId || null,
            line.activityId || null,
            line.partyId || null,
          ]
        );

        // 3. Update account balance
        if (line.debit > 0) {
          await client.query(
            `UPDATE chart_of_accounts
             SET current_balance = current_balance + $1
             WHERE id = $2`,
            [line.debit, line.accountId]
          );
        }
        if (line.credit > 0) {
          await client.query(
            `UPDATE chart_of_accounts
             SET current_balance = current_balance - $1
             WHERE id = $2`,
            [line.credit, line.accountId]
          );
        }
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
      ).catch(() => {});

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
          transaction_type, description, reference_no, total_debit, total_credit,
          status, created_by_id)
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
            debit, credit, currency_code, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            revId,
            original.organization_id,
            line.line_number,
            line.account_id,
            line.credit,  // swapped
            line.debit,   // swapped
            line.currency_code,
            `Reversal: ${line.description || ''}`,
          ]
        );

        // Update account balance (reverse)
        if (line.debit > 0) {
          await client.query(
            'UPDATE chart_of_accounts SET current_balance = current_balance - $1 WHERE id = $2',
            [line.debit, line.account_id]
          );
        }
        if (line.credit > 0) {
          await client.query(
            'UPDATE chart_of_accounts SET current_balance = current_balance + $1 WHERE id = $2',
            [line.credit, line.account_id]
          );
        }
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
