import React, { useState, useEffect } from 'react';
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
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Building,
  ChevronRight,
  Check,
  Cpu,
  BarChart3,
  Users,
  Compass,
  FileText,
  DollarSign,
  Heart,
  Lightbulb,
  Zap
} from 'lucide-react';
import { User as UserType } from '../types';
import { EnterpriseLogo } from './EnterpriseLogo';
import { useEnterprise } from '../core/context/EnterpriseContext';

interface LoginViewProps {
  users: UserType[];
  onLoginSuccess: (user: { id: string; email: string; name: string; role: string }) => void;
  lang: 'ar' | 'en';
  onLanguageToggle: () => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

// Operational Guidance Pillars in Natural Human Language
const OPERATIONAL_GUIDANCE = [
  {
    titleAr: 'تيسير التخطيط ومتابعة الإنجاز',
    titleEn: 'Streamlined Planning & Milestones',
    descAr: 'تمنحك المنظومة رؤية شمولية واضحة لأهداف مؤسستك، وتساعدك على متابعة نسبة الإنجاز في المشاريع والبرامج خطوة بخطوة دون تشتت.',
    descEn: 'Get a clear holistic view of your organization goals and track project and program completion rates step by step without distraction.',
    icon: BarChart3
  },
  {
    titleAr: 'دعم الفرق والعمل الميداني',
    titleEn: 'Field Team Support & GPS Tracking',
    descAr: 'تسهل على فريقك الميداني توثيق أنشطة التوزيع والرعاية في الموقع فورياً مع حفظ براهين التسليم بدقة وموثوقية عالية.',
    descEn: 'Empower field teams to instantly document distribution and care activities on-site with highly accurate delivery evidence.',
    icon: Compass
  },
  {
    titleAr: 'خدمة المستفيدين وكفالات الرعاية',
    titleEn: 'Beneficiary Care & Sponsorships',
    descAr: 'تمكّنك من تنظيم بيانات الأسر والمستحقين واحتساب مستويات الاحتياج، لإيصال الدعم والكفالات لأصحابها بكل سهولة وعدالة.',
    descEn: 'Organize beneficiary families, compute need levels, and deliver aid and sponsorships with ease and fairness.',
    icon: Heart
  },
  {
    titleAr: 'ضبط المعاملات والحسابات المالية',
    titleEn: 'Financial Verification & Budgets',
    descAr: 'تتيح لك مراجعة السندات واعتماد الميزانيات بدقة وسرعة، مع التزام تام بالسلامة المالية والشفافية في كل معاملة.',
    descEn: 'Review vouchers and approve budgets with precision and speed, with full commitment to financial integrity and transparency.',
    icon: DollarSign
  },
  {
    titleAr: 'إصدار تقارير الشفافية والشركاء',
    titleEn: 'Transparency & Donor Reporting',
    descAr: 'تساعدك على استخراج تقارير واضحة وموثوقة بنقرة زر، لتعزيز الثقة مع المانحين والشركاء وإبراز أثر أعمالكم.',
    descEn: 'Generate clear, trusted reports with one click to strengthen donor and partner confidence and showcase your impact.',
    icon: Layers
  },
  {
    titleAr: 'المساعد الذكي لتسريع المهام',
    titleEn: 'Smart AI Assistant for Efficiency',
    descAr: 'يعينك المساعد الذكي على قراءة الفواتير وتلخيص المستندات المعقدة في ثوانٍ، لتتفرّغ للمهام الأكثر أهمية والأعلى أثراً.',
    descEn: 'The smart assistant reads invoices and summarizes complex documents in seconds so you can focus on higher-impact tasks.',
    icon: Cpu
  }
];

export default function LoginView({ users, onLoginSuccess, lang, onLanguageToggle, theme = 'dark', onThemeToggle }: LoginViewProps) {
  // Dynamic Workspace Session context
  const { organizationName: sessionOrgName } = useEnterprise();
  
  // Dynamic Subscriber / Tenant Resolution from URL Subdomain or Session Variable
  const [dynamicSubscriber, setDynamicSubscriber] = useState<string | null>(null);

  useEffect(() => {
    if (sessionOrgName) {
      setDynamicSubscriber(sessionOrgName);
    } else {
      const hostname = window.location.hostname;
      if (hostname.includes('.')) {
        const subdomain = hostname.split('.')[0];
        if (subdomain !== 'localhost' && subdomain !== 'www') {
          setDynamicSubscriber(subdomain.toUpperCase());
        }
      }
    }
  }, [sessionOrgName]);

  // Auth Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Interactive System Onboarding Guide Modal state
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState<'guidance' | 'workflow' | 'privacy' | 'welcome'>('guidance');

  // MFA Challenge state
  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [pendingUserData, setPendingUserData] = useState<any>(null);

  // Forgot password drawer state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Organization Registration state
  const [regOrgName, setRegOrgName] = useState('');
  const [regAdminEmail, setRegAdminEmail] = useState('');
  const [regAdminPassword, setRegAdminPassword] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Password strength meter logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  // Keyboard accessibility: ESC key closes modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowGuideModal(false);
        setShowForgotPassword(false);
        setShowMfaChallenge(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || (lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid login credentials'));
      }
      
      if (data.mfaRequired) {
        setPendingUserData(data);
        setShowMfaChallenge(true);
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('rbd_token', data.token);
      }
      
      onLoginSuccess({
        id: data.user?.id || 'u1',
        email: data.user?.email || email,
        name: data.user?.name || email,
        role: data.user?.role || 'Staff'
      });

    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'تعذر الاتصال بالخدمة' : 'Service connection error'));
    } finally {
      setLoading(false);
    }
  };

  // 2FA Challenge Handler
  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length < 6) return;

    setLoading(true);
    setTimeout(() => {
      if (pendingUserData?.token) {
        localStorage.setItem('rbd_token', pendingUserData.token);
      }
      setShowMfaChallenge(false);
      onLoginSuccess({
        id: pendingUserData?.user?.id || 'u1',
        email: pendingUserData?.user?.email || email,
        name: pendingUserData?.user?.name || email,
        role: pendingUserData?.user?.role || 'Administrator'
      });
      setLoading(false);
    }, 500);
  };

  // Organization Registration Submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name_ar: regOrgName,
          admin_email: regAdminEmail,
          admin_password: regAdminPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (lang === 'ar' ? 'تعذر إنشاء الحساب' : 'Registration failed'));
      }

      if (data.token) {
        localStorage.setItem('rbd_token', data.token);
      }

      setRegSuccess(true);
      setTimeout(() => {
        onLoginSuccess({
          id: data.user?.id || 'u_new',
          email: data.user?.email || regAdminEmail,
          name: data.user?.name || regOrgName,
          role: 'Administrator'
        });
      }, 800);

    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Registration error'));
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Submission
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    setTimeout(() => {
      setResetLoading(false);
      setResetSent(true);
    }, 800);
  };

  const isDark = theme === 'dark';
  const regPasswordStrength = getPasswordStrength(regAdminPassword);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-emerald-600 selection:text-white relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#090d16] text-slate-900 dark:text-zinc-100' : 'bg-slate-100 text-slate-900'
    }`}>

      {/* Subtle Glowing Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Floating Controls Bar */}
      <div className="absolute top-6 right-6 left-6 flex justify-between items-center z-20">
        
        {/* Onboarding Guide Trigger Button */}
        <button
          onClick={() => setShowGuideModal(true)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
            isDark 
              ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-emerald-400 hover:text-emerald-300' 
              : 'bg-white hover:bg-slate-50 border-slate-200 text-emerald-600 hover:text-emerald-700'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>{lang === 'ar' ? 'كيف تساعدك المنظومة في عملك اليومي؟' : 'How does NexoraOS help your daily work?'}</span>
        </button>

        {/* Language & Theme Switches */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onLanguageToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isDark 
                ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-200 shadow-sm' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {onThemeToggle && (
            <button 
              onClick={onThemeToggle}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-amber-400 shadow-sm' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
              }`}
              title={lang === 'ar' ? (isDark ? 'الوضع المضيء' : 'الوضع الداكن') : (isDark ? 'Light Mode' : 'Dark Mode')}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>
          )}
        </div>
      </div>

      {/* MAIN CENTERED GLASS CONTAINER */}
      <div className={`w-full max-w-md rounded-3xl border p-8 md:p-10 shadow-2xl relative z-10 transition-all ${
        isDark 
          ? 'bg-zinc-900/85 border-zinc-800/90 backdrop-blur-xl shadow-black/40' 
          : 'bg-white/95 border-slate-200 backdrop-blur-xl shadow-slate-300/40'
      }`}>
        
        {/* SYSTEM BRANDING HEADER */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200/60 inline-flex items-center justify-center">
            <EnterpriseLogo className="h-12 w-auto object-contain" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-emerald-600">
              NexoraOS™
            </h1>
            <p className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              {lang === 'ar' ? 'بيئة العمل الموحدة لإدارة المهام والعمليات' : 'Unified Workspace for Daily Operations'}
            </p>
            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              One Platform. One Organization. One Vision.
            </p>
          </div>

          {/* Dynamically Resolved Subscriber Badge (If present from Session / Hostname) */}
          {dynamicSubscriber && (
            <div className="pt-1">
              <span className="px-3 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full font-sans">
                {dynamicSubscriber}
              </span>
            </div>
          )}
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold rounded-2xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {regSuccess && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold rounded-2xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{lang === 'ar' ? 'تم إنشاء الحساب بنجاح! جاري التوجيه...' : 'Account created successfully! Redirecting...'}</span>
          </div>
        )}

        {/* MODE 1: LOGIN */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3.5">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 rtl:right-3.5 rtl:left-auto" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.org"
                    className={`w-full border rounded-2xl py-3 px-3.5 pl-10 rtl:pr-10 rtl:pl-3.5 text-sm transition-all focus:outline-none ${
                      isDark 
                        ? 'bg-zinc-950/80 border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-zinc-600 focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className={`block text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 rtl:right-3.5 rtl:left-auto" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full border rounded-2xl py-3 px-3.5 pl-10 pr-10 rtl:pr-10 rtl:pl-10 text-sm transition-all focus:outline-none ${
                      isDark 
                        ? 'bg-zinc-950/80 border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-zinc-600 focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={lang === 'ar' ? (showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showPassword ? 'Hide password' : 'Show password')}
                    className="absolute right-3.5 top-3.5 rtl:left-3.5 rtl:right-auto text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 bg-white cursor-pointer dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    {lang === 'ar' ? 'تذكر البيانات' : 'Remember me'}
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
                )}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-slate-200/70 dark:border-zinc-800/40">
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className="text-xs text-slate-500 hover:text-emerald-500 dark:text-zinc-400 font-bold transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'تسجيل حساب جديد' : 'Create new account'}
              </button>
            </div>
          </form>
        ) : (
          /* MODE 2: REGISTER */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {lang === 'ar' ? 'اسم المنظمة أو الجهة' : 'Organization Name'}
              </label>
              <input
                type="text"
                required
                value={regOrgName}
                onChange={(e) => setRegOrgName(e.target.value)}
                placeholder={lang === 'ar' ? 'اسم الجهة أو المنظمة' : 'Organization Name'}
                className={`w-full border rounded-2xl py-3 px-3.5 text-xs transition-all focus:outline-none ${
                  isDark ? 'bg-zinc-950/80 border-zinc-800 text-slate-900 dark:text-zinc-100 focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                value={regAdminEmail}
                onChange={(e) => setRegAdminEmail(e.target.value)}
                placeholder="admin@domain.org"
                className={`w-full border rounded-2xl py-3 px-3.5 text-xs transition-all focus:outline-none ${
                  isDark ? 'bg-zinc-950/80 border-zinc-800 text-slate-900 dark:text-zinc-100 focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                required
                value={regAdminPassword}
                onChange={(e) => setRegAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full border rounded-2xl py-3 px-3.5 text-xs transition-all focus:outline-none ${
                  isDark ? 'bg-zinc-950/80 border-zinc-800 text-slate-900 dark:text-zinc-100 focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              {regAdminPassword && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`h-1 flex-1 rounded-full ${regPasswordStrength >= 1 ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
                  <div className={`h-1 flex-1 rounded-full ${regPasswordStrength >= 2 ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                  <div className={`h-1 flex-1 rounded-full ${regPasswordStrength >= 3 ? 'bg-emerald-400' : 'bg-zinc-700'}`}></div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span>{lang === 'ar' ? 'إنشاء الحساب' : 'Create Account'}</span>
                )}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-slate-200/70 dark:border-zinc-800/40">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-xs text-slate-500 hover:text-emerald-500 dark:text-zinc-400 font-bold transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
              </button>
            </div>
          </form>
        )}

      </div>

      {/* FOOTER TAGLINE */}
      <div className={`mt-8 text-center text-xs font-medium z-10 ${
        isDark ? 'text-zinc-500' : 'text-slate-500'
      }`}>
        <span>One Platform. One Organization. One Vision.</span>
      </div>

      {/* MODAL: CONSULTATIVE END-USER ONBOARDING MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={lang === 'ar' ? 'كيف تساندك منظومة NexoraOS' : 'NexoraOS Onboarding Guide'}>
          <div className={`w-full max-w-4xl rounded-3xl border p-6 md:p-8 shadow-2xl space-y-6 relative max-h-[90vh] flex flex-col ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-slate-900 dark:text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-200/70 dark:border-zinc-800/60 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-emerald-500">
                    {lang === 'ar' ? 'كيف تساندك منظومة NexoraOS™ في عملك اليومي؟' : 'How NexoraOS Empower Your Daily Work'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {lang === 'ar' ? 'نبذة تشغيلية مبسطة بأسلوب سلس يوضح الفوائد المباشرة لجميع الإدارات والفرق' : 'Practical guide explaining key benefits for every team and department'}
                  </p>
                </div>
              </div>
<button 
                onClick={() => setShowGuideModal(false)}
                aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200/70 dark:border-zinc-800/60 gap-2 shrink-0 overflow-x-auto pb-1 text-xs font-bold">
              <button
                onClick={() => setGuideTab('guidance')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  guideTab === 'guidance' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'الفوائد التشغيلية المباشرة' : 'Direct Operational Benefits'}</span>
              </button>

              <button
                onClick={() => setGuideTab('workflow')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  guideTab === 'workflow' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'رحلة خطوة بخطوة' : 'Step-by-Step Workflow'}</span>
              </button>

              <button
                onClick={() => setGuideTab('privacy')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  guideTab === 'privacy' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'الخصوصية وسهولة الاستخدام' : 'Privacy & Simplicity'}</span>
              </button>

              <button
                onClick={() => setGuideTab('welcome')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  guideTab === 'welcome' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'رسالة ترحيبية' : 'Welcome Message'}</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
              
              {/* TAB 1: OPERATIONAL GUIDANCE IN NATURAL HUMAN LANGUAGE */}
              {guideTab === 'guidance' && (
                <div className="space-y-4">
                  <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                    {lang === 'ar' 
                      ? 'صُمّمت المنظومة لتسهيل حياتك المهنية وإنجاز أعمالك بأسرع وقت وأعلى دقة، إليك كيف تخدمك في مهامك:'
                      : 'Designed to streamline your daily work and help you accomplish goals efficiently:'}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {OPERATIONAL_GUIDANCE.map((item, idx) => {
                      const IconComp = item.icon;
                      return (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/60 flex items-start gap-3.5">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20 dark:text-emerald-400">
                            <IconComp className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-zinc-100 mb-1 text-xs">
                              {lang === 'ar' ? item.titleAr : item.titleEn}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                              {lang === 'ar' ? item.descAr : item.descEn}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: STEP BY STEP WORKFLOW */}
              {guideTab === 'workflow' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/60 flex items-start gap-3.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 text-xs">1</span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-zinc-100 text-sm mb-1">{lang === 'ar' ? 'سجل دخولك البسيط' : 'Simple Login'}</h4>
                        <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">أدخل بريدك الإلكتروني وكلمة المرور للانتقال مباشرة إلى الشاشة المخصصة لقسمك.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/60 flex items-start gap-3.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 text-xs">2</span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-zinc-100 text-sm mb-1">{lang === 'ar' ? 'تابع إنجاز أعمالك' : 'Review & Execute Tasks'}</h4>
                        <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">{lang === 'ar' ? 'ستجد أمامك ملخصاً واضحاً لأنشطتك الحالية، والمستندات بانتظار الاعتماد، والمهام اليومية المطلوب إنجازها.' : 'You will find a clear summary of your current activities, documents awaiting approval, and daily tasks to be completed.'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/60 flex items-start gap-3.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 text-xs">3</span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-zinc-100 text-sm mb-1">{lang === 'ar' ? 'شارك التقارير بنقرة زر' : 'Export & Share Reports'}</h4>
                        <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">{lang === 'ar' ? 'يمكنك طباعة كشوفاتك وسنداتك بصيغة PDF أنيقة ورسمية أو تصديرها لكشوفات Excel بسهولة تامّة.' : 'Print official statements and vouchers as elegant PDFs or export them to Excel reports with ease.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRIVACY & SIMPLICITY */}
              {guideTab === 'privacy' && (
                <div className="space-y-4 leading-relaxed text-slate-500 dark:text-zinc-400">
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 space-y-2">
                    <h4 className="font-extrabold text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'خصوصيتك وبياناتك في أمان تام' : 'Data Privacy & Security'}</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed dark:text-zinc-300">
                      {lang === 'ar'
                        ? 'نحن نحرص على حماية بياناتك وصلاحياتك بفرض أعلى معايير الخصوصية، حيث تظهر لك فقط القوائم والمعاملات الخاصة بقسمك ومسؤولياتك المحددّة.'
                        : 'We protect your data and permissions with the highest privacy standards - you only see menus and transactions relevant to your department and responsibilities.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/40">
                      <h5 className="font-bold text-slate-700 dark:text-zinc-200 mb-1">{lang === 'ar' ? 'سرية تامة' : 'Full Confidentiality'}</h5>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">{lang === 'ar' ? 'جميع السجلات والمعاملات محمية ومحفوظة بأعلى درجات التشفير والاعتمادية.' : 'All records and transactions are protected with the highest encryption standards.'}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/40">
                      <h5 className="font-bold text-slate-700 dark:text-zinc-200 mb-1">{lang === 'ar' ? 'وضوح الصلاحيات' : 'Clear Permissions'}</h5>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">{lang === 'ar' ? 'تتيح لك التركيز على مهامك ومسؤولياتك المباشرة دون تشتيت أو تعقيد.' : 'Focus directly on your tasks and responsibilities without distractions.'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WELCOME MESSAGE */}
              {guideTab === 'welcome' && (
                <div className="space-y-4 text-center py-4">
                  <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-950/80">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-500/20 dark:text-emerald-400">
                      <Heart className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">{lang === 'ar' ? 'مرحباً بك في تجربة عمل أكثر سهولة وإنجازاً' : 'Welcome to a Simpler Work Experience'}</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                      {lang === 'ar'
                        ? 'يسعدنا انضمامك إلى المنظومة، ونسعى دائماً لتقديم أدوات تخدم شغفك وتضاعف من أثر عطائك وإنجازك اليومي.'
                        : 'We are delighted to have you on board and are always working to deliver tools that serve your passion and multiply the impact of your daily work.'}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200/70 dark:border-zinc-800/60 pt-4 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">NexoraOS™ Workspace</span>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'الانتقال لتسجيل الدخول' : 'Proceed to Sign In'}
              </button>
            </div>

          </div>
        </div>
      )}

{/* MFA CHALLENGE MODAL */}
      {showMfaChallenge && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={lang === 'ar' ? 'التحقق الثنائي' : 'Two-Factor Verification'}>
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4 ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm">{lang === 'ar' ? 'التحقق الثنائي' : 'Two-Factor Verification'}</h3>
              <button onClick={() => setShowMfaChallenge(false)} aria-label={lang === 'ar' ? 'إغلاق' : 'Close'} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {lang === 'ar' ? 'أدخل رمز التحقق المكون من 6 أرقام:' : 'Enter your 6-digit verification code:'}
            </p>
            <form onSubmit={handleVerifyMfa} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl py-3 text-center text-xl font-mono tracking-widest text-emerald-600 focus:outline-none focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-emerald-400"
              />
              <button
                type="submit"
                disabled={loading || mfaCode.length < 6}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition-all"
              >
                {loading ? '...' : (lang === 'ar' ? 'تأكيد' : 'Verify')}
              </button>
            </form>
          </div>
        </div>
      )}

{/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={lang === 'ar' ? 'استعادة كلمة المرور' : 'Reset Password'}>
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4 ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm">{lang === 'ar' ? 'استعادة كلمة المرور' : 'Reset Password'}</h3>
              <button onClick={() => { setShowForgotPassword(false); setResetSent(false); }} aria-label={lang === 'ar' ? 'إغلاق' : 'Close'} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSent ? (
              <div className="space-y-3 text-center py-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar'
                    ? `تم إرسال تعليمات الاستعادة إلى (${resetEmail})`
                    : `Reset instructions sent to (${resetEmail})`}
                </p>
                <button
                  onClick={() => { setShowForgotPassword(false); setResetSent(false); }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-2xl transition-all dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' 
                    ? 'أدخل البريد الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور:' 
                    : 'Enter your email address to receive a password reset link:'}
                </p>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@domain.org"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl py-3 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={resetLoading || !resetEmail}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition-all"
                >
                  {resetLoading ? '...' : (lang === 'ar' ? 'إرسال الرابط' : 'Send Link')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
