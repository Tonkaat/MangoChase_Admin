// // src/services/notificationService.ts
// import * as admin from 'firebase-admin';
// import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// if (!admin.apps.length) {
//   admin.initializeApp();
// }

// // Types matching your Flutter code
// interface WeatherData {
//   current: {
//     tempC: number;
//     precipMm: number;
//     humidity: number;
//     windKph: number;
//   };
// }

// enum AlertType {
//   hot = 'hot',
//   cold = 'cold',
//   rain = 'rain',
//   humidity = 'humidity',
//   wind = 'wind',
//   uv = 'uv',
//   ideal = 'ideal'
// }

// interface Alert {
//   type: AlertType;
//   message: string;
//   icon: string;
//   severity: string;
//   action: string;
// }

// export class NotificationService {
//   private static instance: NotificationService;
//   private messaging: admin.messaging.Messaging;
//   private firestore: admin.firestore.Firestore;

//   private constructor() {
//     this.messaging = admin.messaging();
//     this.firestore = admin.firestore();
//   }

//   static getInstance(): NotificationService {
//     if (!NotificationService.instance) {
//       NotificationService.instance = new NotificationService();
//     }
//     return NotificationService.instance;
//   }

//   // 🔔 Save notification to Firestore and optionally send push
//   async saveNotification(params: {
//     farmId: string;
//     userId: string;
//     type: string;
//     title: string;
//     body: string;
//     data?: Record<string, any>;
//     sendPushNotification?: boolean;
//   }): Promise<string> {
//     const { farmId, userId, type, title, body, data, sendPushNotification = true } = params;

//     try {
//       // Save to Firestore
//       const notificationRef = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('notifications')
//         .add({
//           userId,
//           type,
//           title,
//           body,
//           data: data || {},
//           read: false,
//           timestamp: FieldValue.serverTimestamp(),
//         });

//       console.log(`📝 Notification saved: ${notificationRef.id} for user ${userId}`);

//       // Send push notification if requested
//       if (sendPushNotification) {
//         await this.sendPushNotificationToUser(userId, title, body, { ...data, type, notificationId: notificationRef.id });
//       }

//       return notificationRef.id;
//     } catch (error) {
//       console.error('❌ Error saving notification:', error);
//       throw error;
//     }
//   }

//   // 📱 Send push notification to specific user
//   async sendPushNotificationToUser(
//     userId: string,
//     title: string,
//     body: string,
//     data?: Record<string, any>
//   ): Promise<void> {
//     try {
//       // Get user's FCM token
//       const userDoc = await this.firestore.collection('users').doc(userId).get();
//       const userData = userDoc.data();
//       const fcmToken = userData?.fcmToken;

//       if (!fcmToken) {
//         console.log(`⚠️ No FCM token found for user ${userId}`);
//         return;
//       }

//       const message: admin.messaging.Message = {
//         token: fcmToken,
//         notification: {
//           title,
//           body,
//         },
//         data: {
//           ...data,
//           click_action: 'FLUTTER_NOTIFICATION_CLICK',
//         },
//         android: {
//           priority: 'high',
//           notification: {
//             sound: 'mambo',
//             channelId: 'farm_notifications',
//           },
//         },
//         apns: {
//           payload: {
//             aps: {
//               sound: 'mambo.mp3',
//               badge: 1,
//             },
//           },
//         },
//       };

//       const response = await this.messaging.send(message);
//       console.log(`✅ Push notification sent to user ${userId}: ${response}`);
//     } catch (error) {
//       console.error(`❌ Error sending push to user ${userId}:`, error);
//     }
//   }

//   // 👥 Send notification to all farm members
//   async sendNotificationToFarmUsers(params: {
//     farmId: string;
//     type: string;
//     title: string;
//     body: string;
//     data?: Record<string, any>;
//     excludeUserId?: string;
//   }): Promise<void> {
//     const { farmId, type, title, body, data, excludeUserId } = params;

//     try {
//       // Get farm data and members
//       const farmDoc = await this.firestore.collection('farms').doc(farmId).get();
//       const farmData = farmDoc.data();
      
//       if (!farmData) {
//         console.log(`❌ Farm ${farmId} not found`);
//         return;
//       }

