import { redirect } from 'next/navigation';

export default async function DashboardPage({
  params
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  
  // This will be handled by middleware to redirect to appropriate role-based dashboard
  redirect(`/${lang}/dashboard/farmer`);
}