/**
 * NexoraOS™ — NEB-06: Service Delivery OS Routes
 * NEB-07: Community & Membership OS Routes
 * NEB-13: AI Intelligence & Impact OS Storage Routes
 * NEB-14: Procurement OS Routes (RFQs, Vendors, Purchase Orders, 3-Way Match)
 * 
 * All in one cohesive operational routes file — no duplicates
 */

import express from 'express';
import { getDatabasePool, withTransaction } from '../services/db.service';
import { recordAuditLog } from '../services/audit.service';
import {
  extractTenantId,
  requireSecurityLevel,
  sanitizeString,
  sanitizeNumeric,
  requireString,
  validationError,
  isValidUUID,
  isValidDate,
} from '../middleware/auth.middleware';
import {
  requireActivityPolicy,
  requireProcurementPolicy,
  requireFinancePolicy,
  requireAuditPolicy,
} from '../middleware/policy.middleware';

export const operationalDomainRouter = express.Router();

// ═══════════════════════════════════════════════════════════════
// NEB-06: SERVICE DELIVERY OS
// ═══════════════════════════════════════════════════════════════

// GET /api/operational/service-deliveries
operationalDomainRouter.get('/service-deliveries', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { project_id, service_type, governorate, from_date, to_date } = req.query;

    let sql = `
      SELECT sd.*,
             pr.name_ar AS project_name_ar, pr.project_code,
             h.full_name_ar AS field_officer_name
      FROM service_deliveries sd
      LEFT JOIN projects pr ON sd.project_id = pr.id
      LEFT JOIN hr_staff h ON sd.field_officer_id = h.id
      WHERE sd.organization_id = $1`;
    const params: any[] = [orgId];

    if (project_id && isValidUUID(project_id as string)) { params.push(project_id); sql += ` AND sd.project_id = $${params.length}`; }
    if (service_type) { params.push(service_type); sql += ` AND sd.service_type = $${params.length}`; }
    if (governorate) { params.push(governorate); sql += ` AND sd.governorate ILIKE $${params.length}`; }
    if (from_date && isValidDate(from_date as string)) { params.push(from_date); sql += ` AND sd.delivery_date >= $${params.length}`; }
    if (to_date && isValidDate(to_date as string)) { params.push(to_date); sql += ` AND sd.delivery_date <= $${params.length}`; }
    sql += ` ORDER BY sd.delivery_date DESC LIMIT 500`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows, count: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch service deliveries' });
  }
});

operationalDomainRouter.post('/service-deliveries', requireSecurityLevel(2), requireActivityPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      activity_id, project_id, service_type, delivery_date, delivery_location,
      governorate, district, beneficiaries_targeted, beneficiaries_reached,
      families_reached = 0, males_reached = 0, females_reached = 0, children_reached = 0,
      elderly_reached = 0, pwds_reached = 0, unit_cost_yer = 0, total_cost_yer = 0,
      quality_score = 0, sphere_standard_met = false, field_officer_id, notes
    } = req.body;

    try {
      requireString(service_type, 'service_type');
      if (!delivery_date || !isValidDate(delivery_date)) throw new Error("Valid 'delivery_date' is required");
      if (!beneficiaries_reached || Number(beneficiaries_reached) < 0) throw new Error("'beneficiaries_reached' is required");
    } catch (e: any) { return validationError(res, e.message); }

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO service_deliveries (
        organization_id, activity_id, project_id, service_type, delivery_date,
        delivery_location, governorate, district, beneficiaries_targeted, beneficiaries_reached,
        families_reached, males_reached, females_reached, children_reached,
        elderly_reached, pwds_reached, unit_cost_yer, total_cost_yer,
        quality_score, sphere_standard_met, field_officer_id, notes, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'COMPLETED',NOW(),NOW())
      RETURNING *`,
      [orgId,
       (activity_id && isValidUUID(activity_id)) ? activity_id : null,
       (project_id && isValidUUID(project_id)) ? project_id : null,
       service_type, delivery_date,
       sanitizeString(delivery_location) || null, sanitizeString(governorate) || null, sanitizeString(district) || null,
       sanitizeNumeric(beneficiaries_targeted) || 0, sanitizeNumeric(beneficiaries_reached),
       sanitizeNumeric(families_reached), sanitizeNumeric(males_reached), sanitizeNumeric(females_reached),
       sanitizeNumeric(children_reached), sanitizeNumeric(elderly_reached), sanitizeNumeric(pwds_reached),
       sanitizeNumeric(unit_cost_yer), sanitizeNumeric(total_cost_yer),
       Math.min(5, Math.max(0, Number(quality_score) || 0)), Boolean(sphere_standard_met),
       (field_officer_id && isValidUUID(field_officer_id)) ? field_officer_id : null,
       sanitizeString(notes) || null]
    );

    await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'CREATE', tableName: 'service_deliveries', recordId: result.rows[0].id, details: { service_type, beneficiaries_reached } });
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create service delivery' });
  }
});

// GET /api/operational/service-delivery-metrics
operationalDomainRouter.get('/service-delivery-metrics', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT * FROM v_service_delivery_metrics WHERE organization_id = $1 ORDER BY delivery_month DESC`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch service delivery metrics' });
  }
});

