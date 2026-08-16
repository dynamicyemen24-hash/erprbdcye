// NEB-13: AI Intelligence & Impact OS - Strategic Anomaly Monitor Service
import { LedgerEntry } from '../ledger/types';
import { Project, ProjectMilestone } from '../types/projects';

export interface StrategicAnomaly {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: 'high' | 'medium';
}

export async function checkStrategicAnomalies(
  entries: LedgerEntry[],
  projects: Project[],
  milestones: ProjectMilestone[]
): Promise<StrategicAnomaly[]> {
  try {
    const response = await fetch('/api/gemini/strategic-anomaly-monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries, projects, milestones }),
    });
    const data = await response.json();
    return data.anomalies || [];
  } catch (err) {
    console.error("Error in checkStrategicAnomalies:", err);
    return [];
  }
}
