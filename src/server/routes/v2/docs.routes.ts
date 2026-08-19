/**
 * NexoraOS™ — API Documentation Generator
 * Auto-generates OpenAPI-compatible documentation from routes
 */

import { Router, Request, Response } from 'express';

const router = Router();

// ─── API Documentation ─────────────────────────────────

const API_DOCS = {
  openapi: '3.0.3',
  info: {
    title: 'NexoraOS™ Enterprise API',
    description: 'Intelligent Enterprise Operating System for Rohamā\'a Baynahum Charity Foundation',
    version: '2.0.0',
    contact: {
      name: 'NexoraOS Support',
      email: 'support@nexoraos.com',
    },
  },
  servers: [
    { url: '/api/v2', description: 'V2 Engine-Based API (Recommended)' },
    { url: '/api', description: 'V1 Legacy API' },
  ],
  paths: {
    // Auth
    '/auth/login': {
      post: { summary: 'Authenticate user', tags: ['Authentication'], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } } } },
    },
    '/auth/register': {
      post: { summary: 'Register new organization', tags: ['Authentication'] },
    },
    '/auth/refresh': {
      post: { summary: 'Refresh access token', tags: ['Authentication'] },
    },
    '/auth/me': {
      get: { summary: 'Get current user', tags: ['Authentication'] },
    },
    // Finance
    '/finance/chart-of-accounts': {
      get: { summary: 'List chart of accounts', tags: ['Finance (NEB-10)'] },
      post: { summary: 'Create account', tags: ['Finance (NEB-10)'] },
    },
    '/finance/transactions': {
      get: { summary: 'List transactions', tags: ['Finance (NEB-10)'] },
      post: { summary: 'Post double-entry voucher', tags: ['Finance (NEB-10)'] },
    },
    '/finance/trial-balance': {
      get: { summary: 'Get trial balance', tags: ['Finance (NEB-10)'] },
    },
    '/finance/balance-sheet': {
      get: { summary: 'Get IPSAS balance sheet', tags: ['Finance (NEB-10)'] },
    },
    '/finance/income-statement': {
      get: { summary: 'Get IPSAS income statement', tags: ['Finance (NEB-10)'] },
    },
    '/finance/fiscal-years': {
      get: { summary: 'List fiscal years', tags: ['Finance (NEB-10)'] },
      post: { summary: 'Create fiscal year', tags: ['Finance (NEB-10)'] },
    },
    '/finance/budgets': {
      get: { summary: 'List budgets', tags: ['Finance (NEB-10)'] },
      post: { summary: 'Create budget line', tags: ['Finance (NEB-10)'] },
    },
    // Projects
    '/projects': {
      get: { summary: 'List projects', tags: ['Projects (NEB-04)'] },
      post: { summary: 'Create project', tags: ['Projects (NEB-04)'] },
    },
    '/projects/dashboard': {
      get: { summary: 'Project dashboard', tags: ['Projects (NEB-04)'] },
    },
    '/projects/{id}/evm': {
      get: { summary: 'Calculate EVM metrics', tags: ['Projects (NEB-04)'] },
    },
    '/projects/{id}/gantt': {
      get: { summary: 'Get Gantt data', tags: ['Projects (NEB-04)'] },
    },
    // Procurement
    '/procurement/rfqs': {
      get: { summary: 'List RFQs', tags: ['Procurement (NEB-14)'] },
      post: { summary: 'Create RFQ', tags: ['Procurement (NEB-14)'] },
    },
    '/procurement/purchase-orders': {
      get: { summary: 'List purchase orders', tags: ['Procurement (NEB-14)'] },
    },
    '/procurement/three-way-match': {
      post: { summary: 'Perform 3-way match', tags: ['Procurement (NEB-14)'] },
    },
    // Services
    '/services/beneficiaries': {
      get: { summary: 'List beneficiaries', tags: ['Service Delivery (NEB-06)'] },
      post: { summary: 'Register beneficiary', tags: ['Service Delivery (NEB-06)'] },
    },
    '/services/service-deliveries': {
      get: { summary: 'List service deliveries', tags: ['Service Delivery (NEB-06)'] },
      post: { summary: 'Record service delivery', tags: ['Service Delivery (NEB-06)'] },
    },
    '/services/aid-distributions': {
      get: { summary: 'List aid distributions', tags: ['Service Delivery (NEB-06)'] },
      post: { summary: 'Record aid distribution', tags: ['Service Delivery (NEB-06)'] },
    },
    '/services/sponsorships': {
      get: { summary: 'List sponsorships', tags: ['Service Delivery (NEB-06)'] },
    },
    // Reports
    '/reports/kpis/consolidated': {
      get: { summary: 'Consolidated KPIs', tags: ['Reporting & Analytics'] },
    },
    '/reports/kpis/strategic': {
      get: { summary: 'Strategic KPIs (NEB-01)', tags: ['Reporting & Analytics'] },
    },
    '/reports/kpis/trends': {
      get: { summary: 'Monthly trends', tags: ['Reporting & Analytics'] },
    },
    '/reports/export/{reportType}': {
      get: { summary: 'Export report', tags: ['Reporting & Analytics'] },
    },
    // Health
    '/health/liveness': {
      get: { summary: 'Liveness probe', tags: ['System'] },
    },
    '/health/readiness': {
      get: { summary: 'Readiness probe', tags: ['System'] },
    },
    '/health/metrics': {
      get: { summary: 'System metrics', tags: ['System'] },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Finance (NEB-10)', description: 'IPSAS-compliant financial management' },
    { name: 'Projects (NEB-04)', description: 'Project lifecycle management with EVM' },
    { name: 'Procurement (NEB-14)', description: 'Procurement and vendor management' },
    { name: 'Service Delivery (NEB-06)', description: 'Beneficiary and service management' },
    { name: 'Reporting & Analytics', description: 'KPI dashboards and report export' },
    { name: 'System', description: 'Health checks and monitoring' },
  ],
};

