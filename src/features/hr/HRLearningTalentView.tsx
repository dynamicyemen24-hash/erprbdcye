import React from 'react';
import { BookOpen } from 'lucide-react';

interface HRLearningTalentViewProps {
  lang: 'ar' | 'en';
}

export default function HRLearningTalentView({ lang }: HRLearningTalentViewProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>{isRtl ? 'التدريب والتطوير وإدارة المواهب' : 'L&D & Talent Succession'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {isRtl ? 'خطط التدريب الإنساني، الفجوات المهارية، وإعداد الصف الثاني للمناصب القيادية' : 'Humanitarian training plans, skill gap matrix, and succession planning.'}
          </p>
        </div>

        <button className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
          {isRtl ? 'إضافة دورة تدريبية' : 'Add Course'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'دورة الاستجابة الإنسانية الطارئة وحماية الأيتام', hours: '24 ساعة', participants: 18, status: 'مكتملة' },
          { title: 'معايير المحاسبة الدولية IPSAS للقطاع غير الربحي', hours: '16 ساعة', participants: 6, status: 'جارية الأن' },
        ].map((course, idx) => (
          <div key={idx} className="p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-zinc-200">{course.title}</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-mono font-bold rounded">{course.hours}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
              <span>{isRtl ? `المشاركون: ${course.participants} موظف` : `Participants: ${course.participants}`}</span>
              <span className="text-emerald-600 font-bold">{course.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
