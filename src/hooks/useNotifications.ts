// src/hooks/useNotifications.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  db,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from '@/services/firebase/firebaseConfig';
import { firebaseService } from '@/services/firebase';
import { initScanNotificationListener } from '@/services/firebase/scanNotificationService';
import { toast } from 'sonner';
import type { Notification, NotificationStats } from '@/types/notification.types';

const MAX_NOTIFICATIONS = 100;

function docToNotification(id: string, data: Record<string, any>): Notification {
  return {
    id,
    type: data.type ?? 'system',
    title: data.title ?? '(no title)',
    message: data.message ?? '',
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    readAt: data.readAt?.toDate?.() ?? undefined,
    isRead: data.isRead ?? false,
    priority: data.priority ?? 'low',
    actionUrl: data.actionUrl ?? undefined,
    actionLabel: data.actionLabel ?? undefined,
    metadata: data.metadata ?? undefined,
  };
}

export function useNotifications() {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scanListenerUnsubscribe = useRef<(() => void) | null>(null);

  // ── 1. Resolve farmId ────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function resolveFarm() {
      try {
        let id = await firebaseService.getCurrentUserFarmId?.();
        if (!id) {
          const user = firebaseService.getCurrentUser?.();
          if (user) {
            const farms = await firebaseService.getUserFarms?.(user.uid);
            if (farms?.length) id = farms[0].farmId;
          }
        }
        if (mounted && id) {
          setFarmId(id);
          // Debug: Check scan field
          const { debugScanField } = await import('@/services/firebase/scanNotificationService');
          debugScanField(id);
        }
      } catch (err) {
        console.error('useNotifications: could not resolve farmId', err);
      }
    }

    resolveFarm();
    return () => { mounted = false; };
  }, []);

  // ── 2. Real-time notification listener ──────────────────────────────────
  useEffect(() => {
    if (!farmId) return;

    setLoading(true);

    const q = query(
      collection(db, 'farms', farmId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(MAX_NOTIFICATIONS),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) =>
          docToNotification(d.id, d.data() as Record<string, any>),
        );
        setNotifications(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useNotifications snapshot error:', err);
        setError('Failed to load notifications');
        setLoading(false);
      },
    );

    // ── 3. Start scan notification listener ──────────────────────────────
    // This will create notifications from scans in real-time
    const scanUnsub = initScanNotificationListener(
      farmId,
      (notificationId, disease, treeName) => {
        // Show toast when a new scan notification is created
        toast.success(
          disease.toLowerCase() === 'healthy' 
            ? `✅ Healthy scan for ${treeName}`
            : `🚨 Disease detected on ${treeName}`,
          {
            description: `New scan notification created`,
            action: {
              label: 'View',
              onClick: () => {
                // Navigate to notifications
                window.location.href = '/notifications';
              },
            },
          }
        );
      }
    );

    scanListenerUnsubscribe.current = scanUnsub;

    return () => {
      unsub();
      if (scanListenerUnsubscribe.current) {
        scanListenerUnsubscribe.current();
        scanListenerUnsubscribe.current = null;
      }
    };
  }, [farmId]);

  // ── 4. Computed stats ────────────────────────────────────────────────────
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.isRead).length,
    urgent: notifications.filter((n) => n.priority === 'urgent' && !n.isRead).length,
  };

  // ── 5. Actions ───────────────────────────────────────────────────────────
  const markAsRead = useCallback(
    async (id: string) => {
      if (!farmId) return;
      await updateDoc(doc(db, 'farms', farmId, 'notifications', id), {
        isRead: true,
        readAt: serverTimestamp(),
      });
    },
    [farmId],
  );

  const markAllAsRead = useCallback(async () => {
    if (!farmId) return;
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;

    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, 'farms', farmId, 'notifications', n.id), {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }, [farmId, notifications]);

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!farmId) return;
      await deleteDoc(doc(db, 'farms', farmId, 'notifications', id));
    },
    [farmId],
  );

  return {
    loading,
    error,
    notifications,
    stats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}