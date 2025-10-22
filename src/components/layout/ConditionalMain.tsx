'use client';

import { usePathname } from 'next/navigation';

interface ConditionalMainProps {
  children: React.ReactNode;
}

export function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();

  // Remove bottom padding on auth pages since there's no mobile navigation
  const isAuthPage = pathname?.includes('/auth/');
  
  return (
    <main className={isAuthPage ? "min-h-screen" : "min-h-screen pb-16 md:pb-0"}>
      {children}
    </main>
  );
}