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

// Reports & Analytics (cross-domain)
router.use('/reports', authenticateToken, reportingRoutes);

// NEB-01: Strategy & Performance
router.use('/strategy', authenticateToken, strategyRoutes);

// All Other Domains: NEB-02,03,05,07,08,09,11,12,13,15
router.use('/domains', authenticateToken, domainsRoutes);

export default router;
