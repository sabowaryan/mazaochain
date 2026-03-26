'use client';

import { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <div className="lg:hidden h-14 flex-shrink-0" />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
