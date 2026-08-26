/**
 * NexoraOS™ — Procurement & Tenders Engine
 * RFQs, Vendor Bids, Purchase Orders, 3-Way Match, Goods Receipt, Vendor Performance
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import {
  RFQCreate, VendorBidCreate, RFQStatus, POStatus,
  PaginationParams, PaginatedResult
} from '../core/types';
import {
  paginatedQuery, requireField, optionalString, optionalNumber,
  generateCode, generateTxNumber, auditLog, AuthContext
} from '../core/helpers';
import logger from '../core/logger';

// ─── RFQ Management ────────────────────────────────────

export class RFQEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    projectId?: string;
    search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['r.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.status) { conditions.push(`r.status = $${idx++}`); params.push(filters.status); }
    if (filters?.projectId) { conditions.push(`r.project_id = $${idx++}`); params.push(filters.projectId); }
    if (filters?.search) {
      conditions.push(`(r.title_ar ILIKE $${idx} OR r.title_en ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.join(' AND ');

    return paginatedQuery(
      `SELECT r.*, p.name_ar as project_name_ar,
              (SELECT COUNT(*) FROM vendor_bids vb WHERE vb.rfq_id = r.id) as bids_count
       FROM procurement_tenders r
       LEFT JOIN projects p ON p.id = r.project_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM procurement_tenders r WHERE ${where}`,
      params,
      pagination
    );
  }

  static async getById(rfqId: string) {
    const rfq = await queryOne(
      `SELECT r.*, p.name_ar as project_name_ar
       FROM procurement_tenders r
       LEFT JOIN projects p ON p.id = r.project_id
       WHERE r.id = $1`,
      [rfqId]
    );

    if (!rfq) return null;

    const bids = await queryMany(
      `SELECT vb.*, v.name_ar as vendor_name_ar, v.name_en as vendor_name_en
       FROM vendor_bids vb
       JOIN vendors v ON v.id = vb.vendor_id
       WHERE vb.rfq_id = $1
       ORDER BY vb.computed_score DESC`,
      [rfqId]
    );

    return { ...rfq, bids };
  }

  static async create(data: RFQCreate, auth: AuthContext) {
    return await transaction(async (client) => {
      const code = generateCode('RFQ-');

      const result = await client.query(
        `INSERT INTO procurement_tenders
         (organization_id, tender_number, title_ar, title_en, project_id,
          estimated_value, currency_code, submission_deadline, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT')
         RETURNING *`,
        [
          data.organizationId,
          code,
          requireField(data.titleAr, 'titleAr'),
          optionalString(data.titleEn),
          data.projectId || null,
          data.estimatedValue || 0,
          data.currencyCode || 'USD',
          data.submissionDeadline || null,
        ]
      );

      await auditLog({
        organizationId: data.organizationId,
        userId: auth.userId,
        action: 'CREATE',
        tableName: 'procurement_tenders',
        recordId: result.rows[0].id,
        details: { tenderNumber: code },
      });

      return result.rows[0];
    });
  }

  static async updateStatus(rfqId: string, status: RFQStatus, auth: AuthContext) {
    const result = await queryOne(
      `UPDATE procurement_tenders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, rfqId]
    );
    return result;
  }

  /**
   * Award RFQ to winning bid
   */
  static async award(rfqId: string, winningBidId: string, auth: AuthContext) {
    return await transaction(async (client) => {
      // Get RFQ
      const rfq = await client.query(
        'SELECT * FROM procurement_tenders WHERE id = $1 AND status IN ($2, $3)',
        [rfqId, 'OPEN', 'EVALUATING']
      );
      if (rfq.rows.length === 0) throw new Error('RFQ not found or not in awardable status');

      // Get winning bid
      const bid = await client.query(
        'SELECT * FROM vendor_bids WHERE id = $1 AND rfq_id = $2',
        [winningBidId, rfqId]
      );
      if (bid.rows.length === 0) throw new Error('Winning bid not found');

      // Update RFQ status
      await client.query(
        "UPDATE procurement_tenders SET status = 'AWARDED' WHERE id = $1",
        [rfqId]
      );

      // Update winning bid
      await client.query(
        "UPDATE vendor_bids SET status = 'ACCEPTED' WHERE id = $1",
        [winningBidId]
      );

      // Reject other bids
      await client.query(
        "UPDATE vendor_bids SET status = 'REJECTED' WHERE rfq_id = $1 AND id != $2 AND status != 'ACCEPTED'",
        [rfqId, winningBidId]
      );

      // Create Purchase Order
      const poNumber = generateCode('PO-');
      const poResult = await client.query(
        `INSERT INTO purchase_orders
         (organization_id, po_number, rfq_id, vendor_id, total_amount,
          currency_code, status, created_by_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_APPROVAL', $7)
         RETURNING *`,
        [
          rfq.rows[0].organization_id,
          poNumber,
          rfqId,
          bid.rows[0].vendor_id,
          bid.rows[0].quoted_amount,
          bid.rows[0].currency_code || 'USD',
          auth.userId,
        ]
      );

      return {
        rfqId,
        poId: poResult.rows[0].id,
        poNumber,
        winningBidId,
        awardedAmount: bid.rows[0].quoted_amount,
        vendorId: bid.rows[0].vendor_id,
      };
    });
  }
}

