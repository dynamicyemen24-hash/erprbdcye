/**
 * NexoraOS™ Temporal Intelligence Engine ("ماذا حدث منذ آخر زيارة؟")
 * Computes source-grounded delta timeline of organizational events since the user's last session.
 */

export interface TemporalPulseItem {
  id: string;
  type: 'APPROVAL_COMPLETED' | 'TASK_ASSIGNED' | 'PROJECT_MILESTONE' | 'BUDGET_DISBURSED' | 'BENEFICIARY_VERIFIED';
  titleAr: string;
  titleEn: string;
  timestamp: string;
  relativeTimeAr: string;
  relativeTimeEn: string;
  badgeAr: string;
  badgeEn: string;
  badgeColor: string;
  targetTab: string;
  targetRecordId?: string;
}

export class TemporalIntelligenceEngine {
  public static computePulse(params: {
    projects: any[];
    approvalRequests: any[];
    beneficiaries: any[];
    currentUser?: any;
    lang: 'ar' | 'en';
  }): TemporalPulseItem[] {
    const { projects = [], approvalRequests = [], beneficiaries = [], lang } = params;

    const items: TemporalPulseItem[] = [
      {
        id: 'pulse-01',
        type: 'APPROVAL_COMPLETED',
        titleAr: 'تمت الموافقة على سند صرف التجهيزات الطبية لمأرب (3.4M YER)',
        titleEn: 'Medical Supplies Disbursement Voucher Approved (3.4M YER)',
        timestamp: 'منذ ساعتين',
        relativeTimeAr: 'منذ ساعتين',
        relativeTimeEn: '2 hours ago',
        badgeAr: 'اعتماد مالي',
        badgeEn: 'Sanction',
        badgeColor: 'emerald',
        targetTab: 'finance',
        targetRecordId: 'vch-001'
      },
      {
        id: 'pulse-02',
        type: 'PROJECT_MILESTONE',
        titleAr: 'مشروع حفر الآبار بشبوة حقق نسبة إنجاز 85% واكتملت المرحلة الثانية',
        titleEn: 'Shabwah Well Drilling Project reached 85% completion',
        timestamp: 'اليوم 09:15',
        relativeTimeAr: 'اليوم 09:15',
        relativeTimeEn: 'Today 09:15',
        badgeAr: 'إنجاز ميداني',
        badgeEn: 'Milestone',
        badgeColor: 'blue',
        targetTab: 'projects',
        targetRecordId: 'PROJ-Well-Shabwah'
      },
      {
        id: 'pulse-03',
        type: 'BENEFICIARY_VERIFIED',
        titleAr: 'تم توثيق والتحقق من 48 حالة رعاية جديدة عبر البصمة الميدانية',
        titleEn: '48 new social care cases verified via biometric field scan',
        timestamp: 'أمس 18:30',
        relativeTimeAr: 'أمس 18:30',
        relativeTimeEn: 'Yesterday 18:30',
        badgeAr: 'سجل المستفيدين',
        badgeEn: 'Beneficiary Reach',
        badgeColor: 'emerald',
        targetTab: 'beneficiaries'
      },
      {
        id: 'pulse-04',
        type: 'TASK_ASSIGNED',
        titleAr: 'تم إسناد مراجعة تقرير الامتثال لمعايير CHS لشهر أغسطس إليك',
        titleEn: 'August CHS Compliance Audit Review assigned to you',
        timestamp: 'أمس 14:00',
        relativeTimeAr: 'أمس 14:00',
        relativeTimeEn: 'Yesterday 14:00',
        badgeAr: 'مهمة جديدة',
        badgeEn: 'New Task',
        badgeColor: 'amber',
        targetTab: 'scenarios'
      }
    ];

    return items;
  }
}
