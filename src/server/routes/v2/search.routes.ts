/**
 * NexoraOS™ — Unified Search & Query Engine REST API (NEB-12 + NEB-13)
 * Endpoints:
 *  - POST /api/v2/search              Unified institutional search
 *  - GET  /api/v2/search/suggest      Autocomplete (header search-bar)
 *  - GET  /api/v2/search/facets       Domain-level facets (counts)
 *  - GET  /api/v2/search/facets/dynamic  Per-domain/field aggregations
 *  - POST /api/v2/search/index        Manually index/update one record
 *  - POST /api/v2/search/reindex      Bulk reindex an org
 *  - GET  /api/v2/search/saved        List saved searches
 *  - POST /api/v2/search/saved        Create a saved search
 *  - PUT  /api/v2/search/saved/:id    Update saved search
 *  - DELETE /api/v2/search/saved/:id  Delete saved search
 *  - POST /api/v2/search/saved/:id/touch   Increment use_count
 *  - POST /api/v2/search/click        Record a click-through
 *  - GET  /api/v2/search/analytics    Top queries, slow, zero-hits
 *  - GET  /api/v2/search/stats        Org-wide stats
 *  - GET  /api/v2/search/recommendations  Personalized "for you"
 *  - GET  /api/v2/search/related/:domain/:id   Related records
 *  - GET  /api/v2/search/trending     Trending queries
 */

import { Router, Request, Response } from 'express';
import {
  UnifiedSearchEngine,
  FacetEngine,
  SavedSearchEngine,
  SearchTelemetryEngine,
  SearchIndexEngine,
  RecommendationEngine,
  SearchableDomain
} from '../../engines/search.engine';
import { extractTenantId } from '../../core/helpers';
import { authenticateToken } from '../../middleware/auth.middleware';
import logger from '../../core/logger';

const router = Router();
router.use(authenticateToken);

// Helper to safely extract userId
function userIdOf(req: Request): string {
  return (req as any).user?.id || (req as any).user?.userId || 'system';
}

// ─── 1. Unified Search ───────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const userId = userIdOf(req);
    const result = await UnifiedSearchEngine.search(orgId, {
      query: req.body.query,
      domains: req.body.domains as SearchableDomain[] | undefined,
      filters: req.body.filters,
      fuzzy: req.body.fuzzy,
      threshold: req.body.threshold,
      limit: req.body.limit,
      includeHighlights: req.body.includeHighlights
    });
    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (err: any) {
    logger.error(`[Search] unified error: ${err.message}`, { context: 'search' });
    res.status(500).json({ success: false, error: { code: 'SEARCH_ERROR', message: err.message } });
  }
});

// ─── 2. Suggest (autocomplete) ───────────────────────────
router.get('/suggest', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const q = String(req.query.q || '');
    const limit = Math.min(20, Number(req.query.limit) || 8);
    const hits = await UnifiedSearchEngine.suggest(orgId, q, limit);
    res.json({ success: true, data: hits, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SUGGEST_ERROR', message: err.message } });
  }
});

// ─── 3. Global Facets ────────────────────────────────────
router.get('/facets', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const facets = await FacetEngine.getIndexFacets(orgId);
    res.json({ success: true, data: facets, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'FACETS_ERROR', message: err.message } });
  }
});

// ─── 4. Dynamic Facets (per-domain/field aggregations) ──
router.post('/facets/dynamic', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const requests = (req.body.requests || []) as Array<{ domain: SearchableDomain; field: string; limit?: number; filters?: Record<string, any> }>;
    const facets = await FacetEngine.getFacets(orgId, requests);
    res.json({ success: true, data: facets, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'FACETS_DYN_ERROR', message: err.message } });
  }
});

// ─── 5. Index one record ────────────────────────────────
router.post('/index', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const { domain, recordId, weight } = req.body;
    const out = await SearchIndexEngine.indexRecord(orgId, domain, recordId, weight ?? 0.5);
    res.json({ success: true, data: out, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INDEX_ERROR', message: err.message } });
  }
});

