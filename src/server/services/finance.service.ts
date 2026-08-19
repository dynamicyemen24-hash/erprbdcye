import { getDatabasePool, withTransaction } from './db.service';
import { serverConfig } from '../config/index';

export class IPSASFinanceService {
  /**
   * Generates live Trial Balance from double-entry ledger
   */
  static async getTrialBalance(orgId: string = serverConfig.defaultOrgId) {
    const pool = getDatabasePool();
    const query = `
      SELECT 
        coa.id as account_id,
        coa.account_code,
        coa.name_ar,
        coa.name_en,
        coa.account_type,
        COALESCE(SUM(tl.debit_amount), 0) as total_debit,
        COALESCE(SUM(credit_amount), 0) as total_credit,
        (COALESCE(SUM(tl.debit_amount), 0) - COALESCE(SUM(tl.credit_amount), 0)) as net_balance
      FROM chart_of_accounts coa
      LEFT JOIN transaction_lines tl ON tl.account_id = coa.id
      WHERE coa.organization_id = $1 OR coa.organization_id IS NULL
      GROUP BY coa.id, coa.account_code, coa.name_ar, coa.name_en, coa.account_type
      ORDER BY coa.account_code ASC;
    `;
    const result = await pool.query(query, [orgId]);

    const rows = result.rows;
    let sumDebit = 0;
    let sumCredit = 0;

    rows.forEach((r: any) => {
      sumDebit += Number(r.total_debit);
      sumCredit += Number(r.total_credit);
    });

    return {
      status: 'success',
      standard: 'IPSAS / International Public Sector Accounting Standards',
      organizationId: orgId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalDebit: sumDebit,
        totalCredit: sumCredit,
        variance: Math.abs(sumDebit - sumCredit),
        isBalanced: Math.abs(sumDebit - sumCredit) < 0.001
      },
      accounts: rows
    };
  }

  /**
   * Generates IPSAS Balance Sheet (Statement of Financial Position)
   */
  static async getBalanceSheet(orgId: string = serverConfig.defaultOrgId) {
    const trialBalance = await this.getTrialBalance(orgId);
    const accounts = trialBalance.accounts;

    const assets = accounts.filter((a: any) => a.account_type === 'ASSET' || a.account_code.startsWith('1'));
    const liabilities = accounts.filter((a: any) => a.account_type === 'LIABILITY' || a.account_code.startsWith('2'));
    const equity = accounts.filter((a: any) => a.account_type === 'EQUITY' || a.account_code.startsWith('3'));

    const totalAssets = assets.reduce((sum: number, a: any) => sum + Number(a.net_balance), 0);
    const totalLiabilities = liabilities.reduce((sum: number, a: any) => sum + Math.abs(Number(a.net_balance)), 0);
    const totalEquity = equity.reduce((sum: number, a: any) => sum + Math.abs(Number(a.net_balance)), 0);

    return {
      status: 'success',
      standard: 'IPSAS 1 - Presentation of Financial Statements',
      organizationId: orgId,
      generatedAt: new Date().toISOString(),
      totalAssets,
      totalLiabilities,
      totalEquity,
      assets,
      liabilities,
      equity
    };
  }

  /**
   * Generates IPSAS Income Statement (Statement of Financial Performance)
   */
  static async getIncomeStatement(orgId: string = serverConfig.defaultOrgId) {
    const trialBalance = await this.getTrialBalance(orgId);
    const accounts = trialBalance.accounts;

    const revenues = accounts.filter((a: any) => a.account_type === 'REVENUE' || a.account_code.startsWith('3') || a.account_code.startsWith('4'));
    const expenses = accounts.filter((a: any) => a.account_type === 'EXPENSE' || a.account_code.startsWith('5'));

    const totalRevenues = revenues.reduce((sum: number, a: any) => sum + Math.abs(Number(a.net_balance)), 0);
    const totalExpenses = expenses.reduce((sum: number, a: any) => sum + Number(a.net_balance), 0);
    const netSurplusDeficit = totalRevenues - totalExpenses;

    return {
      status: 'success',
      standard: 'IPSAS 2 - Statement of Financial Performance',
      organizationId: orgId,
      generatedAt: new Date().toISOString(),
      totalRevenues,
      totalExpenses,
      netSurplusDeficit,
      revenues,
      expenses
    };
  }

  /**
   * Atomic creation of double-entry voucher with balanced lines
   */
  static async postDoubleEntryVoucher(voucher: {
    organizationId: string;
    transactionNumber: string;
    transactionType: string;
    description: string;
    referenceNumber?: string;
    projectId?: string;
    lines: Array<{
      accountId: string;
      accountCode?: string;
      debit: number;
      credit: number;
      description?: string;
      projectId?: string;
    }>;
  }) {
    // Validate balance
    const totalDebit = voucher.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = voucher.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`IPSAS Ledger Validation Failed: Total Debit (${totalDebit}) does not equal Total Credit (${totalCredit})`);
    }

    return await withTransaction(async (client) => {
      const txRes = await client.query(`
        INSERT INTO transactions (
          organization_id, transaction_number, transaction_date, posting_date,
          transaction_type, status_code, reference_number, total_debit, total_credit,
          description, is_posted
        ) VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE, $3, 'POSTED', $4, $5, $6, $7, true)
        RETURNING id;
      `, [
        voucher.organizationId,
        voucher.transactionNumber,
        voucher.transactionType,
        voucher.referenceNumber || null,
        totalDebit,
        totalCredit,
        voucher.description
      ]);

      const txId = txRes.rows[0].id;

      for (let i = 0; i < voucher.lines.length; i++) {
        const line = voucher.lines[i];
        await client.query(`
          INSERT INTO transaction_lines (
            transaction_id, organization_id, line_number, account_id, account_code,
            debit_amount, credit_amount, currency_code, description, project_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'YER', $8, $9);
        `, [
          txId,
          voucher.organizationId,
          i + 1,
          line.accountId,
          line.accountCode || null,
          line.debit || 0,
          line.credit || 0,
          line.description || voucher.description,
          line.projectId || voucher.projectId || null
        ]);
      }

      return {
        transactionId: txId,
        transactionNumber: voucher.transactionNumber,
        totalAmount: totalDebit,
        linesCount: voucher.lines.length,
        status: 'POSTED'
      };
    });
  }
}
