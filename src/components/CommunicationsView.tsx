import React, { useState, useMemo } from 'react';
import {
  MessageSquare, Send, Bell, Mail, Inbox, Star, Archive, Trash2,
  Search, Filter, Plus, Clock, CheckCircle2, Check, AlertTriangle,
  Paperclip, Image, Smile, MoreVertical, Phone, Video, Settings,
  Users, Globe, Zap, Shield, Volume2
} from 'lucide-react';
import { EnterpriseButton } from './common/EnterpriseButton';
import { Spinner } from '../design-system/components/Spinner';
import { EmptyState } from '../design-system/components/EmptyState';

type CommLang = 'ar' | 'en';

interface Message {
  id: string;
  subject_ar: string;
  subject_en: string;
  preview_ar: string;
  preview_en: string;
  sender: string;
  sender_avatar?: string;
  timestamp: string;
  is_read: boolean;
  is_starred: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  type: 'email' | 'notification' | 'system' | 'approval';
  category: 'inbox' | 'sent' | 'drafts' | 'archive' | 'starred';
  attachments?: number;
}

interface Notification {
  id: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  action_url?: string;
}

const t = (ar: string, en: string, lang: CommLang) => lang === 'ar' ? ar : en;

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low: { color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800' },
  normal: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  high: { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  urgent: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
};

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  email: { icon: Mail, color: 'text-blue-500' },
  notification: { icon: Bell, color: 'text-amber-500' },
  system: { icon: Zap, color: 'text-violet-500' },
  approval: { icon: CheckCircle2, color: 'text-emerald-500' },
};

const generateMockMessages = (): Message[] => [
  { id: '1', subject_ar: 'طلب موافقة على المشتريات', subject_en: 'Purchase Approval Request', preview_ar: 'يوجد طلب موافقة على مشتريات بقيمة 50,000 يمني', preview_en: 'Purchase request pending approval for 50,000 YER', sender: 'أحمد محمد', timestamp: '2024-09-07T10:30:00', is_read: false, is_starred: true, priority: 'high', type: 'approval', category: 'inbox', attachments: 2 },
  { id: '2', subject_ar: 'تقرير الأثر الشهري', subject_en: 'Monthly Impact Report', preview_ar: 'تم إنشاء تقرير الأثر الشهري لشهر أغسطس 2024', preview_en: 'Monthly impact report generated for August 2024', sender: 'نظام UAMEX', timestamp: '2024-09-07T09:15:00', is_read: false, is_starred: false, priority: 'normal', type: 'system', category: 'inbox' },
  { id: '3', subject_ar: 'تنبيه: انتهاء صلاحية المستند', subject_en: 'Alert: Document Expiring', preview_ar: 'مستند السياسة المالية ينتهي صلاحيته خلال 7 أيام', preview_en: 'Financial policy document expires in 7 days', sender: 'نظام التنبيهات', timestamp: '2024-09-06T14:00:00', is_read: true, is_starred: false, priority: 'urgent', type: 'notification', category: 'inbox' },
  { id: '4', subject_ar: 'دعوة لاجتماع مخطط', subject_en: 'Meeting Invitation Scheduled', preview_ar: 'تم جدولة اجتماع مراجعة المشاريع يوم الأحد القادم', preview_en: 'Project review meeting scheduled for next Sunday', sender: 'سارة العلي', timestamp: '2024-09-06T11:30:00', is_read: true, is_starred: true, priority: 'normal', type: 'email', category: 'inbox', attachments: 1 },
  { id: '5', subject_ar: 'تحديث نظام الأمان', subject_en: 'Security System Update', preview_ar: 'تم تحديث إعدادات الأمان بنجاح. جميع الحمايات مفعلة.', preview_en: 'Security settings updated successfully. All protections active.', sender: 'فريق الأمان', timestamp: '2024-09-05T16:45:00', is_read: true, is_starred: false, priority: 'low', type: 'system', category: 'inbox' },
  { id: '6', subject_ar: 'تقرير المبيعات الأسبوعي', subject_en: 'Weekly Sales Report', preview_ar: 'ملخص المبيعات والإيرادات لأسبوع 35', preview_en: 'Sales and revenue summary for week 35', sender: 'قسم المبيعات', timestamp: '2024-09-05T08:00:00', is_read: true, is_starred: false, priority: 'normal', type: 'email', category: 'inbox', attachments: 3 },
];

const generateMockNotifications = (): Notification[] => [
  { id: 'n1', title_ar: 'مهمة جديدة', title_en: 'New Task Assigned', body_ar: 'تم تكليفك بمهمة مراجعة التقرير المالي', body_en: 'You have been assigned to review the financial report', type: 'info', timestamp: '2024-09-07T11:00:00', read: false },
  { id: 'n2', title_ar: 'تم الموافقة', title_en: 'Approval Granted', body_ar: 'تمت الموافقة على طلب الشراء رقم PO-2024-089', body_en: 'Purchase order PO-2024-089 has been approved', type: 'success', timestamp: '2024-09-07T10:30:00', read: false },
  { id: 'n3', title_ar: 'تنبيه أمني', title_en: 'Security Alert', body_ar: 'تم رصد محاولة دخول غير مصرح بها', body_en: 'Unauthorized access attempt detected', type: 'error', timestamp: '2024-09-07T09:00:00', read: true },
  { id: 'n4', title_ar: 'تحديث الميزانية', title_en: 'Budget Update', body_ar: 'تم تحديث الميزانية للمشاريع النشطة', body_en: 'Budget updated for active projects', type: 'warning', timestamp: '2024-09-06T15:00:00', read: true },
];

