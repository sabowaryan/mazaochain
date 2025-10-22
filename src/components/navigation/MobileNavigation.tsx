'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/components/TranslationProvider';
import { ROUTES, USER_ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { AnimatedIcon } from '@/components/ui/AnimatedIcon';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { useHapticFeedback } from '@/components/ui/HapticFeedback';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserIcon,
  UserGroupIcon,
  EyeIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserIcon as UserIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  EyeIcon as EyeIconSolid,
  BriefcaseIcon as BriefcaseIconSolid
} from '@heroicons/react/24/solid';

export function MobileNavigation() {
  const { profile, isAuthenticated } = useAuth();
  const t = useTranslations('navigation');
  const [activeTab, setActiveTab] = useState('dashboard');
  const { triggerHaptic } = useHapticFeedback();

  if (!isAuthenticated || !profile) {
    return null;
  }

  const getNavigationItems = () => {
    const baseItems = [
      {
        id: 'dashboard',
        label: t('dashboard'),
        href: getDashboardRoute(),
        icon: HomeIcon,
        iconSolid: HomeIconSolid
      },
      {
        id: 'profile',
        label: t('profile'),
        href: getProfileRoute(),
        icon: UserIcon,
        iconSolid: UserIconSolid
      }
    ];

    // Add role-specific navigation items
    if (profile.role === USER_ROLES.AGRICULTEUR) {
      baseItems.splice(1, 0,
        {
          id: 'evaluations',
          label: t('evaluations'),
          href: '/dashboard/farmer/evaluations',
          icon: ClipboardDocumentListIcon,
          iconSolid: ClipboardDocumentListIconSolid
        },
        {
          id: 'loans',
          label: t('loans'),
          href: '/dashboard/farmer/loans',
          icon: BanknotesIcon,
          iconSolid: BanknotesIconSolid
        },
        {
          id: 'portfolio',
          label: t('portfolio'),
          href: '/dashboard/farmer/portfolio',
          icon: ChartBarIcon,
          iconSolid: ChartBarIconSolid
        }
      );
    } else if (profile.role === USER_ROLES.COOPERATIVE) {
      baseItems.splice(1, 0,
        {
          id: 'evaluations',
          label: t('evaluations'),
          href: '/dashboard/cooperative/evaluations',
          icon: ClipboardDocumentListIcon,
          iconSolid: ClipboardDocumentListIconSolid
        },
        {
          id: 'loans',
          label: t('loans'),
          href: '/dashboard/cooperative/loans',
          icon: BanknotesIcon,
          iconSolid: BanknotesIconSolid
        },
        {
          id: 'members',
          label: t('members') || 'Membres',
          href: '/dashboard/cooperative/farmers',
          icon: UserGroupIcon,
          iconSolid: UserGroupIconSolid
        }
      );
    } else if (profile.role === USER_ROLES.PRETEUR) {
      baseItems.splice(1, 0,
        {
          id: 'opportunities',
          label: t('opportunities'),
          href: '/dashboard/lender/opportunities',
          icon: EyeIcon,
          iconSolid: EyeIconSolid
        },
        {
          id: 'portfolio',
          label: t('portfolio'),
          href: '/dashboard/lender/portfolio',
          icon: BriefcaseIcon,
          iconSolid: BriefcaseIconSolid
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
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200/50 md:hidden z-50 shadow-2xl">
      <div className="grid grid-cols-5 h-20 px-2">
        {navigationItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = isActive ? item.iconSolid : item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                setActiveTab(item.id);
                triggerHaptic('light');
              }}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-all duration-200 rounded-xl mx-1 my-2 relative',
                isActive
                  ? 'text-emerald-600 bg-emerald-50 shadow-sm'
                  : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50'
              )}
            >
              {/* Indicateur actif */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"></div>
              )}

              {/* Icône avec animation */}
              <AnimatedIcon
                icon={item.icon}
                iconSolid={item.iconSolid}
                isActive={isActive}
                size="lg"
                className="p-1 rounded-lg"
              />

              {/* Label */}
              <span className={cn(
                'text-xs font-medium transition-all duration-200',
                isActive ? 'text-emerald-700' : 'text-gray-500'
              )}>
                {item.label}
              </span>

              {/* Badge de notification pour certains éléments */}
              <NotificationBadge
                count={item.id === 'evaluations' ? 3 : item.id === 'loans' ? 2 : 0}
                show={item.id === 'evaluations' || item.id === 'loans'}
              />
            </Link>
          );
        })}
      </div>

      {/* Barre d'accueil pour les gestes */}
      <div className="flex justify-center pb-2">
        <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
}