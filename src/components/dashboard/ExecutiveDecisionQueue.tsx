import React from 'react';
import { AlertOctagon, CheckCircle2, Clock, AlertTriangle, ChevronRight, ShieldAlert, FileCheck, ArrowUpRight, Check, X, Sparkles, Filter } from 'lucide-react';

interface ExecutiveDecisionQueueProps {
  lang: 'ar' | 'en';
  approvalRequests?: any[];
  onNavigate?: (tabId: string) => void;
}

export function ExecutiveDecisionQueue({ lang, approvalRequests = [], onNavigate }: ExecutiveDecisionQueueProps) {
  const [activeFilter, setActiveFilter] = React.useState<'ALL' | 'CRITICAL' | 'HIGH' | 'NORMAL'>('ALL');
  const [decisions, setDecisions] = React.useState([
    {
      id: 'DEC-01',
      titleAr: 'الموافقة على ميزانية التجاوز اللوجستي لمشروع سلة الأغذية (تعز)',
      titleEn: 'Approve Corrective Logistics Budget for Taiz Food Basket Project',
      projectCode: 'PROJ-Food-Taiz',
      severity: 'CRITICAL', // CRITICAL, HIGH, NORMAL
      whyNowAr: 'ارتفاع تكاليف النقل الميداني بنسبة 14% نتيجة تغير مسارات التوريد الجبلية.',
      whyNowEn: 'Field logistics cost increased by 14% due to mountain route detours.',
      impactAr: 'تأمين الإمداد الغدائي لـ 8,500 أسرة مستفيدة قبل نهاية الشهر الجاري.',
      impactEn: 'Securing food supply for 8,500 beneficiary families before month end.',
      recommendedAr: 'اعتماد الموازنة التعويضية بقيمة 4.2 مليون ريال يمني مع تحويل الرصيد من الاحتياطي.',
      recommendedEn: 'Approve $4.2M YER contingency budget transfer from reserve fund.',
      deadline: '24 Hours',
      ownerAr: 'المدير التنفيذي',
      ownerEn: 'Executive Director',
      status: 'PENDING'
    },
    {
      id: 'DEC-02',
      titleAr: 'المصادقة على عقود توريد أجهزة حفر آبار المياه الإنشائية (شبوة)',
      titleEn: 'Approve Structural Well Drilling Supplier Contracts (Shabwah)',
      projectCode: 'PROJ-Well-Shabwah',
      severity: 'CRITICAL',
      whyNowAr: 'انقضاء مهلة العطاءات المفتوحة وحاجة المورد لبدء التوريد لتجنب غرامات التأخير.',
      whyNowEn: 'Procurement tender window expiring; supplier requires green light.',
      impactAr: 'توفير مياه شرب صالحة لـ 12,000 مستفيد في المناطق النائية بشبوة.',
      impactEn: 'Providing clean drinking water to 12,000 beneficiaries in Shabwah.',
      recommendedAr: 'التعاقد مع المورد الأول الحاصل على أعلى تقييم فني بخصم 5%.',
      recommendedEn: 'Contract with top-ranked technical vendor with 5% negotiated discount.',
      deadline: '36 Hours',
      ownerAr: 'لجنة المشتريات الرئيسية',
      ownerEn: 'Central Tenders Board',
      status: 'PENDING'
    },
    {
      id: 'DEC-03',
      titleAr: 'اعتماد الخطة المحدثة لكفالة الأيتام والتحول إلى الدفع الإلكتروني',
      titleEn: 'Approve Updated Orphan Sponsorship Digital Disbursement Plan',
      projectCode: 'PROJ-Orphan-Digital',
      severity: 'HIGH',
      whyNowAr: 'اكتمال ربط المحافظ الإلكترونية بنسبة 100% ورغبة الأسر بالاستلام الرقمي.',
      whyNowEn: '100% digital wallet onboarding completed for beneficiaries.',
      impactAr: 'تسريع صرف الكفالات لـ 3,200 يتيم وتقليل تكاليف المعاملات الورقية.',
      impactEn: 'Speeding up payouts for 3,200 orphans while cutting paper transaction overhead.',
      recommendedAr: 'الموافقة على التحويل الرقمي الفوري عبر بوابات الدفع الرسمية.',
      recommendedEn: 'Approve immediate digital payout migration via licensed gateways.',
      deadline: '48 Hours',
      ownerAr: 'مدير قطاع الرعاية',
      ownerEn: 'Social Welfare Director',
      status: 'PENDING'
    },
    {
      id: 'DEC-04',
      titleAr: 'تعديل النطاق الزمني لمشروع المراكز الصحية الطارئة (مأرب)',
      titleEn: 'Schedule Extension Approval for Emergency Health Centers (Marib)',
      projectCode: 'PROJ-Health-Marib',
      severity: 'HIGH',
      whyNowAr: 'تأخر التراخيص الميدانية لمدة 15 يوماً وتوفر الموارد لإعادة الجدولة.',
      whyNowEn: '15-day field permit delay requires official timeline baseline shift.',
      impactAr: 'ضمان الكفاءة التشغيلية للمراكز الطبية بدون الوقوع في مخالفات التزام.',
      impactEn: 'Ensuring health center operational readiness without compliance defaults.',
      recommendedAr: 'تمديد الجدول الزمني لمدة 20 يوماً دون زيادة في التكاليف المعتمدة.',
      recommendedEn: 'Grant 20-day timeline extension with zero budget adjustment.',
      deadline: '3 Days',
      ownerAr: 'مدير البرامج والتخطيط',
      ownerEn: 'Program Planning Manager',
      status: 'PENDING'
    },
    {
      id: 'DEC-05',
      titleAr: 'اعتماد تقرير المراجعة والتدقيق المالي للربع الثاني',
      titleEn: 'Endorse Q2 Internal Financial Audit Report',
      projectCode: 'AUDIT-Q2-REV',
      severity: 'NORMAL',
      whyNowAr: 'جاهزية التقرير للعرض على مجلس الأمناء والجهات المانحة المعتمدة.',
      whyNowEn: 'Audit report finalized for Board of Trustees and donor preview.',
      impactAr: 'رفع تصنيف الشفافية وحصانة المؤسسة وموثوقية المعاملات.',
      impactEn: 'Boosting transparency score and institutional verification rating.',
      recommendedAr: 'اعتماد التقرير ونشره في بوابة الشفافية وتقارير الأداء.',
      recommendedEn: 'Endorse audit findings and certify publication.',
      deadline: '5 Days',
      ownerAr: 'مدير التدقيق والرقابة المالية',
      ownerEn: 'Financial Audit & Control Director',
      status: 'PENDING'
    }
  ]);

  const handleAction = (id: string, actionType: 'APPROVE' | 'REJECT' | 'ESCALATE') => {
    setDecisions(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: actionType === 'APPROVE' ? 'APPROVED' : actionType === 'REJECT' ? 'REJECTED' : 'ESCALATED' };
      }
      return item;
    }));
  };

  const filteredDecisions = decisions.filter(item => {
    if (activeFilter === 'ALL') return item.status === 'PENDING';
    return item.status === 'PENDING' && item.severity === activeFilter;
  });

  const pendingCount = decisions.filter(d => d.status === 'PENDING').length;
  const criticalCount = decisions.filter(d => d.status === 'PENDING' && d.severity === 'CRITICAL').length;
  const highCount = decisions.filter(d => d.status === 'PENDING' && d.severity === 'HIGH').length;
  const normalCount = decisions.filter(d => d.status === 'PENDING' && d.severity === 'NORMAL').length;

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-sm p-5 transition-all">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-500/20">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'ar' ? 'سجل القرارات الإدارية العاجلة المطلوبة' : 'Executive Decision Intelligence Queue'}
              </h2>
              <span className="px-2 py-0.5 text-xs font-black bg-rose-600 text-white rounded-full">
                {pendingCount} {lang === 'ar' ? 'قرارات تنتظر التدخل' : 'Pending Actions'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {lang === 'ar' 
                ? 'قرارات استراتيجية عالية الأثر تتطلب مصادقة القيادة العليا قبل انتهاء المهلة المحددة'
                : 'High-impact decisions requiring direct executive authorization before SLA deadlines'}
            </p>
          </div>
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer ${
              activeFilter === 'ALL' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
            }`}
          >
            {lang === 'ar' ? 'الكل' : 'All'} ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('CRITICAL')}
            className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'CRITICAL' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <span>🔴 {lang === 'ar' ? 'حرجة' : 'Critical'}</span> ({criticalCount})
          </button>
          <button
            onClick={() => setActiveFilter('HIGH')}
            className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'HIGH' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <span>🟠 {lang === 'ar' ? 'عالية' : 'High'}</span> ({highCount})
          </button>
          <button
            onClick={() => setActiveFilter('NORMAL')}
            className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'NORMAL' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <span>🟡 {lang === 'ar' ? 'عادية' : 'Normal'}</span> ({normalCount})
          </button>
        </div>
      </div>

      {/* Decision Cards List */}
      <div className="mt-4 space-y-3.5">
        {filteredDecisions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-zinc-900/40 rounded-xl border border-slate-200/60 dark:border-zinc-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              {lang === 'ar' ? 'لا توجد قرارات معلقة حالياً ضمن هذه الفئة' : 'No pending decisions in this filter category'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {lang === 'ar' ? 'جميع القرارات الاستراتيجية تم اتخاذها واعتمادها بنجاح.' : 'All executive decisions have been reviewed and processed.'}
            </p>
          </div>
        ) : (
          filteredDecisions.map((decision) => (
            <div
              key={decision.id}
              className={`p-4 rounded-xl border transition-all ${
                decision.severity === 'CRITICAL'
                  ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                  : decision.severity === 'HIGH'
                  ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50 hover:border-amber-400'
                  : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Left Section: Main Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${
                      decision.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : decision.severity === 'HIGH' ? 'bg-amber-600 text-white' : 'bg-slate-600 text-white'
                    }`}>
                      {decision.severity}
                    </span>

                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                      {decision.projectCode}
                    </span>

                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? `المهلة: ${decision.deadline}` : `SLA: ${decision.deadline}`}</span>
                    </span>

                    <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                      • {lang === 'ar' ? `المسؤول: ${decision.ownerAr}` : `Owner: ${decision.ownerEn}`}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {lang === 'ar' ? decision.titleAr : decision.titleEn}
                  </h3>

                  {/* Evidence & Context Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80">
                      <span className="font-bold text-rose-700 dark:text-rose-400 block text-[10px] uppercase">
                        {lang === 'ar' ? 'سبب الحاجة الآن (Why Now?):' : 'Why Now?'}
                      </span>
                      <p className="text-slate-600 dark:text-zinc-300 text-[11px] mt-0.5 font-medium">
                        {lang === 'ar' ? decision.whyNowAr : decision.whyNowEn}
                      </p>
                    </div>

                    <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase">
                        {lang === 'ar' ? 'الأثر المتوقع (Impact):' : 'Expected Impact:'}
                      </span>
                      <p className="text-slate-600 dark:text-zinc-300 text-[11px] mt-0.5 font-medium">
                        {lang === 'ar' ? decision.impactAr : decision.impactEn}
                      </p>
                    </div>
                  </div>

                  {/* AI Recommended Option */}
                  <div className="flex items-start gap-2 bg-emerald-500/10 dark:bg-emerald-500/15 p-2.5 rounded-lg border border-emerald-500/20 text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-emerald-800 dark:text-emerald-300 text-[11px]">
                        {lang === 'ar' ? 'التوصية التنفيذية المقترحة:' : 'Recommended Action:'}
                      </span>
                      <span className="text-slate-700 dark:text-zinc-200 text-[11px] font-semibold mr-1.5 ml-1.5">
                        {lang === 'ar' ? decision.recommendedAr : decision.recommendedEn}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Decision Action Buttons */}
                <div className="flex flex-row lg:flex-col items-center gap-2 shrink-0 w-full lg:w-auto border-t lg:border-t-0 border-slate-200 dark:border-zinc-800 pt-3 lg:pt-0">
                  <button
                    onClick={() => handleAction(decision.id, 'APPROVE')}
                    className="flex-1 lg:flex-initial w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'اعتماد الإجراء' : 'Approve Decision'}</span>
                  </button>

                  <button
                    onClick={() => handleAction(decision.id, 'REJECT')}
                    className="flex-1 lg:flex-initial w-full px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-rose-500" />
                    <span>{lang === 'ar' ? 'تقليص / تعديل' : 'Modify / Reject'}</span>
                  </button>

                  <button
                    onClick={() => handleAction(decision.id, 'ESCALATE')}
                    className="flex-1 lg:flex-initial w-full px-3 py-1.5 text-amber-700 hover:text-amber-800 dark:text-amber-400 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تحقيق / تصعيد' : 'Investigate'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
