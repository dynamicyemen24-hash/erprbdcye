// ============================================================
// Rohamā'a Baynahum — UAMEX ERP™
// Intelligent Humanitarian & Development Enterprise System
// ============================================================

export const ORGANIZATION_CONFIG = {
  // ==========================================================
  // ORGANIZATION
  // ==========================================================
  nameAr: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
  nameEn: "Rohamā'a Baynahum Charity Foundation",

  // ==========================================================
  // PLATFORM
  // ==========================================================
  systemName: 'UAMEX ERP™',
  systemFullName: 'UAMEX ERP™ Intelligent Humanitarian & Development Operating System',
  tagline: 'One Platform. One Organization. One Vision.',

  // ==========================================================
  // BRAND
  // ==========================================================
  logoUrl: '/UAMEX_ERPLOGO.png',
  altLogoUrl: '/src/assets/UAMEX_ERPLOGO.png',
  orgEmblemUrl: '/LogoRohamaab.png',

  brandColors: {
    primary: '#059669', // Emerald Green
    accent: '#d97706',  // Amber Gold
    dark: '#090d16',    // Dark Navy
    light: '#f8fafc',   // Soft Slate Light
  },

  // ==========================================================
  // SYSTEM IDENTITY & EMBLEM ICON SPECIFICATIONS
  // ==========================================================
  systemIdentity: {
    systemCode: 'UAMEX-ERP-2026',
    systemName: 'UAMEX ERP™',
    version: 'v2.6.0-Enterprise',
    edition: 'Global Enterprise & Humanitarian Operating Suite',
    releaseDate: '2026-08-01',
    taglineAr: 'منصة واحدة • مؤسسة واحدة • رؤية موحدة',
    taglineEn: 'One Platform. One Organization. One Vision.',
    architecture: 'Micro-Frontend Enterprise Multi-Tenant Architecture',
    databaseEngine: 'Neon PostgreSQL (Pooled Serverless Core)',
    aiEngine: 'Google Gemini 2.5 AI & Impact Copilot Engine',
    standardsCompliance: [
      'IPSAS (International Public Sector Accounting Standards)',
      'Sphere Project Humanitarian Charter & Minimum Standards',
      'CHS (Core Humanitarian Standard on Quality & Accountability)',
      'IATI (International Aid Transparency Initiative Standard)'
    ],
    emblemIcon: {
      type: 'VECTOR_EMBLEM_SVG',
      primaryGradient: 'from-emerald-900 via-teal-950 to-emerald-950',
      accentColor: '#d97706',
      primaryColor: '#059669',
      borderGlow: 'border-emerald-500/40 hover:border-amber-500/60',
      shieldPattern: 'M12 2L2 7v7c0 5.25 3.75 10.15 10 12.5 6.25-2.35 10-7.25 10-12.5V7l-10-5z'
    }
  },

  // ==========================================================
  // MULTI-TENANCY & SUBSCRIBER WORKSPACE CONFIG
  // ==========================================================
  multiTenancy: {
    enabled: true,
    isolationLevel: 'ORGANIZATION_AND_BRANCH_SCOPED',
    defaultTenantId: '00000000-0000-0000-0000-000000000001',
    allowTenantSwitching: true,
    tenantTypes: [
      { code: 'NGO_HQ', labelAr: 'المقر الرئيسي للمؤسسة (HQ)', labelEn: 'Organization Headquarters (HQ)' },
      { code: 'BRANCH', labelAr: 'فرع إقليمي / مركز ميداني', labelEn: 'Regional Branch / Field Center' },
      { code: 'SUBSIDIARY', labelAr: 'مؤسسة فرعية تابعة', labelEn: 'Specialized Subsidiary Wing' },
      { code: 'ALLIANCE', labelAr: 'تحالف المانحين والشركاء', labelEn: 'International Partner Network' }
    ]
  },

  // ==========================================================
  // CORE SYSTEMS (Nexora Enterprise Domains™)
  //
  // 13 Integrated Domains (NEB-01 to NEB-13) as defined in the
  // Rohamaab NexoraOS™ Constitution (AGENTS.md).
  // ==========================================================
  coreSystems: [
    {
      code: 'NEB-01',
      nameAr: 'نظام الاستراتيجية والأداء',
      nameEn: 'Strategy & Performance OS',
      icon: 'target',
      descriptionAr: 'التخطيط الاستراتيجي المتكامل، ومتابعة مؤشرات الأداء الأساسية (KPIs)، وإعداد بطاقات الأداء المتوازن والمستهدفات المؤسسية.',
      descriptionEn: 'Integrated strategic planning, tracking Key Performance Indicators (KPIs), Balanced Scorecards, and institutional targets.',
      modules: [
        'الرؤية والرسالة والخطط الاستراتيجية',
        'مؤشرات الأداء الاستراتيجية KPIs',
        'بطاقات الأداء المتوازن Balanced Scorecards',
        'خطط التحسين والمراجعات الدورية',
        'مبادرات التغيير والتحول المؤسسي',
        'لوحات قيادة الأداء التنفيذي',
      ],
    },
    {
      code: 'NEB-02',
      nameAr: 'نظام إدارة المحافظ المؤسسية',
      nameEn: 'Portfolio Management OS',
      icon: 'gauge',
      descriptionAr: 'حوكمة وتوجيه محافظ المبادرات والبرامج والمشاريع، ومواءمة تخصيص الموارد الاستراتيجية والتمويل عبر المحفظة الاستثمارية للجمعية.',
      descriptionEn: 'Governance and alignment of initiatives, programs, and projects portfolios, and strategic resource allocation.',
      modules: [
        'تصنيف وتجميع المشاريع بالمحافظ',
        'موازنة الموارد والتمويل عبر المحفظة',
        'الجدوى والتقييم الاستثماري التنموي',
        'تقييم العوائد والأثر الكلي للمحافظ',
        'حوكمة المحافظ واكتشاف التعارضات',
      ],
    },
    {
      code: 'NEB-03',
      nameAr: 'نظام إدارة البرامج التنموية',
      nameEn: 'Program Management OS',
      icon: 'layers',
      descriptionAr: 'إدارة وتوجيه البرامج الإنسانية والتنموية الكبرى، وتحقيق المنافع التراكمية المشتركة والأثر التنموي طويل الأجل.',
      descriptionEn: 'Managing large-scale development and humanitarian programs, achieving cumulative benefits and long-term impact.',
      modules: [
        'التخطيط الهيكلي للبرامج',
        'إدارة موازنات البرامج التنموية',
        'قياس المخرجات والأثر التراكمي للبرنامج',
        'إدارة المنافع وتحقيق الفوائد المستهدفة',
        'التنسيق والتكامل بين مشاريع البرنامج',
      ],
    },
    {
      code: 'NEB-04',
      nameAr: 'نظام إدارة المشاريع التفصيلية',
      nameEn: 'Project Management OS',
      icon: 'folder-kanban',
      descriptionAr: 'التخطيط التفصيلي للمشاريع، وإدارة المهام والمدد الزمنية والميزانيات، وتتبع سجل المخاطر والعقبات والمخرجات الهندسية والفنية.',
      descriptionEn: 'Detailed project planning, task management, scheduling, budgeting, risk register, and quality assurance.',
      modules: [
        'ميثاق المشروع والتأسيس',
        'خطة المشروع ونطاق العمل المعياري',
        'هيكل تقسيم العمل WBS والجدول الزمني',
        'الموازنة التقديرية والتنبؤ المالي للمشروع',
        'إدارة المخاطر وسجل العقبات والمشاكل',
        'إدارة المهام وتخصيص الموارد ومراقبة الجودة',
        'حوكمة التغيير وإغلاق وتسليم المشاريع',
      ],
    },
    {
      code: 'NEB-05',
      nameAr: 'نظام العمليات والميدان',
      nameEn: 'Operations OS',
      icon: 'workflow',
      descriptionAr: 'إدارة الأنشطة والتدخلات الميدانية اليومية، وإصدار أوامر العمل، ومتابعة فرق التنفيذ الميدانية وسجلات الإنجاز اللحظية.',
      descriptionEn: 'Managing daily field operations, executing activities, issuing work orders, and tracking field execution teams.',
      modules: [
        'الأنشطة الميدانية والعمليات اليومية',
        'أوامر العمل الإلكترونية والتكليفات',
        'إدارة فرق العمل الميدانية والعملياتية',
        'قوائم التحقق الميدانية ومعايير الإنجاز',
        'سجلات الإنجاز اليومي والتوثيق الميداني',
        'التتبع الجغرافي والزيارات الميدانية النشطة',
      ],
    },
    {
      code: 'NEB-06',
      nameAr: 'نظام تقديم الخدمات والمستفيدين',
      nameEn: 'Service Delivery OS',
      icon: 'hand-heart',
      descriptionAr: 'إدارة قاعدة بيانات المستفيدين والأسر والحالات الإنسانية، وتقييم الاستحقاق، وإدارة بوابات توزيع الخدمات والطرود الإنسانية والشكاوى.',
      descriptionEn: 'Beneficiary and family databases, social research, eligibility assessment, humanitarian aid package distribution, and feedback systems.',
      modules: [
        'سجل المستفيدين الموحد والملف الديموغرافي',
        'إدارة ملفات الأسر والتغيرات الاجتماعية',
        'دراسة وبحث الحالات الاجتماعية والاحتياجات',
        'نظام طلبات المساعدة ومحرك الاستحقاق الذكي',
        'حزم الخدمات الإنسانية والمساعدات والمكفولين',
        'آلية الإحالات والمتابعة الميدانية والتقييم',
        'إدارة الشكاوى والمقترحات وحل النزاعات والشكاوى',
      ],
    },
    {
      code: 'NEB-07',
      nameAr: 'نظام العضوية والتطوع والمجتمع',
      nameEn: 'Community & Membership OS',
      icon: 'users-round',
      descriptionAr: 'إدارة الأعضاء والمنتسبين والاشتراكات، وبناء شبكة المتطوعين وتوزيع الفرص التطوعية وإدارة الساعات والشهادات المعتمدة.',
      descriptionEn: 'Member registration and subscriptions, volunteer recruitment, volunteer opportunities matching, hour tracking, and certificates.',
      modules: [
        'إدارة سجلات الأعضاء والاشتراكات السنوية',
        'سجل المتطوعين الموحد وتقييم المهارات',
        'الفرص التطوعية الذكية والتكليف والجدولة',
        'ساعات التطوع والتقييم والتحفيز والشهادات',
        'الفعاليات المجتمعية والمبادرات التوعوية والتدريب',
        'الشهادات وبطاقات العضوية الرقمية المشفرة',
      ],
    },
    {
      code: 'NEB-08',
      nameAr: 'نظام الشراكات والتمويل والمانحين',
      nameEn: 'Partnership & Funding OS',
      icon: 'heart-handshake',
      descriptionAr: 'إدارة العلاقات مع الجهات المانحة والشركاء، وتتبع اتفاقيات التعاون ومذكرات التفاهم، وإدارة الكفالات والمنح وتدفقات التمويل والمكفولين.',
      descriptionEn: 'Donor and partner relations, partnership agreements and MoUs, tracking grants, fundraising campaigns, and sponsorships.',
      modules: [
        'إدارة الجهات والمانحين والشركاء والرعاة',
        'سجل الشراكات والاتفاقيات ومذكرات التفاهم',
        'حملات جمع التبرعات والتمويل التنموي',
        'إدارة مقترحات المشاريع التنموية والمنح الدولية',
        'تتبع التزامات المانحين والتقارير الدورية للمانحين',
        'إدارة الكفالات والرعاية للأيتام والأسر والطلاب',
      ],
    },
    {
      code: 'NEB-09',
      nameAr: 'نظام الموارد والأصول والمخزون',
      nameEn: 'Resource & Asset OS',
      icon: 'building-2',
      descriptionAr: 'إدارة الأصول الثابتة والمرافق والأسطول والمركبات، والمخزون والمستودعات وسلاسل الإمداد، وإدارة الموارد البشرية والرواتب.',
      descriptionEn: 'Fixed assets, facilities, fleet, warehousing, inventory management, supply chain logistics, and human resources and payroll.',
      modules: [
        'إدارة الأصول الثابتة والمرافق والعهود',
        'إدارة أسطول المركبات وحركة النقل والوقود وصيانتها',
        'نظام المخازن والمستودعات الطبية والغذائية واللوجستية',
        'إدارة حركة المواد والصرف الميداني والتسليم الفعلي',
        'الموارد البشرية والهيكل الوظيفي والتقييم والرواتب',
        'الصيانة الدورية والوقائية وجودة الأصول والمرافق',
      ],
    },
    {
      code: 'NEB-10',
      nameAr: 'نظام المالية والامتثال IPSAS',
      nameEn: 'Finance & Compliance OS',
      icon: 'wallet',
      descriptionAr: 'الإدارة المالية الشاملة والقيود المحاسبية تماشياً مع معايير المحاسبة الدولية للقطاع العام (IPSAS)، وإعداد الميزانيات والتدقيق المالي والالتزام.',
      descriptionEn: 'Comprehensive financial management and ledger accounting under IPSAS standards, corporate budgeting, auditing, and compliance.',
      modules: [
        'دليل الحسابات الموحد والشجرة المحاسبية الذكية',
        'موازنة الجمعية العامة ومراكز التكلفة والمشروعات',
        'إدارة المقبوضات والمدفوعات والقيود اليومية والترحيل',
        'التسويات البنكية وإدارة السيولة والصناديق النقدية',
        'الالتزام بمعايير IPSAS والحوكمة المالية الصارمة',
        'إعداد القوائم المالية والتقارير الختامية السنوية',
        'نظام التدقيق الداخلي والمراجعة والملاحظات والامتثال',
      ],
    },
    {
      code: 'NEB-11',
      nameAr: 'نظام المعرفة والوثائق والحوكمة',
      nameEn: 'Knowledge & Document OS',
      icon: 'library',
      descriptionAr: 'أرشفة الوثائق الإلكترونية والمراسلات الإدارية، وإدارة سياسات الحوكمة والصلاحيات، وبناء قواعد المعرفة والأدلة الإجرائية للجمعية.',
      descriptionEn: 'Electronic archiving and document management, digital governance, workflow policies, access control, and SOP/knowledge bases.',
      modules: [
        'الأرشفة الإلكترونية وإدارة الوثائق الرقمية DMS',
        'سياسات الحوكمة وتكامل الصلاحيات والوصول الآمن',
        'قواعد المعرفة والأدلة الإجرائية القياسية SOPs',
        'التعلم المؤسسي وتوثيق الدروس المستفادة من الميدان',
        'إدارة التعميمات والمراسلات الإدارية الموحدة والصادر والوارد',
      ],
    },
    {
      code: 'NEB-12',
      nameAr: 'نظام التكامل والخدمات الرقمية',
      nameEn: 'Integration & Digital Services OS',
      icon: 'plug',
      descriptionAr: 'بوابات الخدمات الإلكترونية الموحدة، ومحرك التكامل والربط البيني (APIs) مع الأنظمة الحكومية والبنكية وقواعد بيانات Neon PostgreSQL ومعايير IATI.',
      descriptionEn: 'Digital service portals, open API gateways, secure backend integrations with Neon PostgreSQL, financial institutions, and IATI standards.',
      modules: [
        'بوابات الخدمات الإلكترونية للمستفيدين والمانحين والمتطوعين',
        'واجهات الربط والتكامل المفتوحة APIs والخدمات الموزعة',
        'التكامل الفوري مع قواعد بيانات Neon PostgreSQL والمزامنة المباشرة',
        'نظام الإشعارات والرسائل النصية والبريد الإلكتروني الموحد',
        'التكامل مع معايير مبادرة الشفافية الدولية للمساعدات IATI',
      ],
    },
    {
      code: 'NEB-13',
      nameAr: 'نظام الذكاء الاصطناعي وقياس الأثر',
      nameEn: 'AI Intelligence & Impact OS',
      icon: 'sparkles',
      descriptionAr: 'محرك التحليل الذكي المعتمد على Gemini AI، وتحليل الأثر الإنساني ونظريات التغيير، وقياس الامتثال لمعايير Sphere والمعيار الإنساني CHS.',
      descriptionEn: 'Gemini AI intelligence integration, impact analysis and Theory of Change, CHS Humanitarian Quality & Accountability, and Sphere standards compliance.',
      modules: [
        'مساعد التحرير والتحليل الذكي وقراءة المستندات بالذكاء الاصطناعي',
        'التنبؤات والتحليلات الاستشرافية للأزمات الميدانية والاحتياجات',
        'تحليل الأثر الاجتماعي والتنموي وربطه بنظرية التغيير',
        'الامتثال لمعايير Sphere والمعايير الإنسانية الدولية CHS',
        'التوصيات الذكية وتوزيع المساعدات الذكي للمستحقين',
      ],
    },
    {
      code: 'NEB-14',
      nameAr: 'نظام المشتريات وسلاسل الإمداد',
      nameEn: 'Procurement & Tenders OS',
      icon: 'shopping-cart',
      descriptionAr: 'إدارة دورة المشتريات الكاملة، طلبات الشراء، عروض الأسعار، مقارنة العطاءات، العقود التجارية، وتتبع تسليم الموردين.',
      descriptionEn: 'Complete procurement lifecycle management, purchase requisitions, RFQs, vendor quotation comparisons, contracts, and supplier delivery tracking.',
      modules: [
        'طلبات الشراء والموافقات المالية',
        'إدارة الموردين وتأهيل المقاولين',
        'طرح المناقصات واستقبال العروض الفنية والمالية',
        'لجان الفحص والترسية والعقود التجارية',
        'أوامر الشراء ومتابعة التوريد والاستلام المخزني',
      ],
    },
    {
      code: 'NEB-15',
      nameAr: 'نظام المبيعات والإيرادات وجمع التبرعات',
      nameEn: 'Sales, Revenue & Fundraising OS',
      icon: 'badge-dollar-sign',
      descriptionAr: 'إدارة تدفقات الإيرادات، التبرعات العامة والمخصصة، حملات جمع الأموال، الفوترة الرقمية، وعلاقات المانحين والداعمين.',
      descriptionEn: 'Revenue stream management, general and restricted donations, fundraising campaigns, digital invoicing, and donor relations.',
      modules: [
        'بوابات التبرع السريع وجمع الأموال الرقمية',
        'إدارة الفواتير والإيصالات والمقضيضات المالية',
        'حملات التمويل الجماعي ودعم المشاريع',
        'متابعة التبرعات الوقفية والاستثمارية',
        'تقارير الإيرادات وتحليل الأداء المالي للموارد',
      ],
    },
  ],

  // ==========================================================
  // SHARED WORK TOOLS (أدوات العمل المشتركة)
  // ==========================================================
  workTools: [
    { code: 'TOOL-01', nameAr: 'مركز العمل الموحد', nameEn: 'Unified Work Center', icon: 'layout-dashboard' },
    { code: 'TOOL-02', nameAr: 'مهامي وتكليفاتي', nameEn: 'My Tasks & Actions', icon: 'list-checks' },
    { code: 'TOOL-03', nameAr: 'التقويم والأجندة', nameEn: 'Calendar & Agenda', icon: 'calendar' },
    { code: 'TOOL-04', nameAr: 'مركز الموافقات والتعميد', nameEn: 'Approvals & Sign-offs Center', icon: 'stamp' },
    { code: 'TOOL-05', nameAr: 'طلبات العمل الخدمية', nameEn: 'Work Service Requests', icon: 'file-plus' },
    { code: 'TOOL-06', nameAr: 'المراسلات والبريد الرسمي', nameEn: 'Official Correspondence', icon: 'mail' },
    { code: 'TOOL-07', nameAr: 'النماذج الإلكترونية الذكية', nameEn: 'Smart Dynamic Forms', icon: 'file-input' },
    { code: 'TOOL-08', nameAr: 'البحث الشامل والمتقدم', nameEn: 'Advanced Global Search', icon: 'search' },
    { code: 'TOOL-09', nameAr: 'الملفات والمستندات المشتركة', nameEn: 'Shared Files & Documents', icon: 'folder' },
    { code: 'TOOL-10', nameAr: 'المشاركة والتعاون اللحظي', nameEn: 'Real-time Collaboration', icon: 'share-2' },
    { code: 'TOOL-11', nameAr: 'مركز الإشعارات الفورية', nameEn: 'Instant Notification Center', icon: 'bell' },
    { code: 'TOOL-12', nameAr: 'الملاحظات السريعة والوسوم', nameEn: 'Quick Notes & Tags', icon: 'sticky-note' },
    { code: 'TOOL-13', nameAr: 'التوقيع الإلكتروني المؤمن', nameEn: 'Secure E-Signature', icon: 'signature' },
    { code: 'TOOL-14', nameAr: 'مركز التقارير ولوحات المعلومات', nameEn: 'Reports & Dashboards Center', icon: 'file-bar-chart' },
    { code: 'TOOL-15', nameAr: 'الاستيراد والتصدير الذكي', nameEn: 'Smart Import & Export', icon: 'arrow-left-right' },
    { code: 'TOOL-16', nameAr: 'الطباعة والنماذج المصممة', nameEn: 'Print & Print Templates', icon: 'printer' },
    { code: 'TOOL-17', nameAr: 'المفضلة والاختصارات', nameEn: 'Favorites & Shortcuts', icon: 'star' },
    { code: 'TOOL-18', nameAr: 'المحفوظات والأرشيف الشخصي', nameEn: 'Bookmarks & Personal Archive', icon: 'bookmark' },
    { code: 'TOOL-19', nameAr: 'سجل النشاط وتدقيق الحركات', nameEn: 'Activity Log & System Audit', icon: 'history' },
    { code: 'TOOL-20', nameAr: 'مركز الدعم والمساعدة الرقمي', nameEn: 'Digital Help & Support Desk', icon: 'circle-help' },
  ],

  // ==========================================================
  // FIELD CAPABILITIES (القدرات التشغيلية الميدانية)
  // ==========================================================
  fieldCapabilities: [
    { code: 'FIELD-01', nameAr: 'الخريطة والتتبع الجغرافي', nameEn: 'Maps & GIS Tracking', icon: 'map-pin' },
    { code: 'FIELD-02', nameAr: 'جمع البيانات والمسوحات', nameEn: 'Data Surveys & Collection', icon: 'clipboard-list' },
    { code: 'FIELD-03', nameAr: 'النماذج الميدانية الذكية', nameEn: 'Smart Field Forms', icon: 'clipboard' },
    { code: 'FIELD-04', nameAr: 'التوثيق المصور والبصري', nameEn: 'Photo & Visual Proof', icon: 'camera' },
    { code: 'FIELD-05', nameAr: 'إثبات الحضور والتحقق الميداني', nameEn: 'Field Presence Verification', icon: 'user-check' },
    { code: 'FIELD-06', nameAr: 'التشغيل والعمل دون اتصال', nameEn: 'Offline Operational Support', icon: 'wifi-off' },
    { code: 'FIELD-07', nameAr: 'مزامنة البيانات السحابية', nameEn: 'Cloud Data Synchronization', icon: 'refresh-cw' },
    { code: 'FIELD-08', nameAr: 'التوقيع الحي وبصمة المستفيد', nameEn: 'Recipient Live Signature & Proof', icon: 'file-check' },
    { code: 'FIELD-09', nameAr: 'التوثيق الجغرافي للصور Geotagging', nameEn: 'Geotagging & Metadata Verification', icon: 'navigation' },
    { code: 'FIELD-10', nameAr: 'بلاغات الطوارئ والاستجابة السريعة', nameEn: 'Emergency Alerts & Rapid Response', icon: 'file-warning' },
  ],

  // ==========================================================
  // INTELLIGENCE LAYER (طبقة الذكاء الاصطناعي والتحليل)
  // ==========================================================
  intelligence: [
    { code: 'AI-01', nameAr: 'المساعد الذكي التنفيذي', nameEn: 'Smart Executive Assistant', icon: 'sparkles' },
    { code: 'AI-02', nameAr: 'البحث الدلالي الذكي Semantic', nameEn: 'Intelligent Semantic Search', icon: 'scan-search' },
    { code: 'AI-03', nameAr: 'تحليل البيانات الاستكشافي', nameEn: 'Exploratory Data Intelligence', icon: 'brain' },
    { code: 'AI-04', nameAr: 'تحليل المستندات والأوراق بالذكاء الاصطناعي', nameEn: 'AI Document Reading & OCR', icon: 'file-scan' },
    { code: 'AI-05', nameAr: 'التوليد التلقائي للمحتوى والتقارير', nameEn: 'AI Report & Content Generation', icon: 'wand-sparkles' },
    { code: 'AI-06', nameAr: 'التحليلات الاستشرافية والتنبؤ بالأزمات', nameEn: 'Predictive & Crisis Analytics', icon: 'trending-up' },
    { code: 'AI-07', nameAr: 'كشف المخاطر والأنشطة المشبوهة', nameEn: 'Anomalies & Risk Detection', icon: 'shield-alert' },
    { code: 'AI-08', nameAr: 'محرك التوصيات الذكية للتدخلات', nameEn: 'Action & Intervention Recommendations', icon: 'lightbulb' },
    { code: 'AI-09', nameAr: 'التنبيهات الذكية وتوقع العثرات', nameEn: 'Intelligent Alerts & Bottleneck Warnings', icon: 'bell-ring' },
    { code: 'AI-10', nameAr: 'لوحة قياس الأثر التنموي', nameEn: 'Developmental Impact Intelligence', icon: 'activity' },
    { code: 'AI-11', nameAr: 'مساعد التنفيذ الميداني الرقمي', nameEn: 'Field Execution Digital Copilot', icon: 'bot' },
  ],

  // ==========================================================
  // PLATFORM ADMINISTRATION (إدارة وتشغيل المنصة)
  // ==========================================================
  administration: [
    { code: 'ADMIN-01', nameAr: 'إدارة المستخدمين والموظفين', nameEn: 'Users & Personnel Management', icon: 'users' },
    { code: 'ADMIN-02', nameAr: 'الأدوار ومصفوفة الصلاحيات', nameEn: 'Roles & Fine-grained Permissions', icon: 'shield-check' },
    { code: 'ADMIN-03', nameAr: 'الهيكل التنظيمي والوظيفي', nameEn: 'Organizational & Functional Structure', icon: 'network' },
    { code: 'ADMIN-04', nameAr: 'الفروع ومراكز العمل الجغرافية', nameEn: 'Branches & Geographic Work Centers', icon: 'building-2' },
    { code: 'ADMIN-05', nameAr: 'مصمم ومحرك سير العمل (Workflows)', nameEn: 'Visual Workflow Engine & Workflows', icon: 'git-branch' },
    { code: 'ADMIN-06', nameAr: 'قواعد النمذجة والحوكمة التلقائية', nameEn: 'Modeling Rules & Dynamic Policies', icon: 'sliders-horizontal' },
    { code: 'ADMIN-07', nameAr: 'إدارة البيانات المرجعية والأساسية', nameEn: 'Master Data & Reference Catalogs', icon: 'list' },
    { code: 'ADMIN-08', nameAr: 'إعدادات التكامل وقنوات الربط APIs', nameEn: 'Integrations & API Endpoints Settings', icon: 'plug' },
    { code: 'ADMIN-09', nameAr: 'سجل تدقيق الأمان والعمليات (Audit Log)', nameEn: 'Security & Activity Audit Log', icon: 'shield' },
    { code: 'ADMIN-10', nameAr: 'إعدادات وقنوات الإرسال الموحد', nameEn: 'Notification Engines & Channels Config', icon: 'bell-cog' },
    { code: 'ADMIN-11', nameAr: 'إعدادات النظام والتهيئة الكلية', nameEn: 'Global System Configurations & Setup', icon: 'settings' },
  ],

  // ==========================================================
  // MAIN NAVIGATION SYSTEM (نظام التصفح والتوجه)
  // ==========================================================
  navigation: {
    home: {
      nameAr: 'الرئيسية',
      nameEn: 'Home',
      icon: 'house',
    },
    workCenter: {
      nameAr: 'مركز العمل',
      nameEn: 'Work Center',
      icon: 'layout-dashboard',
    },
    systems: {
      nameAr: 'الأنظمة',
      nameEn: 'Systems',
      icon: 'grid-2x2',
    },
    fieldWork: {
      nameAr: 'التنفيذ الميداني',
      nameEn: 'Field Execution',
      icon: 'play-circle',
    },
    tools: {
      nameAr: 'أدوات العمل',
      nameEn: 'Work Tools',
      icon: 'wrench',
    },
    intelligence: {
      nameAr: 'الذكاء والتحليل',
      nameEn: 'Intelligence',
      icon: 'sparkles',
    },
    administration: {
      nameAr: 'الإدارة والتحكم',
      nameEn: 'Administration',
      icon: 'settings',
    },
  },
};

// ============================================================
// CORE LOOKUP & HELPER UTILITIES
// ============================================================

export const getDomainByCode = (code: string) => {
  return ORGANIZATION_CONFIG.coreSystems.find(
    sys => sys.code.toLowerCase() === code.toLowerCase()
  );
};

export const getWorkToolByCode = (code: string) => {
  return ORGANIZATION_CONFIG.workTools.find(
    tool => tool.code.toLowerCase() === code.toLowerCase()
  );
};

export const getFieldCapabilityByCode = (code: string) => {
  return ORGANIZATION_CONFIG.fieldCapabilities.find(
    cap => cap.code.toLowerCase() === code.toLowerCase()
  );
};

export const getAiIntelligenceByCode = (code: string) => {
  return ORGANIZATION_CONFIG.intelligence.find(
    ai => ai.code.toLowerCase() === code.toLowerCase()
  );
};

export const getAdminToolByCode = (code: string) => {
  return ORGANIZATION_CONFIG.administration.find(
    admin => admin.code.toLowerCase() === code.toLowerCase()
  );
};

