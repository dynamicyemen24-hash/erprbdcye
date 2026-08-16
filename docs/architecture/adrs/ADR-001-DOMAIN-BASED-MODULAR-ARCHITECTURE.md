# ADR-001: Domain-Based Modular Architecture for NexoraOS™

## Status
Accepted

## Context
NexoraOS™ is an enterprise operating system covering 13 distinct enterprise domains (NEB-01 through NEB-13). As the platform grew, keeping components flat inside `/src/components` created cognitive debt and risks of cross-domain coupling.

## Decision
We adopted a **Feature-Driven Domain Architecture** organized into 4 primary layers:
1. `/src/app/` - Routing, Navigation Maps, App Composition Shell.
2. `/src/core/` - System Types, Brand Configurations, Core API Services & React Contexts.
3. `/src/shared/` - Reusable UI components, Modals, Navigation Bars, and Utility Helpers.
4. `/src/features/` - Isolated Domain-Driven Feature Modules (`dashboard`, `programs`, `projects`, `community`, `procurement`, `assets`, `finance`, `knowledge`, `administration`).

## Consequences
- Clean separation of concerns between business domains.
- Improved build performance and incremental code splitting capability.
- Unlocks future migration to standalone microservices or micro-frontends without disrupting UI layouts.
