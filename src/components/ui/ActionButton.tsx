import React from 'react';
import { Button } from './Button';

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'emerald' | 'blue' | 'amber' | 'purple' | 'red' | 'indigo';
  className?: string;
  disabled?: boolean;
}

const variantClasses = {
  emerald: 'hover:bg-emerald-50 hover:border-emerald-200',
  blue: 'hover:bg-blue-50 hover:border-blue-200',
  amber: 'hover:bg-amber-50 hover:border-amber-200',
  purple: 'hover:bg-purple-50 hover:border-purple-200',
  red: 'hover:bg-red-50 hover:border-red-200',
  indigo: 'hover:bg-indigo-50 hover:border-indigo-200',
};

export function ActionButton({
  label,
  icon,
  onClick,
  variant = 'emerald',
  className = '',
  disabled = false,
}: ActionButtonProps) {
  const variantClass = variantClasses[variant];

  return (
    <Button
      variant="outline"
      className={`farmer-action-button w-full justify-start group ${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      {label}
    </Button>
  );
}