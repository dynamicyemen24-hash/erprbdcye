import { useState, useEffect } from 'react';

const STORAGE_KEY = 'nexora_dashboard_layout';

/** Available panels organized by UAMEX NEB domains and priority */
export type DashboardPanel = 
  | 'global_kpi'           // — strategic overview (NEB-01)
  | 'strategic'            // — strategic overview (NEB-01)  
  | 'anomalies'            // — risk detection (NEB-04/NEB-10)
  | 'compliance'           // — IPSAS compliance (NEB-10)
  | 'ipsas_audit'          // — audit (NEB-10)
  | 'projection'           // — budget/projection (NEB-06/NEB-15)
  | 'budgeting'            // — predictive budgeting (NEB-10)
  | 'risk'                 // — risk management (NEB-01/NEB-04)
  | 'simulation'           // — scenario simulation (NEB-04)
  | 'workload'             // — workload balancing (NEB-09)
  | 'procurement'          // — purchasing/RFQ (NEB-14)
  | 'vendor'               // — vendor management (NEB-14)
  | 'vendor_engine'        // — vendor engine (NEB-14)
  | 'maintenance'          // — asset maintenance (NEB-09)
  | 'lifecycle'            // — asset lifecycle (NEB-09)
  | 'hr'                   // — human resources (NEB-08)
  | 'stakeholder'          // — stakeholder engagement (NEB-07)
  | 'yoy'                  // — year-over-year analysis (NEB-01)
  | 'forensic'             // — forensic audit (NEB-10)
  | 'briefing'             // — proactive briefing (NEB-01)
  | 'yoY'                  // — alternate yoy notation
;

/** Default expert-recommended layout:
 * - Row 1: Strategic overview & risk (leadership focus)
 * - Row 2: Financial compliance & auditing (governance focus)
 * - Row 3: Operations & projects (daily management)
 * - Row 4: AI & intelligence (advanced analytics)
 * - Row 5: HR & stakeholders (human capital)
 * - Row 6: Monitoring & reference (maintenance/ops)
 */
export const useDashboardLayout = () => {
  const [panels, setPanels] = useState<DashboardPanel[]>(() => {
    // Expert-recommended default order (most critical first)
    return [
      'global_kpi',       // — strategic overview (NEB-01) — highest priority
      'strategic',        // — strategic overview (NEB-01)
      'anomalies',        // — risk detection, early warnings (NEB-04/NEB-10)
      'compliance',       // — IPSAS compliance monitoring (NEB-10)
      'projection',       // — budget & cash-flow projection (NEB-06/NEB-15)
      'budgeting',        // — predictive budgeting (NEB-10)
      'risk',             // — risk management (NEB-01/NEB-04)
      'simulation',       // — scenario simulation (NEB-04)
      'workload',         // — workload balancing (NEB-09)
      'procurement',      // — purchasing & RFQ (NEB-14)
      'vendor',           // — vendor management (NEB-14)
      'vendor_engine',    // — vendor engine (NEB-14)
      'maintenance',      // — asset maintenance (NEB-09)
      'lifecycle',        // — asset lifecycle (NEB-09)
      'hr',               // — human resources (NEB-08)
      'stakeholder',      // — stakeholder engagement (NEB-07)
      'yoy',              // — year-over-year analysis (NEB-01)
      'forensic',         // — forensic audit (NEB-10)
      'briefing',         // — proactive briefing (NEB-01)
      'ipsas_audit',      // — IPSAS audit trail (NEB-10)
    ];
  });

  const [visible, setVisible] = useState<Record<DashboardPanel, boolean>>(() => {
    // Default: show all panels in the expert-recommended order
    const defaultVisible: Record<DashboardPanel, boolean> = {
      global_kpi: true,
      strategic: true,
      anomalies: true,
      compliance: true,
      projection: true,
      budgeting: true,
      risk: true,
      simulation: true,
      workload: true,
      procurement: true,
      vendor: true,
      vendor_engine: true,
      maintenance: true,
      lifecycle: true,
      hr: true,
      stakeholder: true,
      yoy: true,
      forensic: true,
      briefing: true,
      yoY: true,
      ipsas_audit: true,
    };
    return defaultVisible;
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Preserve custom panel order but respect new defaults for visibility
      if (parsed.panels) {
        setPanels(parsed.panels);
      }
      if (parsed.visible) {
        setVisible(parsed.visible);
      }
    }
  }, []);

  const saveLayout = (newPanels: DashboardPanel[], newVisible: Record<DashboardPanel, boolean>) => {
    setPanels(newPanels);
    setVisible(newVisible);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ panels: newPanels, visible: newVisible }));
  };

  return { panels, visible, saveLayout };
};