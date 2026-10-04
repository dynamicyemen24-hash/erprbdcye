/**
 * Tenant SaaS settings shared by BOTH runtimes:
 *  - Vercel serverless handlers (api/tenant/*.ts) for production
 *  - Express router (src/server/routes/v2/tenant.routes.ts) for local dev
 *
 * Pure logic only — no I/O — so both runtimes stay behavior-identical and
 * the rules are unit-testable. Tenant identity itself is never accepted
 * from the request body: it always comes from signed token claims
 * (authContext on serverless, authenticateToken on Express).
 */

export const BRAND_THEME_KEYS = ['primary_color', 'accent_color', 'dark_bg', 'light_bg'] as const;
export type BrandThemeKey = (typeof BRAND_THEME_KEYS)[number];
export type BrandThemePatch = Partial<Record<BrandThemeKey, string>>;

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export interface BrandThemeValidation {
  ok: boolean;
  /** Failure reason when ok === false, null otherwise. */
  error: string | null;
  /** Validated patch when ok === true, empty object otherwise. */
  patch: BrandThemePatch;
}

/**
 * Whitelist validation: only the four known theme keys are ever accepted,
 * unknown keys are ignored (they can never poison organizations.settings)
 * and a body with zero known keys is rejected outright.
 */
export function validateBrandThemeBody(body: unknown): BrandThemeValidation {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be an object', patch: {} };
  }
  const record = body as Record<string, unknown>;
  const patch: BrandThemePatch = {};
  for (const key of BRAND_THEME_KEYS) {
    const value = record[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string' || !HEX_COLOR_PATTERN.test(value)) {
      return { ok: false, error: `Invalid color for ${key}: expected #RRGGBB or #RGB`, patch: {} };
    }
    patch[key] = value.toLowerCase();
  }
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: `No theme fields supplied (allowed: ${BRAND_THEME_KEYS.join(', ')})`, patch: {} };
  }
  return { ok: true, error: null, patch };
}

export interface SubscriptionPlanLimits {
  plan: string;
  maxUsers: number;
  maxStorageGb: number;
}

/**
 * Server-side plan catalog — the single source of truth for quota limits.
 * The client only ever submits a plan KEY; limits are computed here so a
 * subscriber can never self-assign higher quotas.
 */
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanLimits> = {
  starter: { plan: 'starter', maxUsers: 10, maxStorageGb: 10 },
  enterprise_pro: { plan: 'enterprise_pro', maxUsers: 50, maxStorageGb: 100 },
  humanitarian: { plan: 'humanitarian', maxUsers: 100, maxStorageGb: 200 },
  sovereign: { plan: 'sovereign', maxUsers: 999, maxStorageGb: 1000 },
};

export function resolveSubscriptionPlan(key: unknown): SubscriptionPlanLimits | null {
  if (typeof key !== 'string') return null;
  return SUBSCRIPTION_PLANS[key] || null;
}

/**
 * Mirrors the Express table guard for sensitive organizations writes
 * (tables.routes.ts requires security_level >= 4 for the organizations
 * table) so both runtimes enforce the same authorization bar.
 */
export function canManageTenantSettings(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const record = payload as Record<string, unknown>;
  const level = Number(record.security_level);
  if (Number.isFinite(level) && level >= 4) return true;
  const role = String(record.role || '').toLowerCase();
  return role === 'administrator' || role === 'admin' || role === 'owner';
}
