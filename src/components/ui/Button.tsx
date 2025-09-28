'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  asChild?: boolean;
}

const buttonVariants = {
  variant: {
    default: 'bg-primary-600 text-primary-foreground hover:bg-primary-700',
    destructive: 'bg-error-600 text-error-foreground hover:bg-error-700',
    outline: 'border border-border bg-background hover:bg-muted hover:text-muted-foreground',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200',
    ghost: 'hover:bg-muted hover:text-muted-foreground',
    link: 'text-primary-600 underline-offset-4 hover:underline',
  },
  size: {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, asChild = false, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          loading && 'opacity-50 cursor-not-allowed',
          className
        )}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading && (
          <LoadingSpinner size="sm" className="mr-2" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';