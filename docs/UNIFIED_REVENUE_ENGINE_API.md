# UAMEX ERP™ — UnifiedRevenueEngine™ API Specifications
## Complete RESTful API Endpoints — NEB-15

---

## Overview
This document defines the complete RESTful API surface for the UnifiedRevenueEngine™ module. All endpoints follow RESTful conventions, return JSON, and require authentication via session cookies or Bearer tokens.

**Base URL**: `/api/v2/revenue`  
**Authentication**: Required (session cookie or `Authorization: Bearer <token>`)  
**Content-Type**: `application/json`  
**Versioning**: URL-based (`/api/v2/...`)

---

## 1. Authentication & Authorization

```typescript
// All endpoints require:
// 1. Valid session/JWT
// 2. User belongs to organization (orgId in path or body)
// 3. User has required permission for action
// 4. All queries scoped by organization_id for multi-tenant isolation

interface AuthContext {
  userId: string;
  orgId: string;
  role: string;
  permissions: string[];
  securityLevel: number;
}
```

---

## 2. Standard Response Format

```typescript
// Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    timestamp?: string;
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    messageAr?: string;
    details?: Record<string, any>;
    field?: string;
  };
  timestamp: string;
  requestId: string;
}

// Paginated Response
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## 3. Revenue Streams API

### 3.1 List Revenue Streams

```http
GET /api/v2/revenue/streams
```

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `activeOnly` | boolean | No | Filter active streams only |
| `revenueType` | RevenueTypeCode | No | Filter by revenue type |
| `search` | string | No | Search in name/code |
| `page` | number | No | Page number (default 1) |
| `pageSize` | number | No | Items per page (default 20, max 100) |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "streamCode": "REV-CASH-001",
      "nameAr": "تبرعات نقدية عامة",
      "nameEn": "General Cash Donations",
      "revenueType": "CASH_DON",
      "recognitionMethod": "CASH",
      "exchangeType": "NON_EXCHANGE",
      "restrictionLevel": "UNRESTRICTED",
      "defaultCurrency": "YER",
      "isActive": true,
      "allowBatch": true,
      "requiresApproval": true,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 15,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### 3.2 Get Stream by ID

```http
GET /api/v2/revenue/streams/:id
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "streamCode": "REV-GRANT-001",
    "nameAr": "منح مقيدة - تعليم",
    "nameEn": "Restricted Grants - Education",
    "revenueType": "GRANT",
    "recognitionMethod": "DEFERRED",
    "restrictionLevel": "TEMPORARILY_RESTRICTED",
    "defaultDebitAccountId": "uuid-bank-account",
    "defaultCreditAccountId": "uuid-deferred-revenue",
    "deferredAccountId": "uuid-deferred-grant",
    "isActive": true,
    "metadata": {
      "sector": "EDUCATION",
      "donorType": "MULTILATERAL"
    },
    "usageStats": {
      "recordCount": 45,
      "totalAmount": 1250000.00,
      "lastUsedAt": "2026-08-25T14:30:00Z"
    }
  }
}
```

### 3.3 Create Revenue Stream

```http
POST /api/v2/revenue/streams
```

**Permission Required**: `REVENUE_ADMIN` or `WORKFLOW_CONFIGURE`

**Request Body**:
```json
{
  "streamCode": "REV-INVEST-001",
  "nameAr": "إيرادات استثمارية - أسهم",
  "nameEn": "Investment Revenue - Equities",
  "revenueType": "INVEST_REV",
  "recognitionMethod": "ACCRUAL",
  "exchangeType": "EXCHANGE",
  "restrictionLevel": "UNRESTRICTED",
  "defaultCurrency": "USD",
  "defaultDebitAccountId": "uuid-bank-usd",
  "defaultCreditAccountId": "uuid-investment-income",
  "isActive": true,
  "allowBatch": true,
  "requiresApproval": true,
  "minAmount": 100.00,
  "maxAmount": 1000000.00,
  "metadata": {
    "instrumentType": "EQUITY",
    "taxTreatment": "DIVIDEND"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "streamCode": "REV-INVEST-001",
    "status": "ACTIVE",
    "createdAt": "2026-08-30T14:30:00Z"
  }
}
```

**Error Codes**:
- `STREAM_CODE_EXISTS` (409) - Duplicate stream code
- `INVALID_ACCOUNTS` (400) - Account IDs not found
- `INSUFFICIENT_PERMISSIONS` (403)

---

## 4. Revenue Records API

### 4.1 List Revenue Records

```http
GET /api/v2/revenue/records
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `status` | RevenueStatus | Filter by status |
| `revenueType` | RevenueTypeCode | Filter by type |
| `projectId` | UUID | Filter by project |
| `activityId` | UUID | Filter by activity |
| `counterpartyId` | UUID | Filter by counterparty |
| `fromDate` | date | Revenue date from |
| `toDate` | date | Revenue date to |
| `currencyCode` | string | Filter by currency |
| `minAmount` | number | Minimum amount |
| `maxAmount` | number | Maximum amount |
| `isRestricted` | boolean | Filter restricted only |
| `streamId` | UUID | Filter by stream |
| `grantId` | UUID | Filter by grant |
| `search` | string | Full-text search |
| `sortBy` | string | Sort field (date, amount, etc.) |
| `sortOrder` | string | ASC or DESC |
| `page` | number | Page number |
| `pageSize` | number | Items per page |

