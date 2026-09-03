// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Operational Unit Container
// Hosts the WorkspaceShell with a specific domain
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { UAMEXWorkspaceShell, WorkspaceColumn, WorkspaceAction } from './UAMEXWorkspaceShell';
import { Briefcase, Target, Users, Heart, DollarSign, Activity, Shield, FileText, Layers } from 'lucide-react';

type Lang = 'ar' | 'en';
type Theme = 'light' | 'dark';

export type OperationalDomain =
  | 'NEB-01' | 'NEB-02' | 'NEB-03' | 'NEB-04' | 'NEB-05'
  | 'NEB-06' | 'NEB-07' | 'NEB-08' | 'NEB-09' | 'NEB-10'
  | 'NEB-11' | 'NEB-12' | 'NEB-13' | 'NEB-14' | 'NEB-15';

export interface OperationalUnitConfig {
  domain: OperationalDomain;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  iconName: 'briefcase' | 'target' | 'users' | 'heart' | 'dollar' | 'activity' | 'shield' | 'file' | 'layers';
}

const ICON_MAP = {
  briefcase: Briefcase,
  target: Target,
  users: Users,
  heart: Heart,
  dollar: DollarSign,
  activity: Activity,
  shield: Shield,
  file: FileText,
  layers: Layers,
};

export interface UAMEXOperationalUnitProps<T = any> {
  config: OperationalUnitConfig;
  data: T[];
  columns: WorkspaceColumn<T>[];
  actions?: WorkspaceAction[];
  loading?: boolean;
  lang: Lang;
  theme: Theme;
  searchPlaceholderAr?: string;
  searchPlaceholderEn?: string;
  onCreate?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  filters?: React.ReactNode;
  emptyMessageAr?: string;
  emptyMessageEn?: string;
  getRowId?: (row: T) => string;
  onSelectionChange?: (ids: string[]) => void;
}

export function UAMEXOperationalUnit<T extends Record<string, any>>(
  props: UAMEXOperationalUnitProps<T>
) {
  const Icon = ICON_MAP[props.config.iconName];

  return (
    <UAMEXWorkspaceShell
      titleAr={props.config.titleAr}
      titleEn={props.config.titleEn}
      subtitleAr={props.config.subtitleAr}
      subtitleEn={props.config.subtitleEn}
      icon={Icon}
      domainCode={props.config.domain}
      data={props.data}
      columns={props.columns}
      actions={props.actions}
      loading={props.loading}
      lang={props.lang}
      theme={props.theme}
      searchPlaceholderAr={props.searchPlaceholderAr}
      searchPlaceholderEn={props.searchPlaceholderEn}
      onCreate={props.onCreate}
      onRefresh={props.onRefresh}
      onExport={props.onExport}
      filters={props.filters}
      emptyMessageAr={props.emptyMessageAr}
      emptyMessageEn={props.emptyMessageEn}
      getRowId={props.getRowId}
      onSelectionChange={props.onSelectionChange}
    />
  );
}

export default UAMEXOperationalUnit;
