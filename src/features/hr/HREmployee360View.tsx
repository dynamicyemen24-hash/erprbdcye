import React from 'react';
import { Users, Search, Printer } from 'lucide-react';

interface HREmployee360ViewProps {
  lang: 'ar' | 'en';
  filteredStaff: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenDocModal: (staff: any) => void;
}

export default function HREmployee360View({
  lang,
  filteredStaff,
  searchTerm,
  setSearchTerm,
  onOpenDocModal
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
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? 'بحث باسم الموظف أو الرقم الوظيفي...' : 'Search staff by name or ID...'}
              className="pr-9 pl-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:border-emerald-500"
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
            {filteredStaff.length > 0 ? (
              filteredStaff.map((staff, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
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
                    <span className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded ${
                      idx % 3 === 0 
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                        : idx % 3 === 1 
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {idx % 3 === 0 ? (isRtl ? '👔 كادر دائم' : 'Permanent FTE') : idx % 3 === 1 ? (isRtl ? '🤝 متطوع ميداني' : 'Volunteer') : (isRtl ? '💼 استشاري خبير' : 'Consultant')}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-zinc-300">
                    Grade A-2
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded flex items-center gap-1 w-fit">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      <span>{isRtl ? 'نشط' : 'Active'}</span>
                    </span>
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
                      onClick={() => alert(isRtl ? `عرض ملف الموظف 360 لـ ${staff.full_name_ar || staff.name}` : `View Employee 360 Record for ${staff.name}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      {isRtl ? '360' : '360'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  {isRtl ? 'لا توجد سجلات موظفين مطابقة للبحث' : 'No matching staff records found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
