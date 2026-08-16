import { useState, useEffect, useCallback, useRef } from 'react';
import { persistenceService } from '../services/persistence';

interface UseDraftVaultOptions<T> {
  formKey: string;
  initialValues: T;
  debounceMs?: number;
  onRestore?: (restoredData: T) => void;
}

export function useDraftVault<T extends Record<string, any>>({
  formKey,
  initialValues,
  debounceMs = 400,
  onRestore
}: UseDraftVaultOptions<T>) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const debounceTimerRef = useRef<any>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  // 1. Check & Restore draft on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDraft() {
      try {
        const saved = await persistenceService.get<T>('user_preferences', `draft:${formKey}`);
        if (saved && isMounted) {
          setFormData(saved);
          setHasDraft(true);
          setLastSavedTime(new Date());
          if (onRestore) onRestore(saved);
        }
      } catch (e) {
        console.warn(`[DraftVault] Failed to load draft for ${formKey}:`, e);
      } finally {
        isInitialLoadRef.current = false;
      }
    }
    loadDraft();
    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [formKey]);

  // 2. Debounced auto-save on state change
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      if (!isInitialLoadRef.current) {
        setIsSaving(true);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(async () => {
          try {
            await persistenceService.set('user_preferences', `draft:${formKey}`, next, 1000 * 60 * 60 * 24 * 7); // 7 days TTL
            setLastSavedTime(new Date());
            setHasDraft(true);
          } catch (err) {
            console.warn(`[DraftVault] Save error for ${formKey}:`, err);
          } finally {
            setIsSaving(false);
          }
        }, debounceMs);
      }

      return next;
    });
  }, [formKey, debounceMs]);

  // 3. Clear draft upon submit
  const clearDraft = useCallback(async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    await persistenceService.delete('user_preferences', `draft:${formKey}`);
    setHasDraft(false);
    setLastSavedTime(null);
  }, [formKey]);

  // 4. Reset to initial values
  const resetForm = useCallback(async () => {
    await clearDraft();
    setFormData(initialValues);
  }, [clearDraft, initialValues]);

  return {
    formData,
    setFormData,
    updateField,
    hasDraft,
    isSaving,
    lastSavedTime,
    clearDraft,
    resetForm
  };
}
