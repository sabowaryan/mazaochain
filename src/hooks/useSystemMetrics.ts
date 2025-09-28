'use client';

import { useState, useEffect } from 'react';
import { systemMetricsService } from '@/lib/services/system-metrics';

interface SystemMetrics {
  totalUsers: number;
  activeFarmers: number;
  totalLoans: number;
  totalValueLocked: number;
  activeLoans: number;
  defaultRate: number;
  uptime: number;
  avgResponseTime: number;
  userGrowth: string;
  farmerGrowth: string;
  loanGrowth: string;
  tvlChange: string;
  activeLoanChange: string;
  defaultRateChange: string;
  responseTimeChange: string;
}

export function useSystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await systemMetricsService.getSystemMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics
  };
}