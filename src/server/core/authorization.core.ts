/**
 * NexoraOS™ — Unified Authorization Core
 * نظام التفويض المركزي والأمني الموحد
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * التصميم الأمني:
 *  - كل قرار تفويض يُتّخذ على الخادم فقط.
 *  - لا يُسمح بتعيين org_id أو role أو permissions من العميل.
 *  - الهوية تُستخلص من JWT الموقع (auth middleware) — لا يوجد "header fallback".
 *  - فحص الملكية يُستخلص من قاعدة البيانات، وليس من طلب العميل.
 *  - اصلاحات للـ IDOR/BOLA: كل resource_id يُربط بتحقق tenant-owned.
 *  - صلاحيات (permissions) مبنية على الدور + التخصص (scope).
 * ─────────────────────────────────────────────────────────────────────────────
 * المراجعة الأمنية:
 *  - OWASP ASVS V4.1 6.3.2, 6.3.3
 *  - NIST ZTA: "Every request is evaluated"
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Request, Response, NextFunction } from 'express';
import { queryOne } from './database';
import logger from './logger';

// ─────────────────────────────────────────────
// 1. الأدوار (Roles) — مصدر واحد للصلاحيح
// ─────────────────────────────────────────────

/**
 * الدرجات الأمنية تعكس مستوي امتياز (privilege level).
 * تُستمد من JWT — لا تُقبل من العميل.
 */
export type SecurityLevel = 1 | 2 | 3 | 4 | 5;

/**
 * الأدوار الداخلية للمنصة. كل دور مرتبط مستوى أمان.
 * SUPER_ADMIN = 5 — يملك كل شيء.
 */
export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',   // مستوى 5 — كامل النظام (خارج المؤسسة)
  ORG_ADMIN = 'ORG_ADMIN',       // مستوى 4 — إدارة المؤسسة بالكامل
  HR_MANAGER = 'HR_MANAGER',     // مستوى 3 — الموارد البشرية
  FINANCE_MANAGER = 'FINANCE_MANAGER', // مستوى 3 — التمويل
  PROJECT_MANAGER = 'PROJECT_MANAGER', // مستوى 3 — المشاريع
  VOLUNTEER_MANAGER = 'VOLUNTEER_MANAGER', // مستوى 3 — المتطوعين
  STAFF = 'STAFF',               // مستوى 2 — موظف عادي
  VOLUNTEER = 'VOLUNTEER',       // مستوى 2 — متطوع
  READONLY = 'READONLY',         // مستوى 1 — قراءة فقط
}

/** خريطة دور ↔ مستوى أمان */
export const ROLE_SECURITY_LEVEL: Record<SystemRole, SecurityLevel> = {
  [SystemRole.SUPER_ADMIN]: 5,
  [SystemRole.ORG_ADMIN]: 4,
  [SystemRole.HR_MANAGER]: 3,
  [SystemRole.FINANCE_MANAGER]: 3,
  [SystemRole.PROJECT_MANAGER]: 3,
  [SystemRole.VOLUNTEER_MANAGER]: 3,
  [SystemRole.STAFF]: 2,
  [SystemRole.VOLUNTEER]: 2,
  [SystemRole.READONLY]: 1,
};

// ─────────────────────────────────────────────
// 2. الصلاحيات (Permissions) — fine-grained
// ─────────────────────────────────────────────

/**
 * صلاحيات عامة تُستخدم لحماية الـ endpoints.
 * تُربط بـ roles عبر PERMISSION_ROLES أدناه.
 */
export enum Permission {
  // ── موارد عامة ──
  RESOURCE_READ = 'resource:read',
  RESOURCE_WRITE = 'resource:write',
  RESOURCE_DELETE = 'resource:delete',

  // ── إدارة المؤسسات ──
  ORG_SETTINGS_READ = 'org:settings:read',
  ORG_SETTINGS_WRITE = 'org:settings:write',
  ORG_AUDIT_READ = 'org:audit:read',

  // ── الموظفين والمتطوعين ──
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',

  // ── التمويل والمصاريف ──
  FINANCE_TRANSACTIONS_READ = 'finance:transactions:read',
  FINANCE_TRANSACTIONS_WRITE = 'finance:transactions:write',
  FINANCE_EXPENSE_APPROVE = 'finance:expense:approve',

  // ── المشاريع ──
  PROJECTS_READ = 'projects:read',
  PROJECTS_WRITE = 'projects:write',
  PROJECTS_DELETE = 'projects:delete',

  // ── الملفات والوثائق ──
  DOCUMENTS_READ = 'documents:read',
  DOCUMENTS_WRITE = 'documents:write',
  DOCUMENTS_DELETE = 'documents:delete',
}

