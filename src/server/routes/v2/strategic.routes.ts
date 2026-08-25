import { Router } from 'express';
import { getPool } from '../../core/database';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/strategic-plan — Active strategic plan with goals, SWOT, KPIs, initiatives
router.get('/strategic-plan', authenticateToken, async (req: any, res) => {
  try {
    const dbPool = getPool();
    const tenantId = req.user?.org_id || '00000000-0000-0000-0000-000000000001';
    const planRes = await dbPool.query(`
      SELECT * FROM strategic_plans
      WHERE deleted_at IS NULL AND status = 'ACTIVE' AND organization_id = $1
      ORDER BY created_at DESC LIMIT 1
    `, [tenantId]);

    if (planRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No active strategic plan found.' });
    }

    const plan = planRes.rows[0];

    const [goalsRes, swotRes, kpisRes, initiativesRes] = await Promise.all([
      dbPool.query(`
        SELECT * FROM strategic_goals
        WHERE plan_id = $1 AND deleted_at IS NULL
        ORDER BY goal_code ASC
      `, [plan.id]),
      dbPool.query(`
        SELECT * FROM swot_analysis
        WHERE plan_id = $1
        ORDER BY category ASC, impact_level DESC
      `, [plan.id]),
      dbPool.query(`
        SELECT k.* FROM strategic_kpis k
        JOIN strategic_goals g ON k.goal_id = g.id
        WHERE g.plan_id = $1
      `, [plan.id]),
      dbPool.query(`
        SELECT i.* FROM strategic_initiatives i
        JOIN strategic_goals g ON i.goal_id = g.id
        WHERE g.plan_id = $1
      `, [plan.id])
    ]);

    const goals = goalsRes.rows;
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g: any) => parseFloat(g.progress_pct) >= 100).length;
    const atRiskGoals = goals.filter((g: any) => g.status === 'AT_RISK' || g.status === 'DELAYED').length;
    const totalAllocatedBudget = goals.reduce((acc: number, g: any) => acc + (parseFloat(g.allocated_budget_yer) || 0), 0);
    const totalSpentBudget = goals.reduce((acc: number, g: any) => acc + (parseFloat(g.spent_budget_yer) || 0), 0);

    res.json({
      status: 'ok',
      source: 'Neon PostgreSQL Strategic Intelligence Database',
      data: {
        plan,
        goals,
        swot: swotRes.rows,
        kpis: kpisRes.rows,
        initiatives: initiativesRes.rows,
        stats: {
          totalGoals,
          completedGoals,
          atRiskGoals,
          overallProgressPct: parseFloat(plan.overall_progress_pct) || 0,
          totalAllocatedBudget,
          totalSpentBudget,
          executionRatePct: totalAllocatedBudget > 0 ? Math.round((totalSpentBudget / totalAllocatedBudget) * 100) : 0
        }
      }
    });
  } catch (err: any) {
    console.error("Error fetching strategic plan:", err.message);
    res.status(500).json({ status: 'error', message: "Internal Server Error" });
  }
});

