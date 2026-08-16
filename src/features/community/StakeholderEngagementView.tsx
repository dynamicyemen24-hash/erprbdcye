import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Heart, AlertTriangle } from 'lucide-react';

interface Stakeholder {
  id: string;
  name: string;
  type: 'Partner' | 'Donor';
  sentimentScore: number; // 0-100
  supportRequests: number;
}

export default function StakeholderEngagementView({ lang }: { lang: 'ar' | 'en' }) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);

  useEffect(() => {
    // Simulated data
    setStakeholders([
      { id: 'S-001', name: 'Global Relief Foundation', type: 'Donor', sentimentScore: 88, supportRequests: 2 },
      { id: 'S-002', name: 'Local Tech NGO', type: 'Partner', sentimentScore: 72, supportRequests: 5 },
      { id: 'S-003', name: 'Community Health Hub', type: 'Partner', sentimentScore: 95, supportRequests: 0 },
    ]);
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-sky-500" />
        {lang === 'ar' ? 'مشاركة أصحاب المصلحة' : 'Stakeholder Engagement'}
      </h3>
      
      <div className="space-y-4">
        {stakeholders.map(s => (
          <div key={s.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">{s.name}</p>
              <p className="text-[10px] text-zinc-500">{s.type}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <Heart className="w-4 h-4 text-sky-500 mx-auto" />
                <p className="text-xs font-bold">{s.sentimentScore}%</p>
              </div>
              <div className="text-center">
                <MessageSquare className="w-4 h-4 text-amber-500 mx-auto" />
                <p className="text-xs font-bold">{s.supportRequests}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
