// src/services/notificationService.ts
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
  MessagePayload,
} from 'firebase/messaging';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  Unsubscribe,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { WeatherData, AlertType } from '@/types/weather.types';

// Notification types
export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  timestamp: Timestamp;
}

export interface NotificationAlert {
  type: AlertType;
  icon: string;
  message: string;
  severity: string;
  action: string;
}

class NotificationService {
  private static instance: NotificationService;
  private messaging: Messaging | null = null;
  private initialized = false;
  private unsubscribeMessage: (() => void) | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing Web Push Notifications...');

      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return;
      }

      // Initialize Firebase Messaging
      this.messaging = getMessaging();

      // Request permission
      await this.requestPermission();

      // Set up foreground message handler
      this.setupForegroundMessageHandler();

      // Save FCM token
      await this.saveFCMToken();

      this.initialized = true;
      console.log('Web Push Notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing notifications:', error);
      this.initialized = false;
    }
  }

  private async requestPermission(): Promise<void> {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);

      if (permission === 'granted') {
        console.log('Notification permission granted');
      } else {
        console.warn('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  private setupForegroundMessageHandler(): void {
    if (!this.messaging) return;

    this.unsubscribeMessage = onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);
      this.handleForegroundMessage(payload);
    });
  }

  private handleForegroundMessage(payload: MessagePayload): void {
    const { notification, data } = payload;

    if (notification) {
      this.showBrowserNotification(
        notification.title || 'Farm Notification',
        notification.body || 'New update from your farm',
        data
      );
    }
  }

  private showBrowserNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): void {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        tag: data?.type || 'farm-notification',
        requireInteraction: false,
        data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Handle notification click navigation if needed
        if (data?.type) {
          console.log('Notification clicked:', data);
        }
      };
    }
  }

  private async saveFCMToken(token?: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.log('No user logged in, skipping FCM token save');
        return;
      }

      if (!token && this.messaging) {
        token = await getToken(this.messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
      }

      if (!token) {
        console.log('Failed to get FCM token');
        return;
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp(),
      });

      console.log('FCM token saved for user:', userId);
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  // Save notification to Firestore
  async saveNotification({
    farmId,
    type,
    title,
    body,
    data = {},
  }: {
    farmId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await addDoc(collection(db, 'farms', farmId, 'notifications'), {
        userId,
        type,
        title,
        body,
        data,
        read: false,
        timestamp: serverTimestamp(),
      });

      // Show browser notification immediately
      this.showBrowserNotification(title, body, { ...data, type });
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  // Get notifications stream
  subscribeToNotifications(
    farmId: string,
    callback: (notifications: NotificationData[]) => void
  ): Unsubscribe {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return () => {};
    }

    const q = query(
      collection(db, 'farms', farmId, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
      callback(notifications);
    });
  }

  // Mark notification as read
  async markAsRead(farmId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(
        db,
        'farms',
        farmId,
        'notifications',
        notificationId
      );
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all as read
  async markAllAsRead(farmId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const q = query(
        collection(db, 'farms', farmId, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((document) => {
        batch.update(document.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  // Delete notification
  async deleteNotification(
    farmId: string,
    notificationId: string
  ): Promise<void> {
    try {
      await deleteDoc(
        doc(db, 'farms', farmId, 'notifications', notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  // Clear all notifications
  async clearAllNotifications(farmId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const q = query(
        collection(db, 'farms', farmId, 'notifications'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get unread count stream
  subscribeToUnreadCount(
    farmId: string,
    callback: (count: number) => void
  ): Unsubscribe {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      callback(0);
      return () => {};
    }

    const q = query(
      collection(db, 'farms', farmId, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.length);
    });
  }

  // Send notification to farm users
  async sendNotificationToFarmUsers({
    farmId,
    type,
    title,
    body,
    data = {},
    excludeUserId,
  }: {
    farmId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    excludeUserId?: string;
  }): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      const farmDoc = await getDocs(
        query(collection(db, 'farms'), where('__name__', '==', farmId), limit(1))
      );

      if (farmDoc.empty) return;

      const farmData = farmDoc.docs[0].data();
      const members = (farmData.members as string[]) || [];

      const batch = writeBatch(db);

      // Save to Firestore for all members
      members.forEach((memberId) => {
        if (memberId === excludeUserId) return;

        const notifRef = doc(collection(db, 'farms', farmId, 'notifications'));
        batch.set(notifRef, {
          userId: memberId,
          type,
          title,
          body,
          data,
          read: false,
          timestamp: serverTimestamp(),
        });
      });

      await batch.commit();

      // Show local notification for current user
      if (
        currentUserId &&
        currentUserId !== excludeUserId &&
        members.includes(currentUserId)
      ) {
        this.showBrowserNotification(title, body, { ...data, type });
      }

      // Send FCM for other devices/users
      await this.sendFCMNotification(members, title, body, data, excludeUserId);
    } catch (error) {
      console.error('Error sending notification to farm users:', error);
    }
  }

  private async sendFCMNotification(
    userIds: string[],
    title: string,
    body: string,
    data: Record<string, any>,
    excludeUserId?: string
  ): Promise<void> {
    try {
      for (const userId of userIds) {
        if (userId === excludeUserId) continue;

        const userDoc = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', userId), limit(1))
        );

        if (userDoc.empty) continue;

        const fcmToken = userDoc.docs[0].data().fcmToken as string | undefined;

        if (fcmToken) {
          await addDoc(collection(db, 'fcmQueue'), {
            token: fcmToken,
            title,
            body,
            data,
            timestamp: serverTimestamp(),
            processed: false,
          });
        }
      }
    } catch (error) {
      console.error('Error sending FCM notification:', error);
    }
  }

  // Check if notification was recently sent (prevent duplicates)
  private async wasNotificationRecentlySent(
    farmId: string,
    type: string,
    within: number // milliseconds
  ): Promise<boolean> {
    try {
      const cutoffTime = Timestamp.fromDate(new Date(Date.now() - within));

      const q = query(
        collection(db, 'farms', farmId, 'notifications'),
        where('type', '==', type),
        where('timestamp', '>', cutoffTime),
        limit(1)
      );

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking recent notifications:', error);
      return false;
    }
  }

  // Schedule smart notifications
  async scheduleSmartNotifications(farmId: string): Promise<void> {
    await Promise.all([
      this.scheduleWateringReminders(farmId),
      this.scheduleFertilizationReminders(farmId),
      this.scheduleHarvestReminders(farmId),
      this.scheduleInspectionReminders(farmId),
    ]);
  }

  private async scheduleWateringReminders(farmId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'schedules'),
        where('type', '==', 'watering'),
        where('completed', '==', false)
      );

      const snapshot = await getDocs(q);

      for (const document of snapshot.docs) {
        const data = document.data();
        const scheduledDate = (data.scheduledDate as Timestamp).toDate();
        const now = new Date();

        if (scheduledDate > now) {
          const difference = scheduledDate.getTime() - now.getTime();
          const daysDiff = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hoursDiff = Math.floor(difference / (1000 * 60 * 60));

          if (daysDiff === 1 && hoursDiff <= 24) {
            const notifType = `schedule_reminder_${document.id}_1day`;
            if (
              await this.wasNotificationRecentlySent(
                farmId,
                notifType,
                12 * 60 * 60 * 1000
              )
            ) {
              continue;
            }

            await this.saveNotification({
              farmId,
              type: notifType,
              title: 'Watering Reminder - Tomorrow',
              body: 'Watering scheduled for tomorrow. Check your tasks.',
              data: {
                scheduleId: document.id,
                type: 'watering',
                scheduledDate: scheduledDate.toString(),
              },
            });
          } else if (hoursDiff <= 2) {
            const notifType = `schedule_reminder_${document.id}_today`;
            if (
              await this.wasNotificationRecentlySent(
                farmId,
                notifType,
                6 * 60 * 60 * 1000
              )
            ) {
              continue;
            }

            await this.saveNotification({
              farmId,
              type: notifType,
              title: 'Watering Due Today',
              body: "Watering is scheduled for today. Don't forget!",
              data: {
                scheduleId: document.id,
                type: 'watering',
                scheduledDate: scheduledDate.toString(),
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling watering reminders:', error);
    }
  }

  private async scheduleFertilizationReminders(farmId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'schedules'),
        where('type', '==', 'fertilization'),
        where('completed', '==', false)
      );

      const snapshot = await getDocs(q);

      for (const document of snapshot.docs) {
        const data = document.data();
        const scheduledDate = (data.scheduledDate as Timestamp).toDate();
        const now = new Date();

        if (scheduledDate > now) {
          const difference = scheduledDate.getTime() - now.getTime();
          const daysDiff = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hoursDiff = Math.floor(difference / (1000 * 60 * 60));

          if (daysDiff === 1 && hoursDiff <= 24) {
            const notifType = `fertilization_reminder_${document.id}`;
            if (
              await this.wasNotificationRecentlySent(
                farmId,
                notifType,
                12 * 60 * 60 * 1000
              )
            ) {
              continue;
            }

            await this.saveNotification({
              farmId,
              type: notifType,
              title: 'Fertilization Reminder - Tomorrow',
              body: 'Fertilization scheduled for tomorrow.',
              data: {
                scheduleId: document.id,
                type: 'fertilization',
                scheduledDate: scheduledDate.toString(),
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling fertilization reminders:', error);
    }
  }

  private async scheduleHarvestReminders(farmId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'trees'),
        where('harvestDate', '>', Timestamp.now())
      );

      const snapshot = await getDocs(q);

      for (const document of snapshot.docs) {
        const data = document.data();
        const harvestDate = (data.harvestDate as Timestamp).toDate();
        const now = new Date();

        if (harvestDate > now) {
          const difference = harvestDate.getTime() - now.getTime();
          const daysDiff = Math.floor(difference / (1000 * 60 * 60 * 24));
          const treeName = data.name || 'Unknown Tree';

          if (daysDiff <= 7 && daysDiff > 0) {
            const notifType = `harvest_reminder_${document.id}_${daysDiff}days`;
            if (
              await this.wasNotificationRecentlySent(
                farmId,
                notifType,
                24 * 60 * 60 * 1000
              )
            ) {
              continue;
            }

            await this.saveNotification({
              farmId,
              type: notifType,
              title: 'Harvest Approaching',
              body: `${treeName} is ready for harvest in ${daysDiff} days`,
              data: {
                treeId: document.id,
                treeName,
                harvestDate: harvestDate.toString(),
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling harvest reminders:', error);
    }
  }

  private async scheduleInspectionReminders(farmId: string): Promise<void> {
    try {
      // Check if reminder was sent in last 6 days
      if (
        await this.wasNotificationRecentlySent(
          farmId,
          'inspection_reminder',
          6 * 24 * 60 * 60 * 1000
        )
      ) {
        return;
      }

      const q = query(
        collection(db, 'farms', farmId, 'inspections'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      const now = new Date();

      if (snapshot.empty) {
        await this.saveNotification({
          farmId,
          type: 'inspection_reminder',
          title: 'Regular Inspection Due',
          body: "It's time for your weekly farm inspection",
          data: { reminderType: 'weekly_inspection' },
        });
      } else {
        const lastInspection = (
          snapshot.docs[0].data().timestamp as Timestamp
        ).toDate();
        const daysSince = Math.floor(
          (now.getTime() - lastInspection.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSince >= 7) {
          await this.saveNotification({
            farmId,
            type: 'inspection_reminder',
            title: 'Regular Inspection Due',
            body: "It's time for your weekly farm inspection",
            data: { reminderType: 'weekly_inspection' },
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling inspection reminders:', error);
    }
  }

  // Weather-based notifications
  async checkWeatherNotifications(
    farmId: string,
    weather: WeatherData
  ): Promise<void> {
    const current = weather.current;

    // Temperature alerts
    if (current.temp_c > 35) {
      if (
        !(await this.wasNotificationRecentlySent(
          farmId,
          'weather_alert_heat',
          6 * 60 * 60 * 1000
        ))
      ) {
        await this.saveNotification({
          farmId,
          type: 'weather_alert_heat',
          title: '🌡️ Hot Weather Alert',
          body: `High temperature (${current.temp_c.toFixed(
            1
          )}°C) detected. Consider extra watering for mango trees.`,
          data: {
            temperature: current.temp_c,
            alertType: 'heat',
            severity: 'warning',
          },
        });
      }
    }

    if (current.temp_c < 15) {
      if (
        !(await this.wasNotificationRecentlySent(
          farmId,
          'weather_alert_cold',
          6 * 60 * 60 * 1000
        ))
      ) {
        await this.saveNotification({
          farmId,
          type: 'weather_alert_cold',
          title: '🥶 Cold Weather Alert',
          body: `Low temperature (${current.temp_c.toFixed(
            1
          )}°C) may affect mango flowering. Protect young trees.`,
          data: {
            temperature: current.temp_c,
            alertType: 'cold',
            severity: 'warning',
          },
        });
      }
    }

    // Rain alerts
    if (current.precip_mm > 10.0) {
      if (
        !(await this.wasNotificationRecentlySent(
          farmId,
          'weather_alert_heavy_rain',
          3 * 60 * 60 * 1000
        ))
      ) {
        await this.saveNotification({
          farmId,
          type: 'weather_alert_heavy_rain',
          title: '🌧️ Heavy Rain Alert',
          body: `Heavy rainfall (${current.precip_mm}mm) detected. Check drainage systems and skip irrigation.`,
          data: {
            rainfall: current.precip_mm,
            alertType: 'heavy_rain',
            severity: 'info',
          },
        });
      }
    }

    // Humidity alerts
    if (current.humidity > 80) {
      if (
        !(await this.wasNotificationRecentlySent(
          farmId,
          'weather_alert_humidity',
          6 * 60 * 60 * 1000
        ))
      ) {
        await this.saveNotification({
          farmId,
          type: 'weather_alert_humidity',
          title: '💧 High Humidity Alert',
          body: `High humidity (${current.humidity}%) increases risk of fungal diseases. Monitor trees closely.`,
          data: {
            humidity: current.humidity,
            alertType: 'humidity',
            severity: 'warning',
          },
        });
      }
    }

    // Wind alerts
    if (current.wind_kph > 25.0) {
      if (
        !(await this.wasNotificationRecentlySent(
          farmId,
          'weather_alert_wind',
          3 * 60 * 60 * 1000
        ))
      ) {
        await this.saveNotification({
          farmId,
          type: 'weather_alert_wind',
          title: '💨 Strong Wind Alert',
          body: `Strong winds (${current.wind_kph} km/h) may cause flower and fruit drop. Secure young trees.`,
          data: {
            windSpeed: current.wind_kph,
            alertType: 'wind',
            severity: 'warning',
          },
        });
      }
    }

    // Ideal conditions
    if (
      current.temp_c >= 20.0 &&
      current.temp_c <= 32.0 &&
      current.humidity >= 60 &&
      current.humidity <= 80 &&
      current.precip_mm < 5.0
    ) {
      if (
        !(await this.wasNotificationRecentlySent(
          farmId,
          'weather_ideal',
          24 * 60 * 60 * 1000
        ))
      ) {
        await this.saveNotification({
          farmId,
          type: 'weather_ideal',
          title: '✅ Perfect Mango Weather',
          body: `Ideal conditions for mango growth! Temperature: ${current.temp_c.toFixed(
            1
          )}°C, Humidity: ${current.humidity}%`,
          data: {
            temperature: current.temp_c,
            humidity: current.humidity,
            alertType: 'ideal_conditions',
            severity: 'info',
          },
        });
      }
    }
  }

  // Manual notification triggers
  async notifyScheduleCreated(
    farmId: string,
    schedule: Record<string, any>
  ): Promise<void> {
    await this.saveNotification({
      farmId,
      type: 'schedule_created',
      title: 'New Schedule Added',
      body: `${schedule.type} scheduled for ${schedule.scheduledDate}`,
      data: schedule,
    });
  }

  async notifyJournalEntryAdded(
    farmId: string,
    journal: Record<string, any>
  ): Promise<void> {
    await this.saveNotification({
      farmId,
      type: 'journal_added',
      title: 'New Journal Entry',
      body: `Journal entry added for ${journal.treeName || 'your farm'}`,
      data: journal,
    });
  }

  async notifyTaskCompleted(
    farmId: string,
    taskType: string,
    details: string
  ): Promise<void> {
    await this.saveNotification({
      farmId,
      type: 'task_completed',
      title: 'Task Completed',
      body: `${taskType} completed: ${details}`,
      data: {
        taskType,
        details,
      },
    });
  }

  // Test notification
  async sendTestNotification(farmId: string): Promise<void> {
    await this.saveNotification({
      farmId,
      type: 'test',
      title: '🔔 Test Notification',
      body: 'This is a test notification from your web app!',
      data: { test: true, timestamp: new Date().toString() },
    });
  }

  // Cleanup
  destroy(): void {
    if (this.unsubscribeMessage) {
      this.unsubscribeMessage();
      this.unsubscribeMessage = null;
    }
    this.initialized = false;
  }
}

// Export both the class and singleton for flexibility
export { NotificationService };
export const notificationService = NotificationService.getInstance();
export default notificationService;