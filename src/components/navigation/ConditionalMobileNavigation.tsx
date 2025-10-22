'use client';

import { usePathname } from 'next/navigation';
import { MobileNavigation } from './MobileNavigation';

export function ConditionalMobileNavigation() {
  const pathname = usePathname();

  // Hide mobile navigation on auth pages
  const isAuthPage = pathname?.includes('/auth/');
  
  if (isAuthPage) {
    return null;
  }

  return <MobileNavigation />;
}