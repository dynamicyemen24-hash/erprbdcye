# ADR-003: Hybrid Neon PostgreSQL Data Engine & Connection Pooling

## Status
Accepted

## Context
Enterprise multi-tenant applications demand high-concurrency database access with connection pooling and serverless scaling capabilities.

## Decision
1. Neon PostgreSQL serverless cluster configured as the primary relational database engine.
2. Lazy-initialized connection pool (`pg.Pool`) in `server.ts` with SSL enforcement.
3. Fallback connection string matching `.env.example` to prevent boot failures during deployment.

## Consequences
- High-performance, scalable query execution.
- Secure, SSL-encrypted transport for financial and beneficiary data.
