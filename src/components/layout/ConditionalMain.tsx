'use client';

import { usePathname } from 'next/navigation';

interface ConditionalMainProps {
  children: React.ReactNode;
}

export function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();

  const isAuthPage = pathname?.includes('/auth/');
  const isDashboardPage = pathname?.includes('/dashboard');

  if (isDashboardPage) {
    return <>{children}</>;
  }

  return (
    <main className={isAuthPage ? 'min-h-screen' : 'min-h-screen pb-16 md:pb-0'}>
      {children}
    </main>
  );
}
