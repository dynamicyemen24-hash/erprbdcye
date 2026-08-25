import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Activity, 
  Check, 
  X, 
  Settings, 
  ExternalLink,
  Plus,
  Compass,
  AlertOctagon,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

import { useEnterprise } from '../core/context/EnterpriseContext';

interface NotificationCenterProps {
  lang: 'ar' | 'en';
  approvalRequests: any[];
  projects: any[];
  onNavigate: (tab: string) => void;
}

interface InAppAlert {
  id: string;
  title: string;
  body: string;
  type: 'approval' | 'critical' | 'info';
  timestamp: string;
  read: boolean;
}

export default function NotificationCenter({ 
  lang, 
  approvalRequests, 
  projects, 
  onNavigate 
}: NotificationCenterProps) {
  const { logoUrl } = useEnterprise();
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [localAlerts, setLocalAlerts] = useState<InAppAlert[]>([]);
  const [hasNewAlertState, setHasNewAlertState] = useState(false);

  // Keep track of previously seen approval requests to detect new ones
  const prevApprovalsRef = useRef<string[]>([]);
  // Keep track of previously seen system critical states to avoid repeat alerts
  const prevCriticalCodesRef = useRef<string[]>([]);
  const isInitialLoad = useRef(true);

  // Sync / check permission on load
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request browser Notification permission
  const requestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert(lang === 'ar' ? 'إشعارات المتصفح غير مدعومة في هذا المتصفح.' : 'Web Notifications are not supported in this browser.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        sendBrowserNotification(
          lang === 'ar' ? 'تم تفعيل الإشعارات بنجاح!' : 'Notifications Enabled!',
          lang === 'ar' ? 'ستصلك الآن تنبيهات النظام المباشرة من NexoraOS.' : 'You will now receive real-time system alerts from NexoraOS.'
        );
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  // Safe Browser Notification Dispatch
  const sendBrowserNotification = (title: string, body: string, type: 'approval' | 'critical' | 'info' = 'info') => {
    // 1. Play clean chime sound if possible
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      // Pleasant high-quality alert tone sequence
      osc.type = 'sine';
      if (type === 'critical') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch (e) {
      // AudioContext blocked or unsupported, fail silently
    }

    // 2. Fire HTML5 system push notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const iconPath = logoUrl;
        const options = {
          body: body,
          icon: iconPath,
          badge: iconPath,
          tag: 'nexora-alert-' + Date.now(),
          requireInteraction: type === 'critical'
        };
        new Notification(title, options);
      } catch (e) {
        console.warn('Browser rejected notification dispatch (likely blocked inside sandboxed iframe). Falling back to rich in-app toast.', e);
      }
    }

    // 3. Always add to in-app notification center logs
    const newAlert: InAppAlert = {
      id: 'alert-' + crypto.randomUUID(),
      title,
      body,
      type,
      timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setLocalAlerts(prev => [newAlert, ...prev].slice(0, 30));
    setHasNewAlertState(true);
  };

  // Automatically track database updates to find new approvals or critical issues
  useEffect(() => {
    if (!approvalRequests || approvalRequests.length === 0) return;

    const currentIds = approvalRequests.map(r => r.id);
    
    if (isInitialLoad.current) {
      prevApprovalsRef.current = currentIds;
      
      // Seed default welcoming system health checks on initial boot
      const initialAlerts: InAppAlert[] = [
        {
          id: 'init-1',
          title: lang === 'ar' ? 'نظام تشغيل التنبيهات الذكي' : 'Smart Alerts System Initialized',
          body: lang === 'ar' ? 'تم ربط مستشعرات الحوكمة والموافقات وسجل العمل الميداني بنجاح.' : 'Governance sensors, approval flows, and field logs linked successfully.',
          type: 'info',
          timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          read: true
        }
      ];
      setLocalAlerts(initialAlerts);
      isInitialLoad.current = false;
      return;
    }

    // Find if there are any new requests that were not in prevApprovalsRef
    const newRequests = approvalRequests.filter(req => !prevApprovalsRef.current.includes(req.id));
    if (newRequests.length > 0) {
      newRequests.forEach(req => {
        const typeStr = req.entity_type === 'project' 
          ? (lang === 'ar' ? 'لمشروع جديد' : 'for new Project') 
          : (lang === 'ar' ? 'سند مالي' : 'for Voucher payment');
        const title = lang === 'ar' 
          ? `طلب موافقة جديد معلق ⏳` 
          : `New Approval Request Pending ⏳`;
        const body = lang === 'ar'
          ? `طلب موافقة ${typeStr} بقيمة ${req.notes || ''} بانتظار الاعتماد الرقمي في لوحة المراقبة.`
          : `Approval request ${typeStr} is awaiting digital clearance in the compliance hub.`;
        
        sendBrowserNotification(title, body, 'approval');
      });
    }

    prevApprovalsRef.current = currentIds;
  }, [approvalRequests, lang]);

  // Monitor project states for high-risk critical anomalies
  useEffect(() => {
    if (!projects || projects.length === 0) return;

    const criticalProjects = projects.filter(p => p.risk_level === 'HIGH' || p.priority_code === 'urgent');
    const currentCodes = criticalProjects.map(p => p.id + '-' + p.progress_percent);

    if (isInitialLoad.current) {
      prevCriticalCodesRef.current = currentCodes;
      return;
    }

    // If there is any project that became HIGH risk or changed progress/budget state
    const newlyCritical = criticalProjects.filter(p => !prevCriticalCodesRef.current.includes(p.id + '-' + p.progress_percent));
    if (newlyCritical.length > 0) {
      newlyCritical.forEach(proj => {
        const title = lang === 'ar'
          ? `🚨 إنذار حرج: مشروع عالي المخاطر`
          : `🚨 Critical Alert: High-Risk Project`;
        const body = lang === 'ar'
          ? `المشروع "${proj.name_ar}" يحتاج إلى مراجعة تشغيلية فورية. نسبة الإنجاز: ${proj.progress_percent || 0}%`
          : `Project "${proj.name_en}" requires immediate operational triage. Current progress is ${proj.progress_percent || 0}%`;
        
        sendBrowserNotification(title, body, 'critical');
      });
    }

    prevCriticalCodesRef.current = currentCodes;
  }, [projects, lang]);

  // Listen for inventory alerts dispatched from InventoryManagementView
  useEffect(() => {
    const handleInventoryAlert = (event: Event) => {
      const customEv = event as CustomEvent<{ title: string; body: string; type?: 'approval' | 'critical' | 'info'; actionTab?: string }>;
      if (customEv.detail) {
        const { title, body, type } = customEv.detail;
        sendBrowserNotification(title, body, type || 'critical');
      }
    };

    window.addEventListener('nexora-inventory-alert', handleInventoryAlert);
    return () => {
      window.removeEventListener('nexora-inventory-alert', handleInventoryAlert);
    };
  }, [lang]);

  // Handle Simulation buttons
  const simulateInventoryStockout = () => {
    const title = lang === 'ar'
      ? `🚨 نفاد مخزون إغاثي حرج: القمح المغذي ( تعز )`
      : `🚨 Critical Relief Stockout: Fortified Wheat (Taiz)`;
    const body = lang === 'ar'
      ? `تنبيه دفع مباشر: الرصيد الحالي (120 كيس) وصل لدون حد إعادة الطلب (200 كيس). التغطية المتبقية 4 أيام فقط!`
      : `Push Alert: Current stock (120 bags) fell below reorder threshold (200 bags). 4 days of supply remaining!`;
    
    sendBrowserNotification(title, body, 'critical');
  };

  const simulateNewApproval = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const title = lang === 'ar' 
      ? `طلب اعتماد مالي جديد (رقم #${randomId})`
      : `New Procurement Approval (#${randomId})`;
    const body = lang === 'ar'
      ? `تم تقديم طلب صرف تمويل بقيمة 4,500,000 ريال يمني لتنفيذ مشروع مياه شبوة.`
      : `Disbursement request of 4,500,000 YER submitted for Shabwah water infrastructure.`;
    
    sendBrowserNotification(title, body, 'approval');
  };

  const simulateCriticalAlert = () => {
    const title = lang === 'ar'
      ? `⚠️ تجاوز موازنة حرج: مشروع الغذاء تعز`
      : `⚠️ Critical Overrun: Taiz Food Security`;
    const body = lang === 'ar'
      ? `تنبيه مالي: تم تسجيل زيادة في المصروفات بنسبة +14% عن الميزانية المعتمدة لنشاط سلات تعز.`
      : `Financial Alert: Detected +14% variance exceeding approved budget for Taiz distribution.`;
    
    sendBrowserNotification(title, body, 'critical');
  };

  const unreadCount = localAlerts.filter(a => !a.read).length;

  const markAllRead = () => {
    setLocalAlerts(prev => prev.map(a => ({ ...a, read: true })));
    setHasNewAlertState(false);
  };

  const clearAll = () => {
    setLocalAlerts([]);
    setHasNewAlertState(false);
  };

  return (
    <div className="relative">
      {/* Trigger Bell Icon */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          markAllRead();
        }}
        className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-md text-slate-500 hover:text-emerald-600 transition-colors relative cursor-pointer"
        title={lang === 'ar' ? 'مركز التنبيهات الموحد' : 'Unified Notifications Center'}
      >
        <Bell className={`w-4 h-4 ${hasNewAlertState ? 'animate-bounce text-amber-500' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[999] cursor-default" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-12 left-0 rtl:left-auto rtl:right-0 w-80 sm:w-96 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xl z-[1000] overflow-hidden font-sans">
            
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 animate-pulse" />
                <h3 className="font-bold text-xs">
                  {lang === 'ar' ? 'مركز التنبيهات الذكي' : 'Unified Intelligence Alerts'}
                </h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Permission Control Widget */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'إشعارات النظام لسطح المكتب' : 'System Push Status'}
                </span>
                
                {permission === 'granted' ? (
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {lang === 'ar' ? 'مفعّلة ونشطة' : 'Granted & Live'}
                  </span>
                ) : permission === 'denied' ? (
                  <span className="text-[10px] font-extrabold text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {lang === 'ar' ? 'محجوبة بالمتصفح' : 'Blocked'}
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {lang === 'ar' ? 'غير مفعلة' : 'Disabled'}
                  </span>
                )}
              </div>

              {permission !== 'granted' && (
                <button
                  onClick={requestBrowserPermission}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-100" />
                  {lang === 'ar' ? 'تفعيل إشعارات سطح المكتب' : 'Authorize Browser Push'}
                </button>
              )}

              {/* Sandbox info for developers/auditors */}
              <div className="text-[8px] text-zinc-400 dark:text-zinc-500 text-center leading-normal">
                {lang === 'ar'
                  ? 'ملاحظة: إذا كنت تتصفح داخل إطار مدمج (iFrame)، يرجى فتح التطبيق في علامة تبويب جديدة لتلقي الإشعارات الخارجية.'
                  : 'Note: If inside an iframe, open the app in a new tab to bypass browser security blocks.'}
              </div>
            </div>

            {/* Simulated Alerts Deck (Perfect for assessment and testing!) */}
            <div className="p-3 bg-amber-500/5 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-wider block mb-2">
                {lang === 'ar' ? '⚙️ منصة محاكاة التنبيهات الفورية' : '⚙️ Immediate Push Simulation Deck'}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={simulateNewApproval}
                  className="py-1 px-1.5 text-[8.5px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                  {lang === 'ar' ? 'موافقة' : 'Approval'}
                </button>
                <button
                  onClick={simulateCriticalAlert}
                  className="py-1 px-1.5 text-[8.5px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {lang === 'ar' ? 'إنذار مالية' : 'Financial'}
                </button>
                <button
                  onClick={simulateInventoryStockout}
                  className="py-1 px-1.5 text-[8.5px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <AlertOctagon className="w-2.5 h-2.5 text-amber-300" />
                  {lang === 'ar' ? 'نفاد مخزون' : 'Stockout'}
                </button>
              </div>
            </div>

            {/* List of Recent Alerts */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-900">
              {localAlerts.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-[11px] font-bold flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-zinc-800" />
                  {lang === 'ar' ? 'لا توجد تنبيهات نشطة حالياً.' : 'Your dashboard is clear.'}
                </div>
              ) : (
                localAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-3 transition-colors ${
                      alert.read ? 'bg-white dark:bg-zinc-950' : 'bg-slate-50/70 dark:bg-zinc-900/40'
                    } hover:bg-slate-50 dark:hover:bg-zinc-900`}
                  >
                    <div className="flex gap-2 items-start">
                      {alert.type === 'approval' ? (
                        <span className="p-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                          <Compass className="w-3.5 h-3.5" />
                        </span>
                      ) : alert.type === 'critical' ? (
                        <span className="p-1 rounded bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                          <AlertOctagon className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                      )}

                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-slate-800 dark:text-zinc-100 leading-tight">
                            {alert.title}
                          </span>
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                            {alert.timestamp}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                          {alert.body}
                        </p>

                        {/* Navigation link triggers */}
                        {alert.type === 'approval' && (
                          <button
                            onClick={() => {
                              onNavigate('approvals');
                              setIsOpen(false);
                            }}
                            className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 pt-1"
                          >
                            <span>{lang === 'ar' ? 'عرض طلبات الموافقة ➔' : 'View approval hub ➔'}</span>
                          </button>
                        )}
                        {alert.type === 'critical' && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                onNavigate('inventory');
                                setIsOpen(false);
                              }}
                              className="text-[9px] font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{lang === 'ar' ? 'عرض إدارة المخزون 📦 ➔' : 'View Inventory Hub 📦 ➔'}</span>
                            </button>
                            <span className="text-[8px] text-zinc-400">•</span>
                            <button
                              onClick={() => {
                                onNavigate('dashboard');
                                setIsOpen(false);
                              }}
                              className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{lang === 'ar' ? 'لوحة التحكم ➔' : 'Dashboard ➔'}</span>
                            </button>
                          </div>
                        )}
                        {alert.type === 'info' && alert.title.includes('Performance') && (
                          <button
                            onClick={() => {
                              onNavigate('hr');
                              setIsOpen(false);
                            }}
                            className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 pt-1"
                          >
                            <span>{lang === 'ar' ? 'تحديث المهام المنجزة ➔' : 'Update completed tasks ➔'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {localAlerts.length > 0 && (
              <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                <button
                  onClick={clearAll}
                  className="text-[9px] font-bold text-red-500 hover:text-red-600 transition-colors"
                >
                  {lang === 'ar' ? 'مسح الكل' : 'Clear All'}
                </button>
                <span className="text-[9px] text-zinc-400 font-bold">
                  NexoraOS™ Intelligence Hub
                </span>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}
