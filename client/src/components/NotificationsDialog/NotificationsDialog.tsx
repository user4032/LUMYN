import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';

interface NotificationsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'message' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  avatar?: string;
}

const READ_STORAGE_KEY = 'disgram_notifications_read';

const loadReadMap = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const NotificationsDialog: React.FC<NotificationsDialogProps> = ({ open, onClose }) => {
  const language = useSelector((state: RootState) => state.ui.language);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const chats = useSelector((state: RootState) => state.chats.chats);
  const messagesByChat = useSelector((state: RootState) => state.chats.messages);
  const [readMap, setReadMap] = React.useState<Record<string, boolean>>(() => loadReadMap());

  React.useEffect(() => {
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(readMap));
    } catch (e) {
      // Ignore storage failures
    }
  }, [readMap]);

  const notifications = React.useMemo(() => {
    if (!currentUser) return [] as Notification[];
    const items: Notification[] = [];

    chats.forEach((chat) => {
      const messages = messagesByChat[chat.id] || [];
      messages.forEach((message) => {
        if (message.userId === currentUser.id || message.userId === 'me') return;
        const hasContent = !!message.content?.trim();
        const hasAttachments = !!(message.attachments && message.attachments.length > 0);
        const fallbackText = hasAttachments
          ? t('photo')
          : t('notifSentMessage');

        items.push({
          id: message.id,
          type: 'message',
          title: message.userName || chat.name,
          message: hasContent ? message.content : fallbackText,
          timestamp: message.timestamp,
          read: !!readMap[message.id],
          avatar: message.userAvatar || chat.avatar,
        });
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }, [chats, currentUser, language, messagesByChat, readMap]);

  const handleMarkAsRead = (id: string) => {
    setReadMap((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <ChatIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle 
        sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">{t('notificationsLabel')}</Typography>
          {unreadCount > 0 && (
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: 'error.main',
              }}
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {t('noNotifications')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notif, index) => (
              <React.Fragment key={notif.id}>
                <ListItem
                  onClick={() => handleMarkAsRead(notif.id)}
                  sx={{
                    bgcolor: notif.read ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={notif.avatar} sx={{ bgcolor: notif.read ? 'grey.500' : 'primary.main' }}>
                      {!notif.avatar && getIcon(notif.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1" 
                        sx={{ fontWeight: notif.read ? 400 : 600 }}
                      >
                        {notif.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: language === 'en' ? enUS : uk })}
                        </Typography>
                      </Box>
                    }
                  />
                  {!notif.read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                      }}
                    />
                  )}
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsDialog;
