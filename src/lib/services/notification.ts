import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

export type NotificationType = 
  | 'registration_pending'
  | 'registration_approved'
  | 'registration_rejected'
  | 'evaluation_submitted'
  | 'evaluation_approved'
  | 'evaluation_rejected'
  | 'loan_requested'
  | 'loan_approved'
  | 'loan_rejected'
  | 'loan_disbursed'
  | 'repayment_due'
  | 'repayment_overdue'
  | 'repayment_completed'
  | 'collateral_released'
  | 'system_maintenance'
  | 'security_alert'
  | 'price_update';

export type NotificationChannel = 'in_app' | 'email' | 'sms';

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  channels: {
    [key in NotificationType]: NotificationChannel[];
  };
}

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
}

export class NotificationService {
  private supabase = createClient();

  /**
   * Send notification through specified channels
   */
  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(notification.userId);
      
      // Determine which channels to use
      const channels = notification.channels || 
        preferences?.channels[notification.type] || 
        ['in_app'];

      // Send through each channel
      const promises = channels.map(channel => {
        switch (channel) {
          case 'in_app':
            return this.sendInAppNotification(notification);
          case 'email':
            return this.sendEmailNotification(notification);
          case 'sms':
            return this.sendSMSNotification(notification);
          default:
            return Promise.resolve();
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(notification: NotificationData): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        is_read: false
      });

    if (error) {
      console.error('Error sending in-app notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: NotificationData): Promise<void> {
    try {
      // Get user email
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('email')
        .eq('id', notification.userId)
        .single();

      if (!profile?.email) {
        console.warn('No email found for user:', notification.userId);
        return;
      }

      // Call edge function for email sending
      const { error } = await this.supabase.functions.invoke('send-email', {
        body: {
          to: profile.email,
          subject: notification.title,
          html: this.generateEmailTemplate(notification),
          type: notification.type
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in email notification:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(notification: NotificationData): Promise<void> {
    try {
      // Get user phone number
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', notification.userId)
        .single();

      if (!profile?.phone_number) {
        console.warn('No phone number found for user:', notification.userId);
        return;
      }

      // Call edge function for SMS sending
      const { error } = await this.supabase.functions.invoke('send-sms', {
        body: {
          to: profile.phone_number,
          message: `${notification.title}: ${notification.message}`,
          type: notification.type
        }
      });

      if (error) {
        console.error('Error sending SMS:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in SMS notification:', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    if (!data) return null;

    // Transform database format to interface format
    return {
      userId: data.user_id || '',
      emailEnabled: data.email_enabled || false,
      smsEnabled: data.sms_enabled || false,
      inAppEnabled: data.in_app_enabled || false,
      channels: (data.channels as unknown) || {}
    };
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    const { error } = await this.supabase
      .from('notification_preferences')
      .upsert(preferences);

    if (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Generate email template
   */
  private generateEmailTemplate(notification: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MazaoChain</h1>
            </div>
            <div class="content">
              <h2>${notification.title}</h2>
              <p>${notification.message}</p>
              ${notification.data?.actionUrl ? `
                <p>
                  <a href="${notification.data.actionUrl}" class="button">Voir les détails</a>
                </p>
              ` : ''}
            </div>
            <div class="footer">
              <p>© 2024 MazaoChain. Tous droits réservés.</p>
              <p>Vous recevez cet email car vous êtes inscrit sur MazaoChain.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, limit = 20, offset = 0) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();