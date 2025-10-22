'use client';

import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count?: number;
  show?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function NotificationBadge({ 
  count = 0, 
  show = false, 
  className,
  size = 'sm'
}: NotificationBadgeProps) {
  if (!show && count === 0) return null;

  const sizeClasses = {
    sm: 'w-3 h-3 text-xs',
    md: 'w-4 h-4 text-xs'
  };

  return (
    <div className={cn(
      'absolute -top-1 -right-1 bg-red-500 rounded-full flex items-center justify-center animate-pulse',
      sizeClasses[size],
      className
    )}>
      {count > 0 && (
        <span className="text-white font-bold leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}