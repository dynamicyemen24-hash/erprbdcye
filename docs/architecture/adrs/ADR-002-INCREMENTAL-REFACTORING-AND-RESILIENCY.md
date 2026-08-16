# ADR-002: Incremental Refactoring & API Resiliency Strategy

## Status
Accepted

## Context
Massive "Big-Bang" rewrites introduce high risks of regression, breaking subtle UI features, or creating service downtime.

## Decision
We enforce a strict **Safe Refactoring** policy:
1. Zero breaking changes in public component contracts or route definitions.
2. Graceful API fallbacks: Every endpoint in `server.ts` returns fallback schema-compliant structures when PostgreSQL queries fail or views are missing.
3. Centralized API Service Layer (`src/core/services/apiService.ts`) with typed promise handling.

## Consequences
- Guaranteed zero downtime during architectural evolution.
- High resilience when database connectivity is degraded or undergoing maintenance.
