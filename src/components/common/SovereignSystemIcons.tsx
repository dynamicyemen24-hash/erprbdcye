import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * 1. Strategic Compass & Objectives Symbol (بوصلة التخطيط الاستراتيجي)
 */
export const StrategicCompassSymbol: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    width={size} 
    height={size}
  >
    <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" className="opacity-40" />
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <polygon points="12,6.5 14.5,12 12,11 9.5,12" fill="#059669" />
    <polygon points="12,17.5 14.5,12 12,13 9.5,12" fill="#d97706" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

/**
 * 2. Field Project Execution Lifecycle Symbol (دورة حياة المشاريع الميدانية)
 */
export const ProjectLifecycleSymbol: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    width={size} 
    height={size}
  >
    <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 8H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 12H13" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 16H11" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16.5" cy="14.5" r="2.5" fill="#059669" fillOpacity="0.2" stroke="#059669" strokeWidth="1.5" />
    <path d="M15.5 14.5L16.2 15.2L17.8 13.8" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 3. WBS Work Breakdown & Field Task Tree Symbol (هيكل الأنشطة والمهام)
 */
export const WBSActivityTreeSymbol: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    width={size} 
    height={size}
  >
    <rect x="2.5" y="3" width="7" height="5" rx="1.5" fill="#059669" fillOpacity="0.2" stroke="#059669" strokeWidth="1.5" />
    <path d="M6 8V14M6 14H10M6 19H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="10.5" y="11.5" width="10.5" height="4.5" rx="1.5" fill="#d97706" fillOpacity="0.15" stroke="#d97706" strokeWidth="1.5" />
    <rect x="10.5" y="17" width="10.5" height="4.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="18" cy="13.75" r="1" fill="#d97706" />
    <circle cx="18" cy="19.25" r="1" fill="#059669" />
  </svg>
);

/**
 * 4. Institutional Hierarchy & Governance Symbol (الهيكل المؤسسي والحوكمة)
 */
export const OrgHierarchySymbol: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    width={size} 
    height={size}
  >
    <rect x="8.5" y="2.5" width="7" height="5" rx="1.5" fill="#059669" fillOpacity="0.2" stroke="#059669" strokeWidth="1.5" />
    <path d="M12 7.5V11M5.5 11H18.5M5.5 11V14.5M18.5 11V14.5M12 11V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="2" y="14.5" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="8.5" y="14.5" width="7" height="5" rx="1.5" fill="#d97706" fillOpacity="0.15" stroke="#d97706" strokeWidth="1.5" />
    <rect x="15" y="14.5" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="5" r="1" fill="#059669" />
  </svg>
);

/**
 * 5. Multi-Level Signature Workflow Symbol (مسار الاعتماد متعدد المستويات)
 */
export const MultiSignWorkflowSymbol: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    width={size} 
    height={size}
  >
    <path d="M4 19.5H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4 5L10 11L14 7L20 13" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="4" cy="5" r="2" fill="#059669" />
    <circle cx="10" cy="11" r="2" fill="#059669" />
    <circle cx="14" cy="7" r="2" fill="#d97706" />
    <circle cx="20" cy="13" r="2.5" fill="#d97706" stroke="#d97706" strokeWidth="1" />
    <path d="M19 13L19.7 13.7L21.3 12.3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/**
 * 6. Clearance & Financial Delegation Symbol (التفويض والصلاحيات المالية)
 */
export const ClearanceDelegationSymbol: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    width={size} 
    height={size}
  >
    <path d="M12 2.5L19 6V11.5C19 16.2 16 20.2 12 21.5C8 20.2 5 16.2 5 11.5V6L12 2.5Z" stroke="#059669" strokeWidth="1.75" fill="#059669" fillOpacity="0.1" />
    <circle cx="12" cy="10" r="2.5" stroke="#d97706" strokeWidth="1.5" fill="#d97706" fillOpacity="0.2" />
    <path d="M9 16C9 14.5 10.3 13.5 12 13.5C13.7 13.5 15 14.5 15 16" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M11 10H13" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
