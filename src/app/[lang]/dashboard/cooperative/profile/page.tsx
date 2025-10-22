'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const CooperativeProfileForm = dynamic(
  () => import('@/components/profiles/CooperativeProfileForm').then(mod => ({ default: mod.CooperativeProfileForm })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
);

export default function CooperativeProfilePage() {
  return <CooperativeProfileForm />
}