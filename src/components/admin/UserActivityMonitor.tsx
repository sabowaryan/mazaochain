'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useUserActivityMonitoring } from '@/hooks/useUserActivityMonitoring';

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

export function UserActivityMonitor() {
  const { activities, stats, loading, error, refreshData } = useUserActivityMonitoring();
  const [roleFilter, setRoleFilter] = useState<'all' | 'agriculteur' | 'cooperative' | 'preteur'>('all');
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const filteredActivities = activities?.filter(activity => {
    const roleMatch = roleFilter === 'all' || activity.userRole === roleFilter;
    const now = new Date();
    const activityTime = new Date(activity.timestamp);
    
    let timeMatch = true;
    switch (timeFilter) {
      case '1h':
        timeMatch = now.getTime() - activityTime.getTime() <= 60 * 60 * 1000;
        break;
      case '24h':
        timeMatch = now.getTime() - activityTime.getTime() <= 24 * 60 * 60 * 1000;
        break;
      case '7d':
        timeMatch = now.getTime() - activityTime.getTime() <= 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        timeMatch = now.getTime() - activityTime.getTime() <= 30 * 24 * 60 * 60 * 1000;
        break;
    }
    
    return roleMatch && timeMatch;
  }) || [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'agriculteur': return '🌾';
      case 'cooperative': return '🏢';
      case 'preteur': return '💼';
      default: return '👤';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'agriculteur': return 'bg-green-100 text-green-800';
      case 'cooperative': return 'bg-blue-100 text-blue-800';
      case 'preteur': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats?.activeUsers24h || 0}</div>
          <div className="text-sm text-gray-600">Active (24h)</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{stats?.newUsers7d || 0}</div>
          <div className="text-sm text-gray-600">New (7d)</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {stats?.usersByRole ? Object.values(stats.usersByRole).reduce((a, b) => a + b, 0) : 0}
          </div>
          <div className="text-sm text-gray-600">Verified Users</div>
        </Card>
      </div>

      {/* User Distribution by Role */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Distribution by Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🌾</span>
              <div>
                <div className="font-semibold">Farmers</div>
                <div className="text-sm text-gray-600">Agriculteurs</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats?.usersByRole?.agriculteur || 0}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🏢</span>
              <div>
                <div className="font-semibold">Cooperatives</div>
                <div className="text-sm text-gray-600">Coopératives</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.usersByRole?.cooperative || 0}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💼</span>
              <div>
                <div className="font-semibold">Lenders</div>
                <div className="text-sm text-gray-600">Prêteurs</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.usersByRole?.preteur || 0}
            </div>
          </div>
        </div>
      </Card>

      {/* Top Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Most Common Actions</h3>
        <div className="space-y-2">
          {stats?.topActions?.map((action, index) => (
            <div key={action.action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                <span className="font-medium">{action.action}</span>
              </div>
              <span className="text-sm text-gray-600">{action.count} times</span>
            </div>
          )) || (
            <div className="text-gray-500 text-center py-4">No activity data available</div>
          )}
        </div>
      </Card>

      {/* Filters and Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="agriculteur">Farmers</option>
              <option value="cooperative">Cooperatives</option>
              <option value="preteur">Lenders</option>
            </select>
            
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </Card>

      {/* Activity Log */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent User Activity</h3>
        
        {error && (
          <div className="text-red-600 mb-4">Error loading activity data: {error.message}</div>
        )}
        
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <span className="text-2xl">{getRoleIcon(activity.userRole)}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">{activity.userEmail}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(activity.userRole)}`}>
                    {activity.userRole}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <strong>{activity.action}</strong>
                  {activity.details && (
                    <span className="ml-2 text-gray-500">
                      {JSON.stringify(activity.details, null, 2).slice(0, 100)}...
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{new Date(activity.timestamp).toLocaleString()}</span>
                  <span>IP: {activity.ipAddress}</span>
                </div>
              </div>
            </div>
          ))}
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No user activity found matching the current filters.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}