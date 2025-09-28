'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';

interface PerformanceData {
  timestamp: Date;
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  hedera: 'healthy' | 'warning' | 'critical';
  api: 'healthy' | 'warning' | 'critical';
  storage: 'healthy' | 'warning' | 'critical';
}

export function PerformanceMetrics() {
  const { metrics, health, loading, error, refreshMetrics } = usePerformanceMetrics();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const getHealthColor = (status: SystemHealth[keyof SystemHealth]) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: SystemHealth[keyof SystemHealth]) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {metrics?.avgResponseTime || 0}ms
          </div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
          <div className="text-xs text-gray-500 mt-1">
            Target: &lt; 2000ms
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {metrics?.uptime || 99.9}%
          </div>
          <div className="text-sm text-gray-600">System Uptime</div>
          <div className="text-xs text-gray-500 mt-1">
            Target: &gt; 99%
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {metrics?.throughput || 0}
          </div>
          <div className="text-sm text-gray-600">Requests/min</div>
          <div className="text-xs text-gray-500 mt-1">
            Peak: {metrics?.peakThroughput || 0}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {metrics?.errorRate || 0}%
          </div>
          <div className="text-sm text-gray-600">Error Rate</div>
          <div className="text-xs text-gray-500 mt-1">
            Target: &lt; 1%
          </div>
        </Card>
      </div>

      {/* System Health Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Health Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🗄️</span>
              <div>
                <div className="font-semibold">Database</div>
                <div className="text-sm text-gray-600">PostgreSQL</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span>{getHealthIcon(health?.database || 'healthy')}</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getHealthColor(health?.database || 'healthy')}`}>
                {health?.database || 'healthy'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⛓️</span>
              <div>
                <div className="font-semibold">Hedera Network</div>
                <div className="text-sm text-gray-600">Blockchain</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span>{getHealthIcon(health?.hedera || 'healthy')}</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getHealthColor(health?.hedera || 'healthy')}`}>
                {health?.hedera || 'healthy'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔌</span>
              <div>
                <div className="font-semibold">API Services</div>
                <div className="text-sm text-gray-600">REST API</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span>{getHealthIcon(health?.api || 'healthy')}</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getHealthColor(health?.api || 'healthy')}`}>
                {health?.api || 'healthy'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💾</span>
              <div>
                <div className="font-semibold">Storage</div>
                <div className="text-sm text-gray-600">File System</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span>{getHealthIcon(health?.storage || 'healthy')}</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getHealthColor(health?.storage || 'healthy')}`}>
                {health?.storage || 'healthy'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Hedera Transaction Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Hedera Transaction Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.hederaMetrics?.avgTransactionTime || 0}s
            </div>
            <div className="text-sm text-gray-600">Avg Transaction Time</div>
            <div className="text-xs text-gray-500 mt-1">Target: &lt; 5s</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {metrics?.hederaMetrics?.successRate || 0}%
            </div>
            <div className="text-sm text-gray-600">Transaction Success Rate</div>
            <div className="text-xs text-gray-500 mt-1">Target: &gt; 95%</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.hederaMetrics?.gasEfficiency || 0}%
            </div>
            <div className="text-sm text-gray-600">Gas Efficiency</div>
            <div className="text-xs text-gray-500 mt-1">Optimization Score</div>
          </div>
        </div>
      </Card>

      {/* Resource Usage */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Resource Usage</h3>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">CPU Usage</span>
              <span className="text-sm text-gray-600">{metrics?.cpuUsage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${metrics?.cpuUsage || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              <span className="text-sm text-gray-600">{metrics?.memoryUsage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${metrics?.memoryUsage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Alerts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Alerts</h3>
        
        {error && (
          <div className="text-red-600 mb-4">Error loading performance data: {error.message}</div>
        )}
        
        <div className="space-y-3">
          {metrics?.alerts?.map((alert, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              alert.severity === 'critical' ? 'bg-red-50 border-red-400' :
              alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-400' :
              'bg-blue-50 border-blue-400'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{alert.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{alert.description}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              No performance alerts at this time. System is running smoothly! 🎉
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={refreshMetrics}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Refresh Metrics
          </button>
        </div>
      </Card>
    </div>
  );
}