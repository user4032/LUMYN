import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Badge,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  Message as MessageIcon,
  PersonAdd as PersonAddIcon,
  Tag as MentionIcon,
  Group as GroupIcon,
  EmojiEmotions as ReactionIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { 
  getNotifications, 
  markNotificationAsRead, 
  deleteNotification,
  markAllNotificationsAsRead,
  deleteAllNotifications,
} from '../../api/social';
import { setNotifications, removeNotification, markAsRead, markAllAsRead } from '../../store/slices/notificationsSlice';
import { t } from '../../i18n';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <MessageIcon fontSize="small" color="primary" />;
    case 'mention':
      return <MentionIcon fontSize="small" color="warning" />;
    case 'friend_request':
      return <PersonAddIcon fontSize="small" color="success" />;
    case 'server_invite':
      return <GroupIcon fontSize="small" color="info" />;
    case 'reaction':
      return <ReactionIcon fontSize="small" color="secondary" />;
    default:
      return <MessageIcon fontSize="small" />;
  }
};

const getNotificationColor = (type: string): any => {
  switch (type) {
    case 'message':
      return 'primary';
    case 'mention':
      return 'warning';
    case 'friend_request':
      return 'success';
    case 'server_invite':
      return 'info';
    case 'reaction':
      return 'secondary';
    default:
      return 'default';
  }
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ open, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { list, unreadCount, total, isLoading } = useSelector((state: RootState) => state.notifications);
  const user = useSelector((state: RootState) => state.user.currentUser);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (open && user?.token) {
      loadNotifications();
    }
  }, [open]);

  const loadNotifications = async () => {
    if (!user?.token) return;
    try {
      const data = await getNotifications(user.token);
      dispatch(setNotifications(data));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.token) return;
    try {
      await markNotificationAsRead(user.token, notificationId);
      dispatch(markAsRead(notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!user?.token) return;
    try {
      await deleteNotification(user.token, notificationId);
      dispatch(removeNotification(notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.token) return;
    try {
      await markAllNotificationsAsRead(user.token);
      dispatch(markAllAsRead(list.length));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!user?.token) return;
    try {
      await deleteAllNotifications(user.token);
      dispatch(setNotifications({ notifications: [], total: 0, unreadCount: 0 }));
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return t('just_now') || 'Now';
    if (minutes < 60) return `${minutes}m ${t('ago') || 'ago'}`;
    if (hours < 24) return `${hours}h ${t('ago') || 'ago'}`;
    if (days < 7) return `${days}d ${t('ago') || 'ago'}`;
    
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">
            {t('notifications') || 'Notifications'}
          </Typography>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error">
              <Box />
            </Badge>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {isLoading && !list.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : list.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {t('no_notifications') || 'No notifications'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {list.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      bgcolor: notification.read ? 'action.hover' : 'action.selected',
                    },
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {!notification.read && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title={t('mark_as_read') || 'Mark as read'}
                        >
                          <DoneAllIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDelete(notification.id)}
                        title={t('delete') || 'Delete'}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          {notification.content}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={notification.type.replace('_', ' ').toUpperCase()}
                            size="small"
                            color={getNotificationColor(notification.type)}
                            variant="outlined"
                          />
                          <Typography variant="caption" color="textSecondary">
                            {formatTime(notification.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{ cursor: 'default' }}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      {list.length > 0 && (
        <>
          <Divider />
          <DialogActions>
            <Button
              size="small"
              onClick={handleDeleteAll}
              disabled={isLoading}
            >
              {t('delete_all') || 'Delete All'}
            </Button>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
                variant="contained"
              >
                {t('mark_all_as_read') || 'Mark All as Read'}
              </Button>
            )}
            <Button onClick={onClose} variant="contained">
              {t('close') || 'Close'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};
