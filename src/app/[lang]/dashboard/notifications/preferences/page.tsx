import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function NotificationPreferencesPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationPreferences />
      </div>
    </DashboardLayout>
  );
}