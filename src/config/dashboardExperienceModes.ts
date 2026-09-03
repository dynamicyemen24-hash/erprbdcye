import { DashboardPreset, SYSTEM_PRESETS } from '../components/dashboard/SmartCustomizationPanel';

export const DASHBOARD_MODE_SETTING_KEY = 'dashboard_experience_config';

export interface DashboardExperienceConfig {
  defaultPresetId?: string;
  enabledPresetIds?: string[];
  forceDefault?: boolean;
}

export const SUBSCRIPTION_PRESET_ENTITLEMENTS: Record<string, string[]> = {
  starter: ['sys-minimal', 'sys-operations'],
  humanitarian: ['sys-minimal', 'sys-operations', 'sys-full'],
  enterprise_pro: ['sys-minimal', 'sys-operations', 'sys-full', 'sys-analytics', 'sys-command-center'],
  sovereign: ['sys-minimal', 'sys-operations', 'sys-full', 'sys-analytics', 'sys-command-center', 'sys-field-mobile']
};

export function parseDashboardExperienceConfig(settings: any[] = []): DashboardExperienceConfig {
  const setting = settings.find(item => (item.setting_key || item.key) === DASHBOARD_MODE_SETTING_KEY);
  if (!setting) return {};
  const value = setting.setting_value ?? setting.value;
  if (typeof value === 'object' && value !== null) return value as DashboardExperienceConfig;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getAvailableDashboardPresets(
  subscriptionPlan: string | undefined,
  config: DashboardExperienceConfig,
  customPresets: DashboardPreset[]
): DashboardPreset[] {
  const entitlement = SUBSCRIPTION_PRESET_ENTITLEMENTS[subscriptionPlan || 'enterprise_pro'] || SUBSCRIPTION_PRESET_ENTITLEMENTS.starter;
  const enabled = config.enabledPresetIds?.length ? config.enabledPresetIds : entitlement;
  return [...SYSTEM_PRESETS.filter(preset => enabled.includes(preset.id)), ...customPresets];
}
