/**
 * NexoraOS™ — NEB-08: Partnership & Funding Engine
 * Donors, Grants, Installments, Proposals, Partner Agreements, Utilization Reports
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import { paginatedQuery, requireField, optionalString, auditLog, AuthContext, generateCode } from '../core/helpers';
import logger from '../core/logger';

// ─── Donors ────────────────────────────────────────────

export class DonorEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    donorType?: string;
    search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['d.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.donorType) { conditions.push(`d.donor_type = $${idx++}`); params.push(filters.donorType); }
    if (filters?.search) {
      conditions.push(`(d.name_ar ILIKE $${idx} OR d.name_en ILIKE $${idx} OR d.donor_code ILIKE $${idx})`);
      params.push(`%${filters.search}%`); idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT d.*,
        (SELECT COUNT(*) FROM grants g WHERE g.donor_id = d.id) as grants_count,
        (SELECT COALESCE(SUM(g.total_amount), 0) FROM grants g WHERE g.donor_id = d.id) as total_funding
       FROM donors d WHERE ${where}`,
      `SELECT COUNT(*) FROM donors d WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(donorId: string) {
    const donor = await queryOne('SELECT * FROM donors WHERE id = $1', [donorId]);
    if (!donor) return null;
    const grants = await queryMany(
      `SELECT g.*, p.name_ar as project_name_ar
       FROM grants g LEFT JOIN projects p ON p.id = g.project_id
       WHERE g.donor_id = $1 ORDER BY g.created_at DESC`, [donorId]
    );
    return { ...donor, grants };
  }

  static async create(data: {
    organizationId: string; partyId?: string; nameAr: string; nameEn?: string;
    donorType?: string; country?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const code = generateCode('DON-');
      const result = await client.query(
        `INSERT INTO donors (organization_id, party_id, donor_code, name_ar, name_en, donor_type, country)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [data.organizationId, data.partyId || null, code, requireField(data.nameAr, 'nameAr'),
         optionalString(data.nameEn), optionalString(data.donorType), optionalString(data.country)]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'donors', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async update(donorId: string, data: Partial<{
    nameAr: string; nameEn: string; donorType: string; country: string; status: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined) { sets.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${idx++}`); values.push(val); }
    });
    values.push(donorId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE donors SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }

  static async delete(donorId: string) {
    const grantCount = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM grants WHERE donor_id = $1', [donorId]);
    if (Number(grantCount?.count || 0) > 0) throw new Error('Cannot delete donor with existing grants');
    await query('DELETE FROM donors WHERE id = $1', [donorId]);
  }
}

// ─── Grants ────────────────────────────────────────────

export class GrantEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    donorId?: string;
    projectId?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['g.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.status) { conditions.push(`g.status = $${idx++}`); params.push(filters.status); }
    if (filters?.donorId) { conditions.push(`g.donor_id = $${idx++}`); params.push(filters.donorId); }
    if (filters?.projectId) { conditions.push(`g.project_id = $${idx++}`); params.push(filters.projectId); }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT g.*, d.name_ar as donor_name_ar, p.name_ar as project_name_ar,
        (SELECT COALESCE(SUM(gi.received_amount), 0) FROM grant_installments gi WHERE gi.grant_id = g.id) as total_received
       FROM grants g
       LEFT JOIN donors d ON d.id = g.donor_id
       LEFT JOIN projects p ON p.id = g.project_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM grants g WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(grantId: string) {
    const grant = await queryOne(
      `SELECT g.*, d.name_ar as donor_name_ar, p.name_ar as project_name_ar
       FROM grants g LEFT JOIN donors d ON d.id = g.donor_id LEFT JOIN projects p ON p.id = g.project_id
       WHERE g.id = $1`, [grantId]
    );
    if (!grant) return null;
    const installments = await queryMany(
      'SELECT * FROM grant_installments WHERE grant_id = $1 ORDER BY due_date', [grantId]
    ).catch((err) => { logger.error('Query failed', { context: 'funding', error: err.message }); return []; });
    return { ...grant, installments };
  }

  static async create(data: {
    organizationId: string; donorId: string; projectId?: string;
    grantNumber: string; titleAr: string; titleEn?: string;
    totalAmount: number; currencyCode?: string;
    startDate?: string; endDate?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO grants (organization_id, donor_id, project_id, grant_number, title_ar, title_en,
          total_amount, currency_code, start_date, end_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [data.organizationId, data.donorId, data.projectId || null,
         requireField(data.grantNumber, 'grantNumber'), requireField(data.titleAr, 'titleAr'),
         optionalString(data.titleEn), data.totalAmount, data.currencyCode || 'USD',
         data.startDate || null, data.endDate || null]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'grants', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async update(grantId: string, data: Partial<{
    titleAr: string; titleEn: string; totalAmount: number; status: string;
    startDate: string; endDate: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined) { sets.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${idx++}`); values.push(val); }
    });
    values.push(grantId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE grants SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }
}

// ─── Grant Installments ────────────────────────────────

export class GrantInstallmentEngine {
  static async create(data: {
    grantId: string; organizationId: string;
    installmentNumber: number; dueDate: string;
    expectedAmount: number; currencyCode?: string;
  }) {
    return queryOne(
      `INSERT INTO grant_installments (grant_id, organization_id, installment_number, due_date, expected_amount, currency_code, status)
       VALUES ($1,$2,$3,$4,$5,$6,'PENDING') RETURNING *`,
      [data.grantId, data.organizationId, data.installmentNumber, data.dueDate,
       data.expectedAmount, data.currencyCode || 'USD']
    );
  }

  static async receive(installmentId: string, data: {
    receivedAmount: number; receivedDate: string; receivedBy: string;
    bankReference?: string;
  }) {
    return await transaction(async (client) => {
      const result = await client.query(
        `UPDATE grant_installments SET status = 'RECEIVED', received_amount = $1,
          received_date = $2, received_by = $3, bank_reference = $4
         WHERE id = $5 AND status = 'PENDING' RETURNING *`,
        [data.receivedAmount, data.receivedDate, data.receivedBy,
         optionalString(data.bankReference), installmentId]
      );
      if (result.rows.length === 0) throw new Error('Installment not found or already received');
      return result.rows[0];
    });
  }

  static async listByGrant(grantId: string) {
    return queryMany('SELECT * FROM grant_installments WHERE grant_id = $1 ORDER BY installment_number', [grantId]);
  }
}

// ─── Funding Proposals ─────────────────────────────────

export class ProposalEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['fp.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.status) { conditions.push(`fp.status = $${idx++}`); params.push(filters.status); }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT fp.*, d.name_ar as donor_name_ar FROM funding_proposals fp
       LEFT JOIN donors d ON d.id = fp.donor_id WHERE ${where}`,
      `SELECT COUNT(*) FROM funding_proposals fp WHERE ${where}`,
      params, pagination
    );
  }

  static async create(data: {
    organizationId: string; donorId?: string; projectId?: string;
    titleAr: string; titleEn?: string; proposedAmount: number;
    currencyCode?: string; submissionDate?: string;
  }, auth: AuthContext) {
    const code = generateCode('PROP-');
    return queryOne(
      `INSERT INTO funding_proposals (organization_id, donor_id, project_id, proposal_number, title_ar, title_en,
        proposed_amount, currency_code, submission_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'DRAFT') RETURNING *`,
      [data.organizationId, data.donorId || null, data.projectId || null, code,
       requireField(data.titleAr, 'titleAr'), optionalString(data.titleEn),
       data.proposedAmount, data.currencyCode || 'USD', data.submissionDate || null]
    );
  }

  static async updateStatus(proposalId: string, status: string, notes?: string) {
    return queryOne(
      `UPDATE funding_proposals SET status = $1, review_notes = $2 WHERE id = $3 RETURNING *`,
      [status, optionalString(notes), proposalId]
    );
  }
}

// ─── Partner Agreements ────────────────────────────────

export class PartnerAgreementEngine {
  static async list(orgId: string) {
    return queryMany(
      `SELECT pa.*, d.name_ar as partner_name_ar FROM partner_agreements pa
       LEFT JOIN donors d ON d.id = pa.partner_id
       WHERE pa.organization_id = $1 ORDER BY pa.created_at DESC`, [orgId]
    ).catch((err) => { logger.error('Query failed', { context: 'funding', error: err.message }); return []; });
  }

  static async create(data: {
    organizationId: string; partnerId: string;
    agreementNumber: string; titleAr: string; titleEn?: string;
    startDate: string; endDate: string; value?: number;
  }, auth: AuthContext) {
    return queryOne(
      `INSERT INTO partner_agreements (organization_id, partner_id, agreement_number, title_ar, title_en,
        start_date, end_date, total_value, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE') RETURNING *`,
      [data.organizationId, data.partnerId, requireField(data.agreementNumber, 'agreementNumber'),
       requireField(data.titleAr, 'titleAr'), optionalString(data.titleEn),
       data.startDate, data.endDate, data.value || 0]
    ).catch((err: any) => { console.error('[Engine] Query failed:', err.message); return null; });
  }
}

// ─── Utilization Reports ───────────────────────────────

export class UtilizationReportEngine {
  static async generate(orgId: string, grantId?: string) {
    let where = 'g.organization_id = $1';
    const params: any[] = [orgId];
    if (grantId) { where += ' AND g.id = $2'; params.push(grantId); }

    const grants = await queryMany(
      `SELECT g.*, d.name_ar as donor_name,
        (SELECT COALESCE(SUM(gi.received_amount), 0) FROM grant_installments gi WHERE gi.grant_id = g.id) as total_received,
        (SELECT COALESCE(SUM(t.total_debit), 0) FROM transactions t WHERE t.reference_no = g.grant_number AND t.transaction_type = 'PAYMENT') as total_spent
       FROM grants g LEFT JOIN donors d ON d.id = g.donor_id
       WHERE ${where}`, params
    );

    return grants.map((g: any) => ({
      grantId: g.id,
      grantNumber: g.grant_number,
      donorName: g.donor_name,
      title: g.title_ar,
      totalAmount: Number(g.total_amount),
      totalReceived: Number(g.total_received),
      totalSpent: Number(g.total_spent),
      utilizationPct: Number(g.total_amount) > 0 ? Math.round((Number(g.total_spent) / Number(g.total_amount)) * 100) : 0,
      remainingAmount: Number(g.total_amount) - Number(g.total_spent),
      currencyCode: g.currency_code,
    }));
  }
}