/**
 * ربط الدور ↔ الصلاحيات.
 * مبدأ "deny by default": أي صلاحية غير مدرجة هنا تُرفض.
 */
export const PERMISSION_ROLES: Record<Permission, SystemRole[]> = {
  // المستويات 3+ يمكنها القراءة، المستوى 2 فما فوق يقرأ الموارد
  [Permission.RESOURCE_READ]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.HR_MANAGER,
    SystemRole.FINANCE_MANAGER, SystemRole.PROJECT_MANAGER,
    SystemRole.VOLUNTEER_MANAGER, SystemRole.STAFF, SystemRole.VOLUNTEER,
    SystemRole.READONLY,
  ],
  // المستوى 3 فما فوق
  [Permission.RESOURCE_WRITE]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.HR_MANAGER,
    SystemRole.FINANCE_MANAGER, SystemRole.PROJECT_MANAGER,
    SystemRole.VOLUNTEER_MANAGER, SystemRole.STAFF,
  ],
  // المستوى 4 فما فوق
  [Permission.RESOURCE_DELETE]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN,
    SystemRole.FINANCE_MANAGER, SystemRole.PROJECT_MANAGER,
  ],

  // إعدادات المؤسسة: الأدمن فوق
  [Permission.ORG_SETTINGS_READ]: [SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN],
  [Permission.ORG_SETTINGS_WRITE]: [SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN],
  [Permission.ORG_AUDIT_READ]: [SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN],

  // الموظفون: HR Manager فما فوق
  [Permission.USERS_READ]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.HR_MANAGER,
  ],
  [Permission.USERS_WRITE]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.HR_MANAGER,
  ],

  // التمويل: Finance Manager ومزيد
  [Permission.FINANCE_TRANSACTIONS_READ]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.FINANCE_MANAGER,
  ],
  [Permission.FINANCE_TRANSACTIONS_WRITE]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.FINANCE_MANAGER,
  ],
  [Permission.FINANCE_EXPENSE_APPROVE]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.FINANCE_MANAGER,
  ],

  // المشاريع: Project Manager ومزيد
  [Permission.PROJECTS_READ]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.PROJECT_MANAGER,
    SystemRole.STAFF, SystemRole.VOLUNTEER, SystemRole.READONLY,
  ],
  [Permission.PROJECTS_WRITE]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.PROJECT_MANAGER,
    SystemRole.STAFF,
  ],
  [Permission.PROJECTS_DELETE]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.PROJECT_MANAGER,
  ],

  // المستندات
  [Permission.DOCUMENTS_READ]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.HR_MANAGER,
    SystemRole.FINANCE_MANAGER, SystemRole.PROJECT_MANAGER,
    SystemRole.VOLUNTEER_MANAGER, SystemRole.STAFF, SystemRole.VOLUNTEER,
    SystemRole.READONLY,
  ],
  [Permission.DOCUMENTS_WRITE]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.HR_MANAGER,
    SystemRole.FINANCE_MANAGER, SystemRole.PROJECT_MANAGER,
    SystemRole.VOLUNTEER_MANAGER, SystemRole.STAFF,
  ],
  [Permission.DOCUMENTS_DELETE]: [
    SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.PROJECT_MANAGER,
  ],
};

// ─────────────────────────────────────────────
// 3. سياق المصادقة المُوحد
// ─────────────────────────────────────────────

/**
 * سياق مصادقة موحد — يُستخرج فقط من التوكن الموقع.
 * لا يوجد fallback للهيدر أو الجلسة — ينعكس صفاء Zero Trust.
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: string;        // القيمة الأصلية من JWT، تُطبعق على SystemRole
  orgId: string;       // دائماً من الـ claims — NOT من العميل
  securityLevel: number;
  // مكان لتوسيع MFA/session context لاحقاً
  sessionToken?: string;
  mfaVerified?: boolean;
}

// ─────────────────────────────────────────────
// 4. الدوال الأساسية للتفويض
// ─────────────────────────────────────────────

/**
 * استخراج السياق المصادق من الـ request.
 * يعتمد بالكامل على ما وضعه `authenticateToken`.
 */
export function getAuthContext(req: Request): AuthContext | null {
  const user = (req as any).user;
  if (!user || !user.id || !user.org_id) {
    return null;
  }
  return {
    userId: user.id,
    email: user.email || '',
    role: user.role || SystemRole.READONLY,
    orgId: user.org_id,
    securityLevel: user.security_level ?? 0,
  };
}

/**
 * التحقق مما إذا كان الدور يحمل الصلاحية المطلوبة.
 * مبدأ "deny by default" — إذا لم تكن الصلاحية مسموحة لهذا الدور، تُرفض.
 */
