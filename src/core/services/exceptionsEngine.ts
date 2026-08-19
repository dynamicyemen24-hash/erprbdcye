/**
 * NexoraOS™ Institutional Exceptions & Early Warning Radar Engine
 * Identifies high-risk business anomalies, budget overruns, milestone delays, and SLA bottlenecks.
 * Every exception leads directly to a closed-loop resolution action.
 */

export type ExceptionSeverity = 'CRITICAL' | 'WARNING' | 'ATTENTION';
export type ExceptionCategory = 'BUDGET' | 'SCHEDULE' | 'GOVERNANCE' | 'FIELD' | 'COMPLIANCE';

export interface EnterpriseException {
  id: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  entityId: string;
  entityCode: string;
  entityType: 'project' | 'program' | 'voucher' | 'approval' | 'activity' | 'beneficiary';
  entityNameAr: string;
  entityNameEn: string;
  financialImpact?: number;
  currency?: string;
  overdueDays?: number;
  urgencyLabelAr: string;
  urgencyLabelEn: string;
  responsibleRoleAr: string;
  responsibleRoleEn: string;
  recommendedActionAr: string;
  recommendedActionEn: string;
  actionType: 'APPROVE' | 'REALLOCATE' | 'EXTEND_SCHEDULE' | 'REASSIGN' | 'INSPECT';
  targetTab: string;
  targetFilter?: Record<string, any>;
  detectedAt: Date;
  evidenceTrail: string[];
}

