/**
 * NexoraOS™ — OpenAPI 3.0 Specification
 * UAMEX ERP™ Intelligent Enterprise Operating System API Documentation
 *
 * @openapi
 * info.title: UAMEX ERP™ API
 * info.version: 3.8.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const openapiSpec: Record<string, any> = {
  openapi: '3.0.3',
  info: {
    title: 'UAMEX ERP™ API',
    description:
      'UAMEX ERP™ Intelligent Enterprise Operating System (نظام يو امكس المؤسسي الشامل).\n' +
      'Enterprise-grade REST API covering 15 integrated NEB domains for humanitarian & development organizations.\n\n' +
      '## Authentication\n' +
      'All protected endpoints require a **Bearer JWT** token in the `Authorization` header.\n\n' +
      '## Multi-Tenancy\n' +
      'Every request is scoped to the authenticated user\'s organization via `org_id` claim in the JWT.\n\n' +
      '## Rate Limiting\n' +
      'Auth endpoints: 5 requests per 15-minute window.\n\n' +
      '## Offline-First Sync\n' +
      'The system supports offline batch synchronization via `/api/sync/offline-batch`.',
    version: '3.8.0',
    contact: {
      name: 'Rohamā\'a Baynahum Charity Foundation — IT Department',
      email: 'dev@rohamaab.org',
      url: 'https://rohamaab.org',
    },
    license: {
      name: 'Proprietary — UAMEX ERP™',
      url: 'https://uamex.io/license',
    },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
    { url: 'https://staging-uamex.rohamaab.org', description: 'Staging' },
    { url: 'https://api.uamex.io', description: 'Production' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication, registration & token management' },
    { name: 'Session', description: 'Session lifecycle & revocation' },
    { name: 'Tables', description: 'Dynamic CRUD for whitelisted database tables' },
    { name: 'Schema', description: 'Table schema metadata for dynamic UI forms' },
    { name: 'Dashboard', description: 'High-level dashboard stats & predictive analytics' },
    { name: 'Reporting', description: 'Enterprise report execution & DB views' },
    { name: 'Strategy', description: 'Strategic plans, goals, KPIs & SWOT (NEB-01)' },
    { name: 'Projects', description: 'Project management, milestones, EVM & Gantt (NEB-04)' },
    { name: 'PPM', description: 'Portfolio & Program Management — CPM, scorecards (NEB-02/03)' },
    { name: 'Finance', description: 'IPSAS ledger, trial balance, journal entries (NEB-10)' },
    { name: 'Procurement', description: 'RFQ, purchase orders & 3-way match (NEB-14)' },
    { name: 'Revenue', description: 'Donations, invoicing & collections (NEB-15)' },
    { name: 'Expense', description: 'Expense records, categories & petty cash' },
    { name: 'Service Delivery', description: 'Beneficiaries & service delivery (NEB-06)' },
    { name: 'Inventory', description: 'Assets, warehouses & stock management (NEB-09)' },
    { name: 'Communications', description: 'Official communications lifecycle (NEB-11)' },
    { name: 'Domains', description: 'Cross-domain operations (NEB-07, NEB-08, NEB-11, etc.)' },
    { name: 'Backup', description: 'Database backup, restore & disaster recovery' },
    { name: 'AI', description: 'Gemini AI — chat, receipt parsing & projections' },
    { name: 'Integration', description: 'SMS, email, Zakat calculator & offline sync' },
    { name: 'Search', description: 'Unified search, facets, recommendations & analytics (NEB-12/13)' },
    { name: 'RBAC', description: 'Role-based access control matrix & password reset' },
    { name: 'Performance', description: 'Diagnostics, cache & benchmarking' },
    { name: 'Health', description: 'Health checks, liveness & readiness probes' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token obtained from `/api/auth/login` or `/api/v2/auth/login`',
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@rohamaab.org' },
          password: { type: 'string', format: 'password', example: 'S3cur3P@ss!' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          token: { type: 'string', description: 'JWT access token' },
          refreshToken: { type: 'string', description: 'JWT refresh token (rotation)' },
          user: { $ref: '#/components/schemas/UserSession' },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['org_name_ar', 'admin_email', 'admin_password'],
        properties: {
          org_name_ar: { type: 'string', example: 'جمعية رُحماء بينهم' },
          org_name_en: { type: 'string', example: 'Rohamaab Foundation' },
          admin_email: { type: 'string', format: 'email' },
          admin_name: { type: 'string' },
          admin_password: { type: 'string', format: 'password', minLength: 8 },
          type_code: { type: 'string', default: 'charity' },
          subscription_plan: { type: 'string', default: 'enterprise' },
          phone: { type: 'string', default: '+967-770000000' },
          city: { type: 'string', default: 'صنعاء' },
          country: { type: 'string', default: 'اليمن' },
        },
      },
      UserSession: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          name_ar: { type: 'string' },
          name_en: { type: 'string' },
          role: { type: 'string' },
          department_code: { type: 'string' },
          position_code: { type: 'string' },
          security_level: { type: 'integer', minimum: 1, maximum: 5 },
          can_approve: { type: 'boolean' },
          max_approval_amount: { type: 'string' },
          branch_code: { type: 'string' },
          organization_id: { type: 'string', format: 'uuid' },
          organization_name: { type: 'string' },
          organization_code: { type: 'string' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { type: 'object' } },
          pagination: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 100 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 1 },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      PolicyViolationResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Policy Violation' },
          message: { type: 'string' },
          messageAr: { type: 'string' },
          violations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                severity: { type: 'string', enum: ['BLOCK', 'WARN', 'INFO'] },
                messageAr: { type: 'string' },
                messageEn: { type: 'string' },
                policyKey: { type: 'string' },
                limit: { type: 'number' },
                currentValue: { type: 'number' },
              },
            },
          },
          environmentMode: { type: 'string' },
        },
      },
      BackupItem: {
        type: 'object',
        properties: {
          filename: { type: 'string', example: 'backup_2026-09-07T12-00-00-000Z_a1b2c3d4.json' },
          size: { type: 'integer', description: 'File size in bytes' },
          timestamp: { type: 'string', format: 'date-time' },
          exportedBy: { type: 'string' },
          tableCount: { type: 'integer' },
          totalRecords: { type: 'integer' },
          downloadUrl: { type: 'string' },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          counts: {
            type: 'object',
            properties: {
              organizations: { type: 'integer' },
              programs: { type: 'integer' },
              projects: { type: 'integer' },
              users: { type: 'integer' },
              currencies: { type: 'integer' },
              beneficiaries: { type: 'integer' },
              sponsorships: { type: 'integer' },
              commitments: { type: 'integer' },
              obligations: { type: 'integer' },
            },
          },
          financials: {
            type: 'object',
            properties: {
              totalProgramBudget: { type: 'number' },
              totalDonations: { type: 'number' },
              totalExpenses: { type: 'number' },
              netPosition: { type: 'number' },
            },
          },
          executive: { type: 'object', nullable: true },
          statisticalSummary: { type: 'array', items: { type: 'object' } },
          recentPrograms: { type: 'array', items: { type: 'object' } },
          recentProjects: { type: 'array', items: { type: 'object' } },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          time: { type: 'string', format: 'date-time' },
          database: { type: 'string', example: 'connected' },
          uptime: { type: 'integer' },
          memoryMB: { type: 'integer' },
          poolMetrics: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              idle: { type: 'integer' },
              waiting: { type: 'integer' },
            },
          },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    // ─────────────────────────────────────────────
    // AUTH — /api/auth (legacy mount) & /api/v2/auth
    // ─────────────────────────────────────────────
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email & password',
        description: 'Authenticate user via Neon PostgreSQL. Returns JWT access + refresh tokens. Includes offline fallback for development.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          '400': { description: 'Missing email or password' },
          '401': { description: 'Invalid credentials' },
          '503': { description: 'Database unavailable — offline mode' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Self-register organization & admin user',
        description: 'Creates a new organization (tenant) and its administrator account. Rate-limited to 5 requests per 15 minutes.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          '200': { description: 'Registration successful' },
          '400': { description: 'Validation error or email already registered' },
          '429': { description: 'Too many registration attempts' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token (rotation)',
        description: 'Exchange a valid refresh token for a new access + refresh token pair. Old refresh token is invalidated.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } },
        },
        responses: {
          '200': { description: 'Token refreshed' },
          '403': { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Session'],
        summary: 'Logout — revoke current session',
        description: 'Invalidates the current JWT token and session. CSRF-safe (POST only).',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out successfully' },
          '500': { description: 'Logout failed' },
        },
      },
    },
    '/api/auth/logout-all': {
      post: {
        tags: ['Session'],
        summary: 'Logout from all devices',
        description: 'Revokes ALL tokens and sessions for the authenticated user.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'All sessions revoked' },
          '401': { description: 'Unable to identify user' },
        },
      },
    },
    '/api/auth/sessions': {
      get: {
        tags: ['Session'],
        summary: 'List active sessions',
        description: 'Returns all active sessions for the current user (IP, browser, device, timestamps).',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Session list returned' },
          '401': { description: 'Authentication required' },
        },
      },
    },
    '/api/auth/revoke-session': {
      post: {
        tags: ['Session'],
        summary: 'Revoke a specific session',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sessionId'],
                properties: { sessionId: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Session revoked' },
          '404': { description: 'Session not found' },
        },
      },
    },
    '/api/v2/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login (V2 engine-based)',
        description: 'V2 engine-based login endpoint with full audit logging.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    // ─────────────────────────────────────────────
    // TABLES — Dynamic CRUD
    // ─────────────────────────────────────────────
    '/api/tables/{table}': {
      get: {
        tags: ['Tables'],
        summary: 'List records (tenant-scoped, paginated)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'table', in: 'path', required: true, schema: { type: 'string' }, description: 'Whitelisted table name' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100, maximum: 500 } },
        ],
        responses: {
          '200': { description: 'Paginated records', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
          '403': { description: 'Table not whitelisted' },
        },
      },
      post: {
        tags: ['Tables'],
        summary: 'Insert a new record (tenant-bound)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'table', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '201': { description: 'Record created' },
          '400': { description: 'Validation failed' },
          '403': { description: 'Access denied or policy violation' },
        },
      },
    },
    '/api/tables/{table}/{id}': {
      put: {
        tags: ['Tables'],
        summary: 'Update a record (IDOR-protected)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'table', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '200': { description: 'Record updated' },
          '403': { description: 'IDOR violation or policy violation' },
          '404': { description: 'Record not found' },
        },
      },
      delete: {
        tags: ['Tables'],
        summary: 'Soft/hard delete a record (IDOR-protected)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'table', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Record deleted' },
          '403': { description: 'IDOR violation or insufficient security level' },
          '404': { description: 'Record not found' },
        },
      },
    },
    '/api/schema/{table}': {
      get: {
        tags: ['Schema'],
        summary: 'Get table column metadata',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'table', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Column metadata for dynamic UI form generation' },
        },
      },
    },
    // ─────────────────────────────────────────────
    // DASHBOARD
    // ─────────────────────────────────────────────
    '/api/dashboard-stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'High-level dashboard statistics',
        description: 'Returns entity counts, financials, executive summary, risk analysis, and recent items. Cached 15 seconds.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Dashboard stats', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardStats' } } } },
        },
      },
    },
    '/api/nexora-consolidated-kpis': {
      get: {
        tags: ['Dashboard', 'Reporting'],
        summary: 'Consolidated KPIs from stored procedure',
        description: 'Calls `fn_nexora_get_consolidated_kpis()` on Neon PostgreSQL.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Consolidated KPIs with fallback cache' },
        },
      },
    },
    '/api/predictive-analytics': {
      get: {
        tags: ['Dashboard'],
        summary: 'AI predictive BI & sustainability analytics',
        description: 'Returns liquidity runway, donor retention, inflation impact, and 12-month forecast chart.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Predictive analytics payload' },
        },
      },
    },
    '/api/exchange-rates/live': {
      get: {
        tags: ['Dashboard'],
        summary: 'Live exchange rates proxy',
        description: 'Fetches live USD rates from open.er-api.com with fallback to static rates.',
        responses: {
          '200': { description: 'Exchange rates (USD base)' },
        },
      },
    },
    // ─────────────────────────────────────────────
    // REPORTING
    // ─────────────────────────────────────────────
    '/api/reports/db-views': {
      get: {
        tags: ['Reporting'],
        summary: 'List all PostgreSQL views',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Array of view names' },
        },
      },
    },
    '/api/reports/domain-kpis': {
      get: {
        tags: ['Reporting'],
        summary: 'Domain aggregate KPIs across 15 NEB domains',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Domain metrics with program/project/beneficiary/sponsorship counts' },
        },
      },
    },
    '/api/reports/execute': {
      post: {
        tags: ['Reporting'],
        summary: 'Execute enterprise report against a DB view',
        description: 'Runs a query against a whitelisted PostgreSQL view with cursor-based pagination.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  view_name: { type: 'string', default: 'v_beneficiary_registration_report' },
                  domain_code: { type: 'string', default: 'NEB-06' },
                  branch_code: { type: 'string', default: 'ALL' },
                  governorate: { type: 'string', default: 'ALL' },
                  cursor_id: { type: 'string', nullable: true },
                  limit: { type: 'integer', default: 100, maximum: 1000 },
                  offset: { type: 'integer', default: 0 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Report data with execution metadata' },
        },
      },
    },
    '/api/policies/dashboard': {
      get: {
        tags: ['Reporting', 'RBAC'],
        summary: 'Policy violation dashboard',
        description: 'Returns violation stats by domain, recent violations, top violators, and trend data.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'integer', default: 30, maximum: 365 } },
        ],
        responses: {
          '200': { description: 'Policy violation analytics' },
        },
      },
    },
    // ─────────────────────────────────────────────
    // STRATEGY (NEB-01)
    // ─────────────────────────────────────────────
    '/api/v2/strategy/plans': {
      get: {
        tags: ['Strategy'],
        summary: 'List strategic plans',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Strategic plans list' } },
      },
      post: {
        tags: ['Strategy'],
        summary: 'Create a strategic plan',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Plan created' } },
      },
    },
    '/api/v2/strategy/plans/{id}': {
      get: {
        tags: ['Strategy'],
        summary: 'Get strategic plan by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Plan details' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Strategy'],
        summary: 'Update strategic plan',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Plan updated' } },
      },
      delete: {
        tags: ['Strategy'],
        summary: 'Delete strategic plan',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
    '/api/v2/strategy/plans/{planId}/goals': {
      get: {
        tags: ['Strategy'],
        summary: 'List goals for a strategic plan',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'planId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Goals list' } },
      },
      post: {
        tags: ['Strategy'],
        summary: 'Create a goal under a plan',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'planId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Goal created' } },
      },
    },
    '/api/v2/strategy/goals/{goalId}': {
      put: {
        tags: ['Strategy'],
        summary: 'Update a strategic goal',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'goalId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Goal updated' } },
      },
      delete: {
        tags: ['Strategy'],
        summary: 'Delete a strategic goal',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'goalId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
    '/api/v2/strategy/kpis': {
      get: {
        tags: ['Strategy'],
        summary: 'List KPIs',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'planId', in: 'query', schema: { type: 'string' } },
          { name: 'goalId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'KPIs list' } },
      },
      post: {
        tags: ['Strategy'],
        summary: 'Create a KPI',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'KPI created' } },
      },
    },
    '/api/v2/strategy/kpis/{kpiId}/value': {
      put: {
        tags: ['Strategy'],
        summary: 'Update KPI current value',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'kpiId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { currentValue: { type: 'number' } } } } },
        },
        responses: { '200': { description: 'KPI value updated' } },
      },
    },
    '/api/v2/strategy/kpis/{kpiId}': {
      delete: {
        tags: ['Strategy'],
        summary: 'Delete a KPI',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'kpiId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
    '/api/v2/strategy/swot': {
      get: {
        tags: ['Strategy'],
        summary: 'Get SWOT matrix',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'planId', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'SWOT matrix' } },
      },
      post: {
        tags: ['Strategy'],
        summary: 'Add SWOT item',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'SWOT item created' } },
      },
    },
    '/api/v2/strategy/swot/{id}': {
      delete: {
        tags: ['Strategy'],
        summary: 'Delete SWOT item',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
    '/api/v2/strategy/alignment/{planId}': {
      get: {
        tags: ['Strategy'],
        summary: 'Get strategic alignment for a plan',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'planId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Alignment data' } },
      },
    },
    // ─────────────────────────────────────────────
    // PROJECTS (NEB-04)
    // ─────────────────────────────────────────────
    '/api/v2/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List projects (paginated, filterable)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'programId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Projects list' } },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a new project',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Project created' } },
      },
    },
    '/api/v2/projects/dashboard': {
      get: {
        tags: ['Projects'],
        summary: 'Project portfolio dashboard',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Project dashboard data' } },
      },
    },
    '/api/v2/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Project details' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Projects'],
        summary: 'Update a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Project updated' } },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
    '/api/v2/projects/{id}/evm': {
      get: {
        tags: ['Projects'],
        summary: 'Earned Value Management (EVM) for a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'EVM metrics (CPI, SPI, EAC, etc.)' } },
      },
    },
    '/api/v2/projects/{id}/gantt': {
      get: {
        tags: ['Projects'],
        summary: 'Gantt chart data for a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Gantt data' } },
      },
    },
    '/api/v2/projects/{projectId}/milestones': {
      get: {
        tags: ['Projects'],
        summary: 'List milestones for a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Milestones list' } },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a milestone',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Milestone created' } },
      },
    },
    '/api/v2/projects/milestones/{milestoneId}/status': {
      put: {
        tags: ['Projects'],
        summary: 'Update milestone status',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'milestoneId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Status updated' } },
      },
    },
    '/api/v2/projects/{projectId}/schedules': {
      get: {
        tags: ['Projects'],
        summary: 'List schedules for a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Schedules list' } },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a schedule entry',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Schedule created' } },
      },
    },
    '/api/v2/projects/schedules/{scheduleId}/progress': {
      put: {
        tags: ['Projects'],
        summary: 'Update schedule progress percentage',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'scheduleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { progressPct: { type: 'number', minimum: 0, maximum: 100 } } } } },
        },
        responses: { '200': { description: 'Progress updated' } },
      },
    },
    '/api/v2/projects/intelligence': {
      get: {
        tags: ['Projects'],
        summary: 'Project portfolio intelligence snapshot',
        description: 'Returns risk matrix, KPIs, and AI insights for the entire portfolio.',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Intelligence snapshot' } },
      },
    },
    '/api/v2/projects/intelligence/risk/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'AI-powered risk assessment for a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Risk assessment' } },
      },
    },
    '/api/v2/projects/intelligence/forecast/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'AI-powered completion forecast',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Completion forecast' } },
      },
    },
    // ─────────────────────────────────────────────
    // PPM (NEB-02/03)
    // ─────────────────────────────────────────────
    '/api/v2/ppm/projects/{id}/critical-path': {
      get: {
        tags: ['PPM'],
        summary: 'Compute critical path for a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Critical path analysis' } },
      },
    },
    '/api/v2/ppm/projects/{id}/rebuild-dependencies': {
      post: {
        tags: ['PPM'],
        summary: 'Rebuild dependency network from schedules',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Dependencies rebuilt' } },
      },
    },
    '/api/v2/ppm/portfolio/scorecard': {
      get: {
        tags: ['PPM'],
        summary: 'Portfolio scorecard (single project or full rank)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Scorecard data' } },
      },
    },
    '/api/v2/ppm/projects/{id}/score': {
      get: {
        tags: ['PPM'],
        summary: 'Score a specific project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Project score' } },
      },
    },
    '/api/v2/ppm/portfolio/overview': {
      get: {
        tags: ['PPM'],
        summary: 'Portfolio overview dashboard',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Portfolio overview' } },
      },
    },
    // ─────────────────────────────────────────────
    // BACKUP
    // ─────────────────────────────────────────────
    '/api/backups/list': {
      get: {
        tags: ['Backup'],
        summary: 'List all backups',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Array of backup files', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/BackupItem' } } } } },
        },
      },
    },
    '/api/backups/trigger': {
      post: {
        tags: ['Backup'],
        summary: 'Trigger database backup export',
        description: 'Requires security level 4+. Exports all whitelisted tables with SHA-256 checksum.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' } } } } },
        },
        responses: {
          '200': { description: 'Backup created with filename, size, and download URL' },
          '403': { description: 'Security level 4+ required' },
        },
      },
    },
    '/api/backups/download/{filename}': {
      get: {
        tags: ['Backup'],
        summary: 'Download a backup file',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'filename', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Backup JSON file download' },
          '403': { description: 'Security level 4+ required' },
          '404': { description: 'File not found' },
        },
      },
    },
    '/api/backups/restore': {
      post: {
        tags: ['Backup'],
        summary: 'Restore database from backup',
        description: 'Requires maximum security level (5). Verifies SHA-256 checksum before restore.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['backupContent'],
                properties: {
                  backupContent: {
                    type: 'object',
                    properties: {
                      tables: { type: 'object' },
                      checksum: { type: 'string' },
                      checksumAlgorithm: { type: 'string', example: 'sha256' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Database restored' },
          '400': { description: 'Checksum mismatch or invalid payload' },
          '403': { description: 'Security level 5 required' },
        },
      },
    },
    '/api/backups/{filename}': {
      delete: {
        tags: ['Backup'],
        summary: 'Delete a backup file',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'filename', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Backup deleted' },
          '403': { description: 'Security level 5 required' },
          '404': { description: 'File not found' },
        },
      },
    },
    // ─────────────────────────────────────────────
    // AI / GEMINI
    // ─────────────────────────────────────────────
    '/api/gemini/parse-receipt': {
      post: {
        tags: ['AI'],
        summary: 'Parse receipt/invoice with Gemini AI',
        description: 'Sends a base64 image to Gemini 2.5 Flash for OCR extraction of transaction data and accounting lines.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['imageBase64', 'mimeType'],
                properties: {
                  imageBase64: { type: 'string', description: 'Base64-encoded image (max 4MB)' },
                  mimeType: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Parsed receipt data with suggested journal entries' },
          '400': { description: 'Invalid image size or MIME type' },
          '500': { description: 'GEMINI_API_KEY not configured' },
        },
      },
    },
    // ─────────────────────────────────────────────
    // INTEGRATION
    // ─────────────────────────────────────────────
    '/api/integrations/sms/test': {
      post: {
        tags: ['Integration'],
        summary: 'Test SMS dispatch',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  provider: { type: 'string' },
                  phone: { type: 'string', minLength: 5, maxLength: 20 },
                  message: { type: 'string', maxLength: 1600 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'SMS dispatched' }, '400': { description: 'Invalid phone or message' } },
      },
    },
    '/api/integrations/email/test': {
      post: {
        tags: ['Integration'],
        summary: 'Test email dispatch via SMTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  smtpHost: { type: 'string' },
                  recipientEmail: { type: 'string', format: 'email' },
                  subject: { type: 'string', maxLength: 200 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Email sent' }, '400': { description: 'Invalid email' } },
      },
    },
    '/api/integrations/zakat-tax/calculate': {
      post: {
        tags: ['Integration'],
        summary: 'Zakat & VAT calculator',
        description: 'Calculates Zakat (lunar/solar rates) and VAT liability with asnaf distribution breakdown.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  netAssetsYER: { type: 'number', minimum: 0 },
                  vatEligibleAmountYER: { type: 'number', minimum: 0 },
                  zakatRateType: { type: 'string', enum: ['lunar', 'solar'], default: 'lunar' },
                  customVatPct: { type: 'number', minimum: 0, maximum: 100, default: 15 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Zakat & VAT calculation result' } },
      },
    },
    '/api/sync/offline-batch': {
      post: {
        tags: ['Integration'],
        summary: 'Offline batch synchronization',
        description: 'Receives offline sync items from mobile clients. Applies policy enforcement before accepting.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'domain', 'action'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  domain: { type: 'string', enum: ['beneficiary', 'activity', 'service_delivery', 'aid_distribution', 'project', 'transaction'] },
                  action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE'] },
                  payload: { type: 'object' },
                  createdAt: { type: 'string', format: 'date-time' },
                  status: { type: 'string' },
                  retryCount: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Sync item acknowledged' },
          '403': { description: 'Policy violation — sync rejected' },
        },
      },
    },
    // ─────────────────────────────────────────────
    // SEARCH (NEB-12/13)
    // ─────────────────────────────────────────────
    '/api/v2/search': {
      post: {
        tags: ['Search'],
        summary: 'Unified institutional search',
        description: 'Full-text search across all searchable domains with fuzzy matching, filters, and highlighting.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: { type: 'string' },
                  domains: { type: 'array', items: { type: 'string' } },
                  filters: { type: 'object' },
                  fuzzy: { type: 'boolean' },
                  threshold: { type: 'number' },
                  limit: { type: 'integer' },
                  includeHighlights: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Search results' } },
      },
    },
    '/api/v2/search/suggest': {
      get: {
        tags: ['Search'],
        summary: 'Autocomplete suggestions',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 8, maximum: 20 } },
        ],
        responses: { '200': { description: 'Suggestion list' } },
      },
    },
    '/api/v2/search/facets': {
      get: {
        tags: ['Search'],
        summary: 'Domain-level facet counts',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Facet data' } },
      },
    },
    '/api/v2/search/facets/dynamic': {
      post: {
        tags: ['Search'],
        summary: 'Per-domain/field dynamic aggregations',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  requests: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        domain: { type: 'string' },
                        field: { type: 'string' },
                        limit: { type: 'integer' },
                        filters: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Dynamic facets' } },
      },
    },
    '/api/v2/search/index': {
      post: {
        tags: ['Search'],
        summary: 'Index a single record',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['domain', 'recordId'],
                properties: {
                  domain: { type: 'string' },
                  recordId: { type: 'string', format: 'uuid' },
                  weight: { type: 'number', default: 0.5 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Record indexed' } },
      },
    },
    '/api/v2/search/reindex': {
      post: {
        tags: ['Search'],
        summary: 'Bulk reindex an organization',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  domains: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Reindex complete' } },
      },
    },
    '/api/v2/search/saved': {
      get: {
        tags: ['Search'],
        summary: 'List saved searches',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'includePublic', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } }],
        responses: { '200': { description: 'Saved searches list' } },
      },
      post: {
        tags: ['Search'],
        summary: 'Create a saved search',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Saved search created' } },
      },
    },
    '/api/v2/search/saved/{id}': {
      put: {
        tags: ['Search'],
        summary: 'Update saved search',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Updated' } },
      },
      delete: {
        tags: ['Search'],
        summary: 'Delete saved search',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
    '/api/v2/search/saved/{id}/touch': {
      post: {
        tags: ['Search'],
        summary: 'Increment saved search use count',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Touch recorded' } },
      },
    },
    '/api/v2/search/click': {
      post: {
        tags: ['Search'],
        summary: 'Record a click-through event',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query', 'domain', 'recordId'],
                properties: {
                  query: { type: 'string' },
                  domain: { type: 'string' },
                  recordId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Click recorded' } },
      },
    },
    '/api/v2/search/analytics': {
      get: {
        tags: ['Search'],
        summary: 'Search analytics (top queries, slow, zero-hits)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 30, maximum: 180 } }],
        responses: { '200': { description: 'Analytics data' } },
      },
    },
    '/api/v2/search/stats': {
      get: {
        tags: ['Search'],
        summary: 'Organization-wide search stats',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 30, maximum: 180 } }],
        responses: { '200': { description: 'Stats data' } },
      },
    },
    '/api/v2/search/recommendations': {
      get: {
        tags: ['Search'],
        summary: 'Personalized "for you" recommendations',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 50 } }],
        responses: { '200': { description: 'Recommendation list' } },
      },
    },
    '/api/v2/search/related/{domain}/{id}': {
      get: {
        tags: ['Search'],
        summary: 'Related records for a given entity',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'domain', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 50 } },
        ],
        responses: { '200': { description: 'Related records' } },
      },
    },
    '/api/v2/search/trending': {
      get: {
        tags: ['Search'],
        summary: 'Trending search queries',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'integer', default: 7, maximum: 60 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 30 } },
        ],
        responses: { '200': { description: 'Trending queries' } },
      },
    },
    // ─────────────────────────────────────────────
    // RBAC
    // ─────────────────────────────────────────────
    '/api/rbac/matrix': {
      get: {
        tags: ['RBAC'],
        summary: 'Load RBAC matrix (roles, permissions, role-permission map)',
        description: 'Requires security level 3+.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'RBAC matrix with roles, permissions, and mapping' },
          '403': { description: 'Security level 3+ required' },
        },
      },
    },
    '/api/rbac/matrix/update': {
      post: {
        tags: ['RBAC'],
        summary: 'Update role permissions (security level 5 only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role_id', 'permission_ids'],
                properties: {
                  role_id: { type: 'string', format: 'uuid' },
                  permission_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Permissions updated' },
          '403': { description: 'Security level 5 required' },
        },
      },
    },
    '/api/users/reset-password': {
      post: {
        tags: ['RBAC'],
        summary: 'Admin password reset (requires admin password confirmation)',
        description: 'Requires security level 4+. Admin must confirm with their own password.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user_id', 'new_password', 'admin_password'],
                properties: {
                  user_id: { type: 'string', format: 'uuid' },
                  new_password: { type: 'string', format: 'password', minLength: 8 },
                  admin_password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password reset successfully' },
          '403': { description: 'Insufficient privileges or invalid admin password' },
        },
      },
    },
    // ─────────────────────────────────────────────
    // HEALTH
    // ─────────────────────────────────────────────
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'General health check',
        responses: {
          '200': { description: 'Health status', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
          '500': { description: 'Database disconnected' },
        },
      },
    },
    '/api/health/liveness': {
      get: {
        tags: ['Health'],
        summary: 'Kubernetes liveness probe',
        responses: { '200': { description: 'Process is running' } },
      },
    },
    '/api/health/readiness': {
      get: {
        tags: ['Health'],
        summary: 'Kubernetes readiness probe',
        description: 'Verifies DB connection and returns pool metrics + memory usage.',
        responses: {
          '200': { description: 'Ready to accept traffic' },
          '503': { description: 'Not ready — DB disconnected' },
        },
      },
    },
  },
};

export default openapiSpec;
