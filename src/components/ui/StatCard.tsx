import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentIcon?: React.ReactNode;
  gradient: 'emerald' | 'blue' | 'amber' | 'purple' | 'red' | 'indigo';
  className?: string;
  onClick?: () => void;
}

const gradientClasses = {
  emerald: 'from-emerald-50 to-emerald-100 border-emerald-200',
  blue: 'from-blue-50 to-blue-100 border-blue-200',
  amber: 'from-amber-50 to-amber-100 border-amber-200',
  purple: 'from-purple-50 to-purple-100 border-purple-200',
  red: 'from-red-50 to-red-100 border-red-200',
  indigo: 'from-indigo-50 to-indigo-100 border-indigo-200',
};

const iconBgClasses = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  indigo: 'bg-indigo-500',
};

const textClasses = {
  emerald: {
    title: 'text-emerald-700',
    value: 'text-emerald-900',
    subtitle: 'text-emerald-600',
    accent: 'text-emerald-600',
  },
  blue: {
    title: 'text-blue-700',
    value: 'text-blue-900',
    subtitle: 'text-blue-600',
    accent: 'text-blue-600',
  },
  amber: {
    title: 'text-amber-700',
    value: 'text-amber-900',
    subtitle: 'text-amber-600',
    accent: 'text-amber-600',
  },
  purple: {
    title: 'text-purple-700',
    value: 'text-purple-900',
    subtitle: 'text-purple-600',
    accent: 'text-purple-600',
  },
  red: {
    title: 'text-red-700',
    value: 'text-red-900',
    subtitle: 'text-red-600',
    accent: 'text-red-600',
  },
  indigo: {
    title: 'text-indigo-700',
    value: 'text-indigo-900',
    subtitle: 'text-indigo-600',
    accent: 'text-indigo-600',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  accentIcon,
  gradient,
  className = '',
  onClick,
}: StatCardProps) {
  const gradientClass = gradientClasses[gradient];
  const iconBgClass = iconBgClasses[gradient];
  const textClass = textClasses[gradient];

  return (
    <Card 
      className={`group farmer-stat-card relative overflow-hidden bg-gradient-to-br ${gradientClass} hover:shadow-xl hover:scale-105 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-${gradient}-500/5 to-${gradient}-600/10`}></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 ${iconBgClass} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 farmer-icon`}>
            {icon}
          </div>
          {accentIcon && (
            <div className={`${textClass.accent} opacity-60`}>
              {accentIcon}
            </div>
          )}
        </div>
        <div>
          <p className={`text-sm font-medium ${textClass.title} mb-1`}>
            {title}
          </p>
          <p className={`text-2xl lg:text-3xl font-bold ${textClass.value}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-xs ${textClass.subtitle} mt-1`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}