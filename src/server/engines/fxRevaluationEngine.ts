/**
 * NexoraOS™ — IPSAS 4 Foreign Exchange Revaluation & Settlement Engine
 * Automatic FX Gain/Loss calculation, variance threshold enforcement, and period-end settlement posting
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { generateTxNumber, auditLog, AuthContext } from '../core/helpers';
import logger from '../core/logger';

export interface FXRateMap {
  [currencyCode: string]: number; // Rate relative to Base Currency (e.g., 1 YER = 0.004 USD)
}

export interface RevaluationItem {
  accountId: string;
  accountCode: string;
  nameAr: string;
  currencyCode: string;
  foreignBalance: number;
  bookValueUSD: number;
  currentRate: number;
  revaluedValueUSD: number;
  unrealizedGainLossUSD: number;
}

export interface FXRevaluationResult {
  organizationId: string;
  periodEndingDate: string;
  baseCurrency: string;
  items: RevaluationItem[];
  totalUnrealizedGainUSD: number;
  totalUnrealizedLossUSD: number;
  netUnrealizedGainLossUSD: number;
  varianceThresholdExceeded: boolean;
  maxVariancePct: number;
}

export class FXRevaluationEngine {
  // Benchmark IPSAS exchange rates relative to USD
  private static DEFAULT_RATES: FXRateMap = {
    USD: 1.0,
    SAR: 0.2667,  // 1 SAR = 0.2667 USD
    YER: 0.0040,  // 1 YER = 0.0040 USD
    EUR: 1.0850,  // 1 EUR = 1.0850 USD
  };

  /**
   * Calculates IPSAS 4 unrealized foreign exchange gains/losses per account
   */
  static async calculateRevaluation(
    orgId: string,
    periodEndingDate?: string,
    customRates?: FXRateMap,
    baseCurrency = 'USD'
  ): Promise<FXRevaluationResult> {
    const rates: FXRateMap = { ...this.DEFAULT_RATES, ...(customRates || {}) };
    const cutoffDate = periodEndingDate || new Date().toISOString().split('T')[0];

    // Query all foreign currency balances grouped by account & currency
    const queryStr = `
      SELECT 
        coa.id as account_id,
        coa.account_code,
        coa.name_ar,
        coa.account_type,
        tl.currency_code,
        COALESCE(SUM(tl.debit - tl.credit), 0) as net_foreign_balance,
        COALESCE(SUM((tl.debit - tl.credit) * COALESCE(tl.exchange_rate, 1)), 0) as book_value_usd
      FROM transaction_lines tl
      JOIN chart_of_accounts coa ON coa.id = tl.account_id
      JOIN transactions t ON t.id = tl.transaction_id
      WHERE (tl.organization_id = $1 OR $1 IS NULL)
        AND t.posting_date <= $2
        AND tl.currency_code IS NOT NULL
        AND tl.currency_code != $3
      GROUP BY coa.id, coa.account_code, coa.name_ar, coa.account_type, tl.currency_code
      HAVING COALESCE(SUM(tl.debit - tl.credit), 0) != 0;
    `;

    let rows: any[] = [];
    try {
      rows = await queryMany(queryStr, [orgId, cutoffDate, baseCurrency]);
    } catch (err: any) {
      logger.error('FX Revaluation query failed', { context: 'fx-engine', error: { name: 'QueryError', message: err.message } });
      rows = [];
    }

    const items: RevaluationItem[] = [];
    let totalGain = 0;
    let totalLoss = 0;
    let maxVariance = 0;

    for (const row of rows) {
      const foreignBalance = Number(row.net_foreign_balance);
      const bookValueUSD = Number(row.book_value_usd);
      const currency = row.currency_code;
      const rate = rates[currency] || 1.0;

      const revaluedUSD = Math.round(foreignBalance * rate * 100) / 100;
      const diffUSD = Math.round((revaluedUSD - bookValueUSD) * 100) / 100;

      if (diffUSD > 0) totalGain += diffUSD;
      else if (diffUSD < 0) totalLoss += Math.abs(diffUSD);

      if (bookValueUSD !== 0) {
        const varPct = Math.abs((diffUSD / bookValueUSD) * 100);
        if (varPct > maxVariance) maxVariance = Math.round(varPct * 100) / 100;
      }

      items.push({
        accountId: row.account_id,
        accountCode: row.account_code,
        nameAr: row.name_ar,
        currencyCode: currency,
        foreignBalance,
        bookValueUSD,
        currentRate: rate,
        revaluedValueUSD: revaluedUSD,
        unrealizedGainLossUSD: diffUSD,
      });
    }

    const netGainLoss = Math.round((totalGain - totalLoss) * 100) / 100;
    const thresholdExceeded = maxVariance > 5.0; // Standard 5% variance limit

    return {
      organizationId: orgId,
      periodEndingDate: cutoffDate,
      baseCurrency,
      items,
      totalUnrealizedGainUSD: Math.round(totalGain * 100) / 100,
      totalUnrealizedLossUSD: Math.round(totalLoss * 100) / 100,
      netUnrealizedGainLossUSD: netGainLoss,
      varianceThresholdExceeded: thresholdExceeded,
      maxVariancePct: maxVariance,
    };
  }

  /**
   * Checks whether FX variance exceeds maximum tolerance threshold (e.g. 5%)
   */
  static async checkFXVarianceLimit(
    orgId: string,
    maxAllowedVariancePct = 5.0,
    customRates?: FXRateMap
  ): Promise<{ withinLimit: boolean; maxVariancePct: number; details: string }> {
    const result = await this.calculateRevaluation(orgId, undefined, customRates);
    const withinLimit = result.maxVariancePct <= maxAllowedVariancePct;

    const details = withinLimit
      ? `FX Variance is within safety threshold (${result.maxVariancePct}% <= ${maxAllowedVariancePct}%)`
      : `IPSAS FX Lock: Maximum currency variance (${result.maxVariancePct}%) exceeds safety limit of ${maxAllowedVariancePct}%! Revaluation settlement required.`;

    if (!withinLimit) {
      logger.warn('FX Variance Threshold Exceeded', { context: 'fx-engine', meta: { maxVariancePct: result.maxVariancePct } });
    }

    return {
      withinLimit,
      maxVariancePct: result.maxVariancePct,
      details,
    };
  }

  /**
   * Posts automatic end-of-month IPSAS double-entry settlement journal voucher
   */
  static async postPeriodEndRevaluationEntry(
    orgId: string,
    periodEndingDate: string,
    auth: AuthContext,
    customRates?: FXRateMap
  ): Promise<{ transactionId: string; transactionNumber: string; netGainLossUSD: number; status: string }> {
    const calc = await this.calculateRevaluation(orgId, periodEndingDate, customRates);

    if (calc.items.length === 0 || calc.netUnrealizedGainLossUSD === 0) {
      return {
        transactionId: '',
        transactionNumber: '',
        netGainLossUSD: 0,
        status: 'NO_VARIANCE_FOUND',
      };
    }

    return await transaction(async (client) => {
      const txNumber = generateTxNumber('FXR');
      const totalAmount = Math.abs(calc.netUnrealizedGainLossUSD);

      // Insert transaction header
      const txRes = await client.query(
        `INSERT INTO transactions
         (organization_id, transaction_number, transaction_date, posting_date,
          transaction_type, description, reference_no, total_debit, total_credit, status, created_by_id)
         VALUES ($1, $2, $3, $3, 'ADJUSTMENT', $4, $5, $6, $6, 'POSTED', $7)
         RETURNING id`,
        [
          orgId,
          txNumber,
          periodEndingDate,
          `IPSAS 4 End-of-Month FX Revaluation Settlement (${periodEndingDate})`,
          `FX-REVAL-${periodEndingDate}`,
          totalAmount,
          auth.userId,
        ]
      );

      const txId = txRes.rows[0].id;

      // Query FX Gain (4901) & FX Loss (5901) Accounts
      const gainAcc = await client.query(
        "SELECT id FROM chart_of_accounts WHERE account_code = '4901' OR name_ar LIKE '%فروق%' OR account_type = 'REVENUE' LIMIT 1"
      );
      const lossAcc = await client.query(
        "SELECT id FROM chart_of_accounts WHERE account_code = '5901' OR name_ar LIKE '%فروق%' OR account_type = 'EXPENSE' LIMIT 1"
      );

      const gainAccId = gainAcc.rows[0]?.id || null;
      const lossAccId = lossAcc.rows[0]?.id || null;

      let lineIdx = 1;
      for (const item of calc.items) {
        if (item.unrealizedGainLossUSD === 0) continue;

        if (item.unrealizedGainLossUSD > 0 && gainAccId) {
          // Gain: Debit Account, Credit FX Gain Account
          await client.query(
            `INSERT INTO transaction_lines
             (transaction_id, organization_id, line_number, account_id, debit, credit, currency_code, description)
             VALUES ($1, $2, $3, $4, $5, 0, 'USD', $6)`,
            [txId, orgId, lineIdx++, item.accountId, item.unrealizedGainLossUSD, `FX Revaluation Gain - ${item.nameAr}`]
          );
          await client.query(
            `INSERT INTO transaction_lines
             (transaction_id, organization_id, line_number, account_id, debit, credit, currency_code, description)
             VALUES ($1, $2, $3, $4, 0, $5, 'USD', $6)`,
            [txId, orgId, lineIdx++, gainAccId, item.unrealizedGainLossUSD, `Unrealized FX Gain - ${item.currencyCode}`]
          );
        } else if (item.unrealizedGainLossUSD < 0 && lossAccId) {
          // Loss: Debit FX Loss Account, Credit Account
          const lossAmt = Math.abs(item.unrealizedGainLossUSD);
          await client.query(
            `INSERT INTO transaction_lines
             (transaction_id, organization_id, line_number, account_id, debit, credit, currency_code, description)
             VALUES ($1, $2, $3, $4, $5, 0, 'USD', $6)`,
            [txId, orgId, lineIdx++, lossAccId, lossAmt, `Unrealized FX Loss - ${item.currencyCode}`]
          );
          await client.query(
            `INSERT INTO transaction_lines
             (transaction_id, organization_id, line_number, account_id, debit, credit, currency_code, description)
             VALUES ($1, $2, $3, $4, 0, $5, 'USD', $6)`,
            [txId, orgId, lineIdx++, item.accountId, lossAmt, `FX Revaluation Adjustment - ${item.nameAr}`]
          );
        }
      }

      await auditLog({
        organizationId: orgId,
        userId: auth.userId,
        action: 'CREATE',
        tableName: 'transactions',
        recordId: txId,
        details: { type: 'FX_REVALUATION_SETTLEMENT', periodEndingDate, netGainLossUSD: calc.netUnrealizedGainLossUSD },
      });

      return {
        transactionId: txId,
        transactionNumber: txNumber,
        netGainLossUSD: calc.netUnrealizedGainLossUSD,
        status: 'POSTED',
      };
    });
  }
}
