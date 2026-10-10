# تقييم الشاشة الرئيسية وتجربة المستخدم — UAMEX ERP™ / NexoraOS™

**منهجية التقييم:** Nielsen Norman (10 مبادئ) · ISO 9241-11 (فعالية/كفاءة/رضا) · WCAG 2.2 AA · **SAP Fiori 5 + Fiori 3 Elements** · HEART (قياس)

**النطاق المفحوص (قراءة شيفرة مباشرة):** `src/App.tsx` (1271 سطرًا) · `src/components/dashboard/UnifiedHomeWorkspace.tsx` (667 سطرًا) · `src/components/DashboardView.tsx` · `src/components/GlobalEnterpriseHeader.tsx` · `src/components/UnifiedLeftSidebar.tsx` · `src/components/UpdateBanner.tsx` · `src/components/GlobalOperationalFooter.tsx` · `src/design-system/**` · `src/index.css` · `src/core/updates.ts` · `src/core/types/dashboard.ts` · `src/reports/**` · `e2e/**` · `package.json` · `vite.config.ts`

**النتيجة العامة (5.51 / 10):** النظام يملك بنية تصميمية وأخلاقيات بيانات ممتازة — أُزيلت الأرقام المُلفَّقة عمدًا، وحالات الفراغ/الخطأ/التحميل صريحة، وهناك حارس WCAG ثابت في CI. لكنه يخالف **مبادئ SAP Fiori الأساسية** في العمارة (كثافة التبويبات، غياب التوجيه، التكرار)، ويفشل في **ISO 9241-11 (الكفاءة)** ومبدأ **Fiori "فعل واحد لكل شاشة"**. التطبيق قابل للتغليف المكتبي تقنيًا (PWA + Express حزمة CJS موجودة)، لكنه يتطلب إصلاح **6 عيوب حائمة (P0)** قبل ذلك.

> **ملاحظة منهجية:** كل رقم في هذا التقرير **مقيسة من الشيفرة** (مع سطر مُحدَّد) أو **مُعلَّنة كافتراض** في §7. لم يُشغَّل التطبيق بصريًا؛ التقييم audit-based لا perception-based.

---

## 1) بطاقة التقييم Executive Scorecard

| المحور | المعيار المرجعي | الوزن | الدرجة | المرجّح | الحكم |
|---|---|---|---|---|---|
| سرعة إنجاز المهام (الوصول للمعلومات) | ISO 9241-11 Efficiency | 15% | 4.0 | 0.60 | ⚠️ يحتاج إصلاحًا بنيويًا |
| بنية المعلومات والتنقل | Nielsen #1,#4,#5 + Fiori Consistent/Predictable | 15% | 3.5 | 0.53 | ⚠️ |
| تصميم الشاشة الرئيسية | Fiori Overview Page + «فعل واحد» | 15% | 6.0 | 0.90 | ✅ مقبول مع مُدخلات |
| إمكانية الوصول | WCAG 2.2 AA | 15% | 7.5 | 1.13 | ✅ قوية (مع فجوة اللون فقط) |
| الهوية ونظام الثيم | AGENTS.md + Fiori Consistent | 10% | 8.0 | 0.80 | ✅ |
| i18n و RTL | ISO 9241-176 / Fiori | 10% | 5.5 | 0.55 | ⚠️ |
| الموثوقية والإصدق التشغيلي | Trust / Data Integrity | 10% | 4.5 | 0.45 | ❌ |
| الأداء والأوزان | Core Web Vitals + ISO 9241-11 | 10% | 5.5 | 0.55 | ⚠️ |
| **الإجمالي** | | **100%** | | **5.51 / 10** | **جيد التأسيس، ضعيف الصقل** |

> **الحكم الاستشاري:** النظام **جاهز للتشغيل كويب/PWA لكنه غير جاهز للتغليف المكتبي (Desktop)**. عيوب P0 (نسخة وهمية على نطاق وهمي، عملة € في تقرير مالي، مؤشرات صحة مشتقّة من truthiness) تضرّ بالمصداقية أكثر مما تضرّ بالأداء، ويجب إصلاحها قبل أي خطوة تغليف.

---

## 2) نقاط القوة الاستثنائية (يجب الحفاظ عليها)