//       const members = farmData.members || [];
//       console.log(`📢 Sending notification to ${members.length} members in farm ${farmId}`);
      
//       const batch = this.firestore.batch();
      
//       // Save notification to Firestore for each member
//       for (const memberId of members) {
//         if (memberId === excludeUserId) continue;
        
//         const notificationRef = this.firestore
//           .collection('farms')
//           .doc(farmId)
//           .collection('notifications')
//           .doc();
        
//         batch.set(notificationRef, {
//           userId: memberId,
//           type,
//           title,
//           body,
//           data: data || {},
//           read: false,
//           timestamp: FieldValue.serverTimestamp(),
//         });

//         // Send push notification
//         await this.sendPushNotificationToUser(memberId, title, body, { 
//           ...data, 
//           type,
//           farmId 
//         });
//       }
      
//       await batch.commit();
//       console.log(`✅ Notifications sent to all farm members in ${farmId}`);

//     } catch (error) {
//       console.error('❌ Error sending notifications to farm users:', error);
//     }
//   }

//   // 📋 Get notifications for a user
//   async getNotifications(farmId: string, userId: string, options?: {
//     limit?: number;
//     unreadOnly?: boolean;
//   }): Promise<Array<Record<string, any>>> {
//     const limit = options?.limit || 50;
//     const unreadOnly = options?.unreadOnly || false;

//     try {
//       let query = this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('notifications')
//         .where('userId', '==', userId)
//         .orderBy('timestamp', 'desc')
//         .limit(limit);

//       if (unreadOnly) {
//         query = query.where('read', '==', false) as FirebaseFirestore.Query;
//       }

//       const snapshot = await query.get();
      
//       return snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//         timestamp: doc.data().timestamp?.toDate() || null,
//       }));
//     } catch (error) {
//       console.error('❌ Error getting notifications:', error);
//       return [];
//     }
//   }

//   // ✅ Mark notification as read
//   async markAsRead(farmId: string, notificationId: string): Promise<void> {
//     try {
//       await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('notifications')
//         .doc(notificationId)
//         .update({ read: true });
      
//       console.log(`✅ Notification ${notificationId} marked as read`);
//     } catch (error) {
//       console.error('❌ Error marking notification as read:', error);
//     }
//   }

//   // ✅✅ Mark all notifications as read for a user
//   async markAllAsRead(farmId: string, userId: string): Promise<void> {
//     try {
//       const notifications = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('notifications')
//         .where('userId', '==', userId)
//         .where('read', '==', false)
//         .get();

//       const batch = this.firestore.batch();
//       notifications.docs.forEach(doc => {
//         batch.update(doc.ref, { read: true });
//       });

//       await batch.commit();
//       console.log(`✅ Marked all notifications as read for user ${userId}`);
//     } catch (error) {
//       console.error('❌ Error marking all notifications as read:', error);
//     }
//   }

//   // 🗑️ Delete notification
//   async deleteNotification(farmId: string, notificationId: string): Promise<void> {
//     try {
//       await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('notifications')
//         .doc(notificationId)
//         .delete();
      
//       console.log(`🗑️ Notification ${notificationId} deleted`);
//     } catch (error) {
//       console.error('❌ Error deleting notification:', error);
//     }
//   }

//   // 🗑️🗑️ Clear all notifications for a user
//   async clearAllNotifications(farmId: string, userId: string): Promise<void> {
//     try {
//       const notifications = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('notifications')
//         .where('userId', '==', userId)
//         .get();

//       const batch = this.firestore.batch();
//       notifications.docs.forEach(doc => {
//         batch.delete(doc.ref);
//       });

//       await batch.commit();
//       console.log(`🗑️ Cleared all notifications for user ${userId}`);
//     } catch (error) {
//       console.error('❌ Error clearing notifications:', error);
//     }
//   }

//   // 🔢 Get unread count
//   async getUnreadCount(farmId: string, userId: string): Promise<number> {
//     try {
//       const snapshot = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('notifications')
//         .where('userId', '==', userId)
//         .where('read', '==', false)
//         .get();

//       return snapshot.size;
//     } catch (error) {
//       console.error('❌ Error getting unread count:', error);
//       return 0;
//     }
//   }

