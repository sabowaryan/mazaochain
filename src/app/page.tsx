import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

export default function RootPage() {
  // This will be handled by middleware, but keeping as fallback
  redirect(`/${defaultLocale}`);
}