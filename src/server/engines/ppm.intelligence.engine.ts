/**
 * NexoraOS™ — NEB-02/03/04/05: PPM Intelligence Engine
 * World-standard Portfolio/Program/Project intelligence grounded in the live DB.
 *
 * Delivers:
 *  - Critical Path Method (CPM) via dependency_network + project_schedules
 *    (Oracle Primavera P6 / MS Project paradigm: forward/backward pass, slack, ES/EF/LS/LF)
 *  - Portfolio scorecard & prioritization (SAP Strategy Management / Balanced Scorecard)
 *  - Cross-project risk aggregation and executive alerts
 *
 * All queries run against the real Neon PostgreSQL tables/views.
 */

import { getPool } from '../core/database';
import logger from '../core/logger';

// ─── Critical Path Method (CPM) ─────────────────────────

export interface CPMTask {
  id: string;
  name: string;
  name_en?: string | null;
  type: 'schedule' | 'milestone' | 'task';
  wbs_code?: string | null;
  start_date: string | null;
  end_date: string | null;
  duration_days: number;
  progress_percent: number;
  is_critical: boolean;
  is_milestone: boolean;
  predecessors: string[];
  successors: string[];
  // CPM computed
  es: number | null; // Earliest Start
  ef: number | null; // Earliest Finish
  ls: number | null; // Latest Start
  lf: number | null; // Latest Finish
  slack: number | null; // Total float (days)
}

export interface CPMResult {
  projectId: string;
  projectName: string;
  isCyclic: boolean;
  cyclePath?: string[];
  /** True when no explicit dependency_network edges exist and a nominal
   *  Finish-to-Start chain was derived from the project's real schedule order. */
  derivedChain?: boolean;
  network: CPMTask[];
  criticalPath: string[]; // node ids in sequence
  criticalPathLengthDays: number;
  totalFloatDays: number;
}

