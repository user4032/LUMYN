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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import { searchUsers, AuthUser } from '@/api/auth';
import { addChat } from '@store/slices/chatsSlice';

interface UserSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onUserSelect?: (userId: string) => void;
}

const UserSearchDialog: React.FC<UserSearchDialogProps> = ({ open, onClose, onUserSelect }) => {
  const dispatch = useDispatch();
  const language = useSelector((state: RootState) => state.ui.language);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<AuthUser[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState('');

  // Debounce пошуку
  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setError('');
      return;
    }

    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const token = localStorage.getItem('disgram_auth_token');
      if (!token) return;

      setIsSearching(true);
      setError('');

      try {
        const response = await searchUsers(token, query);
        setResults(response.users || []);
      } catch (err: any) {
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Затримка 300мс

    return () => clearTimeout(timer);
  }, [query, open]);

  const handleUserClick = (user: AuthUser) => {
    // Перевірка чи це не сам користувач
    if (currentUser && user.id === currentUser.id) {
      setError(t('cannotChatWithYourself'));
      return;
    }
    
    // Додаємо чат з цим користувачем
    dispatch(addChat({
      id: user.id,
      name: user.displayName || user.username,
      avatar: user.avatar,
      type: 'private',
      unreadCount: 0,
      status: (user.status === 'online' || user.status === 'offline') ? user.status : 'offline',
    }));
    
    // Викликаємо callback для вибору чату (якщо передано)
    if (onUserSelect) {
      onUserSelect(user.id);
    }
    
    onClose();
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
          minHeight: '500px',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        {t('searchUsers')}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: isSearching ? (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null,
          }}
          sx={{ mb: 2 }}
        />

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {query.length < 2 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {t('searchHint')}
            </Typography>
          </Box>
        ) : results.length === 0 && !isSearching ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {t('noUsersFound')}
            </Typography>
          </Box>
        ) : (
          <List>
            {results.map((user) => (
              <ListItem
                key={user.id}
                button
                onClick={() => handleUserClick(user)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar} sx={{ bgcolor: 'primary.main' }}>
                    {user.displayName?.[0] || user.username[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight={500}>
                      {user.displayName || user.username}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        @{user.username}
                      </Typography>
                      {user.bio && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {user.bio}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                {user.status && (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: user.status === 'online' ? '#3ba55d' :
                               user.status === 'idle' ? '#faa81a' :
                               user.status === 'dnd' ? '#ed4245' : '#747f8d',
                    }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSearchDialog;
