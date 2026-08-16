import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Clock, 
  User, 
  Database, 
  Cpu, 
  Key, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Activity,
  UserCheck,
  Settings,
  Shield,
  Play,
  Pause,
  Download,
  Filter,
  Layers,
  Scale,
  Zap,
  Eye,
  X,
  ArrowUpRight,
  Sliders,
  Sparkles,
  Calendar,
  DollarSign,
  CheckCircle2,
  MapPin,
  Laptop,
  ArrowRightLeft,
  PieChart as PieIcon,
  BarChart2,
  Printer,
  Flame
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Workspace } from './enterprise/shell/Workspace';
import { WidgetFrame } from './enterprise/widgets/WidgetFrame';
import { EnterpriseDataGrid, ColumnDef } from './enterprise/tables/EnterpriseDataGrid';
import { PerformanceProfilerTab } from './PerformanceProfilerTab';

export type ActionType = 
  | 'all'
  | 'budget_update' 
  | 'role_change' 
  | 'voucher_approval' 
  | 'beneficiary_edit' 
  | 'system_config' 
  | 'security_event' 
  | 'sponsorship_update'
  | 'SIGN'
  | 'UPDATE'
  | 'DELETE'
  | (string & {});

export interface AuditLogItem {
  id: string;
  user_email: string;
  user_name: string;
  user_role: string;
  action_type: ActionType;
  action_ar: string;
  action_en: string;
  module: 'finance' | 'projects' | 'sponsorships' | 'admin' | 'security' | 'beneficiaries';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address: string;
  location: string;
  timestamp: string;
  status: 'success' | 'failed' | 'flagged';
  target_resource: string;
  user_agent?: string;
  changes_before?: Record<string, any>;
  changes_after?: Record<string, any>;
}

interface AuditLogsViewProps {
  lang: 'ar' | 'en';
}

