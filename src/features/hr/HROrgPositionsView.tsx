import React from 'react';
import InstitutionalOrgStructureView from '../organization/InstitutionalOrgStructureView';

interface HROrgPositionsViewProps {
  lang: 'ar' | 'en';
  onNavigateToCostCenter?: (costCenterCode: string) => void;
}

export default function HROrgPositionsView({ lang, onNavigateToCostCenter }: HROrgPositionsViewProps) {
  return (
    <InstitutionalOrgStructureView 
      lang={lang} 
      onNavigateToCostCenter={onNavigateToCostCenter} 
    />
  );
}
