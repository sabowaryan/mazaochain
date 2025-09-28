"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationService, NotificationType, NotificationChannel } from '@/lib/services/notification';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  channels: {
    [key in NotificationType]: NotificationChannel[];
  };
}

const notificationTypes: { key: NotificationType; label: string; description: string }[] = [
  {
    key: 'registration_pending',
    label: 'Inscription en attente',
    description: 'Quand votre inscription est en cours de validation'
  },
  {
    key: 'registration_approved',
    label: 'Inscription approuvée',
    description: 'Quand votre inscription est approuvée'
  },
  {
    key: 'registration_rejected',
    label: 'Inscription rejetée',
    description: 'Quand votre inscription est rejetée'
  },
  {
    key: 'evaluation_submitted',
    label: 'Évaluation soumise',
    description: 'Quand une évaluation de culture est soumise'
  },
  {
    key: 'evaluation_approved',
    label: 'Évaluation approuvée',
    description: 'Quand votre évaluation de culture est approuvée'
  },
  {
    key: 'evaluation_rejected',
    label: 'Évaluation rejetée',
    description: 'Quand votre évaluation de culture est rejetée'
  },
  {
    key: 'loan_requested',
    label: 'Demande de prêt',
    description: 'Quand une demande de prêt est soumise'
  },
  {
    key: 'loan_approved',
    label: 'Prêt approuvé',
    description: 'Quand votre demande de prêt est approuvée'
  },
  {
    key: 'loan_rejected',
    label: 'Prêt rejeté',
    description: 'Quand votre demande de prêt est rejetée'
  },
  {
    key: 'loan_disbursed',
    label: 'Prêt décaissé',
    description: 'Quand les fonds du prêt sont transférés'
  },
  {
    key: 'repayment_due',
    label: 'Remboursement dû',
    description: 'Rappel de remboursement à venir'
  },
  {
    key: 'repayment_overdue',
    label: 'Remboursement en retard',
    description: 'Quand un remboursement est en retard'
  },
  {
    key: 'repayment_completed',
    label: 'Remboursement terminé',
    description: 'Quand un prêt est entièrement remboursé'
  },
  {
    key: 'collateral_released',
    label: 'Garantie libérée',
    description: 'Quand vos tokens de garantie sont libérés'
  },
  {
    key: 'system_maintenance',
    label: 'Maintenance système',
    description: 'Notifications de maintenance de la plateforme'
  },
  {
    key: 'security_alert',
    label: 'Alerte sécurité',
    description: 'Alertes de sécurité importantes'
  }
];

export function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await notificationService.getUserPreferences(user!.id);
      
      if (prefs) {
        setPreferences(prefs);
      } else {
        // Create default preferences
        const defaultPrefs: NotificationPreferences = {
          userId: user!.id,
          emailEnabled: true,
          smsEnabled: false,
          inAppEnabled: true,
          channels: {
            registration_pending: ['in_app', 'email'],
            registration_approved: ['in_app', 'email'],
            registration_rejected: ['in_app', 'email'],
            evaluation_submitted: ['in_app'],
            evaluation_approved: ['in_app', 'email'],
            evaluation_rejected: ['in_app', 'email'],
            loan_requested: ['in_app'],
            loan_approved: ['in_app', 'email', 'sms'],
            loan_rejected: ['in_app', 'email'],
            loan_disbursed: ['in_app', 'email', 'sms'],
            repayment_due: ['in_app', 'email', 'sms'],
            repayment_overdue: ['in_app', 'email', 'sms'],
            repayment_completed: ['in_app', 'email'],
            collateral_released: ['in_app', 'email'],
            system_maintenance: ['in_app', 'email'],
            security_alert: ['in_app', 'email', 'sms'],
            price_update: ['in_app', 'email']
          }
        };
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [loadPreferences, user]);

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      await notificationService.updateUserPreferences(preferences);
      alert('Préférences sauvegardées avec succès');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Erreur lors de la sauvegarde des préférences');
    } finally {
      setSaving(false);
    }
  };

  const toggleGlobalChannel = (channel: NotificationChannel, enabled: boolean) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences };
    
    switch (channel) {
      case 'email':
        updatedPreferences.emailEnabled = enabled;
        break;
      case 'sms':
        updatedPreferences.smsEnabled = enabled;
        break;
      case 'in_app':
        updatedPreferences.inAppEnabled = enabled;
        break;
    }

    // If disabling globally, remove from all notification types
    if (!enabled) {
      Object.keys(updatedPreferences.channels).forEach(type => {
        updatedPreferences.channels[type as NotificationType] = 
          updatedPreferences.channels[type as NotificationType].filter(c => c !== channel);
      });
    }

    setPreferences(updatedPreferences);
  };

  const toggleNotificationChannel = (notificationType: NotificationType, channel: NotificationChannel) => {
    if (!preferences) return;

    const currentChannels = preferences.channels[notificationType] || [];
    const hasChannel = currentChannels.includes(channel);

    const updatedChannels = hasChannel
      ? currentChannels.filter(c => c !== channel)
      : [...currentChannels, channel];

    setPreferences({
      ...preferences,
      channels: {
        ...preferences.channels,
        [notificationType]: updatedChannels
      }
    });
  };

  const isChannelEnabled = (notificationType: NotificationType, channel: NotificationChannel): boolean => {
    if (!preferences) return false;
    
    // Check if channel is globally enabled
    switch (channel) {
      case 'email':
        if (!preferences.emailEnabled) return false;
        break;
      case 'sms':
        if (!preferences.smsEnabled) return false;
        break;
      case 'in_app':
        if (!preferences.inAppEnabled) return false;
        break;
    }

    return preferences.channels[notificationType]?.includes(channel) || false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Impossible de charger les préférences</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Préférences de notification
        </h2>
        <p className="text-gray-600">
          Configurez comment vous souhaitez recevoir les notifications
        </p>
      </div>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informations de contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+243 XXX XXX XXX"
            />
          </div>
        </div>
      </Card>

      {/* Global Channel Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Canaux de notification</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Notifications dans l'application</h4>
              <p className="text-sm text-gray-600">Recevoir des notifications dans l'interface</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={(e) => toggleGlobalChannel('in_app', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Notifications par email</h4>
              <p className="text-sm text-gray-600">Recevoir des emails de notification</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={(e) => toggleGlobalChannel('email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Notifications par SMS</h4>
              <p className="text-sm text-gray-600">Recevoir des SMS pour les notifications critiques</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.smsEnabled}
                onChange={(e) => toggleGlobalChannel('sms', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Detailed Notification Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Types de notifications</h3>
        <div className="space-y-6">
          {notificationTypes.map((notif) => (
            <div key={notif.key} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="mb-3">
                <h4 className="font-medium text-gray-900">{notif.label}</h4>
                <p className="text-sm text-gray-600">{notif.description}</p>
              </div>
              
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isChannelEnabled(notif.key, 'in_app')}
                    onChange={() => toggleNotificationChannel(notif.key, 'in_app')}
                    disabled={!preferences.inAppEnabled}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">App</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isChannelEnabled(notif.key, 'email')}
                    onChange={() => toggleNotificationChannel(notif.key, 'email')}
                    disabled={!preferences.emailEnabled}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Email</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isChannelEnabled(notif.key, 'sms')}
                    onChange={() => toggleNotificationChannel(notif.key, 'sms')}
                    disabled={!preferences.smsEnabled}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">SMS</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
        </button>
      </div>
    </div>
  );
}