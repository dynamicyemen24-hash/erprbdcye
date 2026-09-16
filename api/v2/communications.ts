import pg from 'pg';
import jwt from 'jsonwebtoken';
import { applySecurityHeaders, resolveCorsOrigin } from '../_shared/security-headers';

const { Pool } = pg;

// ═══════════════════════════════════════════════════════════════════
// NexoraOS™ — NEB-11: Intelligent Administrative Communications API
// Route: /api/v2/communications
// ═══════════════════════════════════════════════════════════════════
// Hardened Neon serverless pool contract — same as the rest of /api
// — bounded statement/query timeouts
// — generous connect timeout for Neon scale-to-zero cold starts
// — keepAlive for warm reuse across invocations
// ═══════════════════════════════════════════════════════════════════
let pool: any = null;
const globalAny = global as any;
if (!globalAny.__nexora_comms_pool) {
  if (process.env.DATABASE_URL) {
    globalAny.__nexora_comms_pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX_SERVERLESS || '3', 10),
      min: 0,
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_MS || '15000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '15000', 10),
      statement_timeout: 15000,
      query_timeout: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: process.env.DB_SSL_CA
        ? { rejectUnauthorized: true, ca: process.env.DB_SSL_CA }
        : { rejectUnauthorized: process.env.DB_SSL_STRICT === 'true' },
    });
    globalAny.__nexora_comms_pool.on('error', (err: any) => {
      console.error('[API/Comms] Pool error:', err.message);
    });
  }
}
pool = globalAny.__nexora_comms_pool || null;

const jwtSecret: string = (() => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('[API/Comms] JWT_SECRET is required — refusing to start with an insecure fallback');
  return s;
})();

const ALLOWED_DOC_TYPES = new Set(['MEMO', 'CIRCULAR', 'DIRECTIVE', 'ANNOUNCEMENT', 'REPLY']);
const ALLOWED_STATUSES = new Set([
  'DRAFT', 'SUBMITTED', 'APPROVED', 'ISSUED', 'DISTRIBUTED', 'CLOSED', 'REJECTED', 'VOIDED',
]);
const ALLOWED_PRIORITIES = new Set(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
const ALLOWED_CLASSIFICATIONS = new Set(['OFFICIAL', 'CONFIDENTIAL', 'RESTRICTED', 'PUBLIC']);

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'VOIDED'],
  SUBMITTED: ['APPROVED', 'REJECTED', 'DRAFT'],
  APPROVED: ['ISSUED', 'VOIDED'],
  ISSUED: ['DISTRIBUTED', 'VOIDED'],
  DISTRIBUTED: ['CLOSED'],
  CLOSED: [],
  REJECTED: ['DRAFT', 'VOIDED'],
  VOIDED: [],
};

function verifyToken(authHeader: string | undefined): { ok: boolean; payload?: any } {
  if (!authHeader) return { ok: false };
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) return { ok: false };
  try {
    const decoded: any = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    if (!decoded || typeof decoded !== 'object') return { ok: false };
    return { ok: true, payload: decoded };
  } catch {
    return { ok: false };
  }
}

function pickString(v: any, max = 255, allowEmpty = true): string | null {
  if (v === undefined || v === null) return allowEmpty ? null : '';
  const s = String(v).trim();
  if (!s) return allowEmpty ? null : '';
  return s.slice(0, max);
}

function pickEnum(v: any, allowed: Set<string>, fallback?: string): string | null {
  if (v === undefined || v === null || v === '') return fallback ?? null;
  const s = String(v).toUpperCase();
  return allowed.has(s) ? s : (fallback ?? null);
}

function pickUuid(v: any): string | null {
  if (!v) return null;
  const s = String(v).trim();
  return /^[0-9a-fA-F-]{8,}$/.test(s) ? s : null;
}