// ─── Vendor Bid Management ─────────────────────────────

export class VendorBidEngine {
  static async submit(data: VendorBidCreate, auth: AuthContext) {
    return await transaction(async (client) => {
      // Verify RFQ is open
      const rfq = await client.query(
        "SELECT * FROM procurement_tenders WHERE id = $1 AND status IN ('OPEN', 'EVALUATING')",
        [data.rfqId]
      );
      if (rfq.rows.length === 0) throw new Error('RFQ is not accepting bids');

      // Check for duplicate bid from same vendor
      const existing = await client.query(
        'SELECT id FROM vendor_bids WHERE rfq_id = $1 AND vendor_id = $2',
        [data.rfqId, data.vendorId]
      );
      if (existing.rows.length > 0) {
        throw new Error('This vendor has already submitted a bid for this RFQ');
      }

      // Calculate composite score (40% technical + 60% financial)
      const technicalScore = data.technicalScore || 0;
      const financialScore = data.quotedAmount > 0
        ? Math.min(100, (Number(rfq.rows[0].estimated_value || 0) / data.quotedAmount) * 100)
        : 0;
      const compositeScore = (technicalScore * 0.4) + (financialScore * 0.6);

      const result = await client.query(
        `INSERT INTO vendor_bids
         (rfq_id, vendor_id, quoted_amount, currency_code, technical_score,
          financial_score, computed_score, delivery_days, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SUBMITTED')
         RETURNING *`,
        [
          data.rfqId,
          data.vendorId,
          data.quotedAmount,
          data.currencyCode || 'USD',
          technicalScore,
          Math.round(financialScore * 100) / 100,
          Math.round(compositeScore * 100) / 100,
          data.deliveryDays || null,
          optionalString(data.notes),
        ]
      );

      // Update RFQ status to EVALUATING
      await client.query(
        "UPDATE procurement_tenders SET status = 'EVALUATING' WHERE id = $1 AND status = 'OPEN'",
        [data.rfqId]
      );

      return result.rows[0];
    });
  }

  static async evaluate(bidId: string, evaluation: {
    technicalScore: number;
    notes?: string;
  }, auth: AuthContext) {
    const bid = await queryOne('SELECT * FROM vendor_bids WHERE id = $1', [bidId]);
    if (!bid) throw new Error('Bid not found');

    const financialScore = Number(bid.financial_score || 0);
    const compositeScore = (evaluation.technicalScore * 0.4) + (financialScore * 0.6);

    return queryOne(
      `UPDATE vendor_bids
       SET technical_score = $1, computed_score = $2, evaluation_notes = $3, evaluated_by = $4
       WHERE id = $5 RETURNING *`,
      [evaluation.technicalScore, Math.round(compositeScore * 100) / 100, optionalString(evaluation.notes), auth.userId, bidId]
    );
  }
}

