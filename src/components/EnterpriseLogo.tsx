import React, { useState } from 'react';
import { Building, ShieldCheck } from 'lucide-react';
import { useOrganizationBranding } from '../core/hooks/useOrganizationBranding';

interface EnterpriseLogoProps {
  src?: string;
  alt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  lang?: 'ar' | 'en';
}

export const EnterpriseLogo: React.FC<EnterpriseLogoProps> = ({
  src,
  alt,
  className = 'h-7 w-auto object-contain',
  size = 'md',
  showBadge = false,
  lang
}) => {
  const branding = useOrganizationBranding();
  const [imageFailed, setImageFailed] = useState(false);

  // Fallback language resolution
  const resolvedLang = lang || 'ar';
  const resolvedSrc = src || branding.logoUrl;
  const resolvedAlt = alt || branding.orgName;
  const colors = branding.brandingColors;

  if (imageFailed) {
    return (
      <div 
        className={`flex items-center gap-1.5 text-white font-black rounded-lg px-2.5 py-1 border shadow-sm shrink-0 select-none ${
          size === 'sm' ? 'text-[10px] h-6' : size === 'lg' ? 'text-sm h-10' : 'text-xs h-8'
        }`}
        style={{
          backgroundColor: colors?.primary || branding.primaryColor,
          borderColor: colors?.accent || branding.accentColor,
        }}
        title={resolvedAlt}
      >
        <Building className="w-4 h-4 text-white shrink-0" />
        <span className="tracking-wide">
          {resolvedAlt.split(' ')[0] || (resolvedLang === 'ar' ? 'رُحماء' : 'Rohamaa')}
        </span>
        {showBadge && (
          <ShieldCheck className="w-3.5 h-3.5 text-white shrink-0 ml-0.5" />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <img
        src={resolvedSrc}
        alt={resolvedAlt}
        className={className}
        onError={() => setImageFailed(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default EnterpriseLogo;
