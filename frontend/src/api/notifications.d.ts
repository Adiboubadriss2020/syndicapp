export interface Notification {
  id: number;
  title: string;
  description: string;
  trigger_date: string;
  user_id: number;
  status: 'pending' | 'triggered' | 'read';
  is_read?: boolean;
}

export interface UnreadCount {
  count: number;
}

export function getNotifications(userId: number): Promise<Notification[]>;
export function getUnreadCount(userId: number): Promise<UnreadCount>;
export function createNotification(data: {
  title: string;
  description: string;
  trigger_date: string;
  user_id: number;
}): Promise<Notification>;
export function markAsRead(notificationId: number): Promise<Notification>;
export function markAllAsRead(userId: number): Promise<{ success: boolean }>;
export function deleteNotification(notificationId: number): Promise<{ success: boolean }>;
export function getTriggeredNotifications(userId: number): Promise<Notification[]>;
export function markAsTriggered(notificationId: number): Promise<Notification>; 