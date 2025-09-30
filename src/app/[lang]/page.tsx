import { redirect } from 'next/navigation';
import { getDictionary } from './dictionaries';

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const validLang = ['en', 'fr', 'ln'].includes(lang) ? lang as 'en' | 'fr' | 'ln' : 'fr';
  
  // You now have access to the current locale
  // e.g. /en/products -> `lang` is "en"
  const dict = await getDictionary(validLang);
  
  // Redirect to dashboard as the main entry point
  redirect(`/${validLang}/dashboard`);
}