export class ExceptionsEngine {
  public static triageExceptions(params: {
    projects: any[];
    programs: any[];
    approvalRequests: any[];
    lang: 'ar' | 'en';
  }): EnterpriseException[] {
    const { projects = [], programs = [], approvalRequests = [], lang } = params;
    const exceptions: EnterpriseException[] = [];
    const now = new Date();

    // 1. Detect Financial Overruns & Ceiling Breaches
    projects.forEach(p => {
      const budget = parseFloat(p.budget || '0');
      const progress = parseFloat(p.progress_percent || '0');
      const spent = parseFloat(p.spent_amount || '0') || (budget * (progress / 100));

      if (budget > 0 && spent > budget) {
        const overrunAmount = spent - budget;
        const overrunPercent = Math.round((overrunAmount / budget) * 100);

        exceptions.push({
          id: `exc-budget-${p.id || p.code}`,
          category: 'BUDGET',
          severity: overrunPercent > 10 ? 'CRITICAL' : 'WARNING',
          titleAr: `تجاوز الموازنة المعتمدة (${overrunPercent}%)`,
          titleEn: `Budget Ceiling Overrun (${overrunPercent}%)`,
          descriptionAr: `تجاوزت المصروفات الفعلية الموازنة المخصصة بمقدار ${(overrunAmount / 1000000).toFixed(2)} مليون ريال يمني نتيجة متطلبات التوريد الميداني.`,
          descriptionEn: `Actual expenditures exceeded allocated baseline by ${(overrunAmount / 1000000).toFixed(2)}M YER.`,
          entityId: p.id || p.code,
          entityCode: p.code || 'PROJ',
          entityType: 'project',
          entityNameAr: p.name_ar || p.name_en || 'مشروع ميداني',
          entityNameEn: p.name_en || p.name_ar || 'Field Project',
          financialImpact: overrunAmount,
          currency: 'YER',
          urgencyLabelAr: overrunPercent > 10 ? 'حرج - يتطلب قراراً مالياً' : 'مهم - قيد التدقيق',
          urgencyLabelEn: overrunPercent > 10 ? 'Critical - Needs Sanction' : 'High Priority',
          responsibleRoleAr: 'المدير المالي / مدير المشروع',
          responsibleRoleEn: 'Finance Director / Project Manager',
          recommendedActionAr: 'إجراء مناقلة مالية من الاحتياطي واعتماد الموازنة التعويضية.',
          recommendedActionEn: 'Reallocate contingency reserve to adjust budget baseline.',
          actionType: 'REALLOCATE',
          targetTab: 'finance',
          targetFilter: { projectsStatus: 'active' },
          detectedAt: now,
          evidenceTrail: [
            `IPSAS General Ledger: Total debited ${(spent / 1000000).toFixed(2)}M YER`,
            `Approved Baseline: ${(budget / 1000000).toFixed(2)}M YER`,
            `Variance: +${overrunPercent}%`
          ]
        });
      }
    });

    // 2. Detect Critical Path Milestone Delays
    projects.forEach(p => {
      const progress = parseFloat(p.progress_percent || '0');
      if (p.end_date) {
        const diffDays = Math.ceil((new Date(p.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0 && progress < 100) {
          const overdueDays = Math.abs(diffDays);
          exceptions.push({
            id: `exc-delay-${p.id || p.code}`,
            category: 'SCHEDULE',
            severity: 'CRITICAL',
            titleAr: `تأخر المشروع عن موعد التسليم المجدول (${overdueDays} يوم)`,
            titleEn: `Project Overdue Past Deadline (${overdueDays} Days)`,
            descriptionAr: `تجاوز المشروع التاريخ المستهدف للإغلاق وما زال عند نسبة إنجاز ${progress}%.`,
            descriptionEn: `Target delivery date exceeded while progress is at ${progress}%.`,
            entityId: p.id || p.code,
            entityCode: p.code || 'PROJ',
            entityType: 'project',
            entityNameAr: p.name_ar || p.name_en || 'مشروع ميداني',
            entityNameEn: p.name_en || p.name_ar || 'Field Project',
            overdueDays,
            urgencyLabelAr: 'حرج جداً - تدبير عاجل',
            urgencyLabelEn: 'Urgent Intervention Required',
            responsibleRoleAr: 'مدير البرامج والتخطيط',
            responsibleRoleEn: 'Programs & Planning Director',
            recommendedActionAr: 'إصدار ملحق زمني وإعادة توزيع فرق العمل الميدانية لتسريع الإنجاز.',
            recommendedActionEn: 'Issue baseline schedule extension and fast-track remaining activities.',
            actionType: 'EXTEND_SCHEDULE',
            targetTab: 'projects',
            targetFilter: { projectsStatus: 'active' },
            detectedAt: now,
            evidenceTrail: [
              `Target Completion Date: ${p.end_date}`,
              `Current Date: ${now.toISOString().split('T')[0]}`,
              `Recorded Progress: ${progress}%`
            ]
          });
        } else if (diffDays > 0 && diffDays <= 30 && progress < 70) {
          exceptions.push({
            id: `exc-risk-schedule-${p.id || p.code}`,
            category: 'SCHEDULE',
            severity: 'WARNING',
            titleAr: `مخاطر تأخر في الجدول الزمني (متبقي ${diffDays} يوم)`,
            titleEn: `Schedule Slippage Risk (${diffDays} Days Left)`,
            descriptionAr: `متبقي ${diffDays} يوماً على الموعد النهائي مع بقاء نسبة الإنجاز عند ${progress}%.`,
            descriptionEn: `Approaching deadline with progress lagging at ${progress}%.`,
            entityId: p.id || p.code,
            entityCode: p.code || 'PROJ',
            entityType: 'project',
            entityNameAr: p.name_ar || p.name_en || 'مشروع ميداني',
            entityNameEn: p.name_en || p.name_ar || 'Field Project',
            overdueDays: diffDays,
            urgencyLabelAr: 'تحذير مسار حرج',
            urgencyLabelEn: 'Critical Path Warning',
            responsibleRoleAr: 'مدير المشروع الميداني',
            responsibleRoleEn: 'Field Project Manager',
            recommendedActionAr: 'تكثيف الأنشطة الميدانية وإزالة المعوقات اللوجستية.',
            recommendedActionEn: 'Accelerate field activities and clear logistical roadblocks.',
            actionType: 'INSPECT',
            targetTab: 'projects',
            detectedAt: now,
            evidenceTrail: [
              `Days to target closure: ${diffDays}`,
              `Milestone progress: ${progress}%`
            ]
          });
        }
      }
    });

    // 3. Detect Pending High-Impact Executive Approvals (SLA Bottlenecks)
    const pendingFinancialApprovals = approvalRequests.filter(r => (r.status || '').toLowerCase() === 'pending');
    if (pendingFinancialApprovals.length > 0) {
      const topPending = pendingFinancialApprovals[0];
      const reqAmount = parseFloat(topPending.amount || '0');
      exceptions.push({
        id: `exc-sla-approval-${topPending.id || '01'}`,
        category: 'GOVERNANCE',
        severity: reqAmount > 2000000 ? 'CRITICAL' : 'WARNING',
        titleAr: `طلب اعتماد مالي معلق (${(reqAmount / 1000000).toFixed(1)} مليون ر.ي)`,
        titleEn: `Pending High-Value Financial Approval (${(reqAmount / 1000000).toFixed(1)}M YER)`,
        descriptionAr: `طلب صرف معلق لصالح ${topPending.title_ar || topPending.title || 'توريد مواد إغاثية'} بانتظار المصادقة التنفيذية.`,
        descriptionEn: `Sanction request pending for ${topPending.title_en || topPending.title || 'Field Relief Procurement'}.`,
        entityId: topPending.id || 'app-01',
        entityCode: topPending.code || 'APPRV-01',
        entityType: 'approval',
        entityNameAr: topPending.title_ar || topPending.title || 'طلب اعتماد مالي',
        entityNameEn: topPending.title_en || topPending.title || 'Approval Request',
        financialImpact: reqAmount,
        currency: 'YER',
        urgencyLabelAr: 'بانتظار توقيعك التنفيذي',
        urgencyLabelEn: 'Awaiting Executive Signature',
        responsibleRoleAr: 'المدير التنفيذي / المفوض بالصرف',
        responsibleRoleEn: 'Executive Director / Authorized Signatory',
        recommendedActionAr: 'مراجعة بيانات السند والمطابقة مع وثائق العطاء والاعتماد الفوري.',
        recommendedActionEn: 'Review invoice documentation against tender and execute approval.',
        actionType: 'APPROVE',
        targetTab: 'approvals',
        detectedAt: now,
        evidenceTrail: [
          `Request Code: ${topPending.code || 'APPRV-01'}`,
          `Amount: ${(reqAmount / 1000000).toFixed(2)}M YER`,
          `Status: PENDING_EXECUTIVE_SANCTION`
        ]
      });
    }

    // Sort exceptions by severity and impact
    const severityOrder = { CRITICAL: 0, WARNING: 1, ATTENTION: 2 };
    return exceptions.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return (b.financialImpact || 0) - (a.financialImpact || 0);
    });
  }
}