export class CPMEngine {
  /**
   * Compute the Critical Path for a project from its schedule network.
   * Uses dependency_network edges + project_schedules nodes (real tables).
   */
  static async compute(projectId: string): Promise<CPMResult> {
    const pool = getPool();

    const [projectRows, scheduleRows, dependencyRows, milestoneRows] = await Promise.all([
      pool.query(`SELECT id, name_ar, name_en, project_code FROM projects WHERE id = $1 AND deleted_at IS NULL`, [projectId]),
      pool.query(
        `SELECT id, task_name_ar, task_name_en, wbs_code, start_date, end_date,
                COALESCE(duration_days, 0) AS duration_days,
                COALESCE(progress_percent, 0) AS progress_percent,
                COALESCE(is_critical, false) AS is_critical,
                COALESCE(is_milestone, false) AS is_milestone
         FROM project_schedules
         WHERE project_id = $1 AND deleted_at IS NULL`,
        [projectId]
      ),
      pool.query(
        `SELECT predecessor_id, successor_id, COALESCE(lag_days, 0) AS lag_days
         FROM dependency_network
         WHERE project_id = $1`,
        [projectId]
      ),
      pool.query(
        `SELECT id, COALESCE(milestone_name_ar, milestone_name_en) AS name,
                COALESCE(milestone_name_en, milestone_name_ar) AS name_en,
                wbs_code, planned_date, planned_date AS end_date,
                COALESCE(progress_percent, CASE WHEN status_code='COMPLETED' THEN 100 ELSE 0 END) AS progress_percent,
                COALESCE(is_key_milestone, false) AS is_critical
         FROM milestones
         WHERE project_id = $1 AND deleted_at IS NULL`,
        [projectId]
      ),
    ]);

    const project = projectRows.rows[0];
    if (!project) throw new Error('Project not found');

    // Build node map: schedules first, then milestones (zero-duration milestones).
    const nodes = new Map<string, CPMTask>();
    for (const r of scheduleRows.rows) {
      nodes.set(r.id, {
        id: r.id,
        name: r.task_name_ar || r.task_name_en || r.id,
        name_en: r.task_name_en,
        type: 'schedule',
        wbs_code: r.wbs_code,
        start_date: r.start_date,
        end_date: r.end_date,
        duration_days: Number(r.duration_days || 0),
        progress_percent: Number(r.progress_percent || 0),
        is_critical: Boolean(r.is_critical),
        is_milestone: Boolean(r.is_milestone),
        predecessors: [],
        successors: [],
        es: null, ef: null, ls: null, lf: null, slack: null,
      });
    }
    for (const r of milestoneRows.rows) {
      if (!nodes.has(r.id)) {
        nodes.set(r.id, {
          id: r.id,
          name: r.name || r.id,
          name_en: r.name_en,
          type: 'milestone',
          wbs_code: r.wbs_code,
          start_date: r.planned_date,
          end_date: r.end_date,
          duration_days: 0,
          progress_percent: Number(r.progress_percent || 0),
          is_critical: Boolean(r.is_critical) || true,
          is_milestone: true,
          predecessors: [],
          successors: [],
          es: null, ef: null, ls: null, lf: null, slack: null,
        });
      }
    }

    // Build validated edge list from dependency_network. Unknown endpoints are ignored.
    const edges: { pred: string; succ: string; lag: number }[] = [];
    for (const r of dependencyRows.rows) {
      if (!nodes.has(r.predecessor_id) || !nodes.has(r.successor_id)) continue;
      edges.push({ pred: r.predecessor_id, succ: r.successor_id, lag: Number(r.lag_days || 0) });
    }

    // Transparent fallback: when a project has NO explicit dependencies but
    // several real scheduled activities, derive a nominal Finish-to-Start chain
    // from the schedule order (start_date, then WBS code). No fabricated rows
    // are persisted — the derived flag tells clients this is a schedule-order
    // default until real edges are created via rebuildFromSchedules.
    let derivedChain = false;
    if (edges.length === 0) {
      const ordered = scheduleRows.rows
        .slice()
        .sort((a: any, b: any) => {
          const da = a.start_date ? new Date(a.start_date).getTime() : 0;
          const db = b.start_date ? new Date(b.start_date).getTime() : 0;
          return (da - db) || String(a.wbs_code || '').localeCompare(String(b.wbs_code || ''));
        })
        .map((r: any) => r.id);
      if (ordered.length > 1) {
        for (let i = 0; i < ordered.length - 1; i++) {
          edges.push({ pred: ordered[i], succ: ordered[i + 1], lag: 0 });
        }
        derivedChain = true;
      }
    }

    // Build adjacency + predecessor/successor lists from the validated edges.
    const adjacency = new Map<string, { pred: string; succ: string; lag: number }[]>();
    for (const e of edges) {
      const list = adjacency.get(e.pred) || [];
      list.push(e);
      adjacency.set(e.pred, list);
      nodes.get(e.succ)!.predecessors.push(e.pred);
      nodes.get(e.pred)!.successors.push(e.succ);
    }

    const nodeIds = Array.from(nodes.keys());

    // Cycle detection via DFS (coloring). If cyclic, return early with cycle info.
    const color = new Map<string, number>(); // 0 white, 1 gray, 2 black
    const stack: string[] = [];
    const inCycle: string[] = [];
    let cyclic = false;

    const visit = (u: string) => {
      if (cyclic) return;
      color.set(u, 1); stack.push(u);
      for (const e of adjacency.get(u) || []) {
        const v = e.succ;
        const c = color.get(v) ?? 0;
        if (c === 0) visit(v);
        else if (c === 1) {
          cyclic = true;
          const idx = stack.indexOf(v);
          inCycle.push(...stack.slice(idx), v);
        }
      }
      color.set(u, 2); stack.pop();
    };
    for (const n of nodeIds) if ((color.get(n) ?? 0) === 0) visit(n);

    if (cyclic) {
      return {
        projectId,
        projectName: project.name_ar || project.name_en || project.id,
        isCyclic: true,
        cyclePath: Array.from(new Set(inCycle)),
        network: Array.from(nodes.values()),
        criticalPath: [],
        criticalPathLengthDays: 0,
        totalFloatDays: 0,
      };
    }

    // --- Forward Pass: compute ES/EF ---
    const inDegree = new Map<string, number>();
    for (const n of nodeIds) inDegree.set(n, nodes.get(n)!.predecessors.length);
    const q: string[] = nodeIds.filter((n) => inDegree.get(n) === 0);
    const topo: string[] = [];
    while (q.length) {
      const u = q.shift()!;
      topo.push(u);
      for (const e of adjacency.get(u) || []) {
        const v = e.succ;
        inDegree.set(v, (inDegree.get(v) ?? 1) - 1);
        if (inDegree.get(v) === 0) q.push(v);
      }
    }

    for (const u of topo) {
      const node = nodes.get(u)!;
      // Predecessors of u from the validated edge list
      const predEdges = edges.filter((e) => e.succ === u);
      let es = 0;
      for (const e of predEdges) {
        const pd = nodes.get(e.pred)!;
        es = Math.max(es, (pd.ef ?? 0) + e.lag);
      }
      node.es = es;
      node.ef = es + node.duration_days;
    }

    const finishTimes = nodeIds.map((n) => nodes.get(n)!.ef ?? 0);
    const projectEnd = Math.max(0, ...finishTimes);

    // --- Backward Pass: compute LF/LS ---
    for (const u of [...topo].reverse()) {
      const node = nodes.get(u)!;
      const succEdges = edges.filter((e) => e.pred === u);
      let lf = projectEnd;
      if (succEdges.length > 0) {
        let minLs = Infinity;
        for (const e of succEdges) {
          const sd = nodes.get(e.succ)!;
          minLs = Math.min(minLs, (sd.ls ?? projectEnd) - e.lag);
        }
        lf = minLs === Infinity ? projectEnd : minLs;
      }
      node.lf = lf;
      node.ls = lf - node.duration_days;
      node.slack = node.ls - node.es;
    }

    // --- Derive critical path: nodes with slack === 0 (smallest float) ---
    const minSlack = Math.min(...nodeIds.map((n) => nodes.get(n)!.slack ?? 0));
    const critical = new Set<string>();
    for (const n of nodeIds) if ((nodes.get(n)!.slack ?? 0) <= minSlack + 0.001) critical.add(n);

    const criticalPath: string[] = [];
    const visitedCP = new Set<string>();
    const buildPath = (u: string): boolean => {
      if (!critical.has(u) || visitedCP.has(u)) return false;
      visitedCP.add(u);
      criticalPath.push(u);
      const succs = nodes.get(u)!.successors.filter((s) => critical.has(s));
      if (succs.length === 0) return true;
      for (const s of succs) if (buildPath(s)) return true;
      criticalPath.pop();
      return false;
    };
    const starts = nodeIds.filter((n) => nodes.get(n)!.predecessors.length === 0 && critical.has(n));
    for (const s of starts) buildPath(s);

    // Mark tasks on critical path + task-level float
    const criticalSet = new Set(criticalPath);
    for (const n of nodes.values()) {
      n.is_critical = criticalSet.has(n.id) || n.is_critical;
    }

    return {
      projectId,
      projectName: project.name_ar || project.name_en || project.id,
      isCyclic: false,
      derivedChain,
      network: Array.from(nodes.values()),
      criticalPath,
      criticalPathLengthDays: projectEnd,
      totalFloatDays: minSlack,
    };
  }