**Example**:
```http
GET /api/v2/revenue/records?status=POSTED&revenueType=GRANT&fromDate=2026-01-01&toDate=2026-12-31&sortBy=amount&sortOrder=DESC&pageSize=50
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "revenueNumber": "REV-2026-00125",
      "revenueType": "GRANT",
      "streamNameAr": "منح مقيدة - تعليم",
      "status": "POSTED",
      "counterpartyName": "UNICEF Yemen",
      "projectCode": "EDU-2026-04",
      "amount": 500000.00,
      "amountBase": 267500000.00,
      "collectedAmount": 500000.00,
      "collectedAmountBase": 267500000.00,
      "currencyCode": "USD",
      "revenueDate": "2026-08-15",
      "recognitionMethod": "DEFERRED",
      "isRestricted": true,
      "grantId": "uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 234,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "totalAmount": 12500000.00,
    "totalCollected": 11200000.00,
    "filters": {...}
  }
}
```

### 4.2 Get Revenue Record Details

```http
GET /api/v2/revenue/records/:id
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "revenueNumber": "REV-2026-00125",
    "revenueType": "GRANT",
    "streamId": "uuid",
    "streamNameAr": "منح مقيدة - تعليم",
    "status": "POSTED",
    "recognitionMethod": "DEFERRED",
    "restrictionLevel": "TEMPORARILY_RESTRICTED",
    "counterparty": {
      "id": "uuid",
      "name": "UNICEF Yemen",
      "type": "MULTILATERAL",
      "country": "YE"
    },
    "project": {
      "id": "uuid",
      "code": "EDU-2026-04",
      "nameAr": "دعم تعليم الأطفال - تعز"
    },
    "activity": {
      "id": "uuid",
      "nameAr": "توزيع حقائب مدرسية"
    },
    "financial": {
      "amount": 500000.00,
      "amountBase": 267500000.00,
      "collectedAmount": 500000.00,
      "collectedAmountBase": 267500000.00,
      "outstandingAmount": 0,
      "currencyCode": "USD",
      "exchangeRate": 535.00
    },
    "deferred": {
      "deferredAmount": 500000.00,
      "recognizedAmount": 150000.00,
      "remainingDeferredAmount": 350000.00,
      "milestoneProgress": 30
    },
    "dates": {
      "revenueDate": "2026-08-15",
      "recognitionDate": "2026-08-20",
      "actualCollectionDate": "2026-08-18"
    },
    "references": {
      "referenceNumber": "UNICEF-2026-AUG-001",
      "bankReference": "TXN-789456123",
      "contractNumber": "EDU-2026-CT-0045"
    },
    "description": "منحة لدعم تعليم الأطفال في محافظة تعز",
    "conditions": {
      "conditionsMet": true,
      "conditionsDetails": "تم استلام خطاب المنحة والموافقة",
      "milestoneProgress": 30
    },
    "approvalLog": [
      {
        "level": 1,
        "approverName": "أحمد المهدري",
        "action": "APPROVE",
        "comments": "موافق بعد مراجعة الوثائق",
        "respondedAt": "2026-08-16T10:30:00Z"
      },
      {
        "level": 2,
        "approverName": "محمد الحضرمي",
        "action": "APPROVE",
        "comments": "اعتمد",
        "respondedAt": "2026-08-16T14:20:00Z"
      }
    ],
    "schedules": [
      {
        "id": "uuid",
        "scheduleNumber": 1,
        "scheduledDate": "2026-08-15",
        "scheduledAmount": 200000.00,
        "status": "PAID",
        "actualDate": "2026-08-15"
      },
      {
        "id": "uuid",
        "scheduleNumber": 2,
        "scheduledDate": "2026-11-15",
        "scheduledAmount": 150000.00,
        "status": "PENDING"
      }
    ],
    "syncStatus": {
      "ledgerSynced": true,
      "budgetSynced": true,
      "grantSynced": true,
      "allSynced": true
    },
    "attachments": [
      {
        "id": "uuid",
        "fileName": "grant-agreement.pdf",
        "url": "/files/...",
        "size": 245678
      }
    ],
    "audit": {
      "createdById": "uuid",
      "createdByName": "سعيد العولقي",
      "createdAt": "2026-08-15T08:00:00Z",
      "approvedByName": "محمد الحضرمي",
      "approvedAt": "2026-08-16T14:20:00Z",
      "postedByName": "فاطمة الحضرمية",
      "postedAt": "2026-08-18T09:15:00Z"
    }
  }
}
```

