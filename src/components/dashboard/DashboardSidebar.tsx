'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserIcon,
  UserGroupIcon,
  BriefcaseIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserIcon as UserIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  BellIcon as BellIconSolid,
  TagIcon as TagIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconSolid: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  agriculteur: { label: 'Agriculteur', color: 'bg-emerald-100 text-emerald-700' },
  cooperative: { label: 'Coopérative', color: 'bg-blue-100 text-blue-700' },
  preteur: { label: 'Prêteur', color: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
};

function getNavItems(role: string, lang: string): NavItem[] {
  switch (role) {
    case 'agriculteur':
      return [
        { id: 'dashboard', label: 'Tableau de bord', href: `/${lang}/dashboard/farmer`, icon: HomeIcon, iconSolid: HomeIconSolid },
        { id: 'evaluations', label: 'Évaluations', href: `/${lang}/dashboard/farmer/evaluations`, icon: ClipboardDocumentListIcon, iconSolid: ClipboardDocumentListIconSolid },
        { id: 'loans', label: 'Prêts', href: `/${lang}/dashboard/farmer/loans`, icon: BanknotesIcon, iconSolid: BanknotesIconSolid },
        { id: 'portfolio', label: 'Portfolio', href: `/${lang}/dashboard/farmer/portfolio`, icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
        { id: 'profile', label: 'Profil', href: `/${lang}/dashboard/farmer/profile`, icon: UserIcon, iconSolid: UserIconSolid },
        { id: 'notifications', label: 'Notifications', href: `/${lang}/dashboard/notifications`, icon: BellIcon, iconSolid: BellIconSolid },
      ];
    case 'cooperative':
      return [
        { id: 'dashboard', label: 'Tableau de bord', href: `/${lang}/dashboard/cooperative`, icon: HomeIcon, iconSolid: HomeIconSolid },
        { id: 'evaluations', label: 'Évaluations', href: `/${lang}/dashboard/cooperative/evaluations`, icon: ClipboardDocumentListIcon, iconSolid: ClipboardDocumentListIconSolid },
        { id: 'loans', label: 'Prêts', href: `/${lang}/dashboard/cooperative/loans`, icon: BanknotesIcon, iconSolid: BanknotesIconSolid },
        { id: 'members', label: 'Membres', href: `/${lang}/dashboard/cooperative/farmers`, icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
        { id: 'profile', label: 'Profil', href: `/${lang}/dashboard/cooperative/profile`, icon: UserIcon, iconSolid: UserIconSolid },
        { id: 'notifications', label: 'Notifications', href: `/${lang}/dashboard/notifications`, icon: BellIcon, iconSolid: BellIconSolid },
      ];
    case 'preteur':
      return [
        { id: 'dashboard', label: 'Tableau de bord', href: `/${lang}/dashboard/lender`, icon: HomeIcon, iconSolid: HomeIconSolid },
        { id: 'opportunities', label: 'Opportunités', href: `/${lang}/dashboard/lender/opportunities`, icon: TagIcon, iconSolid: TagIconSolid },
        { id: 'portfolio', label: 'Portfolio', href: `/${lang}/dashboard/lender/portfolio`, icon: BriefcaseIcon, iconSolid: BriefcaseIconSolid },
        { id: 'profile', label: 'Profil', href: `/${lang}/dashboard/lender/profile`, icon: UserIcon, iconSolid: UserIconSolid },
        { id: 'notifications', label: 'Notifications', href: `/${lang}/dashboard/notifications`, icon: BellIcon, iconSolid: BellIconSolid },
      ];
    default:
      return [];
  }
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const lang = pathname?.split('/')[1] || 'fr';
  const navItems = profile ? getNavItems(profile.role, lang) : [];
  const roleInfo = profile ? ROLE_LABELS[profile.role] : null;

  const isActive = (href: string) => {
    if (href === `/${lang}/dashboard/farmer` ||
        href === `/${lang}/dashboard/cooperative` ||
        href === `/${lang}/dashboard/lender`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-16 px-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">MazaoChain</span>
        </div>
      </div>

      {roleInfo && (
        <div className="px-4 py-3 border-b border-gray-100">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = active ? item.iconSolid : item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span>{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4 flex-shrink-0">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {(user?.email?.[0] || 'U').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{user?.email || 'Utilisateur'}</p>
            <p className="text-xs text-gray-500 truncate">{roleInfo?.label}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-xl shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-60 bg-white border-r border-gray-100 shadow-sm
          transform transition-transform duration-300 ease-in-out
          lg:transform-none lg:flex lg:flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
        <SidebarContent />
      </aside>
    </>
  );
}