// ═══════════════════════════════════════════════════════════════
// NEB-07: COMMUNITY & MEMBERSHIP OS
// ═══════════════════════════════════════════════════════════════

// --- Volunteer Tasks ---
operationalDomainRouter.get('/volunteer-tasks', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { volunteer_id, project_id, status } = req.query;

    let sql = `
      SELECT vt.*, v.name AS volunteer_name, v.phone AS volunteer_phone,
             pr.name_ar AS project_name_ar
      FROM volunteer_tasks vt
      LEFT JOIN volunteers v ON vt.volunteer_id = v.id
      LEFT JOIN projects pr ON vt.project_id = pr.id
      WHERE vt.organization_id = $1`;
    const params: any[] = [orgId];

    if (volunteer_id && isValidUUID(volunteer_id as string)) { params.push(volunteer_id); sql += ` AND vt.volunteer_id = $${params.length}`; }
    if (project_id && isValidUUID(project_id as string)) { params.push(project_id); sql += ` AND vt.project_id = $${params.length}`; }
    if (status) { params.push(status); sql += ` AND vt.status = $${params.length}`; }
    sql += ` ORDER BY vt.planned_date DESC LIMIT 300`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows, count: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch volunteer tasks' });
  }
});

operationalDomainRouter.post('/volunteer-tasks', requireSecurityLevel(2), requireActivityPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      volunteer_id, activity_id, project_id, title_ar, title_en,
      task_type = 'FIELD', planned_date, planned_hours = 4, location, governorate, supervisor_id
    } = req.body;

    try {
      if (!isValidUUID(volunteer_id)) throw new Error("Valid 'volunteer_id' is required");
      requireString(title_ar, 'title_ar');
      if (!planned_date || !isValidDate(planned_date)) throw new Error("Valid 'planned_date' is required");
    } catch (e: any) { return validationError(res, e.message); }

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO volunteer_tasks (
        organization_id, volunteer_id, activity_id, project_id, title_ar, title_en,
        task_type, planned_date, planned_hours, location, governorate, supervisor_id, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'ASSIGNED',NOW(),NOW())
      RETURNING *`,
      [orgId, volunteer_id,
       (activity_id && isValidUUID(activity_id)) ? activity_id : null,
       (project_id && isValidUUID(project_id)) ? project_id : null,
       sanitizeString(title_ar), sanitizeString(title_en) || null, task_type,
       planned_date, sanitizeNumeric(planned_hours) || 4,
       sanitizeString(location) || null, sanitizeString(governorate) || null,
       (supervisor_id && isValidUUID(supervisor_id)) ? supervisor_id : null]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create volunteer task' });
  }
});

operationalDomainRouter.patch('/volunteer-tasks/:id/complete', requireSecurityLevel(2), requireActivityPolicy('UPDATE'), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID' });
    const orgId = extractTenantId(req);
    const { actual_hours, performance_score, supervisor_notes } = req.body;

    const pool = getDatabasePool();
    const result = await pool.query(`
      UPDATE volunteer_tasks SET
        status = 'COMPLETED', actual_date = CURRENT_DATE,
        actual_hours = COALESCE($1, planned_hours),
        performance_score = $2,
        supervisor_notes = $3,
        updated_at = NOW()
      WHERE id = $4 AND organization_id = $5 AND status NOT IN ('COMPLETED', 'CANCELLED')
      RETURNING *`,
      [sanitizeNumeric(actual_hours), 
       performance_score ? Math.min(5, Math.max(1, Number(performance_score))) : null,
       sanitizeString(supervisor_notes) || null, id, orgId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Task not found or already completed' });
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to complete volunteer task' });
  }
});

// GET volunteer hours report
operationalDomainRouter.get('/volunteer-hours-report', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT vhr.* FROM v_volunteer_hours_report vhr
       JOIN volunteers v ON vhr.volunteer_id = v.id
       WHERE v.organization_id = $1
       ORDER BY total_hours DESC`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch volunteer hours report' });
  }
});