| # | القوة | الدليل | المعيار المغطّى |
|---|---|---|---|
| S1 | **لا بيانات مُلفَّقة إطلاقًا** — الأرقام من مصادر حيّة فقط، والمفقود يُعرض كـ Empty/Error صريح | `UnifiedHomeWorkspace.tsx:20-29` · `MetricTile.tsx:11` · git `144bfb3 fix(truth)` | Trust / Data Integrity |
| S2 | **حارس WCAG 2.2 ثابت في CI** يستشهد بمعيار النجاح داخل كل اختبار | `design-system/__tests__/accessibility-conformance.test.ts` | WCAG 2.2 AA |
| S3 | **حلقة تركيز عامة في `@layer base`** تغطي 863 زرًا و413 حقلًا دون تعديل أي `.tsx` | `index.css:60-91` + `bundle-budget.test.ts:48` | WCAG 2.4.7 |
| S4 | **حارس ميزانية الحزمة** يمنع عودة 1MB من مكتبات PDF إلى المسار الحرج | `bundle-budget.test.ts:58-68` | ISO 9241-11 |
| S5 | **قواعد تصميم مستقلة عن المستأجر** — استبدال لون المستأجر ينتشر بلا لمس كود | `tokens.css:13-18` + `@theme` في `index.css` | Fiori *Consistent* / White-Label |
| S6 | **تخطيط منطقة رئيسية ثابت** `h-screen max-h-screen overflow-hidden` + تمرير داخلي | `App.tsx:725,893` | ISO 9241-11 (ثبات العرض) |
| S7 | **معلَم `<main id="main-content">`** صحيح مع skip-link فعّال ينقل التركيز برمجيًا | `App.tsx:848` · `AccessibilityProvider.tsx:53-60` | WCAG 2.4.1 |
| S8 | **اختصارات لوحية موحّدة** (Ctrl+K/S/P/E/L، Alt+M) عبر النظام | `EnterpriseMenuStrip.tsx:96-121` · `ERPSearchBar.tsx:195` | Nielsen #4 |
| S9 | **ثلاثة أنظمة كثافة** (compact/comfortable/spacious) عبر متغيرات CSS | `index.css` `[data-density]` | ISO 9241-1 |
| S10 | **حالات تحميل/خطأ/فراغ صريحة في كل بطاقة** مع Skeleton مطابق للشكل | `UnifiedHomeWorkspace.tsx:185,471,602` · `EmptyState` ×4 | Nielsen #5 · Fiori *Predictable* |
| S11 | **`prefers-reduced-motion` مُنفَّذ في ثلاث طبقات** + `AccessibilityProvider` | `animations.css:180` · `AccessibilityProvider.tsx:38` | WCAG 2.3.3 |
| S12 | **`scope="col"` إجباري عبر CI** لكل `<th>` بقارئ JSX واعٍ للأقواس | `accessibility-conformance.test.ts:110-140` | WCAG 1.3.1 |
---

## 3) سجل العيوب المرتَّب بالخطورة (Defect Register)
### P0 — حائمة (تمنع التغليف المكتبي أو تضرّ بالمصداقية التشغيلية)

