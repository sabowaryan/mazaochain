'use client';

import { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <DashboardHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
