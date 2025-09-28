'use client';

import { useState, useEffect } from 'react';
import { performanceMetricsService } from '@/lib/services/performance-metrics';

interface PerformanceMetrics {
  avgResponseTime: number;
  uptime: number;
  throughput: number;
  peakThroughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  hederaMetrics: {
    avgTransactionTime: number;
    successRate: number;
    gasEfficiency: number;
  };
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    timestamp: Date;
  }>;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  hedera: 'healthy' | 'warning' | 'critical';
  api: 'healthy' | 'warning' | 'critical';
  storage: 'healthy' | 'warning' | 'critical';
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [metricsData, healthData] = await Promise.all([
        performanceMetricsService.getPerformanceMetrics(),
        performanceMetricsService.getSystemHealth()
      ]);
      
      setMetrics(metricsData);
      setHealth(healthData);
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
    metrics,
    health,
    loading,
    error,
    refreshMetrics: fetchData
  };
}