async function resolveOrgId(req: any, payload: any): Promise<string | null> {
  // ═══ SECURITY: tenant identity comes ONLY from the signed token claims. ═══
  // Header-based tenant selection (e.g. x-organization-id) is a known
  // cross-tenant spoofing vector and is deliberately NOT honored here.
  const presentHeader =
    req.headers?.['x-organization-id'] ||
    req.headers?.['X-Organization-Id'] ||
    req.headers?.['x-org-id'];

  const claimOrg =
    payload?.organization_id ||
    payload?.org_id ||
    payload?.org ||
    null;

  // If the client attempted to override the tenant via a header, fail closed
  // rather than silently ignoring — the caller must send no such header.
  if (presentHeader && claimOrg && String(presentHeader) !== String(claimOrg)) {
    const e: any = new Error(`Cross-tenant header mismatch: header org does not match token org`);
    e.status = 403;
    throw e;
  }

  if (claimOrg) return String(claimOrg);

  // Development-only single-tenant fallback: resolve the first organization in
  // the DB. Never used in production — production tokens must carry an org claim.
  if (process.env.NODE_ENV !== 'production' && pool) {
    try {
      const r = await pool.query(`SELECT id FROM organizations ORDER BY created_at NULLS LAST LIMIT 1`);
      if (r.rows[0]?.id) return r.rows[0].id;
    } catch {
      /* ignore */
    }
  } else if (process.env.NODE_ENV === 'production') {
    const e: any = new Error('Token carries no organization claim — tenant access denied');
    e.status = 403;
    throw e;
  }

  return null;
}

async function generateDocNumber(orgId: string, docType: string): Promise<string> {
  // Format: TYPE/YEAR/SEQUENCE  e.g.  MEMO/2026/0001
  const prefix = docType.slice(0, 4).toUpperCase();
  const year = new Date().getFullYear();
  if (!pool) return `${prefix}/${year}/0001`;
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS c
         FROM official_communications
        WHERE organization_id = $1
          AND doc_type = $2
          AND EXTRACT(YEAR FROM created_at) = $3`,
      [orgId, docType, year],
    );
    const seq = (r.rows[0]?.c ?? 0) + 1;
    return `${prefix}/${year}/${String(seq).padStart(4, '0')}`;
  } catch {
    return `${prefix}/${year}/0001`;
  }
}

async function getCommunicationById(id: string, orgId: string): Promise<any | null> {
  if (!pool) return null;
  const r = await pool.query(
    `SELECT * FROM official_communications WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
    [id, orgId],
  );
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  const recipients = await pool.query(
    `SELECT id, recipient_type, recipient_entity, recipient_user_id, status,
            read_at, acknowledged_at, ack_note, distribution_channel, created_at
       FROM official_communication_recipients
      WHERE communication_id = $1
      ORDER BY created_at ASC`,
    [id],
  );
  return {
    ...row,
    recipients: recipients.rows,
    recipient_count: recipients.rows.length,
    ack_count: recipients.rows.filter((x: any) => x.status === 'ACKNOWLEDGED').length,
  };
}

async function getOverview(orgId: string) {
  if (!pool) return { total: 0, pendingApproval: 0, urgent: 0, byStatus: {}, byPriority: {} };
  const total = await pool.query(
    `SELECT COUNT(*)::int AS c FROM official_communications WHERE organization_id = $1 AND deleted_at IS NULL`,
    [orgId],
  );
  const pending = await pool.query(
    `SELECT COUNT(*)::int AS c FROM official_communications
      WHERE organization_id = $1 AND status = 'SUBMITTED' AND deleted_at IS NULL`,
    [orgId],
  );
  const urgent = await pool.query(
    `SELECT COUNT(*)::int AS c FROM official_communications
      WHERE organization_id = $1 AND priority = 'URGENT' AND status NOT IN ('CLOSED','VOIDED') AND deleted_at IS NULL`,
    [orgId],
  );
  const byStatus = await pool.query(
    `SELECT status, COUNT(*)::int AS c FROM official_communications
      WHERE organization_id = $1 AND deleted_at IS NULL GROUP BY status`,
    [orgId],
  );
  const byPriority = await pool.query(
    `SELECT priority, COUNT(*)::int AS c FROM official_communications
      WHERE organization_id = $1 AND deleted_at IS NULL GROUP BY priority`,
    [orgId],
  );
  const statusMap: Record<string, number> = {};
  byStatus.rows.forEach((r: any) => (statusMap[r.status] = r.c));
  const priorityMap: Record<string, number> = {};
  byPriority.rows.forEach((r: any) => (priorityMap[r.priority] = r.c));
  return {
    total: total.rows[0]?.c ?? 0,
    pendingApproval: pending.rows[0]?.c ?? 0,
    urgent: urgent.rows[0]?.c ?? 0,
    byStatus: statusMap,
    byPriority: priorityMap,
  };
}

