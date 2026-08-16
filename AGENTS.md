# AGENTS.md - Rohamaab NexoraOS™ System Instructions

## Project Identity & Brand Standard
- **Organization Name:** جمعية رُحماء بينهم للعمل الإنساني والتنمية (Rohamā'a Baynahum Charity Foundation)
- **Official System Name:** NexoraOS™ Intelligent Enterprise Operating System (نظام التشغيل المؤسسي الذكي - الرابطة التشغيلية الموحدة)
- **Tagline:** One Platform. One Organization. One Vision.
- **Official Logo:** `/public/LogoRohamaab.png` (also at `/src/assets/LogoRohamaab.png`)
- **Brand Colors:**
  - Primary Emerald Green: `#059669` / `emerald-600` / `emerald-500`
  - Accent Gold/Amber: `#d97706` / `amber-500`
  - Dark Mode Background: `#090d16` / `zinc-950` / `zinc-900`
  - Light Mode Background: `#f8fafc` / `zinc-50` / `zinc-100`

## Documentation Folder Structure
- `/docs/SYSTEM_SPECIFICATIONS.md` - Technical & Functional Architecture Document (Nexora Enterprise Domains™ NEB-01 to NEB-15)
- `/docs/USER_MANUAL.md` - Comprehensive End-User Manual & Operational Playbooks
- `/docs/DEVELOPMENT_CONSTITUTION.md` - Development Constitution & NexoraOS™ Coding Standards

## Architectural Rules & Enterprise Domains
1. **Logo & Identity:** Always maintain `LogoRohamaab.png` in the header navbar, login view, organization settings, and printable reports.
2. **Nexora Enterprise Domains™:** Architecture built around 15 integrated domains:
   - NEB-01: Strategy & Performance OS
   - NEB-02: Portfolio Management OS
   - NEB-03: Program Management OS
   - NEB-04: Project Management OS
   - NEB-05: Operations OS (Field Execution & WBS)
   - NEB-06: Service Delivery OS (Beneficiaries & Services)
   - NEB-07: Community & Membership OS (Volunteers & Community)
   - NEB-08: Partnership & Funding OS (Donors, Grants & Sponsorships)
   - NEB-09: Resource & Asset OS (Assets & HR)
   - NEB-10: Finance & Compliance OS (IPSAS Ledger & Governance)
   - NEB-11: Knowledge & Document OS (Archive & Policies)
   - NEB-12: Integration & Digital Services OS (Neon PostgreSQL, APIs & IATI)
   - NEB-13: AI Intelligence & Impact OS (Gemini AI & Sphere/CHS Impact)
   - NEB-14: Procurement & Tenders OS (Purchasing, RFQs & Vendors)
   - NEB-15: Sales, Revenue & Fundraising OS (Donations, Invoicing & Revenue)
3. **Theme Support:** Support seamless light and dark mode toggling using Tailwind CSS `dark:` variant classes across all views.
4. **Database Integrity:** Maintain safe backend operations using Neon PostgreSQL whitelist and connection pooling.
