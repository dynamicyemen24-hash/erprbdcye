/**
 * NexoraOS™ — Intelligent Administrative Communications Engine (NEB-11)
 * Enterprise-grade internal communication & directive channel: memoranda,
 * circulars, directives, announcements — with approval workflow, distribution
 * registry, cross-unit linking and smart notification dispatch.
 */

import { query, queryMany, queryOne, transaction } from '../core/database';

export type CommDocType = 'MEMO' | 'CIRCULAR' | 'DIRECTIVE' | 'ANNOUNCEMENT' | 'REPLY';
export type CommStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ISSUED' | 'DISTRIBUTED' | 'CLOSED' | 'REJECTED' | 'VOIDED';
export type CommPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type CommClassification = 'OFFICIAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'PUBLIC';

export interface CommunicationCreate {
  docType: CommDocType;
  subjectAr: string;
  subjectEn?: string;
  bodyAr?: string;
  priority?: CommPriority;
  classification?: CommClassification;
  fromEntity: string;
  toEntity?: string;
  ccEntities?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  linkedEntityName?: string;
  referencesAr?: string;
  attachmentsAr?: string;
  effectiveDate?: string;
  expiryDate?: string;
  recipients?: Array<{ recipientType: string; recipientEntity: string; recipientUserId?: string }>;
  routeTo?: string; // 'approval' skips straight to SUBMITTED
}

export interface CommListQuery {
  page?: number;
  limit?: number;
  status?: string;
  docType?: string;
  priority?: string;
  search?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  authorUserId?: string;
}

const DOC_PREFIX: Record<CommDocType, string> = {
  MEMO: 'م',
  CIRCULAR: 'ع',
  DIRECTIVE: 'ق',
  ANNOUNCEMENT: 'ن',
  REPLY: 'ر',
};

const DOC_TYPE_EN: Record<CommDocType, string> = {
  MEMO: 'MEMO',
  CIRCULAR: 'CIRCULAR',
  DIRECTIVE: 'DIRECTIVE',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  REPLY: 'REPLY',
};

function resolveDocNumber(docType: CommDocType, year: number): string {
  return `${DOC_PREFIX[docType]}/${year}/`;
}

