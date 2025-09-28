"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService, NotificationType } from '@/lib/services/notification';
import { Card } from '@/components/ui/Card';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

const notificationIcons: Record<NotificationType, string> = {
  registration_pending: '⏳',
  registration_approved: '✅',
  registration_rejected: '❌',
  evaluation_submitted: '📋',
  evaluation_approved: '✅',
  evaluation_rejected: '❌',
  loan_requested: '💰',
  loan_approved: '✅',
  loan_rejected: '❌',
  loan_disbursed: '💸',
  repayment_due: '⏰',
  repayment_overdue: '🚨',
  repayment_completed: '✅',
  collateral_released: '🔓',
  system_maintenance: '🔧',
  security_alert: '🚨',
  price_update: '📈'
};

const notificationColors: Record<NotificationType, string> = {
  registration_pending: 'bg-yellow-100 border-yellow-200',
  registration_approved: 'bg-green-100 border-green-200',
  registration_rejected: 'bg-red-100 border-red-200',
  evaluation_submitted: 'bg-blue-100 border-blue-200',
  evaluation_approved: 'bg-green-100 border-green-200',
  evaluation_rejected: 'bg-red-100 border-red-200',
  loan_requested: 'bg-blue-100 border-blue-200',
  loan_approved: 'bg-green-100 border-green-200',
  loan_rejected: 'bg-red-100 border-red-200',
  loan_disbursed: 'bg-green-100 border-green-200',
  repayment_due: 'bg-yellow-100 border-yellow-200',
  repayment_overdue: 'bg-red-100 border-red-200',
  repayment_completed: 'bg-green-100 border-green-200',
  collateral_released: 'bg-green-100 border-green-200',
  system_maintenance: 'bg-gray-100 border-gray-200',
  security_alert: 'bg-red-100 border-red-200',
  price_update: 'bg-blue-100 border-blue-200'
};

export function NotificationCenter() {
  const { user } = useAuth();
  const { 
    notifications: hookNotifications, 
    unreadCount, 
    loading: hookLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadNotifications = useCallback(async (reset = false) => {
    if (!user) return;

    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      const data = await notificationService.getNotifications(
        user.id,
        20,
        currentPage * 20
      );

      // Transform data to match Notification interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type as NotificationType,
        title: item.title,
        message: item.message,
        is_read: item.is_read || false,
        data: item.data || {},
        created_at: item.created_at
      }));

      if (reset) {
        setNotifications(transformedData);
        setPage(0);
      } else {
        setNotifications(prev => [...prev, ...transformedData]);
      }

      setHasMore((data?.length || 0) === 20);
      if (!reset) setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    if (user) {
      loadNotifications(true);
    }
  }, [user]);

  const handleMarkAsRead = markAsRead;
  const handleMarkAllAsRead = markAllAsRead;
  const handleDeleteNotification = deleteNotification;

  // Use hook notifications for initial load, then manage local state for pagination
  useEffect(() => {
    if (hookNotifications.length > 0 && notifications.length === 0) {
      setNotifications(hookNotifications);
      setLoading(false);
    }
  }, [hookNotifications, notifications.length]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.is_read;
    return notification.type === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)} heure${Math.floor(diffInHours) > 1 ? 's' : ''}`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Veuillez vous connecter pour voir vos notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Centre de notifications
          </h2>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes les notifications sont lues'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'unread'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Non lues ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('loan_approved')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'loan_approved'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Prêts
          </button>
          <button
            onClick={() => setFilter('evaluation_approved')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'evaluation_approved'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Évaluations
          </button>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Aucune notification trouvée</p>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 border-l-4 ${notificationColors[notification.type]} ${
                !notification.is_read ? 'shadow-md' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">
                    {notificationIcons[notification.type]}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mt-1">
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(notification.created_at)}
                    </p>

                    {notification.data?.actionUrl ? (
                      <a
                        href={String(notification.data.actionUrl)}
                        className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Voir les détails →
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      title="Marquer comme lu"
                    >
                      ✓
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && !loading && (
        <div className="text-center">
          <button
            onClick={() => loadNotifications()}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
          >
            Charger plus
          </button>
        </div>
      )}

      {loading && notifications.length > 0 && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
}