//   // ⏰ Check if notification was recently sent (duplicate prevention)
//   private async wasNotificationRecentlySent(
//     farmId: string,
//     type: string,
//     withinHours: number
//   ): Promise<boolean> {
//     try {
//       const cutoffTime = new Date();
//       cutoffTime.setHours(cutoffTime.getHours() - withinHours);
      
//       const recentNotifications = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('notifications')
//         .where('type', '==', type)
//         .where('timestamp', '>', Timestamp.fromDate(cutoffTime))
//         .limit(1)
//         .get();

//       return !recentNotifications.empty;
//     } catch (error) {
//       console.error('❌ Error checking recent notifications:', error);
//       return false;
//     }
//   }

//   // 🌦️ Weather-based notifications
//   async checkWeatherNotifications(
//     farmId: string,
//     weather: WeatherData,
//     userId: string
//   ): Promise<void> {
//     const current = weather.current;
    
//     // Temperature alerts - only once per 6 hours
//     if (current.tempC > 35) {
//       if (!await this.wasNotificationRecentlySent(farmId, 'weather_alert_heat', 6)) {
//         await this.saveNotification({
//           farmId,
//           userId,
//           type: 'weather_alert_heat',
//           title: '🌡️ Hot Weather Alert',
//           body: `High temperature (${current.tempC.toFixed(1)}°C) detected. Consider extra watering for mango trees.`,
//           data: {
//             temperature: current.tempC,
//             alertType: 'heat',
//             severity: 'warning',
//           },
//         });
//       }
//     }
    
//     // Cold temperature alert
//     if (current.tempC < 15) {
//       if (!await this.wasNotificationRecentlySent(farmId, 'weather_alert_cold', 6)) {
//         await this.saveNotification({
//           farmId,
//           userId,
//           type: 'weather_alert_cold',
//           title: '🥶 Cold Weather Alert',
//           body: `Low temperature (${current.tempC.toFixed(1)}°C) may affect mango flowering. Protect young trees.`,
//           data: {
//             temperature: current.tempC,
//             alertType: 'cold',
//             severity: 'warning',
//           },
//         });
//       }
//     }
    
//     // Rain alerts
//     if (current.precipMm > 10.0) {
//       if (!await this.wasNotificationRecentlySent(farmId, 'weather_alert_heavy_rain', 3)) {
//         await this.saveNotification({
//           farmId,
//           userId,
//           type: 'weather_alert_heavy_rain',
//           title: '🌧️ Heavy Rain Alert',
//           body: `Heavy rainfall (${current.precipMm}mm) detected. Check drainage systems and skip irrigation.`,
//           data: {
//             rainfall: current.precipMm,
//             alertType: 'heavy_rain',
//             severity: 'info',
//           },
//         });
//       }
//     } else if (current.precipMm > 0) {
//       if (!await this.wasNotificationRecentlySent(farmId, 'weather_alert_light_rain', 3)) {
//         await this.saveNotification({
//           farmId,
//           userId,
//           type: 'weather_alert_light_rain',
//           title: '🌧️ Rain Detected',
//           body: `Rainfall (${current.precipMm}mm) detected. Adjust irrigation accordingly.`,
//           data: {
//             rainfall: current.precipMm,
//             alertType: 'light_rain',
//             severity: 'info',
//           },
//         });
//       }
//     }
    
//     // Humidity alerts
//     if (current.humidity > 80) {
//       if (!await this.wasNotificationRecentlySent(farmId, 'weather_alert_humidity', 6)) {
//         await this.saveNotification({
//           farmId,
//           userId,
//           type: 'weather_alert_humidity',
//           title: '💧 High Humidity Alert',
//           body: `High humidity (${current.humidity}%) increases risk of fungal diseases. Monitor trees closely.`,
//           data: {
//             humidity: current.humidity,
//             alertType: 'humidity',
//             severity: 'warning',
//           },
//         });
//       }
//     }
    
//     // Wind alerts
//     if (current.windKph > 25.0) {
//       if (!await this.wasNotificationRecentlySent(farmId, 'weather_alert_wind', 3)) {
//         await this.saveNotification({
//           farmId,
//           userId,
//           type: 'weather_alert_wind',
//           title: '💨 Strong Wind Alert',
//           body: `Strong winds (${current.windKph} km/h) may cause flower and fruit drop. Secure young trees.`,
//           data: {
//             windSpeed: current.windKph,
//             alertType: 'wind',
//             severity: 'warning',
//           },
//         });
//       }
//     }
    