// GET /api/investment-summary — Investment & Endowment summary
router.get('/investment-summary', authenticateToken, async (req: any, res) => {
  try {
    const dbPool = getPool();
    const tenantId = req.user?.org_id || '00000000-0000-0000-0000-000000000001';
    const [projectsRes, historyRes, contractsResult, activitiesResult] = await Promise.all([
      dbPool.query(`
        SELECT * FROM investment_projects
        WHERE deleted_at IS NULL AND organization_id = $1
        ORDER BY capital_allocated_yer DESC
      `, [tenantId]),
      dbPool.query(`
        SELECT * FROM investment_returns_history
        WHERE organization_id = $1
        ORDER BY approval_date DESC
      `, [tenantId]),
      dbPool.query(`SELECT * FROM investment_contracts WHERE organization_id = $1 ORDER BY created_at DESC`, [tenantId]).catch((cErr: any) => {
        console.warn("Could not query investment_contracts table:", cErr.message);
        return { rows: [] } as any;
      }),
      dbPool.query(`SELECT * FROM investment_activities WHERE organization_id = $1 ORDER BY planned_date DESC`, [tenantId]).catch((aErr: any) => {
        console.warn("Could not query investment_activities table:", aErr.message);
        return { rows: [] } as any;
      })
    ]);

    let contracts: any[] = contractsResult.rows;
    let activities: any[] = activitiesResult.rows;

    const projects = projectsRes.rows;
    const history = historyRes.rows;

    let totalCapital = 0;
    let totalReturns = 0;
    let totalAnnualProfit = 0;
    let weightedRoiSum = 0;

    projects.forEach((p: any) => {
      const cap = parseFloat(p.capital_allocated_yer) || 0;
      const ret = parseFloat(p.accumulated_returns_yer) || 0;
      const profit = parseFloat(p.net_annual_profit_yer) || 0;
      const roi = parseFloat(p.actual_roi_pct) || 0;

      totalCapital += cap;
      totalReturns += ret;
      totalAnnualProfit += profit;
      weightedRoiSum += (cap * roi);
    });

    const weightedAvgRoi = totalCapital > 0 ? (weightedRoiSum / totalCapital) : 0;

    let totalTransferredToCharity = 0;
    let totalReinvested = 0;

    history.forEach((h: any) => {
      totalTransferredToCharity += parseFloat(h.transferred_to_charity_yer) || 0;
      totalReinvested += parseFloat(h.reinvested_amount_yer) || 0;
    });

    res.json({
      status: 'ok',
      domainCode: 'NEB-15',
      summary: {
        totalProjects: projects.length,
        totalContracts: contracts.length,
        totalActivities: activities.length,
        totalCapitalAllocatedYER: totalCapital,
        totalAccumulatedReturnsYER: totalReturns,
        totalNetAnnualProfitYER: totalAnnualProfit,
        weightedAverageRoiPct: parseFloat(weightedAvgRoi.toFixed(2)),
        totalTransferredToCharityYER: totalTransferredToCharity,
        totalReinvestedYER: totalReinvested,
        endowmentPreservationRatePct: 100.0,
        projects,
        returnsHistory: history,
        contracts,
        activities
      }
    });
  } catch (err: any) {
    console.error("Error in investment summary API:", err.message);
    res.status(500).json({ status: 'error', message: "Internal Server Error" });
  }
});

