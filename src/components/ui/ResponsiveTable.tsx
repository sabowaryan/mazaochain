import React from 'react';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveTable - Wrapper component for tables that need horizontal scrolling on mobile
 * 
 * Usage:
 * <ResponsiveTable>
 *   <table>...</table>
 * </ResponsiveTable>
 */
export function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * ResponsiveGrid - Wrapper for grid layouts that need to adapt to mobile
 * 
 * Usage:
 * <ResponsiveGrid>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </ResponsiveGrid>
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className = ''
}: ResponsiveGridProps) {
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

/**
 * ResponsiveCard - Card component with responsive padding
 */
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveCard({ children, className = '' }: ResponsiveCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * ResponsiveTabs - Horizontal scrollable tabs for mobile
 */
interface ResponsiveTabsProps {
  tabs: Array<{
    key: string;
    label: string;
    icon?: string;
  }>;
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function ResponsiveTabs({ tabs, activeTab, onTabChange, className = '' }: ResponsiveTabsProps) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.icon || tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/**
 * ResponsiveModal - Modal with proper mobile handling
 */
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ResponsiveModal({ isOpen, onClose, title, children, footer }: ResponsiveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-start">
          <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4 sm:p-6">
          {children}
        </div>
        {footer && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