//     // Ideal conditions
//     if (current.tempC >= 20.0 && current.tempC <= 32.0 && 
//         current.humidity >= 60 && current.humidity <= 80 &&
//         current.precipMm < 5.0) {
//       if (!await this.wasNotificationRecentlySent(farmId, 'weather_ideal', 24)) {
//         await this.saveNotification({
//           farmId,
//           userId,
//           type: 'weather_ideal',
//           title: '✅ Perfect Mango Weather',
//           body: `Ideal conditions for mango growth! Temperature: ${current.tempC.toFixed(1)}°C, Humidity: ${current.humidity}%`,
//           data: {
//             temperature: current.tempC,
//             humidity: current.humidity,
//             alertType: 'ideal_conditions',
//             severity: 'info',
//           },
//         });
//       }
//     }
//   }

//   // 📅 Schedule smart notifications (watering, fertilization, harvest, inspection)
//   async scheduleSmartNotifications(farmId: string): Promise<void> {
//     console.log(`⏰ Running smart notifications for farm ${farmId}`);
    
//     await this.scheduleWateringReminders(farmId);
//     await this.scheduleFertilizationReminders(farmId);
//     await this.scheduleHarvestReminders(farmId);
//     await this.scheduleInspectionReminders(farmId);
    
//     console.log(`✅ Smart notifications completed for farm ${farmId}`);
//   }

//   private async scheduleWateringReminders(farmId: string): Promise<void> {
//     try {
//       const schedules = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('schedules')
//         .where('type', '==', 'watering')
//         .where('completed', '==', false)
//         .get();

//       for (const doc of schedules.docs) {
//         const data = doc.data();
//         const scheduledDate = data.scheduledDate?.toDate();
//         const userId = data.userId || data.createdBy;
        
//         if (!scheduledDate || !userId) continue;

//         const now = new Date();
//         if (scheduledDate > now) {
//           const differenceMs = scheduledDate.getTime() - now.getTime();
//           const differenceHours = differenceMs / (1000 * 60 * 60);
//           const differenceDays = differenceHours / 24;
          
//           // 1 day before reminder
//           if (differenceDays <= 1 && differenceHours <= 24) {
//             const notifType = `schedule_reminder_${doc.id}_1day`;
//             if (!await this.wasNotificationRecentlySent(farmId, notifType, 12)) {
//               await this.saveNotification({
//                 farmId,
//                 userId,
//                 type: notifType,
//                 title: '💧 Watering Reminder - Tomorrow',
//                 body: 'Watering scheduled for tomorrow. Check your tasks.',
//                 data: {
//                   scheduleId: doc.id,
//                   type: 'watering',
//                   scheduledDate: scheduledDate.toISOString(),
//                 },
//               });
//             }
//           }
          
//           // 2 hours before reminder
//           if (differenceHours <= 2) {
//             const notifType = `schedule_reminder_${doc.id}_today`;
//             if (!await this.wasNotificationRecentlySent(farmId, notifType, 6)) {
//               await this.saveNotification({
//                 farmId,
//                 userId,
//                 type: notifType,
//                 title: '💧 Watering Due Today',
//                 body: 'Watering is scheduled for today. Don\'t forget!',
//                 data: {
//                   scheduleId: doc.id,
//                   type: 'watering',
//                   scheduledDate: scheduledDate.toISOString(),
//                 },
//               });
//             }
//           }
//         }
//       }
//     } catch (error) {
//       console.error('❌ Error scheduling watering reminders:', error);
//     }
//   }

//   private async scheduleFertilizationReminders(farmId: string): Promise<void> {
//     try {
//       const schedules = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('schedules')
//         .where('type', '==', 'fertilization')
//         .where('completed', '==', false)
//         .get();

//       for (const doc of schedules.docs) {
//         const data = doc.data();
//         const scheduledDate = data.scheduledDate?.toDate();
//         const userId = data.userId || data.createdBy;
        
//         if (!scheduledDate || !userId) continue;

