import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Shield, 
  Building2, 
  Settings, 
  Lock, 
  Users, 
  LogOut, 
  X, 
  Check, 
  Sliders, 
  KeyRound, 
  Activity,
  Award,
  Mail,
  Smartphone
} from 'lucide-react';

import { User } from '../core/types/users';

interface UserProfilePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  currentUser: User | null;
  onSwitchUser?: (user: User) => void;
  onLogout?: () => void;
}

export const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({
  isOpen,
  onClose,
  lang,
  currentUser,
  onSwitchUser,
  onLogout
}) => {
  const [activeSection, setActiveSection] = useState<'main' | 'profile' | 'account' | 'preferences' | 'security' | 'switch'>('main');
  const [savedMsg, setSavedMsg] = useState(false);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';

  const demoUsers = [
    { id: 'usr-1', name: isRtl ? 'د. عبدالله المحمدي' : 'Dr. Abdullah Al-Mohammadi', role: isRtl ? 'المدير التنفيذي' : 'Executive Director', email: 'ceo@rohamaab.org' },
    { id: 'usr-2', name: isRtl ? 'أ. فاطمة باحيدرة' : 'Fatima Ba-Haidarah', role: isRtl ? 'مدير الإدارة المالية' : 'Finance Director', email: 'finance@rohamaab.org' },
    { id: 'usr-3', name: isRtl ? 'م. صالح العمري' : 'Saleh Al-Omari', role: isRtl ? 'مدير العمليات الميدانية' : 'Operations Director', email: 'operations@rohamaab.org' },
    { id: 'usr-4', name: isRtl ? 'م. رائد الشميري' : 'Raed Al-Shumairi', role: isRtl ? 'مسؤول النظام التقني' : 'System Administrator', email: 'admin@rohamaab.org' },
  ];

  const handleSavePreferences = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="absolute top-14 left-4 z-50 w-96 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-fade-in select-none">
      
      {/* Popover Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/40 flex items-center justify-center text-white font-black text-sm shadow-md">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h4 className="font-black text-sm text-white">
              {currentUser?.name || (isRtl ? 'مشرف النظام' : 'System User')}
            </h4>
            <p className="text-[10px] text-emerald-200/80 font-mono">
              {currentUser?.email || 'admin@rohamaab.org'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Popover Body Content */}
      <div className="p-4 max-h-[420px] overflow-y-auto space-y-3 text-xs text-slate-700 dark:text-zinc-300">
        
        {activeSection === 'main' && (
          <div className="space-y-2">
            {/* User Meta Card */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl space-y-2 border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">{isRtl ? 'المسمى الوظيفي' : 'Job Title'}</span>
                <span className="font-extrabold text-slate-900 dark:text-zinc-100">{currentUser?.role || 'Executive Director'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">{isRtl ? 'المؤسسة/الوحدة' : 'Organization Unit'}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Rohamā'a Baynahum HQ</span>
              </div>
            </div>

            {/* Menu Options */}
            <div className="space-y-1 font-medium">
              <button
                onClick={() => setActiveSection('profile')}
                className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? 'الملف الشخصي' : 'Profile'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">→</span>
              </button>

              <button
                onClick={() => setActiveSection('account')}
                className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>{isRtl ? 'إدارة الحساب' : 'Account Management'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">→</span>
              </button>

              <button
                onClick={() => setActiveSection('preferences')}
                className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>{isRtl ? 'التفضيلات' : 'Preferences'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">→</span>
              </button>

              <button
                onClick={() => setActiveSection('security')}
                className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>{isRtl ? 'الأمان والجلسات' : 'Security & Sessions'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">→</span>
              </button>

              <button
                onClick={() => setActiveSection('switch')}
                className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl flex items-center justify-between transition-all cursor-pointer border-t border-slate-100 dark:border-zinc-800 pt-2 mt-2"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>{isRtl ? 'تبديل الحساب' : 'Switch Account'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 text-[10px] font-black font-mono">4 Active</span>
              </button>
            </div>
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h5 className="font-black text-slate-900 dark:text-zinc-100">{isRtl ? 'الملف الشخصي للمستخدم' : 'User Profile Details'}</h5>
              <button onClick={() => setActiveSection('main')} className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer">← {isRtl ? 'رجوع' : 'Back'}</button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                <input type="text" readOnly value={currentUser?.name || ''} className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl font-medium text-xs mt-1 border border-slate-200 dark:border-zinc-700" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                <input type="text" readOnly value={currentUser?.email || ''} className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl font-medium text-xs mt-1 border border-slate-200 dark:border-zinc-700" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? 'المسمى الوظيفي والصلاحية' : 'Role'}</label>
                <input type="text" readOnly value={currentUser?.role || ''} className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl font-medium text-xs mt-1 border border-slate-200 dark:border-zinc-700" />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'account' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h5 className="font-black text-slate-900 dark:text-zinc-100">{isRtl ? 'إدارة الحساب المؤسسي' : 'Account Management'}</h5>
              <button onClick={() => setActiveSection('main')} className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer">← {isRtl ? 'رجوع' : 'Back'}</button>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
              <p className="font-bold text-blue-900 dark:text-blue-300">{isRtl ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'Rohamā\'a Baynahum Foundation'}</p>
              <p className="text-[10px] text-blue-700 dark:text-blue-400">{isRtl ? 'حسابك مرتبط بهذه المنظمة' : 'Your account is linked to this organization'}</p>
            </div>
            <button
              onClick={() => { alert(isRtl ? 'تم تحديث مزامنة الحساب بنجاح' : 'Account synchronization updated'); }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs transition-all cursor-pointer"
            >
              {isRtl ? 'مزامنة بيانات الحساب السحابية' : 'Sync Cloud Account'}
            </button>
          </div>
        )}

        {activeSection === 'preferences' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h5 className="font-black text-slate-900 dark:text-zinc-100">{isRtl ? 'تفضيلات العرض والنظام' : 'System Preferences'}</h5>
              <button onClick={() => setActiveSection('main')} className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer">← {isRtl ? 'رجوع' : 'Back'}</button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl cursor-pointer">
                <span>{isRtl ? 'الإشعارات الصوتية الفورية' : 'Sound Alerts'}</span>
                <input type="checkbox" defaultChecked className="rounded accent-emerald-600 w-4 h-4" />
              </label>
              <label className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl cursor-pointer">
                <span>{isRtl ? 'الحفظ التلقائي للقيود والمشاريع' : 'Auto-save records'}</span>
                <input type="checkbox" defaultChecked className="rounded accent-emerald-600 w-4 h-4" />
              </label>
            </div>
            <button
              onClick={handleSavePreferences}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {savedMsg ? <Check className="w-4 h-4" /> : null}
              <span>{isRtl ? 'حفظ التفضيلات' : 'Save Preferences'}</span>
            </button>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h5 className="font-black text-slate-900 dark:text-zinc-100">{isRtl ? 'الأمان والجلسات النشطة' : 'Security & Sessions'}</h5>
              <button onClick={() => setActiveSection('main')} className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer">← {isRtl ? 'رجوع' : 'Back'}</button>
            </div>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-black text-emerald-800 dark:text-emerald-300">Cloud Run Secure Session</p>
                  <p className="text-[9px] text-slate-500">IP: 192.168.1.45 • Active now</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
            </div>
            <button
              onClick={() => { alert(isRtl ? 'تم إنهاء جميع الجلسات الأخرى بنجاح' : 'All other sessions terminated'); }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-extrabold text-xs transition-all cursor-pointer"
            >
              {isRtl ? 'إنهاء جميع الجلسات الأخرى' : 'Terminate Other Sessions'}
            </button>
          </div>
        )}

        {activeSection === 'switch' && (
          <div className="space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h5 className="font-black text-slate-900 dark:text-zinc-100">{isRtl ? 'تبديل حساب المستخدم' : 'Switch Active User'}</h5>
              <button onClick={() => setActiveSection('main')} className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer">← {isRtl ? 'رجوع' : 'Back'}</button>
            </div>
            <div className="space-y-1.5">
              {demoUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    if (onSwitchUser) onSwitchUser(u as any);
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer border ${
                    currentUser?.email === u.email
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-100 dark:border-zinc-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-right rtl:text-right">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-xs">{u.name}</p>
                      <p className="text-[10px] text-slate-500">{u.role}</p>
                    </div>
                  </div>
                  {currentUser?.email === u.email && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Popover Footer (Logout) */}
      <div className="p-3 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-mono">NexoraOS™ Security Guard</span>
        {onLogout && (
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        )}
      </div>

    </div>
  );
};

export default UserProfilePopover;
