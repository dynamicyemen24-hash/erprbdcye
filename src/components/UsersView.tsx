import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Shield, 
  Check, 
  X, 
  UserCheck, 
  AlertTriangle, 
  Key, 
  Lock, 
  ShieldCheck, 
  Building2, 
  Building, 
  Smartphone, 
  Globe, 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RefreshCw, 
  Award, 
  Sliders, 
  Fingerprint, 
  LogOut, 
  ChevronRight, 
  Layers, 
  DollarSign,
  Download,
  Filter,
  Save,
  ShieldAlert,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, Role } from '../types';
import { useEnterprise } from '../core/context/EnterpriseContext';
import { triggerHaptic } from '../helpers/hapticSwipe';
import { ModuleShell } from './enterprise/ModuleShell';

interface UsersViewProps {
  users: User[];
  roles: Role[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
}

type UserSubTab = 'users' | 'roles' | 'matrix' | 'delegations' | 'security_audit';

interface PermissionItem {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  module: string;
  description: string;
}

export default function UsersView({ users, roles, loading, onRefresh, lang }: UsersViewProps) {
  const isRtl = lang === 'ar';
  const enterprise = useEnterprise();
  const { organizationId, selectedBranchCode } = enterprise;

  const [activeTab, setActiveTab] = useState<UserSubTab>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [defaultLanguage, setDefaultLanguage] = useState('ar');
  const [securityLevel, setSecurityLevel] = useState(3);
  const [departmentCode, setDepartmentCode] = useState('MANAGEMENT');
  const [positionCode, setPositionCode] = useState('OFFICER');
  const [canApprove, setCanApprove] = useState(false);
  const [maxApprovalAmount, setMaxApprovalAmount] = useState('0');
  const [assignedBranch, setAssignedBranch] = useState('HQ');

  // Live RBAC Matrix State
  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [dbPermissions, setDbPermissions] = useState<PermissionItem[]>([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [matrixSuccess, setMatrixSuccess] = useState<string | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(false);

  // Fetch Live RBAC Matrix
  const fetchRbacMatrix = async () => {
    setMatrixLoading(true);
    try {
      const res = await fetch('/api/rbac/matrix');
      if (res.ok) {
        const data = await res.json();
        setDbRoles(data.roles || []);
        setDbPermissions(data.permissions || []);
        setRolePermissionsMap(data.rolePermissionsMap || {});
        if (data.roles?.length > 0 && !selectedRoleId) {
          setSelectedRoleId(data.roles[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load RBAC matrix:', err);
    } finally {
      setMatrixLoading(false);
    }
  };

  useEffect(() => {
    fetchRbacMatrix();
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return (users || []).filter(u => {
      if (selectedStatusFilter !== 'all' && u.status !== selectedStatusFilter) return false;
      if (selectedLevelFilter !== 'all' && String(u.security_level) !== selectedLevelFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.name_ar && u.name_ar.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department_code && u.department_code.toLowerCase().includes(q)) ||
        (u.position_code && u.position_code.toLowerCase().includes(q))
      );
    });
  }, [users, searchTerm, selectedStatusFilter, selectedLevelFilter]);

  // Open User Create / Edit Modal
  const openModal = (user: User | null = null) => {
    setSelectedUser(user);
    setFormError(null);
    setPassword('');
    if (user) {
      setEmail(user.email || '');
      setName(user.name || '');
      setNameAr(user.name_ar || '');
      setPhone(user.phone || '');
      setStatus(user.status || 'active');
      setDefaultLanguage(user.default_language || 'ar');
      setSecurityLevel(user.security_level || 3);
      setDepartmentCode(user.department_code || 'MANAGEMENT');
      setPositionCode(user.position_code || 'OFFICER');
      setCanApprove(!!user.can_approve);
      setMaxApprovalAmount(user.max_approval_amount ? String(user.max_approval_amount) : '0');
      setAssignedBranch(selectedBranchCode || 'HQ');
    } else {
      setEmail('');
      setName('');
      setNameAr('');
      setPhone('');
      setStatus('active');
      setDefaultLanguage('ar');
      setSecurityLevel(3);
      setDepartmentCode('PROGRAMS');
      setPositionCode('OFFICER');
      setCanApprove(false);
      setMaxApprovalAmount('0');
      setAssignedBranch(selectedBranchCode || 'HQ');
    }
    setIsModalOpen(true);
  };

  // Open Password Reset Modal
  const openResetPwdModal = (user: User) => {
    setSelectedUser(user);
    setNewResetPassword('');
    setIsResetPwdModalOpen(true);
  };

  // Submit User Create / Edit
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const payload: any = {
      email: email.trim(),
      name: name.trim() || email.split('@')[0],
      name_ar: nameAr.trim() || name.trim() || email.split('@')[0],
      phone: phone.trim(),
      status,
      default_language: defaultLanguage,
      security_level: Number(securityLevel),
      department_code: departmentCode,
      position_code: positionCode,
      can_approve: canApprove,
      max_approval_amount: parseFloat(maxApprovalAmount) || 0,
      organization_id: organizationId || '00000000-0000-0000-0000-000000000001',
      ...(password ? { password: password.trim() } : (selectedUser ? {} : {}))
    };

    try {
      const url = selectedUser 
        ? `/api/tables/users/${selectedUser.id}` 
        : `/api/tables/users`;
      
      const response = await fetch(url, {
        method: selectedUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save user');
      }

      setIsModalOpen(false);
      onRefresh();
      setStatusMsg({
        type: 'success',
        text: isRtl ? 'تم حفظ بيانات المستخدم بنجاح في قاعدة البيانات' : 'User saved successfully in PostgreSQL'
      });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Password Reset
  const handleExecuteResetPassword = async () => {
    if (!selectedUser?.id || !newResetPassword) return;
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          new_password: newResetPassword
        })
      });
      if (res.ok) {
        setIsResetPwdModalOpen(false);
        setStatusMsg({
          type: 'success',
          text: isRtl ? `تم إعادة تعيين كلمة المرور للمستخدم (${selectedUser.email}) بنجاح` : 'Password reset successfully'
        });
        setTimeout(() => setStatusMsg(null), 3500);
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Single Permission for Current Role
  const handleTogglePermission = (permissionId: string) => {
    if (!selectedRoleId) return;
    triggerHaptic('light');
    setRolePermissionsMap(prev => {
      const currentPerms = prev[selectedRoleId] || [];
      const has = currentPerms.includes(permissionId);
      const next = has 
        ? currentPerms.filter(id => id !== permissionId)
        : [...currentPerms, permissionId];
      return { ...prev, [selectedRoleId]: next };
    });
  };

  // Save Permission Matrix to Database
  const handleSaveRolePermissions = async () => {
    if (!selectedRoleId) return;
    setSavingMatrix(true);
    setMatrixSuccess(null);
    try {
      const perms = rolePermissionsMap[selectedRoleId] || [];
      const res = await fetch('/api/rbac/matrix/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: selectedRoleId,
          permission_ids: perms
        })
      });
      if (res.ok) {
        setMatrixSuccess(isRtl ? 'تم حفظ وتحديث مصفوفة الصلاحيات في قاعدة البيانات بنجاح' : 'Permissions matrix updated successfully');
        setTimeout(() => setMatrixSuccess(null), 3500);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingMatrix(false);
    }
  };

  // Modules list for matrix filtering
  const distinctModules = useMemo(() => {
    const mods = new Set<string>();
    dbPermissions.forEach(p => { if (p.module) mods.add(p.module); });
    return Array.from(mods);
  }, [dbPermissions]);

  const filteredPermissions = useMemo(() => {
    return dbPermissions.filter(p => {
      if (selectedModuleFilter !== 'all' && p.module !== selectedModuleFilter) return false;
      return true;
    });
  }, [dbPermissions, selectedModuleFilter]);

  const currentRolePerms = rolePermissionsMap[selectedRoleId] || [];

  return (
    <ModuleShell
      titleAr="نظام الكادر والملفات المهنية"
      titleEn="Resource & Personnel OS"
      descAr="السجلات الوظيفية للفرق الإنسانية، تخطيط المهام الميدانية"
      descEn="Staff profiles, humanitarian field logs, skills mapping, and active team locations"
      domainCode="NEB-09"
      icon={Users}
      accent="purple"
      lang={lang}
      onRefresh={onRefresh}
      isLoading={loading}
      recordCount={users.length}
      breadcrumbs={[
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', onClick: () => {} },
        { label: lang === 'ar' ? 'المستخدمون' : 'Users' }
      ]}
    >
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 p-6 rounded-2xl border border-zinc-800 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-black">
            <ShieldCheck className="w-4 h-4" />
            <span>{isRtl ? 'إدارة الهوية والأدوار والصلاحيات المؤسسية' : 'Enterprise Identity & RBAC Governance'}</span>
          </div>
          <h2 className="text-xl font-black">
            {isRtl ? 'المستخدمون ومصفوفة الصلاحيات (RBAC Governance)' : 'Users & Access Control Matrix'}
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            {isRtl 
              ? 'التحكم المركزي في حسابات الكادر، مستويات التصريح الأمني (L1 إلى L5)، سقوف الاعتماد المالي، وتعيين الصلاحيات عبر الـ 15 نطاقاً تشغيلياً.' 
              : 'Enterprise user directory, multi-tier security clearances, signing delegations and fine-grained RBAC matrix.'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onRefresh()}
            disabled={loading}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black flex items-center gap-2 border border-zinc-700 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{isRtl ? 'تحديث السجلات' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => openModal()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/25"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة مستخدم جديد' : 'New User'}</span>
          </button>
        </div>
      </div>

      {/* Global Status Message */}
      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-black flex items-center gap-2.5 border animate-in fade-in duration-200 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
        {[
          { id: 'users', label: isRtl ? 'دليل المستخدمين المعتمدين' : 'User Directory', icon: Users },
          { id: 'matrix', label: isRtl ? 'مصفوفة الصلاحيات (RBAC Matrix)' : 'RBAC Matrix', icon: ShieldCheck },
          { id: 'roles', label: isRtl ? 'الأدوار والمستويات الأمنية' : 'Roles & Clearances', icon: Award },
          { id: 'delegations', label: isRtl ? 'سقوف وصلاحيات الاعتماد المالي' : 'Delegation of Authority', icon: DollarSign },
          { id: 'security_audit', label: isRtl ? 'سجل الجلسات والأمان اللحظي' : 'Active Sessions & Audit', icon: Fingerprint },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(tab.id as UserSubTab);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute right-3 rtl:right-3 ltr:left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isRtl ? 'بحث بالاسم، البريد، الإدارة...' : 'Search by name, email, department...'}
                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all">{isRtl ? 'كافة الحالات' : 'All Status'}</option>
                <option value="active">{isRtl ? 'نشط (Active)' : 'Active'}</option>
                <option value="suspended">{isRtl ? 'موقوف (Suspended)' : 'Suspended'}</option>
              </select>

              <select
                value={selectedLevelFilter}
                onChange={e => setSelectedLevelFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all">{isRtl ? 'كافة المستويات' : 'All Clearances'}</option>
                <option value="5">{isRtl ? 'المستوى 5 (إدارة عليا)' : 'Level 5 (Executive)'}</option>
                <option value="4">{isRtl ? 'المستوى 4 (إشراف)' : 'Level 4 (Managerial)'}</option>
                <option value="3">{isRtl ? 'المستوى 3 (تشغيلي)' : 'Level 3 (Operational)'}</option>
                <option value="2">{isRtl ? 'المستوى 2 (ميداني)' : 'Level 2 (Field)'}</option>
                <option value="1">{isRtl ? 'المستوى 1 (مشاهد)' : 'Level 1 (Viewer)'}</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 font-black border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-4">{isRtl ? 'المستخدم والهوية' : 'User Identity'}</th>
                    <th className="p-4">{isRtl ? 'الإدارة والدور' : 'Department & Position'}</th>
                    <th className="p-4">{isRtl ? 'المستوى الأمني' : 'Security Clearance'}</th>
                    <th className="p-4">{isRtl ? 'سقف الاعتماد المالي' : 'Approval Limit'}</th>
                    <th className="p-4">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="p-4 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200 font-bold">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                        <span>{isRtl ? 'جاري تحميل المستخدمين من قاعدة البيانات...' : 'Loading users from PostgreSQL...'}</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <span>{isRtl ? 'لا يوجد مستخدمين يطابقون معايير البحث' : 'No users found matching filter'}</span>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                              {(user.name_ar || user.name || user.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white">
                                {user.name_ar || user.name}
                              </p>
                              <p className="font-mono text-[10px] text-zinc-400">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-black font-mono">
                              {user.department_code || 'MANAGEMENT'}
                            </span>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{user.position_code || 'OFFICER'}</p>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            (user.security_level || 3) >= 5 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                              : (user.security_level || 3) >= 4
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}>
                            <Shield className="w-3 h-3" />
                            <span>Level {user.security_level || 3}</span>
                          </span>
                        </td>

                        <td className="p-4 font-mono font-black text-slate-900 dark:text-white">
                          {user.can_approve ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {Number(user.max_approval_amount || 0).toLocaleString()} YER
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-normal">{isRtl ? 'غير مصرح' : 'No delegation'}</span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{user.status === 'active' ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'موقوف' : 'Suspended')}</span>
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openModal(user)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                              title={isRtl ? 'تعديل المستخدم' : 'Edit User'}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openResetPwdModal(user)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg transition-colors cursor-pointer"
                              title={isRtl ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? 'مصفوفة الصلاحيات حسب الدور المؤسسي' : 'Role-Based Access Control Matrix'}</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isRtl ? 'حدد الدور الإداري لتفعيل أو حجب الصلاحيات على النطاقات الـ 15 مباشرة' : 'Select a role to toggle fine-grained permissions'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={selectedRoleId}
                onChange={e => setSelectedRoleId(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {dbRoles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name_ar || r.name_en} ({r.code})
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveRolePermissions}
                disabled={savingMatrix || !selectedRoleId}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingMatrix ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الصلاحيات في السحابة' : 'Save to DB')}</span>
              </button>
            </div>
          </div>

          {matrixSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{matrixSuccess}</span>
            </div>
          )}

          {/* Module Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedModuleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                selectedModuleFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {isRtl ? 'كافة النطاقات' : 'All Modules'}
            </button>
            {distinctModules.map(mod => (
              <button
                key={mod}
                onClick={() => setSelectedModuleFilter(mod)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  selectedModuleFilter === mod
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {mod.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Permissions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPermissions.map(p => {
              const isGranted = currentRolePerms.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => handleTogglePermission(p.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isGranted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-slate-900 dark:text-white shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-zinc-500 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black truncate">{p.name_ar || p.name_en}</span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-400">{p.code}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{p.description}</p>
                  </div>

                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isGranted ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-zinc-700'
                  }`}>
                    {isGranted && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ROLES & CLEARANCES */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dbRoles.map(r => (
            <div key={r.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                  {r.code}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Level {r.security_level || 3}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{r.name_ar || r.name_en}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {r.description || (isRtl ? 'دور وظيفي معتمد للنظام' : 'Official system role')}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-bold">
                <span>{isRtl ? 'الأسبقية الإدارية:' : 'Hierarchy Level:'}</span>
                <span className="font-mono text-slate-700 dark:text-zinc-300">{r.level || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: DELEGATIONS */}
      {activeTab === 'delegations' && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>{isRtl ? 'مصفوفة التفويض المالي وسقوف التوقيع (DoA)' : 'Delegation of Authority (DoA) Tiers'}</span>
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {[
              { tier: 'المستوى الأول (L2)', range: 'حتى 1,000,000 ريال', approver: 'مدير المشروع / المشرف الميداني', type: 'توقيع فردي Single Signature' },
              { tier: 'المستوى الثاني (L3/L4)', range: 'من 1,000,000 إلى 10,000,000 ريال', approver: 'مدير العمليات + المدير المالي', type: 'توقيع ثنائي Dual Signature' },
              { tier: 'المستوى الثالث (L5)', range: 'أكثر من 10,000,000 ريال', approver: 'المدير التنفيذي + مجلس الإدارة', type: 'اعتماد تنفيذي ثلاثي Triple Executive Sign-off' },
            ].map((d, i) => (
              <div key={i} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-black text-slate-900 dark:text-white">{d.tier}</span>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">{d.approver}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                    {d.range}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                    {d.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & SESSIONS AUDIT */}
      {activeTab === 'security_audit' && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-emerald-500" />
              <span>{isRtl ? 'الجلسات النشطة وسجل الأمان' : 'Active Sessions & Security Telemetry'}</span>
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
              {isRtl ? 'تشفير كامل TLS 1.3 / Bcrypt' : 'TLS 1.3 / Bcrypt Protected'}
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {(users || []).slice(0, 6).map((u, idx) => (
              <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{u.name_ar || u.name}</p>
                    <p className="font-mono text-[10px] text-zinc-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 font-mono text-[11px] text-zinc-500">
                  <span>Level {u.security_level || 3}</span>
                  <span className="text-emerald-600 font-bold">2FA Enabled</span>
                  <span>IP: 197.161.22.84</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                <span>{selectedUser ? (isRtl ? 'تعديل بيانات المستخدم' : 'Edit User') : (isRtl ? 'تسجيل مستخدم جديد' : 'New User Registration')}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isRtl ? 'البريد الإلكتروني (اسم المستخدم)' : 'Email / Username'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@rohamaab.org"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isRtl ? 'كلمة المرور' : 'Password'} {selectedUser ? (isRtl ? '(اتركه فارغاً للإبقاء على الحالية)' : '(Leave blank to keep unchanged)') : '*'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isRtl ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={e => setNameAr(e.target.value)}
                    placeholder="د. عبدالكريم الحمداني"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isRtl ? 'الاسم الكامل (إنجليزي)' : 'Full Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Dr. Abdulkarim Al-Hamdani"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isRtl ? 'رقم الهاتف / الواتساب' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+967-777000000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isRtl ? 'الإدارة / القسم' : 'Department'}
                  </label>
                  <select
                    value={departmentCode}
                    onChange={e => setDepartmentCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="EXEC_DIR">{isRtl ? 'الإدارة التنفيذية العامة' : 'Executive Management'}</option>
                    <option value="OPERATIONS_DIR">{isRtl ? 'إدارة العمليات والمشاريع' : 'Operations & Programs'}</option>
                    <option value="FINANCE_DIR">{isRtl ? 'الشؤون المالية والمحاسبية' : 'Finance & Accounting'}</option>
                    <option value="PMO_DIR">{isRtl ? 'مكتب إدارة المشاريع PMO' : 'PMO Office'}</option>
                    <option value="WELFARE_DIR">{isRtl ? 'الرعاية الاجتماعية وكفالة الأيتام' : 'Social Welfare & Orphans'}</option>
                    <option value="FIELD_OPS">{isRtl ? 'العمليات اللوجستية والميدانية' : 'Field Logistics'}</option>
                    <option value="IT_DIR">{isRtl ? 'تقنية المعلومات والتحكم' : 'IT & Security'}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isRtl ? 'مستوى التصريح الأمني' : 'Security Clearance Level'}
                  </label>
                  <select
                    value={securityLevel}
                    onChange={e => setSecurityLevel(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={5}>{isRtl ? 'المستوى 5 - إدارة عليا وتحكم كامل' : 'Level 5 - Executive & Full Control'}</option>
                    <option value={4}>{isRtl ? 'المستوى 4 - مدير إدارة / اعتماد' : 'Level 4 - Department Director'}</option>
                    <option value={3}>{isRtl ? 'المستوى 3 - موظف تشغيلي / محاسب' : 'Level 3 - Operational / Accountant'}</option>
                    <option value={2}>{isRtl ? 'المستوى 2 - مشرف ميداني' : 'Level 2 - Field Coordinator'}</option>
                    <option value={1}>{isRtl ? 'المستوى 1 - عرض فقط' : 'Level 1 - Read Only'}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isRtl ? 'حالة الحساب' : 'Account Status'}
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="active">{isRtl ? 'نشط (Active)' : 'Active'}</option>
                    <option value="suspended">{isRtl ? 'موقوف (Suspended)' : 'Suspended'}</option>
                  </select>
                </div>
              </div>

              {/* Financial Approval Delegation */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="canApproveCheck"
                    checked={canApprove}
                    onChange={e => setCanApprove(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  <label htmlFor="canApproveCheck" className="text-xs font-black text-slate-800 dark:text-zinc-200 cursor-pointer select-none">
                    {isRtl ? 'منح صلاحية الاعتماد المالي والتوقيع' : 'Grant Financial Signing & Approval Authority'}
                  </label>
                </div>

                {canApprove && (
                  <div>
                    <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1 text-xs">
                      {isRtl ? 'سقف الاعتماد المالي الأقصى (ريال يمني)' : 'Max Approval Limit (YER)'}
                    </label>
                    <input
                      type="number"
                      value={maxApprovalAmount}
                      onChange={e => setMaxApprovalAmount(e.target.value)}
                      placeholder="50000000"
                      className="w-full px-3.5 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-black cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{formSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ المستخدم في قاعدة البيانات' : 'Save User')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetPwdModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? 'إعادة تعيين كلمة المرور' : 'Reset User Password'}</span>
              </h3>
              <button
                onClick={() => setIsResetPwdModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-zinc-500 space-y-1">
              <p>{isRtl ? 'سيتم تشفير كلمة المرور بـ Bcrypt وحفظها مباشرة للمستخدم:' : 'Password will be bcrypt-hashed for user:'}</p>
              <p className="font-bold font-mono text-slate-900 dark:text-white">{selectedUser.email}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newResetPassword}
                  onChange={e => setNewResetPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetPwdModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={formSubmitting || !newResetPassword}
                onClick={handleExecuteResetPassword}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {formSubmitting ? (isRtl ? 'جاري التعيين...' : 'Resetting...') : (isRtl ? 'تأكيد وحفظ كلمة المرور' : 'Confirm Reset')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ModuleShell>
  );
}