  /**
   * Rebuild the dependency_network for a project from the predecessor_ids
   * already stored on project_schedules (idempotent, removes stale edges
   * for that project then re-inserts). Safe to run repeatedly.
   */
  static async rebuildFromSchedules(projectId: string, organizationId: string): Promise<{ created: number }> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear stale edges for this project
      await client.query(`DELETE FROM dependency_network WHERE project_id = $1`, [projectId]);

      // Parse predecessor_ids (comma or JSON-array separated UUIDs) -> edges
      const scheds = await client.query(
        `SELECT id, predecessor_ids, successor_ids FROM project_schedules
         WHERE project_id = $1 AND deleted_at IS NULL`,
        [projectId]
      );
      const edges = new Set<string>();
      for (const s of scheds.rows) {
        const preds = CPMEngine.parseIdList(s.predecessor_ids);
        for (const p of preds) edges.add(`${p}|${s.id}|0|FS`);
        const succs = CPMEngine.parseIdList(s.successor_ids);
        for (const sc of succs) edges.add(`${s.id}|${sc}|0|FS`);
      }
      if (edges.size > 0) {
        const values: any[] = [];
        const placeholders: string[] = [];
        let idx = 1;
        for (const e of edges) {
          const [pred, succ, lag, type] = e.split('|');
          placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
          values.push(projectId, organizationId, pred, succ, type, Number(lag));
        }
        await client.query(
          `INSERT INTO dependency_network (project_id, organization_id, predecessor_id, successor_id, dependency_type, lag_days)
           VALUES ${placeholders.join(', ')}`,
          values
        );
      }
      await client.query('COMMIT');
      return { created: edges.size };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  private static parseIdList(v: unknown): string[] {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
    const s = String(v);
    if (s.startsWith('[')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.filter((x) => typeof x === 'string');
      } catch { /* fallthrough */ }
    }
    return s.split(',').map((x) => x.trim()).filter(Boolean);
  }
}

