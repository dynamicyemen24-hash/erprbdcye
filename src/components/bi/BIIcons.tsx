import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * UAMEX ERP™ Master Business Intelligence Nexus Symbol
 * Orbital triple-ring core with neural data nodes and pulse gradients
 */
export function BINexusSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="bi-grad-emerald" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="bi-grad-gold" x1="22" y1="2" x2="2" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Outer Hexagonal Matrix Ring */}
      <path
        d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
        stroke="url(#bi-grad-emerald)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.8"
      />
      {/* Dynamic Inner Concentric Orbit */}
      <circle cx="12" cy="12" r="5.5" stroke="url(#bi-grad-gold)" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Central Neural Quantum Core */}
      <circle cx="12" cy="12" r="2.5" fill="#059669" />
      <circle cx="12" cy="12" r="1.2" fill="#fbbf24" />
      {/* Micro Neural Interconnects */}
      <line x1="12" y1="2" x2="12" y2="6.5" stroke="url(#bi-grad-emerald)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="17.5" x2="12" y2="22" stroke="url(#bi-grad-emerald)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.34" y1="12" x2="6.5" y2="12" stroke="url(#bi-grad-gold)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17.5" y1="12" x2="20.66" y2="12" stroke="url(#bi-grad-gold)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Orbital Satellite Nodes */}
      <circle cx="12" cy="2" r="1.2" fill="#34d399" />
      <circle cx="20.66" cy="7" r="1.2" fill="#fbbf24" />
      <circle cx="20.66" cy="17" r="1.2" fill="#34d399" />
      <circle cx="12" cy="22" r="1.2" fill="#fbbf24" />
      <circle cx="3.34" cy="17" r="1.2" fill="#34d399" />
      <circle cx="3.34" cy="7" r="1.2" fill="#fbbf24" />
    </svg>
  );
}

/**
 * وحدة الإغاثة والاستجابة الإنسانية العاجلة (Emergency Relief & Response Unit)
 * شعلة التدخل السريع المحمية بدرع الأمان الإغاثي
 */
export function UnitReliefSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="relief-grad" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      {/* Relief Shield Structure */}
      <path
        d="M12 2L4 5.5V11.5C4 16.5 7.5 21 12 22.5C16.5 21 20 16.5 20 11.5V5.5L12 2Z"
        stroke="url(#relief-grad)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Swift Humanitarian Response Torch */}
      <path
        d="M12 7C10.5 9 9.5 10.8 9.5 12.5C9.5 14.5 10.6 16 12 16C13.4 16 14.5 14.5 14.5 12.5C14.5 11 13.8 9.8 13 8.8L12 7Z"
        fill="#f87171"
        fillOpacity="0.25"
        stroke="#ef4444"
        strokeWidth="1.4"
      />
      <circle cx="12" cy="13" r="1.5" fill="#fbbf24" />
      <path d="M12 16V19" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * وحدة كفالة الأيتام والرعاية التكافلية (Orphan Sponsorship & Welfare Unit)
 * جناح الحماية والرعاية التكافلية الأسرية
 */
export function UnitOrphansSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="orphan-grad" x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
      </defs>
      {/* Symmetrical Guardian Wings */}
      <path
        d="M12 21C7.5 17.5 3 14 3 9.5C3 6.5 5.5 4 8.5 4C10.2 4 11.4 4.8 12 6C12.6 4.8 13.8 4 15.5 4C18.5 4 21 6.5 21 9.5C21 14 16.5 17.5 12 21Z"
        stroke="url(#orphan-grad)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Protected Child Halo */}
      <circle cx="12" cy="10" r="2.2" fill="#a855f7" />
      <path d="M9.5 15C9.5 13.5 10.6 12.5 12 12.5C13.4 12.5 14.5 13.5 14.5 15" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round" />
      {/* Solidarity Radiant Ray */}
      <line x1="12" y1="5.5" x2="12" y2="7" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * وحدة التنمية المستدامة والمشاريع والتمكين الاقتصادي (Sustainable Development & Livelihoods Unit)
 * سنبلة النماء الهندسية المتداخلة مع ترس التمكين الاقتصادي
 */
export function UnitDevelopmentSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="dev-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Industrial Sustainability Cogwheel Base */}
      <path
        d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2"
        stroke="url(#dev-grad)"
        strokeWidth="1.6"
        strokeDasharray="4 2"
        strokeLinecap="round"
      />
      {/* Vertical Growth Axis */}
      <path d="M12 22V6" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
      {/* Flourishing Seed Nodes */}
      <path d="M12 15C9.5 14 8 11.5 8 8.5C10.5 8.5 12 10.5 12 12.5" fill="#34d399" fillOpacity="0.3" stroke="#059669" strokeWidth="1.4" />
      <path d="M12 11C14.5 10 16 7.5 16 4.5C13.5 4.5 12 6.5 12 8.5" fill="#fbbf24" fillOpacity="0.3" stroke="#d97706" strokeWidth="1.4" />
      <circle cx="12" cy="5" r="1.5" fill="#10b981" />
    </svg>
  );
}