// --- Community Committees ---
operationalDomainRouter.get('/community-committees', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { status, governorate, committee_type } = req.query;

    let sql = `SELECT * FROM community_committees WHERE organization_id = $1 AND deleted_at IS NULL`;
    const params: any[] = [orgId];
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    if (governorate) { params.push(governorate); sql += ` AND governorate ILIKE $${params.length}`; }
    if (committee_type) { params.push(committee_type); sql += ` AND committee_type = $${params.length}`; }
    sql += ` ORDER BY created_at DESC`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch community committees' });
  }
});

operationalDomainRouter.post('/community-committees', requireSecurityLevel(2), requireActivityPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      committee_code, name_ar, name_en, committee_type = 'PROTECTION',
      governorate, district, village, established_date, chairperson_name,
      chairperson_phone, members_count = 0, women_representation_pct = 0,
      meeting_frequency = 'MONTHLY', linked_project_id
    } = req.body;

    try {
      requireString(committee_code, 'committee_code');
      requireString(name_ar, 'name_ar');
    } catch (e: any) { return validationError(res, e.message); }

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO community_committees (
        organization_id, committee_code, name_ar, name_en, committee_type,
        governorate, district, village, established_date, chairperson_name,
        chairperson_phone, members_count, women_representation_pct,
        meeting_frequency, linked_project_id, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'ACTIVE',NOW(),NOW())
      RETURNING *`,
      [orgId, sanitizeString(committee_code), sanitizeString(name_ar), sanitizeString(name_en) || null,
       committee_type, sanitizeString(governorate) || null, sanitizeString(district) || null,
       sanitizeString(village) || null,
       isValidDate(established_date) ? established_date : null,
       sanitizeString(chairperson_name) || null, sanitizeString(chairperson_phone) || null,
       sanitizeNumeric(members_count) || 0, sanitizeNumeric(women_representation_pct) || 0,
       meeting_frequency, (linked_project_id && isValidUUID(linked_project_id)) ? linked_project_id : null]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    if (err.constraint === 'community_committees_committee_code_key') return res.status(409).json({ error: 'Committee code already exists' });
    res.status(500).json({ error: 'Failed to create community committee' });
  }
});

// --- Membership Applications ---
operationalDomainRouter.get('/membership-applications', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { status, membership_type } = req.query;

    let sql = `SELECT * FROM membership_applications WHERE organization_id = $1`;
    const params: any[] = [orgId];
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    if (membership_type) { params.push(membership_type); sql += ` AND membership_type = $${params.length}`; }
    sql += ` ORDER BY application_date DESC`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch membership applications' });
  }
});

operationalDomainRouter.post('/membership-applications', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      applicant_name_ar, applicant_name_en, national_id, phone, email,
      age, gender, governorate, district, skills = [], motivation_statement, membership_type = 'VOLUNTEER'
    } = req.body;

    try { requireString(applicant_name_ar, 'applicant_name_ar'); } catch (e: any) { return validationError(res, e.message); }

    const pool = getDatabasePool();

    // Prevent duplicate membership application from same national_id or email
    if (national_id || email) {
      const dupCheck = await pool.query(
        `SELECT id FROM membership_applications WHERE organization_id = $1 AND ((national_id IS NOT NULL AND national_id = $2) OR (email IS NOT NULL AND LOWER(email) = LOWER($3))) AND status != 'REJECTED' LIMIT 1`,
        [orgId, national_id || '__NONE__', email || '__NONE__']
      );
      if (dupCheck.rows.length > 0) {
        return res.status(409).json({ error: 'A membership application with this national ID or email already exists' });
      }
    }

    const result = await pool.query(`
      INSERT INTO membership_applications (
        organization_id, applicant_name_ar, applicant_name_en, national_id, phone, email,
        age, gender, governorate, district, skills, motivation_statement, membership_type, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'PENDING',NOW(),NOW())
      RETURNING *`,
      [orgId, sanitizeString(applicant_name_ar), sanitizeString(applicant_name_en) || null,
       sanitizeString(national_id) || null, sanitizeString(phone) || null,
       sanitizeString(email) || null, sanitizeNumeric(age) || null, sanitizeString(gender) || null,
       sanitizeString(governorate) || null, sanitizeString(district) || null,
       JSON.stringify(skills), sanitizeString(motivation_statement) || null, membership_type]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit membership application' });
  }
});

operationalDomainRouter.patch('/membership-applications/:id/review', requireSecurityLevel(3), requireActivityPolicy('UPDATE'), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID' });
    const orgId = extractTenantId(req);
    const { status, rejection_reason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) return validationError(res, "status must be 'APPROVED' or 'REJECTED'");

    const pool = getDatabasePool();
    const result = await pool.query(`
      UPDATE membership_applications SET
        status = $1, reviewed_by = $2, decision_date = CURRENT_DATE,
        rejection_reason = $3, updated_at = NOW()
      WHERE id = $4 AND organization_id = $5 AND status = 'PENDING'
      RETURNING *`,
      [status, req.user?.id || null, sanitizeString(rejection_reason) || null, id, orgId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Application not found or already reviewed' });
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to review membership application' });
  }
});

// ═══════════════════════════════════════════════════════════════
// NEB-13: AI INTELLIGENCE STORAGE — Persist & Retrieve Insights
// ═══════════════════════════════════════════════════════════════

operationalDomainRouter.get('/ai-insights', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { insight_type, risk_level, limit = 50 } = req.query;

    let sql = `SELECT * FROM ai_insights WHERE organization_id = $1 AND (expires_at IS NULL OR expires_at > NOW())`;
    const params: any[] = [orgId];

    if (insight_type) { params.push(insight_type); sql += ` AND insight_type = $${params.length}`; }
    if (risk_level) { params.push(risk_level); sql += ` AND risk_level = $${params.length}`; }
    params.push(Math.min(Number(limit) || 50, 200));
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows, count: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

operationalDomainRouter.post('/ai-insights', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      insight_type, model_used = 'gemini-2.5-flash', context_data = {},
      insight_ar, insight_en, structured_data = {}, risk_level, confidence_score = 0
    } = req.body;

    try { requireString(insight_type, 'insight_type'); } catch (e: any) { return validationError(res, e.message); }

    const pool = getDatabasePool();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 30); // Insights expire in 30 days

    const result = await pool.query(`
      INSERT INTO ai_insights (
        organization_id, insight_type, model_used, context_data, insight_ar, insight_en,
        structured_data, risk_level, confidence_score, generated_by_user_id, expires_at, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      RETURNING id, insight_type, risk_level, created_at`,
      [orgId, insight_type, model_used, JSON.stringify(context_data),
       sanitizeString(insight_ar) || null, sanitizeString(insight_en) || null,
       JSON.stringify(structured_data), risk_level || null,
       Math.min(100, Math.max(0, Number(confidence_score) || 0)),
       req.user?.id || null, expires_at.toISOString()]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to store AI insight' });
  }
});

// CHS Evaluations
operationalDomainRouter.get('/chs-evaluations', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT * FROM v_chs_compliance_dashboard WHERE organization_id = $1 ORDER BY evaluation_period_end DESC`,
      [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch CHS evaluations' });
  }
});