// ─── 6. Bulk Reindex ────────────────────────────────────
router.post('/reindex', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const domains = (req.body.domains as SearchableDomain[] | undefined) || undefined;
    const out = await SearchIndexEngine.reindexOrg(orgId, domains);
    res.json({ success: true, data: out, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'REINDEX_ERROR', message: err.message } });
  }
});

// ─── 7. Saved Searches ──────────────────────────────────
router.get('/saved', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const userId = userIdOf(req);
    const includePublic = req.query.includePublic === 'true';
    const rows = await SavedSearchEngine.list(orgId, userId, { includePublic });
    res.json({ success: true, data: rows, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SAVED_LIST_ERROR', message: err.message } });
  }
});

router.post('/saved', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const userId = userIdOf(req);
    const row = await SavedSearchEngine.create(orgId, userId, req.body);
    res.json({ success: true, data: row, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SAVED_CREATE_ERROR', message: err.message } });
  }
});

router.put('/saved/:id', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const userId = userIdOf(req);
    const row = await SavedSearchEngine.update(orgId, userId, req.params.id, req.body);
    res.json({ success: true, data: row, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SAVED_UPDATE_ERROR', message: err.message } });
  }
});

router.delete('/saved/:id', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const userId = userIdOf(req);
    const ok = await SavedSearchEngine.delete(orgId, userId, req.params.id);
    res.json({ success: true, data: { deleted: ok }, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SAVED_DELETE_ERROR', message: err.message } });
  }
});

router.post('/saved/:id/touch', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    await SavedSearchEngine.touch(orgId, req.params.id);
    res.json({ success: true, data: { touched: true }, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SAVED_TOUCH_ERROR', message: err.message } });
  }
});

// ─── 8. Click Tracking ──────────────────────────────────
router.post('/click', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const userId = userIdOf(req);
    const { query, domain, recordId } = req.body;
    await SearchTelemetryEngine.recordClick(orgId, userId, query, domain, recordId);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'CLICK_ERROR', message: err.message } });
  }
});

// ─── 9. Analytics ───────────────────────────────────────
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const days = Math.min(180, Number(req.query.days) || 30);
    const [top, slow, zeroHits] = await Promise.all([
      SearchTelemetryEngine.topQueries(orgId, days, 20),
      SearchTelemetryEngine.slowQueries(orgId, 500, 10),
      SearchTelemetryEngine.zeroHitQueries(orgId, days, 20)
    ]);
    res.json({ success: true, data: { top, slow, zeroHits, windowDays: days }, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'ANALYTICS_ERROR', message: err.message } });
  }
});

// ─── 10. Org-wide Stats ─────────────────────────────────
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const days = Math.min(180, Number(req.query.days) || 30);
    const stats = await SearchTelemetryEngine.orgStats(orgId, days);
    res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'STATS_ERROR', message: err.message } });
  }
});

// ─── 11. Recommendations ────────────────────────────────
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const userId = userIdOf(req);
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const recs = await RecommendationEngine.forYou(orgId, userId, limit);
    res.json({ success: true, data: recs, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'RECO_ERROR', message: err.message } });
  }
});

// ─── 12. Related Records ────────────────────────────────
router.get('/related/:domain/:id', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const rows = await RecommendationEngine.related(orgId, req.params.domain as SearchableDomain, req.params.id, limit);
    res.json({ success: true, data: rows, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'RELATED_ERROR', message: err.message } });
  }
});

// ─── 13. Trending ───────────────────────────────────────
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const orgId = extractTenantId(req);
    const days = Math.min(60, Number(req.query.days) || 7);
    const limit = Math.min(30, Number(req.query.limit) || 10);
    const rows = await RecommendationEngine.trending(orgId, days, limit);
    res.json({ success: true, data: rows, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'TRENDING_ERROR', message: err.message } });
  }
});

export default router;
