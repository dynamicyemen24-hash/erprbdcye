/**
 * NexoraOS™ — Service Delivery & Beneficiary Engine
 * Beneficiary management, aid distribution, service tracking, field visits
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import {
  BeneficiaryCreate, ServiceDeliveryCreate, ServiceType, AidType,
  PaginationParams, PaginatedResult
} from '../core/types';
import {
  paginatedQuery, requireField, optionalString, optionalNumber,
  generateCode, auditLog, AuthContext
} from '../core/helpers';

// ─── Beneficiary Management ────────────────────────────

export class BeneficiaryEngine {
  /**
   * List beneficiaries with filters and pagination
   */
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    gender?: string;
    governorate?: string;
    vulnerabilityStatus?: string;
    search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['b.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.status) { conditions.push(`b.status = $${idx++}`); params.push(filters.status); }
    if (filters?.gender) { conditions.push(`b.gender = $${idx++}`); params.push(filters.gender); }
    if (filters?.governorate) { conditions.push(`b.governorate = $${idx++}`); params.push(filters.governorate); }
    if (filters?.vulnerabilityStatus) { conditions.push(`b.vulnerability_status = $${idx++}`); params.push(filters.vulnerabilityStatus); }
    if (filters?.search) {
      conditions.push(`(b.full_name_ar ILIKE $${idx} OR b.full_name_en ILIKE $${idx} OR b.beneficiary_code ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.join(' AND ');

    return paginatedQuery(
      `SELECT b.*,
              (SELECT COUNT(*) FROM sponsorships s WHERE s.beneficiary_id = b.id AND s.status = 'ACTIVE') as active_sponsorships,
              (SELECT COUNT(*) FROM service_deliveries sd WHERE sd.beneficiary_id = b.id) as services_received
       FROM beneficiaries b
       WHERE ${where}`,
      `SELECT COUNT(*) FROM beneficiaries b WHERE ${where}`,
      params,
      pagination
    );
  }

  /**
   * Get beneficiary full profile
   */
  static async getById(beneficiaryId: string) {
    const beneficiary = await queryOne(
      `SELECT b.*, p.name_ar as party_name_ar, p.phone as party_phone, p.email as party_email
       FROM beneficiaries b
       LEFT JOIN parties p ON p.id = b.party_id
       WHERE b.id = $1`,
      [beneficiaryId]
    );

    if (!beneficiary) return null;

    const sponsorships = await queryMany(
      `SELECT s.*, sp.name_ar as sponsor_name_ar
       FROM sponsorships s
       LEFT JOIN parties sp ON sp.id = s.sponsor_party_id
       WHERE s.beneficiary_id = $1
       ORDER BY s.created_at DESC`,
      [beneficiaryId]
    );

    const services = await queryMany(
      `SELECT * FROM service_deliveries
       WHERE beneficiary_id = $1
       ORDER BY delivery_date DESC LIMIT 20`,
      [beneficiaryId]
    );

    const aidDistributions = await queryMany(
      `SELECT * FROM aid_distributions
       WHERE beneficiary_id = $1
       ORDER BY distribution_date DESC LIMIT 20`,
      [beneficiaryId]
    );

    const totalAid = await queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total_aid_value
       FROM aid_distributions WHERE beneficiary_id = $1`,
      [beneficiaryId]
    );

    return {
      ...beneficiary,
      sponsorships,
      services,
      aidDistributions,
      totalAidValue: Number(totalAid?.total_aid_value || 0),
    };
  }

  /**
   * Create new beneficiary
   */
  static async create(data: BeneficiaryCreate, auth: AuthContext) {
    return await transaction(async (client) => {
      // Check for duplicates by national ID if provided
      if (data.nationalId) {
        const existing = await client.query(
          'SELECT id FROM beneficiaries WHERE organization_id = $1 AND national_id = $2',
          [data.organizationId, data.nationalId]
        );
        if (existing.rows.length > 0) {
          throw new Error('Beneficiary with this national ID already exists');
        }
      }

      // Generate beneficiary code
      const count = await client.query(
        'SELECT COUNT(*) FROM beneficiaries WHERE organization_id = $1',
        [data.organizationId]
      );
      const code = `BEN-${String(Number(count.rows[0].count) + 1).padStart(5, '0')}`;

      // Create party record
      const partyResult = await client.query(
        `INSERT INTO parties (organization_id, party_type, name_ar, name_en, phone, email, national_id, status)
         VALUES ($1, 'BENEFICIARY', $2, $3, $4, $5, $6, 'ACTIVE') RETURNING id`,
        [
          data.organizationId,
          requireField(data.fullNameAr, 'fullNameAr'),
          optionalString(data.fullNameEn),
          null, null,
          optionalString(data.nationalId),
        ]
      );

      // Create beneficiary record
      const result = await client.query(
        `INSERT INTO beneficiaries
         (organization_id, party_id, beneficiary_code, full_name_ar, full_name_en,
          gender, birth_date, family_members_count, vulnerability_status,
          governorate, district, national_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE')
         RETURNING *`,
        [
          data.organizationId,
          partyResult.rows[0].id,
          code,
          requireField(data.fullNameAr, 'fullNameAr'),
          optionalString(data.fullNameEn),
          optionalString(data.gender),
          data.birthDate || null,
          data.familyMembersCount || 1,
          optionalString(data.vulnerabilityStatus),
          optionalString(data.governorate),
          optionalString(data.district),
          optionalString(data.nationalId),
        ]
      );

      await auditLog({
        organizationId: data.organizationId,
        userId: auth.userId,
        action: 'CREATE',
        tableName: 'beneficiaries',
        recordId: result.rows[0].id,
        details: { beneficiaryCode: code, nameAr: data.fullNameAr },
      });

      return result.rows[0];
    });
  }

  /**
   * Update beneficiary
   */
  static async update(beneficiaryId: string, data: Partial<{
    fullNameAr: string;
    fullNameEn: string;
    gender: string;
    familyMembersCount: number;
    vulnerabilityStatus: string;
    governorate: string;
    district: string;
    status: string;
  }>, auth: AuthContext) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.fullNameAr !== undefined) { sets.push(`full_name_ar = $${idx++}`); values.push(data.fullNameAr); }
    if (data.fullNameEn !== undefined) { sets.push(`full_name_en = $${idx++}`); values.push(data.fullNameEn); }
    if (data.gender !== undefined) { sets.push(`gender = $${idx++}`); values.push(data.gender); }
    if (data.familyMembersCount !== undefined) { sets.push(`family_members_count = $${idx++}`); values.push(data.familyMembersCount); }
    if (data.vulnerabilityStatus !== undefined) { sets.push(`vulnerability_status = $${idx++}`); values.push(data.vulnerabilityStatus); }
    if (data.governorate !== undefined) { sets.push(`governorate = $${idx++}`); values.push(data.governorate); }
    if (data.district !== undefined) { sets.push(`district = $${idx++}`); values.push(data.district); }
    if (data.status !== undefined) { sets.push(`status = $${idx++}`); values.push(data.status); }

    if (sets.length === 0) return null;
    values.push(beneficiaryId);

    return queryOne(
      `UPDATE beneficiaries SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
  }

  /**
   * Beneficiary deduplication check (Sphere standards)
   */
  static async checkDuplicates(orgId: string, nationalId?: string, name?: string, phone?: string) {
    const duplicates: any[] = [];

    if (nationalId) {
      const byNid = await queryMany(
        'SELECT id, beneficiary_code, full_name_ar FROM beneficiaries WHERE organization_id = $1 AND national_id = $2',
        [orgId, nationalId]
      );
      duplicates.push(...byNid.map(d => ({ ...d, matchType: 'NATIONAL_ID' })));
    }

    if (name) {
      const byName = await queryMany(
        `SELECT id, beneficiary_code, full_name_ar FROM beneficiaries
         WHERE organization_id = $1 AND full_name_ar ILIKE $2 AND national_id IS DISTINCT FROM $3`,
        [orgId, name, nationalId || '']
      );
      duplicates.push(...byName.map(d => ({ ...d, matchType: 'NAME' })));
    }

    return {
      hasDuplicates: duplicates.length > 0,
      duplicates,
    };
  }

  /**
   * Dashboard statistics
   */
  static async getDashboard(orgId: string) {
    const stats = await queryOne(
      `SELECT
        COUNT(*) as total_beneficiaries,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
        COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END) as female,
        COUNT(CASE WHEN gender = 'MALE' THEN 1 END) as male,
        COALESCE(SUM(family_members_count), 0) as total_family_members,
        COUNT(CASE WHEN vulnerability_status = 'HIGH' THEN 1 END) as high_vulnerability,
        COUNT(CASE WHEN vulnerability_status = 'MEDIUM' THEN 1 END) as medium_vulnerability
       FROM beneficiaries
       WHERE organization_id = $1`,
      [orgId]
    );

    const byGovernorate = await queryMany(
      `SELECT governorate, COUNT(*) as count
       FROM beneficiaries
       WHERE organization_id = $1 AND governorate IS NOT NULL
       GROUP BY governorate ORDER BY count DESC`,
      [orgId]
    );

    const recentRegistrations = await queryMany(
      `SELECT id, beneficiary_code, full_name_ar, governorate, vulnerability_status, created_at
       FROM beneficiaries
       WHERE organization_id = $1
       ORDER BY created_at DESC LIMIT 5`,
      [orgId]
    );

    return { statistics: stats, byGovernorate, recentRegistrations };
  }
}

// ─── Service Delivery ──────────────────────────────────

export class ServiceDeliveryEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    serviceType?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['sd.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.serviceType) { conditions.push(`sd.service_type = $${idx++}`); params.push(filters.serviceType); }
    if (filters?.projectId) { conditions.push(`sd.project_id = $${idx++}`); params.push(filters.projectId); }
    if (filters?.startDate) { conditions.push(`sd.delivery_date >= $${idx++}`); params.push(filters.startDate); }
    if (filters?.endDate) { conditions.push(`sd.delivery_date <= $${idx++}`); params.push(filters.endDate); }

    const where = conditions.join(' AND ');

    return paginatedQuery(
      `SELECT sd.*, p.name_ar as project_name_ar, b.full_name_ar as beneficiary_name_ar
       FROM service_deliveries sd
       LEFT JOIN projects p ON p.id = sd.project_id
       LEFT JOIN beneficiaries b ON b.id = sd.beneficiary_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM service_deliveries sd WHERE ${where}`,
      params,
      pagination
    );
  }

  static async create(data: ServiceDeliveryCreate & { beneficiaryId?: string }, auth: AuthContext) {
    return await transaction(async (client) => {
      const code = generateCode('SVC-');

      const result = await client.query(
        `INSERT INTO service_deliveries
         (organization_id, project_id, beneficiary_id, service_type, service_number,
          beneficiaries_reached, delivery_date, location, officer_name, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'COMPLETED')
         RETURNING *`,
        [
          data.organizationId,
          data.projectId || null,
          data.beneficiaryId || null,
          requireField(data.serviceType, 'serviceType'),
          code,
          data.beneficiaryCount || 1,
          requireField(data.deliveryDate, 'deliveryDate'),
          optionalString(data.location),
          optionalString(data.officerName),
          optionalString(data.notes),
        ]
      );

      await auditLog({
        organizationId: data.organizationId,
        userId: auth.userId,
        action: 'CREATE',
        tableName: 'service_deliveries',
        recordId: result.rows[0].id,
        details: { serviceType: data.serviceType, beneficiaryCount: data.beneficiaryCount },
      });

      return result.rows[0];
    });
  }

  /**
   * Sphere Standards compliance check
   */
  static async checkSphereCompliance(orgId: string, projectId?: string) {
    let projectFilter = '';
    const params: any[] = [orgId];
    if (projectId) {
      projectFilter = 'AND sd.project_id = $2';
      params.push(projectId);
    }

    const metrics = await queryOne(
      `SELECT
        COUNT(DISTINCT sd.id) as total_services,
        COUNT(DISTINCT sd.beneficiary_id) as unique_beneficiaries,
        COALESCE(SUM(sd.beneficiaries_reached), 0) as total_reached,
        COUNT(DISTINCT sd.service_type) as service_diversity
       FROM service_deliveries sd
       WHERE sd.organization_id = $1 ${projectFilter}`,
      params
    );

    const byServiceType = await queryMany(
      `SELECT sd.service_type, COUNT(*) as count, SUM(sd.beneficiaries_reached) as reached
       FROM service_deliveries sd
       WHERE sd.organization_id = $1 ${projectFilter}
       GROUP BY sd.service_type`,
      params
    );

    return {
      metrics,
      byServiceType,
      sphereIndicators: {
        coverageRatio: Number(metrics?.total_reached || 0) / Math.max(1, Number(metrics?.unique_beneficiaries || 1)),
        serviceDiversity: Number(metrics?.service_diversity || 0),
      },
    };
  }
}

// ─── Aid Distribution ──────────────────────────────────

export class AidDistributionEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    aidType?: string;
    beneficiaryId?: string;
    projectId?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['ad.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.aidType) { conditions.push(`ad.aid_type = $${idx++}`); params.push(filters.aidType); }
    if (filters?.beneficiaryId) { conditions.push(`ad.beneficiary_id = $${idx++}`); params.push(filters.beneficiaryId); }
    if (filters?.projectId) { conditions.push(`ad.project_id = $${idx++}`); params.push(filters.projectId); }

    const where = conditions.join(' AND ');

    return paginatedQuery(
      `SELECT ad.*, b.full_name_ar as beneficiary_name_ar, p.name_ar as project_name_ar
       FROM aid_distributions ad
       LEFT JOIN beneficiaries b ON b.id = ad.beneficiary_id
       LEFT JOIN projects p ON p.id = ad.project_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM aid_distributions ad WHERE ${where}`,
      params,
      pagination
    );
  }

  static async create(data: {
    organizationId: string;
    beneficiaryId: string;
    projectId?: string;
    aidType: AidType;
    amount: number;
    currencyCode?: string;
    distributionDate: string;
    description?: string;
    receiptConfirmed?: boolean;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      // Verify beneficiary
      const beneficiary = await client.query(
        'SELECT id FROM beneficiaries WHERE id = $1 AND organization_id = $2',
        [data.beneficiaryId, data.organizationId]
      );
      if (beneficiary.rows.length === 0) throw new Error('Beneficiary not found');

      const code = generateCode('AID-');

      const result = await client.query(
        `INSERT INTO aid_distributions
         (organization_id, beneficiary_id, project_id, aid_type, distribution_number,
          amount, currency_code, distribution_date, description,
          receipt_confirmed, distributed_by, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'COMPLETED')
         RETURNING *`,
        [
          data.organizationId,
          data.beneficiaryId,
          data.projectId || null,
          data.aidType,
          code,
          data.amount,
          data.currencyCode || 'YER',
          requireField(data.distributionDate, 'distributionDate'),
          optionalString(data.description),
          data.receiptConfirmed || false,
          auth.userId,
        ]
      );

      await auditLog({
        organizationId: data.organizationId,
        userId: auth.userId,
        action: 'CREATE',
        tableName: 'aid_distributions',
        recordId: result.rows[0].id,
        details: { aidType: data.aidType, amount: data.amount },
      });

      return result.rows[0];
    });
  }

  static async getDashboard(orgId: string) {
    const stats = await queryOne(
      `SELECT
        COUNT(*) as total_distributions,
        COALESCE(SUM(amount), 0) as total_value,
        COALESCE(AVG(amount), 0) as avg_distribution,
        COUNT(CASE WHEN aid_type = 'CASH' THEN 1 END) as cash_count,
        COUNT(CASE WHEN aid_type = 'IN_KIND' THEN 1 END) as in_kind_count,
        COUNT(CASE WHEN aid_type = 'SERVICE' THEN 1 END) as service_count,
        COUNT(CASE WHEN aid_type = 'VOUCHER' THEN 1 END) as voucher_count
       FROM aid_distributions
       WHERE organization_id = $1`,
      [orgId]
    );

    const recentDistributions = await queryMany(
      `SELECT ad.*, b.full_name_ar as beneficiary_name_ar
       FROM aid_distributions ad
       LEFT JOIN beneficiaries b ON b.id = ad.beneficiary_id
       WHERE ad.organization_id = $1
       ORDER BY ad.distribution_date DESC LIMIT 10`,
      [orgId]
    );

    return { statistics: stats, recentDistributions };
  }
}

// ─── Sponsorship Engine ────────────────────────────────

export class SponsorshipEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    type?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['s.organization_id = $1'];
    const params: any[] = [orgId];
    let idx = 2;

    if (filters?.status) { conditions.push(`s.status = $${idx++}`); params.push(filters.status); }
    if (filters?.type) { conditions.push(`s.sponsorship_type = $${idx++}`); params.push(filters.type); }

    const where = conditions.join(' AND ');

    return paginatedQuery(
      `SELECT s.*, b.full_name_ar as beneficiary_name_ar, sp.name_ar as sponsor_name_ar,
              (SELECT COALESCE(SUM(sp2.payment_amount), 0) FROM sponsorship_payments sp2 WHERE sp2.sponsorship_id = s.id) as total_paid
       FROM sponsorships s
       LEFT JOIN beneficiaries b ON b.id = s.beneficiary_id
       LEFT JOIN parties sp ON sp.id = s.sponsor_party_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM sponsorships s WHERE ${where}`,
      params,
      pagination
    );
  }

  static async recordPayment(sponsorshipId: string, data: {
    paymentAmount: number;
    currencyCode?: string;
    paymentDate: string;
    disbursementVoucherNo?: string;
    receiptConfirmedBy?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO sponsorship_payments
         (organization_id, sponsorship_id, payment_date, payment_amount,
          currency_code, disbursement_voucher_no, receipt_confirmed_by, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED')
         RETURNING *`,
        [
          (await client.query('SELECT organization_id FROM sponsorships WHERE id = $1', [sponsorshipId])).rows[0]?.organization_id,
          sponsorshipId,
          requireField(data.paymentDate, 'paymentDate'),
          data.paymentAmount,
          data.currencyCode || 'YER',
          optionalString(data.disbursementVoucherNo),
          optionalString(data.receiptConfirmedBy) || auth.userId,
        ]
      );

      return result.rows[0];
    });
  }
}
