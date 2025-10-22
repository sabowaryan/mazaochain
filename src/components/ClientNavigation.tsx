'use client';

import { Navigation } from './Navigation';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function ClientNavigation() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide navigation on auth pages
  const isAuthPage = pathname?.includes('/auth/');
  
  if (isAuthPage) {
    return null;
  }

  if (!mounted) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">
                <span className="text-primary-600">Mazao</span>
                <span className="text-secondary-500">Chain</span>
              </h1>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return <Navigation />;
}