export function hasPermission(
  role: string,
  permission: Permission
): boolean {
  const allowedRoles = PERMISSION_ROLES[permission];
  if (!allowedRoles) return false; // deny by default
  return allowedRoles.includes(role as SystemRole);
}

/**
 * التحقق من أن الـ ID الذي يرسله العميل ينتمي إلى نفسه (self-service).
 * يمنع التلاعب في الهوية — يستخدم userId من التوكن، وليس من الـ body/params.
 */
export function isSelfOrAdmin(
  targetUserId: string,
  ctx: AuthContext
): boolean {
  if (ctx.userId === targetUserId) return true;
  if (ctx.role === SystemRole.SUPER_ADMIN) return true;
  if (ctx.role === SystemRole.ORG_ADMIN) return true; // الأدمن يدير الموظفين في مؤسسته
  return false;
}

/**
 * حامل self-service: يسمح للمستخدم بإدارة بياناته الخاصة فقط.
 *
 * مثال:
 *   app.get('/api/users/me', authenticateToken, requireSelf('userId'), handler);
 */
export function requireSelf(idParam: string = 'userId') {
  return (
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const ctx = getAuthContext(req);
    if (!ctx) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const targetId = req.params[idParam] || req.body[idParam];
    if (!isSelfOrAdmin(targetId, ctx)) {
      res.status(403).json({
        error: 'Access Denied: You can only access your own resources',
        code: 'NOT_SELF',
      });
      return;
    }

    next();
  };
}

// ─────────────────────────────────────────────
// 5b. حوامل Express للتطبيق العملي
// ─────────────────────────────────────────────

export interface AuthorizedRequest extends Request {
  authContext?: AuthContext;
}

/**
 * حامل صلاحية (permission-based authorization).
 * دمجه في route يعني: "هذا الـ endpoint لهذا الـ action يتطلب صلاحية X".
 *
 * مثال الاستخدام:
 *   app.get('/api/users', authenticateToken, requirePermission(Permission.USERS_READ), handler);
 */
export function requirePermission(permission: Permission) {
  return (req: AuthorizedRequest, res: Response, next: NextFunction): void => {
    const ctx = getAuthContext(req);
    if (!ctx) {
      // لا يوجد سياق — ربما لم يتم تشغيل authenticateToken بعد
      return next(); // سيُعيد 401 من الموجه المناسب، أو نُستخدم error handler
    }

    if (!hasPermission(ctx.role, permission)) {
      logger.warn('Authorization denied', {
        context: 'authz',
        meta: {
          userId: ctx.userId,
          orgId: ctx.orgId,
          role: ctx.role,
          permission,
          path: req.path,
          method: req.method,
        },
      });
      res.status(403).json({
        error: 'Access Denied: You do not have the required permission.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission,
      });
      return;
    }

    req.authContext = ctx;
    next();
  };
}

/**
 * التحقق من امتلاك المستخدم لمؤساة معيّنة (tenant isolation).
 * يُستخدم لحماية الـ IDOR — لا يُسمح للمستخدم بالوصول لموارد مؤساة أخرى.
 *
 * ⚠️ ملاحظة أمنية: table و idColumn يُستخدمان كقيم معيّنة للكتابة —
 * لا يتم أبداً إدخالها كقيم من المستخدم. يجب أن يكونا constants صريحة في كل استدعاء.
 * نضيف أيضاً قائمة بيضاء (allowlist) للجداول لتقييد أي إدخال خارجي.
 */

/** قائمة بيضاء بالجداول الداخلة في فحص الملكية المؤسسية */
const ALLOWED_OWNERSHIP_TABLES = new Set([
  'projects',
  'documents',
  'activities',
  'chart_of_accounts',
  'transactions',
  'donors',
  'beneficiaries',
  'hr_staff',
  'volunteers',
  'vendors',
  'rfqs',
  'campaigns',
  'grants',
  'budget_lines',
  'purchase_orders',
  'goods_receipts',
  'vendor_invoices',
  'knowledge_articles',
]);

/** قائمة بيضاء بأسماء الأعمدة المسموح استخدامها كـ id/org column */
const ALLOWED_COLUMNS = new Set(['id', 'organization_id', 'tenant_id', 'owner_id', 'user_id', 'project_id', 'campaign_id', 'donor_id', 'grant_id']);

/**
 * يتحقق أن الـ table والـ id/org columns ضمن القوائم البيضاء
 * — يمنع SQL injection حتى لو وصلت من إدخال خارجي.
 */
