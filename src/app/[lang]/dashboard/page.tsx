'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RequireAuth } from '@/components/auth/AuthGuard';

function DashboardRedirectContent() {
  const { user, profile, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized || loading) return;

    if (user && profile) {
      // Rediriger vers le dashboard approprié selon le rôle
      const role = profile.role;
      const lang = window.location.pathname.split('/')[1] || 'fr';
      
      switch (role) {
        case 'agriculteur':
          router.push(`/${lang}/dashboard/farmer`);
          break;
        case 'cooperative':
          router.push(`/${lang}/dashboard/cooperative`);
          break;
        case 'preteur':
          router.push(`/${lang}/dashboard/lender`);
          break;
        case 'admin':
          router.push(`/admin`);
          break;
        default:
          // Par défaut, rediriger vers farmer
          router.push(`/${lang}/dashboard/farmer`);
      }
    }
  }, [user, profile, loading, initialized, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Redirection vers votre dashboard...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardRedirectContent />
    </RequireAuth>
  );
}