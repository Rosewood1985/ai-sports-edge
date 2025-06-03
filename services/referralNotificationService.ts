import { auth } from '../config/firebase';
import { BadgeType } from '../types/rewards';

export interface ReferralNotification {
  id: string;
  type: 'milestone' | 'referral' | 'subscription_extension' | 'badge';
  title: string;
  message: string;
  badgeType?: BadgeType;
  rewardAmount?: number;
  rewardType?: string;
  read: boolean;
  createdAt: string;
}

class ReferralNotificationService {
  private notificationsCache: ReferralNotification[] = [];
  private hasLoadedNotifications = false;

  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<ReferralNotification[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return [];
      }

      // In a real app, this would fetch from Firestore
      // For now, we'll use the cache or generate mock data
      if (this.hasLoadedNotifications) {
        return this.notificationsCache;
      }

      // Generate mock notifications
      const mockNotifications: ReferralNotification[] = [
        {
          id: '1',
          type: 'referral',
          title: 'New Referral!',
          message: 'Your friend John has joined using your referral code.',
          read: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
        {
          id: '2',
          type: 'milestone',
          title: 'Milestone Reached!',
          message: "You've reached 5 referrals and earned a premium trial.",
          rewardAmount: 2,
          rewardType: 'months',
          read: false,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        },
        {
          id: '3',
          type: 'subscription_extension',
          title: 'Subscription Extended',
          message: 'Your subscription has been extended by 1 month as a reward for your referral.',
          rewardAmount: 1,
          rewardType: 'month',
          read: true,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        },
        {
          id: '4',
          type: 'badge',
          title: 'New Badge Earned',
          message: "You've earned the Elite Referrer badge for your referral achievements.",
          badgeType: 'elite',
          read: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        },
      ];

      this.notificationsCache = mockNotifications;
      this.hasLoadedNotifications = true;

      return mockNotifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return false;
      }

      // In a real app, this would update Firestore
      // For now, we'll update the cache
      const notification = this.notificationsCache.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return false;
      }

      // In a real app, this would update Firestore
      // For now, we'll update the cache
      this.notificationsCache.forEach(notification => {
        notification.read = true;
      });

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Add a new notification
   * In a real app, this would be called by a Firebase function
   */
  async addNotification(
    notification: Omit<ReferralNotification, 'id' | 'createdAt'>
  ): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return false;
      }

      // In a real app, this would add to Firestore
      // For now, we'll add to the cache
      const newNotification: ReferralNotification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      this.notificationsCache.unshift(newNotification);

      return true;
    } catch (error) {
      console.error('Error adding notification:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return false;
      }

      // In a real app, this would delete from Firestore
      // For now, we'll remove from the cache
      const index = this.notificationsCache.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        this.notificationsCache.splice(index, 1);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return false;
      }

      // In a real app, this would delete from Firestore
      // For now, we'll clear the cache
      this.notificationsCache = [];

      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }
}

export const referralNotificationService = new ReferralNotificationService();