| # | العيب | الموقع الدقيق | الأثر على المستخدم | المعيار | الإصلاح المطلوب |
|---|---|---|---|---|---|
| **P0-1** | **شريط تحديث وهمي على نطاق وهمي**: يستدعي `https://example.com/ua-mex/latestVersion.json` دائمًا فيفشل، ثم يعرض ثابتًا `"You're up to date · v4.0.0"` داخل حاوية `fixed top-0 left-0 right-0 z-50 p-4 shadow-lg` تغطي الترويسة، بنص إنجليزي دائمًا. لا يمكن إخفاؤه: `setShow(true)` يُنفَّذ بغض النظر عن نتيجة الفحص، و`onDismiss={() => {}}` لا يغيّر `show` | `core/updates.ts:17,27` · `UpdateBanner.tsx:10-20,28` · `App.tsx:791` | شريط إنجليزي دائم فوق الرأس في كل جلسة يغطي شريط التقدّم؛ يكذب عن حالة التحديث؛ يُعلَن بصوت عالٍ لقارئ الشاشة | Trust · Fiori *Predictable* · WCAG 3.2.4 | اجعل الفحص **اختياريًا**: `if (!manifestUrl) return null` قبل أي `fetch`، ومرّر العنوان من `import.meta.env.VITE_UPDATE_MANIFEST_URL`. ارفع المكوّن إلى طبقة `App` فقط. |
| **P0-2** | **ثلاثة أرقام إصدار مختلفة في نفس الجلسة**: `package.json = 4.0.0` · `core/updates.ts CURRENT_VERSION = "4.0.0"` (مع تعليق `// read from package.json in real usage` غير منفَّذ) · `GlobalOperationalFooter` يعرض `"v2.4.0-Enterprise"` | `package.json:3` · `core/updates.ts:17` · `GlobalOperationalFooter.tsx:42` | المستخدم يرى نسختين مختلفتين في الترويسة والتذييل | Trust | مصدر واحد: ثابت `__APP_VERSION__` يُحقَن وقت البناء عبر `vite define` ويُقرأ في المواضع الثلاثة. |
| **P0-3** | **عملة اليورو (€) في تقرير مالي بينما بقية التطبيق بالريال**: `CashFlowReport` يطبع `${...} €` في ثلاثة مواضع، و`ProfitabilityReport` في موضعين، بينما الـ KPI يستخدم `formatCurrency(..., 'YER', 'ar-YE')` | `reports/CashFlowReport.tsx:25,30,35` · `reports/ProfitabilityReport.tsx:25,30,34` | خطأ مالي مرئي: «€ 1,200» بجوار «1,200 ر.ي» — خطر تمثيل خاطئ | ISO 4217 · IPSAS · AGENTS.md (YER/SAR/USD) | احذف الرمز الثابت؛ مرّر `currencyCode` و`locale` كخصائص واستخدم `formatCurrency`. |
| **P0-4** | **مكوّن مُركَّب يعرض لا شيء أبدًا**: <ProfitabilityReport revenue={null} expenses={null} netMargin={null} /> ثم if (!hasData) return null; | UnifiedHomeWorkspace.tsx:459 · ProfitabilityReport.tsx:14-15 | عنوان «التقارير المالية» يَعِد بتقرير ربحية لا يظهر أبدًا | Fiori *Predictable* · Honesty | احذف الاستدعاء، أو اربطه بمصدر حقيقي من /api/stats/financial. |
| **P0-5** | **UpdateBanner مُركَّب مرتين في نفس الجلسة** مع utoCheck في كلٍّ منهما | App.tsx:791 · UnifiedHomeWorkspace.tsx:383 | نداءان شبكيان مستقلان؛ طبقتا banners متداخلتان | كفاءة · Fiori *Consistent* | ارفعه إلى App.tsx فقط، واحذف الاستيراد من الـ Home. |
| **P0-6** | **مؤشر «قاعدة البيانات متصلة» مشتقّ من truthiness**: const dbConnected = !!serverStats; ثم يُعرض كمؤشر صحة نظام في التذييل؛ يبقى أخضر ما دام serverStats محمّلًا حتى لو تعذّر الوصول للقاعدة | App.tsx:685 → GlobalOperationalFooter.tsx | يكذب على المستخدم عند تدهور الاتصال | Trust · Observability | اربطه بـ /api/v2/health/readiness → checks.database.status (المُعرَّف أصلًا في e2e/comprehensive.spec.ts:66-75). |

---

### P1 — بنيوية (تُضعف الكفاءة وتخالف Fiori *Predictable*)

| # | العيب | الموقع الدقيق | الأثر | المعيار | الإصلاح |
|---|---|---|---|---|---|
| **P1-1** | **لا توجيه URL إطلاقًا**: صفر استخدام لـ `react-router` أو `window.location.hash`؛ `activeTab` يعيش في متجر `useAppNavigationStore` فقط | `core/stores/useAppNavigationStore.ts` · `App.tsx:132-137` | فقدان السياق عند F5، لا Bookmark، لا مشاركة رابط — **شرط مُلزِم لتطبيق سطح المكتب** | Fiori *Predictable* · Nielsen #4 | أضف `react-router-dom` بمسارات حقيقية (§5.1) |
| **P1-2** | **35 تبويبًا مسطّحًا بلا تجميع** في نوع واحد `ActiveTab` | `core/types/dashboard.ts:6-41` · `TAB_CONFIG` في `App.tsx:647-683` | ضياع في مساحة الخيارات؛ تجاوز حدّ Hick–Hyman للمهام عالية التردد | Hick–Hyman · Fiori *Consistent* | قسّمها إلى 5 مسارات (§5.1) |
| **P1-3** | **طبقات رأس ثلاث قبل المحتوى**: الترويسة + `UnifiedContextRibbon` + مخزن التبويبات | `App.tsx:755` · `App.tsx:794` | تكرار affordances في شاشة واحدة | Nielsen #4 · Fiori «فعل واحد» | ادمج الطبقتين في Fiori *Header Bar* واحد |
| **P1-4** | **Refresh/Retry مكرَّر ثلاث مرات على شاشة واحدة**: زر في الترويسة، و«إعادة المحاولة» في رأس بطاقة المعاملات، و«Retry» داخل `EmptyState` | `UnifiedHomeWorkspace.tsx:369` · `:577` · `:596` | تشويش بصري وثلاثة مسارات للتطابق | Nielsen #4 · ISO 9241-3.3 | زر عام واحد؛ `EmptyState` يحمل الإجراء الوحيد |
| **P1-5** | **نمط التجربة محفوظ في `localStorage` فقط** — خمسة مواضع تكتب نفس المفتاح | `useAppUIStore.ts:62-76` · `App.tsx:813,968,1227` · `TabContentRenderer.tsx:252` · `DashboardView.tsx:115` | يختلف حسب المتصفح/الجهاز؛ يفسد أجهزة الكشكور المشتركة | Fiori *Consistent* | انقله إلى `sys_settings` مرتبطًا بالمستخدم |
| **P1-6** | **العملة مثبّتة على `'YER'` في مسارَين** مع وجود `currencies` محمّلة في الحالة | `UnifiedHomeWorkspace.tsx:321` · `:641` | كسر فوري عند تفعيل SAR/USD (المطلوبة في دستور المشروع) | IPSAS · AGENTS.md | استنتج العملة من إعدادات المؤسسة |
| **P1-7** | **لا طابع زمني «آخر تحديث»** في أي مكان على الـ Home؛ الحداثة مُعَبَّرة بلون نقطة فقط | `MetricTile.tsx:192-197` · `UnifiedHomeWorkspace.tsx:217,324` | لا يستطيع المستخدم التحقق من صلاحية الرقم | ISO 9241-11 · Fiori *Contextual* | أضف `<time dateTime>` + قيمة `sr-only` |
| **P1-8** | **توحيد `locale` ناقص**: `ar-YE` في الترويسة لكن `ar-US` في الرئيسية | `UnifiedHomeWorkspace.tsx:213` | فروق في تنسيق الأرقام والعملة | ISO 9241-176 | مصدر واحد لـ `Intl` على مستوى التطبيق |

