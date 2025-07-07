const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Get all notifications for a user
router.get('/user/:user_id', notificationController.getNotifications);

// Get unread notifications count
router.get('/unread/:user_id', notificationController.getUnreadCount);

// Create a new notification
router.post('/', notificationController.createNotification);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read for a user
router.put('/user/:user_id/read-all', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:id', notificationController.deleteNotification);

// Get triggered notifications (for real-time checking)
router.get('/triggered/:user_id', notificationController.getTriggeredNotifications);

// Mark notification as triggered
router.put('/:id/trigger', notificationController.markAsTriggered);

module.exports = router; 