// POST /api/strategic-goals — Create a new strategic goal
router.post('/strategic-goals', authenticateToken, async (req: any, res) => {
  try {
    const dbPool = getPool();
    const tenantId = req.user?.org_id || '00000000-0000-0000-0000-000000000001';
    const {
      plan_id, goal_code, pillar_code, title_ar, title_en, description_ar, description_en,
      weight_pct, progress_pct, kpi_target, kpi_current, kpi_unit_ar, kpi_unit_en,
      allocated_budget_yer, spent_budget_yer, assigned_owner_role, assigned_owner_name,
      linked_domain, status
    } = req.body;

    if (!plan_id || typeof plan_id !== 'string') {
      return res.status(400).json({ error: 'plan_id is required and must be a string' });
    }
    if (!goal_code || typeof goal_code !== 'string') {
      return res.status(400).json({ error: 'goal_code is required and must be a string' });
    }
    if (!pillar_code || typeof pillar_code !== 'string') {
      return res.status(400).json({ error: 'pillar_code is required and must be a string' });
    }
    if (!title_ar || typeof title_ar !== 'string') {
      return res.status(400).json({ error: 'title_ar is required and must be a string' });
    }
    if (!title_en || typeof title_en !== 'string') {
      return res.status(400).json({ error: 'title_en is required and must be a string' });
    }
    if (kpi_target === undefined || kpi_target === null) {
      return res.status(400).json({ error: 'kpi_target is required' });
    }

    const query = `
      INSERT INTO strategic_goals (
        plan_id, goal_code, pillar_code, title_ar, title_en, description_ar, description_en,
        weight_pct, progress_pct, kpi_target, kpi_current, kpi_unit_ar, kpi_unit_en,
        allocated_budget_yer, spent_budget_yer, assigned_owner_role, assigned_owner_name,
        linked_domain, status, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const result = await dbPool.query(query, [
      plan_id, goal_code, pillar_code, title_ar, title_en, description_ar || null, description_en || null,
      weight_pct || 10, progress_pct || 0, kpi_target, kpi_current || 0, kpi_unit_ar || '%', kpi_unit_en || '%',
      allocated_budget_yer || 0, spent_budget_yer || 0, assigned_owner_role || null, assigned_owner_name || null,
      linked_domain || 'NEB-01', status || 'ON_TRACK', tenantId
    ]);

    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    console.error("Error creating strategic goal:", err.message);
    res.status(500).json({ status: 'error', message: "Internal Server Error" });
  }
});

// PUT /api/strategic-goals/:id — Update a strategic goal
router.put('/strategic-goals/:id', authenticateToken, async (req: any, res) => {
  try {
    const dbPool = getPool();
    const { id } = req.params;
    const tenantId = req.user?.org_id || '00000000-0000-0000-0000-000000000001';
    const { progress_pct, kpi_current, spent_budget_yer, status, title_ar, title_en } = req.body;

    const ownerCheck = await dbPool.query('SELECT organization_id FROM strategic_goals WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Goal not found' });
    }
    if (ownerCheck.rows[0].organization_id !== tenantId) {
      return res.status(403).json({ status: 'error', message: 'Access Denied: Tenant Isolation Violation (IDOR Protection)' });
    }

    const query = `
      UPDATE strategic_goals
      SET progress_pct = COALESCE($1, progress_pct),
          kpi_current = COALESCE($2, kpi_current),
          spent_budget_yer = COALESCE($3, spent_budget_yer),
          status = COALESCE($4, status),
          title_ar = COALESCE($5, title_ar),
          title_en = COALESCE($6, title_en),
          updated_at = NOW()
      WHERE id = $7 AND organization_id = $8
      RETURNING *
    `;

    const result = await dbPool.query(query, [progress_pct, kpi_current, spent_budget_yer, status, title_ar, title_en, id, tenantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Goal not found' });
    }

    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    console.error("Error updating strategic goal:", err.message);
    res.status(500).json({ status: 'error', message: "Internal Server Error" });
  }
});

// POST /api/swot — Add SWOT analysis item
router.post('/swot', authenticateToken, async (req: any, res) => {
  try {
    const dbPool = getPool();
    const tenantId = req.user?.org_id || '00000000-0000-0000-0000-000000000001';
    const { plan_id, category, title_ar, title_en, impact_level, strategic_action_ar, strategic_action_en, linked_goal_code, owner_name } = req.body;

    if (!plan_id || typeof plan_id !== 'string') {
      return res.status(400).json({ error: 'plan_id is required and must be a string' });
    }
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'category is required and must be a string' });
    }
    if (!title_ar || typeof title_ar !== 'string') {
      return res.status(400).json({ error: 'title_ar is required and must be a string' });
    }
    if (!title_en || typeof title_en !== 'string') {
      return res.status(400).json({ error: 'title_en is required and must be a string' });
    }

    const query = `
      INSERT INTO swot_analysis (
        plan_id, category, title_ar, title_en, impact_level, strategic_action_ar, strategic_action_en, linked_goal_code, owner_name, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await dbPool.query(query, [plan_id, category, title_ar, title_en, impact_level || 'HIGH', strategic_action_ar || null, strategic_action_en || null, linked_goal_code || null, owner_name || null, tenantId]);
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err: any) {
    console.error("Error adding SWOT item:", err.message);
    res.status(500).json({ status: 'error', message: "Internal Server Error" });
  }
});

// GET /api/strategic-alignment — Strategic alignment matrix
router.get('/strategic-alignment', authenticateToken, async (req: any, res) => {
  try {
    const dbPool = getPool();
    const tenantId = req.user?.org_id || '00000000-0000-0000-0000-000000000001';
    const alignmentQuery = `
      SELECT
        g.goal_code,
        g.title_ar as goal_title_ar,
        g.title_en as goal_title_en,
        g.linked_domain,
        g.progress_pct as goal_progress,
        g.allocated_budget_yer as goal_budget,
        g.spent_budget_yer as goal_spent,
        (SELECT COUNT(*) FROM programs p WHERE p.deleted_at IS NULL AND p.organization_id = $1) as active_programs_count,
        (SELECT COUNT(*) FROM projects pr WHERE pr.deleted_at IS NULL AND pr.organization_id = $1) as active_projects_count
      FROM strategic_goals g
      WHERE g.deleted_at IS NULL AND g.organization_id = $1
      ORDER BY g.goal_code ASC
    `;

    const result = await dbPool.query(alignmentQuery, [tenantId]);
    res.json({ status: 'ok', source: 'Neon PostgreSQL Strategic Alignment Matrix', data: result.rows });
  } catch (err: any) {
    console.error("Error fetching strategic alignment:", err.message);
    res.status(500).json({ status: 'error', message: "Internal Server Error" });
  }
});

export default router;
