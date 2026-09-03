import express from 'express';
import { SalesRevenueService } from '../services/sales.service';
import { recordAuditLog } from '../services/audit.service';
import { requireFinancePolicy } from '../middleware/policy.middleware';

export const salesRouter = express.Router();

function requireOrganizationId(req: any): string {
  const orgId = req.user?.org_id;
  if (!orgId) throw new Error('Organization context is required');
  return orgId;
}

// GET /api/sales/invoices
salesRouter.get('/invoices', async (req: any, res) => {
  try {
    const orgId = requireOrganizationId(req);
    const status = req.query.status as string;
    const invoices = await SalesRevenueService.getSalesInvoices(orgId, status);
    res.json(invoices);
  } catch (err: any) {
    console.error('Error fetching sales invoices:', err.message);
    res.status(500).json({ error: 'Failed to fetch sales invoices' });
  }
});

// POST /api/sales/invoices
salesRouter.post('/invoices', requireFinancePolicy('CREATE'), async (req: any, res) => {
  try {
    const { amount, description } = req.body;

    if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount is required and must be a positive number' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'description is required and must be a non-empty string' });
    }

    const orgId = requireOrganizationId(req);
    const invoice = await SalesRevenueService.createSalesInvoice({
      ...req.body,
      organizationId: orgId
    });
    res.status(201).json({ status: 'success', data: invoice });
  } catch (err: any) {
    console.error('Error creating sales invoice:', err.message);
    res.status(400).json({ error: 'Failed to create sales invoice' });
  }
});

// POST /api/sales/invoices/:id/pay (Atomic settlement with IPSAS double-entry posting)
salesRouter.post('/invoices/:id/pay', requireFinancePolicy('APPROVE'), async (req: any, res) => {
  try {
    const orgId = requireOrganizationId(req);
    const invoiceId = req.params.id;
    const { paymentGateway } = req.body;
    const result = await SalesRevenueService.paySalesInvoice(invoiceId, paymentGateway, orgId);
    res.json(result);
  } catch (err: any) {
    console.error('Error paying sales invoice:', err.message);
    res.status(400).json({ error: 'Failed to process payment' });
  }
});

// GET /api/sales/summary
salesRouter.get('/summary', async (req: any, res) => {
  try {
    const orgId = requireOrganizationId(req);
    const summary = await SalesRevenueService.getSalesRevenueSummary(orgId);
    res.json(summary);
  } catch (err: any) {
    console.error('Error fetching sales summary:', err.message);
    res.status(500).json({ error: 'Failed to fetch sales summary' });
  }
});

// GET /api/sales/service-points
salesRouter.get('/service-points', async (req: any, res) => {
  try {
    const orgId = requireOrganizationId(req);
    const points = await SalesRevenueService.getServicePoints(orgId);
    res.json(points);
  } catch (err: any) {
    console.error('Error fetching service points:', err.message);
    res.status(500).json({ error: 'Failed to fetch service points' });
  }
});