---

### P2 — تصميمي / وصولي / توطين

| # | العيب | الموقع الدقيق | الأثر | المعيار |
|---|---|---|---|---|
| **P2-1** | **ترميز الحالة باللون فقط**: نقطة `freshness` + `title` فقط؛ و`animate-pulse` بلا بديل نصي؛ و`title` غير مضمون الإAnnouncement لقارئ الشاشة | `MetricTile.tsx:47-51,192-197` | **فشل WCAG 1.4.1** — مستخدم أعمى لا يعرف إن كان الرقم محدّثًا | WCAG 1.4.1 (A) |
| **P2-2** | **`aria-label` على زر KPI يحجب النص الداخلي** (delta / caption / freshness) عن قارئ الشاشة | `MetricTile.tsx:183,226` | فقدان معلومات جوهرية لقارئ الشاشة | WCAG 1.3.1 |
| **P2-3** | **رابط تخطٍّ مكرَّر، أحدهما فيزيائي LTR**: `focus:left-2` في `App` مقابل `focus:start-4` المنطقي في المزوّد | `App.tsx:739-744` · `AccessibilityProvider.tsx:65-77` | إعلان مزدوج وموضع خاطئ في RTL | WCAG 2.4.1 |
| **P2-4** | **كتلة التقارير المالية بلا `dark:`**: `border-slate-200 bg-white/30` و`text-slate-600` فقط | `UnifiedHomeWorkspace.tsx:445-446` | غسلة فاتحة ونص باهت في الوضع الداكن | Fiori *Consistent* · WCAG 1.4.3 |
| **P2-5** | **تعليق وتسمية ألمانية متبقّية**: `/* Finanz‑Reports‑Sektor */` والعنوان `'Finanz‑Reports'` يظهر للمستخدم العربي | `UnifiedHomeWorkspace.tsx:444,446` | غير احترافي في نظام مؤسسي؛ يشير إلى دمج غير مُراجَع | Fiori *Consistent* |
| **P2-6** | **تقارير التدفق والربحية إنجليزية بالكامل** بعناوين وجداول بلا i18n | `CashFlowReport.tsx:18-36` · `ProfitabilityReport.tsx:21-35` | كسر اتجاه وتغطية ترجمة ناقصة | ISO 9241-176 |
| **P2-7** | **خصائص فيزيائية في RTL**: 411 استخدامًا لـ `left-` / `right-` / `text-left` | `src/**/*.tsx` | انعكاس خاطئ عند التبديل بين RTL وLTR | ISO 9241-176 |
| **P2-8** | **تجاوز سُلّم z-index المُدار**: 283 استخدامًا لـ `z-10..z-50` مع تدرّج معرَّف `--z-dialog=60` | `src/**/*.tsx` | تراكب غير متوقّع — و`tokens.css:111-115` يشرح الخطر نفسه | نظام التصميم |
| **P2-9** | **جدول التقارير بلا `<caption>`** وبلا `dir` صريح | `CashFlowReport.tsx:19-27` | التقاط سيئ لقارئ الشاشة في RTL | WCAG 1.3.1 |
| **P2-10** | **لا `aria-live` لتغيّر قيم KPI** بعد التحديث | `UnifiedHomeWorkspace.tsx` (شريط KPI كاملًا) | لا إعلان عن التغيّر لقارئ الشاشة | WCAG 4.1.3 |
| **P2-11** | **حقل البحث في الترويسة عبارة عن `<div onClick>`** بلا `role="button"` ولا `tabIndex` | `GlobalEnterpriseHeader.tsx:153-166` | **فشل WCAG 2.1.1** — لا يمكن الوصول إليه بلوحة المفاتيح | WCAG 2.1.1 (A) |

