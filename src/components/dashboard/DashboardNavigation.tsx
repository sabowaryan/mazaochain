"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/lib/constants';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  roles?: string[];
}

const navigationItems: NavItem[] = [
  {
    name: 'Tableau de bord',
    href: '/dashboard',
    icon: '🏠',
  },
  {
    name: 'Profil',
    href: '/dashboard/profile',
    icon: '👤',
  },
  {
    name: 'Évaluations',
    href: '/dashboard/evaluations',
    icon: '📋',
    roles: [USER_ROLES.AGRICULTEUR, USER_ROLES.COOPERATIVE]
  },
  {
    name: 'Prêts',
    href: '/dashboard/loans',
    icon: '💰',
    roles: [USER_ROLES.AGRICULTEUR, USER_ROLES.COOPERATIVE]
  },
  {
    name: 'Portfolio',
    href: '/dashboard/portfolio',
    icon: '📊',
  },
  {
    name: 'Notifications',
    href: '/dashboard/notifications',
    icon: '🔔',
  },
];

export function DashboardNavigation() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const getNavItems = () => {
    if (!profile) return [];

    const baseItems = navigationItems.filter(item => 
      !item.roles || item.roles.includes(profile.role)
    );

    // Adjust paths based on user role
    return baseItems.map(item => {
      if (item.href === '/dashboard' && profile.role) {
        switch (profile.role) {
          case USER_ROLES.AGRICULTEUR:
            return { ...item, href: '/dashboard/farmer' };
          case USER_ROLES.COOPERATIVE:
            return { ...item, href: '/dashboard/cooperative' };
          case USER_ROLES.PRETEUR:
            return { ...item, href: '/dashboard/lender' };
          default:
            return item;
        }
      }

      if (item.href.startsWith('/dashboard/') && item.href !== '/dashboard/notifications') {
        const path = item.href.replace('/dashboard/', '');
        switch (profile.role) {
          case USER_ROLES.AGRICULTEUR:
            return { ...item, href: `/dashboard/farmer/${path}` };
          case USER_ROLES.COOPERATIVE:
            return { ...item, href: `/dashboard/cooperative/${path}` };
          case USER_ROLES.PRETEUR:
            return { ...item, href: `/dashboard/lender/${path}` };
          default:
            return item;
        }
      }

      return item;
    });
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard/notifications' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          {/* Notification Preferences Link */}
          <Link
            href="/dashboard/notifications/preferences"
            className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium whitespace-nowrap ${
              pathname === '/dashboard/notifications/preferences'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span>Préférences</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}