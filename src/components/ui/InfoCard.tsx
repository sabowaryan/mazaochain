import React from 'react';
import { Label } from './Label';

interface InfoCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
}

export function InfoCard({ label, value, icon, className = '' }: InfoCardProps) {
  return (
    <div className={`farmer-info-card group p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        {icon && <div className="w-4 h-4 text-gray-500">{icon}</div>}
        <Label className="text-sm font-medium text-gray-700">
          {label}
        </Label>
      </div>
      <p className="text-lg font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}