---

### P3 — هندسية / صيانة / حوكمة الاختبار

| # | العيب | الموقع | الأثر |
|---|---|---|---|
| **P3-1** | **مكوّنات متضخمة**: `InventoryManagementView` ‏414KB · `ProjectStatusOverviewWidget` ‏298KB · `pdfReportGenerator` ‏282KB · `SettingsView` ‏246KB | `src/components/**` | فجوة اختبار، والتقسيم الكسول غير فعّال عمليًا |
| **P3-2** | **سلة مكوّنات**: 89 ملفًا في جذر `src/components` | `src/components/` | اكتشاف ضعيف |
| **P3-3** | **انحراف نظام التصميم**: 2406 استخدامًا لـ `emerald-500/600` مقابل **6 فقط** لـ `var(--ux-*)` | `src/components/**` | يمر عبر remap العرضي في `@theme`؛ هشّ عند توسيع النظام |
| **P3-4** | **`any` في props الموصولة** (20+ حقلًا) | `TabContentRenderer.tsx:69-85` · `App.tsx:774,903,904` | فقدان سلامة الأنواع |
| **P3-5** | **اختبارات e2e بلا أسنان** — أخطر من غيابها | `e2e/accessibility.spec.ts:12` · `e2e/i18n.spec.ts:6` · `e2e/responsive.spec.ts` | **ضمان وهمي** |
| **P3-6** | **ميزانية أداء متضاربة**: دستور 250KB/وحدة · `chunkSizeWarningLimit=700` · حارس اختبار 1200KB | `package.json` · `vite.config.ts` · `bundle-budget.test.ts:22,25` | ضبابية معيار الأداء |
| **P3-7** | **لا ميزانية UX** (LCP/CLS/INP/TTI) في أي اختبار | — | لا انحراف قابل للقياس |
| **P3-8** | **لا اختبارات وحدة لشاشة الـ Home نفسها** | `src/components/dashboard/**` | لا حارس ضد انحدار P0 |

**تفصيل P3-5 (الأخطر لأنه يولّد طمأنينة زائفة):**
**تفصيل P3-5 (الأخطر لأنه يولّد طمأنينة زائفة):**
```ts
// e2e/accessibility.spec.ts:8-13 — يمرّ دائمًا، حتى لو اختفى الرابط تمامًا
const count = await skipLink.count();
expect(count).toBeGreaterThanOrEqual(0);

// e2e/i18n.spec.ts:4-7 — يقبل أي قيمة، بما فيها null
expect(['rtl', 'ltr', null]).toContain(dir);

// e2e/responsive.spec.ts — يتحقق من أن body مرئي فقط
await expect(page.locator('body')).toBeVisible();
```
ثلاثة اختبارات تُنتج «نجاحًا» دون التحقق من أي معيار. أي تقرير جودة يستند إليها غير صحيح.

---
## 4) التقييم التفصيلي حسب المعايير

### 4.1 مبادئ نيلسن العشرة

