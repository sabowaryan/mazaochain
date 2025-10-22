import { supabase } from '@/lib/supabase/client';

interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  userRole: 'agriculteur' | 'cooperative' | 'preteur';
  action: string;
  details: Record<string, unknown>;
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

class UserActivityService {
  async getRecentActivity(limit: number = 100): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select(`
          id,
          user_id,
          action,
          details,
          ip_address,
          user_agent,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map((activity: any) => ({
        id: activity.id,
        userId: activity.user_id || '',
        userEmail: 'N/A', // Will be fetched separately if needed
        userRole: 'agriculteur' as const,
        action: activity.action,
        details: activity.details || {},
        ipAddress: activity.ip_address || '',
        userAgent: activity.user_agent || '',
        timestamp: new Date(activity.created_at || Date.now())
      })) || [];
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw new Error('Failed to fetch user activity');
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users in last 24h
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: activeUsersData } = await supabase
        .from('user_activity_logs')
        .select('user_id')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      const uniqueActiveUsers = new Set(activeUsersData?.map((log: any) => log.user_id) || []);
      const activeUsers24h = uniqueActiveUsers.size;

      // Get new users in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: newUsers7d } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get users by role
      const { data: roleData } = await supabase
        .from('profiles')
        .select('role');

      const usersByRole = {
        agriculteur: 0,
        cooperative: 0,
        preteur: 0
      };

      roleData?.forEach((user: any) => {
        if (user.role in usersByRole) {
          usersByRole[user.role as keyof typeof usersByRole]++;
        }
      });

      // Get top actions
      const { data: actionsData } = await supabase
        .from('user_activity_logs')
        .select('action')
        .gte('created_at', sevenDaysAgo.toISOString());

      const actionCounts: { [key: string]: number } = {};
      actionsData?.forEach((log: any) => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      const topActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      return {
        totalUsers: totalUsers || 0,
        activeUsers24h,
        newUsers7d: newUsers7d || 0,
        usersByRole,
        topActions
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch user stats');
    }
  }

  async logUserActivity(activity: {
    user_id: string;
    action: string;
    details?: any;
    ip_address?: string;
    user_agent?: string;
  }) {
    try {
      const { error } = await supabase
        .from('user_activity_logs')
        .insert(activity);

      if (error) throw error;
    } catch (error) {
      console.error('Error logging user activity:', error);
      throw error;
    }
  }

  async getUserActivityHistory(userId: string, limit: number = 50): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select(`
          id,
          user_id,
          action,
          details,
          ip_address,
          user_agent,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map((activity: any) => ({
        id: activity.id,
        userId: activity.user_id || '',
        userEmail: 'N/A', // Will be fetched separately if needed
        userRole: 'agriculteur' as const,
        action: activity.action,
        details: activity.details || {},
        ipAddress: activity.ip_address || '',
        userAgent: activity.user_agent || '',
        timestamp: new Date(activity.created_at || Date.now())
      })) || [];
    } catch (error) {
      console.error('Error fetching user activity history:', error);
      throw new Error('Failed to fetch user activity history');
    }
  }
}

export const userActivityService = new UserActivityService();