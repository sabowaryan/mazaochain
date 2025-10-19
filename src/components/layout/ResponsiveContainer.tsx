'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  centerContent?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'lg',
  padding = 'md',
  centerContent = false
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-4xl',
    xl: 'max-w-screen-6xl',
    '2xl': 'max-w-screen-7xl',
    full: 'max-w-screen-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-4 py-4 md:px-6 md:py-6',
    lg: 'px-6 py-6 md:px-8 md:py-8'
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        centerContent && 'flex flex-col items-center justify-center min-h-screen',
        className
      )}
    >
      {children}
    </div>
  );
}