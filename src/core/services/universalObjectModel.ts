/**
 * NexoraOS™ Universal Object Model (UOM)
 * Enables seamless cross-entity graph resolution and fast contextual inspection across:
 * Voucher -> Project -> Beneficiary -> Activity -> Budget -> Document -> Audit
 */

export interface UniversalEntityRef {
  id: string;
  type: 'project' | 'program' | 'voucher' | 'invoice' | 'activity' | 'beneficiary' | 'sponsorship' | 'task' | 'document' | 'approval';
  code: string;
  titleAr: string;
  titleEn: string;
  status: string;
  statusLabelAr: string;
  statusLabelEn: string;
  amount?: number;
  currency?: string;
  date?: string;
  ownerName?: string;
  ownerRole?: string;
  organizationId?: string;
  relatedEntities: {
    relationshipType: string;
    relationshipLabelAr: string;
    relationshipLabelEn: string;
    targetType: string;
    targetId: string;
    targetCode: string;
    targetTitleAr: string;
    targetTitleEn: string;
    targetTab: string;
  }[];
  timeline: {
    timestamp: string;
    actionAr: string;
    actionEn: string;
    actorName: string;
    actorRole: string;
    verified: boolean;
  }[];
  metadata: Record<string, string | number | boolean>;
  allowedActions: {
    actionId: string;
    labelAr: string;
    labelEn: string;
    icon: string;
    variant: 'primary' | 'secondary' | 'danger' | 'ghost';
    requiresStepUpAuth?: boolean;
  }[];
}

