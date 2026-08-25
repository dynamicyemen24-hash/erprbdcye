/**
 * NexoraOS™ — NEB-07: Community & Membership Engine
 * Volunteers, Community Committees, Membership Applications, Engagement
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import { paginatedQuery, requireField, optionalString, auditLog, AuthContext } from '../core/helpers';
import logger from '../core/logger';

export class VolunteerEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
    field?: string;
    search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['v.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.status) { conditions.push(`v.status = $${idx++}`); params.push(filters.status); }
    if (filters?.field) { conditions.push(`v.field = $${idx++}`); params.push(filters.field); }
    if (filters?.search) {
      conditions.push(`(v.name ILIKE $${idx} OR v.email ILIKE $${idx})`);
      params.push(`%${filters.search}%`); idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT v.*,
        (SELECT COUNT(*) FROM volunteer_tasks vt WHERE vt.volunteer_id = v.id) as tasks_count,
        (SELECT COUNT(*) FROM volunteer_tasks vt WHERE vt.volunteer_id = v.id AND vt.status = 'COMPLETED') as completed_tasks
       FROM volunteers v WHERE ${where}`,
      `SELECT COUNT(*) FROM volunteers v WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(volunteerId: string) {
    const volunteer = await queryOne('SELECT * FROM volunteers WHERE id = $1', [volunteerId]);
    if (!volunteer) return null;
    const tasks = await queryMany(
      'SELECT * FROM volunteer_tasks WHERE volunteer_id = $1 ORDER BY created_at DESC', [volunteerId]
    ).catch((err) => { logger.error('Query failed', { context: 'community', error: err.message }); return []; });
    return { ...volunteer, tasks };
  }

  static async create(data: {
    organizationId: string; partyId?: string; name: string;
    email?: string; phone?: string; field?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO volunteers (organization_id, party_id, name, email, phone, field)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [data.organizationId, data.partyId || null, requireField(data.name, 'name'),
         optionalString(data.email), optionalString(data.phone), optionalString(data.field)]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'volunteers', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async update(volunteerId: string, data: Partial<{
    name: string; email: string; phone: string; field: string;
    hoursContributed: number; status: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined) {
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(`${col} = $${idx++}`); values.push(val);
      }
    });
    values.push(volunteerId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE volunteers SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }

  static async delete(volunteerId: string) {
    await query('DELETE FROM volunteers WHERE id = $1', [volunteerId]);
  }

  /**
   * Volunteer hours report
   */
  static async getHoursReport(orgId: string, startDate?: string, endDate?: string) {
    let dateFilter = '';
    const params: any[] = [orgId];
    if (startDate) { dateFilter += ` AND vt.completed_date >= $${params.length + 1}`; params.push(startDate); }
    if (endDate) { dateFilter += ` AND vt.completed_date <= $${params.length + 1}`; params.push(endDate); }

    return queryMany(
      `SELECT v.id, v.name, v.field,
        COALESCE(SUM(vt.hours_spent), 0) as total_hours,
        COUNT(vt.id) as tasks_completed
       FROM volunteers v
       LEFT JOIN volunteer_tasks vt ON vt.volunteer_id = v.id AND vt.status = 'COMPLETED'${dateFilter}
       WHERE v.organization_id = $1
       GROUP BY v.id, v.name, v.field
       ORDER BY total_hours DESC`,
      params
    ).catch((err) => { logger.error('Query failed', { context: 'community', error: err.message }); return []; });
  }
}

// ─── Community Committees ──────────────────────────────

export class CommitteeEngine {
  static async list(orgId: string) {
    return queryMany(
      `SELECT cc.*,
        (SELECT COUNT(*) FROM committee_members cm WHERE cm.committee_id = cc.id) as member_count
       FROM community_committees cc WHERE cc.organization_id = $1 ORDER BY cc.name_ar`,
      [orgId]
    ).catch((err) => { logger.error('Query failed', { context: 'community', error: err.message }); return []; });
  }

  static async create(data: {
    organizationId: string; nameAr: string; nameEn?: string;
    descriptionAr?: string; committeeType?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO community_committees (organization_id, name_ar, name_en, description_ar, committee_type)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [data.organizationId, requireField(data.nameAr, 'nameAr'), optionalString(data.nameEn),
         optionalString(data.descriptionAr), optionalString(data.committeeType)]
      );
      return result.rows[0];
    });
  }

  static async addMember(committeeId: string, data: {
    volunteerId: string; role?: string; joinDate?: string;
  }) {
    return queryOne(
      `INSERT INTO committee_members (committee_id, volunteer_id, role, join_date)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [committeeId, data.volunteerId, optionalString(data.role), data.joinDate || new Date().toISOString()]
    ).catch((err: any) => { console.error('[Engine] Query failed:', err.message); return null; });
  }

  static async getMembers(committeeId: string) {
    return queryMany(
      `SELECT cm.*, v.name as volunteer_name, v.email, v.phone
       FROM committee_members cm
       LEFT JOIN volunteers v ON v.id = cm.volunteer_id
       WHERE cm.committee_id = $1`,
      [committeeId]
    ).catch((err) => { logger.error('Query failed', { context: 'community', error: err.message }); return []; });
  }
}

// ─── Membership Applications ───────────────────────────

export class MembershipEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    status?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['ma.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.status) { conditions.push(`ma.status = $${idx++}`); params.push(filters.status); }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT ma.* FROM membership_applications ma WHERE ${where} ORDER BY ma.created_at DESC`,
      `SELECT COUNT(*) FROM membership_applications ma WHERE ${where}`,
      params, pagination
    ).catch(async () => ({ data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }));
  }

  static async create(data: {
    organizationId: string; applicantName: string;
    email?: string; phone?: string; notes?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      // Check for duplicate application
      const existing = await client.query(
        `SELECT id FROM membership_applications WHERE organization_id = $1 AND LOWER(applicant_name) = LOWER($2) AND status IN ('PENDING','APPROVED')`,
        [data.organizationId, data.applicantName]
      );
      if (existing.rows.length > 0) {
        throw new Error('A pending application already exists for this applicant');
      }

      const result = await client.query(
        `INSERT INTO membership_applications (organization_id, applicant_name, email, phone, notes, status)
         VALUES ($1,$2,$3,$4,$5,'PENDING') RETURNING *`,
        [data.organizationId, requireField(data.applicantName, 'applicantName'),
         optionalString(data.email), optionalString(data.phone), optionalString(data.notes)]
      );
      return result.rows[0];
    });
  }

  static async review(applicationId: string, decision: 'APPROVED' | 'REJECTED', reviewerNotes?: string) {
    return queryOne(
      `UPDATE membership_applications SET status = $1, reviewer_notes = $2, reviewed_at = NOW()
       WHERE id = $3 RETURNING *`,
      [decision, optionalString(reviewerNotes), applicationId]
    );
  }
}