| المبدأ | الحكم | الدليل في الشيفرة |
|---|---|---|
| 1. إظهار حالة النظام | ⚠️ جزئي | ممتاز في الحالات الفارغة/الخطأ/التحميل، لكن **مؤشر الاتصال كاذب** (P0-6) و**شريط تحديث وهمي** (P0-1) يناقضانه |
| 2. مطابقة العالم الحقيقي | ✅ | نصوص عربية طبيعية، تصنيف `NEB` في `TAB_CONFIG`، مرادفات `title_ar/title_en` |
| 3. التحكم والحرية | ✅ | `Ctrl+L` قفل الجلسة، `Ctrl+P` طباعة، `resetSession`، Command Center، نمط تجربة قابل للتبديل |
| 4. الاتساق والمعايير | ❌ | 35 تبويبًا مسطّحًا، `Refresh` ثلاث مرات في شاشة واحدة، ثلاثة أرقام إصدار مختلفة، ثلاث طبقات رأس |
| 5. منع الأخطاء | ✅ | لا أرقام مُلفَّقة ولا قيم افتراضية مُختلقة، حالات فارغة صريحة (قيمة نادرة وممتازة) |
| 6. الاعتراف بالاستعادة | ⚠️ | `ConfirmDialog` موجودة، لكن **لا تراجع (Undo)** لإجراءات الكتابة |
| 7. المرونة والكفاءة | ⚠️ | اختصارات وCommand Center موجودة، لكن **بلا تخصيص للوحة المفاتيح** ولا Bookmarks ولا «العمل الأخير» |
| 8. تصميم جميل ومبسط | ❌ | 89 مكوّنًا، طبقات رأس ثلاث، شريط أدوات يحمل عدة إجراءات متكافئة |
| 9. اكتشاف الأخطاء والتعافي | ✅ | `EmptyState variant="error"` + `Retry` + `ErrorBoundary` على مستوى التطبيق والتبويب |
| 10. وثائق مساعدة | ✅ | `DocumentationView`، `shared/guidance/viewGuidance.ts`، `docs/USER_MANUAL.md` |

**النتيجة: 6 ✅ · 3 ⚠️ · 2 ❌ (من 10 مبادئ)**

### 4.2 معيار SAP Fiori 5

| مبدأ Fiori | الحكم | التوصية الملزمة |
|---|---|---|
| **Consistent** | ❌ | توحيد الألوان عبر `var(--ux-*)` بدل 2406 قيمة حرفية · توحيد الترويسة · مصدر إصدار واحد |
| **Predictable** | ❌ | مسارات URL حقيقية · breadcrumb واحد · أيقونة Placeholder واحدة لا ثلاث |
| **Contextual** | ⚠️ | أضف: من أين أتيت وإلى أين تذهب · «آخر تحديث» · الهدف مقابل الفعلي |
| **Adaptive** | ✅✅ | **أقوى محور بلا منازع**: White-label tokens · محرّك ثيم المستأجر · 3 مستويات كثافة · RTL/LTR · Reduced Motion |
| **Focused** | ❌ | «فعل واحد لكل شاشة» منصوص عليه ولم يُطبَّق · شريط الأدوات يحمل إجراءات متكافئة |

**ترشيح Fiori 3:** الشاشة الحالية مكوَّنة من عناصر **Mixed** (Grid KPI + List + Report Table في مستوى `gap-5` واحد). Fiori 3 يشترط عنصرًا مهيمنًا واحدًا + Orientation Bar + Explicit Action.

### 4.3 WCAG 2.2 AA — مستوى التنفيذ

| المعيار | المستوى | الحالة في النظام |
|---|---|---|
| 1.1.1 محتوى غير نصي | A | ✅ `alt` على الشعار · `aria-hidden` على الأيقونات |
| 1.3.1 معلومات وعلاقات | A | ⚠️ `scope="col"` عبر حارس CI، لكن **فجوة `aria-label`** (P2-2) |
| 1.4.1 استخدام اللون | A | ❌ **فشل** في `MetricTile` freshness (P2-1) |
| 1.4.3 تباين (نص) | AA | ⚠️ `text-[11px] text-zinc-400` على أبيض ≈ **3.5:1 (فشل)**؛ وكتلة التقارير بلا `dark:` (P2-4) |
| 1.4.11 تباين غير نصي | AA | ⚠️ نقاط الحالة تعتمد على اللون |
| 2.1.1 لوحة المفاتيح | A | ❌ حقل البحث `<div onClick>` بلا `role` ولا `tabIndex` (P2-11) |
| 2.4.1 تجاوز الكتل | A | ✅ لكن مكرّر (P2-3) |
| 2.4.3 ترتيب التركيز | A | ✅ طبيعي |
| 2.4.7 تركيز مرئي | AA | ✅ ممتاز — قاعدة `@layer base` واحدة |
| 2.4.11 التركيز غير محجوب | AA (جديد في 2.2) | ✅ `scroll-padding-block-start` |
| 2.5.5 حجم الهدف | AAA | ⚠️ أزرار `w-9 h-9` (36px) مقبولة، لكن `h-6` و`w-1.5` في مواضع |
| 3.2.4 تحسين المتصفح | AA | ❌ لا `history.pushState` — لا روابط قابلة للمشاركة (P1-1) |
| 3.3.2 labels أو تعليمات | A | ⚠️ راشِد في CI لكن ما زال هناك متبقٍّ |
| 4.1.3 رسائل الحالة | AA | ⚠️ `aria-live` في Toast وFilterBar، **غائب عن KPI** (P2-10) |

