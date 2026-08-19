/**
 * NexoraOS™ — NEB-08: Partnership & Funding OS Routes
 * Covers: donors, grants, grant_installments, funding_proposals, donor_reports, partner_agreements
 * Single file — no duplicate logic, uses shared middleware
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
import { requireDonorPolicy, requireProjectPolicy, requireFinancePolicy } from '../middleware/policy.middleware';

export const fundingRouter = express.Router();

// ─────────────────────────────────────────────────────────────────
// DONORS CRUD
// ─────────────────────────────────────────────────────────────────

fundingRouter.get('/donors', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { status, donor_type, search } = req.query;

    let sql = `
      SELECT d.*, p.name_ar AS party_name_ar, p.country AS party_country, p.phone AS party_phone
      FROM donors d
      LEFT JOIN parties p ON d.party_id = p.id
      WHERE d.organization_id = $1`;
    const params: any[] = [orgId];

    if (status) { params.push(status); sql += ` AND d.status = $${params.length}`; }
    if (donor_type) { params.push(donor_type); sql += ` AND d.donor_type = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (d.name_ar ILIKE $${params.length} OR d.name_en ILIKE $${params.length} OR d.donor_code ILIKE $${params.length})`;
    }
    sql += ` ORDER BY d.created_at DESC`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows, count: result.rowCount });
  } catch (err: any) {
    console.error('[NEB-08] GET /donors error:', err.message);
    res.status(500).json({ error: 'Failed to fetch donors' });
  }
});

fundingRouter.post('/donors', requireSecurityLevel(2), requireDonorPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      donor_code, name_ar, name_en, donor_type = 'INSTITUTIONAL',
      country, phone, email, website, contact_person, notes
    } = req.body;

    try { requireString(name_ar, 'name_ar'); requireString(donor_code, 'donor_code'); } catch (e: any) {
      return validationError(res, e.message);
    }

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO donors (organization_id, donor_code, name_ar, name_en, donor_type, country, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', NOW())
      RETURNING *`,
      [orgId, sanitizeString(donor_code), sanitizeString(name_ar), sanitizeString(name_en) || null,
       donor_type, sanitizeString(country) || null]
    );

    await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'CREATE', tableName: 'donors', recordId: result.rows[0].id });
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    if (err.constraint === 'donors_donor_code_key') return res.status(409).json({ error: 'Donor code already exists' });
    console.error('[NEB-08] POST /donors error:', err.message);
    res.status(500).json({ error: 'Failed to create donor' });
  }
});

fundingRouter.put('/donors/:id', requireSecurityLevel(2), requireDonorPolicy('UPDATE'), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid donor ID' });
    const orgId = extractTenantId(req);
    const { name_ar, name_en, status, country, donor_type } = req.body;

    const pool = getDatabasePool();
    const result = await pool.query(`
      UPDATE donors SET
        name_ar = COALESCE($1, name_ar),
        name_en = COALESCE($2, name_en),
        status = COALESCE($3, status),
        country = COALESCE($4, country),
        donor_type = COALESCE($5, donor_type),
        updated_at = NOW()
      WHERE id = $6 AND organization_id = $7
      RETURNING *`,
      [sanitizeString(name_ar), sanitizeString(name_en), status, sanitizeString(country), donor_type, id, orgId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Donor not found' });
    await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'UPDATE', tableName: 'donors', recordId: id });
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update donor' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GRANTS CRUD
// ─────────────────────────────────────────────────────────────────

fundingRouter.get('/grants', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { status, donor_id } = req.query;

    let sql = `
      SELECT g.*, d.name_ar AS donor_name_ar, d.name_en AS donor_name_en,
             pr.name_ar AS project_name_ar, p.name_ar AS program_name_ar,
             CASE WHEN g.total_amount > 0
                  THEN ROUND((g.spent_amount / g.total_amount) * 100, 2)
                  ELSE 0 END AS utilization_pct,
             g.total_amount - g.spent_amount AS remaining_amount
      FROM grants g
      LEFT JOIN donors d ON g.donor_id = d.id
      LEFT JOIN projects pr ON g.project_id = pr.id
      LEFT JOIN programs p ON g.program_id = p.id
      WHERE g.organization_id = $1 AND g.deleted_at IS NULL`;
    const params: any[] = [orgId];

    if (status) { params.push(status); sql += ` AND g.status = $${params.length}`; }
    if (donor_id && isValidUUID(donor_id)) { params.push(donor_id); sql += ` AND g.donor_id = $${params.length}`; }
    sql += ` ORDER BY g.created_at DESC`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows, count: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch grants' });
  }
});

fundingRouter.post('/grants', requireSecurityLevel(3), requireDonorPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      donor_id, project_id, program_id, grant_number, title_ar, title_en,
      total_amount, currency_code = 'USD', start_date, end_date, status = 'ACTIVE',
      iati_identifier, reporting_frequency = 'QUARTERLY', sector_codes = [],
      reporting_requirements, geographic_restrictions
    } = req.body;

    try {
      requireString(grant_number, 'grant_number');
      requireString(title_ar, 'title_ar');
      if (!total_amount || Number(total_amount) <= 0) throw new Error("'total_amount' must be a positive number");
    } catch (e: any) { return validationError(res, e.message); }

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO grants (
        organization_id, donor_id, project_id, program_id, grant_number, title_ar, title_en,
        total_amount, spent_amount, currency_code, start_date, end_date, status,
        iati_identifier, reporting_frequency, sector_codes, reporting_requirements,
        geographic_restrictions, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())
      RETURNING *`,
      [orgId,
       (donor_id && isValidUUID(donor_id)) ? donor_id : null,
       (project_id && isValidUUID(project_id)) ? project_id : null,
       (program_id && isValidUUID(program_id)) ? program_id : null,
       sanitizeString(grant_number), sanitizeString(title_ar), sanitizeString(title_en) || null,
       sanitizeNumeric(total_amount), currency_code,
       isValidDate(start_date) ? start_date : null,
       isValidDate(end_date) ? end_date : null,
       status, sanitizeString(iati_identifier) || null, reporting_frequency,
       JSON.stringify(sector_codes), sanitizeString(reporting_requirements) || null,
       sanitizeString(geographic_restrictions) || null]
    );

    await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'CREATE', tableName: 'grants', recordId: result.rows[0].id, details: { grant_number, total_amount } });
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    if (err.constraint === 'grants_grant_number_key') return res.status(409).json({ error: 'Grant number already exists' });
    res.status(500).json({ error: 'Failed to create grant' });
  }
});

fundingRouter.put('/grants/:id', requireSecurityLevel(3), requireDonorPolicy('UPDATE'), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid grant ID' });
    const orgId = extractTenantId(req);
    const { title_ar, title_en, status, spent_amount, compliance_status } = req.body;

    const pool = getDatabasePool();
    const result = await pool.query(`
      UPDATE grants SET
        title_ar = COALESCE($1, title_ar),
        title_en = COALESCE($2, title_en),
        status = COALESCE($3, status),
        spent_amount = COALESCE($4, spent_amount),
        compliance_status = COALESCE($5, compliance_status),
        updated_at = NOW()
      WHERE id = $6 AND organization_id = $7 AND deleted_at IS NULL
      RETURNING *`,
      [sanitizeString(title_ar), sanitizeString(title_en), status,
       sanitizeNumeric(spent_amount), compliance_status, id, orgId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Grant not found' });
    await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'UPDATE', tableName: 'grants', recordId: id });
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update grant' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GRANT INSTALLMENTS
// ─────────────────────────────────────────────────────────────────

fundingRouter.get('/grants/:grantId/installments', async (req: any, res) => {
  try {
    const { grantId } = req.params;
    if (!isValidUUID(grantId)) return res.status(400).json({ error: 'Invalid grant ID' });
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT * FROM grant_installments WHERE grant_id = $1 AND organization_id = $2 ORDER BY installment_number ASC`,
      [grantId, orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch installments' });
  }
});

fundingRouter.post('/grants/:grantId/installments', requireSecurityLevel(3), requireFinancePolicy('CREATE'), async (req: any, res) => {
  try {
    const { grantId } = req.params;
    if (!isValidUUID(grantId)) return res.status(400).json({ error: 'Invalid grant ID' });
    const orgId = extractTenantId(req);
    const { installment_number, planned_amount, planned_date, currency_code = 'USD', exchange_rate = 1, notes } = req.body;

    if (!installment_number || !planned_amount || !planned_date) {
      return validationError(res, 'installment_number, planned_amount, and planned_date are required');
    }

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO grant_installments (organization_id, grant_id, installment_number, planned_amount, planned_date, currency_code, exchange_rate, status, notes, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING',$8,NOW()) RETURNING *`,
      [orgId, grantId, installment_number, sanitizeNumeric(planned_amount),
       planned_date, currency_code, sanitizeNumeric(exchange_rate) || 1, sanitizeString(notes) || null]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create installment' });
  }
});

fundingRouter.patch('/grants/:grantId/installments/:id/receive', requireSecurityLevel(3), requireFinancePolicy('APPROVE'), async (req: any, res) => {
  try {
    const { grantId, id } = req.params;
    if (!isValidUUID(grantId) || !isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID' });
    const orgId = extractTenantId(req);
    const { received_amount, received_date, receipt_reference, bank_transaction_ref } = req.body;

    if (!received_amount || !received_date) {
      return validationError(res, 'received_amount and received_date are required');
    }

    await withTransaction(async (client) => {
      // Update installment
      const instResult = await client.query(`
        UPDATE grant_installments SET
          received_amount = $1, received_date = $2, receipt_reference = $3,
          bank_transaction_ref = $4, status = 'RECEIVED', updated_at = NOW()
        WHERE id = $5 AND grant_id = $6 AND organization_id = $7
        RETURNING *`,
        [sanitizeNumeric(received_amount), received_date, sanitizeString(receipt_reference) || null,
         sanitizeString(bank_transaction_ref) || null, id, grantId, orgId]
      );
      if (!instResult.rowCount) throw new Error('Installment not found');

      // Update grant spent_amount
      await client.query(`
        UPDATE grants SET
          spent_amount = spent_amount + $1, updated_at = NOW()
        WHERE id = $2 AND organization_id = $3`,
        [sanitizeNumeric(received_amount), grantId, orgId]
      );

      await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'RECEIVE_INSTALLMENT', tableName: 'grant_installments', recordId: id, details: { received_amount, grant_id: grantId } });
      res.json({ status: 'ok', data: instResult.rows[0] });
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record installment receipt' });
  }
});

// ─────────────────────────────────────────────────────────────────
// FUNDING PROPOSALS
// ─────────────────────────────────────────────────────────────────

fundingRouter.get('/proposals', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { status, donor_id } = req.query;

    let sql = `
      SELECT fp.*, d.name_ar AS donor_name_ar
      FROM funding_proposals fp
      LEFT JOIN donors d ON fp.donor_id = d.id
      WHERE fp.organization_id = $1 AND fp.deleted_at IS NULL`;
    const params: any[] = [orgId];

    if (status) { params.push(status); sql += ` AND fp.status = $${params.length}`; }
    if (donor_id && isValidUUID(donor_id)) { params.push(donor_id); sql += ` AND fp.donor_id = $${params.length}`; }
    sql += ` ORDER BY fp.created_at DESC`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows, count: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

fundingRouter.post('/proposals', requireSecurityLevel(2), requireDonorPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      donor_id, proposal_code, title_ar, title_en, sector, target_governorates = [],
      requested_amount, currency_code = 'USD', project_period_months = 12,
      target_beneficiaries = 0, submission_date, deadline_date
    } = req.body;

    try {
      requireString(proposal_code, 'proposal_code');
      requireString(title_ar, 'title_ar');
      requireString(title_en, 'title_en');
      if (!requested_amount || Number(requested_amount) <= 0) throw new Error("'requested_amount' must be positive");
    } catch (e: any) { return validationError(res, e.message); }

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO funding_proposals (
        organization_id, donor_id, proposal_code, title_ar, title_en, sector,
        target_governorates, requested_amount, currency_code, project_period_months,
        target_beneficiaries, submission_date, deadline_date, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'DRAFT',NOW(),NOW())
      RETURNING *`,
      [orgId, (donor_id && isValidUUID(donor_id)) ? donor_id : null,
       sanitizeString(proposal_code), sanitizeString(title_ar), sanitizeString(title_en),
       sanitizeString(sector) || null, JSON.stringify(target_governorates),
       sanitizeNumeric(requested_amount), currency_code, project_period_months,
       target_beneficiaries,
       isValidDate(submission_date) ? submission_date : null,
       isValidDate(deadline_date) ? deadline_date : null]
    );

    await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'CREATE', tableName: 'funding_proposals', recordId: result.rows[0].id });
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    if (err.constraint === 'funding_proposals_proposal_code_key') return res.status(409).json({ error: 'Proposal code already exists' });
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

fundingRouter.put('/proposals/:id', requireSecurityLevel(2), requireDonorPolicy('UPDATE'), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid proposal ID' });
    const orgId = extractTenantId(req);
    const { status, approved_amount, rejection_reason, document_url } = req.body;

    const pool = getDatabasePool();
    const result = await pool.query(`
      UPDATE funding_proposals SET
        status = COALESCE($1, status),
        approved_amount = COALESCE($2, approved_amount),
        rejection_reason = COALESCE($3, rejection_reason),
        document_url = COALESCE($4, document_url),
        updated_at = NOW()
      WHERE id = $5 AND organization_id = $6 AND deleted_at IS NULL
      RETURNING *`,
      [status, sanitizeNumeric(approved_amount), sanitizeString(rejection_reason) || null,
       sanitizeString(document_url) || null, id, orgId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Proposal not found' });
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

// ─────────────────────────────────────────────────────────────────
// DONOR REPORTS
// ─────────────────────────────────────────────────────────────────

fundingRouter.get('/donor-reports', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const { grant_id, status } = req.query;

    let sql = `
      SELECT dr.*, g.title_ar AS grant_title_ar, g.grant_number, d.name_ar AS donor_name_ar
      FROM donor_reports dr
      LEFT JOIN grants g ON dr.grant_id = g.id
      LEFT JOIN donors d ON dr.donor_id = d.id
      WHERE dr.organization_id = $1`;
    const params: any[] = [orgId];

    if (grant_id && isValidUUID(grant_id as string)) { params.push(grant_id); sql += ` AND dr.grant_id = $${params.length}`; }
    if (status) { params.push(status); sql += ` AND dr.status = $${params.length}`; }
    sql += ` ORDER BY dr.submission_deadline ASC`;

    const result = await pool.query(sql, params);
    res.json({ status: 'ok', data: result.rows, count: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch donor reports' });
  }
});

fundingRouter.post('/donor-reports', requireSecurityLevel(2), requireDonorPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      grant_id, donor_id, report_code, report_type = 'NARRATIVE',
      reporting_period_start, reporting_period_end, submission_deadline,
      key_achievements, challenges_faced, next_steps
    } = req.body;

    try {
      requireString(report_code, 'report_code');
      if (!isValidUUID(grant_id)) throw new Error("Valid 'grant_id' is required");
      if (!reporting_period_start || !reporting_period_end) throw new Error('Reporting period dates are required');
    } catch (e: any) { return validationError(res, e.message); }

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO donor_reports (
        organization_id, grant_id, donor_id, report_code, report_type,
        reporting_period_start, reporting_period_end, submission_deadline,
        key_achievements, challenges_faced, next_steps, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING',NOW(),NOW())
      RETURNING *`,
      [orgId, grant_id, (donor_id && isValidUUID(donor_id)) ? donor_id : null,
       sanitizeString(report_code), report_type, reporting_period_start, reporting_period_end,
       isValidDate(submission_deadline) ? submission_deadline : null,
       sanitizeString(key_achievements) || null, sanitizeString(challenges_faced) || null,
       sanitizeString(next_steps) || null]
    );

    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create donor report' });
  }
});

fundingRouter.patch('/donor-reports/:id/submit', requireSecurityLevel(2), requireDonorPolicy('UPDATE'), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID' });
    const orgId = extractTenantId(req);
    const { beneficiaries_reached, budget_utilized_pct, document_url } = req.body;

    const pool = getDatabasePool();
    const result = await pool.query(`
      UPDATE donor_reports SET
        status = 'SUBMITTED', submitted_date = CURRENT_DATE,
        beneficiaries_reached = COALESCE($1, beneficiaries_reached),
        budget_utilized_pct = COALESCE($2, budget_utilized_pct),
        document_url = COALESCE($3, document_url),
        updated_at = NOW()
      WHERE id = $4 AND organization_id = $5 AND status = 'PENDING'
      RETURNING *`,
      [sanitizeNumeric(beneficiaries_reached), sanitizeNumeric(budget_utilized_pct),
       sanitizeString(document_url) || null, id, orgId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Report not found or already submitted' });
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit donor report' });
  }
});

// ─────────────────────────────────────────────────────────────────
// PARTNER AGREEMENTS
// ─────────────────────────────────────────────────────────────────

fundingRouter.get('/partner-agreements', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(`
      SELECT * FROM partner_agreements
      WHERE organization_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch partner agreements' });
  }
});

fundingRouter.post('/partner-agreements', requireSecurityLevel(3), requireDonorPolicy('CREATE'), async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const {
      agreement_code, agreement_type = 'MOU', title_ar, title_en,
      partner_organization_name, partner_country, signed_date,
      start_date, end_date, value_usd = 0, focal_point_name, focal_point_email
    } = req.body;

    try {
      requireString(agreement_code, 'agreement_code');
      requireString(title_ar, 'title_ar');
      requireString(partner_organization_name, 'partner_organization_name');
    } catch (e: any) { return validationError(res, e.message); }

    const pool = getDatabasePool();
    const result = await pool.query(`
      INSERT INTO partner_agreements (
        organization_id, agreement_code, agreement_type, title_ar, title_en,
        partner_organization_name, partner_country, signed_date, start_date, end_date,
        value_usd, focal_point_name, focal_point_email, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'ACTIVE',NOW(),NOW())
      RETURNING *`,
      [orgId, sanitizeString(agreement_code), agreement_type,
       sanitizeString(title_ar), sanitizeString(title_en) || null,
       sanitizeString(partner_organization_name), sanitizeString(partner_country) || null,
       isValidDate(signed_date) ? signed_date : null,
       isValidDate(start_date) ? start_date : null,
       isValidDate(end_date) ? end_date : null,
       sanitizeNumeric(value_usd) || 0, sanitizeString(focal_point_name) || null,
       sanitizeString(focal_point_email) || null]
    );

    await recordAuditLog({ organizationId: orgId, userId: req.user?.id, action: 'CREATE', tableName: 'partner_agreements', recordId: result.rows[0].id });
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    if (err.constraint === 'partner_agreements_agreement_code_key') return res.status(409).json({ error: 'Agreement code already exists' });
    res.status(500).json({ error: 'Failed to create partner agreement' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GRANT UTILIZATION VIEW
// ─────────────────────────────────────────────────────────────────

fundingRouter.get('/reports/grant-utilization', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(`
      SELECT * FROM v_grant_utilization_report
      WHERE organization_id = $1
      ORDER BY utilization_pct DESC`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch grant utilization report' });
  }
});

fundingRouter.get('/reports/donor-portfolio', async (req: any, res) => {
  try {
    const orgId = extractTenantId(req);
    const pool = getDatabasePool();
    const result = await pool.query(`
      SELECT * FROM v_donor_portfolio_analysis
      WHERE organization_id = $1
      ORDER BY total_committed_usd DESC`, [orgId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch donor portfolio' });
  }
});
