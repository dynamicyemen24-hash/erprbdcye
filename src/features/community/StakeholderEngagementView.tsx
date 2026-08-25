import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Heart, AlertTriangle, Loader2 } from 'lucide-react';

interface Stakeholder {
  id: string;
  name: string;
  type: 'Partner' | 'Donor';
  engagementScore: number; // real: donation volume or agreement value index
  interactions: number; // real: donation count or agreement count
}

export default function StakeholderEngagementView({ lang }: { lang: 'ar' | 'en' }) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('rbd_token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const getRows = async (table: string) => {
          const res = await fetch(`/api/tables/${table}`, { headers });
          if (!res.ok) throw new Error(`${table}: ${res.status}`);
          const data = await res.json();
          const rows = data?.data ?? data;
          return Array.isArray(rows) ? rows : [];
        };

        const [donors, donations, agreements] = await Promise.all([
          getRows('donors'),
          getRows('donations'),
          getRows('partner_agreements')
        ]);
        if (cancelled) return;

        // Real donor engagement: total donated amount & donation count
        const donationAgg = new Map<string, { total: number; count: number }>();
        donations.forEach((d: any) => {
          const key = d.donor_party_id || d.party_id;
          if (!key) return;
          const cur = donationAgg.get(key) || { total: 0, count: 0 };
          cur.total += parseFloat(d.amount || 0);
          cur.count += 1;
          donationAgg.set(key, cur);
        });

        const donorStakeholders: Stakeholder[] = donors.map((dn: any) => {
          const agg = donationAgg.get(dn.party_id);
          return {
            id: dn.id,
            name: dn.name_ar || dn.name_en || dn.donor_code,
            type: 'Donor',
            engagementScore: Math.min(100, Math.round((agg?.total || 0) / 1000000)),
            interactions: agg?.count || 0
          };
        });

        // Real partner engagement: agreement count & total value
        const partnerMap = new Map<string, { name: string; count: number; value: number }>();
        agreements.forEach((a: any) => {
          const key = a.partner_party_id || a.partner_organization_name;
          if (!key) return;
          const cur = partnerMap.get(key) || { name: a.partner_organization_name || '', count: 0, value: 0 };
          cur.count += 1;
          cur.value += parseFloat(a.value_usd || 0);
          partnerMap.set(key, cur);
        });

        const partnerStakeholders: Stakeholder[] = Array.from(partnerMap.entries()).map(([id, p]) => ({
          id,
          name: p.name,
          type: 'Partner' as const,
          engagementScore: Math.min(100, Math.round(p.value / 10000)),
          interactions: p.count
        }));

        setStakeholders([...donorStakeholders, ...partnerStakeholders]);
      } catch (err) {
        console.error('[StakeholderEngagement] Failed to load:', err);
        if (!cancelled) {
          setError(lang === 'ar' ? 'تعذر تحميل بيانات أصحاب المصلحة.' : 'Failed to load stakeholder data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [lang]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-sky-500" />
        {lang === 'ar' ? 'مشاركة أصحاب المصلحة' : 'Stakeholder Engagement'}
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs font-bold">{lang === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold">{error}</span>
        </div>
      ) : stakeholders.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-8">
          {lang === 'ar' ? 'لا توجد بيانات مانحين أو شركاء بعد.' : 'No donor or partner records yet.'}
        </p>
      ) : (
        <div className="space-y-4">
          {stakeholders.map(s => (
            <div key={s.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{s.name}</p>
                <p className="text-[10px] text-zinc-500">{s.type}</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center" title={lang === 'ar' ? 'مؤشر المشاركة (حجم التعامل)' : 'Engagement index (transaction volume)'}>
                  <Heart className="w-4 h-4 text-sky-500 mx-auto" />
                  <p className="text-xs font-bold">{s.engagementScore}</p>
                </div>
                <div className="text-center" title={lang === 'ar' ? 'عدد التفاعلات المسجلة' : 'Recorded interactions'}>
                  <MessageSquare className="w-4 h-4 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold">{s.interactions}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
