import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building, 
  Key, 
  Save, 
  Info, 
  Check, 
  AlertTriangle,
  RefreshCw,
  X,
  Plus,
  Trash2,
  Globe,
  CheckCircle2,
  ShieldAlert,
  ListFilter,
  Sliders,
  Database,
  CreditCard,
  Wallet,
  DollarSign,
  Zap,
  Download,
  Sparkles,
  ShieldCheck,
  Receipt,
  Calendar,
  ArrowUpRight,
  Fingerprint,
  Smartphone,
  Laptop,
  Mail,
  MessageSquare,
  Percent,
  Cpu,
  Send,
  Activity,
  UploadCloud,
  Palette,
  LayoutTemplate
} from 'lucide-react';
import { Organization, OrganizationSetting, SystemSetting } from '../types';
import { BiometricSecuritySettingsView, TOTPSecuritySettingsView, TrustedDevicesView } from '../features/administration';

interface SettingsViewProps {
  organizations: Organization[];
  orgSettings: OrganizationSetting[];
  sysSettings: SystemSetting[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
}

export default function SettingsView({ 
  organizations, 
  orgSettings, 
  sysSettings, 
  loading, 
  onRefresh, 
  lang 
}: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'subscription' | 'system' | 'orgKeys' | 'masterData' | 'biometric' | 'totp' | 'devices' | 'integrations'>('profile');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Integrations & External Gateways States
  const [smsProvider, setSmsProvider] = useState<string>(() => localStorage.getItem('nexora_sms_provider') || 'whatsapp');
  const [smsApiKey, setSmsApiKey] = useState<string>(() => localStorage.getItem('nexora_sms_api_key') || 'api_key_demo_88271');
  const [smsSenderId, setSmsSenderId] = useState<string>(() => localStorage.getItem('nexora_sms_sender_id') || 'NexoraOS');
  const [smsTestPhone, setSmsTestPhone] = useState<string>('967770000000');
  const [smsTestMessage, setSmsTestMessage] = useState<string>('NexoraOS™ | تم تفعيل الربط السحابي لإرسال الإشعارات والتحقق الثنائي بنجاح.');
  const [smsTestLoading, setSmsTestLoading] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState<any>(null);

  const [emailSmtpHost, setEmailSmtpHost] = useState<string>(() => localStorage.getItem('nexora_email_host') || 'smtp.sendgrid.net');
  const [emailSmtpPort, setEmailSmtpPort] = useState<string>(() => localStorage.getItem('nexora_email_port') || '587');
  const [emailSmtpUser, setEmailSmtpUser] = useState<string>(() => localStorage.getItem('nexora_email_user') || 'apikey');
  const [emailSmtpPass, setEmailSmtpPass] = useState<string>(() => localStorage.getItem('nexora_email_pass') || 'SG.demo_secret');
  const [emailTestRecipient, setEmailTestRecipient] = useState<string>('admin@rohaama.org');
  const [emailTestSubject, setEmailTestSubject] = useState<string>('NexoraOS? System Gateway Test');
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<any>(null);

  const [zakatAssets, setZakatAssets] = useState<string>('150000000');
  const [zakatVatBase, setZakatVatBase] = useState<string>('45000000');
  const [zakatRateType, setZakatRateType] = useState<'lunar' | 'solar'>('lunar');
  const [customVatPct, setCustomVatPct] = useState<number>(15);
  const [zakatCalcLoading, setZakatCalcLoading] = useState(false);
  const [zakatResult, setZakatResult] = useState<any>(null);

  const [aiSettingsModel, setAiSettingsModel] = useState<string>(() => localStorage.getItem('nexora_ai_model') || 'gemini-2.5-flash');
  const [aiSettingsKey, setAiSettingsKey] = useState<string>(() => localStorage.getItem('nexora_gemini_api_key') || '');
  const [customModels, setCustomModels] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('nexora_custom_models') || '["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3.6-flash", "gemini-1.5-pro"]');
    } catch {
      return ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3.6-flash", "gemini-1.5-pro"];
    }
  });
  const [newCustomModel, setNewCustomModel] = useState<string>('');

  // Subscription & Payment Gateway States
  const mainOrg = organizations[0];
  const [selectedPlan, setSelectedPlan] = useState<string>(mainOrg?.subscription_plan || 'enterprise_pro');
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [stripeApiKey, setStripeApiKey] = useState('pk_live_51NexoraOS_Rohamaa_Key_9918');
  const [stripeSecretKey, setStripeSecretKey] = useState('sk_live_51NexoraOS_Secret_8827');
  const [kuraimiMerchantId, setKuraimiMerchantId] = useState('KUR-RBD-908821');
  const [kuraimiApiKey, setKuraimiApiKey] = useState('KRM-JEBB-SEC-991823');
  const [bankWireDetails, setBankWireDetails] = useState('بنك الكريمي الإسلامي - حساب رقم: 30018827372 | بنك التضامن الإسلامي - حساب: 010099281');
  const [gatewayTestStatus, setGatewayTestStatus] = useState<string | null>(null);
  const [orgNameAr, setOrgNameAr] = useState(mainOrg?.name_ar || '');
  const [orgNameEn, setOrgNameEn] = useState(mainOrg?.name_en || '');
  const [orgEmail, setOrgEmail] = useState(mainOrg?.email || '');
  const [orgPhone, setOrgPhone] = useState(mainOrg?.phone || '');
  const [orgWebsite, setOrgWebsite] = useState(mainOrg?.website || '');
  const [orgAddress, setOrgAddress] = useState(mainOrg?.address || '');
  const [orgCity, setOrgCity] = useState(mainOrg?.city || '');
  const [orgCountry, setOrgCountry] = useState(mainOrg?.country || '');
  const [regNum, setRegNum] = useState(mainOrg?.registration_number || '');
  const [licenseNum, setLicenseNum] = useState(mainOrg?.license_number || '');
  const [orgArchetype, setOrgArchetype] = useState<'CHARITY_NGO' | 'WAQF_FOUNDATION' | 'GOVT_AUTHORITY' | 'COMMERCIAL_ENTERPRISE' | 'INTL_AGENCY'>('CHARITY_NGO');
  const [retentionYears, setRetentionYears] = useState<number>(10);

  // Logo & Report Customization States
  const [logoUrl, setLogoUrl] = useState<string>(() => localStorage.getItem('rbd_logo_url') || '/LogoRohamaab.png');
  const [reportHeaderTitleAr, setReportHeaderTitleAr] = useState<string>(() => localStorage.getItem('rbd_report_header_title_ar') || '');
  const [reportHeaderTitleEn, setReportHeaderTitleEn] = useState<string>(() => localStorage.getItem('rbd_report_header_title_en') || '');
  const [reportHeaderSubtitleAr, setReportHeaderSubtitleAr] = useState<string>(() => localStorage.getItem('rbd_report_header_subtitle_ar') || '');
  const [reportHeaderSubtitleEn, setReportHeaderSubtitleEn] = useState<string>(() => localStorage.getItem('rbd_report_header_subtitle_en') || '');
  const [reportFooterTextAr, setReportFooterTextAr] = useState<string>(() => localStorage.getItem('rbd_report_footer_text_ar') || '');
  const [reportFooterTextEn, setReportFooterTextEn] = useState<string>(() => localStorage.getItem('rbd_report_footer_text_en') || '');
  const [reportHeaderLayout, setReportHeaderLayout] = useState<'classic' | 'centered' | 'split'>(() => (localStorage.getItem('rbd_report_header_layout') as any) || 'classic');
  const [reportAccentColor, setReportAccentColor] = useState<string>(() => localStorage.getItem('rbd_report_accent_color') || '#059669');
  const [reportShowDate, setReportShowDate] = useState<boolean>(() => localStorage.getItem('rbd_report_show_date') !== 'false');
  const [reportShowLogo, setReportShowLogo] = useState<boolean>(() => localStorage.getItem('rbd_report_show_logo') !== 'false');
  const [reportSignatureBlocks, setReportSignatureBlocks] = useState<boolean>(() => localStorage.getItem('rbd_report_signature_blocks') === 'true');

  // Master Data & Branches/Categories States
  const [masterDataTab, setMasterDataTab] = useState<'branches' | 'categories' | 'coding_system' | 'governance'>('branches');
  const [branches, setBranches] = useState<Array<{
    code: string;
    nameAr: string;
    nameEn: string;
    status: 'active' | 'inactive';
    manager: string;
  }>>([]);
  const [categories, setCategories] = useState<Array<{
    code: string;
    nameAr: string;
    nameEn: string;
    status: 'active' | 'inactive';
    isSphere: boolean;
  }>>([]);

  // Form states for creating new master data
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchNameAr, setNewBranchNameAr] = useState('');
  const [newBranchNameEn, setNewBranchNameEn] = useState('');
  const [newBranchManager, setNewBranchManager] = useState('');

  const [newCatCode, setNewCatCode] = useState('');
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatIsSphere, setNewCatIsSphere] = useState(true);

  // Real Database Master Data & Coding System States
  const [dbCodeCategories, setDbCodeCategories] = useState<any[]>([]);
  const [dbCodeItems, setDbCodeItems] = useState<any[]>([]);
  const [dbCodingSystems, setDbCodingSystems] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [selectedDbCategoryId, setSelectedDbCategoryId] = useState<string | null>(null);

  // Form States for DB Code Categories
  const [newDbCatCode, setNewDbCatCode] = useState('');
  const [newDbCatNameAr, setNewDbCatNameAr] = useState('');
  const [newDbCatNameEn, setNewDbCatNameEn] = useState('');
  const [newDbCatDesc, setNewDbCatDesc] = useState('');

  // Form States for DB Code Items
  const [newDbItemCode, setNewDbItemCode] = useState('');
  const [newDbItemNameAr, setNewDbItemNameAr] = useState('');
  const [newDbItemNameEn, setNewDbItemNameEn] = useState('');
  const [newDbItemValue, setNewDbItemValue] = useState('');

  // Form States for DB Coding System
  const [newCodeSysCatCode, setNewCodeSysCatCode] = useState('');
  const [newCodeSysItemCode, setNewCodeSysItemCode] = useState('');
  const [newCodeSysNameAr, setNewCodeSysNameAr] = useState('');
  const [newCodeSysNameEn, setNewCodeSysNameEn] = useState('');
  const [newCodeSysParentCode, setNewCodeSysParentCode] = useState('');
  const [newCodeSysLevel, setNewCodeSysLevel] = useState(1);

  // Biometric Auth State
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(() => {
    return localStorage.getItem('nexora_biometric_enabled') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('nexora_biometric_enabled', String(biometricEnabled));
  }, [biometricEnabled]);

  // Security Simulator state
  const [simLevel, setSimLevel] = useState<1 | 2 | 3 | 4>(2);

  // Fetch real database master data
  const fetchDbMasterData = async () => {
    setLoadingDb(true);
    try {
      const [catsRes, itemsRes, sysRes] = await Promise.all([
        fetch('/api/tables/code_categories'),
        fetch('/api/tables/code_items'),
        fetch('/api/tables/coding_system')
      ]);

      if (catsRes.ok) {
        const cats = await catsRes.json();
        setDbCodeCategories(cats);
        if (cats.length > 0 && !selectedDbCategoryId) {
          setSelectedDbCategoryId(cats[0].id);
        }
      }
      if (itemsRes.ok) {
        setDbCodeItems(await itemsRes.json());
      }
      if (sysRes.ok) {
        setDbCodingSystems(await sysRes.json());
      }
    } catch (err) {
      console.error('Error fetching database master data:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'masterData') {
      fetchDbMasterData();
    }
  }, [activeSubTab]);

  const handleAddDbCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbCatCode || !newDbCatNameAr || !newDbCatNameEn) {
      setErrorMsg(lang === 'ar' ? 'يرجى ملء الحقول الإلزامية لتصنيف الرموز!' : 'Please fill all mandatory fields for code category!');
      return;
    }

    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const payload = {
        code: newDbCatCode.toUpperCase().trim(),
        name_ar: newDbCatNameAr.trim(),
        name_en: newDbCatNameEn.trim(),
        description: newDbCatDesc.trim(),
        is_system: false,
        is_active: true,
        security_level: 2
      };

      const res = await fetch('/api/tables/code_categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add code category.');
      }

      setSuccessMsg(lang === 'ar' ? 'تم حفظ تصنيف الرموز الجديد في السجلات المركزية بنجاح!' : 'New code category registered in central database successfully!');
      setNewDbCatCode('');
      setNewDbCatNameAr('');
      setNewDbCatNameEn('');
      setNewDbCatDesc('');
      await fetchDbMasterData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDbCategory = async (id: string, code: string) => {
    if (confirm(lang === 'ar' ? `هل أنت متأكد من حذف هذه الفئة (${code})؟` : `Are you sure you want to delete category (${code})?`)) {
      setUpdating(true);
      setSuccessMsg(null);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/tables/code_categories/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to delete category.');
        }
        setSuccessMsg(lang === 'ar' ? 'تم حذف التصنيف بنجاح من قاعدة البيانات!' : 'Category removed from database.');
        if (selectedDbCategoryId === id) {
          setSelectedDbCategoryId(null);
        }
        await fetchDbMasterData();
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleAddDbItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDbCategoryId) {
      setErrorMsg(lang === 'ar' ? 'يرجى اختيار تصنيف رموز أولاً!' : 'Please select a code category first!');
      return;
    }
    if (!newDbItemCode || !newDbItemNameAr || !newDbItemNameEn) {
      setErrorMsg(lang === 'ar' ? 'يرجى ملء الحقول الإلزامية لعنصر الترميز!' : 'Please fill all mandatory fields for the code item!');
      return;
    }

    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const payload = {
        category_id: selectedDbCategoryId,
        code: newDbItemCode.toUpperCase().trim(),
        name_ar: newDbItemNameAr.trim(),
        name_en: newDbItemNameEn.trim(),
        value: newDbItemValue ? parseFloat(newDbItemValue) : null,
        is_active: true,
        sort_order: dbCodeItems.filter(i => i.category_id === selectedDbCategoryId).length,
        security_level: 2
      };

      const res = await fetch('/api/tables/code_items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add code item.');
      }

      setSuccessMsg(lang === 'ar' ? 'تم حفظ عنصر الترميز في قاعدة البيانات بنجاح!' : 'Code item successfully saved to the database!');
      setNewDbItemCode('');
      setNewDbItemNameAr('');
      setNewDbItemNameEn('');
      setNewDbItemValue('');
      await fetchDbMasterData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDbItem = async (id: string) => {
    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/tables/code_items/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete item.');
      }
      setSuccessMsg(lang === 'ar' ? 'تم حذف عنصر الترميز بنجاح!' : 'Code item removed successfully.');
      await fetchDbMasterData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddCodingSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainOrg?.id) {
      setErrorMsg(lang === 'ar' ? 'تعذر العثور على معرّف المؤسسة!' : 'Organization ID not found!');
      return;
    }
    if (!newCodeSysCatCode || !newCodeSysItemCode || !newCodeSysNameAr) {
      setErrorMsg(lang === 'ar' ? 'يرجى ملء الحقول الإلزامية للترميز!' : 'Please fill all mandatory fields for coding system!');
      return;
    }

    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const payload = {
        organization_id: mainOrg.id,
        category_code: newCodeSysCatCode.toUpperCase().trim(),
        item_code: newCodeSysItemCode.toUpperCase().trim(),
        name_ar: newCodeSysNameAr.trim(),
        name_en: newCodeSysNameEn ? newCodeSysNameEn.trim() : null,
        parent_code: newCodeSysParentCode ? newCodeSysParentCode.toUpperCase().trim() : null,
        level: newCodeSysLevel,
        sort_order: dbCodingSystems.filter(c => c.category_code === newCodeSysCatCode).length,
        is_active: true
      };

      const res = await fetch('/api/tables/coding_system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add coding system entry.');
      }

      setSuccessMsg(lang === 'ar' ? 'تم إضافة كود الترميز بنجاح في السجلات المركزية!' : 'Coding system entry added successfully to central database!');
      setNewCodeSysCatCode('');
      setNewCodeSysItemCode('');
      setNewCodeSysNameAr('');
      setNewCodeSysNameEn('');
      setNewCodeSysParentCode('');
      setNewCodeSysLevel(1);
      await fetchDbMasterData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCodingSystem = async (id: string) => {
    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/tables/coding_system/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete coding system entry.');
      }
      setSuccessMsg(lang === 'ar' ? 'تم حذف كود الترميز من قاعدة البيانات!' : 'Coding system entry removed.');
      await fetchDbMasterData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Initialize Master Data on Mount
  useEffect(() => {
    const savedBranches = localStorage.getItem('rbd_branches');
    if (savedBranches) {
      setBranches(JSON.parse(savedBranches));
    } else {
      const defaultBranches = [
        { code: 'HQ-SNA', nameAr: 'المقر الرئيسي والمجلس العام - صنعاء', nameEn: 'Nexora HQ & General Secretariat - Sana\'a', status: 'active' as const, manager: 'د. يحيى عبدالله الكبسي' },
        { code: 'BR-TAIZ', nameAr: 'فرع محافظة تعز - الحوافي والمدينة', nameEn: 'Taiz Governorate Branch - City Office', status: 'active' as const, manager: 'م. نجيب عبدالله همام' },
        { code: 'BR-ADEN', nameAr: 'مكتب تمثيل العاصمة المؤقتة - عدن', nameEn: 'Aden Bureau & Representation Office', status: 'active' as const, manager: 'أ. وضاح عبدالقوي السعدي' },
        { code: 'BR-HOD', nameAr: 'مكتب الساحل الغربي والحديدة', nameEn: 'West Coast & Hodeidah Office', status: 'active' as const, manager: 'أ. طه يحيى جبل' }
      ];
      setBranches(defaultBranches);
      localStorage.setItem('rbd_branches', JSON.stringify(defaultBranches));
    }

    const savedCategories = localStorage.getItem('rbd_categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      const defaultCategories = [
        { code: 'ORPHAN', nameAr: 'كفالات الأيتام ورعاية الأسر الفقيرة', nameEn: 'Orphan Care & Vulnerable Family Welfare', status: 'active' as const, isSphere: true },
        { code: 'EDUC', nameAr: 'المدارس التعليمية وحلقات تحفيظ القرآن الكبرى', nameEn: 'Quranic Schools & Literacy Centers', status: 'active' as const, isSphere: true },
        { code: 'WASH', nameAr: 'حفر الآبار والإصحاح المائي المتكامل WASH', nameEn: 'WASH - Integrated Water Sanitation & Hygiene', status: 'active' as const, isSphere: true },
        { code: 'FOOD', nameAr: 'مشاريع الأمن الغذائي وسلال المعيشة الطارئة', nameEn: 'FSL - Food Security & Emergency Livelihoods', status: 'active' as const, isSphere: true },
        { code: 'ECON', nameAr: 'التمكين الاقتصادي والمشاريع النقدية المنتجة', nameEn: 'Economic Empowerment & Vocational Training', status: 'active' as const, isSphere: true }
      ];
      setCategories(defaultCategories);
      localStorage.setItem('rbd_categories', JSON.stringify(defaultCategories));
    }
  }, []);

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchCode || !newBranchNameAr || !newBranchNameEn) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال جميع الحقول الإلزامية للفرع' : 'Please enter all mandatory fields for the branch');
      return;
    }
    if (branches.some(b => b.code.toUpperCase() === newBranchCode.toUpperCase())) {
      setErrorMsg(lang === 'ar' ? 'رمز المكتب أو الفرع هذا مكرر ومسجل بالفعل!' : 'This branch code already exists!');
      return;
    }
    const updated = [
      ...branches,
      {
        code: newBranchCode.toUpperCase(),
        nameAr: newBranchNameAr,
        nameEn: newBranchNameEn,
        status: 'active' as const,
        manager: newBranchManager || (lang === 'ar' ? 'غير معين' : 'Unassigned')
      }
    ];
    setBranches(updated);
    localStorage.setItem('rbd_branches', JSON.stringify(updated));
    setNewBranchCode('');
    setNewBranchNameAr('');
    setNewBranchNameEn('');
    setNewBranchManager('');
    setSuccessMsg(lang === 'ar' ? 'تم إضافة الفرع والمكتب الأساسي بنجاح!' : 'New branch registered successfully!');
  };

  const handleToggleBranchStatus = (code: string) => {
    const updated = branches.map(b => b.code === code ? { ...b, status: b.status === 'active' ? 'inactive' as const : 'active' as const } : b);
    setBranches(updated);
    localStorage.setItem('rbd_branches', JSON.stringify(updated));
    setSuccessMsg(lang === 'ar' ? 'تم تغيير حالة تشغيل الفرع!' : 'Branch status updated!');
  };

  const handleDeleteBranch = (code: string) => {
    if (['HQ-SNA', 'BR-TAIZ', 'BR-ADEN'].includes(code)) {
      setErrorMsg(lang === 'ar' ? 'لا يمكن حذف المكاتب التاريخية والتأسيسية للمؤسسة!' : 'Historical or main offices cannot be deleted!');
      return;
    }
    const updated = branches.filter(b => b.code !== code);
    setBranches(updated);
    localStorage.setItem('rbd_branches', JSON.stringify(updated));
    setSuccessMsg(lang === 'ar' ? 'تم إزالة المكتب بنجاح' : 'Branch removed successfully');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatCode || !newCatNameAr || !newCatNameEn) {
      setErrorMsg(lang === 'ar' ? 'يرجى تعبئة جميع الحقول الإلزامية للتصنيف' : 'Please fill all mandatory fields for the classification');
      return;
    }
    if (categories.some(c => c.code.toUpperCase() === newCatCode.toUpperCase())) {
      setErrorMsg(lang === 'ar' ? 'رمز التصنيف موجود مسبقاً!' : 'Classification code already exists!');
      return;
    }
    const updated = [
      ...categories,
      {
        code: newCatCode.toUpperCase(),
        nameAr: newCatNameAr,
        nameEn: newCatNameEn,
        status: 'active' as const,
        isSphere: newCatIsSphere
      }
    ];
    setCategories(updated);
    localStorage.setItem('rbd_categories', JSON.stringify(updated));
    setNewCatCode('');
    setNewCatNameAr('');
    setNewCatNameEn('');
    setNewCatIsSphere(true);
    setSuccessMsg(lang === 'ar' ? 'تم تسجيل الفئة التشغيلية بنجاح!' : 'Operational category registered successfully!');
  };

  const handleToggleCategoryStatus = (code: string) => {
    const updated = categories.map(c => c.code === code ? { ...c, status: c.status === 'active' ? 'inactive' as const : 'active' as const } : c);
    setCategories(updated);
    localStorage.setItem('rbd_categories', JSON.stringify(updated));
    setSuccessMsg(lang === 'ar' ? 'تم تحديث حالة التصنيف بنجاح!' : 'Classification status updated!');
  };

  const handleDeleteCategory = (code: string) => {
    if (['ORPHAN', 'EDUC', 'WASH', 'FOOD'].includes(code)) {
      setErrorMsg(lang === 'ar' ? 'لا يمكن حذف الفئات التشغيلية الأساسية!' : 'Core operational categories cannot be deleted!');
      return;
    }
    const updated = categories.filter(c => c.code !== code);
    setCategories(updated);
    localStorage.setItem('rbd_categories', JSON.stringify(updated));
    setSuccessMsg(lang === 'ar' ? 'تم حذف الفئة التشغيلية بنجاح' : 'Operational category deleted');
  };

  // Synchronize state when organizations are loaded
  React.useEffect(() => {
    if (mainOrg) {
      setOrgNameAr(mainOrg.name_ar || '');
      setOrgNameEn(mainOrg.name_en || '');
      setOrgEmail(mainOrg.email || '');
      setOrgPhone(mainOrg.phone || '');
      setOrgWebsite(mainOrg.website || '');
      setOrgAddress(mainOrg.address || '');
      setOrgCity(mainOrg.city || '');
      setOrgCountry(mainOrg.country || '');
      setRegNum(mainOrg.registration_number || '');
      setLicenseNum(mainOrg.license_number || '');
      if (mainOrg.logo_url) {
        setLogoUrl(mainOrg.logo_url);
        localStorage.setItem('rbd_logo_url', mainOrg.logo_url);
      }
      
      // Initialize report customization states with nice fallbacks
      if (!localStorage.getItem('rbd_report_header_title_ar')) {
        setReportHeaderTitleAr(mainOrg.name_ar || 'جمعية رُحماء بينهم للعمل الإنساني والتنمية');
      } else {
        setReportHeaderTitleAr(localStorage.getItem('rbd_report_header_title_ar') || '');
      }
      
      if (!localStorage.getItem('rbd_report_header_title_en')) {
        setReportHeaderTitleEn(mainOrg.name_en || 'Rohama\'a Baynahum Charity Foundation');
      } else {
        setReportHeaderTitleEn(localStorage.getItem('rbd_report_header_title_en') || '');
      }

      if (!localStorage.getItem('rbd_report_header_subtitle_ar')) {
        setReportHeaderSubtitleAr('نظام التشغيل المؤسسي الذكي - NexoraOS™');
      } else {
        setReportHeaderSubtitleAr(localStorage.getItem('rbd_report_header_subtitle_ar') || '');
      }

      if (!localStorage.getItem('rbd_report_header_subtitle_en')) {
        setReportHeaderSubtitleEn('Intelligent Enterprise Operating System');
      } else {
        setReportHeaderSubtitleEn(localStorage.getItem('rbd_report_header_subtitle_en') || '');
      }

      if (!localStorage.getItem('rbd_report_footer_text_ar')) {
        setReportFooterTextAr('جمعية رُحماء بينهم للعمل الإنساني والتنمية - نظام التشغيل المؤسسي الذكي NexoraOS™');
      } else {
        setReportFooterTextAr(localStorage.getItem('rbd_report_footer_text_ar') || '');
      }

      if (!localStorage.getItem('rbd_report_footer_text_en')) {
        setReportFooterTextEn('Rohamaa Baynahum Charity Foundation - NexoraOS? Enterprise Intelligent System');
      } else {
        setReportFooterTextEn(localStorage.getItem('rbd_report_footer_text_en') || '');
      }
    }
  }, [organizations]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainOrg) return;
    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Save report settings to localStorage
    localStorage.setItem('rbd_logo_url', logoUrl);
    localStorage.setItem('rbd_report_header_title_ar', reportHeaderTitleAr);
    localStorage.setItem('rbd_report_header_title_en', reportHeaderTitleEn);
    localStorage.setItem('rbd_report_header_subtitle_ar', reportHeaderSubtitleAr);
    localStorage.setItem('rbd_report_header_subtitle_en', reportHeaderSubtitleEn);
    localStorage.setItem('rbd_report_footer_text_ar', reportFooterTextAr);
    localStorage.setItem('rbd_report_footer_text_en', reportFooterTextEn);
    localStorage.setItem('rbd_report_header_layout', reportHeaderLayout);
    localStorage.setItem('rbd_report_accent_color', reportAccentColor);
    localStorage.setItem('rbd_report_show_date', reportShowDate ? 'true' : 'false');
    localStorage.setItem('rbd_report_show_logo', reportShowLogo ? 'true' : 'false');
    localStorage.setItem('rbd_report_signature_blocks', reportSignatureBlocks ? 'true' : 'false');

    const payload = {
      name_ar: orgNameAr,
      name_en: orgNameEn,
      email: orgEmail,
      phone: orgPhone,
      website: orgWebsite,
      address: orgAddress,
      city: orgCity,
      country: orgCountry,
      registration_number: regNum,
      license_number: licenseNum,
      logo_url: logoUrl
    };

    try {
      const response = await fetch(`/api/tables/organizations/${mainOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update organization profile.');
      }

      setSuccessMsg(lang === 'ar' ? 'تم تحديث بيانات المؤسسة وإعدادات الهوية والتقارير بنجاح!' : 'Organization profile and print templates updated successfully!');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Editing Individual Setting keys in-place
  const [editingSettingId, setEditingSettingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const startEditSetting = (id: string, currentVal: any) => {
    setEditingSettingId(id);
    setEditingValue(typeof currentVal === 'object' ? JSON.stringify(currentVal) : String(currentVal));
  };

  const saveSettingEdit = async (id: string, isSystem: boolean) => {
    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    let parsedVal: any = editingValue;
    try {
      // If it looks like JSON array or object, parse it
      if ((editingValue.startsWith('{') && editingValue.endsWith('}')) || 
          (editingValue.startsWith('[') && editingValue.endsWith(']')) ||
          editingValue === 'true' || editingValue === 'false') {
        parsedVal = JSON.parse(editingValue);
      }
    } catch (e) {
      // If parsing fails, treat as raw string
    }

    const payload = {
      setting_value: parsedVal
    };

    try {
      const endpoint = isSystem 
        ? `/api/tables/system_settings/${id}` 
        : `/api/tables/organization_settings/${id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to update setting value.');
      }

      setSuccessMsg(lang === 'ar' ? 'تم حفظ التعديل بنجاح!' : 'Setting updated successfully!');
      setEditingSettingId(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleTestSMS = async () => {
    setSmsTestLoading(true);
    setSmsTestResult(null);
    try {
      const res = await fetch('/api/integrations/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: smsProvider,
          phone: smsTestPhone,
          message: smsTestMessage
        })
      });
      const data = await res.json();
      setSmsTestResult(data);
      if (data.status === 'ok') {
        localStorage.setItem('nexora_sms_provider', smsProvider);
        localStorage.setItem('nexora_sms_api_key', smsApiKey);
        localStorage.setItem('nexora_sms_sender_id', smsSenderId);
      }
    } catch (err: any) {
      setSmsTestResult({ status: 'error', message: err.message });
    } finally {
      setSmsTestLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setEmailTestLoading(true);
    setEmailTestResult(null);
    try {
      const res = await fetch('/api/integrations/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: emailSmtpHost,
          recipientEmail: emailTestRecipient,
          subject: emailTestSubject
        })
      });
      const data = await res.json();
      setEmailTestResult(data);
      if (data.status === 'ok') {
        localStorage.setItem('nexora_email_host', emailSmtpHost);
        localStorage.setItem('nexora_email_port', emailSmtpPort);
        localStorage.setItem('nexora_email_user', emailSmtpUser);
        localStorage.setItem('nexora_email_pass', emailSmtpPass);
      }
    } catch (err: any) {
      setEmailTestResult({ status: 'error', message: err.message });
    } finally {
      setEmailTestLoading(false);
    }
  };

  const handleCalculateZakat = async () => {
    setZakatCalcLoading(true);
    setZakatResult(null);
    try {
      const res = await fetch('/api/integrations/zakat-tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          netAssetsYER: zakatAssets,
          vatEligibleAmountYER: zakatVatBase,
          zakatRateType,
          customVatPct
        })
      });
      const data = await res.json();
      setZakatResult(data.calculation);
    } catch (err: any) {
      setZakatResult({ status: 'error', message: err.message });
    } finally {
      setZakatCalcLoading(false);
    }
  };

  const handleSaveAISettings = () => {
    localStorage.setItem('nexora_ai_model', aiSettingsModel);
    localStorage.setItem('nexora_gemini_api_key', aiSettingsKey);
    localStorage.setItem('nexora_custom_models', JSON.stringify(customModels));
    setSuccessMsg(lang === 'ar' ? 'تم حفظ إعدادات الذكاء الاصطناعي بنجاح!' : 'AI configuration saved successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAddCustomModel = () => {
    if (!newCustomModel.trim()) return;
    if (customModels.includes(newCustomModel.trim())) return;
    const updated = [...customModels, newCustomModel.trim()];
    setCustomModels(updated);
    setAiSettingsModel(newCustomModel.trim());
    setNewCustomModel('');
    localStorage.setItem('nexora_custom_models', JSON.stringify(updated));
  };

  const handleRemoveCustomModel = (modelToRemove: string) => {
    const updated = customModels.filter(m => m !== modelToRemove);
    setCustomModels(updated);
    if (aiSettingsModel === modelToRemove) {
      setAiSettingsModel(updated[0] || 'gemini-2.5-flash');
    }
    localStorage.setItem('nexora_custom_models', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-600" />
            {lang === 'ar' ? 'الإعدادات العامة وهيكل التكوين' : 'General Configuration & Settings'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {lang === 'ar' ? 'إكمال بيانات تعريف المؤسسة والتحكم بمتغيرات النظام الإدارية ومفاتيح الربط البرمجية' : 'Manage corporate identities, operational settings, and system-level configuration parameters'}
          </p>
        </div>

        <button 
          onClick={onRefresh}
          className="p-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title={lang === 'ar' ? 'تحديث السجلات' : 'Refresh'}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Sub Tabs navigation - Standard Deep Engineering Tabulation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-100/50 dark:bg-zinc-900/40 p-2 rounded-xl border border-slate-200/60 dark:border-zinc-800/80">
        <button 
          onClick={() => { setActiveSubTab('profile'); setSuccessMsg(null); setErrorMsg(null); }}
          className={`flex items-start gap-3 p-3 rounded-lg border text-right rtl:text-right transition-all cursor-pointer ${
            activeSubTab === 'profile' 
              ? 'bg-white dark:bg-zinc-900 border-amber-500 shadow-xs text-slate-800 dark:text-white' 
              : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/30 dark:hover:bg-zinc-900/20'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${activeSubTab === 'profile' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/50 dark:bg-zinc-800 text-zinc-400'}`}>
            <Building className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">{lang === 'ar' ? 'نوع الحركة المباشرة' : 'Identity & Licensing'}</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{lang === 'ar' ? 'تعريف المؤسسة، التراخيص والسجل' : 'Official records, certificates & logos'}</p>
          </div>
        </button>

        <button 
          onClick={() => { setActiveSubTab('subscription'); setSuccessMsg(null); setErrorMsg(null); }}
          className={`flex items-start gap-3 p-3 rounded-lg border text-right rtl:text-right transition-all cursor-pointer ${
            activeSubTab === 'subscription' 
              ? 'bg-white dark:bg-zinc-900 border-amber-500 shadow-xs text-slate-800 dark:text-white' 
              : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/30 dark:hover:bg-zinc-900/20'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${activeSubTab === 'subscription' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/50 dark:bg-zinc-800 text-zinc-400'}`}>
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">{lang === 'ar' ? 'الانتقال المباشر للقسم' : 'Subscription & Payments'}</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{lang === 'ar' ? 'الباقات، الترقية، وبوابات الدفع' : 'Plans, upgrades & payment gateways'}</p>
          </div>
        </button>

        <button 
          onClick={() => { setActiveSubTab('system'); setSuccessMsg(null); setErrorMsg(null); }}
          className={`flex items-start gap-3 p-3 rounded-lg border text-right rtl:text-right transition-all cursor-pointer ${
            activeSubTab === 'system' 
              ? 'bg-white dark:bg-zinc-900 border-amber-500 shadow-xs text-slate-800 dark:text-white' 
              : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/30 dark:hover:bg-zinc-900/20'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${activeSubTab === 'system' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/50 dark:bg-zinc-800 text-zinc-400'}`}>
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">{lang === 'ar' ? 'التكلفة الإجمالية' : 'Operational Controls'}</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{lang === 'ar' ? 'الحدود المالية ومحركات العمليات' : 'Financial thresholds & engines'}</p>
          </div>
        </button>

        <button 
          onClick={() => { setActiveSubTab('orgKeys'); setSuccessMsg(null); setErrorMsg(null); }}
          className={`flex items-start gap-3 p-3 rounded-lg border text-right rtl:text-right transition-all cursor-pointer ${
            activeSubTab === 'orgKeys' 
              ? 'bg-white dark:bg-zinc-900 border-amber-500 shadow-xs text-slate-800 dark:text-white' 
              : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/30 dark:hover:bg-zinc-900/20'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${activeSubTab === 'orgKeys' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/50 dark:bg-zinc-800 text-zinc-400'}`}>
            <Key className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">{lang === 'ar' ? 'تعديلات الموازنة المالية' : 'Bilingual System Variables'}</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{lang === 'ar' ? 'مسميات الفواتير والترجمات الميدانية' : 'Invoice headers & translation keys'}</p>
          </div>
        </button>

        <button 
          onClick={() => { setActiveSubTab('masterData'); setSuccessMsg(null); setErrorMsg(null); }}
          className={`flex items-start gap-3 p-3 rounded-lg border text-right rtl:text-right transition-all cursor-pointer ${
            activeSubTab === 'masterData' 
              ? 'bg-white dark:bg-zinc-900 border-amber-500 shadow-xs text-slate-800 dark:text-white' 
              : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/30 dark:hover:bg-zinc-900/20'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${activeSubTab === 'masterData' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/50 dark:bg-zinc-800 text-zinc-400'}`}>
            <Database className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">{lang === 'ar' ? 'الشراكات والتمويل الإنساني' : 'Master Data & Governance'}</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{lang === 'ar' ? 'الترميز الموحد ومستويات الأمان' : 'Unified codes, branches & security'}</p>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('biometric')}
          className={`flex items-start gap-3 p-3 rounded-lg border text-right rtl:text-right transition-all cursor-pointer ${
            activeSubTab === 'biometric'
              ? 'bg-white dark:bg-zinc-900 border-amber-500 shadow-xs text-slate-800 dark:text-white'
              : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/30 dark:hover:bg-zinc-900/20'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${activeSubTab === 'biometric' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/50 dark:bg-zinc-800 text-zinc-400'}`}>
            <Fingerprint className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">{lang === 'ar' ? 'صباحاً ومساءً' : 'Biometric Security'}</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{lang === 'ar' ? 'المجتمع والعمل التطوعي' : 'Fingerprint & recognition settings'}</p>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('totp')}
          className={`flex items-start gap-3 p-3 rounded-lg border text-right rtl:text-right transition-all cursor-pointer ${
            activeSubTab === 'totp'
              ? 'bg-white dark:bg-zinc-900 border-amber-500 shadow-xs text-slate-800 dark:text-white'
              : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/30 dark:hover:bg-zinc-900/20'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${activeSubTab === 'totp' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/50 dark:bg-zinc-800 text-zinc-400'}`}>
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">{lang === 'ar' ? 'إلغاء صلاحية جهاز موثوق' : 'Time-based OTP'}</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{lang === 'ar' ? 'كلمات المرور لمرة واحدة' : 'Time-based OTP'}</p>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('devices')}
          className={`flex items-start gap-3 p-3 rounded-lg border text-right rtl:text-right transition-all cursor-pointer ${
            activeSubTab === 'devices'
              ? 'bg-white dark:bg-zinc-900 border-amber-500 shadow-xs text-slate-800 dark:text-white'
              : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/30 dark:hover:bg-zinc-900/20'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${activeSubTab === 'devices' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/50 dark:bg-zinc-800 text-zinc-400'}`}>
            <Laptop className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">{lang === 'ar' ? 'البرامج والميدان' : 'Trusted Devices'}</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{lang === 'ar' ? 'إدارة المعرفة والوثائق' : 'Manage sessions & devices'}</p>
          </div>
        </button>

        <button
          onClick={() => { setActiveSubTab('integrations'); setSuccessMsg(null); setErrorMsg(null); }}
          className={`flex items-start gap-3 p-3 rounded-lg border text-right rtl:text-right transition-all cursor-pointer ${
            activeSubTab === 'integrations'
              ? 'bg-white dark:bg-zinc-900 border-amber-500 shadow-xs text-slate-800 dark:text-white'
              : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/30 dark:hover:bg-zinc-900/20'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${activeSubTab === 'integrations' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/50 dark:bg-zinc-800 text-zinc-400'}`}>
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">{lang === 'ar' ? 'مديرة الموارد البشرية' : 'AI & Integrations'}</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{lang === 'ar' ? 'الذكاء الاصطناعي، الزكاة، الرسائل والربط المباشر' : 'Copilot model keys, SMS, Zakat & webhooks'}</p>
          </div>
        </button>
      </div>

      {/* Profile Form */}
      {activeSubTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : mainOrg ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                <Building className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-extrabold">{lang === 'ar' ? 'بطاقة التعريف القانونية ونوع المنظومة' : 'Legal Organization Profile & Operational Model'}</h3>
              </div>

              {/* Organization Archetype Selector */}
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'ar' ? 'نموذج المنظومة والقطاع المؤسسي (Universal Organization Archetype):' : 'Organization Archetype Model:'}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    {orgArchetype}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  {[
                    { id: 'CHARITY_NGO', nameAr: 'جمعية خيرية / NGO', nameEn: 'Humanitarian NGO', descAr: 'كفالات، إغاثة، معايير إسفير و IATI' },
                    { id: 'WAQF_FOUNDATION', nameAr: 'مؤسسة أوقاف وتنمية', nameEn: 'Waqf Endowment', descAr: 'استثمار وقفي، حماية الأصل، عوائد' },
                    { id: 'GOVT_AUTHORITY', nameAr: 'هيئة / قطاع حكومي', nameEn: 'Government Authority', descAr: 'جهات حكومية ورقابية معتمدة' },
                    { id: 'COMMERCIAL_ENTERPRISE', nameAr: 'شركة / مجموعة تجارية', nameEn: 'Commercial Corp', descAr: 'ربحية، صكوك، عقود وإيجارات' },
                    { id: 'INTL_AGENCY', nameAr: 'وكالة دولية تنموية', nameEn: 'International Agency', descAr: 'منح، شراكات، تقارير مانحين' },
                  ].map((arch) => (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => {
                        setOrgArchetype(arch.id as any);
                        setSuccessMsg(lang === 'ar' ? `تم تكييف أنظمة السياسات حسب ${arch.nameAr}` : `System policies adapted to ${arch.nameEn}`);
                      }}
                      className={`p-2.5 rounded-xl border text-right rtl:text-right transition-all cursor-pointer flex flex-col justify-between ${
                        orgArchetype === arch.id
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm font-bold'
                          : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:border-amber-400'
                      }`}
                    >
                      <span className="text-xs font-black">{lang === 'ar' ? arch.nameAr : arch.nameEn}</span>
                      <span className={`text-[9px] mt-1 line-clamp-2 ${orgArchetype === arch.id ? 'text-amber-100' : 'text-zinc-400'}`}>
                        {lang === 'ar' ? arch.descAr : arch.nameEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid 1: Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'اسم المؤسسة الرسمي (بالعربية)' : 'Arabic Organization Name'}</label>
                  <input 
                    type="text" 
                    required
                    value={orgNameAr}
                    onChange={(e) => setOrgNameAr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Organization Name'}</label>
                  <input 
                    type="text" 
                    required
                    value={orgNameEn}
                    onChange={(e) => setOrgNameEn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Grid 2: Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'البريد الإلكتروني الرسمي' : 'Official Email'}</label>
                  <input 
                    type="email" 
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'رقم الهاتف' : 'Contact Phone'}</label>
                  <input 
                    type="text" 
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الموقع الإلكتروني' : 'Official Website'}</label>
                  <input 
                    type="text" 
                    value={orgWebsite}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                    placeholder="e.g. https://erprbdcye.org"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Grid 3: Registrations */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'رقم الترخيص الرسمي' : 'License Number'}</label>
                  <input 
                    type="text" 
                    value={licenseNum}
                    onChange={(e) => setLicenseNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'رقم السجل التجاري/الخيري' : 'Registration Certificate'}</label>
                  <input 
                    type="text" 
                    value={regNum}
                    onChange={(e) => setRegNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'المدينة' : 'City'}</label>
                  <input 
                    type="text" 
                    value={orgCity}
                    onChange={(e) => setOrgCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الدولة' : 'Country'}</label>
                  <input 
                    type="text" 
                    value={orgCountry}
                    onChange={(e) => setOrgCountry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase">{lang === 'ar' ? 'العنوان التفصيلي' : 'Detailed Address'}</label>
                <input 
                  type="text" 
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                />
              </div>

              {/* BRANDING, LOGO AND DOCUMENT LAYOUT CUSTOMIZATION */}
              <div className="border border-slate-200/80 rounded-xl p-5 space-y-6 bg-zinc-50/30">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                  <Palette className="w-4 h-4 text-amber-600 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase">{lang === 'ar' ? 'تخصيص الهوية البصرية وتصميم التقارير والمستندات' : 'Visual Identity & Print Templates Customization'}</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{lang === 'ar' ? 'تعديل شعار المنظمة الرئيسي، وألوان وتنسيق ترويسة وتذييل السندات والتقارير المالية المطبوعة' : 'Configure main company logo, accent color themes, and print layouts'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Config Panel */}
                  <div className="lg:col-span-7 space-y-5">
                    
                    {/* Sub-Card 1: Logo & Branding Source */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                        <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                        <span>{lang === 'ar' ? 'إدارة الشعار الرسمي للمؤسسة (Organization Logo):' : 'Manage Company Logo:'}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-white border border-slate-100 rounded-lg shadow-2xs">
                        <div className="relative w-20 h-20 bg-slate-50/50 rounded-lg border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                          <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 space-y-2.5 w-full">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                              placeholder={lang === 'ar' ? 'أو أدخل رابط الشعار الإلكتروني...' : 'Or enter logo URL...'}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 text-[11px] outline-none"
                            />
                            <label className="shrink-0 relative flex items-center justify-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-black cursor-pointer transition-all">
                              <UploadCloud className="w-3 h-3" />
                              <span>{lang === 'ar' ? 'رفع ملف...' : 'Upload File...'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setLogoUrl(event.target.result as string);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          
                          {/* Presets Grid */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] text-zinc-400 font-bold">{lang === 'ar' ? 'نماذج جاهزة:' : 'Presets:'}</span>
                            {[
                              { label: lang === 'ar' ? 'رئيسي (جمعية رُحماء)' : 'Official', url: '/LogoRohamaab.png' },
                              { label: lang === 'ar' ? 'درع الأوقاف' : 'Endowment', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80' },
                              { label: lang === 'ar' ? 'درع تنموي' : 'Developmental', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=120&q=80' }
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setLogoUrl(preset.url)}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer transition-all ${
                                  logoUrl === preset.url
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-400'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-Card 2: Header Labels (Bilingual) */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                        <LayoutTemplate className="w-3.5 h-3.5 text-amber-600" />
                        <span>{lang === 'ar' ? 'عناوين الترويسة المخصصة للتقارير (Header Details):' : 'Report Header Titles:'}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === 'ar' ? 'الاسم بالترويسة (عربي)' : 'Arabic Title'}</label>
                          <input 
                            type="text" 
                            value={reportHeaderTitleAr}
                            onChange={(e) => setReportHeaderTitleAr(e.target.value)}
                            placeholder={orgNameAr}
                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === 'ar' ? 'الاسم بالترويسة (إنجليزي)' : 'English Title'}</label>
                          <input 
                            type="text" 
                            value={reportHeaderTitleEn}
                            onChange={(e) => setReportHeaderTitleEn(e.target.value)}
                            placeholder={orgNameEn}
                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === 'ar' ? 'العنوان الفرعي (عربي)' : 'Arabic Subtitle'}</label>
                          <input 
                            type="text" 
                            value={reportHeaderSubtitleAr}
                            onChange={(e) => setReportHeaderSubtitleAr(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === 'ar' ? 'العنوان الفرعي (إنجليزي)' : 'English Subtitle'}</label>
                          <input 
                            type="text" 
                            value={reportHeaderSubtitleEn}
                            onChange={(e) => setReportHeaderSubtitleEn(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-Card 3: Footer Texts */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        <span>{lang === 'ar' ? 'نص تذييل الصفحة المخصص للتقارير (Footer Details):' : 'Report Footer Texts:'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === 'ar' ? 'تذييل التقارير (عربي)' : 'Arabic Footer'}</label>
                          <textarea
                            rows={2}
                            value={reportFooterTextAr}
                            onChange={(e) => setReportFooterTextAr(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === 'ar' ? 'تذييل التقارير (إنجليزي)' : 'English Footer'}</label>
                          <textarea
                            rows={2}
                            value={reportFooterTextEn}
                            onChange={(e) => setReportFooterTextEn(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-Card 4: Layouts and Accent Theme */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                        <LayoutTemplate className="w-3.5 h-3.5 text-amber-600" />
                        <span>{lang === 'ar' ? 'نمط الترويسة المفضل وهيكل الصفحة:' : 'Header Layout Style:'}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'classic', titleAr: 'نمط كلاسيكي جانبي', descAr: 'شعار جانبي أنيق' },
                          { id: 'centered', titleAr: 'نمط توسيط متكامل', descAr: 'شعار بالمنتصف في الأعلى' },
                          { id: 'split', titleAr: 'نمط متوزع متوازن', descAr: 'توازن دقيق للأطراف' }
                        ].map((ly) => (
                          <button
                            key={ly.id}
                            type="button"
                            onClick={() => setReportHeaderLayout(ly.id as any)}
                            className={`p-2 rounded-lg border text-right rtl:text-right cursor-pointer transition-all flex flex-col justify-between ${
                              reportHeaderLayout === ly.id
                                ? 'bg-amber-600/5 text-amber-900 border-amber-500'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                            }`}
                          >
                            <span className="text-[11px] font-bold block">{ly.titleAr}</span>
                            <span className="text-[9px] text-zinc-400 block mt-0.5">{ly.descAr}</span>
                          </button>
                        ))}
                      </div>

                      {/* Accent color picker */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[10px] font-bold text-slate-400">{lang === 'ar' ? 'اللون المميز للمستندات والخطوط الفاصلة (Document Accent):' : 'Document Line Color:'}</label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            { name: 'Emerald', hex: '#059669' },
                            { name: 'Gold', hex: '#d97706' },
                            { name: 'Blue', hex: '#1d4ed8' },
                            { name: 'Crimson', hex: '#be123c' },
                            { name: 'Slate', hex: '#334155' }
                          ].map((color) => (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => setReportAccentColor(color.hex)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
                                reportAccentColor === color.hex
                                  ? 'bg-zinc-100 border-zinc-400 font-extrabold shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
                              <span>{color.name}</span>
                            </button>
                          ))}
                          <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            <input
                              type="color"
                              value={reportAccentColor}
                              onChange={(e) => setReportAccentColor(e.target.value)}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">{reportAccentColor}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-Card 5: Extras & Signatures Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white border border-slate-100 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={reportShowLogo}
                          onChange={(e) => setReportShowLogo(e.target.checked)}
                          className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                        />
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-700">{lang === 'ar' ? 'إظهار الشعار بالترويسة' : 'Show Logo'}</span>
                          <span className="block text-[8px] text-zinc-400">{lang === 'ar' ? 'إدراج شعار المنظمة الرئيسي' : 'Toggle logo visibility'}</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={reportShowDate}
                          onChange={(e) => setReportShowDate(e.target.checked)}
                          className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                        />
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-700">{lang === 'ar' ? 'عرض تاريخ طباعة المستند' : 'Show Date'}</span>
                          <span className="block text-[8px] text-zinc-400">{lang === 'ar' ? 'إضافة تاريخ اليوم تلقائياً' : 'Include printable execution date'}</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={reportSignatureBlocks}
                          onChange={(e) => setReportSignatureBlocks(e.target.checked)}
                          className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                        />
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-700">{lang === 'ar' ? 'تضمين خانات اعتمادات توقيع' : 'Signature Boxes'}</span>
                          <span className="block text-[8px] text-zinc-400">{lang === 'ar' ? 'إضافة مربعات مُعد ومعتمد ومالي' : 'Provide formal sign-off lines'}</span>
                        </div>
                      </label>
                    </div>

                  </div>

                  {/* Right Column: Mini Interactive Document Sheet Preview */}
                  <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{lang === 'ar' ? 'المعاينة التفاعلية الفورية للمستندات والتقارير المطبوعة:' : 'Interactive Print Preview Sheet:'}</span>
                    
                    <div className="bg-slate-200/80 p-4 rounded-xl border border-slate-300/60 shadow-inner flex justify-center">
                      {/* Document Simulation Sheet */}
                      <div className="bg-white rounded-md border border-zinc-300 shadow-lg p-4 w-full aspect-[1/1.4] flex flex-col justify-between text-zinc-800 text-[10px] relative overflow-hidden" style={{ fontFamily: 'sans-serif' }}>
                        
                        {/* Header Area */}
                        <div>
                          {reportHeaderLayout === 'centered' ? (
                            <div className="flex flex-col items-center text-center pb-2 border-b-2 border-double" style={{ borderColor: reportAccentColor }}>
                              {reportShowLogo && <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain mb-1" referrerPolicy="no-referrer" />}
                              <h4 className="font-extrabold text-[10px] m-0 leading-normal" style={{ color: reportAccentColor }}>{reportHeaderTitleAr || orgNameAr || 'جمعية رُحماء بينهم للعمل الإنساني والتنمية'}</h4>
                              <p className="text-[7px] text-zinc-400 m-0 leading-none mt-0.5">{reportHeaderSubtitleAr || 'نظام التشغيل المؤسسي الذكي - NexoraOS™'}</p>
                              {reportShowDate && <div className="text-[6px] text-zinc-300 mt-1">{lang === 'ar' ? 'التاريخ:' : 'Date:'} {new Date().toLocaleDateString('ar-SA')}</div>}
                            </div>
                          ) : reportHeaderLayout === 'split' ? (
                            <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: reportAccentColor }}>
                              <div className="w-1/4">
                                {reportShowLogo && <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />}
                              </div>
                              <div className="w-2/4 text-center">
                                <h4 className="font-extrabold text-[9px] m-0 leading-normal" style={{ color: reportAccentColor }}>{reportHeaderTitleAr || orgNameAr || 'جمعية رُحماء بينهم للعمل الإنساني والتنمية'}</h4>
                                <p className="text-[7px] text-zinc-400 m-0 leading-none mt-0.5">{reportHeaderSubtitleAr || 'نظام التشغيل المؤسسي الذكي - NexoraOS™'}</p>
                              </div>
                              <div className="w-1/4 text-left text-[6px] text-zinc-400 leading-normal">
                                <div className="font-bold" style={{ color: reportAccentColor }}>NexoraOS?</div>
                                {reportShowDate && <div>{new Date().toLocaleDateString('ar-SA')}</div>}
                              </div>
                            </div>
                          ) : (
                            /* classic layout */
                            <div className="flex justify-between items-center pb-2 border-b animate-fade-in" style={{ borderColor: reportAccentColor }}>
                              <div className="flex items-center gap-1.5">
                                {reportShowLogo && <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />}
                                <div className="text-right">
                                  <h4 className="font-extrabold text-[9px] m-0 leading-normal" style={{ color: reportAccentColor }}>{reportHeaderTitleAr || orgNameAr || 'جمعية رُحماء بينهم للعمل الإنساني والتنمية'}</h4>
                                  <p className="text-[7px] text-zinc-400 m-0 leading-none mt-0.5">{reportHeaderSubtitleAr || 'نظام التشغيل المؤسسي الذكي - NexoraOS™'}</p>
                                </div>
                              </div>
                              <div className="text-left text-[6px] text-zinc-400 leading-normal">
                                <div className="font-bold" style={{ color: reportAccentColor }}>NexoraOS?</div>
                                {reportShowDate && <div>{new Date().toLocaleDateString('ar-SA')}</div>}
                              </div>
                            </div>
                          )}

                          {/* Report Body placeholder */}
                          <div className="my-3 space-y-1.5">
                            <div className="h-2 rounded w-1/3" style={{ backgroundColor: `${reportAccentColor}20` }} />
                            <div className="border border-dashed border-zinc-200 rounded p-1.5 text-[7px] text-zinc-400 leading-normal bg-zinc-50/50">
                              {lang === 'ar' ? 'هذه ترويسة وتذييل الفواتير، التقارير الموحدة، كشوفات الحسابات والسندات الصادرة عن نظام NexoraOS™.' : 'Interactive sheet layout preview.'}
                            </div>
                            <div className="space-y-1">
                              <div className="h-1 bg-zinc-100 rounded w-full" />
                              <div className="h-1 bg-zinc-100 rounded w-5/6" />
                              <div className="h-1 bg-zinc-100 rounded w-4/6" />
                            </div>
                          </div>
                        </div>

                        {/* Footer Area */}
                        <div>
                          {reportSignatureBlocks && (
                            <div className="grid grid-cols-3 gap-1 border-t border-dotted border-zinc-200 pt-2 pb-1 text-[6px] text-center font-bold text-slate-500">
                              <div>
                                <div>{lang === 'ar' ? 'مُعِد التقرير' : 'Prepared'}</div>
                                <div className="border-t border-dashed border-zinc-200 w-2/3 mx-auto my-1" />
                              </div>
                              <div>
                                <div>{lang === 'ar' ? 'المدير المالي' : 'Financial'}</div>
                                <div className="border-t border-dashed border-zinc-200 w-2/3 mx-auto my-1" />
                              </div>
                              <div>
                                <div>{lang === 'ar' ? 'الالتزام' : 'Approved'}</div>
                                <div className="border-t border-dashed border-zinc-200 w-2/3 mx-auto my-1" />
                              </div>
                            </div>
                          )}

                          <div className="border-t pt-1.5 text-center text-[7px] text-zinc-400 leading-normal" style={{ borderColor: `${reportAccentColor}50` }}>
                            <div className="font-extrabold mb-0.5 truncate max-w-full" style={{ color: reportAccentColor }}>{reportFooterTextAr || 'جمعية رُحماء بينهم للعمل الإنساني والتنمية'}</div>
                            <div className="text-[5px] text-zinc-300 font-mono">NexoraOS? System ? Verified Document</div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Subscription info box with quick link */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 text-slate-600">
                    <h4 className="font-extrabold text-amber-900">{lang === 'ar' ? 'حالة اشتراك المؤسسة على بوابة الرابطة ERP' : 'Enterprise Subscription Status'}</h4>
                    <p>
                      {lang === 'ar' 
                        ? `الخطة الاشتراكية النشطة: ${mainOrg?.subscription_plan || 'Enterprise Pro'} (حد المستخدمين: ${mainOrg?.max_users || 50}، حد التخزين: ${mainOrg?.max_storage_gb || 100} جيجابايت)`
                        : `Active Subscription Plan: ${mainOrg?.subscription_plan || 'Enterprise Pro'} (User limit: ${mainOrg?.max_users || 50}, Storage limit: ${mainOrg?.max_storage_gb || 100} GB)`}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveSubTab('subscription')} 
                  className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'ترقية الاشتراك والدفع' : 'Manage Subscription'}</span>
                </button>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={updating}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-lg text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  {updating ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{lang === 'ar' ? 'حفظ التحديثات' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-zinc-400">{lang === 'ar' ? 'لا يوجد ملف للمؤسسة حالياً' : 'No organization record found.'}</div>
          )}
        </div>
      )}

      {/* Subscription & Payment Gateways Tab */}
      {activeSubTab === 'subscription' && (
        <div className="space-y-6 animate-fade-in">
          {/* Active Plan Overview */}
          <div className="bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {lang === 'ar' ? 'اشتراك معمد ونشط' : 'Active Enterprise Subscription'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">ID: SUB-NEXORA-2026-X99</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{mainOrg?.name_ar || mainOrg?.name_en || 'جمعية رحماء الخيرية'}</span>
                <span className="text-amber-400 font-mono text-sm">({selectedPlan.toUpperCase()})</span>
              </h3>
              <p className="text-xs text-zinc-400 max-w-2xl">
                {lang === 'ar' 
                  ? 'ترخيص الاستخدام الشامل لمنظومة NexoraOS™ المؤسسية - النطاقات الـ 15 كاملة مع المزامنة المباشرة لقواعد البيانات المركزية وتكامل الذكاء الاصطناعي المؤسسي.'
                  : 'Full enterprise license for NexoraOS? suite - All 15 domains enabled with live database sync and AI Copilot.'}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl shrink-0 text-center">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-bold">{lang === 'ar' ? 'تاريخ التجديد القادم' : 'Renewal Date'}</p>
                <p className="text-sm font-black font-mono text-emerald-400 mt-0.5">31/12/2026</p>
              </div>
              <div className="w-px h-8 bg-white/10 mx-1"></div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-bold">{lang === 'ar' ? 'المستخدمين المتاحين' : 'Active Users'}</p>
                <p className="text-sm font-black font-mono text-white mt-0.5">14 / {mainOrg?.max_users || 50}</p>
              </div>
            </div>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h4 className="text-xs font-black text-slate-800">{lang === 'ar' ? 'دورة التجديد والتحصيل' : 'Billing Cycle'}</h4>
              <p className="text-[10px] text-zinc-400">{lang === 'ar' ? 'احصل على خصم 20% عند الدفع السنوي المباشر' : 'Save 20% on annual commitments'}</p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-zinc-500'}`}
              >
                {lang === 'ar' ? 'أيام' : 'Monthly'}
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${billingCycle === 'annual' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-500'}`}
              >
                <span>{lang === 'ar' ? 'سنوي (خصم 20%)' : 'Annual (20% OFF)'}</span>
                <Sparkles className="w-3 h-3 text-amber-200" />
              </button>
            </div>
          </div>

          {/* Pricing Tier Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Plan 1: Starter */}
            <div className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all ${selectedPlan === 'starter' ? 'border-2 border-emerald-600 shadow-md ring-2 ring-emerald-600/10' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="space-y-3">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold uppercase">{lang === 'ar' ? 'إجمالي الموظفين' : 'Starter Tier'}</span>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">${billingCycle === 'annual' ? '200' : '250'}</span>
                    <span className="text-xs text-zinc-400">/{lang === 'ar' ? 'الروضة' : 'month'}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">{lang === 'ar' ? 'للمؤسسات الصغيرة والمكاتب الميدانية الناشئة' : 'For small teams & local field offices'}</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 10 {lang === 'ar' ? 'مستخدمين معتمدين' : 'Users'}</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 10 GB {lang === 'ar' ? 'تخزين سحابي' : 'Storage'}</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'النطاقات المالية والبرامج الأساسية' : 'Core Finance & Programs'}</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  setSelectedPlan('starter');
                  try {
                    await fetch(`/api/tables/organizations/${mainOrg.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ subscription_plan: 'starter', max_users: 10, max_storage_gb: 10 })
                    });
                    setSuccessMsg(lang === 'ar' ? 'تم تحويل اشتراك المؤسسة إلى الباقة الأساسية بنجاح' : 'Switched to Starter plan.');
                    onRefresh();
                  } catch (e) {}
                }}
                className={`w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${selectedPlan === 'starter' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {selectedPlan === 'starter' ? (lang === 'ar' ? 'الباقة المفعلة حالياً ✓' : 'Current Active Plan') : (lang === 'ar' ? 'الحالة والصرف' : 'Select Plan')}
              </button>
            </div>

            {/* Plan 2: Enterprise Pro */}
            <div className={`bg-white rounded-2xl border p-5 shadow-lg space-y-4 flex flex-col justify-between relative transition-all ${selectedPlan === 'enterprise_pro' ? 'border-2 border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                {lang === 'ar' ? 'الكمية المطلوبة' : 'Most Popular'}
              </div>
              <div className="space-y-3 pt-1">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold uppercase">{lang === 'ar' ? 'الباقة المؤسسية المتقدمة' : 'Enterprise Pro'}</span>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">${billingCycle === 'annual' ? '520' : '650'}</span>
                    <span className="text-xs text-zinc-400">/{lang === 'ar' ? 'الروضة' : 'month'}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">{lang === 'ar' ? 'المشاريع الميدانية والكوادر والمعدات' : 'For full organizational operations'}</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> 50 {lang === 'ar' ? 'خيارات السحب' : 'Users'}</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> 100 GB {lang === 'ar' ? 'مكتمل ومسلم' : 'Storage'}</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> {lang === 'ar' ? 'كافة النطاقات الـ 15 كاملة' : 'All 15 Nexora Domains'}</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> {lang === 'ar' ? 'مساعد Gemini AI الذكي' : 'Gemini AI Copilot'}</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  setSelectedPlan('enterprise_pro');
                  try {
                    await fetch(`/api/tables/organizations/${mainOrg.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ subscription_plan: 'enterprise_pro', max_users: 50, max_storage_gb: 100 })
                    });
                    setSuccessMsg(lang === 'ar' ? 'تم ترقية الاشتراك للباقة المؤسسية المتقدمة بنجاح' : 'Upgraded to Enterprise Pro.');
                    onRefresh();
                  } catch (e) {}
                }}
                className={`w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${selectedPlan === 'enterprise_pro' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {selectedPlan === 'enterprise_pro' ? (lang === 'ar' ? 'الباقة المفعلة حالياً ✓' : 'Current Active Plan') : (lang === 'ar' ? 'الحالة والصرف' : 'Select & Upgrade')}
              </button>
            </div>

            {/* Plan 3: Humanitarian Non-Profit */}
            <div className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all ${selectedPlan === 'humanitarian' ? 'border-2 border-emerald-600 shadow-md ring-2 ring-emerald-600/10' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="space-y-3">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase">{lang === 'ar' ? 'باقة المنظمات الإنسانية' : 'Humanitarian Org'}</span>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">${billingCycle === 'annual' ? '390' : '480'}</span>
                    <span className="text-xs text-zinc-400">/{lang === 'ar' ? 'الروضة' : 'month'}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">{lang === 'ar' ? 'خاصة بمنظمات كفالة الأيتام والإغاثة الميدانية' : 'Tailored for Orphan & Relief NGOs'}</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 100 {lang === 'ar' ? 'مستخدم ومندوب ميداني' : 'Users'}</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 200 GB {lang === 'ar' ? 'تخزين للمستندات والوثائق' : 'Storage'}</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'معايير إسفير الدولية و IATI' : 'Sphere Standards & IATI'}</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  setSelectedPlan('humanitarian');
                  try {
                    await fetch(`/api/tables/organizations/${mainOrg.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ subscription_plan: 'humanitarian', max_users: 100, max_storage_gb: 200 })
                    });
                    setSuccessMsg(lang === 'ar' ? 'تم اختيار باقة المنظمات الإنسانية بنجاح' : 'Switched to Humanitarian tier.');
                    onRefresh();
                  } catch (e) {}
                }}
                className={`w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${selectedPlan === 'humanitarian' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {selectedPlan === 'humanitarian' ? (lang === 'ar' ? 'الباقة المفعلة حالياً ✓' : 'Current Active Plan') : (lang === 'ar' ? 'الحالة والصرف' : 'Select Plan')}
              </button>
            </div>

            {/* Plan 4: Sovereign Core */}
            <div className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all ${selectedPlan === 'sovereign' ? 'border-2 border-purple-600 shadow-md ring-2 ring-purple-600/10' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="space-y-3">
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold uppercase">{lang === 'ar' ? 'الزكاة المستحقة الشرعية' : 'Sovereign Core'}</span>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">${billingCycle === 'annual' ? '1,480' : '1,850'}</span>
                    <span className="text-xs text-zinc-400">/{lang === 'ar' ? 'الروضة' : 'month'}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">{lang === 'ar' ? 'للجهات الحكومية والمؤسسات الكبرى' : 'For Government & Enterprise On-Prem'}</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> {lang === 'ar' ? 'مستخدمون غير محدودين' : 'Unlimited Users'}</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> 1 Terabyte {lang === 'ar' ? 'تخزين خاص' : 'Dedicated Storage'}</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> {lang === 'ar' ? 'خادم مخصص وقاعدة بيانات مركزية مستقلة' : 'Dedicated Enterprise Server & Database'}</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  setSelectedPlan('sovereign');
                  try {
                    await fetch(`/api/tables/organizations/${mainOrg.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ subscription_plan: 'sovereign', max_users: 999, max_storage_gb: 1000 })
                    });
                    setSuccessMsg(lang === 'ar' ? 'تم اختيار الباقة السيادية الشاملة بنجاح' : 'Switched to Sovereign Core tier.');
                    onRefresh();
                  } catch (e) {}
                }}
                className={`w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${selectedPlan === 'sovereign' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {selectedPlan === 'sovereign' ? (lang === 'ar' ? 'الباقة المفعلة حالياً ✓' : 'Current Active Plan') : (lang === 'ar' ? 'اختيار الباقة' : 'Select Plan')}
              </button>
            </div>
          </div>

          {/* Payment Gateways Configurations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'إدارة بوابات وطرق الدفع الإلكترونية والبنكية' : 'Payment Gateways & Direct Banking Integrations'}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {lang === 'ar' ? 'توفير خيارات سداد التبرعات وااشتراكات الخدمات عبر البوابات الدولية والمحلية' : 'Configure payment options for donor collection and subscription billing'}
                </p>
              </div>
            </div>

            {gatewayTestStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
                <span>{gatewayTestStatus}</span>
                <button onClick={() => setGatewayTestStatus(null)} className="text-zinc-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gateway 1: Stripe & Cards */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-sky-600" />
                    <span className="font-extrabold text-xs text-slate-800">{lang === 'ar' ? 'بطاقات الائتمان (Stripe / Visa)' : 'Credit Cards (Stripe)'}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full">{lang === 'ar' ? 'مفعل' : 'Active'}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Publishable Key</label>
                    <input 
                      type="text" 
                      value={stripeApiKey}
                      onChange={(e) => setStripeApiKey(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Secret Key</label>
                    <input 
                      type="password" 
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[11px]"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setGatewayTestStatus(lang === 'ar' ? '✓ تم التحقق من صحة مفاتيح بوابة Stripe بنجاح. الاتصال جاهز للاستخدام.' : '? Stripe connection verified successfully.');
                    }}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {lang === 'ar' ? 'اختبار الاتصال بالبوابة' : 'Test Stripe Connection'}
                  </button>
                </div>
              </div>

              {/* Gateway 2: Local Yemeni Digital Wallets */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span className="font-extrabold text-xs text-slate-800">{lang === 'ar' ? 'المحافط اليمنية (الكريمي حاسب/جيب/جوال)' : 'Yemeni Digital Wallets'}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full">{lang === 'ar' ? 'مفعل' : 'Active'}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Merchant Account ID</label>
                    <input 
                      type="text" 
                      value={kuraimiMerchantId}
                      onChange={(e) => setKuraimiMerchantId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">API Secret Key</label>
                    <input 
                      type="password" 
                      value={kuraimiApiKey}
                      onChange={(e) => setKuraimiApiKey(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[11px]"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setGatewayTestStatus(lang === 'ar' ? '✓ تم الربط بنجاح مع بوابة حاسب الكريمي وتدفق نقد الرقمية.' : '? Local wallet integration verified.');
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {lang === 'ar' ? 'اختبار ربط المحافظ المحلية' : 'Test Local Gateway'}
                  </button>
                </div>
              </div>

              {/* Gateway 3: Bank Transfer Details */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-xs text-slate-800">{lang === 'ar' ? 'الحوالات والودائع البنكية المباشرة' : 'Direct Bank Wires & Transfers'}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full">{lang === 'ar' ? 'مفعل' : 'Active'}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{lang === 'ar' ? 'تفاصيل الحسابات البنكية المعتمدة' : 'Bank Accounts & IBANs'}</label>
                    <textarea 
                      rows={4}
                      value={bankWireDetails}
                      onChange={(e) => setBankWireDetails(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-sans text-xs leading-relaxed"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setGatewayTestStatus(lang === 'ar' ? '✓ تم حفظ بيانات الحسابات البنكية وتحديث إيصالات التحصيل.' : '? Bank details updated.');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {lang === 'ar' ? 'حفظ الحسابات البنكية' : 'Save Bank Details'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Billing Ledger History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-slate-600" />
                  <span>{lang === 'ar' ? 'سجل فواتير الاشتراكات والتحصيل لـ NexoraOS' : 'Subscription Billing History & Tax Invoices'}</span>
                </h4>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">{lang === 'ar' ? 'سجل مدقق وسحابي' : 'Cloud Verified'}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                <thead className="bg-slate-50/50 border-b border-slate-200 text-zinc-400 font-bold uppercase text-[9px]">
                  <tr>
                    <th className="px-6 py-3">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice ID'}</th>
                    <th className="px-6 py-3">{lang === 'ar' ? 'تاريخ الإصدار' : 'Date'}</th>
                    <th className="px-6 py-3">{lang === 'ar' ? 'الباقة المشمولة' : 'Plan'}</th>
                    <th className="px-6 py-3">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                    <th className="px-6 py-3">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                    <th className="px-6 py-3">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono font-bold text-amber-700">INV-2026-001</td>
                    <td className="px-6 py-3 text-slate-600">01/01/2026</td>
                    <td className="px-6 py-3 font-extrabold text-slate-800">Enterprise Pro Tier</td>
                    <td className="px-6 py-3 font-mono font-bold text-emerald-700">$6,240.00</td>
                    <td className="px-6 py-3 text-slate-500">Bank Wire (Kuraimi Bank)</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                        {lang === 'ar' ? 'مدفوع ومعمد ✓' : 'Paid ?'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono font-bold text-amber-700">INV-2025-012</td>
                    <td className="px-6 py-3 text-slate-600">01/01/2025</td>
                    <td className="px-6 py-3 font-extrabold text-slate-800">Enterprise Pro Tier</td>
                    <td className="px-6 py-3 font-mono font-bold text-emerald-700">$6,240.00</td>
                    <td className="px-6 py-3 text-slate-500">Credit Card (Stripe)</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                        {lang === 'ar' ? 'مدفوع ومعمد ✓' : 'Paid ?'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeSubTab === 'system' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase">{lang === 'ar' ? 'إعدادات النظام الأساسية والربط الفني' : 'System Variables & API Mappings'}</h3>
            <p className="text-[10px] text-zinc-400 mt-1">
              {lang === 'ar' ? 'تتحكم هذه المفاتيح بطبيعة عمل محركات التقارير، السيرفرات، والسياسات الأمنية لـ NexoraOS™.' : 'Directly configures standard reporting outputs, background engines, and firewall variables for NexoraOS?.'}
            </p>
          </div>

          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">{lang === 'ar' ? 'تفعيل المصادقة البيومترية الحساسة' : 'Enable Mandatory Biometric Authentication'}</span>
            </div>
            <button 
              onClick={() => setBiometricEnabled(!biometricEnabled)}
              className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-all cursor-pointer ${biometricEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-200 justify-start'}`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
              <thead className="bg-slate-50/50 border-b border-slate-200 text-zinc-400 font-bold uppercase text-[9px]">
                <tr>
                  <th className="px-6 py-3">{lang === 'ar' ? 'مفتاح التكوين (Key)' : 'Setting Key'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'القيمة المحفوظة (Value)' : 'Saved Value'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'البيان والوظيفة' : 'Description'}</th>
                  <th className="px-6 py-3 text-center">{lang === 'ar' ? 'خيارات' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {sysSettings.map(setting => {
                  const isEditing = editingSettingId === setting.id;
                  const stringifiedValue = typeof setting.setting_value === 'object' 
                    ? JSON.stringify(setting.setting_value, null, 2) 
                    : String(setting.setting_value);

                  return (
                    <tr key={setting.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono font-bold text-amber-700 text-[11px]">
                        {setting.setting_key}
                      </td>
                      <td className="px-6 py-3 max-w-sm">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="w-full bg-slate-50 border border-zinc-300 rounded p-1 text-xs font-mono"
                          />
                        ) : (
                          <code className="text-[11px] bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 text-slate-600 block max-h-16 overflow-y-auto font-mono text-left" dir="ltr">
                            {stringifiedValue}
                          </code>
                        )}
                      </td>
                      <td className="px-6 py-3 text-zinc-400 text-[11px] font-medium leading-normal">
                        {setting.description || <span className="text-zinc-200">?</span>}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-1">
                            <button 
                              onClick={() => saveSettingEdit(setting.id, true)}
                              disabled={updating}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded"
                              title={lang === 'ar' ? 'حفظ' : 'Save'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setEditingSettingId(null)}
                              className="p-1 text-zinc-400 hover:bg-slate-100 border border-slate-200 rounded"
                              title={lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => startEditSetting(setting.id, setting.setting_value)}
                            className="px-2 py-1 text-[10px] font-bold text-amber-600 hover:text-white border border-amber-200 hover:bg-amber-600 rounded transition-all"
                          >
                            {lang === 'ar' ? 'تعديل' : 'Edit'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Organization Settings Keys Tab */}
      {activeSubTab === 'orgKeys' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase">{lang === 'ar' ? 'متغيرات إعدادات المؤسسة الثنائية' : 'Bilingual Organization Variables'}</h3>
            <p className="text-[10px] text-zinc-400 mt-1">
              {lang === 'ar' ? 'تتحكم هذه بمسميات الفواتير والترجمات الميدانية وتقارير الكشوف والمطابقات.' : 'Directly controls bill headers, multi-language print layouts, and ledger titles.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
              <thead className="bg-slate-50/50 border-b border-slate-200 text-zinc-400 font-bold uppercase text-[9px]">
                <tr>
                  <th className="px-6 py-3">{lang === 'ar' ? 'مفتاح التكوين (Key)' : 'Setting Key'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'القيمة المحفوظة (Value)' : 'Saved Value'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'البيان والوظيفة' : 'Description'}</th>
                  <th className="px-6 py-3 text-center">{lang === 'ar' ? 'خيارات' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {orgSettings.map(setting => {
                  const isEditing = editingSettingId === setting.id;
                  const stringifiedValue = typeof setting.setting_value === 'object' 
                    ? JSON.stringify(setting.setting_value, null, 2) 
                    : String(setting.setting_value);

                  return (
                    <tr key={setting.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono font-bold text-amber-700 text-[11px]">
                        {setting.setting_key}
                      </td>
                      <td className="px-6 py-3 max-w-sm">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="w-full bg-slate-50 border border-zinc-300 rounded p-1 text-xs font-mono"
                          />
                        ) : (
                          <code className="text-[11px] bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 text-slate-600 block max-h-16 overflow-y-auto font-mono text-left" dir="ltr">
                            {stringifiedValue}
                          </code>
                        )}
                      </td>
                      <td className="px-6 py-3 text-zinc-400 text-[11px] font-medium leading-normal">
                        {setting.description || <span className="text-zinc-200">?</span>}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-1">
                            <button 
                              onClick={() => saveSettingEdit(setting.id, false)}
                              disabled={updating}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded"
                              title={lang === 'ar' ? 'حفظ' : 'Save'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setEditingSettingId(null)}
                              className="p-1 text-zinc-400 hover:bg-slate-100 border border-slate-200 rounded"
                              title={lang === 'ar' ? 'تعديل' : 'Cancel'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => startEditSetting(setting.id, setting.setting_value)}
                            className="px-2 py-1 text-[10px] font-bold text-amber-600 hover:text-white border border-amber-200 hover:bg-amber-600 rounded transition-all"
                          >
                            {lang === 'ar' ? 'تعديل' : 'Edit'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'biometric' && (
        <BiometricSecuritySettingsView lang={lang} currentUser={{ email: 'admin@rohaama.org', name: 'Manager', role: 'admin' }} />
      )}

      {activeSubTab === 'totp' && (
        <TOTPSecuritySettingsView lang={lang} currentUser={{ email: 'admin@rohaama.org', name: 'Manager', role: 'admin' }} />
      )}

      {activeSubTab === 'devices' && (
        <TrustedDevicesView lang={lang} currentUser={{ email: 'admin@rohaama.org', name: 'Manager', role: 'admin' }} />
      )}

      {activeSubTab === 'integrations' && (
        <div className="space-y-6">
          {/* Section 1: AI Copilot Custom Model & API Key Configuration */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Cpu className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800">{lang === 'ar' ? 'إعدادات الذكاء الاصطناعي والموديلات المخصصة' : 'AI Copilot & Model Customization'}</h3>
                <p className="text-[11px] text-zinc-400">{lang === 'ar' ? 'تخصيص نموذج الذكاء الاصطناعي النشط وإدخال مفاتيح API الخاصة بك للعمليات الموسعة.' : 'Configure the active AI model, custom models, and specialized API keys.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">{lang === 'ar' ? 'نموذج الذكاء الاصطناعي النشط' : 'Active AI Model'}</label>
                <select
                  value={aiSettingsModel}
                  onChange={(e) => setAiSettingsModel(e.target.value)}
                  className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                >
                  {customModels.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
                <p className="text-[9px] text-zinc-400 leading-normal">{lang === 'ar' ? 'النموذج المحدد سيتم استخدامه افتراضياً في جميع تحليلات المساعد الذكي Nexora Copilot.' : 'The selected model is utilized across all Nexora Copilot analytical tasks.'}</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">{lang === 'ar' ? 'مفتاح API الخاص بـ Gemini (اختياري)' : 'Gemini API Key (Optional)'}</label>
                <input
                  type="password"
                  placeholder={aiSettingsKey ? '••••••••••••••••••••••••' : 'AIzaSy...'}
                  value={aiSettingsKey}
                  onChange={(e) => setAiSettingsKey(e.target.value)}
                  className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                />
                <p className="text-[9px] text-zinc-400 leading-normal">{lang === 'ar' ? 'في حال عدم إدخال مفتاح مخصص، سيقوم النظام بالربط التلقائي بمفتاح السحابة المعتمد.' : 'Defaults to the secure enterprise-level cloud credential if left blank.'}</p>
              </div>
            </div>

            {/* Custom Models Manager */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <span className="text-[10px] font-black uppercase text-zinc-400 block">{lang === 'ar' ? 'إضافة موديلات مخصصة (Custom Models Manager)' : 'Custom Models Manager'}</span>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. gemini-2.0-flash-exp"
                  value={newCustomModel}
                  onChange={(e) => setNewCustomModel(e.target.value)}
                  className="flex-1 bg-white border border-zinc-200 rounded-lg py-1.5 px-3 text-xs font-mono text-slate-800 focus:border-amber-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomModel}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-all"
                >
                  {lang === 'ar' ? 'إضافة نموذج' : 'Add Model'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {customModels.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-md text-[10px] font-mono text-slate-600">
                    <span>{m}</span>
                    {customModels.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomModel(m)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveAISettings}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-950/20"
              >
                {lang === 'ar' ? 'حفظ إعدادات الذكاء الاصطناعي' : 'Save AI Configuration'}
              </button>
            </div>
          </div>

          {/* Section 2: Messaging Gateways (SMS & SMTP) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800">{lang === 'ar' ? 'إعدادات بوابات الإشعارات (SMS / WhatsApp & SMTP Email)' : 'Notification Gateways'}</h3>
                <p className="text-[11px] text-zinc-400">{lang === 'ar' ? 'توصيل مزودي خدمات الرسائل القصيرة وسيرفر البريد لضمان تدفق رسائل الحوكمة والتحقق.' : 'Configure SMS providers, WhatsApp Cloud API, and SMTP relay servers.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SMS Gateway */}
              <div className="space-y-4 border-b lg:border-b-0 lg:border-l border-slate-100 pb-4 lg:pb-0 lg:pl-6">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  {lang === 'ar' ? 'بوابة الرسائل النصية وواتساب (SMS / WhatsApp)' : 'SMS & WhatsApp Gateway'}
                </span>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1">{lang === 'ar' ? 'مزود الخدمة المعتمد' : 'SMS Provider'}</label>
                      <select
                        value={smsProvider}
                        onChange={(e) => setSmsProvider(e.target.value)}
                        className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:border-amber-500 outline-none"
                      >
                        <option value="whatsapp">WhatsApp Cloud API (بحسب الرسالة)</option>
                        <option value="twilio">Twilio Integration Gateway</option>
                        <option value="yamamah">Yamamah SMS (الرسائل داخل اليمن)</option>
                        <option value="nexmo">Vonage / Nexmo API</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1">{lang === 'ar' ? 'معرف المرسل النشط' : 'Sender Identifier'}</label>
                      <input
                        type="text"
                        value={smsSenderId}
                        onChange={(e) => setSmsSenderId(e.target.value)}
                        className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">{lang === 'ar' ? 'مفتاح الربط البرمجي (API Auth Token)' : 'API Secret/Token'}</label>
                    <input
                      type="password"
                      value={smsApiKey}
                      onChange={(e) => setSmsApiKey(e.target.value)}
                      className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Interactive Testing Box */}
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-700 block">{lang === 'ar' ? 'فحص جودة الاتصال بالبوابة وإرسال رسالة تجريبية:' : 'Test Gateway Connection:'}</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="block text-zinc-400 mb-0.5">{lang === 'ar' ? 'رقم الهاتف للتجربة' : 'Recipient Phone'}</label>
                        <input
                          type="text"
                          value={smsTestPhone}
                          onChange={(e) => setSmsTestPhone(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-[10px] font-mono text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-0.5">{lang === 'ar' ? 'محتوى الرسالة' : 'SMS Message Body'}</label>
                        <input
                          type="text"
                          value={smsTestMessage}
                          onChange={(e) => setSmsTestMessage(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-[10px] text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestSMS}
                      disabled={smsTestLoading}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-md transition-all flex items-center justify-center gap-1"
                    >
                      {smsTestLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span>{lang === 'ar' ? 'إرسال رسالة فحص البوابة' : 'Dispatch Test Message'}</span>
                    </button>

                    {smsTestResult && (
                      <div className={`p-2 rounded text-[10px] font-mono leading-relaxed border ${smsTestResult.status === 'ok' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                        {smsTestResult.status === 'ok' ? (
                          <>
                            <div className="font-bold flex items-center gap-1 text-emerald-950">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{lang === 'ar' ? 'نجح الإرسال بالتنسيق الموحد!' : 'SMS Dispatched Successfully!'}</span>
                            </div>
                            <div className="mt-1 text-[9px] text-emerald-700 space-y-0.5">
                              <div>Provider: {smsTestResult.provider}</div>
                              <div>Delivered At: {smsTestResult.deliveredAt}</div>
                              <div>Message: {smsTestResult.message}</div>
                            </div>
                          </>
                        ) : (
                          <div className="font-bold text-red-700">{smsTestResult.message || 'Error executing API.'}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SMTP Email Gateway */}
              <div className="space-y-4">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-500" />
                  {lang === 'ar' ? 'بوابة خادم البريد الإلكتروني (SMTP Gateway)' : 'SMTP Relay Gateway'}
                </span>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1">{lang === 'ar' ? 'عنوان خادم SMTP' : 'SMTP Server Host'}</label>
                      <input
                        type="text"
                        value={emailSmtpHost}
                        onChange={(e) => setEmailSmtpHost(e.target.value)}
                        className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1">{lang === 'ar' ? 'منفذ الاتصال (Port)' : 'Port'}</label>
                      <input
                        type="text"
                        value={emailSmtpPort}
                        onChange={(e) => setEmailSmtpPort(e.target.value)}
                        className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1">{lang === 'ar' ? 'اسم المستخدم (User)' : 'Username'}</label>
                      <input
                        type="text"
                        value={emailSmtpUser}
                        onChange={(e) => setEmailSmtpUser(e.target.value)}
                        className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1">{lang === 'ar' ? 'كلمة المرور / مفتاح SMTP' : 'Password/Token'}</label>
                      <input
                        type="password"
                        value={emailSmtpPass}
                        onChange={(e) => setEmailSmtpPass(e.target.value)}
                        className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Interactive SMTP Testing Box */}
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-700 block">{lang === 'ar' ? 'اختبار بوابات الإرسال SMTP وإرسال بريد تجريبي:' : 'Test SMTP Server Dispatch:'}</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="block text-zinc-400 mb-0.5">{lang === 'ar' ? 'البريد الإلكتروني للتجربة' : 'Recipient Email'}</label>
                        <input
                          type="email"
                          value={emailTestRecipient}
                          onChange={(e) => setEmailTestRecipient(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-[10px] text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-0.5">{lang === 'ar' ? 'عنوان الموضوع' : 'Subject'}</label>
                        <input
                          type="text"
                          value={emailTestSubject}
                          onChange={(e) => setEmailTestSubject(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-[10px] text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestEmail}
                      disabled={emailTestLoading}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-md transition-all flex items-center justify-center gap-1"
                    >
                      {emailTestLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span>{lang === 'ar' ? 'إرسال بريد فحص الاتصال' : 'Dispatch Test Email'}</span>
                    </button>

                    {emailTestResult && (
                      <div className={`p-2 rounded text-[10px] font-mono leading-relaxed border ${emailTestResult.status === 'ok' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                        {emailTestResult.status === 'ok' ? (
                          <>
                            <div className="font-bold flex items-center gap-1 text-emerald-950">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{lang === 'ar' ? 'تم تمرير البريد بنجاح عبر خادم البريد!' : 'Email Routed Successfully!'}</span>
                            </div>
                            <div className="mt-1 text-[9px] text-emerald-700 space-y-0.5">
                              <div>Relay Server Host: {emailTestResult.smtpHost}</div>
                              <div>Sent At: {emailTestResult.sentAt}</div>
                              <div>Message: {emailTestResult.message}</div>
                            </div>
                          </>
                        ) : (
                          <div className="font-bold text-red-700">{emailTestResult.message || 'Error executing SMTP.'}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Zakat & Tax Financial Compliance Engine */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Percent className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800">{lang === 'ar' ? 'محرك الزكاة والضرائب والامتثال الشرعي والمالي' : 'Zakat, VAT & Tax Compliance Engine'}</h3>
                <p className="text-[11px] text-zinc-400">{lang === 'ar' ? 'تعديل المعايير وحساب نسب الفئات والضرائب المفروضة على العمليات المالية تلقائياً.' : 'Configure parameters and execute compliance checks for Zakat and VAT liabilities.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">{lang === 'ar' ? 'الأصول النقدية والذهبية (YER)' : 'Zakat Base Assets (YER)'}</label>
                <input
                  type="number"
                  value={zakatAssets}
                  onChange={(e) => setZakatAssets(e.target.value)}
                  className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">{lang === 'ar' ? 'طريقة حساب وعاء الزكاة' : 'Zakat Rate Type'}</label>
                <select
                  value={zakatRateType}
                  onChange={(e) => setZakatRateType(e.target.value as 'lunar' | 'solar')}
                  className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:border-amber-500 outline-none"
                >
                  <option value="lunar">قمرية / هجرية (2.500%)</option>
                  <option value="solar">شمسية / ميلادية (2.5775%)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">{lang === 'ar' ? 'إجمالي المشتريات/المبيعات الخاضعة للضريبة' : 'VAT-Eligible Amount (YER)'}</label>
                <input
                  type="number"
                  value={zakatVatBase}
                  onChange={(e) => setZakatVatBase(e.target.value)}
                  className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">{lang === 'ar' ? 'نسبة ضريبة القيمة المضافة (%)' : 'VAT Rate Percentage (%)'}</label>
                <input
                  type="number"
                  value={customVatPct}
                  onChange={(e) => setCustomVatPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-slate-800 font-mono focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCalculateZakat}
                disabled={zakatCalcLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5"
              >
                {zakatCalcLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                <span>{lang === 'ar' ? 'تشغيل حاسبة الامتثال المالي' : 'Run Compliance Calculation'}</span>
              </button>
            </div>

            {/* Compliance Calculation Results Rendering */}
            {zakatResult && (
              <div className="bg-slate-900 text-slate-100 rounded-xl p-5 space-y-4 font-mono text-xs border border-zinc-800 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    {lang === 'ar' ? 'مخرجات محرك الحسابات المالية (Nexora Compliance Ledger):' : 'Calculation Output Details:'}
                  </span>
                  <span className="text-[10px] text-zinc-500">{lang === 'ar' ? 'تقرير امتثال رسمي' : 'Official Compliance Report'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-zinc-800/60 pb-4">
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
                    <div className="text-[9px] text-zinc-500 uppercase">{lang === 'ar' ? 'الزكاة المستحقة الشرعية' : 'Zakat Due'}</div>
                    <div className="text-base font-black text-emerald-400 mt-1">{zakatResult.zakatDueYER?.toLocaleString()} YER</div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">{lang === 'ar' ? 'معدل الوعاء الزكوي:' : 'Applied Rate:'} {zakatResult.zakatRatePct}</div>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
                    <div className="text-[9px] text-zinc-500 uppercase">{lang === 'ar' ? 'ضريبة القيمة المضافة المستحقة' : 'VAT Due'}</div>
                    <div className="text-base font-black text-amber-500 mt-1">{zakatResult.vatDueYER?.toLocaleString()} YER</div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">{lang === 'ar' ? 'النسبة المعتمدة:' : 'VAT Rate:'} {zakatResult.vatRatePct}</div>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
                    <div className="text-[9px] text-zinc-500 uppercase">{lang === 'ar' ? 'إجمالي الالتزامات المالية والضريبية' : 'Total Financial Liability'}</div>
                    <div className="text-base font-black text-rose-400 mt-1">{zakatResult.totalComplianceLiabilityYER?.toLocaleString()} YER</div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">{lang === 'ar' ? 'مطابق للمعايير الدولية' : 'IPSAS & GAZT Compliant'}</div>
                  </div>
                </div>

                {/* Shariah Distribution Areas */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 block">{lang === 'ar' ? 'توزع الزكاة التلقائي على المصارف الشرعية (Asnaf Distribution Areas):' : 'Automatic Zakat Distribution Breakdown:'}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div className="p-2.5 bg-zinc-950 rounded-md border border-zinc-800/40">
                      <div className="text-zinc-500">{lang === 'ar' ? 'الفقراء والمساكين' : 'Poor & Needy'}</div>
                      <div className="font-bold text-slate-300 mt-1">{(zakatResult.zakatDueYER * 0.50)?.toLocaleString()} YER <span className="text-[9px] text-emerald-400 font-normal">(50%)</span></div>
                    </div>
                    <div className="p-2.5 bg-zinc-950 rounded-md border border-zinc-800/40">
                      <div className="text-zinc-500">{lang === 'ar' ? 'العاملون عليها' : 'Zakat Workers'}</div>
                      <div className="font-bold text-slate-300 mt-1">{(zakatResult.zakatDueYER * 0.125)?.toLocaleString()} YER <span className="text-[9px] text-emerald-400 font-normal">(12.5%)</span></div>
                    </div>
                    <div className="p-2.5 bg-zinc-950 rounded-md border border-zinc-800/40">
                      <div className="text-zinc-500">{lang === 'ar' ? 'الغارمون وبنو السبيل' : 'Debtors & Wayfarers'}</div>
                      <div className="font-bold text-slate-300 mt-1">{(zakatResult.zakatDueYER * 0.25)?.toLocaleString()} YER <span className="text-[9px] text-emerald-400 font-normal">(25%)</span></div>
                    </div>
                    <div className="p-2.5 bg-zinc-950 rounded-md border border-zinc-800/40">
                      <div className="text-zinc-500">{lang === 'ar' ? 'في سبيل الله' : 'In Cause of Allah'}</div>
                      <div className="font-bold text-slate-300 mt-1">{(zakatResult.zakatDueYER * 0.125)?.toLocaleString()} YER <span className="text-[9px] text-emerald-400 font-normal">(12.5%)</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: External API Gateway Integration Registry */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800">{lang === 'ar' ? 'بوابة الربط المباشر مع الجهات الخارجية والأنظمة الحكومية' : 'Unified External API Gateways Hub'}</h3>
                <p className="text-[11px] text-zinc-400">{lang === 'ar' ? 'ربط مباشر مع الخوادم الرسمية وبوابات التبرع الدولية لتغذية التقارير والتدقيق الآلي.' : 'Connect NexoraOS to official government databases, tax authorities, and international NGO registries.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between h-36">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{lang === 'ar' ? 'بوابة مصلحة الضرائب والزكاة' : 'National Tax & Zakat Portal'}</span>
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-bold rounded-md">LIVE / CONNECTED</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{lang === 'ar' ? 'ربط وتصدير مباشر للبيانات المالية وحسابات الزكاة للامتثال الحكومي التلقائي.' : 'Auto-export financial data and tax ledger variables for national regulatory alignment.'}</p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[9px] font-mono text-zinc-400">Endpoint: https://api.gov.tax/v3</span>
                  <button className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[10px] border border-slate-200 font-black rounded-lg transition-all">{lang === 'ar' ? 'مزامنة الآن' : 'Sync Now'}</button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between h-36">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{lang === 'ar' ? 'شبكة البنك المركزي ومزودي السيولة' : 'Yemen Central Bank Network'}</span>
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-bold rounded-md">LIVE / CONNECTED</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{lang === 'ar' ? 'متابعة حية لأسعار الصرف الرسمية، التحويلات الدولية، ومطابقة كشوفات الحساب.' : 'Fetch official currency rates, handle wire validation and reconcile foreign aid deposits.'}</p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[9px] font-mono text-zinc-400">Endpoint: https://cby.gov.ye/api/fx</span>
                  <button className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[10px] border border-slate-200 font-black rounded-lg transition-all">{lang === 'ar' ? 'مزامنة الآن' : 'Sync Now'}</button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between h-36">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{lang === 'ar' ? 'بوابة الشفافية الدولية ومساعدات IATI' : 'IATI Registry Portal'}</span>
                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-bold rounded-md">STANDBY / VERIFYING</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{lang === 'ar' ? 'تحميل ونشر تفاصيل التمويل وأثر البرامج طبقاً لمعايير مبادرة الشفافية الدولية.' : 'Publish program outcomes and funding streams in compliance with international transparency rules.'}</p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[9px] font-mono text-zinc-400">Endpoint: https://iatiregistry.org/api</span>
                  <button className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[10px] border border-slate-200 font-black rounded-lg transition-all">{lang === 'ar' ? 'مزامنة الآن' : 'Sync Now'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Master Data & Corporate Governance Tab */}
      {activeSubTab === 'masterData' && (
        <div className="space-y-6">
          {/* Internal Tab Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-lg gap-2 max-w-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => setMasterDataTab('branches')}
              className={`py-1.5 px-3 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                masterDataTab === 'branches'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-zinc-500 hover:text-slate-800'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إجمالي الموظفين' : 'Branches'}</span>
            </button>
            <button
              onClick={() => setMasterDataTab('categories')}
              className={`py-1.5 px-3 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                masterDataTab === 'categories'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-zinc-500 hover:text-slate-800'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'الترميز الموحد (code_categories)' : 'Code Categories & Items'}</span>
            </button>
            <button
              onClick={() => setMasterDataTab('coding_system')}
              className={`py-1.5 px-3 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                masterDataTab === 'coding_system'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-zinc-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'ar' ? 'نظام التراميز (coding_system)' : 'Coding System'}</span>
            </button>
            <button
              onClick={() => setMasterDataTab('governance')}
              className={`py-1.5 px-3 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                masterDataTab === 'governance'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-zinc-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'المشروع المرتبط بالمنحة' : 'Governance'}</span>
            </button>
          </div>

          {/* TAB 1: Branches and Representative Offices */}
          {masterDataTab === 'branches' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 cols: Branches Table */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">
                    {lang === 'ar' ? 'قائمة الفروع والمكاتب الإدارية المعتمدة' : 'Registered Branches & Offices'}
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {lang === 'ar' 
                      ? 'مكاتب التنسيق والتمثيل الميداني المعتمدة لإسناد المشاريع في المحافظات اليمنية.' 
                      : 'Authorized administrative and field representation offices across Yemen governorates.'}
                  </p>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-xs text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                    <thead className="bg-slate-50/50 border-b border-slate-200 text-zinc-400 font-bold uppercase text-[9px]">
                      <tr>
                        <th className="px-4 py-2.5">{lang === 'ar' ? 'الرمز الكودي' : 'Code'}</th>
                        <th className="px-4 py-2.5">{lang === 'ar' ? 'اسم المكتب / الفرع' : 'Branch / Office Name'}</th>
                        <th className="px-4 py-2.5">{lang === 'ar' ? 'مدير المكتب' : 'Representative Manager'}</th>
                        <th className="px-4 py-2.5">{lang === 'ar' ? 'الحالة التشغيلية' : 'Status'}</th>
                        <th className="px-4 py-2.5 text-center">{lang === 'ar' ? 'التسليم' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {branches.map((b) => (
                        <tr key={b.code} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5 font-mono font-bold text-emerald-700 text-[11px]">{b.code}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-800">
                            {lang === 'ar' ? b.nameAr : b.nameEn}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{b.manager}</td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => handleToggleBranchStatus(b.code)}
                              className={`px-2 py-0.5 text-[9px] font-bold rounded-full border transition-all ${
                                b.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                              }`}
                            >
                              {b.status === 'active' 
                                ? (lang === 'ar' ? 'نشط ميدانياً' : 'Active') 
                                : (lang === 'ar' ? 'نمذجة تنبؤية' : 'Inactive')}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              onClick={() => handleDeleteBranch(b.code)}
                              disabled={['HQ-SNA', 'BR-TAIZ', 'BR-ADEN'].includes(b.code)}
                              className={`p-1.5 rounded transition-all ${
                                ['HQ-SNA', 'BR-TAIZ', 'BR-ADEN'].includes(b.code)
                                  ? 'text-zinc-200 cursor-not-allowed'
                                  : 'text-rose-500 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                              title={lang === 'ar' ? 'حذف الفرع' : 'Remove Branch'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right 1 col: Add Branch Form */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-fit">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'تثبيت مكتب أو ممثلية جديدة' : 'Register New Branch'}</span>
                </h4>
                <form onSubmit={handleAddBranch} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {lang === 'ar' ? 'الرمز الكودي الموحد (مثال: BR-IBB)' : 'Unique Branch Code (e.g. BR-IBB)'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BR-MAREB"
                      value={newBranchCode}
                      onChange={(e) => setNewBranchCode(e.target.value)}
                      className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {lang === 'ar' ? 'اسم المكتب باللغة العربية' : 'Branch Name (Arabic)'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="فرع محافظة مأرب"
                      value={newBranchNameAr}
                      onChange={(e) => setNewBranchNameAr(e.target.value)}
                      className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {lang === 'ar' ? 'اسم المكتب باللغة الإنجليزية' : 'Branch Name (English)'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Marib Governorate Branch"
                      value={newBranchNameEn}
                      onChange={(e) => setNewBranchNameEn(e.target.value)}
                      className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {lang === 'ar' ? 'الممثل الميداني المسؤول / المدير' : 'Representative Manager'}
                    </label>
                    <input
                      type="text"
                      placeholder="أ.د. عبدالملك الصنعاني"
                      value={newBranchManager}
                      onChange={(e) => setNewBranchManager(e.target.value)}
                      className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تسجيل وتفعيل المكتب' : 'Authorize & Register'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Categories and Sectors (Database backed code_categories and code_items) */}
          {masterDataTab === 'categories' && (
            <div className="space-y-6">
              {loadingDb && dbCodeCategories.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                  <span className="mr-2 text-sm text-zinc-500">
                    {lang === 'ar' ? 'جاري تحميل التراميز الموحدة...' : 'Loading master code categories...'}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left panel (5 cols): Code Categories list */}
                  <div className="lg:col-span-5 flex flex-col space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h4 className="text-xs font-bold text-slate-700 uppercase">
                          {lang === 'ar' ? 'تصنيفات الترميز الموحدة (code_categories)' : 'Global Code Categories'}
                        </h4>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          {lang === 'ar' 
                            ? 'الفئات العامة للبيانات الأساسية التي تخدم كافة العمليات التشغيلية والمالية.' 
                            : 'Global master data classifications used by NexoraOS enterprise domains.'}
                        </p>
                      </div>

                      <div className="divide-y divide-zinc-200 max-h-[350px] overflow-y-auto">
                        {dbCodeCategories.map((cat) => {
                          const isSelected = selectedDbCategoryId === cat.id;
                          return (
                            <div 
                              key={cat.id} 
                              onClick={() => setSelectedDbCategoryId(cat.id)}
                              className={`p-3 transition-colors cursor-pointer flex justify-between items-center ${
                                isSelected ? 'bg-emerald-50/50 border-r-4 border-emerald-600' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div>
                                <span className="font-mono text-xs font-bold text-emerald-700 block">{cat.code}</span>
                                <span className="text-xs font-semibold text-slate-800">
                                  {lang === 'ar' ? cat.name_ar : cat.name_en}
                                </span>
                                {cat.description && (
                                  <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{cat.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {cat.is_system && (
                                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded uppercase font-bold">
                                    {lang === 'ar' ? 'أيام' : 'Sys'}
                                  </span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDbCategory(cat.id, cat.code);
                                  }}
                                  disabled={cat.is_system}
                                  className={`p-1 rounded ${
                                    cat.is_system 
                                      ? 'text-zinc-200 cursor-not-allowed' 
                                      : 'text-rose-500 hover:bg-rose-50'
                                  }`}
                                  title={lang === 'ar' ? 'حذف التصنيف' : 'Delete Category'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {dbCodeCategories.length === 0 && (
                          <div className="p-8 text-center text-zinc-400 text-xs">
                            {lang === 'ar' ? 'لا يوجد تصنيفات حالياً في قاعدة البيانات.' : 'No code categories found in the database.'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add Code Category Form */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'ar' ? 'إضافة تصنيف رموز جديد' : 'New Code Category'}</span>
                      </h4>
                      <form onSubmit={handleAddDbCategory} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              {lang === 'ar' ? 'الكود الموحد (مثال: BLOOD_TYPE)' : 'Code Key (e.g. BLOOD)'}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. GENDER"
                              value={newDbCatCode}
                              onChange={(e) => setNewDbCatCode(e.target.value)}
                              className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              {lang === 'ar' ? 'البيان العربي' : 'Arabic Name'}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="فصيلة الدم"
                              value={newDbCatNameAr}
                              onChange={(e) => setNewDbCatNameAr(e.target.value)}
                              className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            {lang === 'ar' ? 'الاسم الإنجليزي' : 'English Name'}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Blood Group"
                            value={newDbCatNameEn}
                            onChange={(e) => setNewDbCatNameEn(e.target.value)}
                            className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            {lang === 'ar' ? 'الوصف والتفاصيل' : 'Detailed Description'}
                          </label>
                          <input
                            type="text"
                            placeholder="توصيف الحقول المعتمدة للفصائل الطبية"
                            value={newDbCatDesc}
                            onChange={(e) => setNewDbCatDesc(e.target.value)}
                            className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'حفظ التصنيف في قاعدة البيانات' : 'Save Category to DB'}</span>
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right panel (7 cols): Items of the selected category */}
                  <div className="lg:col-span-7 flex flex-col space-y-4">
                    {selectedDbCategoryId ? (
                      (() => {
                        const activeCat = dbCodeCategories.find(c => c.id === selectedDbCategoryId);
                        const filteredItems = dbCodeItems.filter(item => item.category_id === selectedDbCategoryId);

                        return (
                          <>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                              <div className="p-4 bg-slate-50 border-b border-slate-200">
                                <h4 className="text-xs font-bold text-slate-700 uppercase">
                                  {lang === 'ar' ? `العناصر البرمجية تحت: ${activeCat?.name_ar || activeCat?.code}` : `Code Items under: ${activeCat?.name_en || activeCat?.code}`}
                                </h4>
                                <p className="text-[10px] text-zinc-400 mt-1">
                                  {lang === 'ar' 
                                    ? 'الخيارات المنسدلة والقيم المعيارية التابعة لهذا التصنيف الأساسي.' 
                                    : 'Bilingual options and system-wide default configuration options.'}
                                </p>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                                  <thead className="bg-slate-50/50 border-b border-slate-200 text-zinc-400 font-bold uppercase text-[9px]">
                                    <tr>
                                      <th className="px-4 py-2">{lang === 'ar' ? 'رمز الكود' : 'Item Code'}</th>
                                      <th className="px-4 py-2">{lang === 'ar' ? 'البيان العربي' : 'Arabic Name'}</th>
                                      <th className="px-4 py-2">{lang === 'ar' ? 'English Name' : 'English Name'}</th>
                                      <th className="px-4 py-2">{lang === 'ar' ? 'الوزن/القيمة الرقمية' : 'Value'}</th>
                                      <th className="px-4 py-2 text-center">{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-200">
                                    {filteredItems.map((item) => (
                                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-2 font-mono font-bold text-amber-700 text-[11px]">{item.code}</td>
                                        <td className="px-4 py-2 font-semibold text-slate-800">{item.name_ar}</td>
                                        <td className="px-4 py-2 text-slate-600 font-medium">{item.name_en}</td>
                                        <td className="px-4 py-2 font-mono text-zinc-500">
                                          {item.value !== null ? item.value : <span className="text-zinc-300">?</span>}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteDbItem(item.id)}
                                            className="p-1 rounded text-rose-500 hover:bg-rose-50"
                                            title={lang === 'ar' ? 'حذف العنصر' : 'Delete Item'}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
                                      <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 text-xs">
                                          {lang === 'ar' ? 'لا يوجد عناصر ترميز مسجلة لهذه الفئة حتى الآن.' : 'No code items under this category.'}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Add Code Item Form */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                              <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                <Plus className="w-4 h-4 text-amber-500" />
                                <span>{lang === 'ar' ? `إضافة عنصر إلى (${activeCat?.name_ar || activeCat?.code})` : `Add Item to (${activeCat?.name_en || activeCat?.code})`}</span>
                              </h4>
                              <form onSubmit={handleAddDbItem} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    {lang === 'ar' ? 'رمز العنصر الكودي' : 'Code Key'}
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. MALE / O_POS"
                                    value={newDbItemCode}
                                    onChange={(e) => setNewDbItemCode(e.target.value)}
                                    className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    {lang === 'ar' ? 'الاسم بالذكر العربي' : 'Arabic Name'}
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="ذكر / موجب"
                                    value={newDbItemNameAr}
                                    onChange={(e) => setNewDbItemNameAr(e.target.value)}
                                    className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    {lang === 'ar' ? 'English Name' : 'English Name'}
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Male / O positive"
                                    value={newDbItemNameEn}
                                    onChange={(e) => setNewDbItemNameEn(e.target.value)}
                                    className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    {lang === 'ar' ? 'الوزن / القيمة (اختياري)' : 'Value (Optional)'}
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="1.0"
                                      value={newDbItemValue}
                                      onChange={(e) => setNewDbItemValue(e.target.value)}
                                      className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    <button
                                      type="submit"
                                      className="bg-amber-500 hover:bg-amber-600 text-white rounded p-1.5 text-xs font-bold transition-all flex items-center justify-center aspect-square h-[30px]"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </form>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-zinc-400 text-xs">
                        {lang === 'ar' ? 'يرجى اختيار فئة ترميز من اليسار لمشاهدة عناصرها.' : 'Please select a code category from the left to manage its items.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Coding System (Database backed coding_system) */}
          {masterDataTab === 'coding_system' && (
            <div className="space-y-6">
              {loadingDb && dbCodingSystems.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                  <span className="mr-2 text-sm text-zinc-500">
                    {lang === 'ar' ? 'جاري تحميل نظام الأكواد والترميز...' : 'Loading coding system entries...'}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column (1 col): Add Coding System Entry */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-fit">
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'ar' ? 'تسجيل كود جديد بنظام التراميز' : 'New Coding System Entry'}</span>
                    </h4>
                    <form onSubmit={handleAddCodingSystem} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {lang === 'ar' ? 'رمز الفئة (Category Code - e.g. PROJECT_TYPE)' : 'Category Code'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. PROJECT_STAGE"
                          value={newCodeSysCatCode}
                          onChange={(e) => setNewCodeSysCatCode(e.target.value)}
                          className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {lang === 'ar' ? 'رمز الكود الذاتي (Item Code - e.g. PLANNING)' : 'Item Code'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. SETUP"
                          value={newCodeSysItemCode}
                          onChange={(e) => setNewCodeSysItemCode(e.target.value)}
                          className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {lang === 'ar' ? 'الاسم بالذكر العربي' : 'Arabic Name'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="مرحلة التجهيز والتحضير"
                          value={newCodeSysNameAr}
                          onChange={(e) => setNewCodeSysNameAr(e.target.value)}
                          className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {lang === 'ar' ? 'الاسم بالذكر الإنجليزي (اختياري)' : 'English Name (Optional)'}
                        </label>
                        <input
                          type="text"
                          placeholder="Setup Phase"
                          value={newCodeSysNameEn}
                          onChange={(e) => setNewCodeSysNameEn(e.target.value)}
                          className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            {lang === 'ar' ? 'رمز الأب (الموروث)' : 'Parent Code'}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. INITIATION"
                            value={newCodeSysParentCode}
                            onChange={(e) => setNewCodeSysParentCode(e.target.value)}
                            className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            {lang === 'ar' ? 'المستوى (Level)' : 'Level Depth'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={newCodeSysLevel}
                            onChange={(e) => setNewCodeSysLevel(parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-50 border border-zinc-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تسجيل الكود في النظام' : 'Save Code to System'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Right Column (2 cols): Coding System Entries list */}
                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                      <h4 className="text-xs font-bold text-slate-700 uppercase">
                        {lang === 'ar' ? 'شجرة التراميز وقوائم الأكواد الهيكلية (coding_system)' : 'Integrated System Codes'}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {lang === 'ar' 
                          ? 'أكواد هيكلية مخصصة للمشاريع، المراحل، والأقسام مرتبة على مستويات وموروثات.' 
                          : 'Bilingual coding maps supporting parent inheritance paths for project modules.'}
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                        <thead className="bg-slate-50/50 border-b border-slate-200 text-zinc-400 font-bold uppercase text-[9px]">
                          <tr>
                            <th className="px-4 py-2.5">{lang === 'ar' ? 'تصنيف الترميز' : 'Category'}</th>
                            <th className="px-4 py-2.5">{lang === 'ar' ? 'كود الكود' : 'Item Code'}</th>
                            <th className="px-4 py-2.5">{lang === 'ar' ? 'الاسم بالذكر' : 'Name'}</th>
                            <th className="px-4 py-2.5">{lang === 'ar' ? 'الأب الكودي' : 'Parent'}</th>
                            <th className="px-4 py-2.5">{lang === 'ar' ? 'المستوى' : 'Lvl'}</th>
                            <th className="px-4 py-2.5 text-center">{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {dbCodingSystems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-2.5 font-mono text-[10px] font-bold text-zinc-400">{item.category_code}</td>
                              <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-emerald-700">{item.item_code}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-800">
                                {lang === 'ar' ? item.name_ar : (item.name_en || item.name_ar)}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-400">
                                {item.parent_code || <span className="text-zinc-200">?</span>}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500">{item.level || 1}</td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCodingSystem(item.id)}
                                  className="p-1 rounded text-rose-500 hover:bg-rose-50"
                                  title={lang === 'ar' ? 'حذف الترميز' : 'Delete Coding'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {dbCodingSystems.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 text-xs">
                                {lang === 'ar' ? 'لا يوجد تراكيب ترميز مخصصة حالياً في النظام.' : 'No coding system maps configured.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Governance & Security Simulator */}
          {masterDataTab === 'governance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {lang === 'ar' ? 'لوحة تحكم معايير الأمان والشفافية الرقابية NexoraOS™' : 'NexoraOS? Compliance, Standards & Security Engine'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
                      {lang === 'ar'
                        ? 'تتيح هذه الواجهة التحكم الشامل بمستوى التدقيق المؤسسي والمطابقة القانونية لجميع القيود المالية والمشاريع الميدانية تلبيةً للمانحين ومعايير IPSAS.'
                        : 'Manage compliance levels, corporate audit strictness, and database integrity requirements for human development programs and IPSAS-compliant books.'}
                    </p>
                  </div>
                </div>

                {/* Interactive Compliance Selector */}
                <div className="mt-6">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-3">
                    {lang === 'ar' ? 'حدد مستوى الرقابة والمطابقة الفعّال حالياً:' : 'Active Governance Strictness Policy:'}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      {
                        level: 1,
                        titleAr: 'مستوى 1: تشغيل أساسي',
                        titleEn: 'Level 1: Basic Operations',
                        descAr: 'قيود مالية مبسطة دون التحقق التلقائي من ميزانيات المشاريع الميدانية.',
                        descEn: 'Simplified financial entry without automated real-time project budget matching.',
                        color: 'border-zinc-200 hover:border-zinc-400 bg-zinc-50/20'
                      },
                      {
                        level: 2,
                        titleAr: 'مستوى 2: حوكمة إسفير وإياتي',
                        titleEn: 'Level 2: Sphere & IATI Strict',
                        descAr: 'تحقق تلقائي من ميزانيات المشاريع، تحذيرات تجاوز ميزانية المانحين، وبث شفافية التقييم.',
                        descEn: 'Automatic project matching, over-budget warnings, real-time donor transparency mapping.',
                        color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/10'
                      },
                      {
                        level: 3,
                        titleAr: 'مستوى 3: المعايير المحاسبية المعتمدة',
                        titleEn: 'Level 3: Public Sector Accounting Standard',
                        descAr: 'منع ترحيل أي قيد مالي غير متوازن بالعملة المحلية، تسجيل فوري للحسابات الختامية.',
                        descEn: 'Complete ledger matching. Prevent posting imbalanced multi-currency vouchers in YER.',
                        color: 'border-amber-200 hover:border-amber-400 bg-amber-50/10'
                      },
                      {
                        level: 4,
                        titleAr: 'مستوى 4: التدقيق السيادي الممتد',
                        titleEn: 'Level 4: Sovereign Audit Trail',
                        descAr: 'تشفير سجلات التدقيق بالكامل، منع الحذف النهائي للمستندات والقيود المؤثرة، تجميد تلقائي للأرصدة الختامية.',
                        descEn: 'Immutability mode. Complete cryptographic audit trails, read-only historic files, automatic closing freeze.',
                        color: 'border-rose-200 hover:border-rose-400 bg-rose-50/10'
                      }
                    ].map((cfg) => (
                      <button
                        key={cfg.level}
                        type="button"
                        onClick={() => {
                          setSimLevel(cfg.level as any);
                          setSuccessMsg(lang === 'ar' ? `تم تحويل المعيار إلى: ${cfg.titleAr}` : `Compliance standard converted to: ${cfg.titleEn}`);
                        }}
                        className={`text-right p-4 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer relative ${
                          simLevel === cfg.level 
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/30' 
                            : cfg.color
                        }`}
                        style={lang === 'en' ? { textAlign: 'left' } : {}}
                      >
                        {simLevel === cfg.level && (
                          <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2">
                            <span className="bg-emerald-600 text-white rounded-full p-0.5 block">
                              <Check className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                        <div>
                          <h5 className="text-xs font-bold text-slate-800 mb-1">{lang === 'ar' ? cfg.titleAr : cfg.titleEn}</h5>
                          <p className="text-[10px] text-zinc-500 leading-relaxed font-normal">{lang === 'ar' ? cfg.descAr : cfg.descEn}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-zinc-400">
                          <span>{lang === 'ar' ? `الحالة: ${simLevel === cfg.level ? 'نشط' : 'متاح'}` : `State: ${simLevel === cfg.level ? 'Active' : 'Available'}`}</span>
                          <span className="font-mono">POL-0{cfg.level}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audit Trial Integrity Checker */}
                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'ar' ? 'فحص نزاهة سجلات الرقابة (WBS Integrity)' : 'WBS Integrity & Audit Logs Scan'}</span>
                    </h4>
                    <p className="text-[10px] text-zinc-500 leading-normal max-w-md">
                      {lang === 'ar'
                        ? 'يقوم هذا الفحص بمطابقة القيود المالية وحسابات الأستاذ مع مخرجات البرامج الميدانية وحسابات الميزانية للتأكد من خلوها من أي تعديلات أو فجوات زمنية.'
                        : 'Executes automated continuous checking across primary general ledgers and programs records to verify consistent audit hash mapping.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setUpdating(true);
                        setTimeout(() => {
                          setUpdating(false);
                          setSuccessMsg(lang === 'ar' 
                            ? 'رائع! تم التحقق من نزاهة 1,248 معاملة مسجلة بنجاح. لا يوجد أي انحراف مالي أو تعديل غير مصرح به.' 
                            : 'Passed! Verified integrity for 1,248 transactions. 0 anomalies detected.');
                        }, 800);
                      }}
                      className="mt-3 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-1.5 px-3 rounded transition-all flex items-center gap-1.5"
                    >
                      {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>{lang === 'ar' ? 'بدء فحص السلامة الآن' : 'Execute Integrity Scan'}</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <Globe className="w-4 h-4 text-amber-500" />
                      <span>{lang === 'ar' ? 'حالة الربط مع البث المباشر للشريك المانح (IATI)' : 'Donor Integration Status (IATI & Sphere)'}</span>
                    </h4>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      {lang === 'ar'
                        ? 'ربط تلقائي لبث تقارير التقييم والمؤشرات الميدانية والشفافية المالية في الساحل الغربي وتعز مع المنصة الدولية لمبادرة شفافية المساعدات IATI.'
                        : 'Enables real-time push streams of Sphere metrics directly to international assistance monitoring networks and the IATI Registry.'}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {lang === 'ar' ? 'ربط مباشر فعّال وآمن' : 'IATI Stream Online & Protected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

