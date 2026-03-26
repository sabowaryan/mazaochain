'use client';

import { usePathname } from 'next/navigation';
import { MobileNavigation } from './MobileNavigation';

export function ConditionalMobileNavigation() {
  const pathname = usePathname();

  const isAuthPage = pathname?.includes('/auth/');
  const isDashboardPage = pathname?.includes('/dashboard');

  if (isAuthPage || isDashboardPage) {
    return null;
  }

  return <MobileNavigation />;
}