// ─── Portfolio Scorecard & Prioritization ──────────────

export interface ScorecardDimension {
  dimension: string;
  weight: number;
  score: number; // 0-100
  detail: Record<string, number | string>;
}

export interface PortfolioScorecard {
  projectId: string;
  projectName: string;
  totalScore: number; // weighted 0-100
  rating: string;
  dimensions: ScorecardDimension[];
}

export class PortfolioScorecardEngine {
  /**
   * Compute a multi-dimensional, weighted health/strategic scorecard for a
   * project (SAP Strategy Management / BSC-inspired): Finance, Beneficiary,
   * Delivery, Risk. Grounded in real projects/activities/earned_value_metrics.
   */
  static async scoreProject(projectId: string): Promise<PortfolioScorecard> {
    const pool = getPool();

    const [pRows, evmRows, actRows] = await Promise.all([
      pool.query(`SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL`, [projectId]),
      pool.query(
        `SELECT * FROM earned_value_metrics WHERE project_id = $1
         ORDER BY measurement_date DESC, created_at DESC LIMIT 1`,
        [projectId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(budget),0) AS budget, COALESCE(SUM(actual_cost),0) AS spent,
                COALESCE(SUM(target_beneficiaries),0) AS target, COALESCE(SUM(actual_beneficiaries),0) AS actual,
                COUNT(*) AS total, COUNT(*) FILTER (WHERE status_code='COMPLETED') AS completed
         FROM activities WHERE project_id = $1 AND deleted_at IS NULL`,
        [projectId]
      ),
    ]);
    const p = pRows.rows[0];
    if (!p) throw new Error('Project not found');
    const evm = evmRows.rows[0] || {};
    const act = actRows.rows[0] || {};

    // ── Dimension 1: Financial (40%) ──
    const budget = Number(p.budget || 0);
    const spent = Number(p.spent_amount || 0);
    const cpi = evm.cost_performance_index != null ? Number(evm.cost_performance_index) : (spent > 0 ? budget * (Number(p.progress_percent||0)/100) / spent : 1);
    const finScore = Math.max(0, Math.min(100, (cpi >= 0.95 ? 100 : cpi >= 0.9 ? 75 : cpi >= 0.8 ? 50 : cpi >= 0.6 ? 25 : 0)) + ((spent <= budget ? 20 : 0)));

    // ── Dimension 2: Beneficiary Impact (25%) ──
    const targetB = Number(act.target || p.target_beneficiaries || 0);
    const actualB = Number(act.actual || p.actual_beneficiaries || 0);
    const benPct = targetB > 0 ? (actualB / targetB) * 100 : 100;
    const benScore = Math.max(0, Math.min(100, benPct));

    // ── Dimension 3: Delivery / Progress (20%) ──
    const progress = Number(p.progress_percent || 0);
    const scheduleHealth = evm.schedule_performance_index != null ? Number(evm.schedule_performance_index) : 1;
    const delScore = Math.max(0, Math.min(100, (progress * 0.7) + (scheduleHealth >= 1 ? 30 : scheduleHealth * 30)));

    // ── Dimension 4: Risk (15%) ──
    const riskOffset = ['CRITICAL','HIGH'].includes(String(p.risk_level || p.risk_rating || 'LOW').toUpperCase()) ? 30 : 0;
    const riskScore = Math.max(0, Math.min(100, 100 - riskOffset));

    const dimensions: ScorecardDimension[] = [
      { dimension: 'financial', weight: 0.40, score: Math.round(finScore), detail: { cpi: Math.round(cpi*100)/100, budget, spent } },
      { dimension: 'beneficiary', weight: 0.25, score: Math.round(benScore), detail: { target: targetB, actual: actualB, achievementPct: Math.round(benPct) } },
      { dimension: 'delivery', weight: 0.20, score: Math.round(delScore), detail: { progress, spi: Math.round(scheduleHealth*100)/100 } },
      { dimension: 'risk', weight: 0.15, score: Math.round(riskScore), detail: { riskLevel: String(p.risk_level || p.risk_rating || 'LOW') } },
    ];

    const totalScore = Math.round(dimensions.reduce((s, d) => s + d.score * d.weight, 0));
    const rating = totalScore >= 80 ? 'EXCELLENT' : totalScore >= 65 ? 'GOOD' : totalScore >= 50 ? 'FAIR' : 'CRITICAL';

    return {
      projectId,
      projectName: p.name_ar || p.name_en || p.project_code || p.id,
      totalScore,
      rating,
      dimensions,
    };
  }

  /**
   * Rank the whole portfolio by weighted score (uses ProjectEngine*.list fields
   * opportunistically). Grounded in the real v_project_risk_analysis view.
   */
  static async rankPortfolio(orgId: string): Promise<{ rankings: PortfolioScorecard[]; summary: any }> {
    const pool = getPool();
    const proj = await pool.query(
      `SELECT id, name_ar, name_en, project_code, budget, spent_amount, progress_percent,
              risk_level, risk_rating, program_id
       FROM projects WHERE organization_id = $1 AND deleted_at IS NULL`,
      [orgId]
    );

    const rankings: PortfolioScorecard[] = [];
    // Compute scores sequentially but cheaply (single project per query round).
    // For real workloads consider a shared ranked view; here we reuse scoreProject.
    for (const row of proj.rows) {
      try {
        rankings.push(await PortfolioScorecardEngine.scoreProject(row.id));
      } catch (e: any) {
        logger.warn(`[Scorecard] failed to score project ${row.id}: ${e.message}`, { context: 'scorecard' });
      }
    }
    rankings.sort((a, b) => b.totalScore - a.totalScore);

    const shape = rankings.reduce(
      (acc, r) => {
        acc.excellent += r.rating === 'EXCELLENT' ? 1 : 0;
        acc.good += r.rating === 'GOOD' ? 1 : 0;
        acc.fair += r.rating === 'FAIR' ? 1 : 0;
        acc.critical += r.rating === 'CRITICAL' ? 1 : 0;
        return acc;
      },
      { excellent: 0, good: 0, fair: 0, critical: 0 }
    );

    return {
      rankings,
      summary: {
        total: rankings.length,
        ...shape,
        averageScore: rankings.length
          ? Math.round(rankings.reduce((s, r) => s + r.totalScore, 0) / rankings.length)
          : 0,
      },
    };
  }
}

// ─── Portfolio Overview from real views ────────────────

export class PortfolioDashboardEngine {
  /**
   * Consolidated portfolio overview backed by the real materialized-style views.
   */
  static async overview(orgId: string) {
    const pool = getPool();
    const [progView, projView, riskView] = await Promise.all([
      pool.query(`SELECT * FROM v_program_dashboard WHERE organization_id = $1`, [orgId]).catch(() => ({ rows: [] })),
      pool.query(`SELECT * FROM v_project_dashboard WHERE organization_id = $1`, [orgId]).catch(() => ({ rows: [] })),
      pool.query(`SELECT * FROM v_project_risk_analysis WHERE organization_id = $1`, [orgId]).catch(() => ({ rows: [] })),
    ]);

    const programs = progView.rows;
    const projects = projView.rows;
    const risks = riskView.rows;

    // Only genuinely at-risk projects (high/critical) count — not every project.
    const AT_RISK_SET = new Set(['مرتفع','حرج','high','critical','HIGH','CRITICAL']);
    const atRiskProjects = risks.filter(
      (r: any) =>
        AT_RISK_SET.has(String(r.risk_level || '').trim()) ||
        AT_RISK_SET.has(String(r.risk_rating || '').trim())
    ).length;

    return {
      programs,
      projects,
      risks,
      summary: {
        totalPrograms: programs.length,
        totalProjects: projects.length,
        atRiskProjects,
        totalBudget: programs.reduce((s, p: any) => s + Number(p.budget || p.total_budget || 0), 0),
        avgProgress: projects.length
          ? Math.round(projects.reduce((s, p: any) => s + Number(p.progress_percent || 0), 0) / projects.length)
          : 0,
      },
    };
  }
}
