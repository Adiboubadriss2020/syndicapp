import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton as MuiIconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '../api/notifications';

const NotificationDropdown = ({ userId }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      const [notificationsData, unreadData] = await Promise.all([
        getNotifications(userId),
        getUnreadCount(userId)
      ]);
      setNotifications(notificationsData);
      setUnreadCount(unreadData.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const unreadData = await getUnreadCount(userId);
      setUnreadCount(unreadData.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(userId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'triggered':
        return 'info';
      case 'read':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'triggered':
        return 'Déclenché';
      case 'read':
        return 'Lu';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if notification is within 1 minute of trigger time
  const isNotificationActive = (notification) => {
    const now = new Date();
    const triggerTime = new Date(notification.trigger_date);
    const oneMinuteBeforeTrigger = new Date(triggerTime.getTime() - 60000); // 1 minute before trigger
    
    return now >= oneMinuteBeforeTrigger && now < triggerTime;
  };

  // Filter notifications by status for better organization
  const pendingNotifications = notifications.filter(n => n.status === 'pending' && !isNotificationActive(n));
  const activeNotifications = notifications.filter(n => n.status === 'pending' && isNotificationActive(n));
  const triggeredNotifications = notifications.filter(n => n.status === 'triggered');
  const readNotifications = notifications.filter(n => n.status === 'read');

  // Set up polling for real-time updates
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for unread count every 30 seconds
    intervalRef.current = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          '&:hover': {
            background: 'rgba(255,255,255,0.2)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.3s ease'
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            <Box>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllAsRead}
                  sx={{ mr: 1 }}
                >
                  Tout marquer comme lu
                </Button>
              )}
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {refreshing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Aucune notification
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {activeNotifications.length > 0 && (
                <>
                  <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      ⚠️ Actif ({activeNotifications.length})
                    </Typography>
                  </Box>
                  {activeNotifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        sx={{
                          backgroundColor: 'rgba(255,193,7,0.1)',
                          borderLeft: '4px solid #ffc107',
                          '&:hover': {
                            backgroundColor: 'rgba(255,193,7,0.15)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  color: 'text.primary'
                                }}
                              >
                                {notification.title}
                              </Typography>
                              <Chip
                                label="Bientôt déclenché"
                                color="warning"
                                size="small"
                                variant="filled"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {notification.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScheduleIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                                  Déclenchement dans moins d'1 minute
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Supprimer">
                              <MuiIconButton
                                size="small"
                                onClick={() => handleDeleteNotification(notification.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </MuiIconButton>
                            </Tooltip>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </>
              )}

              {pendingNotifications.length > 0 && (
                <>
                  <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      En attente ({pendingNotifications.length})
                    </Typography>
                  </Box>
                  {pendingNotifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        sx={{
                          backgroundColor: notification.is_read ? 'transparent' : 'rgba(102,126,234,0.05)',
                          '&:hover': {
                            backgroundColor: 'rgba(102,126,234,0.1)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: notification.is_read ? 400 : 600,
                                  color: notification.is_read ? 'text.secondary' : 'text.primary'
                                }}
                              >
                                {notification.title}
                              </Typography>
                              <Chip
                                label={getStatusText(notification.status)}
                                color={getStatusColor(notification.status)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {notification.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScheduleIcon sx={{ fontSize: 14 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(notification.trigger_date)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {!notification.is_read && (
                              <Tooltip title="Marquer comme lu">
                                <MuiIconButton
                                  size="small"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </MuiIconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Supprimer">
                              <MuiIconButton
                                size="small"
                                onClick={() => handleDeleteNotification(notification.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </MuiIconButton>
                            </Tooltip>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </>
              )}

              {triggeredNotifications.length > 0 && (
                <>
                  <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Déclenchés ({triggeredNotifications.length})
                    </Typography>
                  </Box>
                  {triggeredNotifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        sx={{
                          backgroundColor: notification.is_read ? 'transparent' : 'rgba(102,126,234,0.05)',
                          '&:hover': {
                            backgroundColor: 'rgba(102,126,234,0.1)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: notification.is_read ? 400 : 600,
                                  color: notification.is_read ? 'text.secondary' : 'text.primary'
                                }}
                              >
                                {notification.title}
                              </Typography>
                              <Chip
                                label={getStatusText(notification.status)}
                                color={getStatusColor(notification.status)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {notification.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScheduleIcon sx={{ fontSize: 14 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(notification.trigger_date)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {!notification.is_read && (
                              <Tooltip title="Marquer comme lu">
                                <MuiIconButton
                                  size="small"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </MuiIconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Supprimer">
                              <MuiIconButton
                                size="small"
                                onClick={() => handleDeleteNotification(notification.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </MuiIconButton>
                            </Tooltip>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </>
              )}

              {readNotifications.length > 0 && (
                <>
                  <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Lu ({readNotifications.length})
                    </Typography>
                  </Box>
                  {readNotifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        sx={{
                          backgroundColor: notification.is_read ? 'transparent' : 'rgba(102,126,234,0.05)',
                          '&:hover': {
                            backgroundColor: 'rgba(102,126,234,0.1)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: notification.is_read ? 400 : 600,
                                  color: notification.is_read ? 'text.secondary' : 'text.primary'
                                }}
                              >
                                {notification.title}
                              </Typography>
                              <Chip
                                label={getStatusText(notification.status)}
                                color={getStatusColor(notification.status)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {notification.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScheduleIcon sx={{ fontSize: 14 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(notification.trigger_date)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {!notification.is_read && (
                              <Tooltip title="Marquer comme lu">
                                <MuiIconButton
                                  size="small"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </MuiIconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Supprimer">
                              <MuiIconButton
                                size="small"
                                onClick={() => handleDeleteNotification(notification.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </MuiIconButton>
                            </Tooltip>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </>
              )}
            </List>
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NotificationDropdown; 