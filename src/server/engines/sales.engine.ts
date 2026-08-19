/**
 * NexoraOS™ — NEB-15: Sales, Revenue & Fundraising Engine
 * Donations, Invoices, Campaigns, Revenue Tracking, Investment Returns
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import { paginatedQuery, requireField, optionalString, auditLog, AuthContext, generateCode } from '../core/helpers';

// ─── Donations ─────────────────────────────────────────

export class DonationEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    paymentMethod?: string;
    campaignId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['d.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.status) { conditions.push(`d.status = $${idx++}`); params.push(filters.status); }
    if (filters?.paymentMethod) { conditions.push(`d.payment_method = $${idx++}`); params.push(filters.paymentMethod); }
    if (filters?.campaignId) { conditions.push(`d.campaign_id = $${idx++}`); params.push(filters.campaignId); }
    if (filters?.startDate) { conditions.push(`d.donation_date >= $${idx++}`); params.push(filters.startDate); }
    if (filters?.endDate) { conditions.push(`d.donation_date <= $${idx++}`); params.push(filters.endDate); }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT d.*, p.name_ar as donor_name_ar
       FROM donations d LEFT JOIN parties p ON p.id = d.donor_party_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM donations d WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(donationId: string) {
    return queryOne(
      `SELECT d.*, p.name_ar as donor_name_ar, p.phone as donor_phone
       FROM donations d LEFT JOIN parties p ON p.id = d.donor_party_id
       WHERE d.id = $1`, [donationId]
    );
  }

  static async create(data: {
    organizationId: string; donorPartyId?: string; campaignId?: string;
    amount: number; currencyCode?: string; paymentMethod?: string;
    paymentReference?: string; donationDate?: string; notes?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const code = generateCode('DON-');
      const result = await client.query(
        `INSERT INTO donations (organization_id, donor_party_id, campaign_id, donation_number,
          amount, currency_code, payment_method, payment_reference, donation_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'COMPLETED') RETURNING *`,
        [data.organizationId, data.donorPartyId || null, data.campaignId || null, code,
         data.amount, data.currencyCode || 'YER', optionalString(data.paymentMethod),
         optionalString(data.paymentReference), data.donationDate || new Date().toISOString()]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'donations', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async getDashboard(orgId: string) {
    const stats = await queryOne(
      `SELECT
        COUNT(*) as total_donations,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as avg_donation,
        COUNT(CASE WHEN payment_method = 'BANK_TRANSFER' THEN 1 END) as bank_transfers,
        COUNT(CASE WHEN payment_method = 'CASH' THEN 1 END) as cash,
        COUNT(CASE WHEN payment_method = 'MOBILE_PAYMENT' THEN 1 END) as mobile
       FROM donations WHERE organization_id = $1 AND status = 'COMPLETED'`, [orgId]
    );

    const monthlyTrends = await queryMany(
      `SELECT DATE_TRUNC('month', donation_date) as month, SUM(amount) as total, COUNT(*) as count
       FROM donations WHERE organization_id = $1 AND status = 'COMPLETED'
       GROUP BY DATE_TRUNC('month', donation_date) ORDER BY month DESC LIMIT 12`, [orgId]
    );

    const topDonors = await queryMany(
      `SELECT p.name_ar as donor_name, COUNT(*) as donation_count, SUM(d.amount) as total_amount
       FROM donations d LEFT JOIN parties p ON p.id = d.donor_party_id
       WHERE d.organization_id = $1 AND d.status = 'COMPLETED'
       GROUP BY p.id, p.name_ar ORDER BY total_amount DESC LIMIT 10`, [orgId]
    );

    return { statistics: stats, monthlyTrends, topDonors };
  }
}

// ─── Sales Invoices ────────────────────────────────────

export class InvoiceEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    projectId?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['si.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.status) { conditions.push(`si.status = $${idx++}`); params.push(filters.status); }
    if (filters?.projectId) { conditions.push(`si.project_id = $${idx++}`); params.push(filters.projectId); }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT si.*, p.name_ar as project_name_ar
       FROM sales_invoices si LEFT JOIN projects p ON p.id = si.project_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM sales_invoices si WHERE ${where}`,
      params, pagination
    );
  }

  static async create(data: {
    organizationId: string; projectId?: string;
    invoiceNumber: string; customerName: string;
    totalAmount: number; currencyCode?: string;
    dueDate?: string; notes?: string;
  }, auth: AuthContext) {
    return queryOne(
      `INSERT INTO sales_invoices (organization_id, project_id, invoice_number, customer_name,
        total_amount, currency_code, due_date, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'DRAFT') RETURNING *`,
      [data.organizationId, data.projectId || null, requireField(data.invoiceNumber, 'invoiceNumber'),
       requireField(data.customerName, 'customerName'), data.totalAmount,
       data.currencyCode || 'YER', data.dueDate || null, optionalString(data.notes)]
    );
  }

  static async updateStatus(invoiceId: string, status: string) {
    return queryOne(
      `UPDATE sales_invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, invoiceId]
    );
  }

  static async recordPayment(invoiceId: string, data: {
    amount: number; paymentDate: string; paymentMethod: string; reference?: string;
  }) {
    return await transaction(async (client) => {
      const invoice = await client.query('SELECT * FROM sales_invoices WHERE id = $1', [invoiceId]);
      if (invoice.rows.length === 0) throw new Error('Invoice not found');

      const newPaid = Number(invoice.rows[0].paid_amount || 0) + data.amount;
      const total = Number(invoice.rows[0].total_amount);
      const newStatus = newPaid >= total ? 'PAID' : 'PARTIALLY_PAID';

      await client.query(
        `UPDATE sales_invoices SET paid_amount = $1, status = $2, payment_date = $3 WHERE id = $4`,
        [newPaid, newStatus, data.paymentDate, invoiceId]
      );

      return { invoiceId, paidAmount: newPaid, remainingAmount: total - newPaid, status: newStatus };
    });
  }
}

// ─── Donation Campaigns ────────────────────────────────

export class CampaignEngine {
  static async list(orgId: string) {
    return queryMany(
      `SELECT dc.*,
        (SELECT COUNT(*) FROM donations d WHERE d.campaign_id = dc.id AND d.status = 'COMPLETED') as donation_count,
        (SELECT COALESCE(SUM(d.amount), 0) FROM donations d WHERE d.campaign_id = dc.id AND d.status = 'COMPLETED') as total_raised
       FROM donation_campaigns dc WHERE dc.organization_id = $1 ORDER BY dc.created_at DESC`, [orgId]
    ).catch(() => []);
  }

  static async create(data: {
    organizationId: string; nameAr: string; nameEn?: string;
    targetAmount: number; currencyCode?: string;
    startDate?: string; endDate?: string; description?: string;
  }, auth: AuthContext) {
    return queryOne(
      `INSERT INTO donation_campaigns (organization_id, name_ar, name_en, target_amount, currency_code,
        start_date, end_date, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE') RETURNING *`,
      [data.organizationId, requireField(data.nameAr, 'nameAr'), optionalString(data.nameEn),
       data.targetAmount, data.currencyCode || 'YER',
       data.startDate || null, data.endDate || null, optionalString(data.description)]
    ).catch(() => null);
  }

  static async getProgress(campaignId: string) {
    return queryOne(
      `SELECT dc.*,
        (SELECT COALESCE(SUM(d.amount), 0) FROM donations d WHERE d.campaign_id = dc.id AND d.status = 'COMPLETED') as total_raised,
        (SELECT COUNT(*) FROM donations d WHERE d.campaign_id = dc.id AND d.status = 'COMPLETED') as donation_count
       FROM donation_campaigns dc WHERE dc.id = $1`, [campaignId]
    ).catch(() => null);
  }
}

// ─── Investment Projects ───────────────────────────────

export class InvestmentEngine {
  static async list(orgId: string) {
    return queryMany(
      `SELECT ip.*,
        (SELECT COALESCE(SUM(irh.return_amount), 0) FROM investment_returns_history irh WHERE irh.investment_id = ip.id) as total_returns
       FROM investment_projects ip WHERE ip.organization_id = $1 ORDER BY ip.created_at DESC`, [orgId]
    ).catch(() => []);
  }

  static async create(data: {
    organizationId: string; nameAr: string; nameEn?: string;
    investmentAmount: number; currencyCode?: string;
    expectedReturnPct?: number; startDate?: string;
  }, auth: AuthContext) {
    return queryOne(
      `INSERT INTO investment_projects (organization_id, name_ar, name_en, investment_amount,
        currency_code, expected_return_pct, start_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE') RETURNING *`,
      [data.organizationId, requireField(data.nameAr, 'nameAr'), optionalString(data.nameEn),
       data.investmentAmount, data.currencyCode || 'YER',
       data.expectedReturnPct || 0, data.startDate || null]
    ).catch(() => null);
  }

  static async recordReturn(data: {
    investmentId: string; returnAmount: number;
    returnDate: string; notes?: string;
  }) {
    return queryOne(
      `INSERT INTO investment_returns_history (investment_id, return_amount, return_date, notes)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.investmentId, data.returnAmount, data.returnDate, optionalString(data.notes)]
    ).catch(() => null);
  }
}
