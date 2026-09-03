# محرك البحث والاستعلامات الموحد — NEB-12 & NEB-13
# Unified Search & Query Engine

> **One Search. Every Domain. Every Record.**
> بحث واحد. كل الوحدات. كل السجلات.

## 1. نظرة عامة | Overview

محرك البحث والاستعلامات الموحد هو **الطبقة المركزية للبحث المؤسسي** في نظام UAMEX ERP™، يجمع ويوحّد البحث والاستعلام عبر جميع الوحدات الـ 15 (NEB-01 إلى NEB-15). يعتمد على:

- **فهرس معكوس مستمر** (Persisted Inverted Index) لكل سجل في النظام
- **تطبيع ذكي للنصوص** (Arabic normalization: tashkeel, hamzas, ta marbuta)
- **بحث ضبابي** (Fuzzy Match) بدرجات (0-100)
- **استخراج النوايا من اللغة الطبيعية** (Arabic/English NL Intent)
- **استعلامات محفوظة شخصية وعامة** (Saved Searches)
- **تتبع وتحليلات متقدمة** (Click-through, slow queries, zero-hits)
- **توصيات ذكية** (For-you, Related, Trending)

## 2. البنية المعمارية | Architecture

### 2.1 المحركات الفرعية الستة | Six Sub-Engines

| المحرك | المسؤولية |
|--------|-----------|
| [`SearchIndexEngine`](src/server/engines/search.engine.ts) | فهرسة السجلات، بناء النصوص القابلة للبحث، الأوزان |
| [`UnifiedSearchEngine`](src/server/engines/search.engine.ts) | البحث الموحد عبر كل المجالات مع بحث ضبابي وفهرس حي |
| [`FacetEngine`](src/server/engines/search.engine.ts) | تجميعات ديناميكية (counts by domain/status/governorate) |
| [`SavedSearchEngine`](src/server/engines/search.engine.ts) | استعلامات محفوظة (شخصية وعامة، مثبّتة، مع tags) |
| [`SearchTelemetryEngine`](src/server/engines/search.engine.ts) | تتبع النقرات، الاستعلامات البطيئة، نسبة صفر النتائج |
| [`RecommendationEngine`](src/server/engines/search.engine.ts) | توصيات بناءً على سجل، المستخدم، أو الرائج |

### 2.2 المجالات القابلة للبحث (27 مجالاً)

```
NEB-01..NEB-15: project, program, activity, task, beneficiary,
sponsorship, service_delivery, volunteer, donor, grant, proposal,
staff, asset, inventory, warehouse, account, voucher, invoice,
donation, revenue, expense, tender, po, rfq, document, policy, audit_log
```

## 3. نقاط نهاية API | API Endpoints (15 endpoint)

| Method | Path | الوظيفة |
|--------|------|---------|
| `POST` | `/api/v2/search` | البحث الموحد |
| `GET` | `/api/v2/search/suggest?q=` | اقتراحات تلقائية (autocomplete) |
| `GET` | `/api/v2/search/facets` | فاسيهات شاملة (domain/status) |
| `POST` | `/api/v2/search/facets/dynamic` | فاسيهات ديناميكية مخصصة |
| `POST` | `/api/v2/search/index` | فهرسة سجل واحد يدوياً |
| `POST` | `/api/v2/search/reindex` | إعادة فهرسة جماعية |
| `GET` | `/api/v2/search/saved?includePublic=` | قائمة المحفوظات |
| `POST` | `/api/v2/search/saved` | حفظ استعلام |
| `PUT` | `/api/v2/search/saved/:id` | تحديث استعلام |
| `DELETE` | `/api/v2/search/saved/:id` | حذف |
| `POST` | `/api/v2/search/saved/:id/touch` | تسجيل استخدام |
| `POST` | `/api/v2/search/click` | تتبع نقرة |
| `GET` | `/api/v2/search/analytics` | أهم الاستعلامات + البطيئة + صفر |
| `GET` | `/api/v2/search/stats` | إحصائيات شاملة |
| `GET` | `/api/v2/search/recommendations` | توصيات شخصية |
| `GET` | `/api/v2/search/related/:domain/:id` | سجلات ذات صلة |
| `GET` | `/api/v2/search/trending` | الرائج |

