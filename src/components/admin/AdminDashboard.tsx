'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { SystemMetrics } from './SystemMetrics';
import { TransactionMonitor } from './TransactionMonitor';
import { UserActivityMonitor } from './UserActivityMonitor';
import { PerformanceMetrics } from './PerformanceMetrics';
import { AlertsPanel } from './AlertsPanel';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'users' | 'performance' | 'alerts'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '💰' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'alerts', label: 'Alerts', icon: '🚨' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <SystemMetrics />}
        {activeTab === 'transactions' && <TransactionMonitor />}
        {activeTab === 'users' && <UserActivityMonitor />}
        {activeTab === 'performance' && <PerformanceMetrics />}
        {activeTab === 'alerts' && <AlertsPanel />}
      </div>
    </div>
  );
}