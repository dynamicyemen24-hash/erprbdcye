/**
 * UAMEX ERP™ — NEB-14 Procurement & Tenders OS
 * Tender & Electronic Auction Engine (E2E lifecycle)
 * دورة حياة المناقصة: إنشاء → نشر → استلام عروض → تقييم فني/مالي → ترسية → تعاقد
 * المزايدات الإلكترونية: مزاد أمامي/عكسي مع مزايدة حية وإسناد تلقائي.
 */

import { queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import {
  paginatedQuery, requireField, optionalString,
  generateCode, auditLog, AuthContext
} from '../core/helpers';

// أوزان التقييم المعيارية (40% فني + 60% مالي)
export const TENDER_EVAL_WEIGHTS = { TECHNICAL: 0.4, FINANCIAL: 0.6 };

/** انتقالات الحالة المعيارية لدورة حياة المناقصة */
const TENDER_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['BID_SUBMISSION', 'CANCELLED'],
  BID_SUBMISSION: ['EVALUATION_TECH', 'CANCELLED'],
  EVALUATION_TECH: ['EVALUATION_FIN', 'CANCELLED'],
  EVALUATION_FIN: ['AWARD_PENDING', 'CANCELLED'],
  AWARD_PENDING: ['AWARDED', 'EVALUATION_FIN', 'CANCELLED'],
  AWARDED: ['CONTRACTED', 'CHALLENGED'],
  CONTRACTED: ['COMPLETED'],
  CHALLENGED: ['EVALUATION_FIN', 'CANCELLED'],
};

export class TenderEngine {

