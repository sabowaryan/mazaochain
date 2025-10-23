import React from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface ModernPageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  subtitleIcon?: React.ReactNode;
  gradient: 'emerald' | 'blue' | 'amber' | 'purple' | 'red' | 'indigo';
  actions?: React.ReactNode;
  showDate?: boolean;
  className?: string;
}

const gradientClasses = {
  emerald: 'from-emerald-500 to-teal-600',
  blue: 'from-blue-500 to-indigo-600',
  amber: 'from-amber-500 to-orange-600',
  purple: 'from-purple-500 to-purple-600',
  red: 'from-red-500 to-red-600',
  indigo: 'from-indigo-500 to-indigo-600',
};

export function ModernPageHeader({
  title,
  subtitle,
  icon,
  subtitleIcon,
  gradient,
  actions,
  showDate = true,
  className = '',
}: ModernPageHeaderProps) {
  const gradientClass = gradientClasses[gradient];

  return (
    <div className={`mb-8 lg:mb-12 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br ${gradientClass} rounded-2xl flex items-center justify-center shadow-lg`}>
            <div className="w-6 h-6 lg:w-8 lg:h-8 text-white">
              {icon}
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
              {title}
            </h1>
            <div className="flex items-center space-x-2 text-gray-600">
              {subtitleIcon && <div className="w-4 h-4">{subtitleIcon}</div>}
              <p className="text-sm sm:text-base">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {actions}
          {showDate && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}