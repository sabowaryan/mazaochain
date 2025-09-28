import { redirect } from 'next/navigation';
import { getDictionary } from './dictionaries';

export default async function Page({
  params,
}: {
  params: Promise<{ lang: 'en' | 'fr' | 'ln' }>;
}) {
  const { lang } = await params;
  
  // You now have access to the current locale
  // e.g. /en/products -> `lang` is "en"
  const dict = await getDictionary(lang);
  
  // Redirect to dashboard as the main entry point
  redirect(`/${lang}/dashboard`);
}