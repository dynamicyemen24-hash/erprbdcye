/**
 * NexoraOS™ — Swagger UI Middleware Setup
 * Mounts Swagger UI at /api/docs and provides /api/docs.json for the raw spec.
 */

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from './openapi';

const swaggerRouter = Router();

// Serve the raw OpenAPI JSON spec. Registered BEFORE the UI catch-all:
// `swaggerUi.setup()` answers any request that reaches it with HTML, so a
// later `/json` route would never run (every spec fetch returned the UI
// bundle instead — caught by E2E).
swaggerRouter.get('/json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openapiSpec);
});

// Serve Swagger UI at /api/docs
swaggerRouter.use('/', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'UAMEX ERP™ API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
}));

// Redirect /api/docs to /api/docs/ for trailing slash consistency
swaggerRouter.get('', (_req, res) => {
  res.redirect(301, '/api/docs/');
});

export { openapiSpec };
export default swaggerRouter;
