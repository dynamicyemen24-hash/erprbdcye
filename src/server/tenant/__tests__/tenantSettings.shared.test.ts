import { describe, it, expect } from 'vitest';
import {
  BRAND_THEME_KEYS,
  SUBSCRIPTION_PLANS,
  canManageTenantSettings,
  resolveSubscriptionPlan,
  validateBrandThemeBody,
} from '../tenantSettings.shared';

describe('validateBrandThemeBody', () => {
  it('accepts a full valid patch and lowercases colors', () => {
    const result = validateBrandThemeBody({
      primary_color: '#059669',
      accent_color: '#D97706',
      dark_bg: '#090d16',
      light_bg: '#F8FAFC',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.patch).toEqual({
        primary_color: '#059669',
        accent_color: '#d97706',
        dark_bg: '#090d16',
        light_bg: '#f8fafc',
      });
    }
  });

  it('accepts a partial patch (only supplied keys are written)', () => {
    const result = validateBrandThemeBody({ primary_color: '#1d4ed8' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.patch)).toEqual(['primary_color']);
  });

  it('accepts 3-digit hex colors', () => {
    const result = validateBrandThemeBody({ primary_color: '#AbC' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.patch.primary_color).toBe('#abc');
  });

  it('rejects non-object bodies', () => {
    expect(validateBrandThemeBody(null).ok).toBe(false);
    expect(validateBrandThemeBody('nope').ok).toBe(false);
    expect(validateBrandThemeBody([1, 2]).ok).toBe(false);
    expect(validateBrandThemeBody(undefined).ok).toBe(false);
  });

  it('rejects invalid color values', () => {
    for (const bad of ['red', '059669', '#12345', '#GGGGGG', 42, {}]) {
      const result = validateBrandThemeBody({ primary_color: bad });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain('primary_color');
    }
  });

  it('ignores unknown keys but rejects bodies with zero known keys', () => {
    const poison = validateBrandThemeBody({ primary_color: '#059669', is_admin: true, settings: '{"x":1}' });
    expect(poison.ok).toBe(true);
    if (poison.ok) expect(Object.keys(poison.patch)).toEqual(['primary_color']);

    const onlyUnknown = validateBrandThemeBody({ evil_key: '#059669' });
    expect(onlyUnknown.ok).toBe(false);
  });

  it('exposes exactly the four documented theme keys', () => {
    expect([...BRAND_THEME_KEYS]).toEqual(['primary_color', 'accent_color', 'dark_bg', 'light_bg']);
  });
});

describe('subscription plan catalog', () => {
  it('resolves every published plan with its server-side limits', () => {
    expect(resolveSubscriptionPlan('starter')).toEqual({ plan: 'starter', maxUsers: 10, maxStorageGb: 10 });
    expect(resolveSubscriptionPlan('enterprise_pro')).toEqual({ plan: 'enterprise_pro', maxUsers: 50, maxStorageGb: 100 });
    expect(resolveSubscriptionPlan('humanitarian')).toEqual({ plan: 'humanitarian', maxUsers: 100, maxStorageGb: 200 });
    expect(resolveSubscriptionPlan('sovereign')).toEqual({ plan: 'sovereign', maxUsers: 999, maxStorageGb: 1000 });
  });

  it('rejects unknown or non-string plan keys', () => {
    expect(resolveSubscriptionPlan('enterprise')).toBeNull();
    expect(resolveSubscriptionPlan('UNLIMITED_FREE')).toBeNull();
    expect(resolveSubscriptionPlan(42)).toBeNull();
    expect(resolveSubscriptionPlan(undefined)).toBeNull();
    expect(resolveSubscriptionPlan({ plan: 'sovereign' })).toBeNull();
  });

  it('never lets a caller push its own limits through the catalog', () => {
    const resolved = resolveSubscriptionPlan('starter');
    expect(resolved).not.toBeNull();
    expect(resolved!.maxUsers).toBe(10);
    expect(resolved!.maxStorageGb).toBe(10);
    expect(Object.keys(SUBSCRIPTION_PLANS)).toEqual(['starter', 'enterprise_pro', 'humanitarian', 'sovereign']);
  });
});

describe('canManageTenantSettings', () => {
  it('allows security_level >= 4', () => {
    expect(canManageTenantSettings({ security_level: 5 })).toBe(true);
    expect(canManageTenantSettings({ security_level: 4 })).toBe(true);
    expect(canManageTenantSettings({ security_level: '5' })).toBe(true);
  });

  it('rejects security_level < 4 (regular subscribers)', () => {
    expect(canManageTenantSettings({ security_level: 3 })).toBe(false);
    expect(canManageTenantSettings({ security_level: 0 })).toBe(false);
    expect(canManageTenantSettings({})).toBe(false);
    expect(canManageTenantSettings(null)).toBe(false);
    expect(canManageTenantSettings(undefined)).toBe(false);
  });

  it('accepts admin-equivalent roles regardless of level', () => {
    expect(canManageTenantSettings({ role: 'Administrator', security_level: 3 })).toBe(true);
    expect(canManageTenantSettings({ role: 'admin' })).toBe(true);
    expect(canManageTenantSettings({ role: 'owner' })).toBe(true);
    expect(canManageTenantSettings({ role: 'user' })).toBe(false);
  });
});
