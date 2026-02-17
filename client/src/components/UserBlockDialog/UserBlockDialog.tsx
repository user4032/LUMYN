import React, { useState, useEffect } from 'react';
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
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Block as BlockIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { t } from '../../i18n';
import { blockUser, unblockUser, getBlockedUsers } from '../../api/social';

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  blockedAt: string;
}

interface UserBlockDialogProps {
  open: boolean;
  onClose: () => void;
  token: string;
}

export const UserBlockDialog: React.FC<UserBlockDialogProps> = ({ open, onClose, token }) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockUsername, setBlockUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (open && token) {
      loadBlockedUsers();
    }
  }, [open, token]);

  const loadBlockedUsers = async () => {
    setLoading(true);
    try {
      const response = await getBlockedUsers(token);
      if (response.ok) {
        setBlockedUsers(response.blocked);
      }
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!blockUsername.trim()) return;

    setBlocking(true);
    try {
      // Note: In a real app, you'd need to search for the user first
      // For now, we'll just show this as a placeholder
      await blockUser(token, blockUsername, 'User blocked');
      setBlockUsername('');
      await loadBlockedUsers();
    } catch (error) {
      console.error('Failed to block user:', error);
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(token, userId);
      await loadBlockedUsers();
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('blockedUsers')}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('blockNewUser')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              size="small"
              placeholder={t('username')}
              value={blockUsername}
              onChange={(e) => setBlockUsername(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              color="error"
              onClick={handleBlockUser}
              disabled={blocking || !blockUsername.trim()}
              startIcon={<BlockIcon />}
            >
              {t('block')}
            </Button>
          </Box>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : blockedUsers.length === 0 ? (
          <Typography color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
            {t('noBlockedUsers')}
          </Typography>
        ) : (
          <List sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {blockedUsers.map((user) => (
              <ListItem
                key={user.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleUnblock(user.id)}
                    title={t('unblock')}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar} alt={user.displayName}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.displayName}
                  secondary={`@${user.username}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