operationalDomainRouter.post('/chs-evaluations', requireSecurityLevel(3), requireActivityPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      project_id, program_id, evaluation_period_start, evaluation_period_end,
      chs_1_appropriate_response = 0, chs_2_coordination = 0, chs_3_cash_programming = 0,
      chs_4_complaint_mechanisms = 0, chs_5_community_support = 0, chs_6_staff_competence = 0,
      chs_7_financial_management = 0, chs_8_coordination_stakeholders = 0, chs_9_continuous_learning = 0,
      evaluator_name, evaluation_method = 'SELF_ASSESSMENT', strengths, gaps, action_plan = []
    } = req.body;

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO chs_evaluations (
        organization_id, project_id, program_id, evaluation_period_start, evaluation_period_end,
        chs_1_appropriate_response, chs_2_coordination, chs_3_cash_programming,
        chs_4_complaint_mechanisms, chs_5_community_support, chs_6_staff_competence,
        chs_7_financial_management, chs_8_coordination_stakeholders, chs_9_continuous_learning,
        evaluator_name, evaluation_method, strengths, gaps, action_plan, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'DRAFT',NOW(),NOW())
      RETURNING *`,
      [orgId,
       (project_id && isValidUUID(project_id)) ? project_id : null,
       (program_id && isValidUUID(program_id)) ? program_id : null,
       evaluation_period_start, evaluation_period_end,
       chs_1_appropriate_response, chs_2_coordination, chs_3_cash_programming,
       chs_4_complaint_mechanisms, chs_5_community_support, chs_6_staff_competence,
       chs_7_financial_management, chs_8_coordination_stakeholders, chs_9_continuous_learning,
       sanitizeString(evaluator_name) || null, evaluation_method,
       sanitizeString(strengths) || null, sanitizeString(gaps) || null, JSON.stringify(action_plan)]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create CHS evaluation' });
  }
});

// Sphere Benchmarks
operationalDomainRouter.get('/sphere-benchmarks', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { project_id, sector } = req.query;

    let sql = `SELECT * FROM sphere_benchmarks WHERE organization_id = $1`;
    const params: any[] = [orgId];
    if (project_id && isValidUUID(project_id as string)) { params.push(project_id); sql += ` AND project_id = $${params.length}`; }
    if (sector) { params.push(sector); sql += ` AND sector = $${params.length}`; }
    sql += ` ORDER BY assessment_date DESC`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch Sphere benchmarks' });
  }
});

// Anomaly Logs
operationalDomainRouter.get('/anomaly-logs', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT * FROM v_ai_anomaly_detection_feed WHERE organization_id = $1 LIMIT 100`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch anomaly logs' });
  }
});