### 4.4 ISO 9241-11

| البُعد | الحكم | السبب |
|---|---|---|
| **فعالية** | ✅ جيدة | «طابور قرارك» في الشاشة الرئيسية يجعل متطلب الاعتماد قابلًا للإنجاز فورًا |
| **كفاءة** | ❌ ضعيفة | 35 تبويبًا مسطّحًا + 3 طبقات رأس = زمن وصول مرتفع، خصوصًا للمستخدم الجديد |
| **رضا** | ⚠️ متوسطة | لا يوجد Onboarding لتدفق أول-تشغيل؛ `viewGuidance.ts` banner لكل شاشة بدل ذلك |

### 4.5 HEART — ما هو مفقود من القياس

| المقياس | المطلوب ولم يوجد |
|---|---|
| **Happiness** | استبيان رضا ربع سنوي بعد الجلسة |
| **Engagement** | تتبّع تعليمات الواجهة (Hilbert funnel) — غير موجود |
| **Adoption** | نسبة المستخدمين الذين فعّلوا كل قسم — غير موجود |
| **Retention** | تكرار العودة بعد 7 أيام — غير موجود |
| **Task Success** | قياس زمن إنجاز «اعتماد طلب» من الـ Home — **الأهم لهذا النظام** |

---
## 5) معمارية Fiori المقترحة للشاشة الرئيسية

### 5.1 تقسيم الـ 35 تبويبًا (P1-2)

```
/overview      ← Workspace (الرئيسية) · BI · Strategic Planning · Geospatial
/portfolio     ← Programs · Projects · Portfolio Intelligence · Investments · Allocations
/operations    ← Activities · Field Tasks · Beneficiaries · Inventory · Procurement
                 Contracts · Sales · Sponsorships · Third-Party Network · Communications
/finance       ← Finance · Approvals · Reports · Currencies · Commitments & Obligations
/governance    ← Domains · Workspaces · Control Panel · Users · Settings · Audit · Backup
                 Documentation · Scenarios · HR Dashboard · Admin Control Center
```

**قاعدة reorganization:** كل تبويب يجب أن ينتمي لمسار واحد، ولكل مسار «فعل رئيسي» واحد. لا tab يتيم.

### 5.2 الشاشة الرئيسية وفق Fiori *Overview Page*

```
┌──────────────────────────────────────────────────────────────────────┐
│ Orientation Bar: [Org ▾] [FY ▾] [Role ▾]      Last sync 14:32  ●live│ ← سياق
├──────────────────────────────────────────────────────────────────────┤
│ Header Bar:  مركز العمل · مرحباً أحمد      [اعتماد سريع]  ⟳   ⌘K  │ ← فعل واحد
├──────────────────────────────────────────────────────────────────────┤
│ KPI Grid (6): value + delta + sparkline + "آخر تحديث 14:32"         │ ← معيار واحد
├─────────────────────────────────┬────────────────────────────────────┤
│ Decision Queue (2/3)            │ Programs (1/3)                     │ ← «اليوم»
├─────────────────────────────────┼────────────────────────────────────┤
│ Cash Flow (2/3)                 │ Sponsorships (1/3)                 │ ← «الاتجاه»
├─────────────────────────────────┴────────────────────────────────────┤
│ Recent Transactions (بعرض كامل)                    [عرض الكل →]      │ ← تفصيل
└──────────────────────────────────────────────────────────────────────┘
```

**الفرق الجوهري عن الحالي:**
| البند | الحالي | المقترح |
|---|---|---|
| Banner التحديث | موجود دائمًا | **محذوف** (أو داخل نافذة About فقط) |
| Refresh | 3 نسخ | **نسخة واحدة** في الـ Header |
| التقارير المالية | كتلة منفصلة بنمط مختلف | **ضمن صف «الاتجاه»** بنفس المعيار البصري |
| الطابع الزمني | غير موجود | **على كل بطاقة KPI** |
| contexts | غير موجود | **Orientation Bar** (مؤسسة · سنة · دور) |
| الفعل الرئيسي | 4 أزرار متكافئة | **فعل واحد** + إغلاق |

### 5.3 بطاقة KPI المستهدفة (تُغلق P1-7 وP2-1 معًا)

