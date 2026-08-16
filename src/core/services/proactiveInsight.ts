// NEB-13: AI Intelligence & Impact OS - Proactive Insight Engine Service
import { Anomaly } from './anomalyDetection';

export async function generateBriefing(anomalies: Anomaly[]): Promise<string> {
  const response = await fetch('/api/gemini/proactive-briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anomalies }),
  });
  const data = await response.json();
  return data.briefing;
}
