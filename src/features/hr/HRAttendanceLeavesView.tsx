import React from 'react';
import { Clock } from 'lucide-react';

interface HRAttendanceLeavesViewProps {
  lang: 'ar' | 'en';
}

export default function HRAttendanceLeavesView({ lang }: HRAttendanceLeavesViewProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>{isRtl ? 'نظام الحضور والدوام والإجازات الميدانية' : 'Attendance, Shifts & Leave Engine'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {isRtl ? 'تتبع البصمة الرقمية، المهمات الميدانية، واعتمادات الإجازات التأثيرية على الرواتب' : 'Smart attendance logs, field missions, and automated payroll impact calculations.'}
          </p>
        </div>

        <button className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
          {isRtl ? 'طلب إجازة جديد' : 'Submit Leave Request'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ATTENDANCE RECENT LOGS */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'سجل الحضور والدوام اليومي' : 'Daily Attendance Stream'}</h4>
          <div className="space-y-2">
            {[
              { name: 'م. أحمد المعمري', time: '08:00 AM', status: 'حاضر (في الوقت)', type: 'HQ' },
              { name: 'د. خالد العماري', time: '08:15 AM', status: 'مهمة ميدانية (حفر آبار)', type: 'FIELD' },
              { name: 'أ. ياسر باوزير', time: '08:02 AM', status: 'حاضر (في الوقت)', type: 'HQ' }
            ].map((log, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold block text-slate-800 dark:text-zinc-200">{log.name}</span>
                  <span className="text-[10px] text-slate-400">{log.status}</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-bold rounded">
                  {log.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* LEAVE REQUESTS */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'طلبات الإجازات المعلقة' : 'Pending Leave Requests'}</h4>
          <div className="space-y-2">
            {[
              { name: 'م. علي الجائفي', type: 'إجازة سنوية', days: '5 أيام', status: 'في انتظار الاعتماد' },
              { name: 'سارة العريقي', type: 'إجازة مرضية', days: 'يومين', status: 'في انتظار الاعتماد' }
            ].map((req, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold block text-slate-800 dark:text-zinc-200">{req.name}</span>
                  <span className="text-[10px] text-amber-600 font-bold">{req.type} ({req.days})</span>
                </div>
                <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer">
                  {isRtl ? 'اعتماد' : 'Approve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
