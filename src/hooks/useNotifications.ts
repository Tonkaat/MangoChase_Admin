// src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';
import { useFarm } from '@/providers/farm-provider';

export function useNotifications() {
  const { selectedFarmId } = useFarm();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Initialize notification service
    const initNotifications = async () => {
      try {
        await notificationService.initialize();
        console.log('✅ Notification service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
      }
    };

    initNotifications();

    return () => {
      notificationService.destroy();
    };
  }, []);

  useEffect(() => {
    if (!selectedFarmId) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    // Subscribe to notifications
    const unsubscribeNotifications = notificationService.subscribeToNotifications(
      selectedFarmId,
      (notifs) => {
        setNotifications(notifs);
      }
    );

    // Subscribe to unread count
    const unsubscribeCount = notificationService.subscribeToUnreadCount(
      selectedFarmId,
      (count) => {
        setUnreadCount(count);
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeCount();
    };
  }, [selectedFarmId]);

  const markAsRead = async (notificationId: string) => {
    if (!selectedFarmId) return;
    await notificationService.markAsRead(selectedFarmId, notificationId);
  };

  const markAllAsRead = async () => {
    if (!selectedFarmId) return;
    await notificationService.markAllAsRead(selectedFarmId);
  };

  const deleteNotification = async (notificationId: string) => {
    if (!selectedFarmId) return;
    await notificationService.deleteNotification(selectedFarmId, notificationId);
  };

  const clearAll = async () => {
    if (!selectedFarmId) return;
    await notificationService.clearAllNotifications(selectedFarmId);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}