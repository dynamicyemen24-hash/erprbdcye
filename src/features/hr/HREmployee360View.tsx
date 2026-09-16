import { showToast } from '../../components/enterprise/EnterpriseToastContainer';
import React from 'react';
import { Users, Search, Printer } from 'lucide-react';
import { EmptyState } from '../../design-system/components/EmptyState';
import { EnterpriseSkeletonTable } from '../../components/common/EnterpriseSkeletonTable';

interface HREmployee360ViewProps {
  lang: 'ar' | 'en';
  filteredStaff: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenDocModal: (staff: any) => void;
  loading?: boolean;
  onClearSearch?: () => void;
}

const CATEGORY_STYLE: Record<string, { ar: string; en: string; cls: string }> = {
  permanent: { ar: 'كادر دائم', en: 'Permanent FTE', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  volunteer: { ar: 'متطوع ميداني', en: 'Volunteer', cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  cooperator: { ar: 'متعاون', en: 'Cooperator', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  delegate: { ar: 'مندوب', en: 'Delegate', cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  consultant: { ar: 'استشاري خبير', en: 'Consultant', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
};

export default function HREmployee360View({
  lang,
  filteredStaff,
  searchTerm,
  setSearchTerm,
  onOpenDocModal,
  loading = false,
  onClearSearch
}: HREmployee360ViewProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>{isRtl ? 'سجل الموظف الشامل Employee 360' : 'Employee 360 Master Registry'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {isRtl ? 'المصدر الموحد لبيانات الكادر، العقد، الراتب، المهام الميدانية، والتقييم' : 'Single source of truth linking employee profile, contract, salary & WBS contribution.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'}`} aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? 'بحث باسم الموظف أو الرقم الوظيفي...' : 'Search staff by name or ID...'}
              aria-label={isRtl ? 'بحث الكادر' : 'Search workforce'}
              className={`py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:border-emerald-500 ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
            />
          </div>
        </div>
      </div>

      {/* STAFF TABLE */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs text-right rtl:text-right ltr:text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
              <th className="p-3 font-bold">{isRtl ? 'الموظف / المتطوع' : 'Employee / Volunteer'}</th>
              <th className="p-3 font-bold">{isRtl ? 'الإدارة والمنصب' : 'Department & Position'}</th>
              <th className="p-3 font-bold">{isRtl ? 'تصنيف الفئة' : 'Category Tier'}</th>
              <th className="p-3 font-bold">{isRtl ? 'الدرجة الوظيفية' : 'Grade'}</th>
              <th className="p-3 font-bold">{isRtl ? 'الحالة' : 'Status'}</th>
              <th className="p-3 font-bold text-center">{isRtl ? 'العقود والوثائق' : 'Contracts & Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <EnterpriseSkeletonTable rows={6} columns={6} colWidths={['w-40', 'w-32', 'w-24', 'w-16', 'w-16', 'w-28']} />
                </td>
              </tr>
            ) : filteredStaff.length > 0 ? (
              filteredStaff.map((staff, idx) => (
                <tr key={staff.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3 font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/10 border border-emerald-500/20 text-emerald-600 font-bold flex items-center justify-center">
                      {(staff.full_name_ar || staff.name || 'M')[0]}
                    </div>
                    <div>
                      <span className="block">{staff.full_name_ar || staff.name || 'موظف ميداني'}</span>
                      <span className="text-[10px] font-mono text-slate-400">{staff.employee_code || `EMP-2026-0${idx + 1}`}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-zinc-400">
                    <span className="block font-bold">{staff.department_name || 'إدارة المشاريع الإغاثية'}</span>
                    <span className="text-[10px] text-slate-400">{staff.position_name || 'منسق ميداني senior'}</span>
                  </td>
                  <td className="p-3">
                    {(() => {
                      const cat = CATEGORY_STYLE[staff.employment_type] || CATEGORY_STYLE.permanent;
                      return (
                        <span className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded ${cat.cls}`}>
                          {isRtl ? cat.ar : cat.en}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-zinc-300">
                    {staff.grade || staff.job_grade || '—'}
                  </td>
                  <td className="p-3">
                    {(() => {
                      const active = (staff.status || 'active') === 'active';
                      return (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 w-fit ${active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                          <span>{active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}</span>
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-center flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onOpenDocModal(staff)}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>{isRtl ? 'العقد والوثائق' : 'Contract'}</span>
                    </button>

                    <button
                      onClick={() => showToast({ type: 'info', title: isRtl ? 'الملف الوظيفي الشامل 360' : 'Employee 360 View', message: isRtl ? `عرض السجل المتكامل لـ ${staff.full_name_ar || staff.name}` : `Viewing 360 record for ${staff.name}` })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      {isRtl ? '360' : '360'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState
                    variant={searchTerm ? 'search' : 'empty'}
                    titleAr="لا توجد سجلات موظفين مطابقة"
                    title="No matching staff records"
                    descriptionAr="جرب كلمات مختلفة أو أزل الفلاتر"
                    description="Try different keywords or clear the filters"
                    actions={onClearSearch ? [
                      {
                        label: 'Clear filters',
                        labelAr: 'مسح الفلاتر',
                        variant: 'secondary',
                        onClick: onClearSearch,
                      },
                    ] : undefined}
                    lang={lang}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