export function CommunicationsView({ lang = 'en' }: { lang?: CommLang }) {
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const messages = useMemo(() => generateMockMessages(), []);
  const notifications = useMemo(() => generateMockNotifications(), []);

  const unreadCount = messages.filter(m => !m.is_read).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const filteredMessages = useMemo(() => {
    let result = messages.filter(m => m.category === selectedFolder);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => m.subject_ar.toLowerCase().includes(q) || m.subject_en.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q));
    }
    return result;
  }, [messages, selectedFolder, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10"><MessageSquare className="w-7 h-7 text-emerald-500" /></div>
              {t('الاتصالات والإشعارات', 'Communications & Notifications', lang)}
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              {t(`${unreadCount} رسائل غير مقروءة`, `${unreadCount} unread messages`, lang)}
            </p>
          </div>
          <EnterpriseButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>{t('رسالة جديدة', 'New Message', lang)}</EnterpriseButton>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'messages' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              <Inbox className="w-4 h-4" />
              {t('الرسائل', 'Messages', lang)}
              {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px]">{unreadCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'notifications' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              <Bell className="w-4 h-4" />
              {t('الإشعارات', 'Notifications', lang)}
              {unreadNotifications > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px]">{unreadNotifications}</span>}
            </button>
          </div>

          {activeTab === 'messages' ? (
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar */}
              <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-800">
                <div className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('بحث...', 'Search...', lang)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm text-slate-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
                <nav className="px-2 pb-2">
                  {[
                    { id: 'inbox', icon: Inbox, ar: 'الوارد', en: 'Inbox', count: unreadCount },
                    { id: 'starred', icon: Star, ar: 'المميزة', en: 'Starred', count: messages.filter(m => m.is_starred).length },
                    { id: 'sent', icon: Send, ar: 'المرسلة', en: 'Sent', count: 0 },
                    { id: 'drafts', icon: Mail, ar: 'المسودات', en: 'Drafts', count: 0 },
                    { id: 'archive', icon: Archive, ar: 'الأرشيف', en: 'Archive', count: 0 },
                  ].map(folder => {
                    const Icon = folder.icon;
                    return (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                          selectedFolder === folder.id ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{folder[lang]}</span>
                        {folder.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-700 text-[10px]">{folder.count}</span>}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Message List */}
              <div className="flex-1 divide-y divide-slate-100 dark:divide-zinc-800 max-h-[600px] overflow-y-auto">
                {filteredMessages.length === 0 ? (
                  <EmptyState variant="empty" lang={lang} title={t('لا توجد رسائل', 'No messages', lang)} className="p-8" />
                ) : filteredMessages.map(msg => {
                  const typeConfig = TYPE_CONFIG[msg.type];
                  const priorityConfig = PRIORITY_CONFIG[msg.priority];
                  const TypeIcon = typeConfig.icon;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer ${!msg.is_read ? 'bg-emerald-50/30 dark:bg-emerald-500/5' : ''}`}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                          {msg.sender.charAt(0)}
                        </div>
                        <TypeIcon className={`absolute -bottom-1 -right-1 w-4 h-4 ${typeConfig.color} bg-white dark:bg-zinc-900 rounded-full p-0.5`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${!msg.is_read ? 'font-black text-slate-900 dark:text-zinc-100' : 'font-bold text-slate-700 dark:text-zinc-300'}`}>
                            {msg.sender}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${priorityConfig.bg} ${priorityConfig.color}`}>
                            {msg.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 ml-auto">{msg.timestamp.split('T')[1]?.slice(0, 5)}</span>
                        </div>
                        <p className={`text-sm mt-0.5 ${!msg.is_read ? 'font-bold text-slate-900 dark:text-zinc-100' : 'text-slate-700 dark:text-zinc-300'}`}>
                          {lang === 'ar' ? msg.subject_ar : msg.subject_en}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                          {lang === 'ar' ? msg.preview_ar : msg.preview_en}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {msg.is_starred && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                        {msg.attachments && msg.attachments > 0 && <Paperclip className="w-3 h-3 text-slate-400" />}
                        {!msg.is_read && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Notifications Tab */
            <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[600px] overflow-y-auto">
              {notifications.length === 0 ? (
                <EmptyState variant="empty" lang={lang} title={t('لا توجد إشعارات', 'No notifications', lang)} className="p-8" />
              ) : notifications.map(notif => (
                <div key={notif.id} className={`flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${!notif.read ? 'bg-emerald-50/30 dark:bg-emerald-500/5' : ''}`}>
                  <div className={`p-2 rounded-xl ${
                    notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                    notif.type === 'error' ? 'bg-red-500/10 text-red-500' :
                    notif.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {notif.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                     notif.type === 'error' ? <AlertTriangle className="w-5 h-5" /> :
                     notif.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                     <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${!notif.read ? 'font-black' : 'font-bold'} text-slate-900 dark:text-zinc-100`}>
                      {lang === 'ar' ? notif.title_ar : notif.title_en}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {lang === 'ar' ? notif.body_ar : notif.body_en}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">{notif.timestamp.split('T')[0]}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommunicationsView;