//         const now = new Date();
//         if (scheduledDate > now) {
//           const differenceMs = scheduledDate.getTime() - now.getTime();
//           const differenceHours = differenceMs / (1000 * 60 * 60);
//           const differenceDays = differenceHours / 24;
          
//           // 1 day before reminder
//           if (differenceDays <= 1 && differenceHours <= 24) {
//             const notifType = `fertilization_reminder_${doc.id}`;
//             if (!await this.wasNotificationRecentlySent(farmId, notifType, 12)) {
//               await this.saveNotification({
//                 farmId,
//                 userId,
//                 type: notifType,
//                 title: '🧪 Fertilization Reminder - Tomorrow',
//                 body: 'Fertilization scheduled for tomorrow.',
//                 data: {
//                   scheduleId: doc.id,
//                   type: 'fertilization',
//                   scheduledDate: scheduledDate.toISOString(),
//                 },
//               });
//             }
//           }
//         }
//       }
//     } catch (error) {
//       console.error('❌ Error scheduling fertilization reminders:', error);
//     }
//   }

//   private async scheduleHarvestReminders(farmId: string): Promise<void> {
//     try {
//       const trees = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('trees')
//         .where('harvestDate', '>', Timestamp.now())
//         .get();

//       for (const doc of trees.docs) {
//         const data = doc.data();
//         const harvestDate = data.harvestDate?.toDate();
//         const treeName = data.name || 'Unknown Tree';
//         const userId = data.userId || data.createdBy;
        
//         if (!harvestDate || !userId) continue;

//         const now = new Date();
//         if (harvestDate > now) {
//           const differenceMs = harvestDate.getTime() - now.getTime();
//           const differenceDays = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
          
//           // 7 days before harvest
//           if (differenceDays <= 7 && differenceDays > 0) {
//             const notifType = `harvest_reminder_${doc.id}_${differenceDays}days`;
//             if (!await this.wasNotificationRecentlySent(farmId, notifType, 24)) {
//               await this.saveNotification({
//                 farmId,
//                 userId,
//                 type: notifType,
//                 title: '🍎 Harvest Approaching',
//                 body: `${treeName} is ready for harvest in ${differenceDays} days`,
//                 data: {
//                   treeId: doc.id,
//                   treeName,
//                   harvestDate: harvestDate.toISOString(),
//                 },
//               });
//             }
//           }
//         }
//       }
//     } catch (error) {
//       console.error('❌ Error scheduling harvest reminders:', error);
//     }
//   }

//   private async scheduleInspectionReminders(farmId: string): Promise<void> {
//     try {
//       // Check if reminder was sent in last 6 days
//       if (await this.wasNotificationRecentlySent(farmId, 'inspection_reminder', 6 * 24)) {
//         return;
//       }
      
//       const lastInspection = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('inspections')
//         .orderBy('timestamp', 'desc')
//         .limit(1)
//         .get();

//       const now = new Date();
      
//       if (lastInspection.empty || 
//           (now.getTime() - lastInspection.docs[0].data().timestamp?.toDate().getTime()) / (1000 * 60 * 60 * 24) >= 7) {
        
//         // Get farm members to send notification to
//         const farmDoc = await this.firestore.collection('farms').doc(farmId).get();
//         const farmData = farmDoc.data();
//         const members = farmData?.members || [];
        
//         for (const memberId of members) {
//           await this.saveNotification({
//             farmId,
//             userId: memberId,
//             type: 'inspection_reminder',
//             title: '🔍 Regular Inspection Due',
//             body: 'It\'s time for your weekly farm inspection',
//             data: { reminderType: 'weekly_inspection' },
//           });
//         }
//       }
//     } catch (error) {
//       console.error('❌ Error scheduling inspection reminders:', error);
//     }
//   }

//   // 📓 Journal notifications
//   async checkForJournalNotifications(farmId: string): Promise<void> {
//     await this.notifyNewJournalEntries(farmId);
//     await this.notifyDiseaseAlerts(farmId);
//     await this.notifyGrowthMilestones(farmId);
//   }

//   private async notifyNewJournalEntries(farmId: string): Promise<void> {
//     try {
//       if (await this.wasNotificationRecentlySent(farmId, 'journal_activity', 20)) {
//         return;
//       }
      
