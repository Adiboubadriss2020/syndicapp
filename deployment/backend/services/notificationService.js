const Notification = require('../models/notification');
const { Op } = require('sequelize');

class NotificationService {
  constructor() {
    this.checkInterval = null;
  }

  // Start the notification checking service
  start() {
    console.log('Starting notification service...');
    // Check for triggered notifications every minute
    this.checkInterval = setInterval(() => {
      this.checkTriggeredNotifications();
    }, 60000); // 60 seconds
  }

  // Stop the notification checking service
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Notification service stopped');
    }
  }

  // Check for notifications that should be triggered
  async checkTriggeredNotifications() {
    try {
      const now = new Date();
      
      // Find notifications that should be triggered
      const pendingNotifications = await Notification.findAll({
        where: {
          trigger_date: {
            [Op.lte]: now
          },
          status: 'pending'
        }
      });

      if (pendingNotifications.length > 0) {
        console.log(`Found ${pendingNotifications.length} notifications to trigger`);
        
        // Update status to triggered
        for (const notification of pendingNotifications) {
          await notification.update({ status: 'triggered' });
          console.log(`Triggered notification: ${notification.title}`);
        }
      }
    } catch (error) {
      console.error('Error checking triggered notifications:', error);
    }
  }

  // Manually trigger a notification (for testing)
  async triggerNotification(notificationId) {
    try {
      const notification = await Notification.findByPk(notificationId);
      if (notification && notification.status === 'pending') {
        await notification.update({ status: 'triggered' });
        console.log(`Manually triggered notification: ${notification.title}`);
        return notification;
      }
      return null;
    } catch (error) {
      console.error('Error triggering notification:', error);
      throw error;
    }
  }

  // Get statistics about notifications
  async getNotificationStats(userId) {
    try {
      const stats = await Notification.findAll({
        where: { user_id: userId },
        attributes: [
          'status',
          [Notification.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['status']
      });

      const result = {
        pending: 0,
        triggered: 0,
        read: 0,
        total: 0
      };

      stats.forEach(stat => {
        const status = stat.dataValues.status;
        const count = parseInt(stat.dataValues.count);
        result[status] = count;
        result.total += count;
      });

      return result;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 