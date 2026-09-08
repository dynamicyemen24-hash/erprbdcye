# UAMEX ERP™ — Security Architecture & Threat Model

> **الإصدار:** 1.0.0 (2026-09-03)
> **المرجعية:** NIST CSF 2.0 / NIST ZTA / ISO 27001 / OWASP ASVS & API Top 10 / SOC 2 / CIS Controls

---

## 1. مبادئ الأمان الأساسية

1. **لا ثقة بأي حدود (Zero Trust)**: تُقيَّم كل طلب على الخادم — بغض النظر عن المصدر (UI، مباشر، cron، webhook).
2. **Deny by Default**: أي طلب لا يحمل هوية + صلاحية + ملكية مؤسسة = رفض (401/403/404).
3. **فشل مغلق (Fail-Closed)**: أي خطأ في التحقق (DB متوقف، token تالف، استثناء) = رفض، وليس تجاوز الحماية.
4. **أقل امتياز**: لا دور يملك أكثر مما يحتاجه عمله.
5. **العزل الصارم بين المؤسسات**: لا يوجد مسار في النظام يسمح لمؤسسة بالوصول لبيانات أخرى.
6. **العميل غير موثوق**: جميع ضوابط الـ UI هي ضوابط سهولة استخدام فقط — الأمان كله في الخادم.

---

## 2. حدود الثقة (Trust Boundaries)

```
[المستخدم/المتصفح] ──► (HTTPS/TLS) ──► [Vercel/Edge Security Headers]
                                          │
                                          ▼
                                  [Express Server (Render/Railway)]
                                          │
                                          ▼
                                 [Authentication Middleware (JWT verify)]
                                          │
                                          ▼
                              [Authorization Core (Roles/Permissions)]
                                          │
                                          ▼
                        [Tenant Ownership Check (DB-backed)]
                                          │
                                          ▼
                              [Neon PostgreSQL (pooled TLS)]
```

| الحد | تعامل المدخلات | الوثيقة المرجعية |
|---|---|---|
| HTTP Headers | `authorization`, `content-type`, `x-*` | OWASP ASVS V1.10 |
| JSON Body | `amount`, `status`, `quantity`, `org_id` | OWASP ASVS V4 |
| Query/Path Params | `id`, `table`, `page`, `limit` | OWASP API Top 10 BOLA |
| Uploaded Files | MIME/extension/magic-bytes/ownership | OWASP ASVS V12 |
| Webhook Payloads | signature + nonce + timeout | OWASP API Top 10 SSRF |

---

## 3. نموذج التهديد (Threat Model) — الأولوية الحرجة

| # | التهديد | CATEGORY | حالة التصدير | التحقق |
|---|---|---|---|---|
| T-01 | تفريغ `users`/`audit_logs` عبر `/api/tables/*` (IDOR عابر للمؤسسات) | **CRITICAL** | ✅ مُصلح | `api/tables/*` يرفض الجدولين + إلزام org من التوكن |
| T-02 | انتحال مؤسسة عبر `X-Organization-Id` | **CRITICAL** | ✅ مُصلح | `api/v2/communications` يرفض عدم المطابقة |
| T-03 | بيانات وهمية عند فشل DB في `dashboard-stats` | **HIGH** | ✅ مُصلح | فشل مغلق 503 لا تزييف |
| T-04 | SQL Injection عبر `table`/`orgColumn` | **CRITICAL** | ✅ مُصلح | Allowlist للجداول/الأعمدة في `authorization.core.ts` |
| T-05 | IDOR على الموارد بين المؤسسات | **CRITICAL** | ✅ مُصلح | `verifyOrganizationOwnership` + اختبارات IDOR |
| T-06 | تفجير الصلاحيات (privilege escalation) عبر body | **HIGH** | ✅ مُصلح | `role`/`is_admin` في body يتم تجاهلها — الهوية من التوكن |
| T-07 | تجاوز CSRF | **HIGH** | ✅ مُصلح | `csrf.middleware.ts` + SameSite=Lax |
| T-08 | Brute force على login/refresh | **HIGH** | ✅ مُصلح | `authRateLimiter` + rate limits مخصصة |
| T-09 | XSS عبر الـ DOM/HTML | **HIGH** | ✅ مُصلح | CSP + react escaping + sanitizeInput |
| T-10 | تسريب أسرار في client bundle | **HIGH** | ✅ مُصلح | لا مفاتيح API في الثوابت الأمامية؛ secrets عبر env فقط |

---

## 4. نموذج التفويض (Authorization Model)

### 4.1 المصدر الوحيد للحقيقة

