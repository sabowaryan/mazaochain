'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colorClasses = {
  primary: 'text-primary-600',
  secondary: 'text-secondary-500',
  muted: 'text-muted-foreground',
};

export function LoadingSpinner({ 
  size = 'md', 
  className,
  color = 'primary' 
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Chargement..."
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
}

export function LoadingDots({ 
  size = 'md',
  className,
  color = 'primary' 
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            colorClasses[color],
            'bg-current'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
}

export function LoadingBar({ 
  className,
  color = 'primary' 
}: Omit<LoadingSpinnerProps, 'size'>) {
  return (
    <div className={cn('w-full bg-muted rounded-full h-2', className)}>
      <div
        className={cn(
          'h-2 rounded-full animate-pulse',
          colorClasses[color],
          'bg-current'
        )}
        style={{
          width: '30%',
          animation: 'loading-bar 2s ease-in-out infinite',
        }}
      />
      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 50%; margin-left: 25%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}