### 4.3 Create Revenue Record

```http
POST /api/v2/revenue/records
```

**Permission Required**: `REVENUE_CREATE`

**Request Body** (Cash Donation Example):
```json
{
  "revenueType": "CASH_DON",
  "streamId": "uuid",
  "counterpartyName": "أحمد محمد",
  "counterpartyType": "INDIVIDUAL",
  "counterpartyEmail": "ahmed@example.com",
  "projectId": "uuid-optional",
  "amount": 50000.00,
  "currencyCode": "YER",
  "exchangeRate": 1.00,
  "revenueDate": "2026-08-30",
  "description": "تبرع لدعم الأيتام",
  "referenceNumber": "REF-2026-001",
  "metadata": {
    "donorSegment": "REGULAR",
    "campaignCode": "RAMADAN-2026",
    "giftAidEligible": false
  }
}
```

**Request Body** (Grant with Schedule):
```json
{
  "revenueType": "GRANT",
  "streamId": "uuid-grant-stream",
  "counterpartyName": "World Bank",
  "counterpartyType": "MULTILATERAL",
  "projectId": "uuid-project",
  "activityId": "uuid-activity",
  "amount": 1000000.00,
  "currencyCode": "USD",
  "exchangeRate": 535.00,
  "revenueDate": "2026-08-30",
  "recognitionMethod": "DEFERRED",
  "restrictionLevel": "TEMPORARILY_RESTRICTED",
  "fundingScheduleType": "INSTALLMENT",
  "grantId": "uuid-grant",
  "conditionsDetails": "صرف على 4 أقساط ربع سنوية",
  "schedules": [
    {
      "scheduledDate": "2026-08-30",
      "scheduledAmount": 250000.00
    },
    {
      "scheduledDate": "2026-11-30",
      "scheduledAmount": 250000.00
    },
    {
      "scheduledDate": "2027-02-28",
      "scheduledAmount": 250000.00
    },
    {
      "scheduledDate": "2027-05-30",
      "scheduledAmount": 250000.00
    }
  ],
  "milestones": [
    {
      "title": "توقيع الاتفاقية",
      "targetDate": "2026-08-15",
      "targetAmount": 250000.00,
      "targetPercentage": 25
    }
  ],
  "description": "منحة لدعم برنامج الصحة الإنجابية",
  "metadata": {
    "sector": "HEALTH",
    "thematicArea": "REPRODUCTIVE_HEALTH"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "revenueNumber": "REV-2026-00126",
    "status": "DRAFT",
    "amount": 1000000.00,
    "amountBase": 535000000.00,
    "recognitionMethod": "DEFERRED",
    "schedulesCreated": 4,
    "milestonesCreated": 1
  }
}
```

### 4.4 Update Revenue Record

```http
PUT /api/v2/revenue/records/:id
```

**Permission Required**: `REVENUE_EDIT` (only DRAFT or PENDING_APPROVAL)

**Request Body** (partial update):
```json
{
  "description": "Updated description",
  "amount": 1050000.00,
  "metadata": {
    "notes": "Adjustment after review"
  }
}
```

**Error Codes**:
- `CANNOT_EDIT` (409) - Status doesn't allow editing
- `AMOUNT_LESS_THAN_COLLECTED` (400) - New amount < already collected
- `OPTIMISTIC_LOCK_FAILED` (409) - Concurrent modification

### 4.5 Workflow Actions

#### 4.5.1 Submit for Approval

```http
POST /api/v2/revenue/records/:id/submit
```

**Permission Required**: `REVENUE_CREATE` (own record)

**Request Body**:
```json
{
  "comments": "جاهز للاعتماد"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "revenueNumber": "REV-2026-00126",
    "status": "PENDING_APPROVAL",
    "approvalWorkflowId": "uuid-workflow",
    "currentApproverLevel": 1,
    "requiredApprovals": 2,
    "submittedAt": "2026-08-30T15:00:00Z"
  }
}
```

#### 4.5.2 Approve Revenue Record

```http
POST /api/v2/revenue/records/:id/approve
```

**Permission Required**: `REVENUE_APPROVE` (appropriate level)

**Request Body**:
```json
{
  "comments": "موافق",
  "delegatedFromId": "uuid-optional"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "currentApproverLevel": 2,
    "approvalsCollected": 1,
    "approvalsRequired": 2,
    "fullyApproved": false,
    "approvedAt": "2026-08-30T15:30:00Z"
  }
}
```

#### 4.5.3 Reject Revenue Record

```http
POST /api/v2/revenue/records/:id/reject
```

**Permission Required**: `REVENUE_REJECT`

**Request Body**:
```json
{
  "reason": "مبلغ غير مطابق للعقد",
  "comments": "يرجى مراجعة المبلغ"
}
```

#### 4.5.4 Post to Ledger

```http
POST /api/v2/revenue/records/:id/post
```

**Permission Required**: `BATCH_POST` or `REVENUE_POST`