- **الهوية**: JWT موقع من `authenticateToken` middleware (`req.user`).
- **الدور**: حقل `role` في التوكن — يُطابق `SystemRole` enum.
- **المؤسسة**: `org_id` في الـ claims — **لا يُقبل أبداً من الهيدر أو الـ body**.
- **الصلاحية**: `hasPermission(role, permission)` — مصفوفة `PERMISSION_ROLES`.

### 4.2 الأدوار

| الدور | المستوى | صلاحيات رئيسية |
|---|---|---|
| `SUPER_ADMIN` | 5 | كل شيء (عبر النظام) |
| `ORG_ADMIN` | 4 | إدارة المؤسسة بالكامل + audit |
| `HR_MANAGER` | 3 | الموظفون والمستخدمون |
| `FINANCE_MANAGER` | 3 | التحويلات والموافقات على المصروفات |
| `PROJECT_MANAGER` | 3 | المشاريع + الوثائق |
| `VOLUNTEER_MANAGER` | 3 | المتطوعين والمهام |
| `STAFF` | 2 | القراءة/الكتابة للموارد المخصصة |
| `VOLUNTEER` | 2 | موارد الأنشطة المخصصة فقط |
| `READONLY` | 1 | قراءة فقط |

### 4.3 أنواع الصلاحيات (Permissions)

- `resource:read` / `resource:write` / `resource:delete` — عامة
- `org:settings:*` / `org:audit:*` — الإدارة العليا
- `users:*` — HR فقط
- `finance:transactions:*` / `finance:expense:approve` — المالية فقط
- `projects:*` — PM/STAFF
- `documents:*` — HR/FINANCE/PM/STAFF

### 4.4 تدفق التحقق (Middleware Chain)

```
Route Request
    │
    ▼
authenticateToken()          ← يحلل JWT، يضع req.user (401/403 إذا فشل)
    │
    ▼
requirePermission(perm)?     ← يدقق الدور→صلاحية (403 إن لم يملك)
    │
    ▼
verifyOrganizationOwnership  ← استعلام DB: هل resource ∈ org_id؟
    │
    ▼
Policy Engine (إن وُجد)      ← قواعد أعمال المؤسسة
    │
    ▼
Route Handler
```

### 4.5 منع التصعيد (Anti-Escalation)

- تجاهل أي `role`/`is_admin`/`org_id` في body/headers — مصدر الهوية الوحيد هو التوكن.
- `requirePermission` يستخدم `ctx.role` من التوكن لا من الطلب.
- الاختبارات: `'يدمنع STAFF من USERS_WRITE حتى لو جاء body مُزوّر'` ✅ يمر.

---

## 5. عزل البيانات (Tenant Isolation Data Flow)

| الطبقة | الآلية | الدليل |
|---|---|---|
| SQL | `WHERE organization_id = $1` على كل استعلام عبر `/api/tables/*` | `api/tables/[table].ts` |
| SQL | رفض التصدير المباشر لـ `users`/`audit_logs` | Allowlist في `/api/tables/*` |
| SQL | Ownership pre-check قبل كتابة resource | `verifyOrganizationOwnership` |
| Auth | توكن يحمل `org_id` — لا هيدر/spoof | `auth.middleware.ts` |
| Cache | لا يُخزَّن في cache أي resource خاص Tenant | `tableSchemaCache` فقط |
| Queue/Jobs | كل مهمة خلفية تحمل `org_id` في Context | `scheduler.ts` |

### 5.1 حالات العزل المُختبَرة (Regression Tests)

- ✅ `'يمنع عضو في org-a من الوصول لمورد في org-b'`
- ✅ `'الهيدر المزوّر لا يؤثر — false عند مؤسسة مختلفة'`
- ✅ `'يدعم fail-closed عند فشل الاستعلام (خطأ DB)'`
- ✅ `'SQLi TEST: يرفض جدولاً خارجاً عن القائمة البيضاء'`

---

## 6. تصنيف البيانات (Data Classification)

| التصنيف | أمثلة | التخزين | السجلات | التصدير |
|---|---|---|---|---|
| **SENSITIVE** | كلمات مرور، مفاتيح API، JWT | مشفرة (bcrypt/HMAC) | لا تُسجَّل أبداً | ممنوع |
| **RESTRICTED** | بيانات مالية، بيانات شخصية (PII), user IDs | Postgres TLS | سجل وصول مشروط | ممنوع للقراءة-only |
| **INTERNAL** | سجلات الأنشطة، التقارير | Postgres | مرخّص | عرضة للسماح |
| **PUBLIC** | HTML/CSS/JS assets، شعارات | CDN | لا شيء | علني |

### 6.1 ممارسات الخصوصية (Privacy by Design)