export class UniversalObjectModel {
  public static resolveEntity(
    type: UniversalEntityRef['type'],
    idOrCode: string,
    context: {
      projects?: any[];
      programs?: any[];
      beneficiaries?: any[];
      sponsorships?: any[];
      approvalRequests?: any[];
      lang: 'ar' | 'en';
    }
  ): UniversalEntityRef | null {
    const { projects = [], programs = [], beneficiaries = [], sponsorships = [], approvalRequests = [] } = context;

    if (type === 'project') {
      const proj = projects.find(p => p.id === idOrCode || p.code === idOrCode || p.project_code === idOrCode);
      if (!proj) return null;

      const budget = parseFloat(proj.budget || '0');
      const progress = parseFloat(proj.progress_percent || '0');
      const spent = parseFloat(proj.spent_amount || '0') || (budget * (progress / 100));

      return {
        id: proj.id || proj.code,
        type: 'project',
        code: proj.code || proj.project_code || 'PROJ',
        titleAr: proj.name_ar || proj.name_en || 'مشروع تنموي',
        titleEn: proj.name_en || proj.name_ar || 'Development Project',
        status: proj.status_code || 'active',
        statusLabelAr: proj.status_code === 'active' ? 'نشط ميدانياً' : 'مكتمل',
        statusLabelEn: proj.status_code === 'active' ? 'Active in Field' : 'Completed',
        amount: budget,
        currency: proj.currency_code || 'YER',
        date: proj.start_date || '2026-01-01',
        ownerName: 'المهندس أحمد العديني',
        ownerRole: 'مدير المشروع الميداني',
        organizationId: proj.organization_id || '00000000-0000-0000-0000-000000000001',
        relatedEntities: [
          {
            relationshipType: 'PARENT_PROGRAM',
            relationshipLabelAr: 'البرنامج الاستراتيجي الحاضن',
            relationshipLabelEn: 'Parent Strategic Program',
            targetType: 'program',
            targetId: proj.program_id || 'prog-01',
            targetCode: 'PRG-01',
            targetTitleAr: 'برنامج الأمن الغذائي والإغاثة الطارئة',
            targetTitleEn: 'Food Security & Emergency Relief Program',
            targetTab: 'programs'
          },
          {
            relationshipType: 'FINANCIAL_BUDGET',
            relationshipLabelAr: 'حساب الموازنة ودفتر الأستاذ (IPSAS)',
            relationshipLabelEn: 'General Ledger Budget (IPSAS)',
            targetType: 'voucher',
            targetId: `acc-${proj.code}`,
            targetCode: `GL-${proj.code}`,
            targetTitleAr: `المصروفات الفعلية: ${(spent / 1000000).toFixed(2)}M / الموازنة: ${(budget / 1000000).toFixed(2)}M`,
            targetTitleEn: `Spent: ${(spent / 1000000).toFixed(2)}M / Budget: ${(budget / 1000000).toFixed(2)}M`,
            targetTab: 'finance'
          },
          {
            relationshipType: 'BENEFICIARY_BENCHMARK',
            relationshipLabelAr: 'سجل المستفيدين المستهدفين',
            relationshipLabelEn: 'Targeted Beneficiary Registry',
            targetType: 'beneficiary',
            targetId: 'ben-cluster-01',
            targetCode: 'BEN-GRP-Taiz',
            targetTitleAr: `${proj.target_beneficiaries || 8500} مستفيد تم التحقق منهم`,
            targetTitleEn: `${proj.target_beneficiaries || 8500} Verified Beneficiaries`,
            targetTab: 'beneficiaries'
          }
        ],
        timeline: [
          {
            timestamp: '2026-08-10 09:30',
            actionAr: 'تم اعتماد تقرير الإنجاز الميداني للربع الثاني',
            actionEn: 'Q2 Field Progress Report Certified',
            actorName: 'م. أحمد العديني',
            actorRole: 'مدير المشروع',
            verified: true
          },
          {
            timestamp: '2026-08-01 14:15',
            actionAr: 'صرف دفعة الموردين الأولى للمعدات الإنشائية',
            actionEn: 'Initial Vendor Tranche Disbursed',
            actorName: 'أ. سامي الحميري',
            actorRole: 'المدير المالي',
            verified: true
          },
          {
            timestamp: '2026-01-15 10:00',
            actionAr: 'اعتماد الميثاق التأسيسي للمشروع وفتح الحساب الائتماني',
            actionEn: 'Project Charter & Escrow Account Opened',
            actorName: 'مجلس الإدارة',
            actorRole: 'لجنة البرامج والمشاريع',
            verified: true
          }
        ],
        metadata: {
          'نسبة الإنجاز الفعلي': `${progress}%`,
          'الموقع الجغرافي': proj.location_name || 'تعز - مديرية المظفر',
          'مستوى المخاطر': proj.risk_level || 'متوسط (Medium)',
          'معيار التوافق الإنساني': 'Sphere Minimum Standards / CHS'
        },
        allowedActions: [
          {
            actionId: 'INSPECT_WBS',
            labelAr: 'استعراض خطة الأنشطة (WBS)',
            labelEn: 'Inspect WBS Activities',
            icon: 'Layers',
            variant: 'primary'
          },
          {
            actionId: 'PRINT_REPORT',
            labelAr: 'طباعة تقرير الأداء المعتمد',
            labelEn: 'Print Certified Report',
            icon: 'Printer',
            variant: 'secondary'
          },
          {
            actionId: 'ADJUST_BUDGET',
            labelAr: 'طلب مناقلة موازنة',
            labelEn: 'Request Budget Transfer',
            icon: 'Coins',
            variant: 'secondary',
            requiresStepUpAuth: true
          }
        ]
      };
    }

    if (type === 'approval') {
      const app = approvalRequests.find(a => a.id === idOrCode || a.code === idOrCode);
      const reqAmount = parseFloat(app?.amount || '4200000');

      return {
        id: app?.id || idOrCode,
        type: 'approval',
        code: app?.code || 'APPRV-2026-08',
        titleAr: app?.title_ar || app?.title || 'طلب اعتماد ميزانية تعويضية للنقل الميداني',
        titleEn: app?.title_en || app?.title || 'Contingency Logistics Budget Sanction Request',
        status: app?.status || 'pending',
        statusLabelAr: 'بانتظار المصادقة التنفيذية',
        statusLabelEn: 'Pending Executive Sanction',
        amount: reqAmount,
        currency: 'YER',
        date: app?.date || '2026-08-14',
        ownerName: 'مدير قطاع الإغاثة والمشتريات',
        ownerRole: 'طالب الاعتماد المعتمد',
        relatedEntities: [
          {
            relationshipType: 'TARGET_PROJECT',
            relationshipLabelAr: 'المشروع المرتبط بالصرف',
            relationshipLabelEn: 'Related Expenditure Project',
            targetType: 'project',
            targetId: 'PROJ-Food-Taiz',
            targetCode: 'PROJ-Food-Taiz',
            targetTitleAr: 'مشروع سلة الأغذية الإغاثية - تعز',
            targetTitleEn: 'Taiz Food Basket Project',
            targetTab: 'projects'
          },
          {
            relationshipType: 'SUPPORTING_INVOICE',
            relationshipLabelAr: 'فاتورة وعطاء المورد المعتمد',
            relationshipLabelEn: 'Supporting Vendor Invoice & Tender',
            targetType: 'invoice',
            targetId: 'INV-2026-041',
            targetCode: 'INV-2026-041',
            targetTitleAr: 'عقد النقل الجبلي وتوزيع السلال',
            targetTitleEn: 'Mountain Logistics & Distribution Contract',
            targetTab: 'contracts'
          }
        ],
        timeline: [
          {
            timestamp: '2026-08-14 11:20',
            actionAr: 'تمت مراجعة الوثائق والموافقة المبدئية من التدقيق المالي الداخلي',
            actionEn: 'Internal Audit & Compliance Verification Passed',
            actorName: 'أ. فهد الشميري',
            actorRole: 'مدقق الحسابات',
            verified: true
          },
          {
            timestamp: '2026-08-13 16:45',
            actionAr: 'تم رفع طلب التعزيز من مدير العمليات الميدانية',
            actionEn: 'Enhancement Request Raised by Field Operations',
            actorName: 'م. أحمد العديني',
            actorRole: 'مدير العمليات',
            verified: true
          }
        ],
        metadata: {
          'المبلغ المطلوب': `${(reqAmount / 1000000).toFixed(2)} مليون ريال يمني`,
          'بند الصرف': 'احتياطي الطوارئ والتقلبات اللوجستية',
          'عدد المستفيدين المتأثرين': '8,500 أسرة مستفيدة',
          'مستوى الصلاحية': 'L4_EXECUTIVE / L5_ADMIN'
        },
        allowedActions: [
          {
            actionId: 'EXECUTE_APPROVE',
            labelAr: 'المصادقة والاعتماد الفوري',
            labelEn: 'Approve & Sanction',
            icon: 'CheckCircle2',
            variant: 'primary',
            requiresStepUpAuth: true
          },
          {
            actionId: 'REQUEST_INFO',
            labelAr: 'طلب مستندات إضافية',
            labelEn: 'Request Evidence',
            icon: 'FileText',
            variant: 'secondary'
          },
          {
            actionId: 'REJECT_REQUEST',
            labelAr: 'رفض مع إبداء الأسباب',
            labelEn: 'Reject with Reason',
            icon: 'X',
            variant: 'danger'
          }
        ]
      };
    }

    return null;
  }
}