**Request Body**:
```json
{
  "postDate": "2026-08-30",
  "fiscalYearId": "uuid",
  "generateSubEntries": false,
  "overrideDeferral": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "revenueNumber": "REV-2026-00126",
    "status": "POSTED",
    "postedAt": "2026-08-30T16:00:00Z",
    "journalEntryId": "uuid",
    "journalEntryNumber": "JE-2026-00045",
    "ledgerLines": [
      {
        "accountCode": "1101-USD",
        "accountNameAr": "البنك - دولار أمريكي",
        "debit": 500000.00,
        "credit": 0,
        "projectId": "uuid"
      },
      {
        "accountCode": "2401",
        "accountNameAr": "إيرادات مؤجلة - منح",
        "debit": 0,
        "credit": 500000.00
      }
    ]
  }
}
```

#### 4.5.5 Record Collection

```http
POST /api/v2/revenue/records/:id/collect
```

**Permission Required**: `REVENUE_COLLECT`

**Request Body**:
```json
{
  "amount": 250000.00,
  "currencyCode": "USD",
  "exchangeRate": 535.00,
  "paymentMethod": "BANK_TRANSFER",
  "paymentReference": "TXN-987654",
  "bankAccountId": "uuid",
  "collectionDate": "2026-08-30",
  "scheduleId": "uuid-schedule-optional",
  "notes": "تحصيل القسط الأول"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "revenueId": "uuid",
    "collectionId": "uuid",
    "collectedAmount": 250000.00,
    "collectedAmountBase": 133750000.00,
    "totalCollected": 250000.00,
    "totalCollectedBase": 133750000.00,
    "outstandingAmount": 750000.00,
    "status": "PARTIALLY_COLLECTED",
    "scheduleStatus": "PAID",
    "journalEntryId": "uuid",
    "syncedTo": ["LEDGER", "BUDGET", "GRANT"]
  }
}
```

#### 4.5.6 Recognize Deferred Revenue

```http
POST /api/v2/revenue/records/:id/recognize
```

**Permission Required**: `REVENUE_COLLECT` or specific recognition permission

**Request Body**:
```json
{
  "recognitionAmount": 100000.00,
  "recognitionDate": "2026-08-30",
  "milestoneId": "uuid-optional",
  "conditionEvidence": "Milestone achieved: Q1 training completed",
  "recognitionMethod": "MILESTONE_BASED"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "recognizedAmount": 100000.00,
    "totalRecognized": 100000.00,
    "remainingDeferred": 400000.00,
    "milestoneProgress": 20,
    "journalEntryId": "uuid"
  }
}
```

#### 4.5.7 Void Revenue Record

```http
POST /api/v2/revenue/records/:id/void
```

**Permission Required**: `REVENUE_VOID`

**Request Body**:
```json
{
  "reason": "إلغاء بسبب خطأ في التسجيل",
  "reverseLedgerEntries": true
}
```

---

## 5. Batch Revenue API

### 5.1 List Batches

```http
GET /api/v2/revenue/batches
```