// ─── Purchase Order Management ─────────────────────────

export class PurchaseOrderEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    vendorId?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['po.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.status) { conditions.push(`po.status = $${idx++}`); params.push(filters.status); }
    if (filters?.vendorId) { conditions.push(`po.vendor_id = $${idx++}`); params.push(filters.vendorId); }

    const where = conditions.join(' AND ');

    return paginatedQuery(
      `SELECT po.*, v.name_ar as vendor_name_ar, v.name_en as vendor_name_en,
              r.tender_number as rfq_number
       FROM purchase_orders po
       LEFT JOIN vendors v ON v.id = po.vendor_id
       LEFT JOIN procurement_tenders r ON r.id = po.rfq_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM purchase_orders po WHERE ${where}`,
      params,
      pagination
    );
  }

  static async approve(poId: string, auth: AuthContext) {
    const po = await queryOne(
      "SELECT * FROM purchase_orders WHERE id = $1 AND status = 'PENDING_APPROVAL'",
      [poId]
    );
    if (!po) throw new Error('Purchase order not found or already approved');

    // Budget Hard-Lock Verification (NEB-10 / NEB-14 Compliance)
    if (po.project_id) {
      const proj = await queryOne(
        'SELECT budget, COALESCE(spent_amount, 0) as spent FROM projects WHERE id = $1',
        [po.project_id]
      );
      if (proj && proj.budget) {
        const available = Number(proj.budget) - Number(proj.spent);
        if (Number(po.total_amount) > available) {
          throw new Error(
            `Budget Violation: Purchase Order amount (${po.total_amount}) exceeds available project budget (${available})`
          );
        }
      }
    }

    return queryOne(
      `UPDATE purchase_orders
       SET status = 'APPROVED', approved_by = $1, approved_at = NOW()
       WHERE id = $2 RETURNING *`,
      [auth.userId, poId]
    );
  }

  /**
   * Confirm goods receipt (partial or full)
   */
  static async confirmReceipt(poId: string, data: {
    receivedAmount: number;
    receivedDate: string;
    condition?: string;
    notes?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const po = await client.query(
        "SELECT * FROM purchase_orders WHERE id = $1 AND status IN ('APPROVED', 'PARTIALLY_RECEIVED')",
        [poId]
      );
      if (po.rows.length === 0) throw new Error('Purchase order not found or not ready for receipt');

      const existingPo = po.rows[0];
      const newReceivedTotal = Number(existingPo.received_amount || 0) + data.receivedAmount;
      const orderTotal = Number(existingPo.total_amount || 0);

      let newStatus: string;
      if (newReceivedTotal >= orderTotal) {
        newStatus = 'RECEIVED';
      } else {
        newStatus = 'PARTIALLY_RECEIVED';
      }

      // Record receipt
      await client.query(
        `INSERT INTO goods_receipts
         (purchase_order_id, organization_id, received_amount, received_date,
          condition_code, notes, received_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          poId,
          existingPo.organization_id,
          data.receivedAmount,
          data.receivedDate,
          optionalString(data.condition),
          optionalString(data.notes),
          auth.userId,
        ]
      ).catch((err) => {
        logger.error('Goods receipt insert failed', { context: 'procurement', error: err.message });
      });

      // Update PO
      const result = await client.query(
        `UPDATE purchase_orders
         SET status = $1, received_amount = $2, received_date = $3
         WHERE id = $4 RETURNING *`,
        [newStatus, newReceivedTotal, data.receivedDate, poId]
      );

      return {
        purchaseOrderId: poId,
        status: newStatus,
        receivedAmount: newReceivedTotal,
        remainingAmount: orderTotal - newReceivedTotal,
        fullyReceived: newStatus === 'RECEIVED',
      };
    });
  }
}

// ─── 3-Way Match Engine ────────────────────────────────

export class ThreeWayMatchEngine {
  /**
   * Perform 3-way match: PO ↔ Goods Receipt ↔ Invoice
   */
  static async performMatch(poId: string, data: {
    invoiceNumber: string;
    invoiceAmount: number;
    invoiceDate: string;
    notes?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      // Get PO
      const po = await client.query(
        'SELECT * FROM purchase_orders WHERE id = $1',
        [poId]
      );
      if (po.rows.length === 0) throw new Error('Purchase order not found');

      const purchaseOrder = po.rows[0];

      // Get goods receipts
      const receipts = await client.query(
        'SELECT COALESCE(SUM(received_amount), 0) as total_received FROM goods_receipts WHERE purchase_order_id = $1',
        [poId]
      ).catch((err) => { logger.error('Goods receipts sum failed', { context: 'procurement', error: err.message }); return { rows: [{ total_received: 0 }] }; });

      const totalReceived = Number(receipts.rows[0].total_received);
      const totalOrdered = Number(purchaseOrder.total_amount);
      const totalInvoiced = data.invoiceAmount;

      // Match results
      const poToReceiptMatch = Math.abs(totalOrdered - totalReceived) < 0.01;
      const receiptToInvoiceMatch = Math.abs(totalReceived - totalInvoiced) < 0.01;
      const poToInvoiceMatch = Math.abs(totalOrdered - totalInvoiced) < 0.01;

      const isFullyMatched = poToReceiptMatch && receiptToInvoiceMatch;

      // Record match
      await client.query(
        `INSERT INTO three_way_match_records
         (purchase_order_id, organization_id, invoice_number, invoice_amount,
          invoice_date, total_ordered, total_received, total_invoiced,
          po_receipt_match, receipt_invoice_match, po_invoice_match,
          is_fully_matched, notes, matched_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          poId,
          purchaseOrder.organization_id,
          data.invoiceNumber,
          data.invoiceAmount,
          data.invoiceDate,
          totalOrdered,
          totalReceived,
          totalInvoiced,
          poToReceiptMatch,
          receiptToInvoiceMatch,
          poToInvoiceMatch,
          isFullyMatched,
          optionalString(data.notes),
          auth.userId,
        ]
      ).catch((err) => {
        logger.error('Three-way match insert failed', { context: 'procurement', error: err.message });
      });

      // Automatically post double-entry transaction to IPSAS Ledger when 3-way match succeeds
      if (isFullyMatched) {
        try {
          const txNumber = generateTxNumber('PUR');
          const txRes = await client.query(
            `INSERT INTO transactions
             (organization_id, transaction_number, transaction_date, posting_date,
              transaction_type, description, reference_no, total_debit, total_credit, status, created_by_id)
             VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE, 'PURCHASE', $3, $4, $5, $5, 'POSTED', $6)
             RETURNING id`,
            [
              purchaseOrder.organization_id,
              txNumber,
              `Procurement Auto-Ledger Post: PO #${purchaseOrder.po_number || poId} - Invoice #${data.invoiceNumber}`,
              data.invoiceNumber,
              data.invoiceAmount,
              auth.userId,
            ]
          );

          if (txRes && txRes.rows && txRes.rows.length > 0) {
            const txId = txRes.rows[0].id;
            const expAccount = await client.query(
              "SELECT id FROM chart_of_accounts WHERE account_type = 'EXPENSE' OR account_code LIKE '5%' LIMIT 1"
            );
            const apAccount = await client.query(
              "SELECT id FROM chart_of_accounts WHERE account_type = 'LIABILITY' OR account_code LIKE '2%' LIMIT 1"
            );

            const expAccId = expAccount?.rows?.[0]?.id || null;
            const apAccId = apAccount?.rows?.[0]?.id || null;

            if (expAccId && apAccId) {
              await client.query(
                `INSERT INTO transaction_lines
                 (transaction_id, organization_id, line_number, account_id, debit, credit, currency_code, description, project_id)
                 VALUES ($1, $2, 1, $3, $4, 0, $5, $6, $7)`,
                [
                  txId,
                  purchaseOrder.organization_id,
                  expAccId,
                  data.invoiceAmount,
                  purchaseOrder.currency_code || 'USD',
                  `Procurement Expense - PO #${purchaseOrder.po_number || poId}`,
                  purchaseOrder.project_id || null,
                ]
              );

              await client.query(
                `INSERT INTO transaction_lines
                 (transaction_id, organization_id, line_number, account_id, debit, credit, currency_code, description, project_id)
                 VALUES ($1, $2, 2, $3, 0, $4, $5, $6, $7)`,
                [
                  txId,
                  purchaseOrder.organization_id,
                  apAccId,
                  data.invoiceAmount,
                  purchaseOrder.currency_code || 'USD',
                  `Accounts Payable Vendor - PO #${purchaseOrder.po_number || poId}`,
                  purchaseOrder.project_id || null,
                ]
              );
            }
          }
        } catch (err: any) {
          logger.error('Auto ledger insert failed for procurement match', { context: 'procurement', error: err?.message });
        }
      }

      return {
        purchaseOrderId: poId,
        poNumber: purchaseOrder.po_number,
        match: {
          poToReceipt: { ordered: totalOrdered, received: totalReceived, matched: poToReceiptMatch },
          receiptToInvoice: { received: totalReceived, invoiced: totalInvoiced, matched: receiptToInvoiceMatch },
          poToInvoice: { ordered: totalOrdered, invoiced: totalInvoiced, matched: poToInvoiceMatch },
          fullyMatched: isFullyMatched,
        },
        status: isFullyMatched ? 'MATCHED' : 'MISMATCH',
      };
    });
  }

  /**
   * Get match history for a PO
   */
  static async getMatchHistory(poId: string) {
    return queryMany(
      `SELECT * FROM three_way_match_records
       WHERE purchase_order_id = $1
       ORDER BY created_at DESC`,
      [poId]
    ).catch((err) => { logger.error('Query failed', { context: 'procurement', error: err.message }); return []; });
  }
}

