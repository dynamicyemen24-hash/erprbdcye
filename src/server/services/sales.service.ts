import { getDatabasePool, withTransaction } from './db.service';
import { serverConfig } from '../config/index';
import { IPSASFinanceService } from './finance.service';
import { recordAuditLog } from './audit.service';
import crypto from 'crypto';

export interface CreateInvoicePayload {
  organizationId?: string;
  donorOrClientName: string;
  revenueType: string;
  programId?: string;
  projectId?: string;
  totalAmount: number;
  currencyCode?: string;
  paymentGateway?: string;
  issuedDate?: string;
}

export class SalesRevenueService {
  /**
   * 1. Retrieve all sales invoices with project & program metadata
   */
  static async getSalesInvoices(orgId: string = serverConfig.defaultOrgId, status?: string) {
    const pool = getDatabasePool();
    let query = `
      SELECT 
        si.id,
        si.organization_id,
        si.invoice_number,
        si.donor_or_client_name,
        si.revenue_type,
        si.total_amount,
        si.currency_code,
        si.payment_gateway,
        si.payment_status,
        si.qr_hash,
        si.issued_date,
        si.created_at,
        p.name_ar as project_name_ar,
        p.project_code,
        pr.name_ar as program_name_ar
      FROM sales_invoices si
      LEFT JOIN projects p ON p.id = si.project_id
      LEFT JOIN programs pr ON pr.id = si.program_id
      WHERE si.organization_id = $1
    `;

    const params: any[] = [orgId];
    if (status) {
      params.push(status);
      query += ` AND si.payment_status = $2`;
    }

    query += ` ORDER BY si.issued_date DESC, si.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 2. Issue a new Sales / Revenue / Donation Invoice
   */
  static async createSalesInvoice(payload: CreateInvoicePayload) {
    const pool = getDatabasePool();
    const orgId = payload.organizationId || serverConfig.defaultOrgId;

    // Use a DB-level atomic sequence to prevent race conditions in invoice number generation
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS sales_invoice_seq START 1
    `);
    const seqRes = await pool.query('SELECT nextval(\'sales_invoice_seq\') as seq');
    const seq = parseInt(seqRes.rows[0].seq, 10);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
    const issuedDate = payload.issuedDate || new Date().toISOString().split('T')[0];
    const currency = payload.currencyCode || 'YER';

    const qrData = `NEXORA-INV|${invoiceNumber}|${payload.totalAmount}|${currency}|PENDING|${issuedDate}`;
    const qrHash = crypto.createHash('sha256').update(qrData).digest('hex');