**Query Parameters**:
- `status`, `fromDate`, `toDate`, `createdById`, `search`, pagination

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "batchNumber": "BATCH-REV-2026-001",
      "status": "APPROVED",
      "totalDebit": 500000.00,
      "totalCredit": 500000.00,
      "isBalanced": true,
      "entryCount": 12,
      "currencyCode": "YER",
      "batchDate": "2026-08-30",
      "createdByName": "سعيد العولقي",
      "createdAt": "2026-08-30T14:00:00Z"
    }
  ]
}
```

### 5.2 Get Batch with Entries

```http
GET /api/v2/revenue/batches/:id
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "batchNumber": "BATCH-REV-2026-001",
    "status": "DRAFT",
    "totalDebit": 1500000.00,
    "totalCredit": 1500000.00,
    "isBalanced": true,
    "entryCount": 8,
    "currencyCode": "YER",
    "batchDate": "2026-08-30",
    "description": "دفعة تحصيلات أغسطس 2026",
    "entries": [
      {
        "id": "uuid",
        "sequenceNumber": 1,
        "accountCode": "1101-YER",
        "accountNameAr": "البنك المركزي - ريال يمني",
        "debit": 800000.00,
        "credit": 0,
        "projectCode": "EDU-2026-04",
        "lineDescription": "تحصيل منح تعليم"
      },
      {
        "id": "uuid",
        "sequenceNumber": 2,
        "accountCode": "4101",
        "accountNameAr": "إيرادات منح - تعليم",
        "debit": 0,
        "credit": 800000.00,
        "projectCode": "EDU-2026-04"
      }
    ],
    "approvalChain": [
      {
        "level": 1,
        "approverName": "محمد الحضرمي",
        "status": "PENDING"
      },
      {
        "level": 2,
        "approverName": "فاطمة الحضرمية",
        "status": "PENDING"
      }
    ],
    "validationErrors": []
  }
}
```

### 5.3 Create Batch

```http
POST /api/v2/revenue/batches
```

**Permission Required**: `BATCH_CREATE`

**Request Body**:
```json
{
  "batchDate": "2026-08-30",
  "currencyCode": "YER",
  "exchangeRate": 1.00,
  "description": "دفعة تحصيلات أغسطس 2026 - منح وتعليم",
  "applyFundingCap": true,
  "fundingCapId": "uuid-optional",
  "entries": [
    {
      "accountId": "uuid-bank-account",
      "debit": 800000.00,
      "credit": 0,
      "projectId": "uuid-project-1",
      "activityId": "uuid-activity-1",
      "counterpartyId": "uuid-counterparty-1",
      "description": "تحصيل منح تعليم - أغسطس",
      "revenueRecordId": "uuid-optional"
    },
    {
      "accountId": "uuid-revenue-account",
      "debit": 0,
      "credit": 800000.00,
      "projectId": "uuid-project-1",
      "description": "إيراد منح - تعليم"
    },
    {
      "accountId": "uuid-bank-account",
      "debit": 400000.00,
      "credit": 0,
      "projectId": "uuid-project-2",
      "description": "تحصيل منح صحة"
    },
    {
      "accountId": "uuid-revenue-account-2",
      "debit": 0,
      "credit": 400000.00,
      "projectId": "uuid-project-2",
      "description": "إيراد منح - صحة"
    },
    {
      "accountId": "uuid-bank-account",
      "debit": 300000.00,
      "credit": 0,
      "description": "تحصيل تبرعات نقدية عامة"
    },
    {
      "accountId": "uuid-donation-revenue",
      "debit": 0,
      "credit": 300000.00,
      "description": "إيرادات تبرعات عامة"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "batchNumber": "BATCH-REV-2026-001",
    "status": "DRAFT",
    "totalDebit": 1500000.00,
    "totalCredit": 1500000.00,
    "isBalanced": true,
    "entryCount": 6,
    "validationErrors": [],
    "warnings": [
      "تم تطبيق سقف التمويل: متبقي 200,000 من السقف"
    ]
  }
}
```

**Validation Error Response** (400):
```json
{
  "success": false,
  "error": {
    "code": "BATCH_NOT_BALANCED",
    "message": "Batch is not balanced: Debit 1500000.00 != Credit 1499000.00",
    "details": {
      "totalDebit": 1500000.00,
      "totalCredit": 1499000.00,
      "difference": 1000.00
    }
  }
}
```

### 5.4 Validate Batch

```http
POST /api/v2/revenue/batches/:id/validate
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "isBalanced": true,
    "errors": [],
    "warnings": [
      {
        "code": "HIGH_CONCENTRATION",
        "message": "75% من الدفعة من مشروع واحد",
        "severity": "WARNING"
      }
    ]
  }
}
```

### 5.5 Submit Batch for Approval

```http
POST /api/v2/revenue/batches/:id/submit
```

### 5.6 Approve Batch

```http
POST /api/v2/revenue/batches/:id/approve
```

**Request Body**:
```json
{
  "comments": "موافق",
  "level": 1
}
```

### 5.7 Post Batch to Ledger

```http
POST /api/v2/revenue/batches/:id/post
```

**Permission Required**: `BATCH_POST`

**Request Body**:
```json
{
  "postDate": "2026-08-30",
  "fiscalYearId": "uuid",
  "journalDescription": "دفعة تحصيلات أغسطس 2026",
  "generateSubEntries": false,
  "updateLinkedRecords": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "batchId": "uuid",
    "batchNumber": "BATCH-REV-2026-001",
    "status": "POSTED",
    "postedEntries": 6,
    "journalEntryId": "uuid",
    "journalEntryNumber": "JE-2026-00050",
    "postedAt": "2026-08-30T16:30:00Z",
    "ledgerEntries": [
      {
        "accountCode": "1101-YER",
        "debit": 1500000.00,
        "credit": 0,
        "projectCode": null
      },
      {
        "accountCode": "4101",
        "debit": 0,
        "credit": 800000.00,
        "projectCode": "EDU-2026-04"
      },
      {
        "accountCode": "4201",
        "debit": 0,
        "credit": 400000.00,
        "projectCode": "HEAL-2026-02"
      },
      {
        "accountCode": "4301",
        "debit": 0,
        "credit": 300000.00,
        "projectCode": null
      }
    ],
    "revenueRecordsUpdated": 5
  }
}
```

### 5.8 Void Batch

```http
POST /api/v2/revenue/batches/:id/void
```

---

## 6. Revenue Schedules API

### 6.1 List Schedules

```http
GET /api/v2/revenue/schedules
```

**Query Parameters**:
- `revenueRecordId`, `status`, `fromDate`, `toDate`, `overdueOnly`, pagination

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "revenueNumber": "REV-2026-00125",
      "scheduleNumber": 2,
      "scheduledDate": "2026-09-15",
      "scheduledAmount": 150000.00,
      "currencyCode": "USD",
      "status": "DUE",
      "daysUntilDue": 16,
      "conditionMet": true
    }
  ]
}
```

