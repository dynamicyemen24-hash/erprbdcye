
// NEB-13: AI Intelligence & Impact OS - Scenario Simulator Service

export async function runSimulation(historicalData: any, scenarioParams: any): Promise<string> {
  const response = await fetch('/api/gemini/scenario-simulator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ historicalData, scenarioParams }),
  });
  const data = await response.json();
  return data.report;
}
