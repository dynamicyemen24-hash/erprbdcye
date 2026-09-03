# UAMEX ERP™ — Unified Expense Engine (NEB-10)
## نظام إدارة المصروفات الموحد والمؤسسي الذكي

---

## 📋 Overview | نظرة عامة

The **Unified Expense Engine** is a comprehensive, intelligent, and modular expense management system designed for non-profit organizations, charities, and enterprises. It implements the **NEB-10 Finance & Compliance OS** domain of the UAMEX ERP™ framework.

**وحدة المصروفات الموحدة** هي نظام شامل وذكي ومعياري لإدارة المصروفات مصمم للمنظمات غير الربحية والجمعيات الخيرية والمؤسسات. ينفذ نطاق **NEB-10 نظام المالية والامتثال** في إطار UAMEX ERP™.

---

## 🏗️ Architecture | البنية المعمارية

### Modular Layered Architecture (Five-Tier)

```
┌────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER (UI)                         │
│   src/components/finance/UnifiedExpenseEngineTab.tsx              │
│   - React + TypeScript + Tailwind CSS                             │
│   - Bilingual (AR/EN) + Dark/Light Mode                           │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│                    API LAYER (Express Routes)                       │
│   src/server/routes/v2/expense.routes.ts                          │
│   - 30+ RESTful endpoints                                         │
│   - JWT authentication & RBAC                                     │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER (Engines)                   │
│   src/server/engines/expense.engine.ts                            │
│   - ExpenseCategoryEngine | ExpenseEngine                         │
│   - ExpenseIntelligenceEngine | ExpenseBatchEngine                │
│   - PettyCashEngine | RecurringExpenseEngine                      │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER (PostgreSQL)                  │
│   migrations/20260830_unified_expense_engine.sql                  │
│   - 12 tables, 17 default categories, 3 sequences                │
│   - Full IPSAS-compliant chart of accounts integration            │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Core Capabilities | الإمكانيات الأساسية

### 1. **Expense Categories Registry** | سجل فئات المصروفات
- 17 pre-configured categories (OPERATIONAL, PROGRAM, ADMIN, CAPITAL, EMERGENCY, TRAVEL, PROCUREMENT, HR, MARKETING, IT, FACILITY, CONSULTING, LEGAL, INSURANCE, UTILITIES, RENT, OTHER)
- Hierarchical structure (parent-child support)
- GL account mapping (debit/credit account auto-resolution)
- Configurable approval thresholds
- VAT rate defaults
- Per-category receipt requirements

### 2. **Full Lifecycle Management** | إدارة دورة الحياة الكاملة
```
DRAFT → PENDING_APPROVAL → APPROVED → POSTED → PAID → RECONCILED
  ↓           ↓                ↓          ↓        ↓
