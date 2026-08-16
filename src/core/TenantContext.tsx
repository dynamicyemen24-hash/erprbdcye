import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantContextState } from '../types/multiTenantCore';

interface TenantContextType {
  tenantContext: TenantContextState;
  switchOrganization: (orgId: string, orgNameAr: string, orgNameEn: string) => void;
  switchFiscalYear: (fy: string) => void;
  availableOrganizations: { id: string; name_ar: string; name_en: string; type_code: string }[];
}

const DEFAULT_TENANT: TenantContextState = {
  tenantId: '00000000-0000-0000-0000-000000000001',
  organizationId: '00000000-0000-0000-0000-000000000001',
  organizationNameAr: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
  organizationNameEn: 'Rohamaa Charity Foundation',
  fiscalYear: 'FY2026',
  currencyCode: 'YER',
  userRole: 'TENANT_ADMIN',
  isPlatformAdmin: true
};

const TenantContext = createContext<TenantContextType>({
  tenantContext: DEFAULT_TENANT,
  switchOrganization: () => {},
  switchFiscalYear: () => {},
  availableOrganizations: []
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantContext, setTenantContext] = useState<TenantContextState>(() => {
    try {
      const saved = localStorage.getItem('nexora_tenant_context');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_TENANT;
  });

  const [availableOrganizations, setAvailableOrganizations] = useState<any[]>([
    {
      id: '00000000-0000-0000-0000-000000000001',
      name_ar: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
      name_en: 'Rohamaa Charity Foundation',
      type_code: 'charity'
    },
    {
      id: 'b1d4d60b-0099-4a28-ad4c-4b32d9f9bfb3',
      name_ar: 'المؤسسة الخيرية للتنمية والتمكين',
      name_en: 'Charitable Development Organization',
      type_code: 'foundation'
    }
  ]);

  useEffect(() => {
    fetch('/api/tables/organizations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableOrganizations(data);
        }
      })
      .catch(err => console.error('Failed to load organizations context:', err));
  }, []);

  const switchOrganization = (orgId: string, orgNameAr: string, orgNameEn: string) => {
    const updated: TenantContextState = {
      ...tenantContext,
      tenantId: orgId,
      organizationId: orgId,
      organizationNameAr: orgNameAr,
      organizationNameEn: orgNameEn
    };
    setTenantContext(updated);
    try {
      localStorage.setItem('nexora_tenant_context', JSON.stringify(updated));
    } catch (e) {}
  };

  const switchFiscalYear = (fy: string) => {
    const updated: TenantContextState = {
      ...tenantContext,
      fiscalYear: fy
    };
    setTenantContext(updated);
    try {
      localStorage.setItem('nexora_tenant_context', JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <TenantContext.Provider value={{ tenantContext, switchOrganization, switchFiscalYear, availableOrganizations }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => useContext(TenantContext);
