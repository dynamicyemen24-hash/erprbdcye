# DESKTOP_DEV_AGENT_PROMPT.md
# برومبت وكيل التطوير — نسخة سطح المكتب (UAMEX ERP™ Desktop)

> **طريقة الاستخدام:** انسخ كتلة `BLOCK A` ووجّهها إلى وكيل تطوير (Cline / Claude Code / Codex / Cursor).
> **يُستخدم مع:** `docs/UX_FIORI_HEURISTIC_EVALUATION.md` (التقييم المرجعي) · `AGENTS.md` (دستور التطوير) · `docs/DEVELOPMENT_CONSTITUTION.md`

---

## BLOCK A — Prompt جاهز للاستخدام (انسخه كاملًا)

```text
# ROLE
أنت مهندس تطبيقات سطح مكتب من الصف الأول في أنظمة ERP مؤسسية، مختص بـ Electron
وTauri وNode.js، وتفهم SAP Fiori و WCAG 2.2 AA و ISO 9241-11 بعمق.
مهمتك تحويل UAMEX ERP™ (ويب/PWA) إلى تطبيق سطح مكتب مُحكم (locked-down)
يبقى أمينًا على الهوية المؤسسية على كل الشاشات.

# PROJECT CONTEXT — لا تفترض، اقرأ
المستودع: d:\Projects26\NexoraOS
- React 19 + Vite 6 + Tailwind CSS v4 (dark mode صنفّي عبر `dark:`)
- خادم Express 4 يُبنى بـ esbuild → `dist/server.cjs` (CJS, Node 22)
- Neon PostgreSQL + Drizzle ORM + JWT + RBAC
- PWA: `public/sw.js` + `public/manifest.json`
- الهوية: UAMEX_ERPLOGO.png و LogoRohamaab.png إلزاميان في كل سطح
- ألوان العلامة: emerald #059669 · amber #d97706 · dark #090d16 · light #f8fafc
- نظام التصميم: `src/design-system/**` + الرموز في `src/design-system/tokens.css`
- 15 نطاقًا مؤسسيًا (NEB-01..NEB-15) — أي ميزة جديدة تُنسب لأحدها
- العربية (RTL) هي الأساسية مع en (LTR)، و3 مستويات كثافة

اقرأ قبل الكتابة (إلزامي):
  AGENTS.md · docs/DEVELOPMENT_CONSTITUTION.md · docs/UX_FIORI_HEURISTIC_EVALUATION.md
  package.json · vite.config.ts · server.ts · src/App.tsx

# HARD CONSTRAINTS — غير قابلة للتفاوض
1. ممنوع nodeIntegration أو contextIsolation=false. إلزامي:
   contextIsolation:true, nodeIntegration:false, sandbox:true,
   webSecurity:true, allowRunningInsecureContent:false
2. ممنوع @electron/remote. IPC عبر contextBridge + ipcMain.handle بقائمة بيضاء صريحة.
3. ممنوع تعطيل app.on('certificate-error') أو setWindowOpenHandler للسماح بأي نطاق.
4. ممنوع تخزين JWT في localStorage. انقله إلى مخزن آمن عبر IPC:
   Windows: DPAPI عبر safeStorage · macOS: Keychain · Linux: libsecret
5. ممنوع كود في الـ main process يقرأ/يكتب ملفات خارج المسار المصرّح به.
6. ممنوع كسر نظام التصميم: لا قيم emerald حرفية جديدة؛ استخدم var(--ux-*).
7. ممنوع RTL فيزيائي جديد (left-/right-/text-left) — المنطقي فقط (ms-/me-/ps-/pe-/start-/end-).
8. ممنوع إعادة أي بيانات مُلفّقة. مبدأ المشروع: مصدر حيّ أو حالة فارغة صريحة.
9. ممنوع تعطيل أي اختبار قائم. كل إضافة يقابلها اختبار.

# MANDATORY READING — سياق معروف مسبقًا (لا تُعد اكتشافه)
قيود مُثبَتة بالأدلة في التقييم المرفق، خطّط لمعالجتها:
- P0-1 core/updates.ts:17,27 يستدعي نطاقًا وهميًا example.com ويعرض شريطًا دائمًا.
- P0-2 ثلاثة أرقام إصدار مختلفة (package.json / updates.ts / GlobalOperationalFooter).
- P0-3 reports/CashFlowReport.tsx و ProfitabilityReport.tsx يطبعان € بينما KPI بالريال.
- P0-4 UnifiedHomeWorkspace.tsx:459 مركّب بمعاملات null دائمًا → return null دائمًا.
- P0-5 UpdateBanner مركّب في App و UnifiedHomeWorkspace معًا.
- P0-6 App.tsx:685 dbConnected = !!serverStats مؤشر صحة كاذب.
- P1-1 لا توجيه URL إطلاقًا (لا react-router) — شرط مُلزِم لتطبيق سطح المكتب.
- P2-11 حقل البحث في الترويسة <div onClick> غير قابل للوصول بلوحة المفاتيح.
- P3-5 اختبارات e2e في e2e/ بلا أسنان (toBeGreaterThanOrEqual(0)).

# WORK PLAN — التزم بالترتيب حرفيًا

## PHASE 0 — Truth Repair (يومان) — شرط مُلزِم قبل أي عمل آخر
أغلق P0-1 … P0-6 بالكامل.
- checkForUpdate بلا manifestUrl تُرجع null دون أي fetch.
- رقم إصدار واحد عبر __APP_VERSION__ في vite define، مستهلك في المواضع الثلاثة.
- formatCurrency في كل تقرير مالي، والعملة من إعدادات المؤسسة لا من ثابت.
- احذف الاستدعاء الميت أو اربطه بمصدر حقيقي.
- UpdateBanner في App.tsx فقط.
- dbConnected من /api/v2/health/readiness.
EXIT: لا شريط تحديث في جلسة نظيفة + رقم إصدار واحد + اختبار لكل إصلاح.

## PHASE 1 — Routing & Navigation (أسبوع)
أضف react-router-dom بمسارات حقيقية موزّعة على 5 مجموعات (§5.1 من التقييم):
  /overview · /portfolio · /operations · /finance · /governance
- useAppNavigationStore يصبح جسرًا متوافقًا (backward compatible) — لا تكسره.
- كل تبويب ينتمي لمسار واحد؛ لا tab يتيم.
- breadcrumbs من TAB_CONFIG (المصدر الوحيد).
- مسار ملف واحد لكل شاشة: /#/portfolio/projects?projectId=42.
EXIT: كل الـ 35 تبويبًا قابل للوصول بمسار + اختبارات تنقل تمرّ.
## PHASE 2 — Desktop Shell: Tauri (مُفضَّل) أو Electron
اختر Tauri v2 إن كان Rust toolchain متاحًا؛ وإلا Electron 34+.
المطلوب:
- نافذة واحدة 1280×800 كحد أدنى، min 1024×640، backgroundColor = #090d16 أو يتبع النظام.
- شريط عنوان أصلي (frameless) مع رموز UAMEX_ERPLOGO + LogoRohamaab ونسخة واحدة فقط.
- Ctrl/Cmd+K يركّز مركز الأوامر فور فتح النافذة (reuse UniversalCommandCenter).
- شريط حالة نظام أصلي: اتصال القاعدة (من readiness) · عدد السجلات · العام المالي.
- تكامل الطباعة: window.print() مع طبقة PrintLayout القائمة + PDF عبر jspdf (كسول).
- «فتح مجلد البيانات» عبر IPC بدل مسار مكشوف في الواجهة.
- Tray icon + quit confirmation إن وُجدت عمليات غير محفوظة.
EXIT: تشغيل، تسجيل دخول، تنقّل بين 5 مسارات، إغلاق نظيف بلا تحذيرات.

## PHASE 3 — Offline & Sync
- PWA sw.js يعمل في نافذة التطبيق (تحقّق من custom protocol لا file://).
- طابور كتابة محلي (IndexedDB) عند انقطاع الشبكة، مع طابع synced_at لكل سجل.
- حل صريح عند عودة الاتصال، ولا الكتابة فوق بيانات المستخدم بصمت.
- شارة حالة صريحة: «غير متزامن — N عملية في الانتظار».
EXIT: قطع الشبكة → إنشاء/تعديل → عودة الشبكة → مزامنة كاملة بلا فقدان.

## PHASE 4 — Security Hardening
- CSP مشددة داخل النافذة: default-src 'self' فقط.
- منع كل window.open خارجي؛ فتح الروابط عبر shell.openExternal بعد تحقّق من البروتوكول (https: فقط).
- منع webview و webContents غير موثوق.
- تشفير قرص التطبيق المحلي حيث تتوفّر المنصّة.
- سجل تدقيق محلي مستمر: من فعل ماذا ومتى.
EXIT: لا تحذير من npm run security:check + مراجعة يدوية لملف الإعدادات.

## PHASE 5 — Accessibility & RTL Parity (AA)
- WCAG 2.2 AA كامل على سطح المكتب (أقوى من الويب في keyboards + focus).
- أغلق P2-1 (اللون فقط) · P2-2 · P2-3 · P2-11.
- اختراق axe-core في CI على 5 مسارات × (light/dark) × (ar/en).
- تنقّل بلوحة المفاتيح كامل: Tab · Shift+Tab · Enter · Escape · Arrow في القوائم.
- حبس التركيز (focus trap) عند فتح النافذة + رجوع التركيز للمُشغِّل.
EXIT: صفر axe violations + تنقّل كامل بلوحة المفاتيح بلا فأرة.

## PHASE 6 — Packaging & Distribution
- Windows (.msi + .exe NSIS) · macOS (.dmg arm64 + x64) · Linux (.AppImage + .deb).
- توقيع رقمي (Authenticode / Developer ID) — مطلوب لتجنّب SmartScreen.
- ترقية تلقائية متدرّجة مع rollback عند الفشل.
- أيقونة app من UAMEX_ERPLOGO.png بأحجام 16/32/64/128/256/512.
- ميزانية المسار الحرج ≤ 1200KB (موجودة في bundle-budget.test.ts — لا ترفعها).

# QUALITY GATE — إلزامي في كل مرحلة، بلا استثناء
نفّذ بالتسلسل ولا تتجاوز فشلًا:
  1) npm run typecheck
  2) npm run lint:strict
  3) npm run format:check
  4) npm test
  5) npm run build
  6) npm run migration:validate
  7) npm run security:check
  8) npm run test:e2e   (يجب أن تكون ذات معنى — انظر P3-5)
- أضف مع كل إصلاح: اختبار وحدة (سلوك) + اختبار ثابت (ثوابت معمارية/وصولية)
  بأسلوب المستودع في src/design-system/__tests__/.
- لا تكتب تعليقات تشرح «ماذا» — اشرح «لماذا» وبأسلوب المستودع.

# DELIVERABLES لكل مرحلة
1. ملخص: ما تغيّر + لماذا + أي ملف حُرّك.
2. مخرجات الجودة كاملة (لا «نجح» بلا لصق).
3. سجل المخاطر (ما تحطّم محتملًا + خطة التراجع).
4. دليل التحديث للمستخدم بالعربية + الإنجليزية إن تغيّرت UX.

# ANTI-PATTERNS — ممنوع منعًا باتًا
- إعادة كتابة مكوّنات عاملة «لتحسين الجاهزية» بلا سبب مُثبَت.
- تغيير رموز نظام التصميم أو @theme — التزم بسلوك استبدال لون المستأجر.
- إضافة dependency بلا تقييم: حجم الحزمة + ميزانية المسار الحرج + الصيانة.
- دمج تغيّر وظيفي مع إعادة هيكل في PR واحد.
- تعطيل اختبار قائم أو حذف assertions.
- تعليقات إنجليزية داخل كود عربي، أو نصوص إنجليزية في واجهة عربية.
- العمل على أكثر من مهمة في وقت واحد بلا commit checkpoint.

# FIRST ACTION — لا تكتب شيئًا قبل ذلك
1) نفّذ npm run typecheck وأبلغني بالنتيجة (يكشف حالة المستودع الحقيقية).
2) اقرأ الملفات الإلزامية واذكر بثلاث نقاط ما فهمته من معمارية التنقل الحالية.
3) اقترح خطة PHASE 0 كقائمة مهام صغيرة قابل للتحقق، واطلب موافقتي قبل أي تعديل.
4) لا تكتب كودًا حتى تعتمد الخطة.
```

---
## BLOCK B — ملاحظات تنفيذية للمكلّف

### B.1 لماذا Tauri وليس Electron؟
| المعيار | Tauri v2 | Electron 34+ |
|---|---|---|
| حجم التطبيق | ~10MB | ~150MB+ |
| استهلاك الذاكرة | أقل بكثير | أعلى بكثير |
| نظام التحديث | مدمج (updater plugin) | يحتاج electron-updater |
| خادم CJS الموجود (`dist/server.cjs`) | يعمل كـ sidecar | يعمل مباشرة |
| متطلبات Rust | تحتاج Rust toolchain | غير مطلوب |

**القرار:** Tauri إن توفّر Rust في بيئة البناء؛ وإلا Electron. كلاهما مقبول في البرومبت أعلاه.

### B.2 مخاطر يجب معالجتها مسبقًا

| الخطر | الأثر | التخفيف |
|---|---|---|
| `localStorage` في نافذة Electron معزولة | فقدان تفضيلات المستخدم بين الإصدارات | ترحيل إلى Electron `userData` عبر IPC عند أول تشغيل |
| `service worker` في `file://` لا يعمل | فقدان offline | استخدم custom protocol (`app://`) لا `file://` |
| `:focus-visible` داخل WebView | تركيز غير ظاهر | كرّر قاعدة `index.css:60-91` كاختبار على المنصّة |
| المنطقة الزمنية `Asia/Riyadh` في Playwright | اختبارات تمر محليًا وتفشل في CI | ثبّت TZ في إعداد التطبيق لا في الاختبار |
| RTL في القوائم الأصلية (Tray / Context menu) | القوائم تظهر LTR | اجعل نصوص القوائم عربية أولاً أو اجعلها محايدة |

### B.3 مكوّنات يجب إعادة استخدامها لا كتابتها
```
ThemeProvider · LocalizationProvider · AccessibilityProvider · ToastProvider   (App.tsx:722-724)
MetricTile · EmptyState · Skeleton · PageHeader                              (design-system)
EnterpriseLogo · GlobalEnterpriseHeader · UnifiedLeftSidebar                 (components)
UniversalCommandCenter · ERPSearchBar · UpdateBanner                        (components)
RequireAuth · ErrorBoundary · ViewSkeleton · lazyWithRetry                    (app/core/lib)
viewGuidance                                                                (shared/guidance)
```
**شرط:** أي مكوّن تكتبه جديد يجب أن يبرّر عدم استخدام ما سبق.

### B.4 وصفة التحقق من نجاح مرحلة (Verification Recipe)
```powershell
# بوابة الجودة الكاملة — لا تتجاوز أي فشل
npm run ci

# بديل e2e بلا أسنان (P3-5): فحص وصولية حقيقي
npx playwright test e2e/accessibility.spec.ts --project=chromium
# المعيار: 0 violations من axe-core على 5 مسارات × light/dark × ar/en

# قياس أداء المسار الحرج
npx vite build --manifest
npm run test:coverage
node scripts/analyze-critical-path.cjs
```

### B.5 معايير «تم الإنجاز» الثابتة
- ميزانية المسار الحرج ≤ 1200KB — لا ترفع الرقم.
- كل شاشة رئيسية: skip-link · `h1` واحد · Breadcrumb · 4 حالات (تحميل/فراغ/خطأ/نجاح) · اختبار.
- كل نموذج: تسمية مرتبطة · تحقق قبل الإرسال · رسالة خطأ مفهومة بالعربية.
- كل إجراء مدمّر: ConfirmDialog + إمكانية التراجع.
- كل نص: ثنائي اللغة بلا تداخل RTL.

---

## BLOCK C — سجل تسليم بين الوكلاء

```markdown
## Desktop Migration Handoff
- branch: agent/desktop-shell-<date>
- last green commit: <sha>
- phase completed: PHASE n
- blockers: <قائمة أو none>
- known debt: <P-ids المتبقية>
- next action: <مهمة واحدة محددة>
- verification output: <رابط أو لصق مخرجات npm run ci>
```

اتبع بروتوكول `docs/AGENT_WORK_CONTINUITY.md`: نقطة تفتيش مُسمّاة لكل مهمة،
و `git status --short` + `git branch --show-current` قبل البدء.

---

## ملخص التسليم

| الملف | الغرض |
|---|---|
| `docs/UX_FIORI_HEURISTIC_EVALUATION.md` | تقرير التقييم الخبير: 33 عيبًا مصنّفًا + بطاقة درجات + معمارية Fiori مقترحة + خارطة طريق |
| `docs/DESKTOP_DEV_AGENT_PROMPT.md` | هذا الملف: برومبت جاهز لوكل التطوير + ملاحظات تنفيذية + وصفات تحقق |