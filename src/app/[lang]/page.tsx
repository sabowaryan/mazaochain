import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';

const DASHBOARD_PATHS: Record<string, string> = {
  agriculteur: '/dashboard/farmer',
  cooperative: '/dashboard/cooperative',
  preteur: '/dashboard/lender',
  admin: '/admin',
};

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const validLang = ['en', 'fr', 'ln'].includes(lang) ? lang : 'fr';

  const { userId } = await auth();

  if (!userId) {
    redirect(`/${validLang}/auth/login`);
  }

  try {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:5000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const profileRes = await fetch(
      `${baseUrl}/api/profile?userId=${encodeURIComponent(userId)}`,
      { cache: 'no-store' }
    );

    if (profileRes.ok) {
      const profile = await profileRes.json();
      const rolePath = DASHBOARD_PATHS[profile.role as string];
      if (rolePath) {
        redirect(`/${validLang}${rolePath}`);
      }
    }
  } catch {
  }

  redirect(`/${validLang}/dashboard`);
}
