'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import {
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ChartBarIcon,
  CheckCircleIcon,
  UserGroupIcon,
  TagIcon,
  BriefcaseIcon,
  PresentationChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export function QuickActions() {
  const { profile } = useAuth();
  const router = useRouter();
  const role = profile?.role;

  const getQuickActions = () => {
    const lang = window.location.pathname.split('/')[1] || 'fr';

    switch (role) {
      case 'agriculteur':
        return [
          {
            title: 'Nouvelle évaluation',
            description: 'Évaluer vos récoltes',
            icon: ClipboardDocumentListIcon,
            action: () => router.push(`/${lang}/dashboard/farmer/evaluations/new`),
            gradient: 'from-emerald-500 to-emerald-600',
            hoverGradient: 'hover:from-emerald-600 hover:to-emerald-700'
          },
          {
            title: 'Demander un prêt',
            description: 'Financer vos projets',
            icon: BanknotesIcon,
            action: () => router.push(`/${lang}/dashboard/farmer/loans/request`),
            gradient: 'from-blue-500 to-blue-600',
            hoverGradient: 'hover:from-blue-600 hover:to-blue-700'
          },
          {
            title: 'Mon portfolio',
            description: 'Voir mes actifs',
            icon: ChartBarIcon,
            action: () => router.push(`/${lang}/dashboard/farmer/portfolio`),
            gradient: 'from-purple-500 to-purple-600',
            hoverGradient: 'hover:from-purple-600 hover:to-purple-700'
          }
        ];

      case 'cooperative':
        return [
          {
            title: 'Évaluations en attente',
            description: 'Valider les évaluations',
            icon: CheckCircleIcon,
            action: () => router.push(`/${lang}/dashboard/cooperative?tab=evaluations`),
            gradient: 'from-amber-500 to-amber-600',
            hoverGradient: 'hover:from-amber-600 hover:to-amber-700'
          },
          {
            title: 'Prêts à approuver',
            description: 'Examiner les demandes',
            icon: BanknotesIcon,
            action: () => router.push(`/${lang}/dashboard/cooperative?tab=loans`),
            gradient: 'from-blue-500 to-blue-600',
            hoverGradient: 'hover:from-blue-600 hover:to-blue-700'
          },
          {
            title: 'Gestion membres',
            description: 'Administrer la coopérative',
            icon: UserGroupIcon,
            action: () => router.push(`/${lang}/dashboard/cooperative?tab=members`),
            gradient: 'from-emerald-500 to-emerald-600',
            hoverGradient: 'hover:from-emerald-600 hover:to-emerald-700'
          }
        ];

      case 'preteur':
        return [
          {
            title: 'Opportunités',
            description: 'Investir dans des prêts',
            icon: TagIcon,
            action: () => router.push(`/${lang}/dashboard/lender/opportunities`),
            gradient: 'from-emerald-500 to-emerald-600',
            hoverGradient: 'hover:from-emerald-600 hover:to-emerald-700'
          },
          {
            title: 'Mon portfolio',
            description: 'Suivre mes investissements',
            icon: BriefcaseIcon,
            action: () => router.push(`/${lang}/dashboard/lender/portfolio`),
            gradient: 'from-purple-500 to-purple-600',
            hoverGradient: 'hover:from-purple-600 hover:to-purple-700'
          },
          {
            title: 'Analyses',
            description: 'Évaluer les risques',
            icon: PresentationChartBarIcon,
            action: () => router.push(`/${lang}/dashboard/lender/analytics`),
            gradient: 'from-blue-500 to-blue-600',
            hoverGradient: 'hover:from-blue-600 hover:to-blue-700'
          }
        ];

      default:
        return [];
    }
  };

  const actions = getQuickActions();

  if (actions.length === 0) return null;

  return (
    <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
          <PlusIcon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Actions rapides</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={index}
              onClick={action.action}
              className={`group farmer-action-button relative h-auto p-6 bg-gradient-to-br ${action.gradient} ${action.hoverGradient} text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-white/20 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">{action.title}</p>
                  <p className="text-xs opacity-90">{action.description}</p>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}