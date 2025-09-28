"use client";

import { ReactNode } from 'react';
import { DashboardNavigation } from './DashboardNavigation';

interface DashboardLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export function DashboardLayout({ children, showNavigation = true }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {showNavigation && <DashboardNavigation />}
      <div className="py-8">
        {children}
      </div>
    </div>
  );
}