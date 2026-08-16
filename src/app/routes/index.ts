import { ActiveTab } from '../../core/types';

export interface RouteDefinition {
  id: ActiveTab;
  domainCode: string;
  labelAr: string;
  labelEn: string;
  category: 'core' | 'operations' | 'governance' | 'analytics' | 'settings';
  isSecure?: boolean;
}

export const ROUTE_DEFINITIONS: RouteDefinition[] = [
  { id: 'dashboard', domainCode: 'NEB-01', labelAr: 'لوحة التحكم القيادية', labelEn: 'Executive Dashboard', category: 'core' },
  { id: 'strategic_planning', domainCode: 'NEB-01', labelAr: 'التخطيط الاستراتيجي والأداء', labelEn: 'Strategic Planning & Performance', category: 'core' },
  { id: 'control_panel', domainCode: 'NEB-01', labelAr: 'مركز القيادة الموحد', labelEn: 'Unified Control Center', category: 'core' },
  { id: 'domains', domainCode: 'NEB-01', labelAr: 'مركز النطاقات المؤسسية', labelEn: 'Domain Center', category: 'core' },
  { id: 'geospatial', domainCode: 'NEB-05', labelAr: 'الخريطة والموقع الجغرافي', labelEn: 'GIS & Field Map', category: 'analytics' },
  
  { id: 'programs', domainCode: 'NEB-03', labelAr: 'البرامج التنموية', labelEn: 'Programs', category: 'operations' },
  { id: 'projects', domainCode: 'NEB-04', labelAr: 'المشاريع التنفيذية', labelEn: 'Projects', category: 'operations' },
  { id: 'activities', domainCode: 'NEB-05', labelAr: 'الأنشطة الميدانية والمهام', labelEn: 'Field Activities', category: 'operations' },
  { id: 'allocations', domainCode: 'NEB-05', labelAr: 'توزيع الموارد والفرق', labelEn: 'Resource Allocation', category: 'operations' },
  { id: 'scenarios', domainCode: 'NEB-05', labelAr: 'السيناريوهات التشغيلية', labelEn: 'Operational Scenarios', category: 'operations' },

  { id: 'beneficiaries', domainCode: 'NEB-06', labelAr: 'إدارة المستفيدين', labelEn: 'Beneficiaries', category: 'operations' },
  { id: 'sponsorships', domainCode: 'NEB-06', labelAr: 'الكفالات والخدمات', labelEn: 'Sponsorships', category: 'operations' },

  { id: 'inventory', domainCode: 'NEB-09', labelAr: 'المخزون والمستودعات', labelEn: 'Inventory', category: 'operations' },
  { id: 'contracts', domainCode: 'NEB-08', labelAr: 'العقود والشراكات', labelEn: 'Contracts', category: 'operations' },

  { id: 'finance', domainCode: 'NEB-10', labelAr: 'المالية والحوكمة', labelEn: 'Financial Ledger', category: 'governance', isSecure: true },
  { id: 'investments', domainCode: 'NEB-15', labelAr: 'المشاريع الاستثمارية والأوقاف', labelEn: 'Investment & Endowment OS', category: 'governance', isSecure: true },
  { id: 'approvals', domainCode: 'NEB-10', labelAr: 'طلبات واعتمادات الصرف', labelEn: 'Approvals & Workflows', category: 'governance' },
  { id: 'currencies', domainCode: 'NEB-10', labelAr: 'العملات وأسعار الصرف', labelEn: 'Currencies', category: 'governance' },

  { id: 'reports', domainCode: 'NEB-11', labelAr: 'التقارير وقياس الأثر', labelEn: 'Reports & Analytics', category: 'analytics' },
  { id: 'docs', domainCode: 'NEB-11', labelAr: 'المكتبة والسياسات', labelEn: 'Documentation & Policies', category: 'analytics' },

  { id: 'users', domainCode: 'NEB-12', labelAr: 'المستخدمين والصلاحيات', labelEn: 'Users & Roles', category: 'settings' },
  { id: 'settings', domainCode: 'NEB-12', labelAr: 'إعدادات المنظومة', labelEn: 'System Settings', category: 'settings' },
  { id: 'audit', domainCode: 'NEB-12', labelAr: 'سجلات التدقيق الأمني', labelEn: 'Security Audit Logs', category: 'settings', isSecure: true },
  { id: 'backup', domainCode: 'NEB-12', labelAr: 'النسخ الاحتياطي والتعافي', labelEn: 'Backup & Recovery', category: 'settings' },
];