- **Minimization**: لا تُرجع واجهات API سوى الحقول اللازمة (allowlist columns).
- **Masking**: لا تظهر تجزئة كلمات المرور أو الرموز الكاملة في أي رد.
- **Retention**: `audit_logs` يُحتفظ بها وفق سياسة المؤسسة؛ السجلات تُدوَّر تلقائياً (`logger.ts`).
- **الوصول**: فقط `ORG_ADMIN`+ يقرأ `audit_logs` عبر الذراع المصرح له.

---

## 7. سجلات الأمن والتدقيق (Audit Trail)

يُسجَّل الأحداث التالية في `audit_logs`:

| الحدث | متى |
|---|---|
| `AUTH_LOGIN_SUCCESS` / `AUTH_LOGIN_FAILED` | عند تسجيل الدخول |
| `AUTH_LOGIN_FAILED` | فشل المصادقة (يتيح كشف brute-force) |
| `AUTH_REFRESH_TOKEN` | تجديد الجلسة |
| `ACTION_CREATE` / `ACTION_UPDATE` / `ACTION_DELETE` | عمليات الـ CRUD الحساسة |
| `EXPORT_DATA` | أي تصدير بيانات |
| `ADMIN_ACTION` | تغيير الأدوار/الإعدادات |
| `PERMISSION_DENIED` | كل رفض صلاحيات |

**مقاومة التعديل**: السجلات في DB مع توقيت + user_id + org_id؛ أي محاولة تعديل متعمدة تترك حفرة في السلسلة الزمنية تُكشف عند المراجعة.

---

## 8. الكشف والاستجابة للحوادث (Detection & Response)

| الإشارة التشخيصية | حدثها | الاستجابة |
|---|---|---|
| تكرر `AUTH_LOGIN_FAILED` (نفس IP) | brute-force | rate-limit + block بعد تجاوز العتبة |
| ارتفاع `PERMISSION_DENIED` من نفس التوكن | enumeration/scan | تنبيه + فحص السلوك |
| محاولات IDOR (404 المتكررة مع resource IDs) | اختراق ملكية | مراجعة السجلات + عزل المستخدم |
| تغيّر مفاجئ في الـ User-Agent/IP لجلسة نشطة | سرقة جلسة | إبطال الجلسات + إلزام MFA |
| تصدير كميات ضخمة دفعةً واحدة | Data exfiltration | تخفيض السرعة + تنبيه |

### 8.1 خطة الاستجابة القياسية (IR Playbook)

1. **اكتشاف**: تحقق من السجلات وقابلية الارتباط (`requestId`, `userId`, `tenantId`).
2. **احتواء**: إبطال الجلسات المشبوهة، وقف أي مفتاح API معرَّض، تفعيل blocklist.
3. **استئصال**: إزالة كود ضار / بيانات ملوثة / إغلاق الثغرة عبر الأثر الأصلي.
4. **استعادة**: إعادة التأسيس من نسخ احتياطية نظيفة (Neon PITR).
5. **دراسة الأثر**: توثيق Root Cause + تحديث الاختبارات الأمنية.

---

## 9. إدارة الأسرار والاعتمادات (Secrets Management)

- **لا أسرار في الكود** — كل الأسرار عبر `process.env` فقط.
- `.env.example` يوثّق المتغيرات المطلوبة مع أمثلة آمنة.
- `JWT_REFRESH_SECRET` مُستمد core بأمان من `jwtSecret` إن لم يُعرّف.
- لا مفاتيح API في الثوابت/الـ client bundle.
- **تدوير الأسرار**: عند الاشتباه بأي تعرض، يُدار ممّا يلي عبر لوحة التحكم:
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `GEMINI_API_KEY`
- لا يُسجَّل أي Secret/Session Token/Khadem في `logger.ts`.

### 9.1 قاعدة: الأسرار HOT-FIX المتوقعة

| الوصف | التصرف |
|---|---|
| Secret في git history | `git filter-repo` + تدوير فوري |
| Secret في client bundle | إزالة فورية + عدم إعادة البناء قبل الحذف |
| Secret في logs | مسح log files + تدوير |

---

## 10. ممارسات التطوير الآمن (Secure Dev Practices)

- **Secure by Design**: كل ميزة جديدة تبدأ بـ deny/private/least-privilege.
- **غياب مسارات مخفية**: لا endpoints بدون مصادقة، ولا واجهات إدارية خفية.
- **الحد الأدنى للإفصاح**: فقط الحقول المصرح بها في الردود.
- **المراجعة الأمنية**: مراجعة الكود الحساس (auth/authz/DB/payments) قبل الدمج.
- **الافتراضات**: عدم افتراض أن أي شيء من العميل موثوق.

