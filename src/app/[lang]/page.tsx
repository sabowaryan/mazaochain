import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

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

  redirect(`/${validLang}/dashboard`);
}
