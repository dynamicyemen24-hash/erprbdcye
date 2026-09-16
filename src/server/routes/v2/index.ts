/**
 * NexoraOS™ — V2 API Router (Complete)
 * Aggregates ALL modular engine-based routes for 15 NEB domains
 */

import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';

// V2 Routes
import authRoutes from './auth.routes';
import financeRoutes from './finance.routes';
import projectRoutes from './project.routes';
import procurementRoutes from './procurement.routes';
import serviceDeliveryRoutes from './serviceDelivery.routes';
import reportingRoutes from './reporting.routes';
import strategyRoutes from './strategy.routes';
import domainsRoutes from './domains.routes';
import inventoryRoutes from './inventory.routes';
import revenueRoutes from './revenue.routes';
import expenseRoutes from './expense.routes';
import searchRoutes from './search.routes';
import performanceRoutes from './performance.routes';
import ppmRoutes from './ppm.routes';
import communicationsRoutes from './communications.routes';
import systemRoutes from './system.routes';  // NEW: AI Model Management

const router = Router();

// ─── Public Routes (no auth required) ─────────────────
router.use('/auth', authRoutes);

// ─── Protected Routes (auth required) ──────────────────

// NEB-10: Finance & IPSAS
router.use('/finance', authenticateToken, financeRoutes);

// NEB-04: Project Management
router.use('/projects', authenticateToken, projectRoutes);

// NEB-14: Procurement
router.use('/procurement', authenticateToken, procurementRoutes);

// NEB-06: Service Delivery & Beneficiaries
router.use('/services', authenticateToken, serviceDeliveryRoutes);

// NEB-05/NEB-09: Inventory & Warehouse OS
router.use('/inventory', authenticateToken, inventoryRoutes);

// NEB-15: Unified Revenue OS
router.use('/revenue', authenticateToken, revenueRoutes);

// NEB-10: Unified Expense OS (expense records, categories, petty cash, recurring)
router.use('/expense', authenticateToken, expenseRoutes);

// Reports & Analytics (cross-domain)
router.use('/reports', authenticateToken, reportingRoutes);

// NEB-01: Strategy & Performance
router.use('/strategy', authenticateToken, strategyRoutes);

// All Other Domains: NEB-02,03,05,07,08,09,11,12,13,15
router.use('/domains', authenticateToken, domainsRoutes);

// NEB-12 + NEB-13: Unified Search & Query Engine (cross-domain institutional search)
router.use('/search', authenticateToken, searchRoutes);

// Performance, Diagnostics & Benchmarking (cache, pool, materialized views)
router.use('/performance', authenticateToken, performanceRoutes);

// NEB-02/03/04/05: PPM Intelligence (Critical Path, Scorecard, Portfolio Dashboard)
router.use('/ppm', authenticateToken, ppmRoutes);

// NEB-11: Intelligent Administrative Communications OS
router.use('/communications', authenticateToken, communicationsRoutes);

// AI Model Management (NEB-13)
router.use('/ai', authenticateToken, systemRoutes);  // NEW: Mounted at /api/v2/ai

export default router;
