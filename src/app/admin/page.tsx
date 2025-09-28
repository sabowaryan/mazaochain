import { Metadata } from 'next';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { requireAuth } from '@/lib/supabase/auth';

export const metadata: Metadata = {
  title: 'Admin Dashboard - MazaoChain',
  description: 'System administration and monitoring dashboard',
};

export default async function AdminPage() {
  await requireAuth(['admin']);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Platform oversight and system monitoring</p>
      </div>
      
      <AdminDashboard />
    </div>
  );
}