    const result = await pool.query(`
      INSERT INTO sales_invoices (
        organization_id, invoice_number, donor_or_client_name, revenue_type,
        program_id, project_id, total_amount, currency_code, payment_gateway,
        payment_status, qr_hash, issued_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      orgId, invoiceNumber, payload.donorOrClientName, payload.revenueType || 'COMMERCIAL_DONATION',
      payload.programId || null, payload.projectId || null, payload.totalAmount,
      currency, payload.paymentGateway || 'BANK_TRANSFER', qrHash, issuedDate
    ]);

    const created = result.rows[0];

    await recordAuditLog({
      organizationId: orgId,
      action: 'CREATE',
      tableName: 'sales_invoices',
      recordId: created.id,
      details: { invoiceNumber, amount: payload.totalAmount, client: payload.donorOrClientName }
    });

    return created;
  }

  /**
   * 3. Settle / Pay Sales Invoice + Atomically Post Balanced Double-Entry IPSAS Journal Voucher
   */
  static async paySalesInvoice(invoiceId: string, paymentGateway?: string, orgId: string = serverConfig.defaultOrgId) {
    return await withTransaction(async (client) => {
      const invRes = await client.query('SELECT * FROM sales_invoices WHERE id = $1', [invoiceId]);
      if (invRes.rows.length === 0) {
        throw new Error('Sales invoice not found');
      }

      const invoice = invRes.rows[0];
      if (invoice.payment_status === 'PAID') {
        return { message: 'Invoice already paid', invoice };
      }

      const updatedGateway = paymentGateway || invoice.payment_gateway || 'BANK_TRANSFER';
      
      // Update invoice to PAID
      await client.query(`
        UPDATE sales_invoices
        SET payment_status = 'PAID', payment_gateway = $1, updated_at = NOW()
        WHERE id = $2
      `, [updatedGateway, invoiceId]);

      // Post double-entry IPSAS Journal Voucher
      const accountsRes = await client.query('SELECT id, account_code, name_ar, account_type FROM chart_of_accounts LIMIT 30');
      const accounts = accountsRes.rows;
      
      // Cash/Bank account (Asset Debit 1xxx)
      const cashAcc = accounts.find((a: any) => a.account_code?.startsWith('1') || a.name_ar?.includes('صندوق') || a.name_ar?.includes('بنك')) || accounts[0];
      // Revenue account (Revenue Credit 3xxx/4xxx)
      const revAcc = accounts.find((a: any) => a.account_code?.startsWith('3') || a.account_code?.startsWith('4') || a.name_ar?.includes('إيراد') || a.name_ar?.includes('تبرع')) || accounts[1];

      let postedVoucher = null;
      if (cashAcc && revAcc && Number(invoice.total_amount) > 0) {
        const voucherNumber = `JV-REV-${invoice.invoice_number}`;
        const total = Number(invoice.total_amount);

        const txRes = await client.query(`
          INSERT INTO transactions (
            organization_id, transaction_number, transaction_date, posting_date,
            transaction_type, status_code, reference_number, total_debit, total_credit,
            description, is_posted
          ) VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE, 'RECEIPT_VOUCHER', 'POSTED', $3, $4, $5, $6, true)
          RETURNING id;
        `, [
          orgId,
          voucherNumber,
          invoice.invoice_number,
          total,
          total,
          `سند قبض وتحصيل فاتورة الإيراد/المبيعات رقم ${invoice.invoice_number} من ${invoice.donor_or_client_name}`
        ]);

        const txId = txRes.rows[0].id;

        // Line 1: Debit Cash/Bank
        await client.query(`
          INSERT INTO transaction_lines (
            transaction_id, organization_id, line_number, account_id, account_code,
            debit_amount, credit_amount, currency_code, description, project_id
          ) VALUES ($1, $2, 1, $3, $4, $5, 0, $6, $7, $8);
        `, [
          txId, orgId, cashAcc.id, cashAcc.account_code, total,
          invoice.currency_code || 'YER', `تحصيل فاتورة ${invoice.invoice_number} - حساب الصندوق/البنك`,
          invoice.project_id || null
        ]);

        // Line 2: Credit Revenue
        await client.query(`
          INSERT INTO transaction_lines (
            transaction_id, organization_id, line_number, account_id, account_code,
            debit_amount, credit_amount, currency_code, description, project_id
          ) VALUES ($1, $2, 2, $3, $4, 0, $5, $6, $7, $8);
        `, [
          txId, orgId, revAcc.id, revAcc.account_code, total,
          invoice.currency_code || 'YER', `إيراد مبيعات/تبرعات فاتورة ${invoice.invoice_number}`,
          invoice.project_id || null
        ]);

        postedVoucher = { voucherNumber, transactionId: txId, amount: total };
      }

      await recordAuditLog({
        organizationId: orgId,
        action: 'UPDATE',
        tableName: 'sales_invoices',
        recordId: invoiceId,
        details: { action: 'PAYMENT_COLLECTED', invoiceNumber: invoice.invoice_number, amount: invoice.total_amount }
      });

      return {
        status: 'success',
        message: 'Invoice successfully paid and posted to IPSAS ledger',
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        postedVoucher
      };
    });
  }

  /**
   * 4. Executive Sales & Revenue Analytics Summary
   */
  static async getSalesRevenueSummary(orgId: string = serverConfig.defaultOrgId) {
    const pool = getDatabasePool();
    const [invoicesRes, servicePointsRes] = await Promise.all([
      this.getSalesInvoices(orgId),
      this.getServicePoints(orgId)
    ]);

    let totalInvoicedYer = 0;
    let totalCollectedYer = 0;
    let totalPendingYer = 0;
    const byRevenueType: Record<string, number> = {};
    const byGateway: Record<string, number> = {};

    invoicesRes.forEach((inv: any) => {
      const amt = Number(inv.total_amount) || 0;
      totalInvoicedYer += amt;
      if (inv.payment_status === 'PAID') {
        totalCollectedYer += amt;
      } else {
        totalPendingYer += amt;
      }

      byRevenueType[inv.revenue_type] = (byRevenueType[inv.revenue_type] || 0) + amt;
      byGateway[inv.payment_gateway] = (byGateway[inv.payment_gateway] || 0) + amt;
    });

    const collectionRatePct = totalInvoicedYer > 0 ? Math.round((totalCollectedYer / totalInvoicedYer) * 100) : 0;

    return {
      status: 'success',
      organizationId: orgId,
      generatedAt: new Date().toISOString(),
      kpis: {
        totalInvoicedYer,
        totalCollectedYer,
        totalPendingYer,
        collectionRatePct,
        totalInvoicesCount: invoicesRes.length,
        paidInvoicesCount: invoicesRes.filter((i: any) => i.payment_status === 'PAID').length,
        pendingInvoicesCount: invoicesRes.filter((i: any) => i.payment_status === 'PENDING').length,
        activeServicePointsCount: servicePointsRes.length
      },
      breakdowns: {
        byRevenueType,
        byGateway
      },
      servicePoints: servicePointsRes,
      recentInvoices: invoicesRes.slice(0, 10)
    };
  }

  /**
   * 5. Service Points & Retail/Donation Hubs
   */
  static async getServicePoints(orgId: string = serverConfig.defaultOrgId) {
    const pool = getDatabasePool();
    const result = await pool.query(`
      SELECT 
        sp.*,
        ga.name_ar as geographic_area_name_ar
      FROM service_points sp
      LEFT JOIN geographic_areas ga ON ga.id = sp.geographic_area_id
      WHERE sp.organization_id = $1
      ORDER BY sp.created_at ASC
    `, [orgId]);
    return result.rows;
  }
}