REJECTED   CANCELLED      PARTIALLY_PAID   CLOSED
```

### 3. **Multi-Tier Approval Workflow** | سير عمل الموافقات متعدد المستويات
- Configurable approval chains (JSON-based level definitions)
- Delegation support (with validity periods)
- Audit trail of all approval actions
- Approval escalation rules
- Role-based approver assignment

### 4. **IPSAS Double-Entry Posting** | الترحيل المحاسبي المزدوج (IPSAS)
- Automatic journal entry creation
- Dr Expense Account (5xxx/6xxx) | Cr Cash/Bank/AP (1xxx/2xxx)
- Multi-currency support with exchange rate locking
- Project/Activity/Cost Center attribution on transaction lines
- Reversal entries via cancellation

### 5. **VAT/Tax Management** | إدارة الضريبة
- Automatic VAT calculation
- VAT recovery tracking
- Tax withholding support
- Per-category default rates

### 6. **Budget Integration** | التكامل مع الميزانية
- Budget line tracking
- Commitment vs. actual variance analysis
- Burn-rate monitoring
- Forecast outcomes

### 7. **Payment Management** | إدارة المدفوعات
- 7 payment methods (BANK_TRANSFER, CASH, CHEQUE, CREDIT_CARD, PETTY_CASH, VIRTUAL_ACCOUNT, MOBILE_PAYMENT)
- Multi-installment payment schedules
- Partial payment tracking
- Overdue payment alerts
- Payment reconciliation

### 8. **Petty Cash Management** | إدارة الصندوق الصغير
- Custodian-based float management
- Request → Approve → Issue → Settle lifecycle
- Receipt attachment requirement
- Minimum balance thresholds

### 9. **Recurring Expense Automation** | أتمتة المصروفات المتكررة
- 6 frequency types (WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL)
- Auto-approve and auto-post options
- Cron-based execution
- Next-run-date calculation

### 10. **Expense Intelligence & Analytics** | الذكاء والتحليلات
- Real-time KPIs (total, approved, paid, outstanding, avg, count, pending, overdue)
- Category breakdown analysis
- Project attribution breakdown
- Monthly trend visualization
- Top vendor identification
- Compliance alerts (LOW/MEDIUM/HIGH/CRITICAL)
- AI-powered forecasting (linear regression)

### 11. **Batch Journal Entries** | القيود المجمعة
- Multi-entry balanced journal posts
- Automatic balanced verification
- Batch approval workflow
- Bulk posting to general ledger

### 12. **Receipt & Documentation** | الإيصالات والوثائق
- File attachment support
- Receipt number tracking
- Multiple attachment types (RECEIPT, INVOICE, CONTRACT, APPROVAL_DOC, OTHER)
- MIME type & file size tracking

---

## 📊 Database Schema | مخطط قاعدة البيانات

### Tables (12)

| Table | Purpose |
|-------|---------|
| `expense_categories` | Category registry with GL mapping |
| `expense_records` | Core expense entity with full lifecycle |
| `expense_attachments` | Receipt/document attachments |
| `approval_workflows` | Multi-tier workflow configuration |
| `expense_approval_history` | Approval audit trail |
| `approval_delegations` | Approval delegation management |
| `expense_payment_schedules` | Installment payment tracking |
| `budget_commitments` | Budget commitment tracking |
| `petty_cash_floats` | Petty cash float management |
| `petty_cash_requests` | Petty cash request lifecycle |
| `recurring_expense_templates` | Recurring expense automation |
| `expense_batches` | Bulk journal entry batches |
| `expense_batch_entries` | Individual batch entries |

### Sequences (3)
- `expense_record_seq` — Sequential expense numbering
- `expense_batch_seq` — Sequential batch numbering
- `petty_cash_request_seq` — Sequential petty cash numbering

---

## 🔌 API Endpoints | نقاط الوصول API

### Categories
```
GET    /api/v2/expense/categories              - List all
GET    /api/v2/expense/categories/tree         - Tree structure
GET    /api/v2/expense/categories/:code        - Get by code
POST   /api/v2/expense/categories              - Create
DELETE /api/v2/expense/categories/:id          - Deactivate
```

### Records
```
GET    /api/v2/expense/records                 - List with filters
GET    /api/v2/expense/records/:id             - Get by ID
POST   /api/v2/expense/records                 - Create (DRAFT)
POST   /api/v2/expense/records/:id/submit      - Submit for approval
POST   /api/v2/expense/records/:id/approve     - Approve/Reject
POST   /api/v2/expense/records/:id/post        - Post to ledger
POST   /api/v2/expense/records/:id/pay         - Mark as paid
POST   /api/v2/expense/records/:id/reconcile   - Reconcile
POST   /api/v2/expense/records/:id/cancel      - Cancel
DELETE /api/v2/expense/records/:id             - Soft delete
```

### Intelligence
```
GET    /api/v2/expense/intelligence            - Full KPI snapshot
GET    /api/v2/expense/forecast                - Expense forecast
```

### Petty Cash
```
POST   /api/v2/expense/petty-cash/requests
POST   /api/v2/expense/petty-cash/requests/:id/issue
POST   /api/v2/expense/petty-cash/requests/:id/settle
```

### Recurring
```
POST   /api/v2/expense/recurring/templates
GET    /api/v2/expense/recurring/due
POST   /api/v2/expense/recurring/templates/:id/process
```

### Batches
```
GET    /api/v2/expense/batches
GET    /api/v2/expense/batches/:id
POST   /api/v2/expense/batches
POST   /api/v2/expense/batches/:id/submit
POST   /api/v2/expense/batches/:id/approve
POST   /api/v2/expense/batches/:id/post
```

---

## 💡 Professional & Smart Ideas | أفكار احترافية وذكية

### 1. **Zero-Trust Validation Engine** | محرك التحقق بدون ثقة
All inputs validated at engine level — no bad data reaches the database. Uses whitelisting, type checking, range validation, and business rule enforcement.

### 2. **Immutable Audit Trail** | سجل تدقيق غير قابل للتغيير
Every state transition is recorded in the audit log with actor, timestamp, IP, and details. Cannot be modified after creation.

### 3. **Multi-Currency Exchange Rate Locking** | تثبيت سعر الصرف متعدد العملات
Exchange rate is captured at creation time and locked. Prevents currency fluctuation impact on historical records.

### 4. **Hierarchical Category Tree** | شجرة الفئات الهرمية
Supports parent-child relationships for granular expense classification (e.g., TRAVEL → DOMESTIC_TRAVEL, INTERNATIONAL_TRAVEL).

### 5. **Automated GL Account Resolution** | الحل التلقائي للحسابات
Engine automatically resolves expense debit accounts (5xxx/6xxx) and credit accounts (1xxx for cash/bank, 2xxx for AP) when category-level mapping is not configured.

### 6. **AI-Powered Compliance Alerts** | تنبيهات امتثال ذكية
System automatically detects:
- Overdue payments (HIGH severity)
- Pending approval delays (MEDIUM)
- Missing receipts for required categories (HIGH)
- VAT mismatches (CRITICAL)
- Unusual spending patterns (AI-detected)

### 7. **Linear Regression Forecasting** | التنبؤ بالانحدار الخطي
Built-in time-series forecasting using linear regression with confidence intervals. Predicts next 3 periods by default.

### 8. **Batch Balancing Verification** | التحقق التلقائي من توازن الدفعات
All expense batches are validated for ΣDebit = ΣCredit before posting. Prevents unbalanced journal entries.

### 9. **Recursive Approval Delegation** | التفويض المتكرر للموافقات
Approval authority can be delegated with start/end dates, and category restrictions (e.g., delegate only for HR expenses).

### 10. **Cost Center Burn-Rate Monitoring** | مراقبة معدل الإنفاق
Integrates with cost centers to track burn-rate percentage and alert when approaching budget limits.

### 11. **Modular Architecture** | البنية المعمارية المعيارية
Each component (CategoryEngine, ExpenseEngine, IntelligenceEngine, etc.) is independently testable and replaceable. Follows SOLID principles.

### 12. **Bilingual UI with RTL/LTR** | واجهة ثنائية اللغة
Full Arabic/English support with proper RTL/LTR layout switching, number formatting, and date handling.

### 13. **Dark/Light Mode Aware** | دعم الوضع المظلم والفاتح
All components use Tailwind `dark:` variants for seamless theme switching.

### 14. **Type-Safe End-to-End** | سلامة الأنواع من النهاية إلى النهاية
TypeScript everywhere — from API contracts to UI props. No `any` types in business logic.

### 15. **Performance Optimized** | محسّن للأداء
- Indexed queries on org_id, status, date, project_id, activity_id, cost_center_id
- Cursor-based pagination for large datasets
- Memoized computations in UI
- Debounced search inputs

---

## 🔐 Security & Compliance | الأمان والامتثال

### Security
- JWT authentication on all endpoints
- Tenant isolation (organization_id filtering)
- Role-based access control (RBAC) ready
- SQL injection prevention (parameterized queries)
- Input sanitization at all layers
- CSRF protection (via JWT, not cookies)

### Compliance
- **IPSAS** — Full compliance with International Public Sector Accounting Standards
- **IFRS** — Compatible with International Financial Reporting Standards
- **Audit trail** — Immutable, complete, traceable
- **Segregation of duties** — Creator ≠ Approver ≠ Poster
- **Approval thresholds** — Configurable per category
- **Retention** — Soft delete with deleted_at timestamp

---

## 🧪 Testing | الاختبارات

Comprehensive test coverage includes:
- Unit tests for each engine class
- Integration tests for API routes
- End-to-end tests for full lifecycle
- Compliance scenario tests (IPSAS posting, approval chains)
- Performance tests (pagination, large datasets)

---

## 📈 Future Roadmap | خارطة الطريق المستقبلية

### Phase 2 (Next Quarter)
- [ ] OCR-based receipt scanning
- [ ] Mobile app for expense submission
- [ ] WhatsApp integration for approval requests
- [ ] Real-time collaboration on expense reports

### Phase 3 (Q2 2027)
- [ ] Machine learning anomaly detection
- [ ] Predictive budget alerts
- [ ] Vendor performance scoring
- [ ] Contract-based recurring billing

### Phase 4 (Q3 2027)
- [ ] Blockchain audit trail
- [ ] Smart contract auto-payments
- [ ] IATI-compliant expense reporting
- [ ] Multi-org consolidation engine

---

## 🤝 Integration Points | نقاط التكامل

| Module | Integration |
|--------|-------------|
| **NEB-04 Projects** | Expense attribution to projects/activities |
| **NEB-09 Resources** | Cost center integration |
| **NEB-14 Procurement** | PO-linked expenses |
| **NEB-08 Funding** | Budget line linkage |
| **NEB-15 Revenue** | Net position calculation |
| **NEB-13 AI Intelligence** | Anomaly detection, forecasting |
| **NEB-12 Integration** | External API exports (IATI, etc.) |
| **NEB-11 Knowledge** | Document attachment archive |

---

## 📞 Support | الدعم

For questions, issues, or feature requests:
- **Documentation:** `/docs/UNIFIED_EXPENSE_ENGINE.md`
- **Architecture:** `/docs/architecture/`
- **API Reference:** This file + inline JSDoc comments
- **Source Code:** `src/server/engines/expense.engine.ts`

---

**Version:** 1.0.0  
**Last Updated:** 2026-08-30  
**Maintainer:** UAMEX ERP™ Finance Team  
**License:** Proprietary — UAMEX ERP™ Internal Use