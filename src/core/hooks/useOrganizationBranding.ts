import { useMemo } from 'react';
import { useEnterprise } from '../context/EnterpriseContext';

export interface BrandingColors {
  primary: string;
  accent: string;
  darkBg: string;
  lightBg: string;
}

export function useOrganizationBranding() {
  const context = useEnterprise();

  return useMemo(() => ({
    activeOrg: context.activeOrg,
    orgName: context.orgName,
    logoUrl: context.logoUrl,
    licenseText: context.licenseText,
    brandingColors: context.brandingColors,
    primaryColor: context.brandingColors?.primary || '#059669',
    accentColor: context.brandingColors?.accent || '#d97706',
    darkBg: context.brandingColors?.darkBg || '#090d16',
    lightBg: context.brandingColors?.lightBg || '#f8fafc',
    loading: context.loadingOrganizations,
    organizations: context.organizations,
    refetchOrganizations: context.refetchOrganizations,
  }), [
    context.activeOrg,
    context.orgName,
    context.logoUrl,
    context.licenseText,
    context.brandingColors,
    context.loadingOrganizations,
    context.organizations,
    context.refetchOrganizations,
  ]);
}

export default useOrganizationBranding;