  /** التحقق من انتقال حالة صالح */
  private static assertTransition(from: string, to: string) {
    const allowed = TENDER_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`انتقال حالة غير صالح: ${from} ← ${to}. المسموح: ${(allowed || []).join(', ') || 'لا شيء'}`);
    }
  }

  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string; projectId?: string; search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['t.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;
    if (filters?.status) { conditions.push(`t.status = $${idx++}`); params.push(filters.status); }
    if (filters?.projectId) { conditions.push(`t.project_id = $${idx++}`); params.push(filters.projectId); }
    if (filters?.search) {
      conditions.push(`(t.title_ar ILIKE $${idx} OR t.title_en ILIKE $${idx} OR t.tender_number ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT t.*, p.name_ar as project_name_ar,
              (SELECT COUNT(*) FROM vendor_bids vb WHERE vb.rfq_id = t.id)::int as bids_count,
              (SELECT MAX(vb.computed_score) FROM vendor_bids vb WHERE vb.rfq_id = t.id) as best_score
       FROM procurement_tenders t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM procurement_tenders t WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(orgId: string, tenderId: string) {
    const tender = await queryOne(
      `SELECT t.*, p.name_ar as project_name_ar
       FROM procurement_tenders t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND t.organization_id = $2`, [tenderId, orgId]
    );
    if (!tender) return null;
    const bids = await queryMany(
      `SELECT vb.*, v.name_ar as vendor_name_ar, v.name_en as vendor_name_en, v.vendor_code
       FROM vendor_bids vb
       JOIN vendors v ON v.id = vb.vendor_id
       WHERE vb.rfq_id = $1 AND vb.organization_id = $2
       ORDER BY vb.computed_score DESC NULLS LAST, vb.bid_amount ASC`, [tenderId, orgId]
    );
    const summary = await queryOne(
      `SELECT COUNT(*)::int as total,
              COALESCE(AVG(vb.bid_amount), 0) as avg_amount,
              COALESCE(MIN(vb.bid_amount), 0) as min_amount,
              COALESCE(MAX(vb.computed_score), 0) as best_score
       FROM vendor_bids vb WHERE vb.rfq_id = $1 AND vb.organization_id = $2`, [tenderId, orgId]
    );
    return { ...tender, bids, summary };
  }

  static async create(data: {
    titleAr: string; titleEn?: string; projectId?: string;
    estimatedValue?: number; currencyCode?: string; submissionDeadline?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      if (data.projectId) {
        const project = await client.query(
          'SELECT id FROM projects WHERE id = $1 AND organization_id = $2',
          [data.projectId, auth.orgId]
        );
        if (project.rows.length === 0) throw new Error('المشروع غير موجود ضمن المنظمة الحالية');
      }
      if (data.estimatedValue !== undefined && (!Number.isFinite(data.estimatedValue) || data.estimatedValue <= 0)) {
        throw new Error('القيمة التقديرية يجب أن تكون رقماً موجباً');
      }
      const code = generateCode('TND-');
      const result = await client.query(
        `INSERT INTO procurement_tenders
         (organization_id, tender_number, title_ar, title_en, project_id,
          estimated_value, currency_code, submission_deadline, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT')
         RETURNING *`,
        [
          auth.orgId, code,
          requireField(data.titleAr, 'titleAr'),
          optionalString(data.titleEn),
          data.projectId || null,
          data.estimatedValue || 0,
          data.currencyCode || 'USD',
          data.submissionDeadline || null,
        ]
      );
      await auditLog({
        organizationId: auth.orgId, userId: auth.userId, action: 'CREATE',
        tableName: 'procurement_tenders', recordId: result.rows[0].id,
        details: { tenderNumber: code },
      });
      return result.rows[0];
    });
  }

  /** انتقال حالة المناقصة عبر سلسلة دورة الحياة المعيارية مع تدقيق كامل */
  static async transitionTender(tenderId: string, targetStatus: string, auth: AuthContext) {
    return await transaction(async (client) => {
      const current = await client.query(
        'SELECT * FROM procurement_tenders WHERE id = $1 AND organization_id = $2 FOR UPDATE',
        [tenderId, auth.orgId]
      );
      if (current.rows.length === 0) throw new Error('المناقصة غير موجودة');
      TenderEngine.assertTransition(current.rows[0].status, targetStatus);

      // ضوابط النشر: لا نشر بدون قيمة تقديرية وموعد نهائي
      if (targetStatus === 'PUBLISHED') {
        const t = current.rows[0];
        if (Number(t.estimated_value) <= 0) throw new Error('لا يمكن نشر مناقصة بدون قيمة تقديرية');
        if (!t.submission_deadline) throw new Error('لا يمكن نشر مناقصة بدون آخر موعد لاستلام العروض');
      }

      const updated = await client.query(
        'UPDATE procurement_tenders SET status = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 RETURNING *',
        [targetStatus, tenderId, auth.orgId]
      );
      await auditLog({
        organizationId: auth.orgId, userId: auth.userId, action: 'STATUS_CHANGE',
        tableName: 'procurement_tenders', recordId: tenderId,
        details: { from: current.rows[0].status, to: targetStatus },
      });
      return updated.rows[0];
    });
  }

  /** تقديم عرض من مورد — مع ضوابط المهلة ومنع التكرار */
  static async submitBid(tenderId: string, data: {
    vendorId: string; bidAmount: number; currencyCode?: string; deliveryDays?: number;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const tender = await client.query(
        'SELECT * FROM procurement_tenders WHERE id = $1 AND organization_id = $2 FOR UPDATE',
        [tenderId, auth.orgId]
      );
      if (tender.rows.length === 0) throw new Error('المناقصة غير موجودة');
      const t = tender.rows[0];
      if (!['PUBLISHED', 'BID_SUBMISSION'].includes(t.status)) {
        throw new Error('باب استلام العروض مغلق لهذه المناقصة');
      }
      if (t.submission_deadline && new Date(t.submission_deadline) <= new Date()) {
        throw new Error('انتهى آخر موعد لاستلام العروض');
      }
      if (!data.bidAmount || data.bidAmount <= 0) throw new Error('مبلغ العرض يجب أن يكون موجباً');

      const vendor = await client.query(
        'SELECT id FROM vendors WHERE id = $1 AND organization_id = $2 AND status = $3',
        [data.vendorId, auth.orgId, 'ACTIVE']
      );
      if (vendor.rows.length === 0) throw new Error('المورد غير موجود أو غير مؤهل ضمن المنظمة الحالية');
      const dup = await client.query(
        'SELECT id FROM vendor_bids WHERE rfq_id = $1 AND vendor_id = $2 AND organization_id = $3', [tenderId, data.vendorId, auth.orgId]
      );
      if (dup.rows.length > 0) throw new Error('هذا المورد قدّم عرضاً مسبقاً على نفس المناقصة');

      const result = await client.query(
        `INSERT INTO vendor_bids
         (organization_id, rfq_id, vendor_id, bid_amount, currency_code, delivery_days, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'SUBMITTED')
         RETURNING *`,
        [t.organization_id, tenderId, data.vendorId, data.bidAmount,
         data.currencyCode || t.currency_code || 'USD', data.deliveryDays || null]
      );
      await auditLog({
        organizationId: t.organization_id, userId: auth.userId, action: 'BID_SUBMIT',
        tableName: 'vendor_bids', recordId: result.rows[0].id,
        details: { tenderId, bidAmount: data.bidAmount },
      });
      return result.rows[0];
    });
  }

  /**
   * تقييم عرض: درجة فنية من اللجنة + درجة مالية معيارية
   * (أفضل سعر = أقل عرض / هذا العرض × 100) ثم النتيجة المركبة المرجحة (40/60).
   */
  static async evaluateBid(bidId: string, data: { technicalScore: number }, auth: AuthContext) {
    if (data.technicalScore < 0 || data.technicalScore > 100) {
      throw new Error('الدرجة الفنية يجب أن تكون بين 0 و 100');
    }
    return await transaction(async (client) => {
      const bid = await client.query(
        `SELECT vb.*, t.status as tender_status
         FROM vendor_bids vb
         JOIN procurement_tenders t ON t.id = vb.rfq_id
         WHERE vb.id = $1`, [bidId]
      );
      if (bid.rows.length === 0) throw new Error('العرض غير موجود');
      const b = bid.rows[0];
      if (!['EVALUATION_TECH', 'EVALUATION_FIN', 'AWARD_PENDING'].includes(b.tender_status)) {
        throw new Error('التقييم متاح فقط في مراحل التقييم الفني/المالي/الترسية');
      }

      // الدرجة المالية المعيارية: نسبة أقل عرض تنافسي إلى هذا العرض
      const minRes = await client.query(
        'SELECT MIN(bid_amount) as min_amount FROM vendor_bids WHERE rfq_id = $1 AND bid_amount > 0',
        [b.rfq_id]
      );
      const minAmount = Number(minRes.rows[0]?.min_amount || 0);
      const financialScore = Number(b.bid_amount) > 0 && minAmount > 0
        ? Math.min(100, (minAmount / Number(b.bid_amount)) * 100)
        : 0;

      const composite = (data.technicalScore * TENDER_EVAL_WEIGHTS.TECHNICAL)
        + (financialScore * TENDER_EVAL_WEIGHTS.FINANCIAL);

      const updated = await client.query(
        `UPDATE vendor_bids
         SET technical_score = $1, financial_score = $2, computed_score = $3, status = 'EVALUATED'
         WHERE id = $4 RETURNING *`,
        [data.technicalScore, Math.round(financialScore * 100) / 100, Math.round(composite * 100) / 100, bidId]
      );
      await auditLog({
        organizationId: b.organization_id, userId: auth.userId, action: 'BID_EVALUATE',
        tableName: 'vendor_bids', recordId: bidId,
        details: { technical: data.technicalScore, financial: financialScore, composite },
      });
      return updated.rows[0];
    });
  }

  /** ملخص تقييم شامل لجميع عروض مناقصة (لجنة الترسية) */
  static async getEvaluationSummary(tenderId: string) {
    const tender = await queryOne('SELECT * FROM procurement_tenders WHERE id = $1', [tenderId]);
    if (!tender) throw new Error('المناقصة غير موجودة');
    const ranked = await queryMany(
      `SELECT vb.*, v.name_ar as vendor_name_ar, v.vendor_code
       FROM vendor_bids vb
       JOIN vendors v ON v.id = vb.vendor_id
       WHERE vb.rfq_id = $1
       ORDER BY vb.computed_score DESC NULLS LAST`, [tenderId]
    );
    const summary = await queryOne(
      `SELECT COUNT(*)::int as total,
              COALESCE(AVG(vb.bid_amount), 0) as avg_amount,
              COALESCE(MIN(vb.bid_amount), 0) as min_amount,
              COALESCE(MAX(vb.bid_amount), 0) as max_amount
       FROM vendor_bids vb WHERE vb.rfq_id = $1`, [tenderId]
    );
    return { tender, ranked, summary };
  }

  /**
   * الترسية: إسناد المناقصة للعرض الفائز (أعلى نتيجة مركبة).
   * تحدد العرض الفائز، وترفض الباقي، وتنتقل المناقصة إلى AWARDED،
   * وتنشئ أمر شراء مسودة تلقائياً موصولاً بالمناقصة (إغلاق E2E نحو الشراء).
   */
  static async awardTender(tenderId: string, winningBidId: string, auth: AuthContext) {
    return await transaction(async (client) => {
      const tender = await client.query(
        'SELECT * FROM procurement_tenders WHERE id = $1 AND organization_id = $2 FOR UPDATE',
        [tenderId, auth.orgId]
      );
      if (tender.rows.length === 0) throw new Error('المناقصة غير موجودة');
      const t = tender.rows[0];
      TenderEngine.assertTransition(t.status, 'AWARDED');

      const winRes = await client.query(
        'SELECT * FROM vendor_bids WHERE id = $1 AND rfq_id = $2 AND organization_id = $3',
        [winningBidId, tenderId, auth.orgId]
      );
      if (winRes.rows.length === 0) throw new Error('العرض الفائز غير موجود ضمن عروض هذه المناقصة');
      const winner = winRes.rows[0];
      if (!winner.computed_score) throw new Error('لا يمكن الترسية لعرض غير مُقيّم');

      // تحديد الفائز ورفض بقية العروض
      await client.query(
        `UPDATE vendor_bids SET status = CASE WHEN id = $1 THEN 'WON' ELSE 'LOST' END
         WHERE rfq_id = $2 AND organization_id = $3`, [winningBidId, tenderId, auth.orgId]
      );
      await client.query(
        `UPDATE procurement_tenders SET status = 'AWARDED', updated_at = NOW() WHERE id = $1`,
        [tenderId, auth.orgId]
      );

      // إنشاء أمر شراء مسودة مرتبط بالمناقصة (يُعتمد لاحقاً عبر PurchaseOrderEngine)
      const poRes = await client.query(
        `INSERT INTO purchase_orders
         (organization_id, po_number, vendor_id, project_id, rfq_id,
          total_amount, currency_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT')
         RETURNING *`,
        [t.organization_id, generateCode('PO-'), winner.vendor_id, t.project_id,
         tenderId, winner.bid_amount, winner.currency_code || 'USD']
      );

      await auditLog({
        organizationId: t.organization_id, userId: auth.userId, action: 'TENDER_AWARD',
        tableName: 'procurement_tenders', recordId: tenderId,
        details: { winningBidId, vendorId: winner.vendor_id, poId: poRes.rows[0].id },
      });
      return { tender: { ...t, status: 'AWARDED' }, winningBid: winner, purchaseOrder: poRes.rows[0] };
    });
  }

}

// ─── المزايدات الإلكترونية (Electronic Auctions) ───────────────────────────

const AUCTION_TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ['LIVE', 'CANCELLED'],
  LIVE: ['CLOSED', 'CANCELLED'],
  CLOSED: ['AWARDED'],
  AWARDED: [],
  CANCELLED: [],
};

export class AuctionEngine {

  private static assertTransition(from: string, to: string) {
    const allowed = AUCTION_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`انتقال حالة غير صالح للمزاد: ${from} ← ${to}`);
    }
  }

  static async list(orgId: string, pagination: PaginationParams = {}, filters?: { status?: string }) {
    const conditions = ['a.organization_id = $1'];
    const params: any[] = [orgId];
    if (filters?.status) { conditions.push('a.status = $2'); params.push(filters.status); }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT a.*, t.tender_number,
              (SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.id)::int as bids_count
       FROM tender_auctions a
       LEFT JOIN procurement_tenders t ON t.id = a.tender_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM tender_auctions a WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(auctionId: string) {
    const auction = await queryOne('SELECT a.*, t.tender_number FROM tender_auctions a LEFT JOIN procurement_tenders t ON t.id = a.tender_id WHERE a.id = $1', [auctionId]);
    if (!auction) throw new Error('المزاد غير موجود');
    const bids = await queryMany(
      `SELECT ab.*, v.name_ar as vendor_name_ar, v.vendor_code
       FROM auction_bids ab JOIN vendors v ON v.id = ab.vendor_id
       WHERE ab.auction_id = $1 ORDER BY ab.bid_amount ASC, ab.created_at ASC`, [auctionId]
    );
    return { ...auction, bids };
  }

  static async create(data: {
    organizationId: string; tenderId?: string; titleAr: string; titleEn?: string;
    auctionType?: string; startPrice?: number; reservePrice?: number;
    currencyCode?: string; startsAt?: string; endsAt?: string;
  }, auth: AuthContext) {
    requireField(data.titleAr, 'عنوان المزاد');
    return await transaction(async (client) => {
      const res = await client.query(
        `INSERT INTO tender_auctions
         (organization_id, tender_id, auction_number, title_ar, title_en,
          auction_type, start_price, reserve_price, currency_code, starts_at, ends_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [data.organizationId, data.tenderId || null, generateCode('AUC-'), data.titleAr, data.titleEn || null,
         data.auctionType || 'FORWARD', data.startPrice || 0, data.reservePrice || null,
         data.currencyCode || 'USD', data.startsAt || null, data.endsAt || null, auth.userId]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'AUCTION_CREATE', tableName: 'tender_auctions', recordId: res.rows[0].id, details: { titleAr: data.titleAr } });
      return res.rows[0];
    });
  }

  static async openLive(auctionId: string, auth: AuthContext) {
    return await transaction(async (client) => {
      const r = await client.query('SELECT * FROM tender_auctions WHERE id = $1', [auctionId]);
      if (r.rows.length === 0) throw new Error('المزاد غير موجود');
      AuctionEngine.assertTransition(r.rows[0].status, 'LIVE');
      const res = await client.query(`UPDATE tender_auctions SET status = 'LIVE', updated_at = NOW() WHERE id = $1 RETURNING *`, [auctionId]);
      await auditLog({ organizationId: r.rows[0].organization_id, userId: auth.userId, action: 'AUCTION_OPEN', tableName: 'tender_auctions', recordId: auctionId });
      return res.rows[0];
    });
  }

  static async close(auctionId: string, auth: AuthContext) {
    return await transaction(async (client) => {
      const r = await client.query('SELECT * FROM tender_auctions WHERE id = $1', [auctionId]);
      if (r.rows.length === 0) throw new Error('المزاد غير موجود');
      AuctionEngine.assertTransition(r.rows[0].status, 'CLOSED');
      const auction = r.rows[0];
      const bestQ = await client.query(
        `SELECT * FROM auction_bids WHERE auction_id = $1 AND status = 'ACTIVE'
         ORDER BY bid_amount ${auction.auction_type === 'FORWARD' ? 'DESC' : 'ASC'}, created_at ASC LIMIT 1`,
        [auctionId]
      );
      if (bestQ.rows.length > 0) {
        await client.query(`UPDATE auction_bids SET is_winning = FALSE WHERE auction_id = $1`, [auctionId]);
        await client.query(`UPDATE auction_bids SET is_winning = TRUE WHERE id = $1`, [bestQ.rows[0].id]);
      }
      const res = await client.query(`UPDATE tender_auctions SET status = 'CLOSED', updated_at = NOW() WHERE id = $1 RETURNING *`, [auctionId]);
      await auditLog({ organizationId: auction.organization_id, userId: auth.userId, action: 'AUCTION_CLOSE', tableName: 'tender_auctions', recordId: auctionId });
      return res.rows[0];
    });
  }

  static async placeBid(auctionId: string, data: { vendorId: string; bidAmount: number; currencyCode?: string; notes?: string }, auth: AuthContext) {
    if (!data.vendorId || !data.bidAmount) throw new Error('المورد ومبلغ العرض مطلوبان');
    return await transaction(async (client) => {
      const r = await client.query('SELECT * FROM tender_auctions WHERE id = $1', [auctionId]);
      if (r.rows.length === 0) throw new Error('المزاد غير موجود');
      if (r.rows[0].status !== 'LIVE') throw new Error('المزاد غير نشط حالياً');
      const res = await client.query(
        `INSERT INTO auction_bids (organization_id, auction_id, vendor_id, bid_amount, currency_code, notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [r.rows[0].organization_id, auctionId, data.vendorId, data.bidAmount, data.currencyCode || 'USD', data.notes || null]
      );
      await client.query(`UPDATE tender_auctions SET current_best_bid = $1, updated_at = NOW() WHERE id = $2`, [data.bidAmount, auctionId]);
      await auditLog({ organizationId: r.rows[0].organization_id, userId: auth.userId, action: 'AUCTION_BID', tableName: 'auction_bids', recordId: res.rows[0].id, details: { bidAmount: data.bidAmount } });
      return res.rows[0];
    });
  }

  static async award(auctionId: string, auth: AuthContext) {
    return await transaction(async (client) => {
      const r = await client.query('SELECT * FROM tender_auctions WHERE id = $1', [auctionId]);
      if (r.rows.length === 0) throw new Error('المزاد غير موجود');
      AuctionEngine.assertTransition(r.rows[0].status, 'AWARDED');
      const bestQ = await client.query(
        `SELECT * FROM auction_bids WHERE auction_id = $1 AND is_winning = TRUE LIMIT 1`, [auctionId]
      );
      if (bestQ.rows.length === 0) throw new Error('لا يوجد عرض فائز — أغلق المزاد أولاً');
      const winner = bestQ.rows[0];
      const auction = r.rows[0];
      const poRes = await client.query(
        `INSERT INTO purchase_orders (organization_id, po_number, vendor_id, project_id, rfq_id, total_amount, currency_code, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'DRAFT') RETURNING *`,
        [auction.organization_id, generateCode('PO-'), winner.vendor_id, null, auction.tender_id, winner.bid_amount, winner.currency_code || 'USD']
      );
      await client.query(`UPDATE tender_auctions SET status = 'AWARDED', updated_at = NOW() WHERE id = $1`, [auctionId]);
      await auditLog({ organizationId: auction.organization_id, userId: auth.userId, action: 'AUCTION_AWARD', tableName: 'tender_auctions', recordId: auctionId, details: { winningBidId: winner.id, poId: poRes.rows[0].id } });
      return { auction: { ...auction, status: 'AWARDED' }, winningBid: winner, purchaseOrder: poRes.rows[0] };
    });
  }
}