// ─── Vendor Performance ────────────────────────────────

export class VendorPerformanceEngine {
  static async getVendorStats(vendorId: string) {
    const stats = await queryOne(
      `SELECT
        v.id as vendor_id,
        v.name_ar,
        v.name_en,
        COUNT(DISTINCT vb.id) as total_bids,
        COUNT(DISTINCT CASE WHEN vb.status = 'ACCEPTED' THEN vb.id END) as winning_bids,
        CASE WHEN COUNT(DISTINCT vb.id) > 0
          THEN ROUND(COUNT(DISTINCT CASE WHEN vb.status = 'ACCEPTED' THEN vb.id END)::float / COUNT(DISTINCT vb.id)::float * 100, 2)
          ELSE 0 END as win_rate_pct,
        COALESCE(AVG(vb.computed_score), 0) as avg_score,
        COALESCE(AVG(vb.delivery_days), 0) as avg_delivery_days,
        COUNT(DISTINCT po.id) as total_orders,
        COALESCE(SUM(po.total_amount), 0) as total_order_value
       FROM vendors v
       LEFT JOIN vendor_bids vb ON vb.vendor_id = v.id
       LEFT JOIN purchase_orders po ON po.vendor_id = v.id
       WHERE v.id = $1
       GROUP BY v.id, v.name_ar, v.name_en`,
      [vendorId]
    );

    return stats || null;
  }

  static async getTopVendors(orgId: string, limit = 10) {
    return queryMany(
      `SELECT
        v.id,
        v.name_ar,
        v.name_en,
        COUNT(DISTINCT vb.id) as total_bids,
        COUNT(DISTINCT CASE WHEN vb.status = 'ACCEPTED' THEN vb.id END) as wins,
        COALESCE(AVG(vb.computed_score), 0) as avg_score,
        COALESCE(AVG(vb.delivery_days), 0) as avg_delivery
       FROM vendors v
       LEFT JOIN vendor_bids vb ON vb.vendor_id = v.id
       WHERE v.organization_id = $1
       GROUP BY v.id, v.name_ar, v.name_en
       HAVING COUNT(DISTINCT vb.id) > 0
       ORDER BY avg_score DESC
       LIMIT $2`,
      [orgId, limit]
    );
  }
}
