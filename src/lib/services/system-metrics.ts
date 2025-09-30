import { supabase } from '@/lib/supabase/client';

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

class SystemMetricsService {
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get user counts
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeFarmers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'agriculteur')
        .eq('is_validated', true);

      // Get loan metrics
      const { count: totalLoans } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true });

      const { count: activeLoans } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Calculate TVL from active loans
      const { data: loanData } = await supabase
        .from('loans')
        .select('principal')
        .eq('status', 'active');

      const totalValueLocked = loanData?.reduce((sum: number, loan: { principal: number | null }) => sum + (loan.principal || 0), 0) || 0;

      // Calculate default rate
      const { count: defaultedLoans } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'defaulted');

      const defaultRate = totalLoans ? ((defaultedLoans || 0) / totalLoans) * 100 : 0;

      // Get performance metrics from monitoring table
      const { data: performanceData } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const avgResponseTime = performanceData?.avg_response_time || 0;
      const uptime = performanceData?.uptime || 99.9;

      // Calculate growth percentages (mock data for now)
      const userGrowth = '+12%';
      const farmerGrowth = '+8%';
      const loanGrowth = '+15%';
      const tvlChange = '+22%';
      const activeLoanChange = '+5%';
      const defaultRateChange = '-2%';
      const responseTimeChange = '-5%';

      return {
        totalUsers: totalUsers || 0,
        activeFarmers: activeFarmers || 0,
        totalLoans: totalLoans || 0,
        totalValueLocked,
        activeLoans: activeLoans || 0,
        defaultRate: Math.round(defaultRate * 100) / 100,
        uptime,
        avgResponseTime,
        userGrowth,
        farmerGrowth,
        loanGrowth,
        tvlChange,
        activeLoanChange,
        defaultRateChange,
        responseTimeChange
      };
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw new Error('Failed to fetch system metrics');
    }
  }

  async recordPerformanceMetric(metric: {
    avg_response_time: number;
    uptime: number;
    throughput: number;
    error_rate: number;
    cpu_usage: number;
    memory_usage: number;
  }) {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(metric);

      if (error) throw error;
    } catch (error) {
      console.error('Error recording performance metric:', error);
      throw error;
    }
  }
}

export const systemMetricsService = new SystemMetricsService();