export default async function handler(req: any, res: any) {
  // ─── CORS + Security Headers ─────────────────────────────────────
  const corsOrigin = resolveCorsOrigin(req.headers?.origin);
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-environment-mode',
  );
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ─── Auth ───────────────────────────────────────────────────────
  const auth = verifyToken(req.headers?.authorization);
  if (!auth.ok) {
    return res.status(401).json({ error: 'Access Denied: Missing or invalid authentication token' });
  }

  if (!pool) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  let orgId: string | null = null;
  try {
    orgId = await resolveOrgId(req, auth.payload);
  } catch (e: any) {
    const status = Number(e?.status) || 400;
    return res.status(status).json({ error: e?.message || 'Missing organization context' });
  }
  if (!orgId) {
    return res.status(400).json({ error: 'Missing organization context' });
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // GET /api/v2/communications?page=&limit=&search=&status=&type=&priority=
    //   → list with pagination + filtering
    // ═══════════════════════════════════════════════════════════════
    if (req.method === 'GET') {
      const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
      const limit = Math.min(
        Math.max(parseInt(String(req.query.limit || '12'), 10) || 12, 1),
        100,
      );
      const offset = (page - 1) * limit;
      const search = (req.query.search ? String(req.query.search).trim() : '') || null;
      const status = req.query.status ? String(req.query.status).toUpperCase() : null;
      const docType = req.query.type ? String(req.query.type).toUpperCase() : null;
      const priority = req.query.priority ? String(req.query.priority).toUpperCase() : null;
      const linkedType = req.query.linkedEntityType ? String(req.query.linkedEntityType) : null;
      const linkedId = req.query.linkedEntityId ? String(req.query.linkedEntityId) : null;

      const where: string[] = ['organization_id = $1', 'deleted_at IS NULL'];
      const params: any[] = [orgId];
      let i = 2;

      if (search) {
        where.push(`(subject_ar ILIKE $${i} OR subject_en ILIKE $${i} OR doc_number ILIKE $${i} OR from_entity ILIKE $${i} OR to_entity ILIKE $${i})`);
        params.push(`%${search}%`);
        i++;
      }
      if (status && ALLOWED_STATUSES.has(status)) {
        where.push(`status = $${i}`);
        params.push(status);
        i++;
      }
      if (docType && ALLOWED_DOC_TYPES.has(docType)) {
        where.push(`doc_type = $${i}`);
        params.push(docType);
        i++;
      }
      if (priority && ALLOWED_PRIORITIES.has(priority)) {
        where.push(`priority = $${i}`);
        params.push(priority);
        i++;
      }
      if (linkedType) {
        where.push(`linked_entity_type = $${i}`);
        params.push(linkedType);
        i++;
      }
      if (linkedId) {
        where.push(`linked_entity_id = $${i}`);
        params.push(linkedId);
        i++;
      }

      const whereSql = where.join(' AND ');

      const countQ = await pool.query(
        `SELECT COUNT(*)::int AS c FROM official_communications WHERE ${whereSql}`,
        params,
      );
      const total = countQ.rows[0]?.c ?? 0;

      const listQ = await pool.query(
        `SELECT c.*,
                (SELECT COUNT(*)::int FROM official_communication_recipients r WHERE r.communication_id = c.id) AS recipient_count,
                (SELECT COUNT(*)::int FROM official_communication_recipients r WHERE r.communication_id = c.id AND r.status = 'ACKNOWLEDGED') AS ack_count
           FROM official_communications c
          WHERE ${whereSql}
          ORDER BY c.created_at DESC
          LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset],
      );

      return res.status(200).json({
        data: listQ.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // POST /api/v2/communications
    //   → create new communication + optional recipients
    // ═══════════════════════════════════════════════════════════════
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

      const docType = pickEnum(body.docType, ALLOWED_DOC_TYPES, 'MEMO') || 'MEMO';
      const subjectAr = pickString(body.subjectAr, 300, false);
      if (!subjectAr) {
        return res.status(400).json({ error: 'subjectAr is required' });
      }
      const fromEntity = pickString(body.fromEntity, 255, false);
      if (!fromEntity) {
        return res.status(400).json({ error: 'fromEntity is required' });
      }

      const docNumber = pickString(body.docNumber, 60) || (await generateDocNumber(orgId, docType));
      const priority = pickEnum(body.priority, ALLOWED_PRIORITIES, 'NORMAL') || 'NORMAL';
      const classification = pickEnum(body.classification, ALLOWED_CLASSIFICATIONS, 'OFFICIAL') || 'OFFICIAL';
      const routeTo = body.routeTo === 'approval' ? 'SUBMITTED' : 'DRAFT';

      const ins = await pool.query(
        `INSERT INTO official_communications
            (organization_id, doc_number, doc_type, subject_ar, subject_en,
             body_ar, body_en, status, priority, classification,
             author_user_id, author_name_ar, from_entity, to_entity, cc_entities,
             linked_entity_type, linked_entity_id, linked_entity_name,
             references_ar, attachments_ar,
             submitted_by_user, submitted_at,
             created_by, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NOW(),NOW())
         RETURNING *`,
        [
          orgId,
          docNumber,
          docType,
          subjectAr,
          pickString(body.subjectEn, 300),
          pickString(body.bodyAr, 8000),
          pickString(body.bodyEn, 8000),
          routeTo,
          priority,
          classification,
          pickUuid(auth.payload?.sub || auth.payload?.user_id),
          pickString(auth.payload?.name_ar || auth.payload?.full_name_ar, 255),
          fromEntity,
          pickString(body.toEntity, 255),
          pickString(body.ccEntities, 4000),
          pickString(body.linkedEntityType, 30),
          pickUuid(body.linkedEntityId),
          pickString(body.linkedEntityName, 255),
          pickString(body.referencesAr, 2000),
          pickString(body.attachmentsAr, 2000),
          routeTo === 'SUBMITTED' ? pickUuid(auth.payload?.sub || auth.payload?.user_id) : null,
          routeTo === 'SUBMITTED' ? new Date().toISOString() : null,
          pickUuid(auth.payload?.sub || auth.payload?.user_id),
        ],
      );

      const created = ins.rows[0];

      // ─── Recipients (optional) ──────────────────────────────────
      const recipients: any[] = Array.isArray(body.recipients) ? body.recipients : [];
      if (recipients.length) {
        for (const r of recipients.slice(0, 200)) {
          const recipientType = pickEnum(r.recipientType, new Set(['DEPARTMENT', 'ROLE', 'USER', 'ENTITY', 'ALL']), 'DEPARTMENT') || 'DEPARTMENT';
          const recipientEntity = pickString(r.recipientEntity, 255, false) || '—';
          try {
            await pool.query(
              `INSERT INTO official_communication_recipients
                 (organization_id, communication_id, recipient_type, recipient_entity, recipient_user_id, distribution_channel)
               VALUES ($1,$2,$3,$4,$5,$6)
               ON CONFLICT (communication_id, recipient_type, recipient_entity) DO NOTHING`,
              [
                orgId,
                created.id,
                recipientType,
                recipientEntity,
                pickUuid(r.recipientUserId),
                pickEnum(r.distributionChannel, new Set(['IN_APP', 'EMAIL', 'PUSH', 'PRINT', 'LEGACY']), 'IN_APP') || 'IN_APP',
              ],
            );
          } catch {
            /* skip bad row, keep going */
          }
        }
      }

      const full = await getCommunicationById(created.id, orgId);
      return res.status(201).json({ data: full });
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE /api/v2/communications  → soft-delete only DRAFT/REJECTED
    // ═══════════════════════════════════════════════════════════════
    if (req.method === 'DELETE') {
      const id = req.query.id ? String(req.query.id) : null;
      if (!id) return res.status(400).json({ error: 'id query param required' });
      const cur = await pool.query(
        `SELECT status FROM official_communications WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
        [id, orgId],
      );
      if (!cur.rows[0]) return res.status(404).json({ error: 'Not found' });
      if (!['DRAFT', 'REJECTED'].includes(cur.rows[0].status)) {
        return res.status(409).json({ error: 'Only DRAFT or REJECTED communications can be deleted' });
      }
      await pool.query(
        `UPDATE official_communications SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id],
      );
      return res.status(200).json({ data: { id, deleted: true } });
    }

    return res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS').status(405).json({ error: 'Method Not Allowed' });
  } catch (err: any) {
    // Log server-side only — never leak DB error details to the client
    console.error('[API/Comms] handler error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