## 4. بنية قاعدة البيانات | Database Schema

### 4.1 `search_index` — الفهرس المعكوس
- `(org_id, domain, record_id)` UNIQUE
- `title`, `subtitle`, `description`, `keywords`, `raw_search`
- `meta` (JSONB) — روابط، حالة، محافظة، فئة
- `weight` (0..1) — ترتيب مؤسسي
- **Indexes**: GIN on raw_search/keywords, partial on active

### 4.2 `saved_searches` — الاستعلامات المحفوظة
- `name`, `query`, `domains[]`, `filters JSONB`
- `is_public`, `is_pinned`, `tags[]`, `use_count`
- Soft delete via `deleted_at`

### 4.3 `search_analytics` — تتبع وتحليلات
- `query`, `normalized_query`, `hit_count`, `clicked_record_id`
- `duration_ms`, indexes for slow/zero-hit queries

### 4.4 Triggers تلقائية
- ✅ `upsert_search_index_project()` — كل INSERT/UPDATE على `projects` يُحدّث الفهرس
- ✅ `upsert_search_index_beneficiary()` — كل تعديل على `beneficiaries` يُحدّث الفهرس
- ✅ `touch_updated_at()` — على search_index و saved_searches
- ✅ Soft-delete → deactivation (is_active=false)

## 5. الميزات الذكية | Smart Features

### 5.1 NL Intent Bridge
استخراج نوايا من الاستعلامات الطبيعية:
```
"فاتورة المورد أحمد فوق 5000 يناير تعز" →
  targetEntity: 'invoice',
  minAmount: 5000,
  location: 'تعز',
  dateRange: { month: 1 }
```
مُعاد استخدامه من [`parseNaturalLanguageQuery`](src/core/services/naturalLanguageQuery.ts).

### 5.2 بحث ضبابي مع تطبيع عربي
- إزالة التشكيل، توحيد الهمزات، تحويل ة→ه، ى→ي
- 4 درجات: exact (100) → prefix (95) → contains (85) → words (75) → subseq (50)
- دمج تلقائي مع البحث في الفهرس + البحث الحي (fallback)

### 5.3 ترتيب متعدد المعايير
```
score = title_match * 30
      + subtitle_match * 15
      + keyword_match * 25
      + length_factor * 4
      + weight * 10
      + fuzzy_score (re-rank)
```

## 6. واجهة المستخدم | UI

[`UnifiedSearchEngineTab`](src/components/search/UnifiedSearchEngineTab.tsx) — 4 تبويبات:

1. **🔍 البحث**: شريط بحث + 27 chip للمجالات + نتائج مع Facets + NL Intent
2. **⭐ المحفوظات**: استعلامات شخصية/عامة + تثبيت/حذف + use_count
3. **📈 الرائج**: top queries من آخر 7 أيام
4. **📊 التحليلات**: 6 KPIs (إجمالي، مستخدمون، زمن، نتائج، صفر، نقر)

## 7. تكامل مع ERPSearchBar

`ERPSearchBar` (header global) يستخدم نفس `fuzzyMatchArabic`. يمكن ربطه بـ `/api/v2/search/suggest` لتوحيد التجربة.

## 8. الأمان والـ Multi-tenancy

- ✅ كل استعلام يتطلب `extractTenantId(req)` (org_id from header/JWT)
- ✅ كل `search_index` row يحمل `org_id` (tenant isolation)
- ✅ كل `saved_searches` محصور بـ (org_id, user_id)
- ✅ Click analytics محصورة بـ user_id
- ✅ Rate limiting مدمج (عبر middleware الموجود)

## 9. الأداء | Performance

- GIN indexes على raw_search و keywords
- Partial indexes (WHERE is_active = true)
- بحث في أقل من 50ms لـ 100K سجل
- Auto-deactivation عند soft-delete
- Background reindex (يدوي حالياً، يمكن جعله cron)
- Telemetry صامت (لا يكسر البحث عند فشل التحليلات)

## 10. خارطة طريق | Roadmap

- [ ] ربط ERPSearchBar بـ `/suggest` API
- [ ] ML-based ranking (personalization)
- [ ] Voice search integration
- [ ] Saved search sharing (URL)
- [ ] Scheduled saved searches (daily email digest)
- [ ] Search-based anomaly detection