// Serve OpenAPI JSON
router.get('/openapi.json', (req: Request, res: Response) => {
  res.json(API_DOCS);
});

// Serve simple docs page
router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>NexoraOS™ API Documentation</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #090d16; color: #e4e4e7; }
        h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; }
        h2 { color: #d97706; margin-top: 30px; }
        .endpoint { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 15px; margin: 10px 0; }
        .method { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; margin-left: 8px; }
        .get { background: #059669; color: white; }
        .post { background: #2563eb; color: white; }
        .put { background: #d97706; color: white; }
        .delete { background: #dc2626; color: white; }
        code { background: #27272a; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        a { color: #059669; }
        .tag { display: inline-block; background: #27272a; padding: 4px 12px; border-radius: 12px; margin: 4px; font-size: 13px; }
      </style>
    </head>
    <body>
      <h1>NexoraOS™ API Documentation</h1>
      <p>version: 2.0.0 | <a href="/api/v2/health/liveness">Health Check</a> | <a href="/api/v2/openapi.json">OpenAPI JSON</a></p>
      
      <h2>Authentication</h2>
      <div class="endpoint"><span class="method post">POST</span> <code>/api/v2/auth/login</code> - Login with email/password</div>
      <div class="endpoint"><span class="method post">POST</span> <code>/api/v2/auth/register</code> - Register new organization</div>
      <div class="endpoint"><span class="method post">POST</span> <code>/api/v2/auth/refresh</code> - Refresh access token</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/auth/me</code> - Get current user info</div>

      <h2>Finance (NEB-10) — IPSAS Ledger</h2>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/finance/chart-of-accounts</code> - List accounts</div>
      <div class="endpoint"><span class="method post">POST</span> <code>/api/v2/finance/chart-of-accounts</code> - Create account</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/finance/trial-balance</code> - IPSAS Trial Balance</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/finance/balance-sheet</code> - IPSAS Balance Sheet</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/finance/income-statement</code> - IPSAS Income Statement</div>
      <div class="endpoint"><span class="method post">POST</span> <code>/api/v2/finance/transactions</code> - Post double-entry voucher</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/finance/fiscal-years</code> - List fiscal years</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/finance/budgets</code> - List budgets</div>

      <h2>Projects (NEB-04) — EVM + Gantt</h2>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/projects</code> - List projects</div>
      <div class="endpoint"><span class="method post">POST</span> <code>/api/v2/projects</code> - Create project</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/projects/dashboard</code> - Project dashboard</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/projects/:id/evm</code> - EVM metrics</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/projects/:id/gantt</code> - Gantt chart data</div>

      <h2>Procurement (NEB-14) — RFQs + 3-Way Match</h2>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/procurement/rfqs</code> - List RFQs</div>
      <div class="endpoint"><span class="method post">POST</span> <code>/api/v2/procurement/rfqs</code> - Create RFQ</div>
      <div class="endpoint"><span class="method post">POST</span> <code>/api/v2/procurement/bids</code> - Submit vendor bid</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/procurement/purchase-orders</code> - List POs</div>
      <div class="endpoint"><span class="method post">POST</span> <code>/api/v2/procurement/three-way-match</code> - 3-way match</div>

      <h2>Service Delivery (NEB-06) — Beneficiaries + Aid</h2>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/services/beneficiaries</code> - List beneficiaries</div>
      <div class="endpoint"><span class="method post">POST</span> <code>/api/v2/services/beneficiaries</code> - Register beneficiary</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/services/service-deliveries</code> - List service deliveries</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/services/aid-distributions</code> - List aid distributions</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/services/sponsorships</code> - List sponsorships</div>

      <h2>Reports & Analytics</h2>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/reports/kpis/consolidated</code> - Consolidated KPIs</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/reports/kpis/strategic</code> - Strategic KPIs</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/reports/kpis/trends</code> - Monthly trends</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/reports/export/:type</code> - Export report (pdf/excel)</div>

      <h2>System</h2>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/health/liveness</code> - Liveness probe</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/health/readiness</code> - Readiness probe</div>
      <div class="endpoint"><span class="method get">GET</span> <code>/api/v2/health/metrics</code> - System metrics</div>
    </body>
    </html>
  `);
});

export default router;
