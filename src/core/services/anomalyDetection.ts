// NEB-13: AI Intelligence & Impact OS - Anomaly Detection Service
import { LedgerEntry } from '../ledger/types';

export interface Anomaly {
  entryId: string;
  reason: string;
  severity: 'high' | 'medium';
  timestamp: string;
}

// Simulated heuristic: Flag amounts over 10,000 as high severity
export function detectAnomalies(entries: LedgerEntry[]): Anomaly[] {
  return entries
    .filter(e => e.amount > 10000)
    .map(e => ({ 
      entryId: e.id, 
      reason: 'Unusually high transaction amount detected', 
      severity: 'high',
      timestamp: new Date().toISOString()
    }));
}
