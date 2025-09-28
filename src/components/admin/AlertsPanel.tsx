'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useAlertsMonitoring } from '@/hooks/useAlertsMonitoring';

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

export function AlertsPanel() {
  const { alerts, stats, loading, error, acknowledgeAlert, resolveAlert, refreshAlerts } = useAlertsMonitoring();
  const [severityFilter, setSeverityFilter] = useState<'all' | Alert['severity']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Alert['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Alert['type']>('all');

  const filteredAlerts = alerts?.filter(alert => {
    const severityMatch = severityFilter === 'all' || alert.severity === severityFilter;
    const statusMatch = statusFilter === 'all' || alert.status === statusFilter;
    const typeMatch = typeFilter === 'all' || alert.type === typeFilter;
    return severityMatch && statusMatch && typeMatch;
  }) || [];

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'acknowledged': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'security': return '🔒';
      case 'performance': return '⚡';
      case 'system': return '🖥️';
      case 'business': return '📊';
      default: return '⚠️';
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
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
      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{stats?.critical || 0}</div>
          <div className="text-sm text-gray-600">Critical Alerts</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{stats?.high || 0}</div>
          <div className="text-sm text-gray-600">High Priority</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats?.active || 0}</div>
          <div className="text-sm text-gray-600">Active Alerts</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats?.resolved24h || 0}</div>
          <div className="text-sm text-gray-600">Resolved (24h)</div>
        </Card>
      </div>

      {/* Alert Categories */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Alert Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔒</span>
              <div>
                <div className="font-semibold">Security</div>
                <div className="text-sm text-gray-600">Auth & Access</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats?.byType?.security || 0}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="font-semibold">Performance</div>
                <div className="text-sm text-gray-600">Speed & Load</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.byType?.performance || 0}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🖥️</span>
              <div>
                <div className="font-semibold">System</div>
                <div className="text-sm text-gray-600">Infrastructure</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.byType?.system || 0}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-semibold">Business</div>
                <div className="text-sm text-gray-600">Operations</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.byType?.business || 0}
            </div>
          </div>
        </div>
      </Card>

      {/* Filters and Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="system">System</option>
              <option value="business">Business</option>
            </select>
          </div>
          
          <button
            onClick={refreshAlerts}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </Card>

      {/* Alerts List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
        
        {error && (
          <div className="text-red-600 mb-4">Error loading alerts: {error.message}</div>
        )}
        
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                        {alert.severity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{alert.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Source: {alert.source}</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      {alert.assignedTo && <span>Assigned to: {alert.assignedTo}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700"
                    >
                      Acknowledge
                    </button>
                  )}
                  
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
              
              {alert.metadata && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(alert.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
          
          {filteredAlerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No alerts found matching the current filters.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}