operationalDomainRouter.patch('/anomaly-logs/:id/resolve', requireSecurityLevel(2), requireAuditPolicy('UPDATE'), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID' });
    const orgId = extractTenantId(req);
    const { resolution_notes, is_false_positive = false } = req.body;

    const pool = getDatabasePool();
    const result = await pool.query(`
      UPDATE anomaly_logs SET
        is_resolved = true, resolved_by = $1, resolved_at = NOW(),
        resolution_notes = $2, is_false_positive = $3
      WHERE id = $4 AND organization_id = $5
      RETURNING id, anomaly_type, severity, is_resolved, resolved_at`,
      [req.user?.id || null, sanitizeString(resolution_notes) || null,
       Boolean(is_false_positive), id, orgId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Anomaly not found' });
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to resolve anomaly' });
  }
});

// ═══════════════════════════════════════════════════════════════
// NEB-14: PROCUREMENT OS — RFQs, Vendors, Purchase Orders
// ═══════════════════════════════════════════════════════════════

// --- RFQs ---
operationalDomainRouter.get('/rfqs', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { status, project_id } = req.query;

    let sql = `
      SELECT r.*, pr.name_ar AS project_name_ar, pr.project_code,
             COUNT(vb.id) AS bids_count
      FROM rfqs r
      LEFT JOIN projects pr ON r.project_id = pr.id
      LEFT JOIN vendor_bids vb ON vb.rfq_id = r.id
      WHERE r.organization_id = $1 AND r.deleted_at IS NULL`;
    const params: any[] = [orgId];
    if (status) { params.push(status); sql += ` AND r.status = $${params.length}`; }
    if (project_id && isValidUUID(project_id as string)) { params.push(project_id); sql += ` AND r.project_id = $${params.length}`; }
    sql += ` GROUP BY r.id, pr.name_ar, pr.project_code ORDER BY r.created_at DESC`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch RFQs' });
  }
});

