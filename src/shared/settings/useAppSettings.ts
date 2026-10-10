/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Unified Settings Hook (DEBT PAID: 5 sources → 1 consumer API)
 *
 * Storage truth stays in TWO tables (`system_settings`, `organization_settings`).
 * Consumption truth is now ONE hook: this wraps `useEnterprisePolicies` (the only
 * fetcher) and adds typed, settings-driven defaults for the values views used to
 * hardcode (FX rates, zakat nisab, batch flags, branding).
 *
 * Every productive button MUST read its operational defaults from here — never
 * from a literal — so Settings ↔ DB ↔ UI stay linked.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import { useMemo } from 'react';
import { useEnterprisePolicies } from '../../core/hooks/useEnterprisePolicies';

export interface FxRates {
  USD_YER: number;
  SAR_YER: number;
  EUR_USD: number;
}

export interface AppSettings {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  getSystemSetting: <T>(key: string, fallback: T) => T;
  getOrgPolicy: <T>(key: string, fallback: T) => T;
  updateSettingInDB: (key: string, value: unknown, description?: string) => Promise<boolean>;
  /** Live FX triangulation, settings-overrideable, DB-backed fallback chain. */
  fx: FxRates;
  /** Gold price (YER/gram) driving the zakat nisab threshold. */
  goldPriceYer: number;
  /** Nisab threshold = 85g gold equivalent (settings-overrideable multiplier). */
  nisabThresholdYer: number;
  /** Batch automation flags persisted to system_settings when toggled. */
  batchFlags: { autoPostPayroll: boolean; autoPostInventory: boolean; autoRevalueCurrencies: boolean };
  /** Persist one batch flag (writes through to system_settings). */
  setBatchFlag: (key: keyof AppSettings['batchFlags'], value: boolean) => Promise<boolean>;
}

const DEFAULT_FX: FxRates = { USD_YER: 535, SAR_YER: 142.5, EUR_USD: 1.085 };

export function useAppSettings(): AppSettings {
  const policies = useEnterprisePolicies();

  const fx = useMemo<FxRates>(() => {
    const fromSettings = policies.getSystemSetting<Partial<FxRates> | null>('fx_rates', null);
    if (fromSettings && typeof fromSettings === 'object') {
      return {
        USD_YER: Number(fromSettings.USD_YER) || DEFAULT_FX.USD_YER,
        SAR_YER: Number(fromSettings.SAR_YER) || DEFAULT_FX.SAR_YER,
        EUR_USD: Number(fromSettings.EUR_USD) || DEFAULT_FX.EUR_USD,
      };
    }
    const usdYer = Number(policies.getSystemSetting('exchange_usd_yer', DEFAULT_FX.USD_YER)) || DEFAULT_FX.USD_YER;
    const sarYer = Number(policies.getSystemSetting('exchange_sar_yer', DEFAULT_FX.SAR_YER)) || DEFAULT_FX.SAR_YER;
    const eurUsd = Number(policies.getSystemSetting('exchange_eur_usd', DEFAULT_FX.EUR_USD)) || DEFAULT_FX.EUR_USD;
    return { USD_YER: usdYer, SAR_YER: sarYer, EUR_USD: eurUsd };
  }, [policies]);

  const goldPriceYer = useMemo(
    () => Number(policies.getSystemSetting('gold_price_yer', 85000)) || 85000,
    [policies]
  );

  const nisabThresholdYer = useMemo(() => {
    const grams = Number(policies.getSystemSetting('zakat_nisab_grams', 85)) || 85;
    return Math.round(grams * goldPriceYer);
  }, [policies, goldPriceYer]);

  const batchFlags = useMemo(
    () => ({
      autoPostPayroll: Boolean(policies.getSystemSetting('batch_auto_post_payroll', true)),
      autoPostInventory: Boolean(policies.getSystemSetting('batch_auto_post_inventory', true)),
      autoRevalueCurrencies: Boolean(policies.getSystemSetting('batch_auto_revalue_currencies', true)),
    }),
    [policies]
  );

  const setBatchFlag: AppSettings['setBatchFlag'] = async (key, value) => {
    const map: Record<string, string> = {
      autoPostPayroll: 'batch_auto_post_payroll',
      autoPostInventory: 'batch_auto_post_inventory',
      autoRevalueCurrencies: 'batch_auto_revalue_currencies',
    };
    return policies.updateSettingInDB(map[key], value, `Batch automation flag ${key} updated from UI`);
  };

  return {
    loading: policies.loading,
    error: policies.error,
    lastUpdated: policies.lastUpdated,
    refresh: policies.refresh,
    getSystemSetting: policies.getSystemSetting,
    getOrgPolicy: policies.getOrgPolicy,
    updateSettingInDB: policies.updateSettingInDB,
    fx,
    goldPriceYer,
    nisabThresholdYer,
    batchFlags,
    setBatchFlag,
  };
}

export default useAppSettings;
