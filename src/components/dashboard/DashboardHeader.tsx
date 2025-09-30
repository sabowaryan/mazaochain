'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'agriculteur': return 'Agriculteur';
      case 'cooperative': return 'Coopérative';
      case 'preteur': return 'Prêteur';
      case 'admin': return 'Administrateur';
      default: return 'Utilisateur';
    }
  };

  const getUserDisplayName = () => {
    if (profile?.farmer_profiles?.nom) return profile.farmer_profiles.nom;
    if (profile?.cooperative_profiles?.nom) return profile.cooperative_profiles.nom;
    if (profile?.lender_profiles?.institution_name) return profile.lender_profiles.institution_name;
    return user?.email || 'Utilisateur';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {actions}
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-gray-500">
                {getRoleDisplayName(profile?.role || '')}
              </p>
            </div>
            
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium text-sm">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}