```tsx
// استبدل title-only freshness بنص + شكل + وقت — WCAG 1.4.1 compliant
<span className="sr-only">
  {lang === 'ar'
    ? `البيانات محدّثة ${timeAgoLabel(lastSyncedAt, lang)}`
    : `Data updated ${timeAgoLabel(lastSyncedAt, 'en')}`}
</span>
<span aria-hidden="true" className={SHAPE[freshness]} />   {/* ● / ◆ / ▲ — شكل لا لون فقط */}
```

---
## 6) خارطة الطريق الإصلاحية

| المرحلة | المحتوى | العيوب المغلقة | معيار الخروج |
|---|---|---|---|
| **M0 — إصلاح الصدق** (يومان) | P0-1 · P0-2 · P0-4 · P0-5 · P0-6 | كل P0 | لا شريط تحديث في جلسة نظيفة · رقم إصدار واحد · لا `return null` في مسار التوليد حي · فحص يدوي لـ `dbConnected` |
| **M1 — الوصولية الحرجة** (3 أيام) | P2-1 · P2-2 · P2-3 · P2-11 · P3-5 | 5 عيوب | `axe-core` نظيف على Home · e2e حقيقي بدل `>= 0` |
| **M2 — بنية التنقل** (أسبوع) | P1-1 · P1-2 · P1-3 · P1-4 | 4 عيوب | مسارات URL · 5 مجموعات · Refresh واحد · اختبارات تنقل تمرّ |
| **M3 — الصقل** (أسبوع) | P2-4..P2-10 · P1-6..P1-8 · P3-3 | 12 عيبًا | تباين ≥ 4.5:1 · RTL نظيف · `aria-live` على KPI · عملة ديناميكية |
| **M4 — جاهزية سطح المكتب** (أسبوع) | P0-3 · P3-1 · P3-6 · P3-7 | 4 عيوب | Electron/Tauri يبني بنجاح · ميزانية أداء موحّدة |

**قاعدة الحوكمة:** لا مرحلة تبدأ قبل نجاح `npm run ci` على المرحلة السابقة. لا يُقبل ادعاء «تم» بلا اختبار يحميه.

---

## 7) الافتراضات والقيود (Assumptions & Limitations)

1. **لم يُشغَّل التطبيق بصريًا.** التقييم مبني على قراءة الشيفرة المصدرية فقط. التحقق البصري (Lighthouse، axe، اختبار مستخدمين) غير مُنفَّذ.
2. **الأرقام (2406 / 411 / 283 / 89 / 863 / 413)** مأخوذة من `Select-String` على `src/**/*.tsx`. قد تختلف قليلًا عند إعادة العدّ بأدوات أخرى (npm script موحّد مطلوب).
3. **الدرجات في §1 حكم خبير موزون** وليست قياسًا كميًا. يلزم مقاييس HEART (§4.5) لترفعها إلى رقم مُدعَّم.
4. **`tabindex` لحقل البحث في الترويسة**: `GlobalEnterpriseHeader.tsx:153-166` — دُوّن كـ div قابل للنقر؛ لم يُتحقق منه في متصفح.
5. **افتراض معماري للتطبيق المكتبي**: التوصيات مبنية على أن سطح المكتب سيغلّف نفس خادم Express الموجود (`dist/server.cjs`) عبر نافذة Electron/Tauri. لو كان المطلوب تطبيقًا محليًا بالكامل (offline-first) فالمعمارية تتغير جذريًا.
6. **لا يوجد فريق مصمّم مخصّص** في المستودع؛ التقييم يعوّض غياب مراجعة تصميم بشرية.

---

## 8) الخلاصة التنفيذية

النظام يملك **بنية تصميمية من الطراز الأول** (رموز تصميم مشتقّة، حارس WCAG في CI، ميزانية أداء، حالات خطأ صريحة، دعم RTL وكثافة ومحرك ثيم مستأجر). هذه ليست إنجازات عادية في نظام ERP عربي، وهي **يجب الحفاظ عليها**.

لكنه **يفشل في الطبقات التي يراها المستخدم يوميًا**: كثافة التبويبات، غياب الرابط القابل للمشاركة، تكرار الإجراءات، وثلاثة عيوب صدق (نسخة وهمية، عملة € في تقرير ريال، مؤشر اتصال كاذب) تُضعف الثقة فور فتح التطبيق.

**القرار الموصى به:** ابدأ بـ M0 (يومان) قبل أي عمل على سطح المكتب — لأن عيوب الصدق هي ما يميّز نظامًا مؤسسيًاموثوق عن نموذج أولي. ثم M1 قبل M2. وأجّل أي توسّع وظيفي جديد حتى تُغلق M0 وM1.

---
