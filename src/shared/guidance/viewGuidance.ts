// NexoraOS™ Central View Guidance Registry
// Precise bilingual operational instructions for every enterprise workspace screen.
// Rendered by ViewGuidanceBanner inside TabContentRenderer so every screen carries guidance.

export interface ViewGuidance {
  /** Short mission statement of the screen */
  purposeAr: string;
  purposeEn: string;
  /** Ordered step-by-step operating instructions */
  stepsAr: string[];
  stepsEn: string[];
  /** Pro tips: shortcuts, governance rules, warnings */
  tipAr?: string;
  tipEn?: string;
}

export const VIEW_GUIDANCE: Record<string, ViewGuidance> = {
  dashboard: {
    purposeAr: 'لوحة القيادة الاستراتيجية تجمع مؤشرات الأداء والأثر في شاشة واحدة للقرار التنفيذي السريع.',
    purposeEn: 'The executive dashboard consolidates performance and impact KPIs for fast decisions.',
    stepsAr: [
      'راجع بطاقات المؤشرات العليا (KPIs) يومياً لرصد أي انحراف عن الخطة.',
      'استخدم النقر على أي مؤشر للانتقال المباشر (Drill-down) إلى الشاشة التفصيلية المسؤولة.',
      'حدّث البيانات بزر التحديث أو اختصار Ctrl+R قبل أي عرض تنفيذي.',
    ],
    stepsEn: [
      'Review top KPI cards daily to catch deviations from plan early.',
      'Click any KPI card to drill down into its detailed domain screen.',
      'Press Ctrl+R (or the refresh button) before executive presentations.',
    ],
    tipAr: 'نصيحة: افتح شاشة ثانية بالتوازي عبر زر "الشاشة الثنائية" لمقارنة اللوحة بأي نظام آخر دون فقدان السياق.',
    tipEn: 'Tip: use the Split View button to compare the dashboard side-by-side with any other system.',
  },

  control_panel: {
    purposeAr: 'مركز التحكم التشغيلي لإدارة صلاحيات الفرق ومراقبة خدمات النظام الحية وسجلات التشغيل.',
    purposeEn: 'Operational control center for team permissions, live service health, and runtime logs.',
    stepsAr: [
      'راقب حالة خدمات النظام (API / قاعدة البيانات / المزامنة) من بطاقات الصحة الحية.',
      'راجع سجل العمليات الجارية قبل منح أي صلاحية جديدة لفريق ميداني.',
      'أي تعديل على الصلاحيات يُسجل تلقائياً في سجل التدقيق NEB-11 ولا يمكن حذفه.',
    ],
    stepsEn: [
      'Monitor live service health cards (API, database, sync).',
      'Review active operations log before granting new field-team permissions.',
      'Every permission change is permanently recorded in the NEB-11 audit trail.',
    ],
    tipAr: 'تنبيه حوكمة: لا تمنح صلاحية "اعتماد مالي" وصلاحية "إنشاء قيد" لنفس المستخدم (فصل الواجبات SoD).',
    tipEn: 'Governance warning: never grant posting and approval rights to the same user (SoD).',
  },

  domains: {
    purposeAr: 'خريطة المجالات المؤسسية الخمسة عشر (NEB-01 إلى NEB-15) ونقطة الانطلاق لأي نظام داخل المنصة.',
    purposeEn: 'Map of all 15 enterprise domains (NEB-01..15) and the launchpad to every system.',
    stepsAr: [
      'تصفح البطاقات واضغط أي مجال للانتقال الفوري إلى شاشته التشغيلية.',
      'لاحظ رمز الحالة على كل بطاقة: أخضر = تشغيل مباشر، كهرماني = يتطلب انتباهاً.',
      'استخدم Ctrl+K للبحث المباشر في كل المجالات بدل التصفح اليدوي.',
    ],
    stepsEn: [
      'Browse the domain cards and click any to jump straight into its workspace.',
      'Watch each card status dot: green = live, amber = needs attention.',
      'Use Ctrl+K to search across all domains instead of manual browsing.',
    ],
  },

  programs: {
    purposeAr: 'إدارة البرامج التنموية الكبرى وموازناتها الإجمالية وربطها بالمشاريع التنفيذية تحتها.',
    purposeEn: 'Manage flagship development programs, their master budgets, and child projects.',
    stepsAr: [
      'أنشئ البرنامج أولاً ثم اربط به المشاريع؛ لا يمكن إنشاء مشروع دون برنامج أم.',
      'راقب نسبة الصرف مقابل الموازنة المعتمدة لكل برنامج قبل إضافة تمويل جديد.',
      'فلتر الحالة أعلى الجدول يعرض: نشط، مخطط، مغلق، أو موقوف.',
    ],
    stepsEn: [
      'Create the program first, then attach projects; projects require a parent program.',
      'Check burn-rate vs approved budget before allocating new funding.',
      'Use the status filter above the grid: Active, Planned, Closed, or Suspended.',
    ],
    tipAr: 'نصيحة: صدّر قائمة البرامج بـ Ctrl+E لمشاركتها مع مكتب إدارة المحافظ (PMO).',
    tipEn: 'Tip: press Ctrl+E to export the programs list for the PMO office.',
  },

  projects: {
    purposeAr: 'دورة حياة المشاريع الميدانية الكاملة: الإنشاء، الموازنة، نسب التنفيذ، والمخاطر.',
    purposeEn: 'Full field-project lifecycle: creation, budgeting, progress tracking, and risks.',
    stepsAr: [
      'اختر مشروعاً لفتح بطاقته التفصيلية (الميزانية، المهام، العقود، المخاطر).',
      'حدّث نسبة الإنجاز الفعلي دورياً — فهي مصدر تقارير الأثر الرسمية.',
      'احجز الاعتمادات المالية للمشروع قبل التعاقد مع الموردين لتجنب تجاوز الموازنة.',
    ],
    stepsEn: [
      'Select a project to open its detail card (budget, tasks, contracts, risks).',
      'Update actual completion percentage regularly — it feeds official impact reports.',
      'Reserve project budget lines before contracting suppliers to avoid overruns.',
    ],
    tipAr: 'تنبيه: المشروع الذي يتجاوز 100% من موازنته يُعلَّم تلقائياً بالأحمر ويوقف أوامر الشراء الجديدة.',
    tipEn: 'Warning: projects exceeding 100% budget turn red and block new purchase orders.',
  },

  activities: {
    purposeAr: 'التنفيذ الميداني اليومي: مهام WBS، الفرق، والمواقع الجغرافية مع بصمة GPS.',
    purposeEn: 'Daily field execution: WBS tasks, teams, geo-tagged locations with GPS stamps.',
    stepsAr: [
      'أنشئ المهمة الميدانية واربطها بالمشروع والمستفيدين المستهدفين.',
      'وثّق كل زيارة ميدانية بصور وشواهد تسليم مع تفعيل تتبع GPS.',
      'أغلق المهمة فقط بعد اكتمال قائمة التحقق الميدانية الخاصة بها.',
    ],
    stepsEn: [
      'Create field tasks linked to their project and target beneficiaries.',
      'Attach delivery-proof photos and enable GPS stamping on every visit.',
      'Close a task only after its full field checklist is complete.',
    ],
    tipAr: 'نصيحة ميدانية: يعمل النظام دون إنترنت — تُزامَن الأنشطة المسجلة أوتوماتيكياً عند عودة الاتصال.',
    tipEn: 'Field tip: offline mode is supported; logged activities sync automatically once back online.',
  },

  beneficiaries: {
    purposeAr: 'السجل الموحد للمستفيدين ومنع ازدواجية الصرف وفق معايير Sphere والعدالة الاجتماعية.',
    purposeEn: 'Unified beneficiary registry preventing duplicate aid per Sphere standards.',
    stepsAr: [
      'ابحث بالهوية الوطنية أو رقم البطاقة قبل تسجيل مستفيد جديد لمنع الازدواجية.',
      'أكمل دراسة الاستحقاق الاجتماعي ثم اعتمدها قبل إدراج الأسرة في أي مشروع.',
      'اطبع بطاقة المستفيد الرقمية المكودة QR بعد الاعتماد النهائي.',
    ],
    stepsEn: [
      'Search by national ID or card number before registering to prevent duplicates.',
      'Complete and approve the social eligibility study before enrolling a household.',
      'Print the QR-coded digital beneficiary card after final approval.',
    ],
    tipAr: 'قاعدة ذهبية: المستفيد الواحد لا يستلم مساعدتين متزامنتين من نفس الفئة — النظام يحجب الطلب تلقائياً.',
    tipEn: 'Golden rule: one beneficiary cannot receive two concurrent aids of the same category — blocked automatically.',
  },

  sponsorships: {
    purposeAr: 'إدارة كفالات الأيتام والأسر: الدورية، المحصلون، والتحويلات المالية الآمنة.',
    purposeEn: 'Orphan & family sponsorship management: cycles, collectors, and secure transfers.',
    stepsAr: [
      'راجع جدول دورية الصرف الشهرية وأكد مطابقة الكفيل مع الكفول قبل التوزيع.',
      'سجل إيصال استلام الكفالة فوراً برقم إيصال موثق وإمضاء المحصل.',
      'أي انقطاع كفالة يولّد تنبيهاً آلياً لمدير الرعاية خلال 24 ساعة.',
    ],
    stepsEn: [
      'Verify the monthly disbursement schedule and sponsor-orphan matching first.',
      'Log each sponsorship receipt immediately with a documented receipt number.',
      'Any lapsed sponsorship auto-alerts the welfare manager within 24 hours.',
    ],
  },

  finance: {
    purposeAr: 'القلب المالي للنظام: قيود اليومية المزدوجة IPSAS، الموازنات، والمستندات المعتمدة.',
    purposeEn: 'Financial core: IPSAS double-entry journals, budgets, and certified documents.',
    stepsAr: [
      'أنشئ القيد من تبويب "قيود اليومية" وتأكد من توازن المدين والدائن قبل الحفظ.',
      'استخدم الماسح الذكي Gemini OCR لتحويل الفواتير الورقية إلى قيود جاهزة للاعتماد.',
      'راجع مطابقة ثلاثية (طلب شراء + استلام + فاتورة) قبل اعتماد أي صرف.',
      'أغلق الفترة المحاسبية شهرياً من تبويب الإقفالات بعد المراجعة النهائية.',
    ],
    stepsEn: [
      'Create journal entries from the Journal tab; debits must equal credits before saving.',
      'Use the Gemini OCR scanner to convert paper invoices into approval-ready entries.',
      'Apply 3-way matching (PO + GRN + Invoice) before approving any payment.',
      'Close each accounting period monthly from the Period Close tab after review.',
    ],
    tipAr: 'حوكمة: القيود المرحلة لا تُعدل بل تُصحح بقيد عكسي معتمد من مستوى تفويض أعلى.',
    tipEn: 'Governance: posted entries are never edited; corrections go through higher-authority reversing entries.',
  },

  approvals: {
    purposeAr: 'المصفوفة متعددة المستويات لاعتماد المعاملات المالية والإدارية وفق حدود التفويض.',
    purposeEn: 'Multi-level approval matrix for financial and administrative transactions.',
    stepsAr: [
      'افحص الطلبات الواردة بترتيب الأولوية الزمنية لتفادي تجاوز مدة SLA.',
      'راجع المرفقات والمستندات الداعمة قبل أي اعتماد أو رفض.',
      'سبب الرفض إلزامي ويُرسل للطالب مع إشعار فوري.',
    ],
    stepsEn: [
      'Process incoming requests in time-priority order to respect SLA windows.',
      'Inspect all attachments and supporting documents before approving or rejecting.',
      'A rejection reason is mandatory and instantly notified to the requester.',
    ],
    tipAr: 'تنبيه: اعتمادك نهائي وموقّع رقمياً — لا يمكن التراجع عنه إلا بمسار تصحيح جديد.',
    tipEn: 'Note: your approval is final and digitally signed — reversal requires a new correction path.',
  },

  reports: {
    purposeAr: 'مركز التقارير والتحليلات الذكية مع التصدير الرسمي PDF/Excel المعمّر بهوية المؤسسة.',
    purposeEn: 'Smart reporting center with official branded PDF/Excel export.',
    stepsAr: [
      'اختر نوع التقرير من اللوحة الجانبية ثم حدد الفترة والمرشحات (برنامج/مشروع/محافظة).',
      'استخدم Ctrl+E لفتح أدوات التصدير واختر PDF للتقارير الرسمية أو Excel للتحليل.',
      'كل تقرير مصدر يحمل بصمة رقمية وتاريخ توليد للتحقق الامتثالي.',
      'فعّل خيار "ترويسة رسمية" قبل الطباعة لتظهر الهوية والترخيص والتذييل المعتمد.',
    ],
    stepsEn: [
      'Pick a report type, then set period and filters (program/project/governorate).',
      'Press Ctrl+E to open export tools: PDF for official copies, Excel for analysis.',
      'Every generated report embeds a digital fingerprint and generation timestamp.',
      'Enable the "Official letterhead" option so branding, licence, and footer print.',
    ],
    tipAr: 'نصيحة: احفظ قوالب المرشحات المتكررة لتوليد التقارير الدورية بنقرة واحدة.',
    tipEn: 'Tip: save recurring filter templates to regenerate periodic reports in one click.',
  },

  users: {
    purposeAr: 'سجلات الكادر الوظيفي والملفات المهنية وصلاحيات الدخول للفرق الإنسانية.',
    purposeEn: 'Staff records, professional profiles, and access rights for humanitarian teams.',
    stepsAr: [
      'أنشئ حساب الموظف واربطه بدور واحد فقط من الأدوار المعتمدة.',
      'فعّل المصادقة الثنائية TOTP للحسابات ذات الصلاحيات المالية فوراً.',
      'عند انتهاء الخدمة: عطّل الحساب ولا تحذفه — حفاظاً على سلامة سجل التدقيق.',
    ],
    stepsEn: [
      'Create staff accounts mapped to exactly one approved role.',
      'Enable TOTP two-factor auth immediately for financially privileged accounts.',
      'On offboarding: disable the account, never delete it — audit integrity matters.',
    ],
  },

  inventory: {
    purposeAr: 'سلسلة الإمداد الإغاثية: المستودعات، حركات المخزون، والأصول الثابتة وإهلاكها.',
    purposeEn: 'Relief supply chain: warehouses, stock movements, and fixed assets depreciation.',
    stepsAr: [
      'سجل إذن التوريد أولاً قبل أي إذن صرف؛ الرصيد السالب محجوب نظاماً.',
      'طبّق جرد دوري شهري وقارنه بالرصيد الدفتري من تبويب الجرد.',
      'الأصول الثابتة فوق حد الرسملة تُرحَّل تلقائياً لجدول الإهلاك وفق IPSAS 17.',
    ],
    stepsEn: [
      'Record goods receipts before issues; negative stock is blocked by design.',
      'Run monthly physical counts and reconcile against book balance.',
      'Fixed assets above capitalization threshold auto-flow to IPSAS 17 depreciation.',
    ],
    tipAr: 'تنبيه: فرق الجرد أكبر من 2% يتطلب اعتماد مدير العمليات قبل التسوية.',
    tipEn: 'Alert: count variances above 2% need Operations Director approval before adjustment.',
  },

  contracts: {
    purposeAr: 'دورة المشتريات الكاملة: طلب الشراء، المناقصة RFQ، المقارنة الثلاثية، والعقد والدفعات.',
    purposeEn: 'Procure-to-pay cycle: PR, RFQ tender, 3-quote comparison, contract, payments.',
    stepsAr: [
      'ابدأ بطلب شراء معتمد قبل أي التزام تعاقدي — لا شراء بدون طلب.',
      'في المناقصات وثّق ثلاثة عروض فنية ومالية على الأقل للترسية السليمة.',
      'اربط دفعات العقد بشهادات إنجاز ميدانية موثقة قبل صرف أي دفعة.',
    ],
    stepsEn: [
      'Start from an approved purchase request — no commitment without one.',
      'For tenders, document at least three technical & financial offers before award.',
      'Tie contract payments to verified site completion certificates only.',
    ],
    tipAr: 'حوكمة: عضو لجنة الترسية لا يجوز أن يكون من نفس إدارة الطالب الداخلي.',
    tipEn: 'Governance: award committee members must not come from the requesting department.',
  },

  currencies: {
    purposeAr: 'أسعار الصرف الحية (USD/YER/SAR) وسجل تحويلات العملات لكل العمليات المالية.',
    purposeEn: 'Live FX rates (USD/YER/SAR) and the currency conversion log for all transactions.',
    stepsAr: [
      'حدّث سعر الصرف الرسمي صباح كل يوم عمل قبل ترحيل أي قيد بعملة أجنبية.',
      'راجع سجل التحويلات نهاية الأسبوع وكوِّن فروقات الصرف في قيد تمييز.',
    ],
    stepsEn: [
      'Post the official daily rate every business morning before foreign-currency entries.',
      'Review weekly conversions and recognize FX differences in revaluation entries.',
    ],
  },

  settings: {
    purposeAr: 'تهيئة هوية المنظمة، مفاتيح التكامل، سياسات المجالات، وأنماط بيئة التشغيل.',
    purposeEn: 'Organization identity, integration keys, domain policies, and environment modes.',
    stepsAr: [
      'أكمل بيانات الهوية والشعار أولاً — تظهر تلقائياً في كل المستندات المطبوعة.',
      'أدخل مفاتيح التكامل (SMS / بريد / Stripe / Gemini) في تبويبها الخاص واحفظ قبل الاختبار.',
      'وضع التدريب (بيانات تجريبية) مخصص للاجتماعات فقط — تأكد من العودة للوضع الإنتاجي بعده.',
      'لا تشارك المفاتيح السرية عبر قنوات غير مشفرة أبداً.',
    ],
    stepsEn: [
      'Complete identity & logo first — they flow automatically into printed documents.',
      'Enter integration keys (SMS/email/Stripe/Gemini) in their tab and save before testing.',
      'Training mode (sample data) is for demos only — always switch back to production.',
      'Never share secret keys over unencrypted channels.',
    ],
    tipAr: 'تنبيه أمني: أي تغيير في مفاتيح بوابة الدفع يتطلب إعادة اختبار عملية تبرع صغيرة قبل الإنتاج.',
    tipEn: 'Security: after changing payment gateway keys, run a small test donation before going live.',
  },

  audit: {
    purposeAr: 'سجل التدقيق غير القابل للتعديل لكل عمليات النظام — مرآة الشفافية المؤسسية.',
    purposeEn: 'Immutable audit trail of every system operation — the transparency mirror.',
    stepsAr: [
      'استخدم المرشحات (المستخدم/النوع/الفترة) لعزل أي حدث قيد المراجعة.',
      'صدّر مقاطع السجل PDF لإرفاقها بتقارير المدقق الداخلي أو المانح.',
      'أي محاولة تعديل أو حذف تُسجل هي نفسها كحدث أمني منفصل.',
    ],
    stepsEn: [
      'Filter by user/type/period to isolate events under review.',
      'Export PDF excerpts to attach to internal-auditor or donor reports.',
      'Any tampering attempt is itself captured as a separate security event.',
    ],
    tipAr: 'ملاحظة امتثالية: مدة الاحتفاظ القانونية للسجلات 7 سنوات — لا تحذف أرشيفاً قبل انقضائها.',
    tipEn: 'Compliance note: legal retention is 7 years — never purge archives earlier.',
  },

  backup: {
    purposeAr: 'النسخ الاحتياطي السحابي المؤتمت واستعادة قواعد البيانات لحظة الحاجة.',
    purposeEn: 'Automated cloud backup and on-demand database restore.',
    stepsAr: [
      'تحقق من نجاح آخر نسخة تلقائية يومياً — يجب أن تكون حالتها "مكتملة".',
      'قبل أي تحديث كبير للنظام شغّل نسخة يدوية فورية.',
      'اختبر الاستعادة على نسخة تجريبية كل ربع سنة للتأكد من سلامة الملفات.',
    ],
    stepsEn: [
      'Confirm the latest automatic backup succeeded daily — status must read Complete.',
      'Trigger a manual snapshot before any major system upgrade.',
      'Quarterly, test-restore to a sandbox to verify archive integrity.',
    ],
  },

  docs: {
    purposeAr: 'مركز المعرفة: المواصفات الفنية، دليل المستخدم، والسيناريوهات التشغيلية المعتمدة.',
    purposeEn: 'Knowledge hub: technical specifications, user manual, and approved playbooks.',
    stepsAr: [
      'بدّل بين التبويبات الثلاثة: السيناريوهات، المواصفات، ودليل المستخدم.',
      'استخدم حقل البحث أعلى الصفحة لتصفية أقسام الوثيقة الحالية فوراً.',
      'زر الطباعة يولّد نسخة ورقية رسمية بالهوية المؤسسية الكاملة.',
    ],
    stepsEn: [
      'Switch between the three tabs: Scenarios, Specifications, and User Manual.',
      'Use the search box at the top to filter sections of the current document.',
      'The print button produces an official branded hard copy.',
    ],
  },

  scenarios: {
    purposeAr: 'سيناريوهات الاستجابة الإنسانية المعتمدة: خطوات جاهزة للطوارئ والتوزيع والتقييم.',
    purposeEn: 'Approved humanitarian response playbooks: ready steps for emergencies and distribution.',
    stepsAr: [
      'افتح السيناريو المطابق لطبيعة الاستجابة (طارئ/توزيع/مسح ميداني).',
      'اتبع الخطوات بالترتيب وضع علامة إنجاز على كل خطوة مكتملة.',
      'السيناريوهات قابلة للطباعة ككتيبات ميدانية ورقية للفرق.',
    ],
    stepsEn: [
      'Open the playbook matching your response type (emergency/distribution/survey).',
      'Follow steps in order and tick off each completed one.',
      'Playbooks print as paper field handbooks for teams.',
    ],
  },

  allocations: {
    purposeAr: 'تخطيط الموارد البشرية: إسناد الكوادر للمشاريع وقياس ساعات العمل والأثر التشغيلي.',
    purposeEn: 'Workforce planning: staff-to-project assignment, hours, and operational load.',
    stepsAr: [
      'اسحب الموظف إلى المشروع المستهدف أو استخدم زر الإسناد السريع.',
      'راقب مؤشر الحمل التشغيلي — تجاوز 100% يعني حاجة لإعادة التوزيع.',
      'راجع مصفوفة الإسنادات أسبوعياً مع مديري المشاريع لتفادي التعارضات.',
    ],
    stepsEn: [
      'Drag a staff member onto the target project or use quick assign.',
      'Watch the workload gauge — above 100% means rebalancing is needed.',
      'Review the allocation matrix weekly with project managers to avoid clashes.',
    ],
  },

  geospatial: {
    purposeAr: 'الخريطة الجغرافية التفاعلية للأثر: مواقع المستفيدين والمستودعات ومشاريع المياه.',
    purposeEn: 'Interactive GIS impact map: beneficiary sites, warehouses, and water projects.',
    stepsAr: [
      'فعّل طبقات الخريطة من لوحة التحكم الجانبية (مستفيدون/مخازن/آبار).',
      'اضغط أي نقطة لعرض بطاقة التفاصيل والانتقال إلى سجلها الأصلي.',
      'استخدم التجميع العنقودي عند عرض مئات النقاط لتحسين الأداء.',
    ],
    stepsEn: [
      'Toggle map layers from the side panel (beneficiaries/warehouses/boreholes).',
      'Click any pin for its detail card and a link to the source record.',
      'Enable clustering when rendering hundreds of pins for smooth performance.',
    ],
  },

  strategic_planning: {
    purposeAr: 'الخطة الاستراتيجية: الرؤية، الأهداف المندمجة، ومؤشرات الأداء KPIs بمحاذاة رأسية.',
    purposeEn: 'Strategic plan: vision, cascading objectives, and vertically aligned KPIs.',
    stepsAr: [
      'ابدأ من الهدف الاستراتيجي ثم انزل للبرامج والمشاريع المرتبطة به.',
      'حدد قيمة مستهدفة وواقعية لكل مؤشر KPI مع دورية قياس واضحة.',
      'راجع مصفوفة المحاذاة ربع سنوياً للتأكد من انضباط المشاريع تحت أهدافها.',
    ],
    stepsEn: [
      'Start at strategic objectives then drill to linked programs and projects.',
      'Set realistic targets for every KPI with an explicit measurement cadence.',
      'Review the alignment matrix quarterly to keep projects under their objectives.',
    ],
  },

  investments: {
    purposeAr: 'الأوقاف التنموية والمشاريع الاستثمارية: العوائد، توزيع الأرباح، وحماية أصل الوقف.',
    purposeEn: 'Endowments & investment projects: returns, profit distribution, corpus protection.',
    stepsAr: [
      'سجل أصل الوقف وعوائده المتوقعة قبل اعتماد أي توزيع أرباح.',
      'التزم بمحفظة الاستثمار الأخلاقية المعتمدة من الهيئة الشرعية.',
      'راجع معدل العائد ربع سنوياً وقارنه بمؤشر التضخم المحلي.',
    ],
    stepsEn: [
      'Register endowment corpus and expected yields before approving distributions.',
      'Adhere to the Shariah-board-approved ethical investment portfolio.',
      'Compare quarterly yield against local inflation benchmarks.',
    ],
  },

  hr_dashboard: {
    purposeAr: 'لوحة الموارد البشرية 3.2: دورة حياة الموظف، الرواتب IPSAS، وتقييم الأداء.',
    purposeEn: 'HR OS 3.2 dashboard: employee lifecycle, IPSAS payroll, and appraisals.',
    stepsAr: [
      'أكمل ملف الموظف 360 (عقد، مستندات، تعيين) قبل إضافته لمسير الرواتب.',
      'صادق على تغييرات الرواتب من مسار الاعتماد — لا تعديلات مباشرة.',
      'استخدم تصدير العقود الرسمية PDF عند التعيين وانتهاء الخدمة.',
    ],
    stepsEn: [
      'Complete Employee-360 profile (contract, documents, placement) before payroll.',
      'Approve salary changes through workflow — no direct edits.',
      'Export official PDF contracts on hiring and separation.',
    ],
    tipAr: 'تنبيه: مسير الرواتب يقفل نهائياً بعد الاعتماد — الأخطاء تُصحح في مسير الشهر التالي.',
    tipEn: 'Alert: payroll locks after approval — corrections post in next month\'s run.',
  },

  'third-party-network': {
    purposeAr: 'شبكة الأطراف: التجار، المطالبات، مطابقة القسائم الرقمية، والتسويات المالية.',
    purposeEn: 'Third-party network: merchants, claims, digital voucher matching, settlements.',
    stepsAr: [
      'اعتمد ملف التاجر (ترخيص + حساب بنكي) قبل إضافته لشبكة الصرف.',
      'طابق كل مطالبة مع قسائم QR المنصرفة فعلياً قبل قبولها.',
      'أجرِ التسوية المالية الشهرية وأرفق كشف الحساب الموقع.',
    ],
    stepsEn: [
      'Approve merchant files (licence + bank account) before network onboarding.',
      'Match every claim against actually-redeemed QR vouchers before acceptance.',
      'Run monthly financial settlement with a signed statement attached.',
    ],
  },

  sales: {
    purposeAr: 'المبيعات وتنمية الموارد: حملات التبرع، الفواتير، والمنتجات الوقفية والإيرادات المستدامة.',
    purposeEn: 'Sales & fundraising: campaigns, invoices, endowment products, sustainable revenue.',
    stepsAr: [
      'أنشئ حملة التبرع وحدد هدفها المالي وفترتها قبل نشر روابط التبرع.',
      'كل تبرع إلكتروني يولّد سند قبض آلياً عبر Webhook بوابة الدفع.',
      'راجع الفواتير المتأخرة أسبوعياً وأرسل التذكيرات الآلية للمعفين.',
    ],
    stepsEn: [
      'Create campaigns with financial targets and periods before publishing links.',
      'Each online donation auto-generates a receipt via payment-gateway webhook.',
      'Review overdue invoices weekly and trigger automated reminders.',
    ],
    tipAr: 'نصيحة: فعّل تقرير الاحتفاظ بالمانحين من التحليلات التنبؤية لزيادة الاستدامة.',
    tipEn: 'Tip: enable donor-retention analytics from Predictive BI to boost sustainability.',
  },
};

/** Returns guidance for a tab, falling back to undefined for unknown tabs. */
export function getViewGuidance(tab: string): ViewGuidance | undefined {
  return VIEW_GUIDANCE[tab];
}
