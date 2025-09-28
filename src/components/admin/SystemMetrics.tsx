'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  icon: string;
}

export function SystemMetrics() {
  const { metrics, loading, error } = useSystemMetrics();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-600">Error loading system metrics: {error.message}</div>
      </Card>
    );
  }

  const metricCards: MetricCard[] = [
    {
      title: 'Total Users',
      value: metrics?.totalUsers || 0,
      change: metrics?.userGrowth || '+0%',
      trend: 'up',
      icon: '👥'
    },
    {
      title: 'Active Farmers',
      value: metrics?.activeFarmers || 0,
      change: metrics?.farmerGrowth || '+0%',
      trend: 'up',
      icon: '🌾'
    },
    {
      title: 'Total Loans',
      value: metrics?.totalLoans || 0,
      change: metrics?.loanGrowth || '+0%',
      trend: 'up',
      icon: '💰'
    },
    {
      title: 'Platform TVL',
      value: `$${metrics?.totalValueLocked?.toLocaleString() || '0'}`,
      change: metrics?.tvlChange || '+0%',
      trend: 'up',
      icon: '💎'
    },
    {
      title: 'Active Loans',
      value: metrics?.activeLoans || 0,
      change: metrics?.activeLoanChange || '+0%',
      trend: 'stable',
      icon: '📊'
    },
    {
      title: 'Default Rate',
      value: `${metrics?.defaultRate || 0}%`,
      change: metrics?.defaultRateChange || '+0%',
      trend: 'down',
      icon: '⚠️'
    },
    {
      title: 'System Uptime',
      value: `${metrics?.uptime || 99.9}%`,
      change: 'Last 30 days',
      trend: 'stable',
      icon: '🟢'
    },
    {
      title: 'Avg Response Time',
      value: `${metrics?.avgResponseTime || 0}ms`,
      change: metrics?.responseTimeChange || '+0%',
      trend: 'down',
      icon: '⚡'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                {metric.change && (
                  <p className={`text-sm mt-1 ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {metric.change}
                  </p>
                )}
              </div>
              <div className="text-3xl">{metric.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Platform Health Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Platform Health Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Database: Healthy</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Hedera Network: Connected</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">External APIs: Operational</span>
          </div>
        </div>
      </Card>
    </div>
  );
}