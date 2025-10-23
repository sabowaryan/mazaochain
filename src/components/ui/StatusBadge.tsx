import React from 'react';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  label: string;
  className?: string;
}

const statusClasses = {
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const statusClass = statusClasses[status];

  return (
    <span className={`farmer-status-badge inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusClass} ${className}`}>
      {label}
    </span>
  );
}