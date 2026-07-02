// src/types/notification.types.ts
// (replace your existing file with this – only addition is `scanId` in metadata)

export type NotificationType =
  | 'disease_alert'
  | 'task_reminder'
  | 'verification_update'
  | 'trade_listing'
  | 'market_price'
  | 'system'
  | 'mention';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  readAt?: Date;
  isRead: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    farmId?: string;
    treeId?: string;
    scanId?: string;   // ← new: links notification back to the scan doc
    userId?: string;
    postId?: string;
  };
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  priority?: NotificationPriority;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
}