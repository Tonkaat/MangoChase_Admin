import { useState, useEffect, useCallback } from 'react';
import type { Notification, NotificationFilters, NotificationStats } from '@/types/notification.types';

const generateMockNotifications = (): Notification[] => {
  return [
    {
      id: 'n1',
      type: 'disease_alert',
      title: 'Critical Disease Alert',
      message: 'Anthracnose outbreak detected in North Orchard. Immediate action required.',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false,
      priority: 'urgent',
      actionUrl: '/journal',
      actionLabel: 'View Details',
      metadata: { farmId: 'f1' },
    },
    {
      id: 'n2',
      type: 'task_reminder',
      title: 'Task Due Today',
      message: 'Fertilizer application for South Orchard is scheduled for today.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
      priority: 'high',
      actionUrl: '/scheduling',
      actionLabel: 'View Task',
    },
    {
      id: 'n3',
      type: 'verification_update',
      title: 'Farmer Verification Approved',
      message: 'Juan dela Cruz has been verified as a Trusted farmer.',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isRead: true,
      priority: 'medium',
      actionUrl: '/users',
      actionLabel: 'View Profile',
      metadata: { userId: 'u2' },
    },
    {
      id: 'n4',
      type: 'trade_listing',
      title: 'New Trade Listing',
      message: 'Maria Santos posted 200kg Carabao mangoes available for sale.',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: true,
      priority: 'low',
      actionUrl: '/board',
      actionLabel: 'View Listing',
    },
    {
      id: 'n5',
      type: 'market_price',
      title: 'Price Update',
      message: 'Carabao mango prices increased by 15% in Central Luzon region.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isRead: false,
      priority: 'medium',
      actionUrl: '/board',
      actionLabel: 'View Prices',
    },
    {
      id: 'n6',
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isRead: true,
      priority: 'low',
    },
    {
      id: 'n7',
      type: 'mention',
      title: 'You were mentioned',
      message: 'Pedro Reyes mentioned you in a community post about pest control.',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      isRead: true,
      priority: 'medium',
      actionUrl: '/board',
      actionLabel: 'View Post',
    },
  ];
};

export function useNotifications(filters?: NotificationFilters) {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, urgent: 0 });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    let data = generateMockNotifications();

    if (filters?.type) {
      data = data.filter((n) => n.type === filters.type);
    }
    if (filters?.isRead !== undefined) {
      data = data.filter((n) => n.isRead === filters.isRead);
    }
    if (filters?.priority) {
      data = data.filter((n) => n.priority === filters.priority);
    }

    setNotifications(data);
    setStats({
      total: data.length,
      unread: data.filter((n) => !n.isRead).length,
      urgent: data.filter((n) => n.priority === 'urgent' && !n.isRead).length,
    });
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date() } : n))
    );
    setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
  };

  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
    );
    setStats((prev) => ({ ...prev, unread: 0, urgent: 0 }));
  };

  const deleteNotification = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notification && !notification.isRead) {
      setStats((prev) => ({
        ...prev,
        total: prev.total - 1,
        unread: prev.unread - 1,
        urgent: notification.priority === 'urgent' ? prev.urgent - 1 : prev.urgent,
      }));
    } else {
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    }
  };

  return {
    loading,
    notifications,
    stats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