### 6.2 Create Schedule

```http
POST /api/v2/revenue/schedules
```

### 6.3 Verify Condition/Milestone

```http
POST /api/v2/revenue/schedules/:id/verify-condition
```

**Request Body**:
```json
{
  "conditionMet": true,
  "evidenceUrl": "/files/evidence-12345.pdf",
  "notes": "تم إنجاز المعالم المطلوبة"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scheduleId": "uuid",
    "conditionMet": true,
    "verifiedByName": "محمد الحضرمي",
    "verifiedAt": "2026-08-30T17:00:00Z",
    "eligibleForPayment": true
  }
}
```

### 6.4 Process Scheduled Payment

```http
POST /api/v2/revenue/schedules/:id/process-payment
```

**Request Body**:
```json
{
  "actualAmount": 150000.00,
  "paymentMethod": "BANK_TRANSFER",
  "bankAccountId": "uuid",
  "paymentReference": "TXN-789456",
  "paymentDate": "2026-08-30"
}
```

---

## 7. Funding Caps API

### 7.1 List Funding Caps

```http
GET /api/v2/revenue/caps
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "capNumber": "CAP-2026-001",
      "fundingSourceName": "UNICEF Yemen",
      "projectCode": "EDU-2026-04",
      "totalCapAmount": 1000000.00,
      "totalCapAmountBase": 535000000.00,
      "spentAmount": 750000.00,
      "remainingAmount": 250000.00,
      "utilizationPercent": 75.0,
      "currencyCode": "USD",
      "effectiveFrom": "2026-01-01",
      "effectiveTo": "2026-12-31",
      "isActive": true,
      "alertTriggered": false
    }
  ]
}
```

### 7.2 Create Funding Cap

```http
POST /api/v2/revenue/caps
```

**Permission Required**: `FUNDING_CAP_CREATE`

**Request Body**:
```json
{
  "capNumber": "CAP-2026-005",
  "fundingSourceId": "uuid",
  "donorId": "uuid-unicef",
  "projectId": "uuid-project",
  "revenueType": "GRANT",
  "totalCapAmount": 500000.00,
  "currencyCode": "USD",
  "effectiveFrom": "2026-09-01",
  "effectiveTo": "2026-12-31",
  "alertThresholdPercent": 80,
  "alertRecipients": ["uuid-cfo", "uuid-finance-manager"],
  "allowsOverrun": false
}
```

### 7.3 Check Cap

```http
POST /api/v2/revenue/caps/:id/check
```

**Request Body**:
```json
{
  "amount": 100000.00,
  "currencyCode": "USD"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "withinCap": true,
    "available": 250000.00,
    "remaining": 150000.00,
    "utilizationAfter": 90.0,
    "alertTriggered": true,
    "alertMessage": "سيتم تجاوز 90% من السقف بعد هذه العملية"
  }
}
```

### 7.4 Get Cap Utilization Report

```http
GET /api/v2/revenue/caps/:id/utilization
```

**Response**:
```json
{
  "success": true,
  "data": {
    "capId": "uuid",
    "capNumber": "CAP-2026-001",
    "totalCap": 1000000.00,
    "spent": 750000.00,
    "reserved": 50000.00,
    "available": 200000.00,
    "utilizationPercent": 75.0,
    "breakdown": {
      "byProject": [
        {
          "projectCode": "EDU-2026-04",
          "spent": 750000.00,
          "percent": 75.0
        }
      ],
      "byRevenueType": [
        {
          "type": "GRANT",
          "spent": 750000.00,
          "percent": 75.0
        }
      ]
    },
    "history": [
      {
        "date": "2026-08-01",
        "spent": 500000.00,
        "utilization": 50.0
      },
      {
        "date": "2026-08-30",
        "spent": 750000.00,
        "utilization": 75.0
      }
    ]
  }
}
```

---

## 8. Intelligence & Analytics API

### 8.1 Get Intelligence Snapshot

```http
GET /api/v2/revenue/intelligence/snapshot
```

**Query Parameters**:
- `period` (default 'CURRENT_MONTH')
- `asOfDate`
- `includeAnomalies` (default true)
- `includeForecast` (default true)

