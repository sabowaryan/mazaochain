import { describe, it, expect, vi, beforeEach } from 'vitest';
import { systemMetricsService } from '@/lib/services/system-metrics';
import { transactionMonitoringService } from '@/lib/services/transaction-monitoring';
import { userActivityService } from '@/lib/services/user-activity';
import { performanceMetricsService } from '@/lib/services/performance-metrics';
import { alertsService } from '@/lib/services/alerts';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => {
  const mockQuery: unknown = {
    select: vi.fn(() => mockQuery),
    eq: vi.fn(() => mockQuery),
    gte: vi.fn(() => mockQuery),
    order: vi.fn(() => mockQuery),
    limit: vi.fn(() => mockQuery),
    single: vi.fn(() => Promise.resolve({ data: { count: 10 }, error: null })),
    insert: vi.fn(() => mockQuery),
    update: vi.fn(() => mockQuery),
  };
  
  const mockSupabaseClient = {
    from: vi.fn(() => {
      // Set default resolved values
      mockQuery.single.mockResolvedValue({ data: { count: 10 }, error: null });
      mockQuery.limit.mockResolvedValue({ data: [{ count: 10, user: { email: 'test@test.com' } }], error: null });
      mockQuery.insert.mockResolvedValue({ data: { id: 'test' }, error: null });
      return mockQuery;
    }),
    rpc: vi.fn(() => Promise.resolve({ data: 10, error: null }))
  };

  return {
    createClient: () => mockSupabaseClient,
    supabase: mockSupabaseClient
  };
});

describe('Admin Monitoring Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SystemMetricsService', () => {
    it('should fetch system metrics successfully', async () => {
      const metrics = await systemMetricsService.getSystemMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalUsers).toBe('number');
      expect(typeof metrics.activeFarmers).toBe('number');
      expect(typeof metrics.totalLoans).toBe('number');
      expect(typeof metrics.uptime).toBe('number');
    });

    it('should record performance metrics', async () => {
      const metric = {
        avg_response_time: 850,
        uptime: 99.95,
        throughput: 120,
        error_rate: 0.5,
        cpu_usage: 45.2,
        memory_usage: 62.8
      };

      await expect(systemMetricsService.recordPerformanceMetric(metric)).resolves.not.toThrow();
    });
  });

  describe('TransactionMonitoringService', () => {
    it('should fetch recent transactions', async () => {
      const transactions = await transactionMonitoringService.getRecentTransactions();
      
      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should get transaction analytics', async () => {
      const analytics = await transactionMonitoringService.getTransactionAnalytics();
      
      expect(analytics).toBeDefined();
      expect(typeof analytics.totalTransactions).toBe('number');
      expect(typeof analytics.successRate).toBe('number');
      expect(typeof analytics.pendingCount).toBe('number');
      expect(typeof analytics.totalVolume).toBe('number');
    });

    it('should record transaction', async () => {
      const transaction = {
        type: 'mint',
        from_address: '0x123',
        to_address: '0x456',
        amount: 100,
        token_type: 'MAZAO',
        hedera_transaction_id: 'tx123',
        status: 'pending'
      };

      await expect(transactionMonitoringService.recordTransaction(transaction)).resolves.not.toThrow();
    });
  });

  describe('UserActivityService', () => {
    it('should fetch recent user activity', async () => {
      const activities = await userActivityService.getRecentActivity();
      
      expect(Array.isArray(activities)).toBe(true);
    });

    it('should get user statistics', async () => {
      const stats = await userActivityService.getUserStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.activeUsers24h).toBe('number');
      expect(stats.usersByRole).toBeDefined();
      expect(Array.isArray(stats.topActions)).toBe(true);
    });

    it('should log user activity', async () => {
      const activity = {
        user_id: 'user123',
        action: 'login',
        details: { ip: '127.0.0.1' },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0'
      };

      await expect(userActivityService.logUserActivity(activity)).resolves.not.toThrow();
    });
  });

  describe('PerformanceMetricsService', () => {
    it('should fetch performance metrics', async () => {
      const metrics = await performanceMetricsService.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.avgResponseTime).toBe('number');
      expect(typeof metrics.uptime).toBe('number');
      expect(metrics.hederaMetrics).toBeDefined();
      expect(Array.isArray(metrics.alerts)).toBe(true);
    });

    it('should get system health status', async () => {
      const health = await performanceMetricsService.getSystemHealth();
      
      expect(health).toBeDefined();
      expect(['healthy', 'warning', 'critical']).toContain(health.database);
      expect(['healthy', 'warning', 'critical']).toContain(health.hedera);
      expect(['healthy', 'warning', 'critical']).toContain(health.api);
      expect(['healthy', 'warning', 'critical']).toContain(health.storage);
    });

    it('should create performance alert', async () => {
      const alert = {
        type: 'performance',
        severity: 'warning' as const,
        title: 'High Response Time',
        description: 'API response time exceeded threshold',
        source: 'performance_monitor'
      };

      await expect(performanceMetricsService.createAlert(alert)).resolves.not.toThrow();
    });
  });

  describe('AlertsService', () => {
    it('should fetch alerts', async () => {
      const alerts = await alertsService.getAlerts();
      
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should get alert statistics', async () => {
      const stats = await alertsService.getAlertStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.critical).toBe('number');
      expect(typeof stats.high).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(stats.byType).toBeDefined();
    });

    it('should create alert', async () => {
      const alert = {
        type: 'security' as const,
        severity: 'high' as const,
        title: 'Security Alert',
        description: 'Suspicious activity detected',
        source: 'security_monitor'
      };

      await expect(alertsService.createAlert(alert)).resolves.not.toThrow();
    });

    it('should acknowledge alert', async () => {
      const alertId = 'alert123';
      
      await expect(alertsService.acknowledgeAlert(alertId)).resolves.not.toThrow();
    });

    it('should resolve alert', async () => {
      const alertId = 'alert123';
      
      await expect(alertsService.resolveAlert(alertId)).resolves.not.toThrow();
    });

    it('should create predefined alert types', async () => {
      await expect(alertsService.createSecurityAlert('Test Security Alert', 'Test description')).resolves.not.toThrow();
      await expect(alertsService.createPerformanceAlert('Test Performance Alert', 'Test description')).resolves.not.toThrow();
      await expect(alertsService.createSystemAlert('Test System Alert', 'Test description')).resolves.not.toThrow();
      await expect(alertsService.createBusinessAlert('Test Business Alert', 'Test description')).resolves.not.toThrow();
    });
  });
});