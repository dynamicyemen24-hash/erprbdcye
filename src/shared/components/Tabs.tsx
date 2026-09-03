// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Tabs Component
// Premium Design System Component v2.0
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Advanced tabs with:
// - Multiple variants (underline, pill, bordered)
// - Lazy loading
// - Icon support
// - Bilingual support
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from 'react';
import { type LucideIcon } from 'lucide-react';

export type TabsVariant = 'underline' | 'pill' | 'bordered' | 'soft';
export type TabsSize = 'sm' | 'md' | 'lg';

export interface TabItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon?: LucideIcon;
  badge?: number;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface TabsProps {
  /** Tab items */
  items: TabItem[];
  /** Default active tab */
  defaultTab?: string;
  /** Controlled active tab */
  activeTab?: string;
  /** Tab change handler */
  onChange?: (tabId: string) => void;
  /** Tabs variant */
  variant?: TabsVariant;
  /** Size */
  size?: TabsSize;
  /** Language */
  lang: 'ar' | 'en';
  /** Show icons only (icon tabs) */
  iconsOnly?: boolean;
  /** Full width tabs */
  fullWidth?: boolean;
  /** Lazy load tab content */
  lazyLoad?: boolean;
  /** ARIA label */
  ariaLabel?: string;
}

const VARIANT_STYLES: Record<TabsVariant, {
  container: string;
  tab: (active: boolean) => string;
  indicator: string;
}> = {
  underline: {
    container: 'border-b border-slate-200 dark:border-zinc-700',
    tab: (active) => `
      relative px-4 py-2.5 text-sm font-bold transition-colors
      ${active
        ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 -mb-px'
        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
      }
    `,
    indicator: 'absolute bottom-0 h-0.5 bg-emerald-500 rounded-full transition-all duration-300',
  },
  pill: {
    container: 'bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl',
    tab: (active) => `
      px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200
      ${active
        ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
      }
    `,
    indicator: '',
  },
  bordered: {
    container: 'border-b border-slate-200 dark:border-zinc-700',
    tab: (active) => `
      px-4 py-2.5 text-sm font-bold transition-colors -mb-px
      ${active
        ? 'text-emerald-600 dark:text-emerald-400 border border-b-0 border-slate-200 dark:border-zinc-700 rounded-t-lg bg-white dark:bg-zinc-900'
        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
      }
    `,
    indicator: '',
  },
  soft: {
    container: '',
    tab: (active) => `
      px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200
      ${active
        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
        : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
      }
    `,
    indicator: '',
  },
};

const SIZE_STYLES: Record<TabsSize, string> = {
  sm: 'text-xs py-1.5 px-3',
  md: 'text-sm py-2 px-4',
  lg: 'text-base py-2.5 px-5',
};

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'underline',
  size = 'md',
  lang,
  iconsOnly = false,
  fullWidth = false,
  lazyLoad = false,
  ariaLabel,
}) => {
  const isRtl = lang === 'ar';
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab ?? items[0]?.id);
  
  const activeTab = controlledActiveTab ?? internalActiveTab;
  
  const styles = VARIANT_STYLES[variant];
  const sizeClass = SIZE_STYLES[size];

  const handleTabChange = useCallback((tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onChange?.(tabId);
  }, [controlledActiveTab, onChange]);

  const activeIndex = useMemo(() => 
    items.findIndex(item => item.id === activeTab),
    [items, activeTab]
  );

  const renderTab = (item: TabItem, index: number) => {
    const isActive = item.id === activeTab;
    const Icon = item.icon;
    const label = isRtl ? item.labelAr : item.labelEn;

    const tabClasses = `
      ${styles.tab(isActive)}
      ${sizeClass}
      ${fullWidth ? 'flex-1' : ''}
      ${item.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
      ${variant === 'underline' && isActive ? '' : ''}
      flex items-center justify-center gap-2
    `;

    return (
      <button
        key={item.id}
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${item.id}`}
        id={`tab-${item.id}`}
        disabled={item.disabled}
        onClick={() => !item.disabled && handleTabChange(item.id)}
        className={tabClasses}
      >
        {Icon && (
          <Icon className={iconsOnly ? 'w-5 h-5' : 'w-4 h-4'} />
        )}
        {!iconsOnly && <span>{label}</span>}
        {item.badge !== undefined && item.badge > 0 && (
          <span className={`
            inline-flex items-center justify-center min-w-[1.125rem] h-5 px-1.5
            text-[10px] font-black rounded-full
            ${isActive
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
            }
          `}>
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </button>
    );
  };

  const activeContent = useMemo(() => {
    const activeItem = items.find(item => item.id === activeTab);
    return activeItem?.content;
  }, [items, activeTab]);

  const shouldRenderContent = useCallback((item: TabItem) => {
    if (!lazyLoad) return true;
    return item.id === activeTab;
  }, [lazyLoad, activeTab]);

  return (
    <div className="w-full">
      {/* Tab List */}
      <div
        className={styles.container}
        role="tablist"
        aria-label={ariaLabel}
      >
        <div className={`flex ${fullWidth ? '' : 'gap-1'} ${isRtl ? 'flex-row-reverse' : ''}`}>
          {items.map((item, index) => renderTab(item, index))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {items.map(item => (
          <div
            key={item.id}
            role="tabpanel"
            id={`tabpanel-${item.id}`}
            aria-labelledby={`tab-${item.id}`}
            hidden={item.id !== activeTab}
            tabIndex={0}
            className={item.id === activeTab ? 'outline-none' : 'hidden'}
          >
            {shouldRenderContent(item) && (
              lazyLoad && item.id !== activeTab ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-1/2" />
                </div>
              ) : (
                item.content ?? activeContent
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;