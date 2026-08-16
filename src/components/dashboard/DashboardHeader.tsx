import React from 'react';
import { UnifiedActionBar, UnifiedActionBarProps } from '../UnifiedActionBar';

export type DashboardHeaderProps = UnifiedActionBarProps;

export const DashboardHeader: React.FC<DashboardHeaderProps> = (props) => {
  return <UnifiedActionBar {...props} />;
};

export default DashboardHeader;