//       const yesterday = new Date();
//       yesterday.setDate(yesterday.getDate() - 1);
      
//       const newEntries = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('journals')
//         .where('timestamp', '>', Timestamp.fromDate(yesterday))
//         .get();

//       if (newEntries.docs.length >= 3) {
//         const uniqueUserIds = [...new Set(newEntries.docs.map(doc => doc.data().userId))];
        
//         for (const userId of uniqueUserIds) {
//           await this.saveNotification({
//             farmId,
//             userId,
//             type: 'journal_activity',
//             title: '📝 Active Journaling',
//             body: `You've added ${newEntries.docs.length} journal entries recently`,
//             data: { entryCount: newEntries.docs.length },
//           });
//         }
//       }
//     } catch (error) {
//       console.error('❌ Error notifying new journal entries:', error);
//     }
//   }

//   private async notifyDiseaseAlerts(farmId: string): Promise<void> {
//     try {
//       if (await this.wasNotificationRecentlySent(farmId, 'disease_alert', 20)) {
//         return;
//       }
      
//       const twoDaysAgo = new Date();
//       twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
//       const recentJournals = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('journals')
//         .where('timestamp', '>', Timestamp.fromDate(twoDaysAgo))
//         .get();

//       let diseaseCount = 0;
//       for (const doc of recentJournals.docs) {
//         const data = doc.data();
//         const healthStatus = (data.healthStatus || '').toLowerCase();
//         if (healthStatus.includes('disease') || healthStatus.includes('pest')) {
//           diseaseCount++;
//         }
//       }

//       if (diseaseCount >= 2) {
//         const uniqueUserIds = [...new Set(recentJournals.docs.map(doc => doc.data().userId))];
        
//         for (const userId of uniqueUserIds) {
//           await this.saveNotification({
//             farmId,
//             userId,
//             type: 'disease_alert',
//             title: '⚠️ Disease Alert',
//             body: 'Multiple disease reports detected. Check your trees.',
//             data: { alertCount: diseaseCount },
//           });
//         }
//       }
//     } catch (error) {
//       console.error('❌ Error notifying disease alerts:', error);
//     }
//   }

//   private async notifyGrowthMilestones(farmId: string): Promise<void> {
//     try {
//       const trees = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('trees')
//         .get();

//       for (const doc of trees.docs) {
//         const data = doc.data();
//         const plantingDate = data.plantingDate?.toDate();
//         const treeName = data.name || 'Unknown Tree';
//         const userId = data.userId || data.createdBy;
        
//         if (plantingDate && userId) {
//           const ageInMonths = Math.floor((new Date().getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
          
//           // 6 months milestone
//           if (ageInMonths === 6) {
//             const notifType = `milestone_${doc.id}_6months`;
//             if (!await this.wasNotificationRecentlySent(farmId, notifType, 30 * 24)) {
//               await this.saveNotification({
//                 farmId,
//                 userId,
//                 type: notifType,
//                 title: '🎉 Growth Milestone',
//                 body: `${treeName} is now 6 months old!`,
//                 data: {
//                   treeId: doc.id,
//                   treeName,
//                   ageInMonths,
//                 },
//               });
//             }
//           }
//           // 1 year milestone
//           else if (ageInMonths === 12) {
//             const notifType = `milestone_${doc.id}_12months`;
//             if (!await this.wasNotificationRecentlySent(farmId, notifType, 30 * 24)) {
//               await this.saveNotification({
//                 farmId,
//                 userId,
//                 type: notifType,
//                 title: '🎉 Growth Milestone',
//                 body: `${treeName} is now 1 year old! 🎉`,
//                 data: {
//                   treeId: doc.id,
//                   treeName,
//                   ageInMonths,
//                 },
//               });
//             }
//           }
//         }
//       }
//     } catch (error) {
//       console.error('❌ Error notifying growth milestones:', error);
//     }
//   }

//   // 🚀 Manual notification triggers (for API endpoints)
//   async notifyScheduleCreated(
//     farmId: string,
//     userId: string,
//     schedule: Record<string, any>
//   ): Promise<void> {
//     await this.saveNotification({
//       farmId,
//       userId,
//       type: 'schedule_created',
//       title: '📅 New Schedule Added',
//       body: `${schedule.type} scheduled for ${schedule.scheduledDate}`,
//       data: schedule,
//     });
//   }

