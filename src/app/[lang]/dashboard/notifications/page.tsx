import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationCenter />
      </div>
    </DashboardLayout>
  );
}