function assertSafeOwnershipQuery(
  table: string,
  idColumn: string,
  orgColumn: string
): void {
  if (!/^[a-z_][a-z0-9_]*$/.test(table) || !ALLOWED_OWNERSHIP_TABLES.has(table)) {
    throw new Error(`Ownership check blocked: table '${table}' is not in the allowlist`);
  }
  if (!ALLOWED_COLUMNS.has(idColumn) || !/^[a-z_][a-z0-9_]*$/.test(idColumn)) {
    throw new Error(`Ownership check blocked: idColumn '${idColumn}' is not in the allowlist`);
  }
  if (!ALLOWED_COLUMNS.has(orgColumn) || !/^[a-z_][a-z0-9_]*$/.test(orgColumn)) {
    throw new Error(`Ownership check blocked: orgColumn '${orgColumn}' is not in the allowlist`);
  }
}
export async function verifyOrganizationOwnership(
  resourceId: string,
  table: string,
  userId: string,
  userOrgId: string,
  idColumn: string = 'id',
  orgColumn: string = 'organization_id',
  queryFn: (text: string, params: any[]) => Promise<{ rows: any[] }> = queryOne as (text: string, params: any[]) => Promise<{ rows: any[] }>
): Promise<boolean> {
  try {
    // حماية إضافية: التحقق من allowlist قبل بناء الاستعلام حتى لو وصلت
    // table/idColumn/orgColumn من مصدر غير موثوق (منع SQL injection)
    assertSafeOwnershipQuery(table, idColumn, orgColumn);

    const result = await queryFn(
      `SELECT ${orgColumn} AS org_id FROM ${table} WHERE ${idColumn} = $1 AND deleted_at IS NULL`,
      [resourceId]
    );
    // queryOne returns the first row directly; query returns { rows: [...] }
    const row = (result as any)?.rows ? (result as any).rows[0] : result;

    if (!row) {
      return false; // غير موجود → 404 سيتعامل معه المتصل
    }

    return String(row.org_id) === String(userOrgId);
  } catch (error) {
    logger.error('verifyOrganizationOwnership error', {
      context: 'authz',
      meta: { resourceId, table, userId, error: error instanceof Error ? error.message : String(error) },
    });
    return false; // fail-closed: أي خطأ = رفض
  }
}

/**
 * حامل ملكية المؤسسة — يتحقّق أن العنصر المطلوب للتعديل ينتمي للمؤسسة.
 * يُستخدم مع resource_id من الـ params.
 *
 * مثال:
 *   app.delete('/api/projects/:projectId', authenticateToken, requireOrgOwnership('projects', 'projectId'), handler);
 */
export function requireOrgOwnership(table: string, idParam: string = 'id') {
  return async (
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const ctx = getAuthContext(req);
    if (!ctx) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const resourceId = req.params[idParam];
    if (!resourceId) {
      res.status(400).json({ error: `Missing ${idParam} parameter` });
      return;
    }

    const authorized = await verifyOrganizationOwnership(
      resourceId,
      table,
      ctx.userId,
      ctx.orgId
    );

    if (!authorized) {
      // نُرجع 404 بدلاً من 403 لتفادي تسريخ وجود الـ resource (anti-enumeration)
      res.status(404).json({
        error: 'Resource not found or access denied',
        code: 'NOT_AUTHORIZED',
      });
      return;
    }

    next();
  };
}

// ─────────────────────────────────────────────
// 6. توافق عكسي مع الواجهات القديمة
// ─────────────────────────────────────────────

/**
 * تحويل security_level إلى صلاحيات — يستخدم للتكامل القديم.
 * المبدأ: كلما ارتفع المستوى، زادت الصلاحيات.
 */
export function securityLevelToPermission(level: number): Permission[] {
  if (level >= 5) return [Permission.RESOURCE_READ, Permission.RESOURCE_WRITE, Permission.RESOURCE_DELETE];
  if (level >= 4) return [Permission.RESOURCE_READ, Permission.RESOURCE_WRITE];
  if (level >= 3) return [Permission.RESOURCE_READ];
  return []; // المستوى 2 وأقل يعتمد على الصلاحيات التفصيلية
}

/** توافق مع requireSecurityLevel القديم — يرفعه إلى صلاحية مرتبطة */
export function requireMinSecurityLevelLegacy(minLevel: number) {
  return (req: AuthorizedRequest, res: Response, next: NextFunction): void => {
    const ctx = getAuthContext(req);
    if (!ctx || ctx.securityLevel < minLevel) {
      res.status(403).json({
        error: `Access Denied: Required security level ${minLevel}, your level is ${ctx?.securityLevel ?? 0}`,
      });
      return;
    }
    req.authContext = ctx;
    next();
  };
}

export default {
  SystemRole,
  Permission,
  ROLE_SECURITY_LEVEL,
  PERMISSION_ROLES,
  getAuthContext,
  hasPermission,
  verifyOrganizationOwnership,
  isSelfOrAdmin,
  requirePermission,
  requireOrgOwnership,
  requireSelf,
  requireMinSecurityLevelLegacy,
  securityLevelToPermission,
};