//   async notifyJournalEntryAdded(
//     farmId: string,
//     userId: string,
//     journal: Record<string, any>
//   ): Promise<void> {
//     await this.saveNotification({
//       farmId,
//       userId,
//       type: 'journal_added',
//       title: '📓 New Journal Entry',
//       body: `Journal entry added for ${journal.treeName || 'your farm'}`,
//       data: journal,
//     });
//   }

//   async notifyTaskCompleted(
//     farmId: string,
//     userId: string,
//     taskType: string,
//     details: string
//   ): Promise<void> {
//     await this.saveNotification({
//       farmId,
//       userId,
//       type: 'task_completed',
//       title: '✅ Task Completed',
//       body: `${taskType} completed: ${details}`,
//       data: {
//         taskType,
//         details,
//       },
//     });
//   }

//   // 🧪 Test methods
//   async sendTestNotification(farmId: string, userId: string): Promise<void> {
//     await this.saveNotification({
//       farmId,
//       userId,
//       type: 'test',
//       title: '🔔 Test Notification',
//       body: 'This is a real test from your backend!',
//       data: { test: true, timestamp: new Date().toISOString() },
//     });
//   }

//   async testRealScheduleNotifications(farmId: string, userId: string): Promise<void> {
//     try {
//       const schedules = await this.firestore
//         .collection('farms')
//         .doc(farmId)
//         .collection('schedules')
//         .where('completed', '==', false)
//         .limit(3)
//         .get();

//       for (const doc of schedules.docs) {
//         const schedule = doc.data();
//         await this.saveNotification({
//           farmId,
//           userId,
//           type: 'schedule_reminder',
//           title: `⏰ ${schedule.title || 'Task'}`,
//           body: `Due soon: ${schedule.description || 'Check your schedule'}`,
//           data: {
//             scheduleId: doc.id,
//             test: false,
//           },
//         });
//       }
//       console.log(`✅ Tested ${schedules.docs.length} real schedules`);
//     } catch (error) {
//       console.error('❌ Error testing real schedules:', error);
//     }
//   }

//   // 🩺 Diagnostic methods
//   async comprehensiveDiagnostic(userId: string): Promise<Record<string, any>> {
//     console.log('=== 🔍 NOTIFICATION SERVICE DIAGNOSTIC ===');
    
//     const result: Record<string, any> = {
//       userId,
//       timestamp: new Date().toISOString(),
//     };

//     try {
//       // Check if user exists
//       const userDoc = await this.firestore.collection('users').doc(userId).get();
//       result.userExists = userDoc.exists;
      
//       if (userDoc.exists) {
//         const userData = userDoc.data();
//         result.hasFCMToken = !!userData?.fcmToken;
//         result.fcmToken = userData?.fcmToken ? '***' + userData.fcmToken.slice(-10) : 'Not found';
//       }

//       result.status = 'Diagnostic completed';
//       console.log('✅ Diagnostic completed for user:', userId);
      
//     } catch (error) {
//       console.error('❌ Diagnostic failed:', error);
//       result.status = 'Failed';
//       result.error = error instanceof Error ? error.message : 'Unknown error';
//     }

//     console.log('=== DIAGNOSTIC COMPLETE ===');
//     return result;
//   }

//   async debugFCMStatus(userId: string): Promise<Record<string, any>> {
//     console.log('=== 🔍 FCM DEBUG INFO ===');
    
//     const userDoc = await this.firestore.collection('users').doc(userId).get();
//     const userData = userDoc.data();
//     const fcmToken = userData?.fcmToken;
    
//     const result = {
//       userId,
//       hasToken: !!fcmToken,
//       tokenPreview: fcmToken ? fcmToken.substring(0, 20) + '...' : 'NULL',
//       timestamp: new Date().toISOString(),
//     };
    
//     console.log('📱 FCM Token exists:', result.hasToken);
//     console.log('=== DEBUG COMPLETE ===');
    
//     return result;
//   }
// }

// // Export singleton instance
// export const notificationService = NotificationService.getInstance();
// export default notificationService;