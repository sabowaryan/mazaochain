import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientNavigation } from "@/components/ClientNavigation";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { ConditionalMobileNavigation } from "@/components/navigation/ConditionalMobileNavigation";
import { ConditionalMain } from "@/components/layout/ConditionalMain";
import { WalletErrorSuppressor } from "@/components/WalletErrorSuppressor";
import { getDictionary } from './dictionaries';
import { TranslationProvider } from '@/components/TranslationProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { WalletModalGlobalProvider } from '@/components/wallet/WalletModalGlobalProvider';

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MazaoChain MVP",
  description: "Plateforme de prêt décentralisée pour les agriculteurs en RDC",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#22c55e",
};

// Only generate static params in production
export async function generateStaticParams() {
  if (process.env.NODE_ENV === 'development') {
    // In development, only generate the default language for faster builds
    return [{ lang: 'fr' }];
  }
  // In production, generate all languages
  return [{ lang: 'en' }, { lang: 'fr' }, { lang: 'ln' }];
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const validLang = ['en', 'fr', 'ln'].includes(lang) ? lang as 'en' | 'fr' | 'ln' : 'fr';
  const dict = await getDictionary(validLang);

  return (
    <>
      <ErrorBoundary>
        <TranslationProvider messages={dict} locale={validLang}>
          <AuthProvider>
            <WalletModalGlobalProvider>
              <WalletErrorSuppressor />
              <ServiceWorkerRegistration />
              <ClientNavigation />
              <ConditionalMain>{children}</ConditionalMain>
              <ConditionalMobileNavigation />
              <div className="offline-indicator-container">
                <OfflineIndicator />
              </div>
              <PWAInstallPrompt />
            </WalletModalGlobalProvider>
          </AuthProvider>
        </TranslationProvider>
      </ErrorBoundary>
    </>
  );
}