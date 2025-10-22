'use client';

import { cn } from '@/lib/utils';
import { ComponentType } from 'react';

interface AnimatedIconProps {
  icon: ComponentType<{ className?: string }>;
  iconSolid: ComponentType<{ className?: string }>;
  isActive: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

export function AnimatedIcon({ 
  icon: Icon, 
  iconSolid: IconSolid, 
  isActive, 
  className,
  size = 'md'
}: AnimatedIconProps) {
  const IconComponent = isActive ? IconSolid : Icon;
  
  return (
    <div className={cn(
      'relative transition-all duration-200',
      isActive ? 'scale-110' : 'scale-100',
      className
    )}>
      <IconComponent 
        className={cn(
          sizeClasses[size],
          'transition-colors duration-200',
          isActive ? 'text-emerald-600' : 'text-gray-500'
        )} 
      />
      
      {/* Glow effect when active */}
      {isActive && (
        <div className="absolute inset-0 -z-10">
          <IconComponent 
            className={cn(
              sizeClasses[size],
              'text-emerald-400 opacity-20 blur-sm'
            )} 
          />
        </div>
      )}
    </div>
  );
}