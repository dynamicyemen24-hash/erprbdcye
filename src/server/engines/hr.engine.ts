/**
 * NexoraOS™ — NEB-09: Human Resources Engine
 * HR Staff, Departments, Attendance, Leave, Performance Reviews
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import { paginatedQuery, requireField, optionalString, auditLog, AuthContext } from '../core/helpers';
import logger from '../core/logger';

export class HREngine {
  static async listStaff(orgId: string, pagination: PaginationParams = {}, filters?: {
    department?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResult<any>> {
    const conditions = ['hs.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.department) { conditions.push(`hs.department = $${idx++}`); params.push(filters.department); }
    if (filters?.status) { conditions.push(`hs.status = $${idx++}`); params.push(filters.status); }
    if (filters?.search) {
      conditions.push(`(hs.full_name_ar ILIKE $${idx} OR hs.full_name_en ILIKE $${idx} OR hs.employee_number ILIKE $${idx})`);
      params.push(`%${filters.search}%`); idx++;
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT hs.* FROM hr_staff hs WHERE ${where}`,
      `SELECT COUNT(*) FROM hr_staff hs WHERE ${where}`,
      params, pagination
    );
  }

  static async getStaffById(staffId: string) {
    return queryOne('SELECT * FROM hr_staff WHERE id = $1', [staffId]);
  }

  static async createStaff(data: {
    organizationId: string; employeeNumber: string;
    fullNameAr: string; fullNameEn?: string;
    jobTitle?: string; department?: string;
    email?: string; phone?: string;
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const existing = await client.query(
        'SELECT id FROM hr_staff WHERE organization_id = $1 AND employee_number = $2',
        [data.organizationId, data.employeeNumber]
      );
      if (existing.rows.length > 0) throw new Error('Employee number already exists');

      const result = await client.query(
        `INSERT INTO hr_staff (organization_id, employee_number, full_name_ar, full_name_en,
          job_title, department, email, phone, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE') RETURNING *`,
        [data.organizationId, requireField(data.employeeNumber, 'employeeNumber'),
         requireField(data.fullNameAr, 'fullNameAr'), optionalString(data.fullNameEn),
         optionalString(data.jobTitle), optionalString(data.department),
         optionalString(data.email), optionalString(data.phone)]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'hr_staff', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async updateStaff(staffId: string, data: Partial<{
    fullNameAr: string; fullNameEn: string; jobTitle: string;
    department: string; email: string; phone: string; status: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined) { sets.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${idx++}`); values.push(val); }
    });
    values.push(staffId);
    if (sets.length === 0) return null;
    return queryOne(`UPDATE hr_staff SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }

  static async deleteStaff(staffId: string) {
    await query('UPDATE hr_staff SET status = \'TERMINATED\' WHERE id = $1', [staffId]);
  }

  static async getDashboard(orgId: string) {
    const stats = await queryOne(
      `SELECT
        COUNT(*) as total_staff,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
        COUNT(DISTINCT department) as departments
       FROM hr_staff WHERE organization_id = $1`, [orgId]
    );
    const byDepartment = await queryMany(
      `SELECT department, COUNT(*) as count
       FROM hr_staff WHERE organization_id = $1 AND department IS NOT NULL
       GROUP BY department ORDER BY count DESC`, [orgId]
    );
    return { statistics: stats, byDepartment };
  }
}

// ─── Attendance ────────────────────────────────────────

export class AttendanceEngine {
  static async clockIn(staffId: string, data: { timestamp?: string; location?: string }) {
    return queryOne(
      `INSERT INTO attendance_records (staff_id, clock_in, location)
       VALUES ($1, $2, $3) RETURNING *`,
      [staffId, data.timestamp || new Date().toISOString(), optionalString(data.location)]
    ).catch((err: any) => { console.error('[Engine] Query failed:', err.message); return null; });
  }

  static async clockOut(attendanceId: string, data: { timestamp?: string }) {
    return queryOne(
      `UPDATE attendance_records SET clock_out = $1,
        hours_worked = EXTRACT(EPOCH FROM ($1::timestamp - clock_in::timestamp)) / 3600
       WHERE id = $2 AND clock_out IS NULL RETURNING *`,
      [data.timestamp || new Date().toISOString(), attendanceId]
    ).catch((err: any) => { console.error('[Engine] Query failed:', err.message); return null; });
  }

  static async getStaffAttendance(staffId: string, startDate?: string, endDate?: string) {
    let where = 'staff_id = $1';
    const params: any[] = [staffId];
    if (startDate) { where += ` AND clock_in >= $${params.length + 1}`; params.push(startDate); }
    if (endDate) { where += ` AND clock_in <= $${params.length + 1}`; params.push(endDate); }
    return queryMany(`SELECT * FROM attendance_records WHERE ${where} ORDER BY clock_in DESC`, params).catch((err) => { logger.error('Query failed', { context: 'hr', error: err.message }); return []; });
  }
}

// ─── Leave Management ──────────────────────────────────

export class LeaveEngine {
  static async requestLeave(data: {
    staffId: string; leaveType: string;
    startDate: string; endDate: string;
    reason?: string;
  }) {
    return queryOne(
      `INSERT INTO leave_requests (staff_id, leave_type, start_date, end_date, reason, status)
       VALUES ($1,$2,$3,$4,$5,'PENDING') RETURNING *`,
      [data.staffId, data.leaveType, data.startDate, data.endDate, optionalString(data.reason)]
    ).catch((err: any) => { console.error('[Engine] Query failed:', err.message); return null; });
  }

  static async approveLeave(leaveId: string, approvedBy: string, notes?: string) {
    return queryOne(
      `UPDATE leave_requests SET status = 'APPROVED', approved_by = $1, review_notes = $2
       WHERE id = $3 AND status = 'PENDING' RETURNING *`,
      [approvedBy, optionalString(notes), leaveId]
    ).catch((err: any) => { console.error('[Engine] Query failed:', err.message); return null; });
  }

  static async rejectLeave(leaveId: string, rejectedBy: string, reason?: string) {
    return queryOne(
      `UPDATE leave_requests SET status = 'REJECTED', approved_by = $1, review_notes = $2
       WHERE id = $3 AND status = 'PENDING' RETURNING *`,
      [rejectedBy, optionalString(reason), leaveId]
    ).catch((err: any) => { console.error('[Engine] Query failed:', err.message); return null; });
  }

  static async getStaffLeaves(staffId: string) {
    return queryMany(
      'SELECT * FROM leave_requests WHERE staff_id = $1 ORDER BY created_at DESC', [staffId]
    ).catch((err) => { logger.error('Query failed', { context: 'hr', error: err.message }); return []; });
  }
}
