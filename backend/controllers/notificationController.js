const Notification = require('../models/notification');
const { Op } = require('sequelize');

// Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { user_id } = req.params;
    const notifications = await Notification.findAll({
      where: { user_id: parseInt(user_id) },
      order: [['created_at', 'DESC']]
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const { user_id } = req.params;
    const now = new Date();
    
    const count = await Notification.count({
      where: { 
        user_id: parseInt(user_id),
        is_read: false,
        trigger_date: {
          [Op.lte]: new Date(now.getTime() + 60000), // Within 1 minute of trigger time
          [Op.gt]: now // Not triggered yet
        }
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { title, description, trigger_date, user_id } = req.body;
    
    const notification = await Notification.create({
      title,
      description,
      trigger_date: new Date(trigger_date),
      user_id: parseInt(user_id),
      status: 'pending'
    });
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    await notification.update({ 
      is_read: true,
      status: 'read'
    });
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    await Notification.update(
      { is_read: true, status: 'read' },
      { 
        where: { 
          user_id: parseInt(user_id),
          is_read: false 
        } 
      }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    await notification.destroy();
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get triggered notifications (for real-time checking)
const getTriggeredNotifications = async (req, res) => {
  try {
    const { user_id } = req.params;
    const now = new Date();
    
    const triggeredNotifications = await Notification.findAll({
      where: {
        user_id: parseInt(user_id),
        trigger_date: {
          [Op.lte]: now
        },
        status: 'pending'
      },
      order: [['trigger_date', 'ASC']]
    });
    
    res.json(triggeredNotifications);
  } catch (error) {
    console.error('Error fetching triggered notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update notification status to triggered
const markAsTriggered = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    await notification.update({ status: 'triggered' });
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as triggered:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getTriggeredNotifications,
  markAsTriggered
}; 