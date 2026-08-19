import { useState, useMemo, useCallback, useEffect } from 'react';
import { InstitutionalHealthEngine, InstitutionalHealthOverview } from '../../core/services/institutionalHealthEngine';
import { ExceptionsEngine, EnterpriseException } from '../../core/services/exceptionsEngine';
import { TemporalIntelligenceEngine, TemporalPulseItem } from '../../core/services/temporalIntelligence';
import { UniversalObjectModel, UniversalEntityRef } from '../../core/services/universalObjectModel';
import { useResumeIntelligence, WorkspaceResumeState } from '../../core/services/resumeIntelligence';
import { useEnterprise } from '../../core/context/EnterpriseContext';

export interface CockpitMyWorkTask {
  id: string;
  titleAr: string;
  titleEn: string;
  projectCode: string;
  projectNameAr: string;
  projectNameEn: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate: string;
  categoryAr: string;
  categoryEn: string;
  estimatedMinutes?: number;
}

export interface CockpitPendingSanction {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  projectCode: string;
  projectNameAr: string;
  projectNameEn: string;
  amount: number;
  currency: string;
  severity: 'CRITICAL' | 'HIGH' | 'NORMAL';
  reasonAr: string;
  reasonEn: string;
  impactAr: string;
  impactEn: string;
  requestedByAr: string;
  requestedByEn: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface UseCockpitDataProps {
  stats: any;
  lang: 'ar' | 'en';
  programs: any[];
  projects: any[];
  beneficiaries: any[];
  sponsorships: any[];
  approvalRequests: any[];
  currentUser?: any;
}

export function useCockpitData({
  stats,
  lang,
  programs = [],
  projects = [],
  beneficiaries = [],
  sponsorships = [],
  approvalRequests = [],
  currentUser
}: UseCockpitDataProps) {
  const { isOnline, activeRolePerspective, securityClearanceLevel } = useEnterprise();
  const { resumeState, clearResumeActivity } = useResumeIntelligence();

  // 1. Universal Preview Drawer State
  const [previewEntity, setPreviewEntity] = useState<UniversalEntityRef | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 2. Active Personal Tasks State
  const [myTasks, setMyTasks] = useState<CockpitMyWorkTask[]>([
    {
      id: 'task-01',
      titleAr: 'اعتماد صرف الموازنة اللوجستية لسلة الإغاثة - تعز',
      titleEn: 'Approve field logistics budget for Relief Basket - Taiz',
      projectCode: 'PROJ-Food-Taiz',
      projectNameAr: 'مشروع سلة الأغذية الإغاثية',
      projectNameEn: 'Food Basket Relief Project',
      priority: 'CRITICAL',
      status: 'TODO',
      dueDate: 'اليوم 14:00',
      categoryAr: 'اعتماد مالي',
      categoryEn: 'Financial Sanction',
      estimatedMinutes: 5
    },
    {
      id: 'task-02',
      titleAr: 'مراجعة وتدقيق قائمة 150 يتيم في مأرب قبل الصرف الإلكتروني',
      titleEn: 'Review & verify 150 orphan beneficiaries before digital payout',
      projectCode: 'PROJ-Orphan-Digital',
      projectNameAr: 'برنامج كفالة الأيتام الرقمي',
      projectNameEn: 'Digital Orphan Sponsorship Program',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: 'اليوم 16:30',
      categoryAr: 'رعاية اجتماعية',
      categoryEn: 'Social Welfare',
      estimatedMinutes: 15
    },
    {
      id: 'task-03',
      titleAr: 'رفع تقرير الامتثال الفصلي للمانحين الدوليين (UNOCHA)',
      titleEn: 'Submit Q2 donor compliance report (UNOCHA)',
      projectCode: 'AUDIT-Q2-REV',
      projectNameAr: 'شراكات المانحين والشفافية',
      projectNameEn: 'Donor Transparency Hub',
      priority: 'NORMAL',
      status: 'TODO',
      dueDate: 'غداً 10:00',
      categoryAr: 'تقارير وحوكمة',
      categoryEn: 'Governance & Compliance',
      estimatedMinutes: 20
    }
  ]);

  // 3. Active Executive Decisions / Sanctions State
  const [sanctions, setSanctions] = useState<CockpitPendingSanction[]>([
    {
      id: 'SANC-01',
      code: 'APPRV-2026-08',
      titleAr: 'الموافقة على ميزانية التجاوز اللوجستي لمشروع سلة الأغذية (تعز)',
      titleEn: 'Approve Corrective Logistics Budget for Taiz Food Basket Project',
      projectCode: 'PROJ-Food-Taiz',
      projectNameAr: 'مشروع الإغاثة العاجلة',
      projectNameEn: 'Emergency Relief Project',
      amount: 4200000,
      currency: 'YER',
      severity: 'CRITICAL',
      reasonAr: 'ارتفاع تكاليف النقل الميداني بنسبة 14% نتيجة تغير مسارات التوريد الجبلية الوعرة.',
      reasonEn: 'Field logistics cost increased by 14% due to rugged mountain route detours.',
      impactAr: 'تأمين الإمداد الغذائي لـ 8,500 أسرة مستفيدة قبل نهاية الشهر الجاري.',
      impactEn: 'Securing food supply for 8,500 beneficiary families before month end.',
      requestedByAr: 'م. أحمد العديني (مدير العمليات)',
      requestedByEn: 'Eng. Ahmed Al-Odaini (Field Ops)',
      createdAt: '2026-08-16 08:30',
      status: 'PENDING'
    },
    {
      id: 'SANC-02',
      code: 'APPRV-2026-09',
      titleAr: 'المصادقة على عقود توريد أجهزة حفر آبار المياه الإنشائية (شبوة)',
      titleEn: 'Approve Structural Well Drilling Supplier Contracts (Shabwah)',
      projectCode: 'PROJ-Well-Shabwah',
      projectNameAr: 'مشروع آبار المياه',
      projectNameEn: 'Well Drilling Project',
      amount: 12500000,
      currency: 'YER',
      severity: 'CRITICAL',
      reasonAr: 'انقضاء مهلة العطاءات المفتوحة مع الحصول على خصم تفاوضي 5% من المورد الأول.',
      reasonEn: 'Tender window expiring; supplier offered 5% negotiated discount.',
      impactAr: 'توفير مياه شرب نقية لـ 12,000 مستفيد في المناطق النائية بشبوة.',
      impactEn: 'Providing clean drinking water to 12,000 beneficiaries in Shabwah.',
      requestedByAr: 'لجنة المشتريات الرئيسية',
      requestedByEn: 'Central Tenders Board',
      createdAt: '2026-08-15 17:00',
      status: 'PENDING'
    }
  ]);

  // 4. Closed-Loop Actions for Task toggling
  const handleToggleTaskStatus = useCallback((taskId: string) => {
    setMyTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'TODO' ? 'IN_PROGRESS' : t.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  }, []);

  // 5. Closed-Loop Actions for Sanctions Execution (Auditable)
  const handleExecuteSanction = useCallback((sanctionId: string, action: 'APPROVED' | 'REJECTED', reasonNote?: string) => {
    setSanctions(prev => prev.map(s => {
      if (s.id === sanctionId) {
        return { ...s, status: action };
      }
      return s;
    }));
  }, []);

  // 6. Universal Quick Preview Resolver
  const handleOpenRecordPreview = useCallback((type: UniversalEntityRef['type'], idOrCode: string) => {
    const resolved = UniversalObjectModel.resolveEntity(type, idOrCode, {
      projects,
      programs,
      beneficiaries,
      sponsorships,
      approvalRequests,
      lang
    });
    if (resolved) {
      setPreviewEntity(resolved);
      setIsPreviewOpen(true);
    }
  }, [projects, programs, beneficiaries, sponsorships, approvalRequests, lang]);

  const handleCloseRecordPreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewEntity(null);
  }, []);

  // 7. Compute Institutional Health Scorecard
  const health = useMemo<InstitutionalHealthOverview>(() => {
    return InstitutionalHealthEngine.computeHealth({
      projects,
      programs,
      approvalRequests,
      beneficiaries,
      sponsorships,
      stats,
      lang
    });
  }, [projects, programs, approvalRequests, beneficiaries, sponsorships, stats, lang]);

  // 8. Compute Exception-First Triage Radar
  const exceptions = useMemo<EnterpriseException[]>(() => {
    return ExceptionsEngine.triageExceptions({
      projects,
      programs,
      approvalRequests,
      lang
    });
  }, [projects, programs, approvalRequests, lang]);

  // 9. Compute Temporal Pulse (Since Last Visit)
  const temporalPulse = useMemo<TemporalPulseItem[]>(() => {
    return TemporalIntelligenceEngine.computePulse({
      projects,
      approvalRequests,
      beneficiaries,
      currentUser,
      lang
    });
  }, [projects, approvalRequests, beneficiaries, currentUser, lang]);

  return {
    health,
    exceptions,
    temporalPulse,
    myTasks,
    sanctions,
    resumeState,
    isOnline,
    activeRolePerspective,
    securityClearanceLevel,
    previewEntity,
    isPreviewOpen,
    handleToggleTaskStatus,
    handleExecuteSanction,
    handleOpenRecordPreview,
    handleCloseRecordPreview,
    clearResumeActivity
  };
}
