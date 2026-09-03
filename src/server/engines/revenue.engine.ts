/**
 * NexoraOS™ — NEB-15: Unified Revenue Engine
 * Supports ANY revenue type for various project activities with:
 *  - Configurable revenue streams (recognition policy + GL accounts)
 *  - Full lifecycle: DRAFT → PENDING_APPROVAL → APPROVED → POSTED → COLLECTED
 *  - Automated IPSAS double-entry posting (recognition & collection)
 *  - Partial collection allocations & deferred revenue earning
 *  - Intelligence: KPIs, forecasting, concentration risk (no fabricated data)
 * Standards: IPSAS 9 (exchange) & IPSAS 23 (non-exchange)
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult, AuthContext } from '../core/types';
import { paginatedQuery, requireField, optionalString, auditLog, generateTxNumber } from '../core/helpers';

// ─── Shared Types ──────────────────────────────────────

export interface RevenueStreamRow {
  id: string;
  organization_id: string;
  stream_code: string;
  name_ar: string;
  name_en?: string;
  recognition_method: 'CASH_BASIS' | 'ACCRUAL' | 'DEFERRED';
  exchange_type: 'NON_EXCHANGE' | 'EXCHANGE';
  is_restricted: boolean;
  debit_account_id?: string;
  credit_account_id?: string;
  deferred_account_id?: string;
  default_currency: string;
  is_active: boolean;
}

interface ResolvedAccounts {
  debit: { id: string; code: string };
  credit: { id: string; code: string };
}

// ─── Revenue Stream Registry ───────────────────────────

export class RevenueStreamEngine {
  static async list(orgId: string, opts?: { activeOnly?: boolean }): Promise<RevenueStreamRow[]> {
    const conditions = ['organization_id = $1'];
    const params: any[] = [orgId];
    if (opts?.activeOnly) conditions.push('is_active = TRUE');
    return queryMany<RevenueStreamRow>(
      `SELECT * FROM revenue_streams WHERE ${conditions.join(' AND ')} ORDER BY stream_code ASC`,
      params
    );
  }

  static async getByCode(orgId: string, streamCode: string): Promise<RevenueStreamRow | null> {
    return queryOne<RevenueStreamRow>(
      `SELECT * FROM revenue_streams WHERE organization_id = $1 AND stream_code = $2 AND is_active = TRUE`,
      [orgId, streamCode]
    );
  }

  static async create(orgId: string, data: {
    streamCode: string; nameAr: string; nameEn?: string; description?: string;
    recognitionMethod?: string; exchangeType?: string; isRestricted?: boolean;
    debitAccountId?: string; creditAccountId?: string; deferredAccountId?: string;
    defaultCurrency?: string;
  }, auth: AuthContext) {
    const method = (data.recognitionMethod || 'CASH_BASIS').toUpperCase();
    if (!['CASH_BASIS', 'ACCRUAL', 'DEFERRED'].includes(method)) {
      throw new Error(`Invalid recognitionMethod '${method}'. Allowed: CASH_BASIS, ACCRUAL, DEFERRED`);
    }
    const exchange = (data.exchangeType || 'NON_EXCHANGE').toUpperCase();
    if (!['NON_EXCHANGE', 'EXCHANGE'].includes(exchange)) {
      throw new Error(`Invalid exchangeType '${exchange}'. Allowed: NON_EXCHANGE, EXCHANGE`);
    }
    const row = await queryOne(
      `INSERT INTO revenue_streams (organization_id, stream_code, name_ar, name_en, description,
        recognition_method, exchange_type, is_restricted, debit_account_id, credit_account_id,
        deferred_account_id, default_currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (organization_id, stream_code) DO UPDATE SET
         name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en,
         recognition_method = EXCLUDED.recognition_method,
         exchange_type = EXCLUDED.exchange_type,
         is_restricted = EXCLUDED.is_restricted,
         debit_account_id = EXCLUDED.debit_account_id,
         credit_account_id = EXCLUDED.credit_account_id,
         deferred_account_id = EXCLUDED.deferred_account_id,
         is_active = TRUE, updated_at = NOW()
       RETURNING *`,
      [orgId, requireField(data.streamCode, 'streamCode').toUpperCase(), requireField(data.nameAr, 'nameAr'),
       optionalString(data.nameEn), optionalString(data.description), method, exchange,
       data.isRestricted === true, data.debitAccountId || null, data.creditAccountId || null,
       data.deferredAccountId || null, optionalString(data.defaultCurrency) || 'YER']
    );
    await auditLog({ organizationId: orgId, userId: auth.userId, action: 'UPSERT', tableName: 'revenue_streams', recordId: row?.id, details: { streamCode: data.streamCode } });
    return row;
  }
}

// ─── Unified Revenue Records (Full Lifecycle) ──────────

export class RevenueEngine {
  /**
   * Resolve posting accounts for a stream, with COA fallback:
   * stream config → first active ASSET (cash-like) / REVENUE account.
   */
  private static async resolveAccounts(stream: RevenueStreamRow, client?: any): Promise<ResolvedAccounts> {
    const exec = client ?? { query: (t: string, p?: any[]) => query(t, p) };
    const resolveOne = async (accountId: string | undefined, type: 'ASSET' | 'REVENUE'): Promise<{ id: string; code: string }> => {
      if (accountId) {
        const acc = await exec.query(`SELECT id, account_code FROM chart_of_accounts WHERE id = $1::uuid AND is_active = TRUE`, [accountId]);
        if (acc.rows[0]) return { id: acc.rows[0].id, code: acc.rows[0].account_code };
      }
      // account_type is stored lowercase in the live schema (asset, revenue, ...).
      // Match case-insensitively, prefer cash-like / receivable accounts for the debit leg.
      const typeLower = type.toLowerCase();
      const preferCashLike = type === 'ASSET';
      const fallback = await exec.query(
        `SELECT id, account_code FROM chart_of_accounts
         WHERE LOWER(account_type) = $1::text AND is_active = TRUE
           AND deleted_at IS NULL
           ${preferCashLike ? "AND (is_cash_equivalent = TRUE OR account_code::text ILIKE '%11%' OR name_ar ILIKE '%نقد%' OR name_ar ILIKE '%خزينة%' OR name_ar ILIKE '%مستحق%' OR name_en ILIKE '%cash%' OR name_en ILIKE '%receivable%')" : ''}
         ORDER BY ${preferCashLike ? "(is_cash_equivalent = TRUE) DESC" : "account_code ASC"}, account_code ASC
         LIMIT 1`, [typeLower]
      );
      if (!fallback.rows[0]) {
        // Retry without the cash-like preference before failing hard.
        const anyType = await exec.query(
          `SELECT id, account_code FROM chart_of_accounts
           WHERE LOWER(account_type) = $1::text AND is_active = TRUE AND deleted_at IS NULL
           ORDER BY account_code ASC LIMIT 1`, [typeLower]
        );
        if (!anyType.rows[0]) {
          throw new Error(`No active ${type} account found in chart of accounts. Configure the revenue stream GL accounts first.`);
        }
        return { id: anyType.rows[0].id, code: anyType.rows[0].account_code };
      }
      return { id: fallback.rows[0].id, code: fallback.rows[0].account_code };
    };
    const debit = await resolveOne(stream.debit_account_id, 'ASSET');
    const credit = await resolveOne(stream.credit_account_id, 'REVENUE');
    return { debit, credit };
  }

  static async create(orgId: string, data: {
    streamCode?: string; revenueType?: string; counterpartyName?: string;
    counterpartyPartyId?: string; programId?: string; projectId?: string; activityId?: string;
    amount: number; currencyCode?: string; exchangeRate?: number;
    revenueDate?: string; dueDate?: string; description?: string; referenceNumber?: string;
    metadata?: Record<string, unknown>;
  }, auth: AuthContext) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('amount must be a positive finite number');
    }
    const rate = Number(data.exchangeRate) || 1;
    if (rate <= 0) throw new Error('exchangeRate must be positive');

    let stream: RevenueStreamRow | null = null;
    if (data.streamCode) {
      stream = await RevenueStreamEngine.getByCode(orgId, data.streamCode);
      if (!stream) throw new Error(`Revenue stream '${data.streamCode}' not found or inactive`);
    }
    const revenueType = data.revenueType || stream?.stream_code || 'OTHER_REVENUE';
    const currency = data.currencyCode || stream?.default_currency || 'YER';

    return await transaction(async (client) => {
      const seqRes = await client.query(`SELECT nextval('revenue_record_seq') as seq`);
      const seq = parseInt(seqRes.rows[0].seq, 10);
      const revenueNumber = `REV-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
      const result = await client.query(
        `INSERT INTO revenue_records (organization_id, revenue_number, stream_id, revenue_type,
          counterparty_name, counterparty_party_id, program_id, project_id, activity_id,
          amount, currency_code, exchange_rate, amount_base, revenue_date, due_date,
          description, reference_number, metadata, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'DRAFT',$19)
         RETURNING *`,
        [orgId, revenueNumber, stream?.id || null, revenueType,
         optionalString(data.counterpartyName), data.counterpartyPartyId || null,
         data.programId || null, data.projectId || null, data.activityId || null,
         amount, currency, rate, Math.round(amount * rate * 100) / 100,
         data.revenueDate || new Date().toISOString().split('T')[0],
         data.dueDate || null, optionalString(data.description),
         optionalString(data.referenceNumber), data.metadata ? JSON.stringify(data.metadata) : null,
         auth.userId]
      );
      await auditLog({ organizationId: orgId, userId: auth.userId, action: 'CREATE', tableName: 'revenue_records', recordId: result.rows[0].id, details: { revenueNumber, amount, revenueType } });
      return result.rows[0];
    });
  }


  static async getById(orgId: string, recordId: string) {
    return queryOne(
      `SELECT rr.*, rs.name_ar as stream_name_ar, rs.recognition_method, rs.is_restricted,
              rs.exchange_type, p.name_ar as project_name_ar, p.project_code,
              pr.name_ar as program_name_ar
       FROM revenue_records rr
       LEFT JOIN revenue_streams rs ON rs.id = rr.stream_id
       LEFT JOIN projects p ON p.id = rr.project_id
       LEFT JOIN programs pr ON pr.id = rr.program_id
       WHERE rr.id = $1 AND rr.organization_id = $2 AND rr.deleted_at IS NULL`,
      [recordId, orgId]
    );
  }

  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string; revenueType?: string; streamCode?: string;
    projectId?: string; activityId?: string; startDate?: string; endDate?: string;
    sortKey?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['rr.organization_id = $1', 'rr.deleted_at IS NULL'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.status) { conditions.push(`rr.status = $${idx++}`); params.push(filters.status); }
    if (filters?.revenueType) { conditions.push(`rr.revenue_type = $${idx++}`); params.push(filters.revenueType); }
    if (filters?.streamCode) { conditions.push(`rs.stream_code = $${idx++}`); params.push(filters.streamCode); }
    if (filters?.projectId) { conditions.push(`rr.project_id = $${idx++}`); params.push(filters.projectId); }
    if (filters?.activityId) { conditions.push(`rr.activity_id = $${idx++}`); params.push(filters.activityId); }
    if (filters?.startDate) { conditions.push(`rr.revenue_date >= $${idx++}`); params.push(filters.startDate); }
    if (filters?.endDate) { conditions.push(`rr.revenue_date <= $${idx++}`); params.push(filters.endDate); }
    const where = conditions.join(' AND ');
    // Whitelisted qualified sort columns — avoids ambiguity with joined tables
    const sortMap: Record<string, string> = {
      created_at: 'rr.created_at',
      revenue_date: 'rr.revenue_date',
      amount: 'rr.amount_base',
      revenue_number: 'rr.revenue_number',
      status: 'rr.status',
    };
    const sortKey = sortMap[String(filters?.sortKey || pagination.sortBy || 'created_at')] || 'rr.created_at';
    const sortDir = pagination.sortOrder === 'asc' ? 'ASC' : 'DESC';
    return paginatedQuery(
      `SELECT rr.*, rs.name_ar as stream_name_ar, rs.is_restricted,
              p.name_ar as project_name_ar, p.project_code
       FROM revenue_records rr
       LEFT JOIN revenue_streams rs ON rs.id = rr.stream_id
       LEFT JOIN projects p ON p.id = rr.project_id
       WHERE ${where} ORDER BY ${sortKey} ${sortDir}`,
      `SELECT COUNT(*) FROM revenue_records rr
       LEFT JOIN revenue_streams rs ON rs.id = rr.stream_id
       WHERE ${where}`,
      params, { ...pagination, sortBy: undefined, sortOrder: undefined } as PaginationParams
    );
  }


  /** Submit a draft for approval. */
  static async submit(orgId: string, recordId: string, auth: AuthContext) {
    const row = await queryOne(
      `UPDATE revenue_records SET status = 'PENDING_APPROVAL', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND status = 'DRAFT' AND deleted_at IS NULL
       RETURNING *`, [recordId, orgId]
    );
    if (!row) throw new Error('Revenue record not found, or not in DRAFT status');
    await auditLog({ organizationId: orgId, userId: auth.userId, action: 'SUBMIT', tableName: 'revenue_records', recordId, details: { revenueNumber: row.revenue_number } });
    return row;
  }

  /** Approve (or reject) a pending record. ACCRUAL streams auto-post on approval. */
  static async approve(orgId: string, recordId: string, auth: AuthContext, opts?: { reject?: boolean; reason?: string }) {
    const record = await this.getById(orgId, recordId);
    if (!record) throw new Error('Revenue record not found');
    if (record.status !== 'PENDING_APPROVAL') {
      throw new Error(`Record is in status '${record.status}'; only PENDING_APPROVAL records can be ${opts?.reject ? 'rejected' : 'approved'}`);
    }

    if (opts?.reject) {
      const row = await queryOne(
        `UPDATE revenue_records SET status = 'REJECTED', rejection_reason = $3, updated_at = NOW()
         WHERE id = $1 AND organization_id = $2 RETURNING *`,
        [recordId, orgId, optionalString(opts.reason) || 'Rejected by approver']
      );
      await auditLog({ organizationId: orgId, userId: auth.userId, action: 'REJECT', tableName: 'revenue_records', recordId, details: { reason: opts.reason } });
      return row;
    }

    const approved = await queryOne(
      `UPDATE revenue_records SET status = 'APPROVED', approved_by = $3, approved_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [recordId, orgId, auth.userId]
    );

    // Automation: ACCRUAL streams recognize revenue immediately on approval
    if (record.recognition_method === 'ACCRUAL') {
      return await this.post(orgId, recordId, auth);
    }
    await auditLog({ organizationId: orgId, userId: auth.userId, action: 'APPROVE', tableName: 'revenue_records', recordId, details: { revenueNumber: record.revenue_number } });
    return approved;
  }

  /**
   * Post recognition entry to the IPSAS ledger (atomic double-entry).
   * Dr Cash/AR (debit account) | Cr Revenue (credit account)
   * Creates a `transactions` header + balanced `transaction_lines`,
   * linked back via reference_type='REVENUE_RECORD'.
   */
  static async post(orgId: string, recordId: string, auth: AuthContext) {
    const record = await this.getById(orgId, recordId);
    if (!record) throw new Error('Revenue record not found');
    if (!['APPROVED', 'PENDING_APPROVAL'].includes(record.status)) {
      throw new Error(`Record is in status '${record.status}'; only APPROVED records can be posted`);
    }
    if (record.ledger_transaction_id) {
      throw new Error('Revenue record already posted to the ledger');
    }
    const stream: RevenueStreamRow = {
      ...(record.stream_id ? { id: record.stream_id } : {}),
      id: record.stream_id,
      organization_id: orgId,
      stream_code: record.revenue_type,
      name_ar: record.stream_name_ar || record.revenue_type,
      recognition_method: record.recognition_method || 'CASH_BASIS',
      exchange_type: record.exchange_type || 'NON_EXCHANGE',
      is_restricted: record.is_restricted === true,
      debit_account_id: undefined,
      credit_account_id: undefined,
      deferred_account_id: undefined,
      default_currency: record.currency_code,
      is_active: true,
    };
    const accounts = await this.resolveAccounts(stream);
    const amountBase = Number(record.amount_base) || Number(record.amount);
    const txNumber = generateTxNumber('REV');

    const result = await transaction(async (client) => {
      const txRes = await client.query(
        `INSERT INTO transactions (organization_id, transaction_number, transaction_date,
          transaction_type, status_code, reference_type, reference_id, reference_number,
          project_id, activity_id, program_id, exchange_rate, total_debit, total_credit,
          total_debit_base, total_credit_base, description, is_posted, posted_at, posted_by,
          security_level, created_by)
         VALUES ($1,$2,$3,'REVENUE_RECOGNITION','POSTED','REVENUE_RECORD',$4,$5,
          $6,$7,$8,$9,$10,$10,$10,$10,$11,TRUE,NOW(),$12,3,$12)
         RETURNING id`,
        [orgId, txNumber, record.revenue_date, recordId, record.revenue_number,
         record.project_id || null, record.activity_id || null, record.program_id || null,
         Number(record.exchange_rate) || 1, amountBase,
         `اعتراف إيراد ${record.revenue_number} — ${record.revenue_type}`, auth.userId]
      );
      const txId = txRes.rows[0].id;
      await client.query(
        `INSERT INTO transaction_lines (transaction_id, organization_id, line_number,
          account_id, account_code, debit_amount, credit_amount, currency_code, description,
          project_id, activity_id, security_level)
         VALUES ($1,$2,1,$3,$4,$5,0,$6,$7,$8,$9,3)`,
        [txId, orgId, accounts.debit.id, accounts.debit.code, amountBase,
         record.currency_code, `مدين: استحقاق إيراد ${record.revenue_number}`,
         record.project_id || null, record.activity_id || null]
      );
      await client.query(
        `INSERT INTO transaction_lines (transaction_id, organization_id, line_number,
          account_id, account_code, debit_amount, credit_amount, currency_code, description,
          project_id, activity_id, security_level)
         VALUES ($1,$2,2,$3,$4,0,$5,$6,$7,$8,$9,3)`,
        [txId, orgId, accounts.credit.id, accounts.credit.code, amountBase,
         record.currency_code, `دائن: إيراد ${record.revenue_number} — ${record.revenue_type}`,
         record.project_id || null, record.activity_id || null]
      );
      const upd = await client.query(
        `UPDATE revenue_records SET status = 'POSTED', ledger_transaction_id = $3, posted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND organization_id = $2 RETURNING *`,
        [recordId, orgId, txId]
      );
      return upd.rows[0];
    });

    await auditLog({ organizationId: orgId, userId: auth.userId, action: 'POST', tableName: 'revenue_records', recordId, details: { revenueNumber: record.revenue_number, transactionId: result?.ledger_transaction_id, amountBase } });
    return result;
  }

  /**
   * Collect a (partial or full) payment against a revenue record.
   * - CASH_BASIS records: first collection posts the recognition entry.
   * - ACCRUAL records: collection settles the receivable (already recognized).
   * - Updates collected amounts and lifecycle status atomically.
   */
  static async collect(orgId: string, recordId: string, data: {
    amount: number; paymentMethod?: string; paymentReference?: string;
    collectionDate?: string; notes?: string;
  }, auth: AuthContext) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('collection amount must be a positive finite number');
    }
    const record = await this.getById(orgId, recordId);
    if (!record) throw new Error('Revenue record not found');
    if (['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'VOIDED'].includes(record.status)) {
      throw new Error(`Cannot collect on a record in status '${record.status}'`);
    }
    const outstanding = Number(record.amount) - Number(record.collected_amount);
    if (amount > outstanding + 0.001) {
      throw new Error(`Collection amount ${amount} exceeds outstanding balance ${outstanding}`);
    }

    const stream: RevenueStreamRow = {
      id: record.stream_id,
      organization_id: orgId,
      stream_code: record.revenue_type,
      name_ar: record.stream_name_ar || record.revenue_type,
      recognition_method: record.recognition_method || 'CASH_BASIS',
      exchange_type: record.exchange_type || 'NON_EXCHANGE',
      is_restricted: record.is_restricted === true,
      default_currency: record.currency_code,
      is_active: true,
    };
    const accounts = await this.resolveAccounts(stream);
    const rate = Number(record.exchange_rate) || 1;
    const amountBase = Math.round(amount * rate * 100) / 100;
    const collectionNumber = `RCP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1e10)).padStart(10, '0')}`;
    const txNumber = generateTxNumber('RCP');
    const needsRecognition = record.recognition_method === 'CASH_BASIS' && !record.ledger_transaction_id;

    const result = await transaction(async (client) => {
      const collRes = await client.query(
        `INSERT INTO revenue_collections (organization_id, revenue_record_id, collection_number,
          amount, currency_code, exchange_rate, amount_base, payment_method, payment_reference,
          collection_date, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [orgId, recordId, collectionNumber, amount, record.currency_code, rate, amountBase,
         optionalString(data.paymentMethod), optionalString(data.paymentReference),
         data.collectionDate || new Date().toISOString().split('T')[0],
         optionalString(data.notes), auth.userId]
      );
      const collectionId = collRes.rows[0].id;

      const txRes = await client.query(
        `INSERT INTO transactions (organization_id, transaction_number, transaction_date,
          transaction_type, status_code, reference_type, reference_id, reference_number,
          project_id, activity_id, program_id, exchange_rate, total_debit, total_credit,
          total_debit_base, total_credit_base, description, is_posted, posted_at, posted_by,
          security_level, created_by)
         VALUES ($1,$2,$3,'REVENUE_COLLECTION','POSTED','REVENUE_COLLECTION',$4,$5,
          $6,$7,$8,$9,$10,$10,$10,$10,$11,TRUE,NOW(),$12,3,$12)
         RETURNING id`,
        [orgId, txNumber, data.collectionDate || new Date().toISOString().split('T')[0],
         collectionId, collectionNumber, record.project_id || null, record.activity_id || null,
         record.program_id || null, rate, amountBase,
         `تحصيل إيراد ${record.revenue_number} — سند ${collectionNumber}`, auth.userId]
      );
      const txId = txRes.rows[0].id;
      // Dr Cash | Cr Revenue (recognizing now) or Cr AR (settling a receivable)
      const creditLeg = needsRecognition ? accounts.credit : accounts.debit;
      await client.query(
        `INSERT INTO transaction_lines (transaction_id, organization_id, line_number,
          account_id, account_code, debit_amount, credit_amount, currency_code, description,
          project_id, activity_id, security_level)
         VALUES ($1,$2,1,$3,$4,$5,0,$6,$7,$8,$9,3)`,
        [txId, orgId, accounts.debit.id, accounts.debit.code, amountBase,
         record.currency_code, `مدين: تحصيل إيراد ${record.revenue_number}`,
         record.project_id || null, record.activity_id || null]
      );
      await client.query(
        `INSERT INTO transaction_lines (transaction_id, organization_id, line_number,
          account_id, account_code, debit_amount, credit_amount, currency_code, description,
          project_id, activity_id, security_level)
         VALUES ($1,$2,2,$3,$4,0,$5,$6,$7,$8,$9,3)`,
        [txId, orgId, creditLeg.id, creditLeg.code, amountBase,
         record.currency_code, `دائن: ${needsRecognition ? 'إيراد محصل' : 'تسوية استحقاق'} ${record.revenue_number}`,
         record.project_id || null, record.activity_id || null]
      );
      await client.query(
        `UPDATE revenue_collections SET ledger_transaction_id = $2 WHERE id = $1`,
        [collectionId, txId]
      );


      const newCollected = Math.round((Number(record.collected_amount) + amount) * 100) / 100;
      const newStatus = newCollected >= Number(record.amount) - 0.001 ? 'COLLECTED' : 'PARTIALLY_COLLECTED';
      const upd = await client.query(
        `UPDATE revenue_records SET collected_amount = $3,
          collected_amount_base = COALESCE(collected_amount_base,0) + $4,
          status = CASE WHEN status IN ('POSTED','APPROVED') THEN $5 ELSE status END,
          earned_amount_base = CASE WHEN $6 THEN COALESCE(earned_amount_base,0) + $4 ELSE earned_amount_base END,
          ledger_transaction_id = CASE WHEN $6 AND ledger_transaction_id IS NULL THEN $7 ELSE ledger_transaction_id END,
          updated_at = NOW()
         WHERE id = $1 AND organization_id = $2 RETURNING *`,
        [recordId, orgId, newCollected, amountBase, newStatus, needsRecognition, txId]
      );
      return { collection: collRes.rows[0], record: upd.rows[0], transactionId: txId };
    });

    await auditLog({ organizationId: orgId, userId: auth.userId, action: 'COLLECT', tableName: 'revenue_records', recordId, details: { collectionNumber, amount, newStatus: result.record?.status } });
    return result;
  }

  static async getCollections(orgId: string, recordId: string) {
    return queryMany(
      `SELECT rc.* FROM revenue_collections rc
       JOIN revenue_records rr ON rr.id = rc.revenue_record_id
       WHERE rc.revenue_record_id = $1 AND rr.organization_id = $2
       ORDER BY rc.collection_date DESC, rc.created_at DESC`,
      [recordId, orgId]
    );
  }

  /** Void a record that has not been collected or posted. */
  static async void(orgId: string, recordId: string, auth: AuthContext, reason?: string) {
    const record = await this.getById(orgId, recordId);
    if (!record) throw new Error('Revenue record not found');
    if (Number(record.collected_amount) > 0) {
      throw new Error('Cannot void a revenue record that has collections. Reverse via a credit note workflow instead.');
    }
    if (record.status === 'COLLECTED' || record.status === 'VOIDED') {
      throw new Error(`Record in status '${record.status}' cannot be voided`);
    }
    const row = await queryOne(
      `UPDATE revenue_records SET status = 'VOIDED', rejection_reason = $3, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [recordId, orgId, optionalString(reason) || 'Voided']
    );
    await auditLog({ organizationId: orgId, userId: auth.userId, action: 'VOID', tableName: 'revenue_records', recordId, details: { reason } });
    return row;
  }
}



// ─── Revenue Intelligence (KPIs, Forecasting, Risk) ────

export class RevenueIntelligenceEngine {
  /**
   * Executive revenue intelligence snapshot.
   * All figures derive from real ledger data — no fabricated values.
   */
  static async getSnapshot(orgId: string, opts?: { months?: number }) {
    // Performance: read-through cache (90s) keyed on months+org
    const { CachedQuery } = await import('../core/performance');
    return CachedQuery.fetch(
      `revenue:snapshot:${orgId}:${opts?.months || 12}`,
      async () => RevenueIntelligenceEngine._getSnapshotImpl(orgId, opts),
      { ttlMs: 90_000, tags: ['revenue', `org:${orgId}`] }
    );
  }

  /** Internal implementation (no cache layer) */
  private static async _getSnapshotImpl(orgId: string, opts?: { months?: number }) {
    const months = Math.min(24, Math.max(3, opts?.months || 12));

    const totals = await queryOne(
      `SELECT
         COUNT(*) AS record_count,
         COALESCE(SUM(amount_base), 0) AS total_recognized,
         COALESCE(SUM(collected_amount_base), 0) AS total_collected,
         COALESCE(SUM(earned_amount_base), 0) AS total_earned,
         COALESCE(SUM(amount_base - collected_amount_base), 0) AS total_outstanding
       FROM revenue_records
       WHERE organization_id = $1 AND deleted_at IS NULL
         AND status NOT IN ('DRAFT','REJECTED','VOIDED')`, [orgId]
    );

    const byType = await queryMany(
      `SELECT revenue_type, COUNT(*) AS record_count,
              COALESCE(SUM(amount_base), 0) AS total_amount,
              COALESCE(SUM(collected_amount_base), 0) AS total_collected
       FROM revenue_records
       WHERE organization_id = $1 AND deleted_at IS NULL
         AND status NOT IN ('DRAFT','REJECTED','VOIDED')
       GROUP BY revenue_type ORDER BY total_amount DESC`, [orgId]
    );

    const byProject = await queryMany(
      `SELECT rr.project_id, p.project_code, p.name_ar AS project_name_ar,
              COUNT(*) AS record_count,
              COALESCE(SUM(rr.amount_base), 0) AS total_amount,
              COALESCE(SUM(rr.collected_amount_base), 0) AS total_collected
       FROM revenue_records rr
       LEFT JOIN projects p ON p.id = rr.project_id
       WHERE rr.organization_id = $1 AND rr.deleted_at IS NULL AND rr.project_id IS NOT NULL
         AND rr.status NOT IN ('DRAFT','REJECTED','VOIDED')
       GROUP BY rr.project_id, p.project_code, p.name_ar
       ORDER BY total_amount DESC`, [orgId]
    );

    const byActivity = await queryMany(
      `SELECT rr.activity_id, rr.project_id, COUNT(*) AS record_count,
              COALESCE(SUM(rr.amount_base), 0) AS total_amount
       FROM revenue_records rr
       WHERE rr.organization_id = $1 AND rr.deleted_at IS NULL AND rr.activity_id IS NOT NULL
         AND rr.status NOT IN ('DRAFT','REJECTED','VOIDED')
       GROUP BY rr.activity_id, rr.project_id ORDER BY total_amount DESC`, [orgId]
    );

    const monthly = await queryMany(
      `SELECT DATE_TRUNC('month', revenue_date)::date AS month,
              COALESCE(SUM(amount_base), 0) AS total_amount
       FROM revenue_records
       WHERE organization_id = $1 AND deleted_at IS NULL
         AND status NOT IN ('DRAFT','REJECTED','VOIDED')
         AND revenue_date >= (CURRENT_DATE - ($2 || ' months')::interval)
       GROUP BY 1 ORDER BY 1 ASC`, [orgId, String(months)]
    );

    const concentration = await queryMany(
      `SELECT counterparty_name, COUNT(*) AS record_count,
              COALESCE(SUM(amount_base), 0) AS total_amount
       FROM revenue_records
       WHERE organization_id = $1 AND deleted_at IS NULL AND counterparty_name IS NOT NULL
         AND status NOT IN ('DRAFT','REJECTED','VOIDED')
       GROUP BY counterparty_name ORDER BY total_amount DESC LIMIT 10`, [orgId]
    );

    const totalRecognized = Number(totals?.total_recognized) || 0;
    const totalCollected = Number(totals?.total_collected) || 0;
    const collectionRatePct = totalRecognized > 0
      ? Math.round((totalCollected / totalRecognized) * 1000) / 10 : 0;
    const concentrationTop10Pct = totalRecognized > 0 && concentration.length > 0
      ? Math.round((concentration.reduce((s: number, c: any) => s + Number(c.total_amount), 0) / totalRecognized) * 1000) / 10 : 0;

    const forecast = this.forecast(monthly.map((m: any) => ({ month: m.month, value: Number(m.total_amount) })));

    const insights: string[] = [];
    if (totalRecognized === 0) {
      insights.push('لا توجد بيانات إيرادات مرحّلة بعد؛ لا يتم توليد توقعات أو نسب حتى توفر بيانات فعلية.');
    } else {
      if (collectionRatePct < 70) insights.push(`معدل التحصيل ${collectionRatePct}% أقل من المستهدف (70%) — يوصى بمراجعة المستحقات المفتوحة.`);
      if (concentrationTop10Pct > 60) insights.push(`تركّز إيرادي مرتفع: أكبر 10 جهات تمثل ${concentrationTop10Pct}% من الإيرادات — خطر تركز يستدعي تنويع مصادر الدعم.`);
      const restrictedTypes = byType.filter((t: any) => String(t.revenue_type).includes('RESTRICTED') || String(t.revenue_type).includes('GRANT'));
      if (restrictedTypes.length > 0) insights.push(`توجد ${restrictedTypes.length} أنواع إيراد مقيدة تتطلب تتبع الالتزامات وتقارير الممولين.`);
      if (forecast.next.length > 0 && forecast.confidence === 'LOW') {
        insights.push('التوقعات منخفضة الثقة بسبب قلة البيانات التاريخية أو التذبذب العالي.');
      }
    }

    return {
      status: 'success',
      organizationId: orgId,
      generatedAt: new Date().toISOString(),
      kpis: {
        recordCount: Number(totals?.record_count) || 0,
        totalRecognized,
        totalCollected,
        totalEarned: Number(totals?.total_earned) || 0,
        totalOutstanding: Number(totals?.total_outstanding) || 0,
        collectionRatePct,
        concentrationTop10Pct,
      },
      breakdowns: { byType, byProject, byActivity, monthly, concentration },
      forecast,
      insights,
    };
  }

  /**
   * Least-squares linear regression forecast for the next N months.
   * Returns empty predictions when there is insufficient data.
   */
  static forecast(history: Array<{ month: string | Date; value: number }>, horizon = 3) {
    const points = history.filter(h => Number.isFinite(h.value)).map((h, i) => ({ x: i + 1, y: h.value }));
    if (points.length < 3) {
      return { method: 'LINEAR_REGRESSION', confidence: 'LOW' as const, next: [], note: 'بيانات غير كافية للتنبؤ (أقل من 3 أشهر).' };
    }
    const n = points.length;
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) {
      return { method: 'LINEAR_REGRESSION', confidence: 'LOW' as const, next: [], note: 'لا يمكن حساب الاتجاه.' };
    }
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    // R² for confidence
    const meanY = sumY / n;
    const ssTot = points.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
    const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
    const confidence = r2 >= 0.7 ? 'HIGH' : r2 >= 0.4 ? 'MEDIUM' : 'LOW';

    const next = Array.from({ length: horizon }, (_, i) => {
      const x = n + i + 1;
      const predicted = Math.max(0, Math.round((slope * x + intercept) * 100) / 100);
      const d = new Date();
      d.setMonth(d.getMonth() + i + 1);
      return { month: d.toISOString().slice(0, 7), predicted };
    });
    return { method: 'LINEAR_REGRESSION', confidence, r2: Math.round(r2 * 100) / 100, next };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// UnifiedRevenueEngine™ — NEB-15 Advanced Capabilities
// Batch Revenue · Schedules · Funding Caps
// ═══════════════════════════════════════════════════════════════════════

// ─── Types ────────────────────────────────────────────────────────────
export interface RevenueBatchRow {
  id: string;
  organization_id: string;
  batch_number: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'POSTED' | 'PARTIALLY_POSTED' | 'REJECTED' | 'VOIDED';
  total_amount: number;
  currency_code: string;
  exchange_rate: number;
  batch_date: string;
  description?: string;
  applied_cap_id?: string;
  cap_remaining_before?: number;
  created_by: string;
  approved_by?: string;
  posted_by?: string;
  rejection_reason?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RevenueBatchEntryRow {
  id: string;
  batch_id: string;
  sequence_number: number;
  account_id: string;
  account_code: string;
  account_name_ar?: string;
  debit_amount: number;
  credit_amount: number;
  currency_code: string;
  exchange_rate: number;
  amount_base: number;
  project_id?: string;
  activity_id?: string;
  counterparty_name?: string;
  description?: string;
  metadata: Record<string, any>;
}

export interface BatchEntryInput {
  accountId: string;
  debit: number;
  credit: number;
  projectId?: string;
  activityId?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  description?: string;
}

export interface BatchValidationResult {
  isValid: boolean;
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  imbalance: number;
  errors: string[];
  capStatus?: { capId: string; capName: string; totalCap: number; used: number; remaining: number; wouldExceed: boolean };
}

// ─── Revenue Batch Engine ────────────────────────────────────────────
export class RevenueBatchEngine {
  /** Validate that all entries are balanced (Σdebit = Σcredit) before posting. */
  static validateEntries(entries: BatchEntryInput[]): { isBalanced: boolean; totalDebit: number; totalCredit: number; imbalance: number; errors: string[] } {
    const errors: string[] = [];
    if (!entries || entries.length < 2) {
      errors.push('يجب أن يحتوي القيد على بندين على الأقل (مدين ودائن)');
      return { isBalanced: false, totalDebit: 0, totalCredit: 0, imbalance: 0, errors };
    }
    let totalDebit = 0;
    let totalCredit = 0;
    entries.forEach((e, idx) => {
      if (!e.accountId) errors.push(`البند رقم ${idx + 1}: الحساب مطلوب`);
      if (Number(e.debit || 0) < 0) errors.push(`البند رقم ${idx + 1}: المبلغ المدين سالب`);
      if (Number(e.credit || 0) < 0) errors.push(`البند رقم ${idx + 1}: المبلغ الدائن سالب`);
      totalDebit += Number(e.debit || 0);
      totalCredit += Number(e.credit || 0);
    });
    const imbalance = Math.round((totalDebit - totalCredit) * 100) / 100;
    return { isBalanced: Math.abs(imbalance) < 0.01, totalDebit, totalCredit, imbalance, errors };
  }

  /** Create a new batch in DRAFT state with validation. */
  static async create(orgId: string, data: {
    description?: string;
    batchDate?: string;
    currencyCode?: string;
    exchangeRate?: number;
    entries: BatchEntryInput[];
    capId?: string;
  }, auth: AuthContext) {
    if (!data.entries || data.entries.length === 0) {
      throw new Error('entries array is required and cannot be empty');
    }
    const currency = data.currencyCode || 'YER';
    const rate = Number(data.exchangeRate || 1);
    const validation = this.validateEntries(data.entries);
    if (!validation.isBalanced) {
      throw new Error(`القيد غير متوازن: مدين=${validation.totalDebit}, دائن=${validation.totalCredit}, فرق=${validation.imbalance}`);
    }
    if (validation.errors.length > 0) {
      throw new Error(`أخطاء في البنود: ${validation.errors.join('; ')}`);
    }

    let capStatus: BatchValidationResult['capStatus'] | undefined;
    if (data.capId) {
      capStatus = await FundingCapEngine.checkUtilization(orgId, data.capId, validation.totalDebit);
      if (capStatus.wouldExceed) {
        throw new Error(`تجاوز السقف: المتبقي ${capStatus.remaining} أقل من المطلوب ${validation.totalDebit}`);
      }
    }

    return await transaction(async (client) => {
      const seqRes = await client.query(`SELECT nextval('revenue_batch_seq') as seq`);
      const seq = parseInt(seqRes.rows[0].seq, 10);
      const batchNumber = `BATCH-REV-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

      const batchRes = await client.query(
        `INSERT INTO revenue_batches (organization_id, batch_number, status, total_amount,
          currency_code, exchange_rate, batch_date, description, applied_cap_id,
          cap_remaining_before, created_by)
         VALUES ($1,$2,'DRAFT',$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [orgId, batchNumber, validation.totalDebit, currency, rate,
         data.batchDate || new Date().toISOString().split('T')[0],
         data.description || null, data.capId || null,
         capStatus?.remaining || null, auth.userId]
      );
      const batch = batchRes.rows[0];

      for (let i = 0; i < data.entries.length; i++) {
        const e = data.entries[i];
        const accRes = await client.query(`SELECT account_code, name_ar FROM chart_of_accounts WHERE id = $1::uuid`, [e.accountId]);
        const accCode = accRes.rows[0]?.account_code || '';
        const accName = accRes.rows[0]?.name_ar || null;
        const amountBase = Math.round(((e.debit || e.credit) * rate) * 100) / 100;
        await client.query(
          `INSERT INTO revenue_batch_entries (batch_id, sequence_number, account_id, account_code,
            account_name_ar, debit_amount, credit_amount, currency_code, exchange_rate, amount_base,
            project_id, activity_id, counterparty_id, counterparty_name, description)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [batch.id, i + 1, e.accountId, accCode, accName,
           e.debit || 0, e.credit || 0, currency, rate, amountBase,
           e.projectId || null, e.activityId || null, e.counterpartyId || null,
           e.counterpartyName || null, e.description || null]
        );
      }

      await auditLog({
        organizationId: orgId, userId: auth.userId,
        action: 'CREATE', tableName: 'revenue_batches', recordId: batch.id,
        details: { batchNumber, totalAmount: validation.totalDebit, entryCount: data.entries.length }
      });
      return batch;
    });
  }

  /** Submit a DRAFT batch for approval (DRAFT → PENDING_APPROVAL). */
  static async submit(orgId: string, batchId: string, auth: AuthContext) {
    return await transaction(async (client) => {
      const res = await client.query(
        `UPDATE revenue_batches SET status = 'PENDING_APPROVAL', updated_at = NOW()
         WHERE id = $1::uuid AND organization_id = $2::uuid AND status = 'DRAFT'
         RETURNING *`,
        [batchId, orgId]
      );
      if (res.rows.length === 0) throw new Error('الدفعة غير موجودة أو ليست في حالة DRAFT');
      await auditLog({ organizationId: orgId, userId: auth.userId, action: 'SUBMIT', tableName: 'revenue_batches', recordId: batchId, details: {} });
      return res.rows[0];
    });
  }

  /** Approve a PENDING_APPROVAL batch. */
  static async approve(orgId: string, batchId: string, auth: AuthContext, opts: { reject?: boolean; reason?: string } = {}) {
    return await transaction(async (client) => {
      const res = await client.query(
        `UPDATE revenue_batches
         SET status = $1, approved_by = $2, rejection_reason = $3, updated_at = NOW()
         WHERE id = $4::uuid AND organization_id = $5::uuid AND status = 'PENDING_APPROVAL'
         RETURNING *`,
        [opts.reject ? 'REJECTED' : 'APPROVED', auth.userId, opts.reason || null, batchId, orgId]
      );
      if (res.rows.length === 0) throw new Error('الدفعة غير موجودة أو ليست في حالة PENDING_APPROVAL');
      await auditLog({
        organizationId: orgId, userId: auth.userId,
        action: opts.reject ? 'REJECT' : 'APPROVE', tableName: 'revenue_batches', recordId: batchId,
        details: { reason: opts.reason || null }
      });
      return res.rows[0];
    });
  }

  /** Post an APPROVED batch: create one ledger transaction containing all entry lines. */
  static async post(orgId: string, batchId: string, auth: AuthContext) {
    return await transaction(async (client) => {
      const batchRes = await client.query(
        `SELECT * FROM revenue_batches WHERE id = $1::uuid AND organization_id = $2::uuid AND status = 'APPROVED'`,
        [batchId, orgId]
      );
      if (batchRes.rows.length === 0) throw new Error('الدفعة غير معتمدة');
      const batch = batchRes.rows[0];

      const entriesRes = await client.query(
        `SELECT * FROM revenue_batch_entries WHERE batch_id = $1::uuid ORDER BY sequence_number ASC`,
        [batchId]
      );
      const entries = entriesRes.rows;

      // Build one transaction with N lines.
      const txNumber = generateTxNumber('REV-BATCH');
      const txRes = await client.query(
        `INSERT INTO transactions (organization_id, transaction_number, transaction_date,
          description, total_amount, currency_code, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,'POSTED',$7) RETURNING id`,
        [orgId, txNumber, batch.batch_date, `دفعة إيرادات ${batch.batch_number} — ${batch.description || ''}`,
         batch.total_amount, batch.currency_code, auth.userId]
      );
      const transactionId = txRes.rows[0].id;

      for (const e of entries) {
        await client.query(
          `INSERT INTO transaction_lines (transaction_id, account_id, debit_amount, credit_amount,
            project_id, activity_id, description, currency_code, exchange_rate, amount_base)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [transactionId, e.account_id, e.debit_amount, e.credit_amount,
           e.project_id, e.activity_id, e.description || '', e.currency_code, e.exchange_rate, e.amount_base]
        );
      }

      // Update batch status and record cap utilization.
      await client.query(
        `UPDATE revenue_batches SET status = 'POSTED', posted_by = $1, posted_at = NOW(), updated_at = NOW() WHERE id = $2::uuid`,
        [auth.userId, batchId]
      );
      if (batch.applied_cap_id) {
        await client.query(
          `INSERT INTO funding_cap_utilizations (cap_id, revenue_batch_id, utilization_amount, utilization_date)
           VALUES ($1, $2, $3, $4)`,
          [batch.applied_cap_id, batchId, batch.total_amount, batch.batch_date]
        );
      }
      await auditLog({ organizationId: orgId, userId: auth.userId, action: 'POST', tableName: 'revenue_batches', recordId: batchId, details: { transactionId, totalAmount: batch.total_amount } });
      return { batch: { ...batch, status: 'POSTED' }, transactionId };
    });
  }

  static async getById(orgId: string, batchId: string) {
    const batch = await queryOne<RevenueBatchRow>(
      `SELECT * FROM revenue_batches WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [batchId, orgId]
    );
    if (!batch) return null;
    const entries = await queryMany<RevenueBatchEntryRow>(
      `SELECT e.*, a.name_ar as account_name_ar FROM revenue_batch_entries e
       LEFT JOIN chart_of_accounts a ON a.id = e.account_id
       WHERE e.batch_id = $1::uuid ORDER BY e.sequence_number ASC`,
      [batchId]
    );
    return { ...batch, entries };
  }

  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const conditions = ['organization_id = $1', 'deleted_at IS NULL'];
    const params: any[] = [orgId];
    if (filters?.status) { params.push(filters.status); conditions.push(`status = $${params.length}`); }
    if (filters?.startDate) { params.push(filters.startDate); conditions.push(`batch_date >= $${params.length}`); }
    if (filters?.endDate) { params.push(filters.endDate); conditions.push(`batch_date <= $${params.length}`); }
    const where = conditions.join(' AND ');
    return paginatedQuery<RevenueBatchRow>(
      `SELECT * FROM revenue_batches WHERE ${where} ORDER BY batch_date DESC, created_at DESC`,
      `SELECT COUNT(*)::int as count FROM revenue_batches WHERE ${where}`,
      params,
      pagination
    );
  }
}

// ─── Funding Cap Engine ──────────────────────────────────────────────
export interface FundingCapRow {
  id: string;
  organization_id: string;
  cap_code: string;
  cap_name_ar: string;
  cap_name_en?: string;
  cap_type: 'HARD' | 'SOFT' | 'WARNING';
  applicable_types: string[];
  project_id?: string;
  donor_id?: string;
  grant_id?: string;
  total_cap_amount: number;
  currency_code: string;
  start_date: string;
  end_date?: string;
  alert_threshold_pct: number;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CLOSED';
  notes?: string;
  metadata: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export class FundingCapEngine {
  static async list(orgId: string, opts?: { activeOnly?: boolean }) {
    const conditions = ['organization_id = $1', 'deleted_at IS NULL'];
    const params: any[] = [orgId];
    if (opts?.activeOnly) conditions.push(`status = 'ACTIVE'`);
    return queryMany<FundingCapRow>(
      `SELECT * FROM funding_caps WHERE ${conditions.join(' AND ')} ORDER BY cap_code ASC`,
      params
    );
  }

  static async getById(orgId: string, capId: string) {
    return queryOne<FundingCapRow>(
      `SELECT * FROM funding_caps WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [capId, orgId]
    );
  }

  static async create(orgId: string, data: {
    capCode: string; capNameAr: string; capNameEn?: string;
    capType?: 'HARD' | 'SOFT' | 'WARNING';
    applicableTypes: string[];
    projectId?: string; donorId?: string; grantId?: string;
    totalCapAmount: number; currencyCode?: string;
    startDate: string; endDate?: string; alertThresholdPct?: number;
    notes?: string;
  }, auth: AuthContext) {
    if (!data.applicableTypes || data.applicableTypes.length === 0) {
      throw new Error('applicableTypes must contain at least one revenue type');
    }
    const row = await queryOne<FundingCapRow>(
      `INSERT INTO funding_caps (organization_id, cap_code, cap_name_ar, cap_name_en,
        cap_type, applicable_types, project_id, donor_id, grant_id, total_cap_amount,
        currency_code, start_date, end_date, alert_threshold_pct, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (organization_id, cap_code) DO UPDATE SET
         cap_name_ar = EXCLUDED.cap_name_ar, cap_name_en = EXCLUDED.cap_name_en,
         cap_type = EXCLUDED.cap_type, applicable_types = EXCLUDED.applicable_types,
         total_cap_amount = EXCLUDED.total_cap_amount, end_date = EXCLUDED.end_date,
         alert_threshold_pct = EXCLUDED.alert_threshold_pct, notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING *`,
      [orgId, requireField(data.capCode, 'capCode').toUpperCase(),
       requireField(data.capNameAr, 'capNameAr'), data.capNameEn,
       data.capType || 'HARD', data.applicableTypes,
       data.projectId || null, data.donorId || null, data.grantId || null,
       data.totalCapAmount, data.currencyCode || 'YER',
       data.startDate, data.endDate || null, data.alertThresholdPct || 80,
       data.notes || null, auth.userId]
    );
    await auditLog({ organizationId: orgId, userId: auth.userId, action: 'CREATE', tableName: 'funding_caps', recordId: row?.id, details: { capCode: data.capCode } });
    return row;
  }

  /** Compute current utilization: sum of cap_utilizations for the cap_id. */
  static async getUtilization(orgId: string, capId: string) {
    const cap = await this.getById(orgId, capId);
    if (!cap) throw new Error('Cap not found');
    const usedRes = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(utilization_amount), 0) as total
       FROM funding_cap_utilizations WHERE cap_id = $1::uuid`,
      [capId]
    );
    const used = Number(usedRes?.total || 0);
    return {
      cap,
      used,
      remaining: Math.round((cap.total_cap_amount - used) * 100) / 100,
      utilizationPct: cap.total_cap_amount > 0 ? Math.round((used / cap.total_cap_amount) * 10000) / 100 : 0,
    };
  }

  /** Check if a proposed amount would exceed the cap. */
  static async checkUtilization(orgId: string, capId: string, proposedAmount: number) {
    const util = await this.getUtilization(orgId, capId);
    return {
      capId,
      capName: util.cap.cap_name_ar,
      totalCap: util.cap.total_cap_amount,
      used: util.used,
      remaining: util.remaining,
      wouldExceed: proposedAmount > util.remaining,
    };
  }
}

// ─── Revenue Schedule Engine ──────────────────────────────────────────
export interface RevenueScheduleRow {
  id: string;
  organization_id: string;
  schedule_number: string;
  revenue_type: string;
  counterparty_name: string;
  counterparty_party_id?: string;
  project_id?: string;
  activity_id?: string;
  stream_id?: string;
  total_amount: number;
  currency_code: string;
  schedule_type: 'ONE_TIME' | 'INSTALLMENT' | 'CONTINGENT' | 'MILESTONE_BASED';
  frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'WEEKLY';
  installments_count: number;
  installment_amount?: number;
  start_date: string;
  end_date?: string;
  next_due_date?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  notes?: string;
  metadata: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RevenueScheduleInstallmentRow {
  id: string;
  schedule_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  currency_code: string;
  amount_base: number;
  status: 'PENDING' | 'DUE' | 'COLLECTED' | 'OVERDUE' | 'CANCELLED';
  linked_record_id?: string;
  collected_date?: string;
  collected_amount?: number;
}

export class RevenueScheduleEngine {
  static async list(orgId: string, opts?: { status?: string }) {
    const conditions = ['organization_id = $1', 'deleted_at IS NULL'];
    const params: any[] = [orgId];
    if (opts?.status) { params.push(opts.status); conditions.push(`status = $${params.length}`); }
    return queryMany<RevenueScheduleRow>(
      `SELECT * FROM revenue_schedules WHERE ${conditions.join(' AND ')} ORDER BY start_date DESC`,
      params
    );
  }

  static async getById(orgId: string, scheduleId: string) {
    const schedule = await queryOne<RevenueScheduleRow>(
      `SELECT * FROM revenue_schedules WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [scheduleId, orgId]
    );
    if (!schedule) return null;
    const installments = await queryMany<RevenueScheduleInstallmentRow>(
      `SELECT * FROM revenue_schedule_installments WHERE schedule_id = $1::uuid ORDER BY installment_number ASC`,
      [scheduleId]
    );
    return { ...schedule, installments };
  }

  /** Create a new schedule with auto-generated installments. */
  static async create(orgId: string, data: {
    revenueType: string;
    counterpartyName: string;
    counterpartyPartyId?: string;
    projectId?: string;
    activityId?: string;
    streamId?: string;
    totalAmount: number;
    currencyCode?: string;
    scheduleType?: 'ONE_TIME' | 'INSTALLMENT' | 'CONTINGENT' | 'MILESTONE_BASED';
    frequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'WEEKLY';
    installmentsCount?: number;
    startDate: string;
    endDate?: string;
    notes?: string;
  }, auth: AuthContext) {
    const installmentsCount = Math.max(1, data.installmentsCount || 1);
    const installmentAmount = Math.round((data.totalAmount / installmentsCount) * 100) / 100;
    return await transaction(async (client) => {
      const seqRes = await client.query(`SELECT nextval('revenue_schedule_seq') as seq`);
      const seq = parseInt(seqRes.rows[0].seq, 10);
      const scheduleNumber = `SCH-REV-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

      const schedRes = await client.query(
        `INSERT INTO revenue_schedules (organization_id, schedule_number, revenue_type,
          counterparty_name, counterparty_party_id, project_id, activity_id, stream_id,
          total_amount, currency_code, schedule_type, frequency, installments_count,
          installment_amount, start_date, end_date, next_due_date, status, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'ACTIVE',$18,$19)
         RETURNING *`,
        [orgId, scheduleNumber, data.revenueType, data.counterpartyName,
         data.counterpartyPartyId || null, data.projectId || null,
         data.activityId || null, data.streamId || null,
         data.totalAmount, data.currencyCode || 'YER',
         data.scheduleType || 'INSTALLMENT', data.frequency || 'MONTHLY',
         installmentsCount, installmentAmount, data.startDate,
         data.endDate || null, data.startDate, data.notes || null, auth.userId]
      );
      const schedule = schedRes.rows[0];

      // Generate installment rows
      const monthsMap: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12, WEEKLY: 0 };
      const monthStep = monthsMap[data.frequency || 'MONTHLY'] || 1;
      for (let i = 0; i < installmentsCount; i++) {
        const due = new Date(data.startDate);
        if (data.frequency === 'WEEKLY') due.setDate(due.getDate() + i * 7);
        else due.setMonth(due.getMonth() + i * monthStep);
        const dueStr = due.toISOString().split('T')[0];
        const isLast = i === installmentsCount - 1;
        // Last installment absorbs rounding remainder.
        const instAmount = isLast
          ? Math.round((data.totalAmount - installmentAmount * i) * 100) / 100
          : installmentAmount;
        await client.query(
          `INSERT INTO revenue_schedule_installments (schedule_id, installment_number, due_date,
            amount, currency_code, status)
           VALUES ($1,$2,$3,$4,$5,'PENDING')`,
          [schedule.id, i + 1, dueStr, instAmount, data.currencyCode || 'YER']
        );
      }

      await auditLog({ organizationId: orgId, userId: auth.userId, action: 'CREATE', tableName: 'revenue_schedules', recordId: schedule.id, details: { scheduleNumber, totalAmount: data.totalAmount, installmentsCount } });
      return schedule;
    });
  }

  /** Mark a specific installment as COLLECTED and link to a revenue_record. */
  static async markInstallmentCollected(orgId: string, scheduleId: string, installmentNumber: number, recordId: string, collectedAmount: number, auth: AuthContext) {
    return await transaction(async (client) => {
      const upd = await client.query(
        `UPDATE revenue_schedule_installments
         SET status = 'COLLECTED', linked_record_id = $1::uuid, collected_date = CURRENT_DATE,
             collected_amount = $2, updated_at = NOW()
         WHERE schedule_id = $3::uuid AND installment_number = $4
         RETURNING *`,
        [recordId, collectedAmount, scheduleId, installmentNumber]
      );
      if (upd.rows.length === 0) throw new Error('Installment not found');

      // Recompute next_due_date (smallest PENDING due date).
      await client.query(
        `UPDATE revenue_schedules SET updated_at = NOW(),
           next_due_date = (SELECT MIN(due_date) FROM revenue_schedule_installments
                            WHERE schedule_id = $1::uuid AND status = 'PENDING')
         WHERE id = $1::uuid`,
        [scheduleId]
      );
      // If all installments collected → COMPLETED.
      const remaining = await client.query(
        `SELECT COUNT(*)::int as cnt FROM revenue_schedule_installments
         WHERE schedule_id = $1::uuid AND status NOT IN ('COLLECTED', 'CANCELLED')`,
        [scheduleId]
      );
      if (remaining.rows[0].cnt === 0) {
        await client.query(`UPDATE revenue_schedules SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1::uuid`, [scheduleId]);
      }
      await auditLog({ organizationId: orgId, userId: auth.userId, action: 'UPDATE', tableName: 'revenue_schedule_installments', recordId: scheduleId, details: { installmentNumber, collectedAmount } });
      return upd.rows[0];
    });
  }
}


