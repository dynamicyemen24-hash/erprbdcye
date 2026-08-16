import { useState, useEffect } from 'react';

const STORAGE_KEY = 'nexora_dashboard_layout';

export type DashboardPanel = 'anomalies' | 'strategic' | 'projection' | 'budgeting' | 'simulation' | 'compliance' | 'analysis' | 'audit' | 'lifecycle' | 'hr' | 'vendor' | 'briefing' | 'forensic' | 'sync' | 'workload' | 'stakeholder' | 'yoy' | 'procurement' | 'risk' | 'maintenance' | 'optimizer' | 'vendor_engine' | 'global_kpi' | 'branch_kpi' | 'ipsas_audit';

export const useDashboardLayout = () => {
  const [panels, setPanels] = useState<DashboardPanel[]>(['anomalies', 'strategic', 'projection', 'budgeting', 'simulation', 'compliance', 'analysis', 'audit', 'lifecycle', 'hr', 'vendor', 'briefing', 'forensic', 'sync', 'workload', 'stakeholder', 'yoy', 'procurement', 'risk', 'maintenance', 'optimizer', 'vendor_engine', 'global_kpi', 'branch_kpi', 'ipsas_audit']);
  const [visible, setVisible] = useState<Record<DashboardPanel, boolean>>({
    anomalies: true, strategic: true, projection: true, budgeting: true, simulation: true, compliance: true, analysis: true, audit: true, lifecycle: true, hr: true, vendor: true, briefing: true, forensic: true, sync: true, workload: true, stakeholder: true, yoy: true, procurement: true, risk: true, maintenance: true, optimizer: true, vendor_engine: true, global_kpi: true, branch_kpi: true, ipsas_audit: true
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setPanels(parsed.panels);
      setVisible(parsed.visible);
    }
  }, []);

  const saveLayout = (newPanels: DashboardPanel[], newVisible: Record<DashboardPanel, boolean>) => {
    setPanels(newPanels);
    setVisible(newVisible);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ panels: newPanels, visible: newVisible }));
  };

  return { panels, visible, saveLayout };
};
