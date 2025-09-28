'use client';

import { useState, useEffect } from 'react';
import { userActivityService } from '@/lib/services/user-activity';

interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  userRole: 'agriculteur' | 'cooperative' | 'preteur';
  action: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

interface UserStats {
  totalUsers: number;
  activeUsers24h: number;
  newUsers7d: number;
  usersByRole: {
    agriculteur: number;
    cooperative: number;
    preteur: number;
  };
  topActions: Array<{
    action: string;
    count: number;
  }>;
}

export function useUserActivityMonitoring() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [activitiesData, statsData] = await Promise.all([
        userActivityService.getRecentActivity(),
        userActivityService.getUserStats()
      ]);
      
      setActivities(activitiesData);
      setStats(statsData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    activities,
    stats,
    loading,
    error,
    refreshData: fetchData
  };
}