export default function AuditLogsView({ lang }: AuditLogsViewProps) {
  // Real-time state
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [liveCounter, setLiveCounter] = useState(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<ActionType>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Detail Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Active View Mode (Table vs Analytics vs Performance Profiler)
  const [viewMode, setViewMode] = useState<'grid' | 'analytics' | 'profiler'>('grid');

  // Initial Seed Data
  const initialAuditLogs: AuditLogItem[] = useMemo(() => [
    {
      id: 'AUD-2026-0091',
      user_email: 'admin@rohamaab.org',
      user_name: 'د. خالد العمري',
      user_role: 'مدير النظام التنفيذي',
      action_type: 'budget_update',
      action_ar: 'تعديل وزيادة الموازنة المعتمدة لمشروع الآبار الارتوازية - تعز',
      action_en: 'Updated and increased approved operational budget for Artesian Wells Project - Taiz',
      module: 'finance',
      severity: 'critical',
      ip_address: '10.0.0.12',
      location: 'صنعاء، اليمن (Sanaa, YE)',
      timestamp: new Date().toISOString(),
      status: 'success',
      target_resource: 'PRJ-2026-0881',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
      changes_before: {
        project_code: 'PRJ-2026-0881',
        approved_budget: '$100,000 USD',
        currency: 'USD',
        status: 'Approved',
        approved_by: 'Financial Officer'
      },
      changes_after: {
        project_code: 'PRJ-2026-0881',
        approved_budget: '$145,000 USD',
        currency: 'USD',
        status: 'Revised & Approved',
        approved_by: 'Executive Director'
      }
    },
    {
      id: 'AUD-2026-0090',
      user_email: 'hr@rohamaab.org',
      user_name: 'أ. مريم البعداني',
      user_role: 'مديرة الموارد البشرية والحوكمة',
      action_type: 'role_change',
      action_ar: 'ترقية صلاحيات المستخدم أحمد الحكيمي إلى مدير المشتريات والعقود',
      action_en: 'Escalated user permissions for Ahmed Al-Hakimi to Procurement Director',
      module: 'admin',
      severity: 'high',
      ip_address: '192.168.1.15',
      location: 'عدن، اليمن (Aden, YE)',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'success',
      target_resource: 'USER-9921',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      changes_before: {
        user_email: 'a.hakimi@rohamaab.org',
        role_title: 'Procurement Officer',
        can_approve_vouchers: false,
        max_financial_limit: '5,000,000 YER'
      },
      changes_after: {
        user_email: 'a.hakimi@rohamaab.org',
        role_title: 'Procurement Director',
        can_approve_vouchers: true,
        max_financial_limit: '50,000,000 YER'
      }
    },
    {
      id: 'AUD-2026-0089',
      user_email: 'accountant@rohamaab.org',
      user_name: 'أ. ياسر الصعدي',
      user_role: 'رئيس قسم المحاسبة العامة',
      action_type: 'voucher_approval',
      action_ar: 'اعتماد وترحيل سند صرف إغاثي رقم PV-2026-092 بمبلغ 8,500,000 ريال يمني',
      action_en: 'Approved and posted payment voucher #PV-2026-092 for YER 8,500,000',
      module: 'finance',
      severity: 'medium',
      ip_address: '10.0.0.45',
      location: 'صنعاء، اليمن (Sanaa, YE)',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      status: 'success',
      target_resource: 'VOUCHER-PV-2026-092',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/125.0.0.0',
      changes_before: {
        voucher_no: 'PV-2026-092',
        status: 'Draft Pending Review',
        is_posted: false,
        amount_yer: '8,500,000'
      },
      changes_after: {
        voucher_no: 'PV-2026-092',
        status: 'Approved & Posted to Ledger',
        is_posted: true,
        journal_entry_hash: '0x8A92F1C4'
      }
    },
    {
      id: 'AUD-2026-0088',
      user_email: 'supervisor@rohamaab.org',
      user_name: 'م. فؤاد العريقي',
      user_role: 'مشرف قطاع الكفالات والأيتام',
      action_type: 'beneficiary_edit',
      action_ar: 'تحديث بيانات الحساب البنكي والهوية الوطنية للمستفيد الأيتام #BEN-3392',
      action_en: 'Updated National ID & IBAN Bank account for Orphan Beneficiary #BEN-3392',
      module: 'beneficiaries',
      severity: 'high',
      ip_address: '10.0.0.88',
      location: 'الحديدة، اليمن (Hodeidah, YE)',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      status: 'success',
      target_resource: 'BEN-3392',
      user_agent: 'Mozilla/5.0 (Linux; Android 14) Chrome/124.0.0.0',
      changes_before: {
        beneficiary_id: 'BEN-3392',
        national_id: '102****88',
        bank_name: 'CAC Bank',
        iban: 'YE33****1002'
      },
      changes_after: {
        beneficiary_id: 'BEN-3392',
        national_id: '1029831988',
        bank_name: 'Tadhamon Islamic Bank',
        iban: 'YE33TIBY001002883'
      }
    },
    {
      id: 'AUD-2026-0087',
      user_email: 'unknown@external.net',
      user_name: 'مجهول (حساب غير مسجل)',
      user_role: 'ضيف خاريجي',
      action_type: 'security_event',
      action_ar: 'تنبيه أمني: محاولات دخول فاشلة متكررة مع توقيع هجوم Brute-Force',
      action_en: 'Security alert: Multiple failed login attempts with brute-force signature',
      module: 'security',
      severity: 'critical',
      ip_address: '45.12.34.8',
      location: 'فرانكفورت، ألمانيا (Frankfurt, DE)',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      status: 'failed',
      target_resource: 'AUTH-GATEWAY',
      user_agent: 'Python-requests/2.31.0 SecurityScanner',
      changes_before: {
        failed_attempts: 1,
        ip_status: 'Allowed'
      },
      changes_after: {
        failed_attempts: 6,
        ip_status: 'Blocked for 15 minutes',
        action_taken: 'Rate limiter activated & SSL challenge enforced'
      }
    },
    {
      id: 'AUD-2026-0086',
      user_email: 'system.engine@rohamaab.org',
      user_name: 'المحرك الآلي Neon DB',
      user_role: 'خادم قاعدة البيانات المؤسسية',
      action_type: 'system_config',
      action_ar: 'تحديث قواعد أمان قاعدة البيانات Neon PostgreSQL وتطبيق شهادة SSL العالية',
      action_en: 'Updated Neon PostgreSQL database security rules and enforced SSL policy',
      module: 'admin',
      severity: 'medium',
      ip_address: '10.0.0.2',
      location: 'سيرفرات السحابة - المانيا (Cloud Run)',
      timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
      status: 'success',
      target_resource: 'SYS-NEON-CFG',
      user_agent: 'NexoraOS-Internal-Daemon/2.4',
      changes_before: {
        ssl_mode: 'prefer',
        connection_limit: 50,
        allowed_ips: ['10.0.0.0/24']
      },
      changes_after: {
        ssl_mode: 'require',
        connection_limit: 100,
        allowed_ips: ['10.0.0.0/24', '192.168.1.0/24']
      }
    },
    {
      id: 'AUD-2026-0085',
      user_email: 'sponsorships@rohamaab.org',
      user_name: 'أ. فاطمة الذاري',
      user_role: 'مديرة العلاقات والكفلاء',
      action_type: 'sponsorship_update',
      action_ar: 'تعديل منحة كفالة الأيتام الشهرية المقدمة من جمعية الإغاثة الكويتية',
      action_en: 'Updated monthly orphan sponsorship grant provided by Kuwait Relief Foundation',
      module: 'sponsorships',
      severity: 'low',
      ip_address: '10.0.0.19',
      location: 'صنعاء، اليمن (Sanaa, YE)',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      status: 'success',
      target_resource: 'SPON-8812',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
      changes_before: {
        donor_name: 'Kuwait Relief Foundation',
        monthly_amount_usd: '$150',
        beneficiaries_covered: 10
      },
      changes_after: {
        donor_name: 'Kuwait Relief Foundation',
        monthly_amount_usd: '$200',
        beneficiaries_covered: 12
      }
    }
  ], []);

  // Fetch / Init
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLogs(initialAuditLogs);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [initialAuditLogs]);

  // Real-time Stream simulation effect
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      // Pick random simulated event
      const sampleEvents: Partial<AuditLogItem>[] = [
        {
          action_type: 'budget_update',
          action_ar: 'تحديث موازنة مشروع السلال الغذائية الطارئة - مارب',
          action_en: 'Updated budget allocation for Emergency Food Baskets - Marib',
          module: 'finance',
          severity: 'high',
          target_resource: 'PRJ-MARIB-2026',
          user_email: 'finance.lead@rohamaab.org',
          user_name: 'أ. طارق الشامي',
          user_role: 'مدير الميزانيات',
          changes_before: { budget: '$50,000 USD' },
          changes_after: { budget: '$65,000 USD' }
        },
        {
          action_type: 'role_change',
          action_ar: 'تعديل صلاحيات الوصول المباشر لجداول المالية',
          action_en: 'Modified direct access permissions for financial ledgers',
          module: 'admin',
          severity: 'critical',
          target_resource: 'ACL-FINANCE-ROLE',
          user_email: 'admin@rohamaab.org',
          user_name: 'د. خالد العمري',
          user_role: 'مدير النظام التنفيذي',
          changes_before: { permission_level: 'Read-Only' },
          changes_after: { permission_level: 'Full Edit & Post' }
        },
        {
          action_type: 'voucher_approval',
          action_ar: 'اعتماد قيد تسوية للمصروفات النثرية الإدارية',
          action_en: 'Approved reconciliation voucher for administrative petty cash',
          module: 'finance',
          severity: 'low',
          target_resource: 'VOUCHER-JV-8821',
          user_email: 'accountant@rohamaab.org',
          user_name: 'أ. ياسر الصعدي',
          user_role: 'رئيس قسم المحاسبة',
          changes_before: { amount: '450,000 YER' },
          changes_after: { amount: '450,000 YER', posted: true }
        }
      ];

      const picked = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
      const newId = `AUD-2026-${Math.floor(100 + Math.random() * 900)}`;

      const newItem: AuditLogItem = {
        id: newId,
        user_email: picked.user_email || 'system@rohamaab.org',
        user_name: picked.user_name || 'صباحاً ومساءً',
        user_role: picked.user_role || 'مسؤول النشاط',
        action_type: picked.action_type || 'system_config',
        action_ar: picked.action_ar || 'إجراء آلي في النظام',
        action_en: picked.action_en || 'Automated system event',
        module: picked.module || 'finance',
        severity: picked.severity || 'medium',
        ip_address: `10.0.0.${Math.floor(2 + Math.random() * 200)}`,
        location: 'صنعاء، اليمن (Sanaa, YE)',
        timestamp: new Date().toISOString(),
        status: 'success',
        target_resource: picked.target_resource || 'RES-AUTO',
        user_agent: 'Mozilla/5.0 (NexoraOS-RealtimeAgent)',
        changes_before: picked.changes_before,
        changes_after: picked.changes_after
      };

      setLogs(prev => [newItem, ...prev]);
      setLiveCounter(c => c + 1);
    }, 12000); // Add a live record every 12 seconds when streaming is active

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Manual Event Injection trigger for user testing
  const triggerSimulatedAction = (type: ActionType) => {
    let newItem: AuditLogItem;
    const nowIso = new Date().toISOString();
    const newId = `AUD-LIVE-${Math.floor(1000 + Math.random() * 9000)}`;

    switch (type) {
      case 'budget_update':
        newItem = {
          id: newId,
          user_email: 'admin@rohamaab.org',
          user_name: 'د. خالد العمري (محاكاة فورية)',
          user_role: 'مدير النظام التنفيذي',
          action_type: 'budget_update',
          action_ar: 'تحديث فوري للموازنة التقديرية لمشروع مركز الأورام الطبية',
          action_en: 'Instant budget revision for Medical Oncology Center Project',
          module: 'finance',
          severity: 'critical',
          ip_address: '10.0.0.12',
          location: 'صنعاء، اليمن (Realtime Test)',
          timestamp: nowIso,
          status: 'success',
          target_resource: 'PRJ-ONCO-2026',
          user_agent: 'Mozilla/5.0 Chrome Realtime Simulator',
          changes_before: { budget_allocated: '$250,000 USD', approved: false },
          changes_after: { budget_allocated: '$310,000 USD', approved: true, auditor_note: 'Instant budget boost approved' }
        };
        break;
      case 'role_change':
        newItem = {
          id: newId,
          user_email: 'hr@rohamaab.org',
          user_name: 'أ. مريم البعداني (محاكاة صلاحيات)',
          user_role: 'مديرة الموارد البشرية',
          action_type: 'role_change',
          action_ar: 'تعديل مصفوفة الصلاحيات والحوكمة المالية للمستخدم الحالي',
          action_en: 'Modified governance role matrix & financial authorization limits',
          module: 'admin',
          severity: 'high',
          ip_address: '192.168.1.15',
          location: 'عدن، اليمن (Realtime Test)',
          timestamp: nowIso,
          status: 'success',
          target_resource: 'ACL-MATRIX-01',
          user_agent: 'Mozilla/5.0 Safari Realtime Simulator',
          changes_before: { role: 'Viewer Officer', max_limit: '1,000,000 YER' },
          changes_after: { role: 'Senior Audit Supervisor', max_limit: '100,000,000 YER' }
        };
        break;
      case 'security_event':
        newItem = {
          id: newId,
          user_email: 'security.bot@rohamaab.org',
          user_name: 'نظام الجدار الناري الذكي',
          user_role: 'أمان وتشفير البيانات',
          action_type: 'security_event',
          action_ar: 'تنبيه أمني عالي الخطورة: محاولة تعديل بيانات غير مصرح بها تم حظرها',
          action_en: 'High severity security alert: Unauthorized data mutation attempt blocked',
          module: 'security',
          severity: 'critical',
          ip_address: '185.220.101.5',
          location: 'امستردام، هولندا (Proxy Node)',
          timestamp: nowIso,
          status: 'flagged',
          target_resource: 'SYS-POSTGRES-MUTATION',
          user_agent: 'curl/7.68.0 Automated-Payload',
          changes_before: { access_granted: false },
          changes_after: { access_granted: false, firewall_action: 'IP permanently blacklisted' }
        };
        break;
      default:
        newItem = {
          id: newId,
          user_email: 'accountant@rohamaab.org',
          user_name: 'أ. ياسر الصعدي (اختبار مباشر)',
          user_role: 'المحاسب المسؤول',
          action_type: 'voucher_approval',
          action_ar: 'ترحيل سند صرف فوري لمصروفات الكفالات الميدانية',
          action_en: 'Instant posting of field sponsorship payment voucher',
          module: 'finance',
          severity: 'medium',
          ip_address: '10.0.0.45',
          location: 'صنعاء، اليمن',
          timestamp: nowIso,
          status: 'success',
          target_resource: 'VOUCHER-PV-TEST',
          user_agent: 'Mozilla/5.0 Chrome',
          changes_before: { status: 'Draft' },
          changes_after: { status: 'Posted' }
        };
    }

    setLogs(prev => [newItem, ...prev]);
    setLiveCounter(c => c + 1);
  };

  // Unique list of users for dropdown filter
  const userList = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach(l => map.set(l.user_email, l.user_name));
    return Array.from(map.entries()).map(([email, name]) => ({ email, name }));
  }, [logs]);

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSearch = 
          item.action_ar.toLowerCase().includes(q) ||
          item.action_en.toLowerCase().includes(q) ||
          item.user_name.toLowerCase().includes(q) ||
          item.user_email.toLowerCase().includes(q) ||
          item.ip_address.toLowerCase().includes(q) ||
          item.target_resource.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q);
        
        if (!matchSearch) return false;
      }

      // User filter
      if (selectedUser !== 'all' && item.user_email !== selectedUser) {
        return false;
      }

      // Action type filter
      if (selectedActionType !== 'all' && item.action_type !== selectedActionType) {
        return false;
      }

      // Module filter
      if (selectedModule !== 'all' && item.module !== selectedModule) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'all' && item.severity !== selectedSeverity) {
        return false;
      }

      // Time range filter
      if (selectedTimeRange !== 'all') {
        const itemDate = new Date(item.timestamp).getTime();
        const now = Date.now();
        if (selectedTimeRange === 'today') {
          const startOfDay = new Date().setHours(0,0,0,0);
          if (itemDate < startOfDay) return false;
        } else if (selectedTimeRange === '7days') {
          if (now - itemDate > 7 * 86400000) return false;
        } else if (selectedTimeRange === '30days') {
          if (now - itemDate > 30 * 86400000) return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedUser, selectedActionType, selectedModule, selectedSeverity, selectedTimeRange]);

  // Aggregate stats
  const kpiStats = useMemo(() => {
    const total = logs.length;
    const critical = logs.filter(l => l.severity === 'critical').length;
    const budgetChanges = logs.filter(l => l.action_type === 'budget_update').length;
    const roleChanges = logs.filter(l => l.action_type === 'role_change').length;
    const voucherChanges = logs.filter(l => l.action_type === 'voucher_approval').length;

    return {
      total,
      critical,
      budgetChanges,
      roleChanges,
      voucherChanges
    };
  }, [logs]);

  // Recharts Chart Data: Action Types Breakdown
  const actionTypeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(l => {
      counts[l.action_type] = (counts[l.action_type] || 0) + 1;
    });

    const getLabel = (key: string) => {
      switch (key) {
        case 'budget_update': return lang === 'ar' ? 'تعديل الموازنة' : 'Budget Update';
        case 'role_change': return lang === 'ar' ? 'تعديل الصلاحيات' : 'Role Change';
        case 'voucher_approval': return lang === 'ar' ? 'اعتماد سندات' : 'Voucher Approval';
        case 'beneficiary_edit': return lang === 'ar' ? 'بيانات المستفيدين' : 'Beneficiary Edit';
        case 'system_config': return lang === 'ar' ? 'تكوين النظام' : 'System Config';
        case 'security_event': return lang === 'ar' ? 'أحداث الأمان' : 'Security Event';
        case 'sponsorship_update': return lang === 'ar' ? 'الكفالات' : 'Sponsorship';
        default: return key;
      }
    };

    return Object.entries(counts).map(([key, value]) => ({
      name: getLabel(key),
      count: value
    }));
  }, [filteredLogs, lang]);

  // Recharts Chart Data: Severity Pie Distribution
  const severityPieData = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    filteredLogs.forEach(l => {
      if (counts[l.severity] !== undefined) {
        counts[l.severity]++;
      }
    });

    return [
      { name: lang === 'ar' ? 'حرج جداً' : 'Critical', value: counts.critical, color: '#ef4444' },
      { name: lang === 'ar' ? 'عالي' : 'High', value: counts.high, color: '#f59e0b' },
      { name: lang === 'ar' ? 'منخفض' : 'Medium', value: counts.medium, color: '#3b82f6' },
      { name: lang === 'ar' ? 'منخفض' : 'Low', value: counts.low, color: '#10b981' }
    ].filter(d => d.value > 0);
  }, [filteredLogs, lang]);

  // Export CSV Helper
  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'User Name', 'User Email', 'Role', 'Action Type', 'Action', 'Module', 'Severity', 'IP Address', 'Location', 'Target Resource'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      `"${l.user_name}"`,
      l.user_email,
      `"${l.user_role}"`,
      l.action_type,
      `"${lang === 'ar' ? l.action_ar : l.action_en}"`,
      l.module,
      l.severity,
      l.ip_address,
      `"${l.location}"`,
      l.target_resource
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NexoraOS_Audit_Logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper styling for Action Types Badge
  const getActionTypeBadge = (type: ActionType) => {
    switch (type) {
      case 'budget_update':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
          label_ar: 'تعديل موازنة',
          label_en: 'Budget Update',
          icon: DollarSign
        };
      case 'role_change':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
          label_ar: 'تعديل صلاحيات',
          label_en: 'Role Change',
          icon: Key
        };
      case 'voucher_approval':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
          label_ar: 'اعتماد سند',
          label_en: 'Voucher Approval',
          icon: Scale
        };
      case 'beneficiary_edit':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
          label_ar: 'تحديث مستفيد',
          label_en: 'Beneficiary Edit',
          icon: UserCheck
        };
      case 'security_event':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
          label_ar: 'حدث أمني',
          label_en: 'Security Alert',
          icon: ShieldAlert
        };
      case 'system_config':
        return {
          bg: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700',
          label_ar: 'تكوين نظام',
          label_en: 'System Config',
          icon: Settings
        };
      default:
        return {
          bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
          label_ar: 'إجراء عام',
          label_en: 'General Action',
          icon: Activity
        };
    }
  };

  // Severity style helper
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-black';
      case 'high':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-extrabold';
      case 'medium':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold';
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold';
    }
  };

  // EnterpriseDataGrid Columns definition
  const columns: ColumnDef<AuditLogItem>[] = [
    {
      key: 'timestamp',
      header: lang === 'ar' ? 'التاريخ والوقت' : 'Timestamp',
      sortable: true,
      width: '170px',
      render: (val) => (
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 dark:text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{new Date(val as string).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
        </div>
      )
    },
    {
      key: 'user_name',
      header: lang === 'ar' ? 'المستخدم والمسؤولية' : 'Responsible User',
      sortable: true,
      width: '210px',
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400" />
            {record.user_name}
          </span>
          <span className="text-[10px] font-mono text-zinc-400">{record.user_email}</span>
          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">{record.user_role}</span>
        </div>
      )
    },
    {
      key: 'action_type',
      header: lang === 'ar' ? 'نوع الحركة المباشرة' : 'Action Type',
      sortable: true,
      width: '150px',
      render: (val) => {
        const conf = getActionTypeBadge(val as ActionType);
        const Icon = conf.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${conf.bg}`}>
            <Icon className="w-3 h-3" />
            {lang === 'ar' ? conf.label_ar : conf.label_en}
          </span>
        );
      }
    },
    {
      key: 'action_en',
      header: lang === 'ar' ? 'تفاصيل التعديل الحساس والإجراء' : 'Data Mutation Detail',
      render: (_, record) => (
        <div className="flex items-center gap-2 pr-1">
          {record.status === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : record.status === 'flagged' ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-800 dark:text-zinc-100 text-xs">
              {lang === 'ar' ? record.action_ar : record.action_en}
            </span>
            <span className="text-[9px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
              <span>{lang === 'ar' ? 'المورد:' : 'Target:'} <strong className="text-slate-600 dark:text-zinc-300">{record.target_resource}</strong></span>
              <span>?</span>
              <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {record.location}</span>
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'severity',
      header: lang === 'ar' ? 'مجلس الإدارة' : 'Severity',
      sortable: true,
      width: '110px',
      align: 'center',
      render: (val) => (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase border ${getSeverityBadge(val as string)}`}>
          {val as string}
        </span>
      )
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      sortable: true,
      width: '120px',
      align: 'center',
      render: (val) => (
        <span className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 font-bold">
          {val as string}
        </span>
      )
    },
    {
      key: 'id',
      header: lang === 'ar' ? 'السبعين' : 'Inspect',
      width: '90px',
      align: 'center',
      render: (_, record) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(record);
          }}
          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 cursor-pointer mx-auto"
        >
          <Eye className="w-3 h-3" />
          <span>{lang === 'ar' ? 'عدن' : 'View'}</span>
        </button>
      )
    }
  ];

  const headerContent = (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{lang === 'ar' ? 'سجل التدقيق والمراقبة الفورية (Audit Log OS)' : 'Real-Time Enterprise Audit Log OS'}</span>
            {isLiveStreaming && (
              <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full font-extrabold uppercase animate-pulse">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>{lang === 'ar' ? 'بث حي مباشر' : 'Live Stream'}</span>
              </span>
            )}
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
            {lang === 'ar' 
              ? 'تتبع ورصد كافه التعديلات الحساسة على الموازنات، الصلاحيات، سندات الصرف، وبيانات المستفيدين عبر NexoraOS'
              : 'Tracking every sensitive mutation (budgets, user roles, payment vouchers, and beneficiary data) across NexoraOS'}
          </p>
        </div>
      </div>

      {/* Header Quick Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setIsLiveStreaming(!isLiveStreaming)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all cursor-pointer ${
            isLiveStreaming 
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
          }`}
        >
          {isLiveStreaming ? <Pause className="w-3.5 h-3.5 text-amber-300" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
          <span>{isLiveStreaming ? (lang === 'ar' ? 'تدشين نشاط جديد' : 'Pause Live Feed') : (lang === 'ar' ? 'إيقاف البث الحي' : 'Resume Live Feed')}</span>
        </button>

        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
          title={lang === 'ar' ? 'تصدير السجلات إلى ملف CSV' : 'Export Audit Logs to CSV'}
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <Workspace 
      header={headerContent}
      statusBar={
        <div className="flex items-center justify-between w-full text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-500 font-bold">
              <Zap className="w-3 h-3" />
              {lang === 'ar' ? `محرك التدقيق الآلي متصل: ${liveCounter} حركات فورية جديدة` : `Audit Engine Active: ${liveCounter} live events appended`}
            </span>
            <span>?</span>
            <span>{lang === 'ar' ? `بواسطة المندوب: ${filteredLogs.length}` : `Filtered Records: ${filteredLogs.length}`}</span>
          </div>
          <div>
            <span>NexoraOS Enterprise Integrity Verification: OK (SHA-256 Enabled)</span>
          </div>
        </div>
      }
    >
      <div className="space-y-6">

        {/* 1. TOP KPI STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">{lang === 'ar' ? 'إجمالي الحركات المسجلة' : 'Total Audited Events'}</span>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono">{kpiStats.total}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">{lang === 'ar' ? 'تعديلات الموازنة المالية' : 'Budget Modifications'}</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{kpiStats.budgetChanges}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/30 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-purple-600 dark:text-purple-400 font-extrabold uppercase tracking-wider">{lang === 'ar' ? 'تعديلات الصلاحيات والمستخدمين' : 'User Role Changes'}</span>
              <p className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">{kpiStats.roleChanges}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Key className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/30 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">{lang === 'ar' ? 'اعتماد سندات وتفريغ' : 'Voucher Approvals'}</span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{kpiStats.voucherChanges}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/30 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wider">{lang === 'ar' ? 'تنبهات حرجة / أمنية' : 'Critical Security Alerts'}</span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">{kpiStats.critical}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 2. REALTIME SIMULATION TRIGGER BAR */}
        <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 p-4 rounded-2xl border border-emerald-800/80 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="text-xs font-black text-emerald-400 flex items-center gap-2">
                <span>{lang === 'ar' ? 'أداة اختبار المحاكاة الفورية للحركات الحساسة' : 'Real-time Instant Action Injector & Simulation Tool'}</span>
              </h3>
              <p className="text-[10px] text-emerald-100/70 mt-0.5">
                {lang === 'ar' ? 'اضغط المحاكاة لاختبار ظهور الحركة فوراً في جدول التدقيق وتدفق المراقبة' : 'Click any simulation button to test instant real-time audit entry injection'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => triggerSimulatedAction('budget_update')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '+ محاكاة تعديل موازنة' : '+ Sim Budget Update'}</span>
            </button>

            <button
              onClick={() => triggerSimulatedAction('role_change')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '+ محاكاة ترقية صلاحيات' : '+ Sim Role Escalation'}</span>
            </button>

            <button
              onClick={() => triggerSimulatedAction('security_event')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '+ محاكاة اختراق أمني' : '+ Sim Security Alert'}</span>
            </button>
          </div>
        </div>

        {/* 3. SEARCH & MULTI-FILTER BAR */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-black text-slate-800 dark:text-white">
                {lang === 'ar' ? 'فلترة وتصفية سجلات التدقيق المتقدمة' : 'Advanced Search & Multi-Criteria Audit Filtering'}
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-[10px] font-extrabold gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>{lang === 'ar' ? 'مجلس الإدارة' : 'Audit Data Grid'}</span>
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'analytics' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                <span>{lang === 'ar' ? 'إجمالي الموظفين' : 'Analytics & Charts'}</span>
              </button>
              <button
                onClick={() => setViewMode('profiler')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'profiler' ? 'bg-amber-600 text-white shadow-xs font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{lang === 'ar' ? 'محلل الأداء (Performance Profiler)' : 'Performance Profiler'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3" style={lang === 'en' ? { right: 'auto', left: '12px' } : {}} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث بالاسم، البريد، الإجراء، الـ IP...' : 'Search name, email, action, IP, ID...'}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-3 pr-9 text-xs font-bold outline-none text-slate-800 dark:text-white focus:ring-1 focus:ring-emerald-500"
                style={lang === 'en' ? { paddingRight: '12px', paddingLeft: '36px' } : {}}
              />
            </div>

            {/* Filter by User */}
            <div>
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-2.5 text-xs font-bold outline-none text-slate-800 dark:text-white"
              >
                <option value="all">{lang === 'ar' ? 'جميع المستخدمين' : 'All Users'}</option>
                {userList.map(u => (
                  <option key={u.email} value={u.email}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Action Type */}
            <div>
              <select
                value={selectedActionType}
                onChange={e => setSelectedActionType(e.target.value as ActionType)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-2.5 text-xs font-bold outline-none text-slate-800 dark:text-white"
              >
                <option value="all">{lang === 'ar' ? 'جميع أنواع الحركات' : 'All Action Types'}</option>
                <option value="budget_update">{lang === 'ar' ? 'تعديل الموازنة' : 'Budget Modification'}</option>
                <option value="role_change">{lang === 'ar' ? 'تعديل الصلاحيات' : 'Role Change'}</option>
                <option value="voucher_approval">{lang === 'ar' ? 'اعتماد سند' : 'Voucher Approval'}</option>
                <option value="beneficiary_edit">{lang === 'ar' ? 'تعديل مستفيد' : 'Beneficiary Edit'}</option>
                <option value="security_event">{lang === 'ar' ? 'أحداث الأمان' : 'Security Alert'}</option>
                <option value="system_config">{lang === 'ar' ? 'تكوين النظام' : 'System Config'}</option>
              </select>
            </div>

            {/* Filter by Time Range */}
            <div>
              <select
                value={selectedTimeRange}
                onChange={e => setSelectedTimeRange(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-2.5 text-xs font-bold outline-none text-slate-800 dark:text-white"
              >
                <option value="all">{lang === 'ar' ? 'كافة الفترات الزمنية' : 'All Time Ranges'}</option>
                <option value="today">{lang === 'ar' ? 'سجلات اليوم' : 'Today'}</option>
                <option value="7days">{lang === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
                <option value="30days">{lang === 'ar' ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
              </select>
            </div>

            {/* Filter by Severity */}
            <div>
              <select
                value={selectedSeverity}
                onChange={e => setSelectedSeverity(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-2.5 text-xs font-bold outline-none text-slate-800 dark:text-white"
              >
                <option value="all">{lang === 'ar' ? 'جميع مستويات الخطورة' : 'All Severities'}</option>
                <option value="critical">{lang === 'ar' ? 'حرج جداً (Critical)' : 'Critical'}</option>
                <option value="high">{lang === 'ar' ? 'عالي (High)' : 'High'}</option>
                <option value="medium">{lang === 'ar' ? 'متوسط (Medium)' : 'Medium'}</option>
                <option value="low">{lang === 'ar' ? 'منخفض (Low)' : 'Low'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. MAIN CONTENT AREA (GRID, ANALYTICS, OR PERFORMANCE PROFILER) */}
        {viewMode === 'grid' ? (
          <WidgetFrame 
            id="audit_logs_main"
            title={lang === 'ar' ? 'سجل تتبع التعديلات الحساسة والحركات الحية' : 'Sensitive Data Modification Real-time Trail'}
            icon={FileText}
            onRefresh={async () => { setLogs([...initialAuditLogs]); }}
            loading={loading}
            defaultHeight={500}
          >
            {() => (
              <EnterpriseDataGrid
                data={filteredLogs}
                columns={columns}
                keyExtractor={(log) => log.id}
                loading={loading}
                defaultSortKey="timestamp"
                defaultSortDir="desc"
                maxHeight="100%"
                onRowClick={(log) => setSelectedLog(log)}
                emptyMessage={lang === 'ar' ? 'لا توجد سجلات تدقيق مطابقة للفلترة المحددة.' : 'No matching audit records found.'}
              />
            )}
          </WidgetFrame>
        ) : viewMode === 'analytics' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Chart 1: Action Type Breakdown */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 mb-4">
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'توزيع التعديلات الحساسة حسب نوع الحركة' : 'Mutations Distribution by Action Type'}</span>
                </h4>
                <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-zinc-500 font-bold px-2 py-0.5 rounded uppercase">
                  {lang === 'ar' ? 'رسم شريطي' : 'Bar Chart'}
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={actionTypeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none', color: '#f3f4f6', fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Severity Distribution Pie Chart */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 mb-4">
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'ar' ? 'توزيع درجة خطورة الحركات والأحداث' : 'Severity Level Distribution'}</span>
                </h4>
                <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-zinc-500 font-bold px-2 py-0.5 rounded uppercase">
                  {lang === 'ar' ? 'دائري' : 'Pie Chart'}
                </span>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none', color: '#f3f4f6', fontSize: '11px', fontWeight: 'bold' }} />
                    <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <PerformanceProfilerTab lang={lang} />
        )}

      </div>

      {/* 5. AUDIT LOG DETAIL MODAL WITH "BEFORE" VS "AFTER" PAYLOAD DIFF */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="h-14 px-6 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <span>{lang === 'ar' ? 'تقرير التتبع والتدقيق الفني للحركة' : 'Technical Mutation Audit Payload Inspector'}</span>
                    <span className="font-mono text-[10px] bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-slate-700 dark:text-zinc-300">
                      {selectedLog.id}
                    </span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {lang === 'ar' ? selectedLog.action_ar : selectedLog.action_en}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 dark:bg-zinc-950/20 custom-scrollbar">
              {/* Metadata Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                <div>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'المستخدم المسئول' : 'User'}</span>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">{selectedLog.user_name}</p>
                  <p className="text-[9px] text-zinc-400 font-mono">{selectedLog.user_email}</p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'عنوان الـ IP والموقع' : 'IP & Location'}</span>
                  <p className="text-xs font-mono font-black text-slate-800 dark:text-white mt-0.5">{selectedLog.ip_address}</p>
                  <p className="text-[9px] text-zinc-400">{selectedLog.location}</p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'الوقت والتاريخ' : 'Timestamp'}</span>
                  <p className="text-xs font-mono font-bold text-slate-800 dark:text-white mt-0.5">
                    {new Date(selectedLog.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'المورد المستهدف' : 'Target Resource'}</span>
                  <p className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedLog.target_resource}</p>
                </div>
              </div>

              {/* BEFORE VS AFTER DIFF VIEW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'مقارنة البيانات قبل وبعد التعديل (Data Payload Diff)' : 'Data Payload Diff (Before vs After Mutation)'}</span>
                  </h4>
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-mono px-2 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                    SHA-256 Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* BEFORE (OLD VALUES) */}
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-900/40 pb-2">
                      <span className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                        <span>{lang === 'ar' ? 'القيمة السابقة (Before Modification)' : 'Before Mutation'}</span>
                      </span>
                      <span className="text-[9px] bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 font-mono font-bold px-1.5 py-0.5 rounded">
                        OLD STATE
                      </span>
                    </div>

                    <pre className="text-[11px] font-mono text-slate-800 dark:text-rose-200 whitespace-pre-wrap bg-white/80 dark:bg-zinc-950/80 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30 overflow-x-auto custom-scrollbar">
                      {selectedLog.changes_before 
                        ? JSON.stringify(selectedLog.changes_before, null, 2)
                        : (lang === 'ar' ? 'لا توجد بيانات سابقة أو قيد إنشاء جديد' : 'No prior state recorded')}
                    </pre>
                  </div>

                  {/* AFTER (NEW VALUES) */}
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-900/40 pb-2">
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <span>{lang === 'ar' ? 'القيمة الجديدة (After Modification)' : 'After Mutation'}</span>
                      </span>
                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded">
                        NEW STATE
                      </span>
                    </div>

                    <pre className="text-[11px] font-mono text-slate-800 dark:text-emerald-200 whitespace-pre-wrap bg-white/80 dark:bg-zinc-950/80 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 overflow-x-auto custom-scrollbar">
                      {selectedLog.changes_after 
                        ? JSON.stringify(selectedLog.changes_after, null, 2)
                        : (lang === 'ar' ? 'لم تتغير القيم' : 'No state change recorded')}
                    </pre>
                  </div>
                </div>
              </div>

              {/* User Agent / Machine details */}
              <div className="bg-slate-100/60 dark:bg-zinc-900 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-800 text-[10px] font-mono text-zinc-400 space-y-1">
                <span className="font-bold text-slate-700 dark:text-zinc-300">{lang === 'ar' ? 'معلومات المتصفح والجهاز:' : 'User-Agent Signature:'}</span>
                <p className="break-all">{selectedLog.user_agent || 'Mozilla/5.0 Enterprise Default'}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="h-14 px-6 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'طباعة تقرير التدقيق' : 'Print Audit Certificate'}</span>
              </button>

              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'تأكيد الحجز والتخصيص' : 'Close Inspector'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Workspace>
  );
}
