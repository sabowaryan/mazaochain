'use client';

import { useState, useEffect } from 'react';
import { alertsService } from '@/lib/services/alerts';

interface Alert {
  id: string;
  type: 'security' | 'performance' | 'system' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  assignedTo?: string;
  resolvedAt?: Date;
  metadata?: any;
}

interface AlertStats {
  critical: number;
  high: number;
  active: number;
  resolved24h: number;
  byType: {
    security: number;
    performance: number;
    system: number;
    business: number;
  };
}

export function useAlertsMonitoring() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [alertsData, statsData] = await Promise.all([
        alertsService.getAlerts(),
        alertsService.getAlertStats()
      ]);
      
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await alertsService.acknowledgeAlert(alertId);
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await alertsService.resolveAlert(alertId);
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    stats,
    loading,
    error,
    acknowledgeAlert,
    resolveAlert,
    refreshAlerts: fetchData
  };
}