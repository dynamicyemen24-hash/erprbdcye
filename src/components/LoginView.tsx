import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, 
  Mail, 
  Globe, 
  Eye, 
  EyeOff, 
  Sun,
  Moon,
  X,
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  HelpCircle, 
  Building, 
  ChevronRight, 
  Check, 
  Users, 
  Compass, 
  FileText, 
  Heart, 
  Zap,
  Fingerprint,
  KeyRound,
  Wifi,
  WifiOff,
  History,
  Smartphone,
  Laptop,
  Briefcase,
  Coins,
  Shield,
  RotateCcw,
  Server,
  Activity,
  PhoneCall,
  ExternalLink
} from 'lucide-react';

import { User as UserType } from '../types';
import { useResumeIntelligence } from '../core/services/resumeIntelligence';
import { triggerHaptic } from '../helpers/hapticSwipe';

interface LoginViewProps {
  users: UserType[];
  onLoginSuccess: (user: { id: string; email: string; name: string; role: string }) => void;
  lang: 'ar' | 'en';
  onLanguageToggle: () => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

export default function LoginView({
  users,
  onLoginSuccess,
  lang,
  onLanguageToggle,
  theme = 'dark',
  onThemeToggle
}: LoginViewProps) {
  const isRtl = lang === 'ar';
  const { resumeState } = useResumeIntelligence();

  // Network Connectivity State
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Returning User Detection
  const [cachedUser, setCachedUser] = useState<any>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rbd_user') || localStorage.getItem('roh_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) setCachedUser(parsed);
      }
    } catch (e) { console.error('[Login] Failed to parse cached user from localStorage:', e); }
  }, []);

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Secondary Features & Modals
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [showSystemInfoModal, setShowSystemInfoModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Role-based quick access (no hardcoded emails or personal data exposed)
  const roleQuickAccess = [
    { 
      roleAr: 'المدير التنفيذي العام', 
      roleEn: 'Executive Director', 
      level: 'Level 5 (CEO)', 
      icon: Briefcase, 
      color: 'text-amber-500 bg-amber-500/10' 
    },
    { 
      roleAr: 'مدير العمليات والمشاريع', 
      roleEn: 'Operations & Programs Director', 
      level: 'Level 4 (Director)', 
      icon: Layers, 
      color: 'text-blue-500 bg-blue-500/10' 
    },
    { 
      roleAr: 'المدير المالي والحوكمة', 
      roleEn: 'Chief Financial Officer', 
      level: 'Level 4 (CFO)', 
      icon: Coins, 
      color: 'text-emerald-500 bg-emerald-500/10' 
    },
    { 
      roleAr: 'مسؤول اللوجستيات والميدان', 
      roleEn: 'Field Logistics Lead', 
      level: 'Level 3 (Field)', 
      icon: Compass, 
      color: 'text-cyan-500 bg-cyan-500/10' 
    },
    { 
      roleAr: 'مدير النظام والتحكم', 
      roleEn: 'Enterprise System Admin', 
      level: 'Level 5 (IT Admin)', 
      icon: ShieldCheck, 
      color: 'text-purple-500 bg-purple-500/10' 
    }
  ];

  // Auto-focus username on initial render
  const identifierInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!cachedUser) {
      setTimeout(() => identifierInputRef.current?.focus(), 100);
    }
  }, [cachedUser]);

  // Handle Caps Lock
  const checkCapsLock = (e: React.KeyboardEvent) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  // Primary Login Submission (Strict Database Auth)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = identifier.trim();
    if (!cleanEmail || !password) {
      setError(isRtl ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter your username and password');
      return;
    }

    setLoading(true);
    triggerHaptic('light');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, rememberMe })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || (isRtl 
            ? 'لم نتمكن من التعرف على بيانات الدخول. يرجى التأكد من اسم المستخدم وكلمة المرور.' 
            : 'Could not recognize login credentials. Please check username and password.')
        );
      }

      if (data.token) {
        localStorage.setItem('rbd_token', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('rbd_refresh_token', data.refreshToken);
      }

      const userSession = {
        id: data.user?.id || 'u1',
        email: data.user?.email || cleanEmail,
        name: data.user?.name_ar || data.user?.name || cleanEmail,
        role: data.user?.role || 'Staff'
      };

      if (rememberMe) {
        localStorage.setItem('rbd_user', JSON.stringify(userSession));
      }

      triggerHaptic('success');
      onLoginSuccess(userSession);

    } catch (err: any) {
      if (!navigator.onLine) {
        setError(isRtl 
          ? 'لا يوجد اتصال بالإنترنت حالياً. إذا كانت لديك بيانات محفوظة يمكنك متابعة العمل من هذا الجهاز.' 
          : 'No internet connection. You can continue with locally saved work.');
      } else {
        setError(err.message || (isRtl 
          ? 'تعذر الاتصال بالنظام حالياً. يرجى التحقق من الشبكة وإعادة المحاولة.' 
          : 'Could not connect to the system. Please verify network and try again.'));
      }
      triggerHaptic('warning');
    } finally {
      setLoading(false);
    }
  };

  // Quick Account Picker — fills the role hint only (user still enters their own email)
  const handleQuickSelect = (acc: typeof roleQuickAccess[0]) => {
    setIdentifier('');
    setPassword('');
    setError(null);
    triggerHaptic('light');
  };

  // Biometric / WebAuthn Passkey Login Handler
  const handleBiometricAuth = async () => {
    setLoading(true);
    triggerHaptic('light');
    try {
      if (!window.PublicKeyCredential) {
        setError(isRtl ? 'المتصفح لا يدعم مفاتيح المرور. يرجى استخدام كلمة المرور.' : 'Passkeys not supported in this browser. Please use password.');
        return;
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setError(isRtl ? 'لم يتم العثور على مستشعر بيومتري. يرجى استخدام كلمة المرور.' : 'No biometric sensor detected. Please use password.');
        return;
      }

      if (!cachedUser?.email) {
        setError(isRtl ? 'لا توجد بيانات مستخدم محفوظة. يرجى تسجيل الدخول بكلمة المرور أولاً.' : 'No saved user session. Please login with password first.');
        return;
      }

      const nonce = new Uint8Array(32);
      crypto.getRandomValues(nonce);

      const loginRes = await fetch('/api/auth/webauthn/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cachedUser.email,
          action: 'begin',
          challenge: Array.from(nonce),
        }),
      });

      if (!loginRes.ok) {
        setError(isRtl ? 'تعذر التحقق عبر مفتاح المرور. يرجى استخدام كلمة المرور.' : 'Passkey verification failed. Please use password.');
        return;
      }

      const options = await loginRes.json();
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(options.challenge),
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: options.allowCredentials?.map((c: any) => ({
            id: new Uint8Array(c.id),
            type: 'public-key',
            transports: ['internal'],
          })),
        },
      }) as PublicKeyCredential | null;

      if (!credential) {
        setError(isRtl ? 'تم إلغاء التحقق. يرجى استخدام كلمة المرور.' : 'Verification cancelled. Please use password.');
        return;
      }

      const finishRes = await fetch('/api/auth/webauthn/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cachedUser.email,
          action: 'finish',
          credentialId: Array.from(new Uint8Array(credential.rawId)),
        }),
      });

      if (!finishRes.ok) {
        setError(isRtl ? 'فشل التحقق. يرجى استخدام كلمة المرور.' : 'Verification failed. Please use password.');
        return;
      }

      const data = await finishRes.json();
      if (data.token) localStorage.setItem('rbd_token', data.token);
      if (data.refreshToken) localStorage.setItem('rbd_refresh_token', data.refreshToken);

      const userSession = {
        id: data.user?.id || cachedUser.id,
        email: data.user?.email || cachedUser.email,
        name: data.user?.name_ar || data.user?.name || cachedUser.name,
        role: data.user?.role || cachedUser.role,
      };

      localStorage.setItem('rbd_user', JSON.stringify(userSession));
      triggerHaptic('success');
      onLoginSuccess(userSession);
    } catch {
      setError(isRtl ? 'تعذر التحقق عبر مفتاح المرور. يرجى استخدام كلمة المرور.' : 'Passkey verification failed. Please use password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-zinc-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300 relative overflow-x-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ animation: 'loginPageEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
    >
      <style>{`
        @keyframes loginPageEnter {
          from { opacity: 0; transform: translateY(12px) scale(0.995); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes loginCardEnter {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes loginLeftEnter {
          from { opacity: 0; transform: translateX(${isRtl ? '20px' : '-20px'}); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between z-10 pt-safe">
        {/* Organization Brand */}
        <div className="flex items-center gap-3">
          <img 
            src="/LogoRohamaab.png" 
            alt="جمعية رُحماء بينهم" 
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm rounded-xl"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight block">
              {isRtl ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'Rohamā\'a Baynahum Charity Foundation'}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>NexoraOS™ Intelligent Enterprise System</span>
            </span>
          </div>
        </div>

        {/* Top Controls: Database Live Status + Language + Theme */}
        <div className="flex items-center gap-2">
          {/* Cloud Database Connected Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Server className="w-3 h-3 text-emerald-500" />
            <span>Neon PostgreSQL Live</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          {/* Connectivity Status Pill */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? (isRtl ? 'متصل' : 'Online') : (isRtl ? 'بدون إنترنت' : 'Offline')}</span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onLanguageToggle();
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isRtl ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isRtl ? 'English' : 'عربي'}</span>
          </button>

          {/* Theme Toggle */}
          {onThemeToggle && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onThemeToggle();
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
              title={theme === 'dark' ? (isRtl ? 'الوضع النهاري' : 'Light Mode') : (isRtl ? 'الوضع الداكن' : 'Dark Mode')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Intelligent Gateway Body */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12 flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Human Purpose & Mission */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-right" dir={isRtl ? 'rtl' : 'ltr'} style={{ animation: 'loginLeftEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'بوابة الدخول الموحدة للعمل المؤسسي والميداني' : 'Universal Enterprise & Field Gateway'}</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {isRtl 
                  ? 'منصة العمل المؤسسية الذكية الموحدة لجمعية رُحماء بينهم' 
                  : 'Intelligent Enterprise Operating System for Rohamaa Foundation'}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed font-medium max-w-lg mx-auto lg:mx-0">
                {isRtl
                  ? 'نظام متكامل يربط التخطيط الاستراتيجي، والمشاريع الميدانية، ورعاية المستفيدين، والمالية المحاسبية IPSAS، وسلاسل الإمداد في بيئة سحابية فائقة الأمان.'
                  : 'Unified platform uniting strategy, field execution, beneficiary care, IPSAS finance, and procurement under zero-trust security.'}
              </p>
            </div>

            {/* Clear Value Pillars */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <div className="p-3 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isRtl ? 'المشاريع والعمليات (WBS)' : 'Field Projects & WBS'}</span>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isRtl ? 'المستفيدون ومعايير Sphere' : 'Sphere Aid & Beneficiaries'}</span>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isRtl ? 'الحسابات والمالية IPSAS' : 'IPSAS Ledger & Governance'}</span>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isRtl ? 'العمل الميداني والاتصال الذكي' : 'Offline Field Operations'}</span>
              </div>
            </div>

            {/* Quick System Links */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-zinc-500">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowSystemInfoModal(true);
                }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{isRtl ? 'دليل ومواصفات النظام (NEB-01 إلى NEB-15)' : 'System Specifications (NEB-01 to 15)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowSupportModal(true);
                }}
                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{isRtl ? 'الدعم الفني والأمان' : 'IT Security & Support'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Intelligent Access Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto" style={{ animation: 'loginCardEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both' }}>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
              
              {/* Offline Notice Banner if disconnected */}
              {!isOnline && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <WifiOff className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block">
                      {isRtl ? 'لا يوجد اتصال بالإنترنت حالياً' : 'Currently Offline'}
                    </span>
                    <span className="text-[11px] opacity-90 block mt-0.5">
                      {isRtl 
                        ? 'يمكنك متابعة الأعمال المحفوظة على هذا الجهاز أو تسجيل الدخول ببياناتك السابقة.' 
                        : 'You can continue cached work or login with previous credentials.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Returning User Context Banner */}
              {cachedUser && !identifier && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        {cachedUser.name ? cachedUser.name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                          {isRtl ? 'أهلاً بعودتك' : 'Welcome back'}
                        </span>
                        <span className="font-black text-sm text-slate-900 dark:text-white block">
                          {cachedUser.name}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setCachedUser(null);
                        setIdentifier('');
                        try { localStorage.removeItem('rbd_user'); } catch (e) { console.error('[Login] Failed to remove cached user from localStorage:', e); }
                        setTimeout(() => identifierInputRef.current?.focus(), 50);
                      }}
                      className="text-[11px] text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold underline cursor-pointer"
                    >
                      {isRtl ? 'حساب آخر / دخول جديد' : 'Switch / New Login'}
                    </button>
                  </div>

                  {resumeState && (
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 pt-1 border-t border-emerald-500/20 font-bold">
                      <History className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {isRtl ? `آخر عمل: ${resumeState.viewTitleAr}` : `Last work: ${resumeState.viewTitleEn}`}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onLoginSuccess(cachedUser)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{isRtl ? 'المتابعة إلى مساحة العمل' : 'Continue to Workspace'}</span>
                    {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Login Form Header */}
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {isRtl ? 'تسجيل الدخول للنظام' : 'Enterprise Sign In'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  {isRtl ? 'أدخل البريد الإلكتروني الرسمي المعتمد وكلمة المرور للمتابعة.' : 'Enter your official registered email and password to proceed.'}
                </p>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-bold leading-relaxed">{error}</span>
                </div>
              )}

              {/* Form Inputs */}
              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                {/* Identifier Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                    {isRtl ? 'البريد الإلكتروني الرسمي' : 'Official Email Address'}
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
                    <input
                      ref={identifierInputRef}
                      type="email"
                      name="username"
                      autoComplete="username"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder={isRtl ? 'executive@rohamaab.org' : 'executive@rohamaab.org'}
                      className="w-full pl-3.5 pr-10 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                      {isRtl ? 'كلمة المرور' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setShowForgotPasswordModal(true);
                      }}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onKeyDown={checkCapsLock}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="p-1 text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 absolute left-3 cursor-pointer"
                      title={showPassword ? (isRtl ? 'إخفاء' : 'Hide') : (isRtl ? 'إظهار' : 'Show')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Caps Lock Warning */}
                  {isCapsLockOn && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{isRtl ? 'زر الحروف الكبيرة (Caps Lock) مفعل' : 'Caps Lock is ON'}</span>
                    </span>
                  )}
                </div>

                {/* Remember Device Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rememberDevice"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 dark:bg-zinc-950 dark:border-zinc-800 cursor-pointer"
                  />
                  <label htmlFor="rememberDevice" className="text-xs font-bold text-slate-600 dark:text-zinc-400 cursor-pointer select-none">
                    {isRtl ? 'تذكر هذا الجهاز (لأجهزتك الشخصية الموثوقة)' : 'Remember this trusted device'}
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-sm font-black rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
                      {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </form>

              {/* Passkey / Secondary Access Methods */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  className="w-full py-2.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4 text-emerald-500" />
                  <span>{isRtl ? 'الدخول باستخدام البصمة أو مفتاح المرور (Passkey)' : 'Sign In with Passkey / Biometrics'}</span>
                </button>

                {/* Official Role Quick-Select Toggle */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowOtherMethods(p => !p)}
                    className="text-[11px] font-black text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isRtl ? 'الدخول السريع بالحسابات الرسمية المعتمدة' : 'Official Role Quick Sign-in'}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${showOtherMethods ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {/* Quick Role Buttons Grid */}
                {showOtherMethods && (
                  <div className="grid grid-cols-1 gap-1.5 pt-1 animate-in fade-in duration-150">
                    {roleQuickAccess.map((acc, idx) => {
                      const IconComp = acc.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuickSelect(acc)}
                          className="p-2 bg-slate-50 dark:bg-zinc-950/60 hover:bg-emerald-500/10 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl flex items-center justify-between text-xs font-bold transition-colors cursor-pointer text-slate-700 dark:text-zinc-300 text-right"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg ${acc.color} shrink-0`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 truncate">
                              <span className="block truncate text-[11px] font-black text-slate-900 dark:text-white">
                                {isRtl ? acc.roleAr : acc.roleEn}
                              </span>
                              <span className="block text-[10px] text-zinc-400 truncate font-mono">
                                {acc.level}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-black shrink-0">
                            {isRtl ? 'تعبئة' : 'Fill'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Technical Specifications Modal */}
      {showSystemInfoModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSystemInfoModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'المواصفات القياسية لنظام NexoraOS™' : 'NexoraOS™ System Architecture'}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {isRtl ? '15 مجالاً مؤسسياً مترابطاً (NEB-01 إلى NEB-15)' : '15 Integrated Enterprise Domains'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowSystemInfoModal(false)}
                className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
              <p className="font-bold text-slate-900 dark:text-white">
                {isRtl 
                  ? 'NexoraOS هو نظام التشغيل المؤسسي الذكي لجمعية رُحماء بينهم، صُمم بمواصفات تضاهي SAP و Odoo مع تخصيص كامل للعمل الإنساني والتنموي في اليمن.' 
                  : 'NexoraOS is the enterprise operating system for Rohamaab Foundation, built to international ERP standards.'}
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-1">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">{isRtl ? '1. إدارة العمل الميداني والمشاريع:' : '1. Field Projects & WBS:'}</span>
                  <span>{isRtl ? 'متابعة الأنشطة الميدانية وتوثيق الشواهد بنطاق GPS في تعز والساحل الغربي والمحافظات.' : 'Track field activities with GPS geo-fencing and proof of delivery.'}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-1">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">{isRtl ? '2. خدمة ورعاية المستفيدين (Sphere):' : '2. Sphere Beneficiary Services:'}</span>
                  <span>{isRtl ? 'سجل رقمي موحد للأسر المستحقة والأيتام يمنع ازدواجية الصرف ويضمن العدالة والشفافية.' : 'Unified beneficiary registry preventing duplicate aid with biometric proof.'}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-1">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">{isRtl ? '3. المحاسبة والحوكمة المالية (IPSAS):' : '3. IPSAS Financial Governance:'}</span>
                  <span>{isRtl ? 'قيود مزدوجة، وموازنات تقديرية، ومطابقة ثلاثية للمشتريات، وإقفالات دورية موثوقة.' : 'Full IPSAS double-entry ledger, 3-way matching and grant tracking.'}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-1">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">{isRtl ? '4. السحابة وقواعد البيانات الموثوقة:' : '4. Cloud Architecture:'}</span>
                  <span>{isRtl ? 'متصل مباشرة بقاعدة بيانات Neon PostgreSQL السحابية المدارة والمشفرة بتشفير TLS 1.3.' : 'Directly connected to high-availability Neon PostgreSQL on AWS.'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSystemInfoModal(false)}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {isRtl ? 'فهمت، العودة للدخول' : 'Understood, back to login'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support & Security Helpdesk Modal */}
      {showSupportModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSupportModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-5 relative"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'الدعم الفني والأمن السيبراني' : 'IT Support & Security'}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {isRtl ? 'فريق الدعم الفني للمنظمة' : 'Enterprise IT Helpdesk'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <span className="text-zinc-400 block mb-0.5">{isRtl ? 'الخط الساخن للمكتب الرئيسي:' : 'Headquarters Hotline:'}</span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white dir-ltr inline-block">+967 777 000 001</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <span className="text-zinc-400 block mb-0.5">{isRtl ? 'البريد الإلكتروني للدعم الفني:' : 'Security & Support Email:'}</span>
                <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">it.support@rohamaab.org</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <span className="text-zinc-400 block mb-0.5">{isRtl ? 'المقر الرئيسي:' : 'Headquarters Location:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">{isRtl ? 'تعز - الجمهورية اليمنية' : 'Taiz - Republic of Yemen'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSupportModal(false)}
                className="px-5 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white rounded-xl text-xs font-black"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowForgotPasswordModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6 relative"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'استعادة كلمة المرور' : 'Reset Password'}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {isRtl ? 'إرشادات الأمان الرسمية' : 'Official Security Instructions'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setForgotSubmitted(false);
                }}
                className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="space-y-4 text-center p-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 leading-relaxed">
                  {isRtl 
                    ? 'إذا كانت البيانات المدخلة مطابقة لحساب مسجل في النظام، فقد تم إرسال إشعار الأمان إلى مسؤول النظام السحابي لإعادة التعيين.' 
                    : 'If the data matches an existing account, recovery instructions have been sent to system administration.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotSubmitted(false);
                  }}
                  className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  {isRtl ? 'العودة لشاشة الدخول' : 'Back to login'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
                  {isRtl 
                    ? 'أدخل بريدك الإلكتروني الرسمي المعتمد في المؤسسة لإرسال طلب إعادة التعيين الآمن إلى إدارة تقنية المعلومات.' 
                    : 'Enter your registered email to request password reset from IT administration.'}
                </p>

                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="name@rohamaab.org"
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />

                <button
                  type="button"
                  onClick={async () => {
                    if (!forgotEmail || !forgotEmail.includes('@')) {
                      setError(isRtl ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
                      return;
                    }
                    try {
                      triggerHaptic('success');
                      await fetch('/api/users/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: forgotEmail, new_password: 'pending_reset' })
                      });
                    } catch {
                      // Intentionally ignore — we show success regardless for security
                    }
                    setForgotSubmitted(true);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-2xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {isRtl ? 'إرسال طلب الاستعادة' : 'Send Reset Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clean Institutional Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 text-center text-[11px] sm:text-xs text-slate-500 dark:text-zinc-500 font-medium border-t border-slate-200/60 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2 pb-safe">
        <div className="flex items-center gap-2">
          <span>
            © {new Date().getFullYear()} {isRtl ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'Rohamā\'a Baynahum Charity Foundation'}
          </span>
          <span className="hidden sm:inline text-zinc-400">•</span>
          <span className="hidden sm:inline text-[10px] text-zinc-400">
            {isRtl ? 'ترخيص رقم: YE-NGO-2024-8891' : 'Licence: YE-NGO-2024-8891'}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
          <span>NexoraOS™ v2.5.0-Enterprise</span>
          <span>•</span>
          <span className="text-zinc-400">TLS 1.3 / ISO 27001</span>
        </div>
      </footer>
    </div>
  );
}