**Response**:
```json
{
  "success": true,
  "data": {
    "kpis": {
      "recordCount": 234,
      "totalRecognized": 12500000.00,
      "totalCollected": 11200000.00,
      "totalOutstanding": 1300000.00,
      "totalDeferred": 3500000.00,
      "collectionRatePct": 89.6,
      "recognitionRatePct": 78.1,
      "concentrationTop10Pct": 68.5,
      "averageTransactionSize": 53418.80,
      "recurringRevenuePct": 45.2,
      "avgDaysToCollect": 12.5,
      "onTimeCollectionPct": 87.3
    },
    "breakdowns": {
      "byType": [
        {
          "revenueType": "GRANT",
          "typeNameAr": "منح",
          "recordCount": 45,
          "totalAmount": 7500000.00,
          "collectionRate": 92.5,
          "percentageOfTotal": 60.0,
          "growthPct": 15.3
        },
        {
          "revenueType": "CASH_DON",
          "recordCount": 120,
          "totalAmount": 2500000.00,
          "collectionRate": 95.0,
          "percentageOfTotal": 20.0,
          "growthPct": 8.7
        }
      ],
      "byProject": [...],
      "byCounterparty": [...],
      "byMonth": [
        {
          "month": "2026-01",
          "totalAmount": 850000.00,
          "growthPct": null,
          "cumulativeAmount": 850000.00
        },
        {
          "month": "2026-08",
          "totalAmount": 1850000.00,
          "growthPct": 12.5,
          "cumulativeAmount": 12500000.00
        }
      ]
    },
    "forecast": {
      "historicalPeriodMonths": 12,
      "periods": [
        {
          "period": "2026-09",
          "predicted": 1920000.00,
          "confidenceLow": 1750000.00,
          "confidenceHigh": 2090000.00,
          "isActual": false
        },
        {
          "period": "2026-10",
          "predicted": 1985000.00,
          "confidenceLow": 1780000.00,
          "confidenceHigh": 2190000.00,
          "isActual": false
        },
        {
          "period": "2026-11",
          "predicted": 2050000.00,
          "confidenceLow": 1820000.00,
          "confidenceHigh": 2280000.00,
          "isActual": false
        }
      ],
      "totalPredicted": 5955000.00,
      "confidence": "HIGH",
      "confidenceScore": 0.87,
      "methodology": "SEASONAL_DECOMPOSITION",
      "factors": {
        "seasonality": true,
        "trend": "INCREASING",
        "cyclicality": "WEAK"
      }
    },
    "anomalies": [
      {
        "id": "uuid",
        "type": "CONCENTRATION_RISK",
        "severity": "HIGH",
        "title": "مخاطر تركّز الإيرادات",
        "description": "68.5% من الإيرادات تأتي من 10 جهات فقط",
        "recommendation": "تنويع مصادر الإيرادات لتقليل المخاطر",
        "detectedAt": "2026-08-30T00:00:00Z",
        "status": "NEW"
      },
      {
        "id": "uuid",
        "type": "AMOUNT_SPIKE",
        "severity": "MEDIUM",
        "title": "ارتفاع غير معتاد في الإيرادات",
        "description": "إيرادات أغسطس أعلى بـ 45% من المتوسط التاريخي",
        "recommendation": "مراجعة مصادر هذه الزيادة",
        "expectedValue": 1100000.00,
        "actualValue": 1850000.00,
        "deviationPct": 68.2,
        "detectedAt": "2026-08-30T00:00:00Z",
        "status": "INVESTIGATING"
      }
    ],
    "insights": [
      {
        "category": "OPPORTUNITY",
        "priority": "HIGH",
        "titleAr": "فرصة نمو في إيرادات الخدمات",
        "titleEn": "Service revenue growth opportunity",
        "descriptionAr": "إيرادات الخدمات تنمو بنسبة 23% شهرياً - يُنصح بالتوسع",
        "descriptionEn": "Service revenue growing 23% monthly - consider expansion",
        "actionItems": [
          "دراسة جدوى التوسع في خدمات الاستشارات",
          "توظيف كوادر إضافية",
          "تطوير باقات خدمات جديدة"
        ]
      },
      {
        "category": "RISK",
        "priority": "HIGH",
        "titleAr": "مخاطر تركّز الممولين",
        "titleEn": "Donor concentration risk",
        "descriptionAr": "75% من الإيرادات من 3 ممولين كبار - مخاطر عالية",
        "actionItems": [
          "تطوير استراتيجية تنويع",
          "البحث عن ممولين جدد",
          "تعزيز العلاقات مع الممولين الحاليين"
        ]
      }
    ],
    "generatedAt": "2026-08-30T14:30:00Z",
    "expiresAt": "2026-08-31T14:30:00Z"
  }
}
```

### 8.2 Get Forecast Only

```http
GET /api/v2/revenue/intelligence/forecast?periods=6
```

### 8.3 Get Anomalies

```http
GET /api/v2/revenue/intelligence/anomalies
```

**Query Parameters**:
- `severity`, `status`, `type`, `fromDate`, `toDate`

### 8.4 Acknowledge Anomaly

```http
POST /api/v2/revenue/intelligence/anomalies/:id/acknowledge
```

**Request Body**:
```json
{
  "comments": "قيد المراجعة",
  "assignToUserId": "uuid-optional"
}
```

---

## 9. Reports API

### 9.1 Detailed Report

```http
GET /api/v2/revenue/reports/detailed
```

**Query Parameters**: Standard filters (dateRange, types, projects, etc.)

**Response**: Array of detailed revenue records with all fields

### 9.2 Summary Report

```http
GET /api/v2/revenue/reports/summary
```

