import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientNavigation } from "@/components/ClientNavigation";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
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

export async function generateStaticParams() {
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
    <html lang={validLang}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <ErrorBoundary>
          <TranslationProvider messages={dict} locale={validLang}>
            <AuthProvider>
              <WalletModalGlobalProvider>
                <WalletErrorSuppressor />
                <ServiceWorkerRegistration />
                <ClientNavigation />
                <main className="min-h-screen pb-16 md:pb-0">{children}</main>
                <MobileNavigation />
                <PWAInstallPrompt />
                <OfflineIndicator />
              </WalletModalGlobalProvider>
            </AuthProvider>
          </TranslationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}