import React from 'react';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { Anomaly } from '../core/services/anomalyDetection';

interface AnomalyAlertDockProps {
  anomalies: Anomaly[];
  lang: 'ar' | 'en';
  onReview: (entryId: string) => void;
}

export default function AnomalyAlertDock({ anomalies, lang, onReview }: AnomalyAlertDockProps) {
  if (anomalies.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
      <h3 className="text-amber-800 dark:text-amber-200 font-bold text-xs mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {lang === 'ar' ? 'تنبيهات الذكاء الاصطناعي: معاملات غير طبيعية' : 'AI Alerts: Irregular Transactions'}
      </h3>
      <div className="space-y-2">
        {anomalies.map(anomaly => (
          <div key={anomaly.entryId} className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-amber-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 dark:text-zinc-400">{anomaly.reason} (ID: {anomaly.entryId})</span>
            <button 
              onClick={() => onReview(anomaly.entryId)}
              className="px-2 py-1 bg-amber-600 text-white text-[9px] font-bold rounded flex items-center gap-1"
            >
              <UserCheck className="w-3 h-3" />
              {lang === 'ar' ? 'مراجعة' : 'Review'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