**Response**:
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2026-01-01",
      "to": "2026-08-30"
    },
    "summary": {
      "totalRevenue": 12500000.00,
      "totalCollected": 11200000.00,
      "totalDeferred": 3500000.00,
      "totalOutstanding": 1300000.00,
      "recordCount": 234,
      "collectionRate": 89.6
    },
    "byType": [...],
    "byProject": [...],
    "byCounterparty": [...],
    "byMonth": [...]
  }
}
```

### 9.3 Analytical Report

```http
GET /api/v2/revenue/reports/analytical
```

Includes: trend analysis, YoY comparisons, variance analysis, ratios

### 9.4 Evaluative Report (Performance Evaluation)

```http
GET /api/v2/revenue/reports/evaluative
```

Includes: KPI scoring, target vs actual, performance grading

### 9.5 BI Dashboard Data

```http
GET /api/v2/revenue/reports/bi
```

**Response**: Optimized for dashboard rendering with pre-aggregated data

### 9.6 Export Report

```http
GET /api/v2/revenue/reports/export?format=excel&reportType=detailed&fromDate=2026-01-01
```

**Response**: Binary file download (Excel/CSV/PDF)

---

## 10. Integration Endpoints

### 10.1 Link Revenue to Ledger

```http
POST /api/v2/revenue/integration/ledger/link
```

**Request Body**:
```json
{
  "revenueRecordId": "uuid",
  "journalEntryId": "uuid",
  "amount": 500000.00,
  "amountType": "RECOGNITION"
}
```

### 10.2 Link Revenue to Grant

```http
POST /api/v2/revenue/integration/grants/link
```

### 10.3 Link Revenue to Endowment

```http
POST /api/v2/revenue/integration/endowment/link
```

### 10.4 Link Revenue to Budget

```http
POST /api/v2/revenue/integration/budget/link
```

### 10.5 Get Sync Status

```http
GET /api/v2/revenue/integration/sync-status/:revenueRecordId
```

---

## 11. Workflow Management API

### 11.1 List Approval Workflows

```http
GET /api/v2/revenue/workflows
```

### 11.2 Create Workflow

```http
POST /api/v2/revenue/workflows
```

**Request Body**:
```json
{
  "nameAr": "سير عمل اعتماد المنح",
  "nameEn": "Grant Approval Workflow",
  "triggers": [
    {
      "triggerType": "REVENUE_TYPE",
      "revenueTypes": ["GRANT", "COND_FUND", "PARTIAL_FUND", "MULTIYEAR_FUND"],
      "operator": "OR"
    }
  ],
  "approvalChain": [
    {
      "level": 1,
      "roleId": "uuid-finance-officer",
      "roleNameAr": "ضابط مالي",
      "allowsDelegation": true,
      "delegationRoleIds": ["uuid-finance-manager"]
    },
    {
      "level": 2,
      "roleId": "uuid-finance-manager",
      "roleNameAr": "مدير مالي",
      "minAmount": 10000,
      "timeLimitHours": 48,
      "escalationRoleId": "uuid-cfo",
      "allowsDelegation": false
    },
    {
      "level": 3,
      "roleId": "uuid-cfo",
      "roleNameAr": "المدير المالي",
      "minAmount": 50000,
      "timeLimitHours": 24,
      "allowsDelegation": false
    }
  ],
  "allowBypass": false,
  "isActive": true
}
```

---

## 12. Error Codes Reference

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | No valid session/token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `BATCH_NOT_BALANCED` | 400 | Batch debit != credit |
| `AMOUNT_EXCEEDS_CAP` | 422 | Funding cap exceeded |
| `INVALID_STATUS_TRANSITION` | 409 | Status transition not allowed |
| `AMOUNT_LESS_THAN_COLLECTED` | 400 | Trying to reduce below collected |
| `ACCOUNT_INACTIVE` | 422 | Account is inactive |
| `CURRENCY_MISMATCH` | 400 | Currency conversion issue |
| `FISCAL_YEAR_CLOSED` | 422 | Cannot post to closed year |
| `OPTIMISTIC_LOCK` | 409 | Concurrent modification detected |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 13. Rate Limiting & Caching

```typescript
// Rate Limits
const RATE_LIMITS = {
  'GET /api/v2/revenue/records': '100 req/min per user',
  'POST /api/v2/revenue/records': '30 req/min per user',
  'POST /api/v2/revenue/batches': '10 req/min per user',
  'POST /api/v2/revenue/records/:id/post': '20 req/min per user',
  'GET /api/v2/revenue/intelligence/*': '60 req/min per user',
};

// Cache Durations
const CACHE_DURATIONS = {
  'streams': '15 minutes',
  'kpis': '5 minutes',
  'forecast': '1 hour',
  'anomalies': '10 minutes',
  'intelligence/snapshot': '15 minutes',
};
```

---

**Document Version**: 1.0.0  
**Total Endpoints**: 60+  
**Last Updated**: 2026-08-30