export class CommunicationsEngine {
  /**
   * List communications for an organization with filters and pagination.
   */
  static async list(orgId: string, q: CommListQuery = {}) {
    const conditions = ['c.organization_id = $1', 'c.deleted_at IS NULL'];
    const params: any[] = [orgId];
    let idx = 2;

    if (q.status) { conditions.push(`c.status = $${idx++}`); params.push(q.status); }
    if (q.docType) { conditions.push(`c.doc_type = $${idx++}`); params.push(q.docType); }
    if (q.priority) { conditions.push(`c.priority = $${idx++}`); params.push(q.priority); }
    if (q.linkedEntityType && q.linkedEntityId) {
      conditions.push(`c.linked_entity_type = $${idx++}`); params.push(q.linkedEntityType);
      conditions.push(`c.linked_entity_id = $${idx++}`); params.push(q.linkedEntityId);
    }
    if (q.authorUserId) { conditions.push(`c.author_user_id = $${idx++}`); params.push(q.authorUserId); }
    if (q.search) {
      conditions.push(`(c.subject_ar ILIKE $${idx} OR c.subject_en ILIKE $${idx} OR c.doc_number ILIKE $${idx} OR c.from_entity ILIKE $${idx})`);
      params.push(`%${q.search}%`); idx++;
    }

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const offset = (page - 1) * limit;

    const where = `WHERE ${conditions.join(' AND ')}`;
    const count = await queryOne<{ total: string }>(`SELECT COUNT(*) AS total FROM official_communications c ${where}`, params);
    const data = await queryMany<any>(
      `SELECT c.*,
        (SELECT COUNT(*) FROM official_communication_recipients r
          WHERE r.communication_id = c.id AND r.status = 'ACKNOWLEDGED') AS ack_count,
        (SELECT COUNT(*) FROM official_communication_recipients r
          WHERE r.communication_id = c.id) AS recipient_count
       FROM official_communications c ${where}
       ORDER BY c.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    const total = parseInt(count?.total || '0', 10);
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single communication with its recipients by id.
   */
  static async getById(orgId: string, id: string) {
    const comm = await queryOne<any>(
      `SELECT * FROM official_communications
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [id, orgId]
    );
    if (!comm) return null;
    const recipients = await queryMany<any>(
      `SELECT * FROM official_communication_recipients
       WHERE communication_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    return { ...comm, recipients };
  }

  /**
   * Create a new communication (DRAFT), optionally routing it for approval.
   */
  static async create(orgId: string, auth: { userId: string; name?: string; securityLevel?: number }, input: CommunicationCreate) {
    // Validate required business fields
    if (!input.subjectAr || !input.subjectAr.trim()) throw new Error('Subject (Arabic) is required');
    if (!input.fromEntity || !input.fromEntity.trim()) throw new Error('From entity is required');
    if (!DOC_TYPE_EN[input.docType]) throw new Error('Invalid document type');

    const year = new Date().getFullYear();
    const prefix = resolveDocNumber(input.docType, year);

    // Generate next doc_number: prefix + sequential within org/year
    const seqRes = await queryOne<{ n: string }>(
      `SELECT COUNT(*) + 1 AS n FROM official_communications
       WHERE organization_id = $1 AND doc_number LIKE $2`,
      [orgId, `${prefix}%`]
    );
    const seq = String((parseInt(seqRes?.n || '1', 10))).padStart(4, '0');
    const docNumber = `${prefix}${seq}`;

    const row = {
      id: undefined as any,
      organization_id: orgId,
      doc_number: docNumber,
      doc_type: input.docType,
      subject_ar: input.subjectAr.trim(),
      subject_en: input.subjectEn || null,
      body_ar: input.bodyAr ?? null,
      priority: input.priority || 'NORMAL',
      classification: input.classification || 'OFFICIAL',
      author_user_id: auth.userId,
      author_name_ar: auth.name ?? null,
      from_entity: input.fromEntity.trim(),
      to_entity: input.toEntity?.trim() ?? null,
      cc_entities: input.ccEntities ?? null,
      linked_entity_type: input.linkedEntityType ?? null,
      linked_entity_id: input.linkedEntityId ?? null,
      linked_entity_name: input.linkedEntityName ?? null,
      references_ar: input.referencesAr ?? null,
      attachments_ar: input.attachmentsAr ?? null,
      effective_date: input.effectiveDate ? new Date(input.effectiveDate) : null,
      expiry_date: input.expiryDate ? new Date(input.expiryDate) : null,
      created_by: auth.userId,
      status: input.routeTo === 'approval' ? 'SUBMITTED' : 'DRAFT',
      submitted_by_user: input.routeTo === 'approval' ? auth.userId : null,
      submitted_at: input.routeTo === 'approval' ? new Date() : null,
    };

    const id = await transaction(async (client) => {
      const keys = Object.keys(row).filter(k => k !== 'id');
      const values = keys.map(k => row[k]);
      const placeholders = keys.map((_, i) => `$${i + 2}`);
      const inserted = await client.query(
        `INSERT INTO official_communications (id, ${keys.map(k => `"${k}"`).join(', ')})
         VALUES ($1, ${placeholders.join(', ')}) RETURNING *`,
        [cryptoRandomUUID(), ...values]
      );
      const commId = inserted.rows[0].id;

      // Insert recipients (distribution list)
      if (input.recipients && input.recipients.length > 0) {
        for (const r of input.recipients) {
          await client.query(
            `INSERT INTO official_communication_recipients
              (id, organization_id, communication_id, recipient_type, recipient_entity, recipient_user_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
            [cryptoRandomUUID(), orgId, commId, r.recipientType || 'DEPARTMENT', r.recipientEntity, r.recipientUserId || null]
          );
        }
      }
      return commId;
    });

    return this.getById(orgId, id);
  }

  /**
   * Update an editable (DRAFT) communication.
   */
  static async update(orgId: string, id: string, input: Partial<CommunicationCreate>) {
    await this.assertWritable(orgId, id, ['DRAFT']);
    const updates: any = {};
    if (input.subjectAr !== undefined) updates.subject_ar = input.subjectAr;
    if (input.bodyAr !== undefined) updates.body_ar = input.bodyAr;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.classification !== undefined) updates.classification = input.classification;
    if (input.fromEntity !== undefined) updates.from_entity = input.fromEntity;
    if (input.toEntity !== undefined) updates.to_entity = input.toEntity;
    if (input.ccEntities !== undefined) updates.cc_entities = input.ccEntities;
    if (input.linkedEntityType !== undefined) updates.linked_entity_type = input.linkedEntityType;
    if (input.linkedEntityId !== undefined) updates.linked_entity_id = input.linkedEntityId;
    if (input.linkedEntityName !== undefined) updates.linked_entity_name = input.linkedEntityName;
    if (input.referencesAr !== undefined) updates.references_ar = input.referencesAr;
    if (input.attachmentsAr !== undefined) updates.attachments_ar = input.attachmentsAr;
    if (input.effectiveDate !== undefined) updates.effective_date = input.effectiveDate ? new Date(input.effectiveDate) : null;
    if (input.expiryDate !== undefined) updates.expiry_date = input.expiryDate ? new Date(input.expiryDate) : null;
    updates.updated_at = new Date();

    const keys = Object.keys(updates);
    if (keys.length === 0) throw new Error('No fields to update');
    const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    await query(
      `UPDATE official_communications SET ${setClause} WHERE id = $1 AND organization_id = $2`,
      [id, orgId, ...keys.map(k => updates[k])]
    );
    return this.getById(orgId, id);
  }

  /**
   * Submit a DRAFT for approval.
   */
  static async submit(orgId: string, id: string, authUserId: string) {
    const current = await this.getForStatus(orgId, id);
    if (current.status !== 'DRAFT') throw new Error('Only DRAFT communications can be submitted');
    await query(
      `UPDATE official_communications
       SET status = 'SUBMITTED', submitted_by_user = $3, submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [id, orgId, authUserId]
    );
    return this.getById(orgId, id);
  }

  /**
   * Approve a submitted communication.
   */
  static async approve(orgId: string, id: string, authUserId: string, note?: string) {
    const current = await this.getForStatus(orgId, id);
    if (current.status !== 'SUBMITTED') throw new Error('Only SUBMITTED communications can be approved');
    await query(
      `UPDATE official_communications
       SET status = 'APPROVED', approved_by_user = $3, approved_at = NOW(), approval_note = $4, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [id, orgId, authUserId, note ?? null]
    );
    await this.notifyChain(orgId, current.id, 'APPROVED');
    return this.getById(orgId, id);
  }

  /**
   * Reject a submitted communication.
   */
  static async reject(orgId: string, id: string, authUserId: string, note?: string) {
    const current = await this.getForStatus(orgId, id);
    if (current.status !== 'SUBMITTED') throw new Error('Only SUBMITTED communications can be rejected');
    await query(
      `UPDATE official_communications
       SET status = 'REJECTED', approved_by_user = $3, approved_at = NOW(), approval_note = $4, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [id, orgId, authUserId, note ?? null]
    );
    return this.getById(orgId, id);
  }

  /**
   * Issue an approved communication (finalize signatures, set issue date).
   */
  static async issue(orgId: string, id: string, signedBy?: string) {
    const current = await this.getForStatus(orgId, id);
    if (!['APPROVED'].includes(current.status)) throw new Error('Only APPROVED communications can be issued');
    await query(
      `UPDATE official_communications
       SET status = 'ISSUED', issue_date = COALESCE(issue_date, CURRENT_DATE), signed_by = $3, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [id, orgId, signedBy ?? null]
    );
    await this.notifyChain(orgId, current.id, 'ISSUED');
    return this.getById(orgId, id);
  }

  /**
   * Distribute a communication to its recipients (mark distributed + recipients DELIVERED).
   */
  static async distribute(orgId: string, id: string) {
    await this.assertWritable(orgId, id, ['APPROVED', 'ISSUED']);
    await transaction(async (client) => {
      await client.query(
        `UPDATE official_communications SET status = 'DISTRIBUTED', updated_at = NOW()
         WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
      );
      await client.query(
        `UPDATE official_communication_recipients SET status = 'DELIVERED', read_at = NOW()
         WHERE communication_id = $1 AND status = 'PENDING'`,
        [id]
      );
    });
    await this.notifyChain(orgId, id, 'DISTRIBUTED');
    return this.getById(orgId, id);
  }

  /**
   * Acknowledge receipt of a distributed communication.
   */
  static async acknowledge(orgId: string, id: string, recipientUserId: string, note?: string) {
    const updated = await query(
      `UPDATE official_communication_recipients
       SET status = 'ACKNOWLEDGED', acknowledged_at = NOW(), ack_note = $4
       WHERE communication_id = $1 AND organization_id = $2 AND recipient_user_id = $3
       RETURNING *`,
      [id, orgId, recipientUserId, note ?? null]
    );
    if (updated.rowCount === 0) return { ok: false, message: 'No matching recipient assignment' };
    return { ok: true, data: updated.rows[0] };
  }

  /**
   * Close a communication (retired / archived after completion).
   */
  static async close(orgId: string, id: string) {
    await this.assertWritable(orgId, id, ['DISTRIBUTED', 'ISSUED', 'APPROVED']);
    await query(
      `UPDATE official_communications SET status = 'CLOSED', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [id, orgId]
    );
    return this.getById(orgId, id);
  }

  /**
   * Soft-delete a communication.
   */
  static async remove(orgId: string, id: string, authUserId: string) {
    const current = await this.getForStatus(orgId, id);
    if (!['DRAFT', 'REJECTED', 'VOIDED'].includes(current.status)) {
      throw new Error('Only DRAFT, REJECTED or VOIDED communications can be deleted');
    }
    await query(
      `UPDATE official_communications SET deleted_at = NOW(), status = 'VOIDED', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [id, orgId]
    );
    return { ok: true, id };
  }

  /**
   * Dashboard statistics across the organization.
   */
  static async overview(orgId: string) {
    const byStatus = await queryMany<any>(
      `SELECT status, COUNT(*)::int AS count FROM official_communications
       WHERE organization_id = $1 AND deleted_at IS NULL GROUP BY status`,
      [orgId]
    );
    const byType = await queryMany<any>(
      `SELECT doc_type, COUNT(*)::int AS count FROM official_communications
       WHERE organization_id = $1 AND deleted_at IS NULL GROUP BY doc_type`,
      [orgId]
    );
    const byPriority = await queryMany<any>(
      `SELECT priority, COUNT(*)::int AS count FROM official_communications
       WHERE organization_id = $1 AND deleted_at IS NULL GROUP BY priority`,
      [orgId]
    );
    const pendingApproval = await queryOne<{ c: string }>(
      `SELECT COUNT(*) AS c FROM official_communications
       WHERE organization_id = $1 AND status = 'SUBMITTED' AND deleted_at IS NULL`,
      [orgId]
    );
    const urgent = await queryOne<{ c: string }>(
      `SELECT COUNT(*) AS c FROM official_communications
       WHERE organization_id = $1 AND priority = 'URGENT' AND deleted_at IS NULL AND status NOT IN ('CLOSED','VOIDED','REJECTED')`,
      [orgId]
    );

    const countMap = (arr: any[]) => arr.reduce((m, r) => ({ ...m, [r.status || r.doc_type || r.priority]: r.count }), {});

    return {
      total: byStatus.reduce((s, r) => s + (r.count || 0), 0),
      byStatus: countMap(byStatus),
      byType: countMap(byType),
      byPriority: countMap(byPriority),
      pendingApproval: parseInt(pendingApproval?.c || '0', 10),
      urgent: parseInt(urgent?.c || '0', 10),
    };
  }

  // ─── Private helpers ─────────────────────────────────

  private static async getForStatus(orgId: string, id: string): Promise<any> {
    const row = await queryOne<any>(
      `SELECT * FROM official_communications WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [id, orgId]
    );
    if (!row) throw new Error('Communication not found');
    return row;
  }

  private static async assertWritable(orgId: string, id: string, allowed: CommStatus[]) {
    const row = await this.getForStatus(orgId, id);
    if (!allowed.includes(row.status)) {
      throw new Error(`Communication is in '${row.status}' status and cannot perform this action`);
    }
    return row;
  }

  /**
   * Create an in-app notification for the author/approver when the workflow advances.
   * Writes to the `notifications` table so the NotificationCenter picks it up.
   */
  private static async notifyChain(orgId: string, id: string, event: string) {
    try {
      const comm = await queryOne<any>(
        `SELECT subject_ar, author_user_id, approved_by_user, doc_number FROM official_communications WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
      );
      if (!comm) return;
      const recipients: Array<string | null> = [comm.author_user_id, comm.approved_by_user];
      const uniq = Array.from(new Set(recipients.filter(Boolean)));
      const titleAr = event === 'APPROVED'
        ? 'تم اعتماد مستند إداري'
        : event === 'ISSUED'
          ? 'صدر مستند إداري رسمي'
          : event === 'DISTRIBUTED'
            ? 'تم توزيع مستند إداري'
            : 'تحديث على مستند إداري';
      for (const userId of uniq) {
        if (!userId) continue;
        await query(
          `INSERT INTO notifications (id, organization_id, user_id, title, body, type, entity_type, entity_id, is_read, security_level, created_at, status)
           VALUES ($1, $2, $3, $4, $5, 'info', 'official_communications', $6, FALSE, 1, NOW(), 'DELIVERED')
           ON CONFLICT DO NOTHING`,
          [cryptoRandomUUID(), orgId, userId, titleAr, `${comm.doc_number} — ${comm.subject_ar}`, id]
        );
      }
    } catch (err: any) {
      console.warn('[Communications] notifyChain failed:', err.message);
    }
  }
}

function cryptoRandomUUID(): string {
  // Node 19+ has crypto.randomUUID global; fallback for older runtimes
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