operationalDomainRouter.post('/rfqs', requireSecurityLevel(3), requireProcurementPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      tender_id, project_id, rfq_number, title_ar, title_en, scope_of_work,
      specifications = [], delivery_location, delivery_date, submission_deadline,
      estimated_value = 0, currency_code = 'USD', evaluation_criteria = {}
    } = req.body;

    try {
      requireString(rfq_number, 'rfq_number');
      requireString(title_ar, 'title_ar');
    } catch (e: any) { return validationError(res, e.message); }

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO rfqs (
        organization_id, tender_id, project_id, rfq_number, title_ar, title_en,
        scope_of_work, specifications, delivery_location, delivery_date, submission_deadline,
        estimated_value, currency_code, evaluation_criteria, status, created_by, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'OPEN',$15,NOW(),NOW())
      RETURNING *`,
      [orgId, (tender_id && isValidUUID(tender_id)) ? tender_id : null,
       (project_id && isValidUUID(project_id)) ? project_id : null,
       sanitizeString(rfq_number), sanitizeString(title_ar), sanitizeString(title_en) || null,
       sanitizeString(scope_of_work) || null, JSON.stringify(specifications),
       sanitizeString(delivery_location) || null,
       isValidDate(delivery_date) ? delivery_date : null,
       isValidDate(submission_deadline) ? submission_deadline : null,
       sanitizeNumeric(estimated_value) || 0, currency_code,
       JSON.stringify(evaluation_criteria), req.user?.id || null]
    );

    await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'CREATE', tableName: 'rfqs', recordId: result.rows[0].id });
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    if (err.constraint === 'rfqs_rfq_number_key') return res.status(409).json({ error: 'RFQ number already exists' });
    res.status(500).json({ error: 'Failed to create RFQ' });
  }
});

// --- Vendor Bids ---
operationalDomainRouter.get('/rfqs/:rfqId/bids', async (req: any, res) => {
  try {
    const { rfqId } = req.params;
    if (!isValidUUID(rfqId)) return res.status(400).json({ error: 'Invalid RFQ ID' });
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();

    const result = await pool.query(`
      SELECT vb.*, p.name_ar AS vendor_name_ar, p.name_en AS vendor_name_en, p.phone AS vendor_phone
      FROM vendor_bids vb
      LEFT JOIN parties p ON vb.vendor_party_id = p.id
      WHERE vb.rfq_id = $1 AND vb.organization_id = $2
      ORDER BY vb.combined_score DESC, vb.bid_amount ASC`,
      [rfqId, orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

operationalDomainRouter.post('/rfqs/:rfqId/bids', requireProcurementPolicy('CREATE'), async (req: any, res) => {
  try {
    const { rfqId } = req.params;
    if (!isValidUUID(rfqId)) return res.status(400).json({ error: 'Invalid RFQ ID' });
    const orgId = extractTenantId(req);
    const {
      vendor_party_id, bid_amount, currency_code = 'USD', delivery_days,
      warranty_months = 0, bid_details = {}, technical_score = 0, financial_score = 0
    } = req.body;

    if (!isValidUUID(vendor_party_id) || !bid_amount) return validationError(res, 'vendor_party_id and bid_amount are required');

    const combined_score = (Number(technical_score) * 0.4) + (Number(financial_score) * 0.6);

    const pool = getDatabasePool();

    // Prevent duplicate bid from same vendor for same RFQ
    const existingBid = await pool.query(
      `SELECT id FROM vendor_bids WHERE rfq_id = $1 AND vendor_party_id = $2 AND status NOT IN ('REJECTED', 'WITHDRAWN') LIMIT 1`,
      [rfqId, vendor_party_id]
    );
    if (existingBid.rows.length > 0) {
      return res.status(409).json({ error: 'This vendor has already submitted a bid for this RFQ' });
    }

    const result = await pool.query(`
      INSERT INTO vendor_bids (
        organization_id, rfq_id, vendor_party_id, bid_amount, currency_code,
        delivery_days, warranty_months, technical_score, financial_score, combined_score,
        bid_details, status, submitted_at, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'SUBMITTED',NOW(),NOW())
      RETURNING *`,
      [orgId, rfqId, vendor_party_id, sanitizeNumeric(bid_amount), currency_code,
       sanitizeNumeric(delivery_days) || null, sanitizeNumeric(warranty_months) || 0,
       sanitizeNumeric(technical_score) || 0, sanitizeNumeric(financial_score) || 0,
       parseFloat(combined_score.toFixed(2)), JSON.stringify(bid_details)]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit bid' });
  }
});

// Award RFQ to a vendor
operationalDomainRouter.patch('/rfqs/:rfqId/award', requireSecurityLevel(4), requireProcurementPolicy('APPROVE'), async (req: any, res) => {
  try {
    const { rfqId } = req.params;
    if (!isValidUUID(rfqId)) return res.status(400).json({ error: 'Invalid RFQ ID' });
    const orgId = extractTenantId(req);
    const { vendor_party_id, awarded_amount, bid_id } = req.body;
    if (!isValidUUID(vendor_party_id) || !awarded_amount) return validationError(res, 'vendor_party_id and awarded_amount are required');

    await withTransaction(async (client) => {
      await client.query(`UPDATE rfqs SET status = 'AWARDED', awarded_vendor_id = $1, awarded_amount = $2, award_date = CURRENT_DATE, updated_at = NOW() WHERE id = $3 AND organization_id = $4`, [vendor_party_id, awarded_amount, rfqId, orgId]);
      if (bid_id && isValidUUID(bid_id)) {
        await client.query(`UPDATE vendor_bids SET status = 'AWARDED' WHERE id = $1`, [bid_id]);
        await client.query(`UPDATE vendor_bids SET status = 'REJECTED' WHERE rfq_id = $1 AND id != $2`, [rfqId, bid_id]);
      }
      await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'AWARD_RFQ', tableName: 'rfqs', recordId: rfqId, details: { vendor_party_id, awarded_amount } });
      res.json({ status: 'ok', message: 'RFQ awarded successfully' });
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to award RFQ' });
  }
});

// --- Purchase Orders ---
operationalDomainRouter.get('/purchase-orders', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { status, project_id, vendor_party_id } = req.query;

    let sql = `
      SELECT po.*, p.name_ar AS vendor_name_ar, pr.name_ar AS project_name_ar, pr.project_code
      FROM purchase_orders po
      LEFT JOIN parties p ON po.vendor_party_id = p.id
      LEFT JOIN projects pr ON po.project_id = pr.id
      WHERE po.organization_id = $1 AND po.deleted_at IS NULL`;
    const params: any[] = [orgId];
    if (status) { params.push(status); sql += ` AND po.status = $${params.length}`; }
    if (project_id && isValidUUID(project_id as string)) { params.push(project_id); sql += ` AND po.project_id = $${params.length}`; }
    if (vendor_party_id && isValidUUID(vendor_party_id as string)) { params.push(vendor_party_id); sql += ` AND po.vendor_party_id = $${params.length}`; }
    sql += ` ORDER BY po.created_at DESC`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

operationalDomainRouter.post('/purchase-orders', requireSecurityLevel(3), requireProcurementPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      rfq_id, vendor_bid_id, vendor_party_id, project_id, activity_id,
      po_number, title_ar, title_en, line_items = [], subtotal = 0,
      tax_amount = 0, discount_amount = 0, total_amount, currency_code = 'USD',
      exchange_rate = 1, delivery_address, expected_delivery_date, payment_terms
    } = req.body;

    try {
      requireString(po_number, 'po_number');
      requireString(title_ar, 'title_ar');
      if (!isValidUUID(vendor_party_id)) throw new Error("Valid 'vendor_party_id' is required");
      if (!total_amount || Number(total_amount) <= 0) throw new Error("'total_amount' must be positive");
    } catch (e: any) { return validationError(res, e.message); }

    const total_yer = Number(total_amount) * (Number(exchange_rate) || 1);

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO purchase_orders (
        organization_id, rfq_id, vendor_bid_id, vendor_party_id, project_id, activity_id,
        po_number, title_ar, title_en, line_items, subtotal, tax_amount, discount_amount,
        total_amount, currency_code, exchange_rate, total_yer, delivery_address,
        expected_delivery_date, payment_terms, status, goods_receipt_status, created_by, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,'DRAFT','PENDING',$21,NOW(),NOW())
      RETURNING *`,
      [orgId,
       (rfq_id && isValidUUID(rfq_id)) ? rfq_id : null,
       (vendor_bid_id && isValidUUID(vendor_bid_id)) ? vendor_bid_id : null,
       vendor_party_id,
       (project_id && isValidUUID(project_id)) ? project_id : null,
       (activity_id && isValidUUID(activity_id)) ? activity_id : null,
       sanitizeString(po_number), sanitizeString(title_ar), sanitizeString(title_en) || null,
       JSON.stringify(line_items),
       sanitizeNumeric(subtotal) || 0, sanitizeNumeric(tax_amount) || 0,
       sanitizeNumeric(discount_amount) || 0, sanitizeNumeric(total_amount),
       currency_code, sanitizeNumeric(exchange_rate) || 1, total_yer,
       sanitizeString(delivery_address) || null,
       isValidDate(expected_delivery_date) ? expected_delivery_date : null,
       sanitizeString(payment_terms) || null, req.user?.id || null]
    );

    await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'CREATE', tableName: 'purchase_orders', recordId: result.rows[0].id, details: { po_number, total_amount } });
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    if (err.constraint === 'purchase_orders_po_number_key') return res.status(409).json({ error: 'PO number already exists' });
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Approve PO
operationalDomainRouter.patch('/purchase-orders/:id/approve', requireSecurityLevel(4), requireProcurementPolicy('APPROVE'), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID' });
    const orgId = extractTenantId(req);

    const pool = getDatabasePool();
    const result = await pool.query(`
      UPDATE purchase_orders SET
        status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW()
      WHERE id = $2 AND organization_id = $3 AND status = 'DRAFT'
      RETURNING id, po_number, status, approved_at`,
      [req.user?.id || null, id, orgId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'PO not found or already approved' });
    await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'APPROVE_PO', tableName: 'purchase_orders', recordId: id });
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve purchase order' });
  }
});

