'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If accessed directly without locale, redirect to default locale
    if (!pathname.includes('/fr/') && !pathname.includes('/en/') && !pathname.includes('/ln/')) {
      const locale = 'fr';
      if (!pathname.startsWith(`/${locale}/`)) {
        router.push(`/${locale}/auth/login`);
      }
    }
  }, [pathname, router]);

  return (
    <html lang="fr">
      <body className="antialiased bg-gray-50">
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Accès Refusé
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              </p>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="text-center">
                <Link
                  href="/fr/auth/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Retour à la Connexion
                </Link>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Si vous pensez avoir accès à cette page, veuillez contacter l'administrateur du système.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
