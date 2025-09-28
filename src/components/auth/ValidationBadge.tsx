'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/components/TranslationProvider';
import { cn } from '@/lib/utils';

interface ValidationBadgeProps {
  className?: string;
  showText?: boolean;
}

export function ValidationBadge({ className, showText = true }: ValidationBadgeProps) {
  const { isAuthenticated, isValidated, profile } = useAuth();
  const t = useTranslations('auth');

  if (!isAuthenticated || !profile) {
    return null;
  }

  const getBadgeStyles = () => {
    if (isValidated) {
      return 'bg-primary-100 text-primary-700 border-primary-200';
    }
    return 'bg-secondary-100 text-secondary-700 border-secondary-200';
  };

  const getIcon = () => {
    if (isValidated) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getText = () => {
    if (isValidated) {
      return t('authenticated');
    }
    return t('pendingValidation');
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
      getBadgeStyles(),
      className
    )}>
      {getIcon()}
      {showText && <span>{getText()}</span>}
    </div>
  );
}

export function RoleBadge({ className }: { className?: string }) {
  const { profile } = useAuth();

  if (!profile) {
    return null;
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700',
      className
    )}>
      {profile.role}
    </span>
  );
}