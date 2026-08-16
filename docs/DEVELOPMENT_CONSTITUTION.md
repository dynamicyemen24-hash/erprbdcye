# NexoraOS™ Development Constitution

## Overview
This document outlines the master coding standards, architectural principles, identity governance, and operational procedures for maintaining the **NexoraOS™ Intelligent Enterprise Operating System**.

---

## Core Principles

1. **Security-First Zero-Trust Architecture**:
   All data access, API endpoints, and database queries MUST pass through enterprise-grade JWT authentication, rate limiting, and role-based access control (RBAC) layers.

2. **System vs. Tenant Identity Separation Law**:
   - **System Identity (NexoraOS™)**: Refers strictly to the core platform provider, underlying infrastructure, 15 Enterprise Domains (NEB-01 to NEB-15), AI engine, and global governance engine.
   - **Subscriber/Tenant Identity**: Refers to white-label subscribing organizations (e.g., *جمعية رُحماء بينهم للعمل الإنساني والتنمية* or external NGO subscribers).
   - **UI Rule**: The entry portal MUST present **NexoraOS™** as the master platform while dynamically binding active tenant workspaces without hardcoding subscriber identities on public platform screens.

3. **End-User Onboarding & Visual Guidance**:
   The entry portal MUST equip end-users with an intuitive system guide, domain breakdown (NEB-01..15), and operational preview so users enter the primary workspace with a comprehensive understanding of the platform.

4. **Enterprise Domain Integrity**:
   All features MUST map to one of the 15 defined **Nexora Enterprise Domains (NEB-01 to NEB-15)**:
   - NEB-01 Strategy & Performance OS
   - NEB-02 Portfolio Management OS
   - NEB-03 Program Management OS
   - NEB-04 Project Management OS
   - NEB-05 Field Operations OS
   - NEB-06 Service Delivery OS
   - NEB-07 Community & Membership OS
   - NEB-08 Partnership & Funding OS
   - NEB-09 Resource & Asset OS
   - NEB-10 Finance & Compliance OS (IPSAS Ledger)
   - NEB-11 Knowledge & Document OS
   - NEB-12 Integration & Digital Services OS (IATI)
   - NEB-13 AI Intelligence & Impact OS (Gemini AI & Sphere/CHS)
   - NEB-14 Procurement & Tenders OS
   - NEB-15 Sales, Revenue & Fundraising OS

5. **Performance and Scalability**:
   UI state updates MUST execute under 100ms. Production build bundles MUST be optimized (<250kB per module chunk).

6. **Brand System Consistency**:
   - Primary Accent: Emerald Green (`#059669` / `emerald-600`)
   - Secondary Accent: Gold/Amber (`#d97706` / `amber-500`)
   - Dark Mode Background: `#090d16` (`zinc-950`)
   - Light Mode Background: `#f8fafc` (`zinc-50`)

---

## Standardized Tech Stack
- **Frontend**: React 19+, Tailwind CSS v4, Lucide React, Recharts.
- **Backend**: Node.js, Express, Neon PostgreSQL.
- **Data Layer**: Drizzle ORM / pg connection pool.
- **AI Engine**: Google GenAI SDK (Gemini AI integration).

---

## Operational & Compliance Procedures
- **IPSAS Compliance**: All financial transactions MUST follow IPSAS standards with immutable audit logs.
- **Multi-Currency Ledger**: Store historical exchange rates for YER, SAR, and USD.
- **Offline-First Sync**: Implement local queue fallback for low-connectivity field operations.
