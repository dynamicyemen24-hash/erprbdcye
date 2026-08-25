/**
 * NexoraOS™ — API Documentation Generator
 * Auto-generates OpenAPI 3.0.3 documentation from routes
 */

import { Router, Request, Response } from 'express';

const router = Router();

// ─── OpenAPI 3.0.3 Specification ────────────────────────

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'NexoraOS™ Enterprise API',
    description: 'Intelligent Enterprise Operating System for Rohamā\'a Baynahum Charity Foundation — Complete ERP system API for humanitarian operations management',
    version: '3.0.0',
    contact: {
      name: 'NexoraOS Support',
      email: 'support@nexoraos.com',
    },
  },
  servers: [
    { url: '/api/v2', description: 'V2 Engine-Based API (Recommended)' },
    { url: '/api', description: 'V1 Legacy API' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          requestId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array' },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          version: { type: 'string' },
          uptime: { type: 'number' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    // System
    '/health/liveness': {
      get: { tags: ['System'], summary: 'Liveness probe', security: [], responses: { '200': { description: 'System is alive' } } },
    },
    '/health/readiness': {
      get: { tags: ['System'], summary: 'Readiness probe', security: [], responses: { '200': { description: 'System is ready' } } },
    },
    '/health/metrics': {
      get: { tags: ['System'], summary: 'System metrics', security: [], responses: { '200': { description: 'System metrics' } } },
    },
    // Auth
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new organization',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'organizationName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  organizationName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Registration successful' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Token refreshed' }, '401': { description: 'Invalid refresh token' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user info',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Current user' }, '401': { description: 'Unauthorized' } },
      },
    },
    // Dashboard
    '/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Dashboard stats' }, '401': { description: 'Unauthorized' } },
      },
    },
    // Finance (NEB-10)
    '/finance/chart-of-accounts': {
      get: { tags: ['Finance (NEB-10)'], summary: 'List chart of accounts', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of accounts' } } },
      post: { tags: ['Finance (NEB-10)'], summary: 'Create account', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Account created' } } },
    },
    '/finance/transactions': {
      get: { tags: ['Finance (NEB-10)'], summary: 'List transactions', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of transactions' } } },
      post: { tags: ['Finance (NEB-10)'], summary: 'Post double-entry voucher', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Voucher posted' } } },
    },
    '/finance/trial-balance': {
      get: { tags: ['Finance (NEB-10)'], summary: 'Get IPSAS trial balance', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Trial balance' } } },
    },
    '/finance/balance-sheet': {
      get: { tags: ['Finance (NEB-10)'], summary: 'Get IPSAS balance sheet', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Balance sheet' } } },
    },
    '/finance/income-statement': {
      get: { tags: ['Finance (NEB-10)'], summary: 'Get IPSAS income statement', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Income statement' } } },
    },
    '/finance/fiscal-years': {
      get: { tags: ['Finance (NEB-10)'], summary: 'List fiscal years', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of fiscal years' } } },
      post: { tags: ['Finance (NEB-10)'], summary: 'Create fiscal year', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Fiscal year created' } } },
    },
    '/finance/budgets': {
      get: { tags: ['Finance (NEB-10)'], summary: 'List budgets', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of budgets' } } },
      post: { tags: ['Finance (NEB-10)'], summary: 'Create budget line', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Budget created' } } },
    },
    // Projects (NEB-04)
    '/projects': {
      get: { tags: ['Projects (NEB-04)'], summary: 'List projects', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of projects' } } },
      post: { tags: ['Projects (NEB-04)'], summary: 'Create project', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Project created' } } },
    },
    '/projects/dashboard': {
      get: { tags: ['Projects (NEB-04)'], summary: 'Project dashboard', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Project dashboard data' } } },
    },
    '/projects/{id}/evm': {
      get: {
        tags: ['Projects (NEB-04)'], summary: 'Calculate EVM metrics', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'EVM metrics' }, '404': { description: 'Project not found' } },
      },
    },
    '/projects/{id}/gantt': {
      get: {
        tags: ['Projects (NEB-04)'], summary: 'Get Gantt chart data', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Gantt data' }, '404': { description: 'Project not found' } },
      },
    },
    // Procurement (NEB-14)
    '/procurement/rfqs': {
      get: { tags: ['Procurement (NEB-14)'], summary: 'List RFQs', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of RFQs' } } },
      post: { tags: ['Procurement (NEB-14)'], summary: 'Create RFQ', security: [{ bearerAuth: [] }], responses: { '201': { description: 'RFQ created' } } },
    },
    '/procurement/purchase-orders': {
      get: { tags: ['Procurement (NEB-14)'], summary: 'List purchase orders', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of POs' } } },
    },
    '/procurement/three-way-match': {
      post: { tags: ['Procurement (NEB-14)'], summary: 'Perform 3-way match', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Match result' } } },
    },
    // Service Delivery (NEB-06)
    '/services/beneficiaries': {
      get: { tags: ['Service Delivery (NEB-06)'], summary: 'List beneficiaries', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of beneficiaries' } } },
      post: { tags: ['Service Delivery (NEB-06)'], summary: 'Register beneficiary', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Beneficiary registered' } } },
    },
    '/services/service-deliveries': {
      get: { tags: ['Service Delivery (NEB-06)'], summary: 'List service deliveries', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of deliveries' } } },
      post: { tags: ['Service Delivery (NEB-06)'], summary: 'Record service delivery', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Delivery recorded' } } },
    },
    '/services/aid-distributions': {
      get: { tags: ['Service Delivery (NEB-06)'], summary: 'List aid distributions', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of distributions' } } },
      post: { tags: ['Service Delivery (NEB-06)'], summary: 'Record aid distribution', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Distribution recorded' } } },
    },
    '/services/sponsorships': {
      get: { tags: ['Service Delivery (NEB-06)'], summary: 'List sponsorships', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of sponsorships' } } },
    },
    // Reports & Analytics
    '/reports/kpis/consolidated': {
      get: { tags: ['Reporting & Analytics'], summary: 'Consolidated KPIs', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Consolidated KPI data' } } },
    },
    '/reports/kpis/strategic': {
      get: { tags: ['Reporting & Analytics'], summary: 'Strategic KPIs (NEB-01)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Strategic KPIs' } } },
    },
    '/reports/kpis/trends': {
      get: { tags: ['Reporting & Analytics'], summary: 'Monthly trends', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Trend data' } } },
    },
    '/reports/export/{reportType}': {
      get: {
        tags: ['Reporting & Analytics'], summary: 'Export report (pdf/excel)', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'reportType', in: 'path', required: true, schema: { type: 'string', enum: ['pdf', 'excel'] } }],
        responses: { '200': { description: 'Report file' } },
      },
    },
  },
  tags: [
    { name: 'System', description: 'Health checks and monitoring' },
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Dashboard', description: 'Analytics and reporting dashboard' },
    { name: 'Finance (NEB-10)', description: 'IPSAS-compliant financial management' },
    { name: 'Projects (NEB-04)', description: 'Project lifecycle management with EVM' },
    { name: 'Procurement (NEB-14)', description: 'Procurement and vendor management' },
    { name: 'Service Delivery (NEB-06)', description: 'Beneficiary and service management' },
    { name: 'Reporting & Analytics', description: 'KPI dashboards and report export' },
  ],
};

// Serve OpenAPI JSON
router.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// Serve interactive API docs (Swagger UI)
router.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NexoraOS™ API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; background: #090d16; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { font-family: 'Segoe UI', Tahoma, sans-serif; color: #059669; }
    .swagger-ui .scheme-container { background: #18181b; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/v2/docs/openapi.json',
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: 'BaseLayout',
      deepLinking: true,
      filter: true,
      showExtensions: true,
    });
  </script>
</body>
</html>
  `);
});

export default router;
