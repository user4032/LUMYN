import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Button,
  Stack,
} from '@mui/material';
import {
  Star as StarIcon,
  StarOutline as StarOutlineIcon,
} from '@mui/icons-material';
import { RootState } from '../../store/store';
import { useSelector, useDispatch } from 'react-redux';
import { t } from '../../i18n';
import { getFavoriteChats } from '../../api/social';

interface FavoriteChatsPanelProps {
  token: string;
  onSelectChat: (chatId: string) => void;
}

export const FavoriteChatPanel: React.FC<FavoriteChatsPanelProps> = ({
  token,
  onSelectChat,
}) => {
  const chats = useSelector((state: RootState) => state.chats.chats);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadFavorites();
    }
  }, [token]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await getFavoriteChats(token);
      if (response.ok) {
        setFavoriteIds(response.favorites);
      }
    } catch (error) {
      console.error('Failed to load favorite chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const favChats = chats.filter((chat) => favoriteIds.includes(chat.id));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (favChats.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <StarOutlineIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography color="textSecondary">{t('noFavorites')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, px: 2 }}>
        ⭐ {t('favorites')}
      </Typography>
      <List disablePadding>
        {favChats.map((chat) => (
          <ListItemButton
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            sx={{
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar src={chat.avatar} alt={chat.name} sx={{ width: 32, height: 32 }}>
                {chat.name.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={chat.name}
              secondary={
                chat.unreadCount > 0 && (
                  <Chip
                    label={chat.unreadCount}
                    size="small"
                    color="primary"
                    variant="filled"
                  />
                )
              }
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};
