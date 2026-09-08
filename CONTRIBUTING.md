# Contributing to UAMEX ERP™ (NexoraOS)

Welcome to the UAMEX ERP™ development community. This guide covers local setup, coding standards, testing, and deployment workflows.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 18.x | Runtime |
| npm | >= 9.x | Package manager |
| PostgreSQL | 15+ (Neon recommended) | Database |
| Git | 2.x | Version control |

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/anomalyco/opencode.git
cd NexoraOS

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

# 4. Run development server
npm run dev

# 5. Open browser
# http://localhost:5173
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `JWT_SECRET` | Yes | Min 32 chars, used for JWT signing |
| `GEMINI_API_KEY` | No | Google Gemini AI for copilot features |
| `ALLOWED_ORIGINS` | Prod | Comma-separated CORS origins |
| `NODE_ENV` | Yes | `development` or `production` |

## Project Structure

```
NexoraOS/
├── server.ts                    # Express entry point (root)
├── src/
│   ├── app/                     # Application shell
│   │   ├── routes/              # Route definitions
│   │   └── components/          # TabContentRenderer, ErrorBoundary
│   ├── components/              # 100+ React view components
│   │   ├── enterprise/          # ModuleShell, ToastContainer
│   │   ├── common/              # ViewSkeleton, SuspenseFallback
│   │   └── bi/                  # Business Intelligence icons
│   ├── features/                # Feature modules (17 domains)
│   ├── core/                    # Architecture core
│   │   ├── types/               # TypeScript type definitions
│   │   ├── config/              # Entity policies, RBAC
│   │   ├── context/             # React contexts
│   │   └── hooks/               # Custom React hooks
│   ├── db/
│   │   └── schema.ts            # Drizzle ORM schema
│   ├── server/
│   │   ├── routes/              # Express route handlers
│   │   │   ├── v2/              # Engine-based routes (recommended)
│   │   │   └── *.routes.ts      # Legacy V1 routes
│   │   ├── engines/             # Business logic engines
│   │   ├── middleware/           # Auth, validation, caching, etc.
│   │   ├── core/                # Database, logger, cache, resilience
│   │   └── validators/          # Zod validation schemas
│   └── lib/                     # Utility libraries
├── api/                         # Vercel serverless functions
├── migrations/                  # SQL migration files
├── docs/                        # System documentation
└── tests/                       # Test suites
```

## Coding Standards

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig)
- No `any` types in new code — use proper interfaces
- All exports must have explicit return types

### React
- Functional components only (no class components)
- Use `lazyWithRetry()` for all view components
- RTL/LTR support via `lang` prop pattern
- Dark mode via Tailwind `dark:` variant classes

### Backend
- All routes must use `authenticateToken` middleware
- Input validation via Zod schemas (`validateBody`/`validateQuery`)
- Rate limiting on all write endpoints
- Circuit breakers on critical DB queries
- Structured logging via Pino

### Database
- All tables must have `organization_id` (tenant isolation)
- Soft deletes via `deleted_at` column
- UUID primary keys with `gen_random_uuid()`
- Indexes on foreign keys and frequently queried columns

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npx vitest run src/server/engines/__tests__/engines.test.ts

# Run with coverage
npx vitest run --coverage

# Run frontend lint
npm run lint
```

### Test Categories
- **Engine tests**: Business logic validation
- **Integration tests**: API endpoint testing
- **Authorization tests**: RBAC and tenant isolation
- **PMO tests**: Project management features

## Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit with conventional commits
3. Run `npm run lint` and `npm test` before pushing
4. Push and create PR against `main`

### Commit Convention
```
feat(NEB-08): Add commitment lifecycle management
fix(NEB-10): Fix double-entry ledger balance calculation
docs: Update API documentation
```

## Deployment

- **Frontend**: Vercel (auto-deploy from `main`)
- **Backend**: Render (auto-deploy from `main`)
- **Database**: Neon PostgreSQL

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Architecture Principles

1. **Zero Trust**: Every request authenticated and authorized
2. **Tenant Isolation**: Data separated by `organization_id`
3. **Domain Integrity**: NEB-01 through NEB-15 domain separation
4. **IPSAS Compliance**: Financial standards for NGO accounting
5. **Performance First**: Lazy loading, caching, circuit breakers

## Support

- Issues: [GitHub Issues](https://github.com/anomalyco/opencode/issues)
- Documentation: `docs/` folder
- API Reference: `/api/v2/docs`