/**
 * وحدة الصحة والتغذية والإصحاح البيئي WASH (Health, Nutrition & WASH Unit)
 * درع العافية المتكامل مع نبض الحياة وقطرة النقاء المعيارية
 */
export function UnitHealthWashSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="wash-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      {/* Pure Water Droplet Contour */}
      <path
        d="M12 2.5C12 2.5 5 11 5 15.5C5 19.36 8.13 22.5 12 22.5C15.87 22.5 19 19.36 19 15.5C19 11 12 2.5 12 2.5Z"
        stroke="url(#wash-grad)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Medical Vital Pulse Wave */}
      <path
        d="M7.5 15.5H9.8L11 12.5L13 18.5L14.2 15.5H16.5"
        stroke="#0284c7"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8" r="1.2" fill="#38bdf8" />
    </svg>
  );
}

/**
 * وحدة التعليم وبناء القدرات (Education & Community Capacity Unit)
 * منارة المعرفة والأفق الرقمي المفتوح للتأهيل والتدريب
 */
export function UnitEducationSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="edu-grad" x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      {/* Knowledge Open Book Wings */}
      <path
        d="M12 6.5C10 5 6.5 4.8 3 5V18.5C6.5 18.3 10 18.7 12 20.5C14 18.7 17.5 18.3 21 18.5V5C17.5 4.8 14 5 12 6.5Z"
        stroke="url(#edu-grad)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 6.5V20.5" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" />
      {/* Wisdom Radiant Sunbeam */}
      <circle cx="12" cy="3" r="1.3" fill="#fbbf24" />
      <line x1="8.5" y1="2.5" x2="9.5" y2="3.5" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="15.5" y1="2.5" x2="14.5" y2="3.5" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * وحدة الأوقاف والاستثمار الخيري (Endowments & Charitable Investments Unit)
 * صرح الوقف المعماري المتصل بمصفوفة العائد التراكمي المستدام
 */
export function UnitEndowmentSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="endow-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      {/* Sustainable Endowment Architecture Vault */}
      <path
        d="M3 21H21M4 21V10L12 4L20 10V21M9 21V14H15V21"
        stroke="url(#endow-grad)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Enduring Shariah Crescent Node */}
      <circle cx="12" cy="9.5" r="2" stroke="#d97706" strokeWidth="1.4" />
      <circle cx="12" cy="9.5" r="0.9" fill="#10b981" />
    </svg>
  );
}

/**
 * النجم التساعي لمعايير الجودة والمساءلة الإنسانية CHS 9
 */
export function CHSStandardSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="chs-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      {/* Nine-point geometric accountability shield */}
      <circle cx="12" cy="12" r="9.5" stroke="url(#chs-grad)" strokeWidth="1.6" strokeDasharray="5 2.5" />
      <circle cx="12" cy="12" r="5" stroke="#10b981" strokeWidth="1.4" />
      <path d="M9 12L11 14L15 10" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="2.5" r="1.2" fill="#fbbf24" />
      <circle cx="21.5" cy="12" r="1.2" fill="#fbbf24" />
      <circle cx="12" cy="21.5" r="1.2" fill="#fbbf24" />
      <circle cx="2.5" cy="12" r="1.2" fill="#fbbf24" />
    </svg>
  );
}

/**
 * ميثاق إسفير الإنساني العالمي (Sphere Minimum Standards)
 */
export function SphereStandardSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="sphere-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
        stroke="url(#sphere-grad)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="4.5" stroke="#38bdf8" strokeWidth="1.4" />
      <path d="M12 2V22M3 12H21" stroke="#0284c7" strokeWidth="1.2" strokeOpacity="0.6" />
    </svg>
  );
}

/**
 * مؤشر العائد الاجتماعي على الاستثمار SROI (Social Return on Investment)
 */
export function SROISymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="sroi-grad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path
        d="M3 19L9 13L13 17L21 7M21 7H15M21 7V13"
        stroke="url(#sroi-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="13" r="1.5" fill="#fbbf24" />
      <circle cx="13" cy="17" r="1.5" fill="#f59e0b" />
      <circle cx="21" cy="7" r="2" fill="#10b981" />
    </svg>
  );
}

/**
 * معايير منظمة التعاون الاقتصادي والتنمية OECD-DAC (6 Criteria)
 */
export function OECDDACSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <polygon
        points="12,2 20.66,7 20.66,17 12,22 3.34,17 3.34,7"
        stroke="#a1a1aa"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <polygon
        points="12,6 17.2,9 17.2,15 12,18 6.8,15 6.8,9"
        fill="#059669"
        fillOpacity="0.15"
        stroke="#059669"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2" fill="#fbbf24" />
    </svg>
  );
}

/**
 * رمز بوابة الصلاحيات والتراخيص الأمنية المؤسسية (Security Clearance Gate)
 */
export function SecurityClearanceSymbol({ className = 'w-5 h-5', size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="sec-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="url(#sec-grad)" strokeWidth="1.8" />
      <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" stroke="url(#sec-grad)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.5" fill="#f59e0b" />
      <line x1="12" y1="16.5" x2="12" y2="18.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
