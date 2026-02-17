import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import { getFriends, sendFriendRequest, respondFriendRequest } from '@/api/social';

interface FriendsDialogProps {
  open: boolean;
  onClose: () => void;
}

const FriendsDialog: React.FC<FriendsDialogProps> = ({ open, onClose }) => {
  const language = useSelector((state: RootState) => state.ui.language);
  const [username, setUsername] = React.useState('');
  const [friends, setFriends] = React.useState<any[]>([]);
  const [incoming, setIncoming] = React.useState<any[]>([]);
  const [outgoing, setOutgoing] = React.useState<any[]>([]);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    const token = localStorage.getItem('disgram_auth_token');
    if (!token) return;

    try {
      const response = await getFriends(token);
      setFriends(response.friends || []);
      setIncoming(response.incoming || []);
      setOutgoing(response.outgoing || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load friends');
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setError('');
      load();
    }
  }, [open, load]);

  const handleSendRequest = async () => {
    const token = localStorage.getItem('disgram_auth_token');
    if (!token || !username.trim()) return;

    try {
      await sendFriendRequest(token, username.trim());
      setUsername('');
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to send request');
    }
  };

  const handleRespond = async (requestId: string, accept: boolean) => {
    const token = localStorage.getItem('disgram_auth_token');
    if (!token) return;

    try {
      await respondFriendRequest(token, requestId, accept);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to respond');
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
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>{t('friends')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('addFriend')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('addFriendUsername')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button variant="contained" onClick={handleSendRequest}>
              {t('sendRequest')}
            </Button>
          </Box>
          {error && (
            <Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
              {error}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('friends')}
        </Typography>
        {friends.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {t('noFriends')}
          </Typography>
        ) : (
          <List dense>
            {friends.map((friend) => (
              <ListItem key={friend.id} divider>
                <ListItemText
                  primary={friend.displayName}
                  secondary={friend.username}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          {t('incomingRequests')}
        </Typography>
        {incoming.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {t('noRequests')}
          </Typography>
        ) : (
          <List dense>
            {incoming.map((req) => (
              <ListItem key={req.id} divider>
                <ListItemText
                  primary={req.user.displayName}
                  secondary={req.user.username}
                />
                <Button size="small" onClick={() => handleRespond(req.id, true)}>
                  {t('accept')}
                </Button>
                <Button size="small" color="inherit" onClick={() => handleRespond(req.id, false)}>
                  {t('decline')}
                </Button>
              </ListItem>
            ))}
          </List>
        )}

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          {t('outgoingRequests')}
        </Typography>
        {outgoing.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('noRequests')}
          </Typography>
        ) : (
          <List dense>
            {outgoing.map((req) => (
              <ListItem key={req.id} divider>
                <ListItemText
                  primary={req.user.displayName}
                  secondary={req.user.username}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FriendsDialog;