// Vendors
operationalDomainRouter.get('/vendors', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(`
      SELECT v.*, p.name_ar AS party_name_ar, p.name_en AS party_name_en
      FROM vendors v
      LEFT JOIN parties p ON v.party_id = p.id
      WHERE v.organization_id = $1 AND v.deleted_at IS NULL AND v.blacklisted = false
      ORDER BY v.performance_score DESC, v.created_at DESC`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

operationalDomainRouter.get('/procurement-3way-match', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT * FROM v_procurement_3way_match WHERE organization_id = $1 ORDER BY po_amount DESC`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch 3-way match' });
  }
});

operationalDomainRouter.get('/vendor-performance', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT * FROM v_procurement_performance WHERE organization_id = $1 ORDER BY performance_score DESC`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vendor performance' });
  }
});

// Beneficiary Vulnerability Index
operationalDomainRouter.get('/vulnerability-index', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT * FROM v_beneficiary_vulnerability_index WHERE organization_id = $1 ORDER BY high_vulnerability_count DESC`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vulnerability index' });
  }
});

// KPI vs Target Dashboard
operationalDomainRouter.get('/kpi-dashboard', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT * FROM v_kpi_vs_target_dashboard WHERE organization_id = $1 ORDER BY achievement_pct ASC`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch KPI dashboard' });
  }
});
