'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';

const ROUTE_META: Record<string, { title: string; breadcrumbs: string[] }> = {
  farmer: { title: 'Tableau de bord', breadcrumbs: ['Agriculteur', 'Accueil'] },
  'farmer/evaluations': { title: 'Évaluations', breadcrumbs: ['Agriculteur', 'Évaluations'] },
  'farmer/loans': { title: 'Prêts', breadcrumbs: ['Agriculteur', 'Prêts'] },
  'farmer/portfolio': { title: 'Portfolio', breadcrumbs: ['Agriculteur', 'Portfolio'] },
  'farmer/profile': { title: 'Profil', breadcrumbs: ['Agriculteur', 'Profil'] },
  cooperative: { title: 'Tableau de bord', breadcrumbs: ['Coopérative', 'Accueil'] },
  'cooperative/evaluations': { title: 'Évaluations', breadcrumbs: ['Coopérative', 'Évaluations'] },
  'cooperative/loans': { title: 'Prêts', breadcrumbs: ['Coopérative', 'Prêts'] },
  'cooperative/farmers': { title: 'Membres', breadcrumbs: ['Coopérative', 'Membres'] },
  'cooperative/profile': { title: 'Profil', breadcrumbs: ['Coopérative', 'Profil'] },
  lender: { title: 'Tableau de bord', breadcrumbs: ['Prêteur', 'Accueil'] },
  'lender/opportunities': { title: 'Opportunités', breadcrumbs: ['Prêteur', 'Opportunités'] },
  'lender/portfolio': { title: 'Portfolio', breadcrumbs: ['Prêteur', 'Portfolio'] },
  'lender/profile': { title: 'Profil', breadcrumbs: ['Prêteur', 'Profil'] },
  notifications: { title: 'Notifications', breadcrumbs: ['Notifications'] },
  'farmer/notifications': { title: 'Notifications', breadcrumbs: ['Agriculteur', 'Notifications'] },
  'cooperative/notifications': { title: 'Notifications', breadcrumbs: ['Coopérative', 'Notifications'] },
  'lender/notifications': { title: 'Notifications', breadcrumbs: ['Prêteur', 'Notifications'] },
  'farmer/evaluations/new': { title: 'Nouvelle évaluation', breadcrumbs: ['Agriculteur', 'Évaluations', 'Nouvelle'] },
  'farmer/loans/request': { title: 'Demander un prêt', breadcrumbs: ['Agriculteur', 'Prêts', 'Demande'] },
  admin: { title: 'Administration', breadcrumbs: ['Admin', 'Panneau de contrôle'] },
  'admin/prices': { title: 'Prix agricoles', breadcrumbs: ['Admin', 'Prix'] },
};

export function DashboardHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  const dashboardIdx = pathname?.indexOf('/dashboard/') ?? -1;
  const routeKey = dashboardIdx >= 0
    ? pathname!.slice(dashboardIdx + '/dashboard/'.length)
    : '';

  const meta = ROUTE_META[routeKey] ?? { title: 'Dashboard', breadcrumbs: [] };
  const initials = (user?.email?.[0] ?? 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 sm:px-6">
      <div className="w-10 lg:hidden flex-shrink-0" />

      <div className="flex-1 min-w-0">
        {meta.breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-0.5" aria-label="Breadcrumb">
            {meta.breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300">/</span>}
                <span className={i === meta.breadcrumbs.length - 1 ? 'text-gray-600 font-medium' : ''}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h2 className="text-sm font-semibold text-gray-900 leading-none truncate">{meta.title}</h2>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <BellIcon className="w-5 h-5" />
        </button>
        <div
          className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"
          title={user?.email ?? undefined}
        >
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>
      </div>
    </header>
  );
}
