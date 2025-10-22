"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useHapticFeedback } from "@/components/ui/HapticFeedback";
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid';

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  if (!user) return null;

  const handleToggleDropdown = () => {
    triggerHaptic('light');
    setShowDropdown(!showDropdown);
  };

  const handleMarkAsRead = (id: string) => {
    triggerHaptic('light');
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    triggerHaptic('medium');
    markAllAsRead();
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="w-5 h-5 text-emerald-600" />
        ) : (
          <BellIcon className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200/50 backdrop-blur-sm z-50">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BellIconSolid className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  Tout lire
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 font-medium">Aucune notification</p>
                <p className="text-xs text-gray-400 mt-1">
                  Les notifications apparaîtront ici
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-emerald-50 cursor-pointer transition-colors group ${!notification.is_read ? "bg-emerald-50/50 border-l-4 border-l-emerald-500" : ""
                    }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-sm font-medium truncate ${!notification.is_read ? "text-emerald-900" : "text-gray-900"
                          }`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <ClockIcon className="w-3 h-3" />
                        <span>
                          {notification.created_at &&
                            new Date(notification.created_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-emerald-600 transition-all"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-100">
            <Link
              href="/dashboard/notifications"
              className="block w-full text-center text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 py-2 px-4 font-medium rounded-lg transition-colors"
              onClick={() => {
                triggerHaptic('light');
                setShowDropdown(false);
              }}
            >
              Voir toutes les notifications →
            </Link>
          </div>
        </div>
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
