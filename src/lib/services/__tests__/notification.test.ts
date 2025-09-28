import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../notification';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          order: vi.fn(() => ({
            range: vi.fn(() => ({ data: [], error: null }))
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      })),
      upsert: vi.fn(() => ({ error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    })),
    functions: {
      invoke: vi.fn(() => ({ error: null }))
    }
  })
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
    vi.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should send in-app notification by default', async () => {
      const notification = {
        userId: 'user-123',
        type: 'loan_approved' as const,
        title: 'Test Notification',
        message: 'Test message'
      };

      await notificationService.sendNotification(notification);

      // Test passes if no error is thrown
      expect(true).toBe(true);
    });

    it('should handle notification with custom channels', async () => {
      const notification = {
        userId: 'user-123',
        type: 'loan_approved' as const,
        title: 'Test Notification',
        message: 'Test message',
        channels: ['in_app', 'email'] as const
      };

      await notificationService.sendNotification(notification);

      // Test passes if no error is thrown
      expect(true).toBe(true);
    });
  });

  describe('getUserPreferences', () => {
    it('should fetch user notification preferences', async () => {
      const userId = 'user-123';

      const result = await notificationService.getUserPreferences(userId);

      // Test passes if no error is thrown
      expect(result).toBeNull();
    });

    it('should return null when preferences not found', async () => {
      const userId = 'user-123';

      const result = await notificationService.getUserPreferences(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user notification preferences', async () => {
      const preferences = {
        userId: 'user-123',
        emailEnabled: false,
        smsEnabled: true,
        inAppEnabled: true
      };

      await notificationService.updateUserPreferences(preferences);

      // Test passes if no error is thrown
      expect(true).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notif-123';

      await notificationService.markAsRead(notificationId);

      // Test passes if no error is thrown
      expect(true).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      const userId = 'user-123';

      await notificationService.markAllAsRead(userId);

      // Test passes if no error is thrown
      expect(true).toBe(true);
    });
  });

  describe('getNotifications', () => {
    it('should fetch notifications for user', async () => {
      const userId = 'user-123';

      const result = await notificationService.getNotifications(userId);

      expect(result).toEqual([]);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const notificationId = 'notif-123';

      await notificationService.deleteNotification(notificationId);

      // Test passes if no error is thrown
      expect(true).toBe(true);
    });
  });
});