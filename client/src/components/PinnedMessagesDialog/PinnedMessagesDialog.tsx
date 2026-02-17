import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  PushPin as UnpinIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import { getPinnedMessages, unpinMessage } from '@/api/social';

interface PinnedMessagesDialogProps {
  open: boolean;
  onClose: () => void;
  chatId: string | null;
  onSelectMessage?: (messageId: string) => void;
}

const PinnedMessagesDialog: React.FC<PinnedMessagesDialogProps> = ({
  open,
  onClose,
  chatId,
  onSelectMessage,
}) => {
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const language = useSelector((state: RootState) => state.ui.language);
  
  const token = localStorage.getItem('disgram_auth_token');

  useEffect(() => {
    if (open && chatId) {
      loadPinnedMessages();
    }
  }, [open, chatId]);

  const loadPinnedMessages = async () => {
    if (!token || !chatId) return;
    
    setLoading(true);
    try {
      const response = await getPinnedMessages(token, chatId);
      if (response.ok) {
        setPinnedMessages(response.messages);
      }
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (messageId: string) => {
    if (!token) return;
    
    try {
      const response = await unpinMessage(token, messageId);
      if (response.ok) {
        setPinnedMessages(pinnedMessages.filter(m => m.id !== messageId));
      }
    } catch (error) {
      console.error('Failed to unpin message:', error);
    }
  };

  const locale = language === 'uk' ? uk : enUS;

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
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">📌 {t('pinnedMessages')}</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : pinnedMessages.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('noPinnedMessages')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {pinnedMessages.map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  mb: 1,
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  cursor: onSelectMessage ? 'pointer' : 'default',
                  '&:hover': onSelectMessage ? { bgcolor: 'action.selected' } : {},
                }}
                onClick={() => onSelectMessage && onSelectMessage(message.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                  <Avatar
                    src={message.senderAvatar}
                    sx={{ width: 32, height: 32, mr: 1 }}
                  >
                    {message.senderDisplayName?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {message.senderDisplayName || message.senderUsername}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(message.createdAt), 'PPp', { locale })}
                    </Typography>
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnpin(message.id);
                      }}
                      title={t('unpin')}
                    >
                      <UnpinIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    width: '100%',
                  }}
                >
                  {message.content}
                </Typography>
                {message.pinnedBy && (
                  <Chip
                    size="small"
                    label={`${t('pinnedBy')} ${message.pinnedBy.displayName || message.pinnedBy.username}`}
                    sx={{ mt: 1 }}
                    variant="outlined"
                  />
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PinnedMessagesDialog;
