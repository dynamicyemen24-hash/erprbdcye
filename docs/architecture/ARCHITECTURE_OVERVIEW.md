# NexoraOS™ Enterprise Architecture Overview

## Overview
NexoraOS™ is the Intelligent Enterprise Operating System powering **جمعية رُحماء بينهم للعمل الإنساني والتنمية (Rohamā'a Baynahum Charity Foundation)**.

## High-Level Target Architecture

```
[ React + TypeScript SPA ]  <--- (REST / PostgreSQL APIs) --->  [ Node.js / Express Backend (server.ts) ]
                                                                                |
         +------------------------------------+---------------------------------+------------------------------------+
         |                                    |                                    |                                 |
[ Strategy & Programs (NEB-01..03) ] [ Operations & Projects (NEB-04..05) ] [ Services & Community (NEB-06..07) ] [ Finance & Governance (NEB-10) ]
         |                                    |                                    |                                 |
         +------------------------------------+---------------------------------+------------------------------------+
                                              |
                             [ Neon PostgreSQL Cluster ]
                            (Distributed Relational DB)
```

## Directory Structure
- `/src/app/` - Routing, Navigation Maps, App Composition Shell.
- `/src/core/` - System Types, Brand Configurations, Core Constants.
- `/src/shared/` - Reusable UI components, Modals, Navigation Bars, and Layout Elements.
- `/src/features/` - Domain-Driven Feature Modules:
  - `dashboard/` - Executive KPIs, GIS, Operations Control Center.
  - `programs/` - Strategic Frameworks & Program Portfolios.
  - `projects/` - Projects, WBS Field Activities, Timeline & Scenarios.
  - `community/` - Beneficiaries, Sponsorships & Social Support.
  - `procurement/` - Contracts, Inventory & Supply Chain.
  - `assets/` - Fixed Assets, Fleet Maintenance & GIS Mapping.
  - `finance/` - IPSAS General Ledger, Currency Management, Approvals.
  - `knowledge/` - Reports, Document Governance, Policy Center.
  - `administration/` - User Identity, Audit Logs, Backups, Control Panel.

## Principles
1. **Domain Boundaries**: Clear separation between features.
2. **Modular Imports**: Feature index files export high-level domain views cleanly.
3. **Zero Breaking Changes**: Fully backward-compatible export layer ensures stability.
