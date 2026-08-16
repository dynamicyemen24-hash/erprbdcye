/**
 * NexoraOS™ Resume Intelligence Engine ("أكمل من حيث توقفت")
 * Preserves complete workspace state across reloads, network reconnects, and browser sessions.
 */

import { useState, useEffect, useCallback } from 'react';
import { persistenceService } from './persistence';
import { TabId } from '../../types';

export interface WorkspaceResumeState {
  lastActiveTab: TabId;
  lastActiveSubTab?: string;
  lastOpenedRecord?: {
    id: string;
    type: 'project' | 'program' | 'beneficiary' | 'sponsorship' | 'voucher' | 'activity' | 'report';
    code?: string;
    titleAr?: string;
    titleEn?: string;
  };
  lastActiveDraftKey?: string;
  lastActiveFilters?: Record<string, any>;
  timestamp: number;
  viewTitleAr: string;
  viewTitleEn: string;
}

const RESUME_STORAGE_KEY = 'nexora_resume_state';

class NexoraResumeIntelligence {
  private currentState: WorkspaceResumeState | null = null;
  private listeners: Set<(state: WorkspaceResumeState | null) => void> = new Set();

  constructor() {
    this.loadState();
  }

  private async loadState() {
    try {
      const saved = await persistenceService.get<WorkspaceResumeState>('user_preferences', RESUME_STORAGE_KEY);
      if (saved) {
        this.currentState = saved;
        this.notify();
      }
    } catch (e) {
      console.warn('[ResumeIntelligence] Failed to load saved state:', e);
    }
  }

  public subscribe(cb: (state: WorkspaceResumeState | null) => void): () => void {
    this.listeners.add(cb);
    cb(this.currentState);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentState));
  }

  public async recordActivity(state: Omit<WorkspaceResumeState, 'timestamp'>) {
    const fullState: WorkspaceResumeState = {
      ...state,
      timestamp: Date.now()
    };
    this.currentState = fullState;
    this.notify();

    try {
      await persistenceService.set('user_preferences', RESUME_STORAGE_KEY, fullState, 1000 * 60 * 60 * 24 * 14); // 14 days
    } catch (e) {
      console.warn('[ResumeIntelligence] Save error:', e);
    }
  }

  public getState(): WorkspaceResumeState | null {
    return this.currentState;
  }

  public async clearState() {
    this.currentState = null;
    this.notify();
    await persistenceService.delete('user_preferences', RESUME_STORAGE_KEY);
  }
}

export const resumeIntelligenceService = new NexoraResumeIntelligence();

export function useResumeIntelligence() {
  const [resumeState, setResumeState] = useState<WorkspaceResumeState | null>(resumeIntelligenceService.getState());

  useEffect(() => {
    return resumeIntelligenceService.subscribe(setResumeState);
  }, []);

  const recordResumeActivity = useCallback((state: Omit<WorkspaceResumeState, 'timestamp'>) => {
    resumeIntelligenceService.recordActivity(state);
  }, []);

  const clearResumeActivity = useCallback(() => {
    resumeIntelligenceService.clearState();
  }, []);

  return {
    resumeState,
    recordResumeActivity,
    clearResumeActivity
  };
}
