'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

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
            description: 'Évaluer vos cultures',
            icon: '🌾',
            action: () => router.push(`/${lang}/dashboard/farmer/evaluations`),
            color: 'primary'
          },
          {
            title: 'Demander un prêt',
            description: 'Utiliser vos tokens comme garantie',
            icon: '💰',
            action: () => router.push(`/${lang}/dashboard/farmer/loans`),
            color: 'secondary'
          },
          {
            title: 'Mon portfolio',
            description: 'Voir vos tokens MAZAO',
            icon: '📊',
            action: () => router.push(`/${lang}/dashboard/farmer/portfolio`),
            color: 'success'
          }
        ];
      
      case 'cooperative':
        return [
          {
            title: 'Évaluations en attente',
            description: 'Valider les évaluations',
            icon: '✅',
            action: () => router.push(`/${lang}/dashboard/cooperative?tab=evaluations`),
            color: 'warning'
          },
          {
            title: 'Prêts à approuver',
            description: 'Examiner les demandes',
            icon: '🏦',
            action: () => router.push(`/${lang}/dashboard/cooperative?tab=loans`),
            color: 'secondary'
          },
          {
            title: 'Gestion membres',
            description: 'Administrer la coopérative',
            icon: '👥',
            action: () => router.push(`/${lang}/dashboard/cooperative?tab=members`),
            color: 'primary'
          }
        ];
      
      case 'preteur':
        return [
          {
            title: 'Opportunités',
            description: 'Investir dans des prêts',
            icon: '🎯',
            action: () => router.push(`/${lang}/dashboard/lender?tab=opportunities`),
            color: 'primary'
          },
          {
            title: 'Mon portfolio',
            description: 'Suivre mes investissements',
            icon: '💼',
            action: () => router.push(`/${lang}/dashboard/lender?tab=portfolio`),
            color: 'success'
          },
          {
            title: 'Analyses',
            description: 'Évaluer les risques',
            icon: '📈',
            action: () => router.push(`/${lang}/dashboard/lender?tab=analytics`),
            color: 'secondary'
          }
        ];
      
      default:
        return [];
    }
  };

  const actions = getQuickActions();

  if (actions.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
            onClick={action.action}
          >
            <span className="text-2xl">{action.icon}</span>
            <div className="text-center">
              <p className="font-medium text-sm">{action.title}</p>
              <p className="text-xs text-gray-600">{action.description}</p>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
}