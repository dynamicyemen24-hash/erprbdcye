import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type EnvironmentMode = 'production' | 'training';

export interface EnvironmentModeConfig {
  mode: EnvironmentMode;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const ENVIRONMENT_MODES: Record<EnvironmentMode, EnvironmentModeConfig> = {
  production: {
    mode: 'production',
    labelAr: 'بيئة الإنتاج',
    labelEn: 'Production',
    descriptionAr: 'البيانات الحقيقية للمؤسسة — جميع التغييرات تؤثر مباشرة على السجلات الرسمية',
    descriptionEn: 'Live organizational data — all changes directly affect official records',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: '🛡️',
  },
  training: {
    mode: 'training',
    labelAr: 'بيئة التدريب',
    labelEn: 'Training',
    descriptionAr: 'بيانات تدريبية آمنة — لا تؤثر على البيانات الحقيقية. مثالية للموظفين الجدد وال.learn',
    descriptionEn: 'Safe training data — does not affect live records. Ideal for new staff onboarding',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: '🎓',
  },
};

export interface EnvironmentModeContextType {
  environmentMode: EnvironmentMode;
  setEnvironmentMode: (mode: EnvironmentMode) => void;
  toggleEnvironmentMode: () => void;
  isTrainingMode: boolean;
  isProductionMode: boolean;
  currentConfig: EnvironmentModeConfig;
  trainingSessionStartedAt: number | null;
  trainingSessionDuration: string | null;
  resetTrainingSession: () => void;
  lastModeSwitchAt: number | null;
}

const EnvironmentModeContext = createContext<EnvironmentModeContextType | undefined>(undefined);

const STORAGE_KEY = 'nexora_environment_mode';
const TRAINING_SESSION_KEY = 'nexora_training_session_start';
const LAST_SWITCH_KEY = 'nexora_last_mode_switch';

function getStoredMode(): EnvironmentMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'production' || saved === 'training') return saved;
  } catch (e) { /* ignore */ }
  return 'production';
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export const EnvironmentModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [environmentMode, setEnvironmentModeState] = useState<EnvironmentMode>(getStoredMode);
  const [trainingSessionStartedAt, setTrainingSessionStartedAt] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(TRAINING_SESSION_KEY);
      return saved ? parseInt(saved, 10) : null;
    } catch { return null; }
  });
  const [lastModeSwitchAt, setLastModeSwitchAt] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(LAST_SWITCH_KEY);
      return saved ? parseInt(saved, 10) : null;
    } catch { return null; }
  });
  const [, setTick] = useState(0);

  // Update training session duration every 30 seconds
  useEffect(() => {
    if (environmentMode !== 'training' || !trainingSessionStartedAt) return;
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, [environmentMode, trainingSessionStartedAt]);

  const setEnvironmentMode = useCallback((mode: EnvironmentMode) => {
    const prevMode = environmentMode;
    setEnvironmentModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      localStorage.setItem(LAST_SWITCH_KEY, String(Date.now()));
      setLastModeSwitchAt(Date.now());

      if (mode === 'training' && prevMode !== 'training') {
        const sessionStart = Date.now();
        localStorage.setItem(TRAINING_SESSION_KEY, String(sessionStart));
        setTrainingSessionStartedAt(sessionStart);
      } else if (mode === 'production') {
        localStorage.removeItem(TRAINING_SESSION_KEY);
        setTrainingSessionStartedAt(null);
      }

      // Dispatch custom event for other components to react
      window.dispatchEvent(new CustomEvent('nexora:environment-mode-changed', {
        detail: { mode, previousMode: prevMode, timestamp: Date.now() }
      }));
    } catch (e) { /* ignore */ }
  }, [environmentMode]);

  const toggleEnvironmentMode = useCallback(() => {
    setEnvironmentMode(environmentMode === 'production' ? 'training' : 'production');
  }, [environmentMode, setEnvironmentMode]);

  const resetTrainingSession = useCallback(() => {
    const sessionStart = Date.now();
    try {
      localStorage.setItem(TRAINING_SESSION_KEY, String(sessionStart));
    } catch { /* ignore */ }
    setTrainingSessionStartedAt(sessionStart);
  }, []);

  const trainingSessionDuration = useMemo(() => {
    if (!trainingSessionStartedAt || environmentMode !== 'training') return null;
    return formatDuration(Date.now() - trainingSessionStartedAt);
  }, [trainingSessionStartedAt, environmentMode, trainingSessionStartedAt]);

  const value = useMemo(() => ({
    environmentMode,
    setEnvironmentMode,
    toggleEnvironmentMode,
    isTrainingMode: environmentMode === 'training',
    isProductionMode: environmentMode === 'production',
    currentConfig: ENVIRONMENT_MODES[environmentMode],
    trainingSessionStartedAt,
    trainingSessionDuration,
    resetTrainingSession,
    lastModeSwitchAt,
  }), [
    environmentMode, setEnvironmentMode, toggleEnvironmentMode,
    trainingSessionStartedAt, trainingSessionDuration, resetTrainingSession,
    lastModeSwitchAt,
  ]);

  return (
    <EnvironmentModeContext.Provider value={value}>
      {children}
    </EnvironmentModeContext.Provider>
  );
};

export const useEnvironmentMode = (): EnvironmentModeContextType => {
  const context = useContext(EnvironmentModeContext);
  if (!context) {
    throw new Error('useEnvironmentMode must be used within an EnvironmentModeProvider');
  }
  return context;
};

/**
 * Utility hook: Returns filtered data based on current environment mode.
 * In production mode, returns all data.
 * In training mode, returns only records marked as training data (is_training = true).
 * Falls back to returning all data if the is_training field doesn't exist on the records.
 */
export function useEnvironmentFilteredData<T extends Record<string, any>>(
  data: T[],
  options?: { includeMixed?: boolean }
): T[] {
  const { isTrainingMode } = useEnvironmentMode();

  return useMemo(() => {
    if (!data || data.length === 0) return data;

    // Check if records have is_training field
    const hasTrainingField = data.length > 0 && 'is_training' in data[0];

    if (!hasTrainingField) {
      // No training field present — return all data as-is
      // (backward compatible with existing data without the column)
      return data;
    }

    if (isTrainingMode) {
      return data.filter(r => r.is_training === true);
    } else {
      return data.filter(r => r.is_training !== true);
    }
  }, [data, isTrainingMode]);
}
