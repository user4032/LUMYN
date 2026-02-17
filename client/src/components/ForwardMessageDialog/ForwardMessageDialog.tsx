import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Checkbox,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { t } from '../../i18n';
import { forwardMessage } from '../../api/social';

interface ForwardMessageDialogProps {
  open: boolean;
  onClose: () => void;
  messageId: string;
  token: string;
}

export const ForwardMessageDialog: React.FC<ForwardMessageDialogProps> = ({
  open,
  onClose,
  messageId,
  token,
}) => {
  const chats = useSelector((state: RootState) => state.chats.chats);
  const servers = useSelector((state: RootState) => state.servers.servers);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForward = async () => {
    if (!selectedChat) return;

    setLoading(true);
    try {
      await forwardMessage(token, messageId, selectedChat);
      setSelectedChat(null);
      setAdditionalMessage('');
      onClose();
    } catch (error) {
      console.error('Failed to forward message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('forward')}</DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Box sx={{ mb: 2, mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder={t('addMessage')}
            value={additionalMessage}
            onChange={(e) => setAdditionalMessage(e.target.value)}
          />
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          {t('selectChat')}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {/* Forward to chats */}
            {chats.map((chat) => (
              <ListItemButton
                key={chat.id}
                selected={selectedChat === chat.id}
                onClick={() => setSelectedChat(chat.id)}
              >
                <ListItemAvatar>
                  <Avatar src={chat.avatar} alt={chat.name}>
                    {chat.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={chat.name} secondary={chat.type} />
                {selectedChat === chat.id && (
                  <Checkbox checked={true} edge="end" />
                )}
              </ListItemButton>
            ))}

            {/* Forward to server channels */}
            {servers.map((server) => (
              <Box key={server.id}>
                <ListItem hidden>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {server.name}
                  </Typography>
                </ListItem>
                {server.channels.map((channel) => (
                  <ListItemButton
                    key={channel.id}
                    selected={selectedChat === channel.id}
                    onClick={() => setSelectedChat(channel.id)}
                    sx={{ pl: 4 }}
                  >
                    <ListItemText
                      primary={`# ${channel.name}`}
                      secondary={server.name}
                    />
                    {selectedChat === channel.id && (
                      <Checkbox checked={true} edge="end" />
                    )}
                  </ListItemButton>
                ))}
              </Box>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button
          onClick={handleForward}
          variant="contained"
          disabled={!selectedChat || loading}
        >
          {t('forward')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
