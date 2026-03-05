
import React, { createContext, useContext, useEffect, useState } from 'react';
 
import { useAuth } from '@/hooks/useAuth';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationContextType {
  notifications: Announcement[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Announcement[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem('notificationsEnabled');
    return stored ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    if (user && notificationsEnabled) {
      loadNotifications();
    }
  }, [user, notificationsEnabled]);

  const loadNotifications = async () => {
    if (!user) return;

    setNotifications([]);
  };

  const markAsRead = async (announcementId: string) => {
    if (!user) return;

    setNotifications(prev =>
      prev.map(notif =>
        notif.id === announcementId ? { ...notif, is_read: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;

    setNotifications(prev =>
      prev.map(notif => ({ ...notif, is_read: true }))
    );
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: loadNotifications,
        notificationsEnabled,
        toggleNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