### 10.1 Commandments لمطوّري المنصة

1. لا تضيف `org_id` في الـ response body كـ "معلومة" — الخادم يُلصقه.
2. لا تقرأ `req.body.org_id` أبداً. استخدم `req.user.org_id`.
3. لا تستخدم `SELECT *` في أي استعلام مقيّد بالمؤسسة.
4. لا تضع مفاتيح/أسرار في `src/`.
5. كل endpoint حساس يمر عبر `authenticateToken` أولاً.
6. استخدم `queryOne`/`query` مع placeholder params — لا concat SQL.
7. أي استعلام يعتمد على `table` ديناميكي يجب أن يمر عبر allowlist.

---

## 11. اختبارات الانحدار الأمني (Security Regression Suite)

| الملف | يغطي | الحالة |
|---|---|---|
| `src/server/core/__tests__/authorization.test.ts` | منطق الأدوار/الصلاحيات، تحايل client، IDOR، SQLi-allowlist، fail-closed | ✅ 29/29 |
| `src/server/engines/__tests__/engines.test.ts` | AuthEngine, Ledger, Budget, Currency | ✅ |
| `src/server/__tests__/integration.test.ts` | تكامل WBS, search, communications | ✅ |
| `src/lib/__tests__/*.test.ts` | وثائق رسمية | ✅ |

### 11.1 إعادة التشغيل (CI)

```bash
npx vitest run        # جميع الاختبارات (208)
npx tsc --noEmit      # 0 أخطاء
npm run lint          # 0 أخطاء
```

---

## 12. الامتثال المرجعي

| الإطار | أين ينطبق |
|---|---|
| **NIST CSF 2.0** | Govern/Identify/Protect/Detect/Respond/Recover — موزعة على الجداول أعلاه |
| **NIST ZTA** | كل طلب يُقيَّم — لا شبكة داخلية موثوقة |
| **NIST SSDF** | Secure code, dependency check, test security |
| **ISO 27001** | Annex A.9 (access control), A.10 (crypto), A.12 (security ops) |
| **SOC 2** | Common Criteria 6 (access), 7 (operations) |
| **OWASP ASVS** | V1-V14 (architecture, authz, authN, input, crypto, files, API) |
| **OWASP API Top 10** | BOLA #1, Broken Auth #2, Excessive Data #3, MassAssignment #4 |
| **CIS Controls** | 4 (secure config), 5 (accounts), 6 (logs), 16 (incident) |

---

## 13. الحالة المتبقية والتحسينات المستقبلية

| البند | الحالة | الأولوية |
|---|---|---|
| MFA (TOTP/WebAuthn) | متاح كـ `mfaVerified` في `AuthContext` — جاهز للتفعيل | HIGH |
| Siêu MFA/FIDO2 في الـ UI | غير مفعّل بعد | MEDIUM |
| RLS (Row Level Security) كطبقة DB | فهارس organization_id تُفعّل، لكن RLS الأمثل متاح للتوسيع | MEDIUM |
| Webhook signature verification (HMAC) | يُنصح عند تقديم webhooks خارجية | HIGH |
| اختبار أمان السلسلة التوريدية (SBOM) | ✅ `npm audit --audit-level=high` أصبح خطوة CI إجبارية (تم 2026-09-03) | MEDIUM |
| تحويل `verifyOrganizationOwnership` إلى التحقق داخل الاستعلام نفسه (subquery) | تقليل عدد الرحلات | LOW |

---

## 14. سجل ترقية التبعيات الأمنية (Dependency Security Log — 2026-09-03)

| الحزمة | من | إلى | CVE/Advisory | الحالة |
|---|---|---|---|---|
| `xlsx` | `0.18.5` | `0.20.3` (CDN SheetJS الرسمي) | Prototype Pollution (GHSA-4r6h-8v6p-xvw6) + ReDoS (GHSA-5pgg-2g8v-p4x9) | ✅ تم |
| `nanoid` | `3.3.17` | `3.3.18` | Infinite loop on size=0 (GHSA-2v37-7h3g-55p8) | ✅ تم |
| `npm audit` CI gate | — | `--audit-level=high` | يمنع دخول أي High/Critical مستقبلاً | ✅ تم |
| Secret scan CI | — | grep pattern في `src/api/server` | يمنع تسريب مفاتيح/أسرّية | ✅ تم |

**الملاحظة:** 12 Moderate vulnerabilities متبقية (غالباً من `@google-cloud/*`/`firebase-admin`/`teeny-request` transitives) —
لا Fix متاح بدون كسر توافق أو تنظيم حزم. تراقبها CI وتُحدَّث تلقائياً عند توفر إصلاحات.