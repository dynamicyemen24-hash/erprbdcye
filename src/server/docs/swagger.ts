/**
 * NexoraOS™ — Swagger UI Middleware Setup
 * Mounts Swagger UI at /api/docs and provides /api/docs.json for the raw spec.
 */

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from './openapi';

const swaggerRouter = Router();

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

// Serve the raw OpenAPI JSON spec
swaggerRouter.get('/json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openapiSpec);
});

// Redirect /api/docs to /api/docs/ for trailing slash consistency
swaggerRouter.get('', (_req, res) => {
  res.redirect(301, '/api/docs/');
});

export { openapiSpec };
export default swaggerRouter;
