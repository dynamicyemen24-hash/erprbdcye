import React, { useState, useEffect } from 'react';
import { 
  Activity, Server, Mail, Webhook, Layers, Cpu, HardDrive, 
  MemoryStick, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Settings, Database, Wifi, Clock, Shield, Zap
} from 'lucide-react';
import { Spinner } from '../../design-system/components/Spinner';

interface SystemInfo {
  version: string;
  environment: string;
  uptime: number;
  node: string;
  platform: string;
  memory: { total: number; free: number; used: number };
  cpu: { cores: number; model: string; load: number[] };
}

interface QueueMetrics {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  avgProcessingTime: number;
}

interface HealthStatus {
  status: string;
  checks: Record<string, { status: string; latency_ms: number; message?: string }>;
}

const t = (ar: string, en: string, lang: string) => lang === 'ar' ? ar : en;

export function AdminControlCenter({ lang = 'en' }: { lang?: 'ar' | 'en' }) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [infoRes, queueRes, healthRes] = await Promise.allSettled([
        fetch('/api/system/info').then(r => r.json()),
        fetch('/api/queue/metrics').then(r => r.json()),
        fetch('/health/deep').then(r => r.json()),
      ]);
      if (infoRes.status === 'fulfilled') setSystemInfo(infoRes.value);
      if (queueRes.status === 'fulfilled') setQueueMetrics(queueRes.value);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
    } catch (e) { console.error('Failed to fetch admin data:', e); }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="flex items-center justify-center p-12"><Spinner size="lg" /></div>;

  const statusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-500 bg-emerald-500/10';
      case 'degraded': return 'text-amber-500 bg-amber-500/10';
      case 'unhealthy': return 'text-red-500 bg-red-500/10';
      default: return 'text-zinc-500 bg-zinc-500/10';
    }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusColor(status)}`}>
      {status === 'healthy' ? <CheckCircle2 className="w-3 h-3" /> : status === 'unhealthy' ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {status}
    </span>
  );

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100">
            {t('مركز التحكم', 'Admin Control Center', lang)}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            {t('مراقبة النظام والإعدادات', 'System Monitoring & Settings', lang)}
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-bold disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('تحديث', 'Refresh', lang)}
        </button>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/10"><Activity className="w-5 h-5 text-emerald-500" /></div>
            <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">{t('حالة النظام', 'System Status', lang)}</span>
          </div>
          <StatusBadge status={health?.status || 'unknown'} />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-500/10"><Cpu className="w-5 h-5 text-blue-500" /></div>
            <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">{t('المعالج', 'CPU', lang)}</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-zinc-100">{systemInfo?.cpu.cores || 0} cores</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Load: {systemInfo?.cpu.load[0]?.toFixed(2) || '0'}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-violet-500/10"><MemoryStick className="w-5 h-5 text-violet-500" /></div>
            <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">{t('الذاكرة', 'Memory', lang)}</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-zinc-100">{systemInfo?.memory.used || 0} MB</p>
          <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-1.5 mt-2">
            <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${((systemInfo?.memory.used || 0) / (systemInfo?.memory.total || 1)) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-amber-500/10"><Clock className="w-5 h-5 text-amber-500" /></div>
            <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">{t('وقت التشغيل', 'Uptime', lang)}</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-zinc-100">
            {systemInfo ? Math.floor(systemInfo.uptime / 3600) + 'h ' + Math.floor((systemInfo.uptime % 3600) / 60) + 'm' : '0h 0m'}
          </p>
        </div>
      </div>

      {/* Health Checks */}
      {health?.checks && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            {t('فحوصات الصحة', 'Health Checks', lang)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(health.checks).map(([name, check]) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold capitalize text-slate-700 dark:text-zinc-300">{name.replace(/_/g, ' ')}</span>
                  {check.message && <span className="text-xs text-slate-500 dark:text-zinc-500">({check.message})</span>}
                </div>
                <StatusBadge status={check.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Metrics */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" />
          {t('مقياس الطابور', 'Queue Metrics', lang)}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: t('قيد الانتظار', 'Pending', lang), value: queueMetrics?.pending || 0, color: 'text-amber-500' },
            { label: t('نشط', 'Active', lang), value: queueMetrics?.active || 0, color: 'text-blue-500' },
            { label: t('مكتمل', 'Completed', lang), value: queueMetrics?.completed || 0, color: 'text-emerald-500' },
            { label: t('فشل', 'Failed', lang), value: queueMetrics?.failed || 0, color: 'text-red-500' },
            { label: t('إجمالي', 'Total', lang), value: queueMetrics?.totalProcessed || 0, color: 'text-slate-500' },
            { label: t('متوسط الوقت', 'Avg Time', lang), value: `${(queueMetrics?.avgProcessingTime || 0).toFixed(0)}ms`, color: 'text-violet-500' },
          ].map((metric, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
              <p className={`text-2xl font-black ${metric.color}`}>{metric.value}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 transition-colors text-left">
          <div className="p-2 rounded-xl bg-emerald-500/10"><Webhook className="w-5 h-5 text-emerald-500" /></div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{t('إدارة Webhooks', 'Manage Webhooks', lang)}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">{t('إنشاء وتعديل حزم الويب', 'Create & manage webhooks', lang)}</p>
          </div>
        </button>
        <button className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-blue-500 transition-colors text-left">
          <div className="p-2 rounded-xl bg-blue-500/10"><Mail className="w-5 h-5 text-blue-500" /></div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{t('إرسال إيميل', 'Send Email', lang)}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">{t('إرسال إيميلات تلقائية', 'Send transactional emails', lang)}</p>
          </div>
        </button>
        <button className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-violet-500 transition-colors text-left">
          <div className="p-2 rounded-xl bg-violet-500/10"><Database className="w-5 h-5 text-violet-500" /></div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{t('الترحيلات', 'Migrations', lang)}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">{t('تشغيل الترحيل التلقائي', 'Run auto-migrations', lang)}</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default AdminControlCenter;
