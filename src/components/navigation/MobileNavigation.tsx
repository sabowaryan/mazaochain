'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/components/TranslationProvider';
import { ROUTES, USER_ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function MobileNavigation() {
  const { profile, isAuthenticated } = useAuth();
  const t = useTranslations('navigation');
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated || !profile) {
    return null;
  }

  const getNavigationItems = () => {
    const baseItems = [
      {
        id: 'dashboard',
        label: t('dashboard'),
        href: getDashboardRoute(),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
          </svg>
        )
      },
      {
        id: 'profile',
        label: t('profile'),
        href: getProfileRoute(),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      }
    ];

    // Add role-specific navigation items
    if (profile.role === USER_ROLES.AGRICULTEUR) {
      baseItems.splice(1, 0, 
        {
          id: 'evaluations',
          label: t('evaluations'),
          href: '/dashboard/farmer/evaluations',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        {
          id: 'loans',
          label: t('loans'),
          href: '/dashboard/farmer/loans',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          )
        },
        {
          id: 'portfolio',
          label: t('portfolio'),
          href: '/dashboard/farmer/portfolio',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        }
      );
    } else if (profile.role === USER_ROLES.COOPERATIVE) {
      baseItems.splice(1, 0,
        {
          id: 'evaluations',
          label: t('evaluations'),
          href: '/dashboard/cooperative/evaluations',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        {
          id: 'loans',
          label: t('loans'),
          href: '/dashboard/cooperative/loans',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          )
        }
      );
    } else if (profile.role === USER_ROLES.PRETEUR) {
      baseItems.splice(1, 0,
        {
          id: 'opportunities',
          label: t('opportunities'),
          href: '/dashboard/lender/opportunities',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )
        },
        {
          id: 'portfolio',
          label: t('portfolio'),
          href: '/dashboard/lender/portfolio',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        }
      );
    }

    return baseItems;
  };

  const getDashboardRoute = () => {
    if (!profile) return '/';
    
    switch (profile.role) {
      case USER_ROLES.AGRICULTEUR:
        return '/dashboard/farmer';
      case USER_ROLES.COOPERATIVE:
        return '/dashboard/cooperative';
      case USER_ROLES.PRETEUR:
        return '/dashboard/lender';
      default:
        return '/';
    }
  };

  const getProfileRoute = () => {
    if (!profile) return '/';
    
    switch (profile.role) {
      case USER_ROLES.AGRICULTEUR:
        return '/dashboard/farmer/profile';
      case USER_ROLES.COOPERATIVE:
        return '/dashboard/cooperative/profile';
      case USER_ROLES.PRETEUR:
        return '/dashboard/lender'; // Lender doesn't have separate profile page
      default:
        return '/';
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="mobile-nav md:hidden">
      <div className="flex justify-around items-center py-2">
        {navigationItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'flex flex-col items-center justify-center p-2 rounded-lg transition-colors touch-target',
              activeTab === item.id
                ? 'text-primary-600 bg-primary-50'
                : 'text-neutral-600 hover:text-primary-600 hover:bg-primary-50'
            )}
          >
            <div className="mb-1">
              {item.icon}
            </div>
            <span className="text-xs font-medium">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}