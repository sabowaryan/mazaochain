'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/components/TranslationProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

interface AuthStatusProps {
  className?: string;
  showDetails?: boolean;
  variant?: 'badge' | 'card' | 'inline';
}

export function AuthStatus({ 
  className, 
  showDetails = false,
  variant = 'badge' 
}: AuthStatusProps) {
  const { 
    user, 
    profile, 
    loading, 
    initialized,
    isAuthenticated, 
    isValidated 
  } = useAuth();
  const t = useTranslations('auth');

  // Si le chargement prend plus de 5 secondes, afficher quand même le statut
  const [forceShow, setForceShow] = React.useState(false);
  
  React.useEffect(() => {
    if (!initialized || loading) {
      const timer = setTimeout(() => setForceShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [initialized, loading]);

  if ((!initialized || loading) && !forceShow) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <LoadingSpinner size="sm" />
        <span className="text-sm text-muted-foreground">
          {t('loading')}
        </span>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!isAuthenticated) return 'bg-neutral-100 text-neutral-700';
    if (!isValidated) return 'bg-secondary-100 text-secondary-700';
    return 'bg-primary-100 text-primary-700';
  };

  const getStatusText = () => {
    if (!isAuthenticated) return t('notAuthenticated');
    if (!isValidated) return t('pendingValidation');
    return t('authenticated');
  };

  const getStatusIcon = () => {
    if (!isAuthenticated) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }
    
    if (!isValidated) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  if (variant === 'badge') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
        getStatusColor(),
        className
      )}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        'p-4 rounded-lg border bg-card',
        className
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-full',
            getStatusColor()
          )}>
            {getStatusIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-card-foreground">
              {getStatusText()}
            </h3>
            {showDetails && isAuthenticated && (
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>Email: {user?.email}</p>
                {profile && (
                  <>
                    <p>Rôle: {profile.role}</p>
                    <p>Statut: {isValidated ? 'Validé' : 'En attente'}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // variant === 'inline'
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <div className={cn(
        'p-1 rounded-full',
        getStatusColor()
      )}>
        {getStatusIcon()}
      </div>
      <span className="text-foreground">{getStatusText()}</span>
      {showDetails && isAuthenticated && profile && (
        <span className="text-muted-foreground">
          ({profile.role})
        </span>
      )}
    </div>
  );
}

// Composant pour afficher les détails de l'utilisateur
export function UserDetails({ className }: { className?: string }) {
  const { user, profile, isAuthenticated } = useAuth();
  const t = useTranslations('auth');

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Email:</span>
        <span className="font-medium">{user.email}</span>
      </div>
      
      {profile && (
        <>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rôle:</span>
            <span className="font-medium capitalize">{profile.role}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Statut:</span>
            <span className={cn(
              'font-medium',
              profile.is_validated ? 'text-primary-600' : 'text-secondary-600'
            )}>
              {profile.is_validated ? 'Validé' : 'En attente'}
            </span>
          </div>
          
          {profile.created_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Membre depuis:</span>
              <span className="font-medium">
                {new Date(profile.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}